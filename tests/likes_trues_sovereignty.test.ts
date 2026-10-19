import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('👑 MIRA GOLD: VERIFICAÇÃO ESTATUTÁRIA DA MIGRATION E SOBERANIA DE IDENTIDADE', () => {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261018235500_fix_rpc_auth_uid_sovereignty.sql');
  const patch2Path = path.resolve(process.cwd(), 'supabase/migrations/20260825000000_patch2_follow_sovereignty.sql');

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  const patch2Sql = fs.readFileSync(patch2Path, 'utf8');

  test('T-SQL-01: A migration existe e contém as duas funções RPC corretas', () => {
    assert.ok(fs.existsSync(migrationPath), 'Ficheiro de migration deve existir');
    assert.ok(migrationSql.includes('FUNCTION public.get_sovereign_community_feed_v25'), 'Deve conter get_sovereign_community_feed_v25');
    assert.ok(migrationSql.includes('FUNCTION public.get_sovereign_community_post_by_id_v25'), 'Deve conter get_sovereign_community_post_by_id_v25');
  });

  test('T-SQL-02: v_auth_uid := auth.uid() é mantido e p_user_id não é usado na personalização', () => {
    // Ambas as funções declaram v_auth_uid := auth.uid()
    const authUidMatches = migrationSql.match(/v_auth_uid\s+UUID\s*:=\s*auth\.uid\(\);/g);
    assert.strictEqual(authUidMatches?.length, 2, 'Ambas as funções devem declarar v_auth_uid := auth.uid()');

    // Não deve existir COALESCE(p_user_id, auth.uid())
    assert.ok(!migrationSql.includes('COALESCE(p_user_id'), 'COALESCE(p_user_id, ...) não deve ser utilizado');

    // p_user_id só pode aparecer na assinatura dos parâmetros, nunca no WHERE de post_votes ou saved_posts
    const subqueriesBlock = migrationSql.match(/EXISTS\s*\(\s*SELECT 1 FROM public\.post_votes[\s\S]+?user_vote/g);
    assert.ok(subqueriesBlock && subqueriesBlock.length === 2, 'Devem existir 2 blocos de subqueries de personalização');
    for (const block of subqueriesBlock) {
      assert.ok(!block.includes('p_user_id'), 'p_user_id não deve ser referenciado nas subqueries de personalização');
      assert.ok(block.includes('v_auth_uid'), 'Subqueries devem comparar exclusivamente com v_auth_uid');
    }
  });

  test('T-SQL-03: Condição redundante v_auth_uid IS NOT NULL removida das subqueries', () => {
    // Remover comentários de linha antes de testar o código SQL ativo
    const codeWithoutComments = migrationSql.replace(/--.*$/gm, '');
    assert.ok(
      !codeWithoutComments.includes('v_auth_uid IS NOT NULL'),
      'v_auth_uid IS NOT NULL deve ser removido das subqueries de personalização no código SQL ativo'
    );

    // Comparação direta v.user_id = v_auth_uid preservada
    const likeConditionFeed = migrationSql.includes("WHERE v.post_id = p.id AND v.user_id = v_auth_uid AND v.vote_type = 'like'");
    assert.ok(likeConditionFeed, 'Condição de like deve comparar v.user_id = v_auth_uid');

    const savedConditionFeed = migrationSql.includes("WHERE s.post_id = p.id AND s.user_id = v_auth_uid");
    assert.ok(savedConditionFeed, 'Condição de saved deve comparar s.user_id = v_auth_uid');

    const voteConditionFeed = migrationSql.includes("WHERE v.post_id = p.id AND v.user_id = v_auth_uid AND v.vote_type IN ('useful', 'fake', 'true')");
    assert.ok(voteConditionFeed, 'Condição de vote deve comparar v.user_id = v_auth_uid');
  });

  test('T-SQL-04: Assinaturas, tipos de retorno e privilégios preservados sem DROP FUNCTION destrutivo', () => {
    // Não deve conter DROP FUNCTION
    assert.ok(!migrationSql.includes('DROP FUNCTION'), 'Não deve conter DROP FUNCTION destrutivo');

    // Deve conter GRANT EXECUTE para anon, authenticated, service_role
    const grantMatches = migrationSql.match(/GRANT EXECUTE ON FUNCTION[\s\S]+?TO anon, authenticated, service_role;/g);
    assert.strictEqual(grantMatches?.length, 2, 'Ambas as funções devem conceder permissões a anon, authenticated, service_role');

    // Deve conter REVOKE ALL FROM PUBLIC
    const revokeMatches = migrationSql.match(/REVOKE ALL ON FUNCTION[\s\S]+?FROM PUBLIC;/g);
    assert.strictEqual(revokeMatches?.length, 2, 'Ambas as funções devem revogar permissões de PUBLIC');
  });

  test('T-SQL-05: Lógica SQL garante isolamento de utilizador anónimo vs autenticado', () => {
    // Quando v_auth_uid é NULL (sessão anónima):
    // Na semântica SQL: NULL = NULL é UNKNOWN, coluna = NULL é UNKNOWN (nunca TRUE).
    // Portanto EXISTS (SELECT 1 WHERE user_id = NULL) avalia para FALSE.
    // user_vote (SELECT vote_type WHERE user_id = NULL) avalia para NULL.
    // Nenhum dado pessoal é exposto a clientes anónimos ou com p_user_id alheio.
    const hasExplicitAuthUidCheck = migrationSql.includes('v.user_id = v_auth_uid');
    assert.ok(hasExplicitAuthUidCheck, 'user_id é comparado estritamente com v_auth_uid');
  });
});

describe('🛡️ MIRA GOLD: PRESERVAÇÃO DO FIX FRONTEND (COMMIT 632ace93)', () => {
  const communityViewPath = path.resolve(process.cwd(), 'src/components/CommunityView.tsx');
  const communityViewCode = fs.readFileSync(communityViewPath, 'utf8');

  test('T-FE-01: CommunityView reconcilia likedPosts e userVotes sem sobredeterminar com false', () => {
    assert.ok(communityViewCode.includes('likedPosts.has(p.id) || !!p.isLikedByUser'), 'Deve manter fallback para likedPosts local ou RPC');
    assert.ok(communityViewCode.includes('userVotes[p.id] || p.userVote || undefined'), 'Deve manter fallback para userVotes local ou RPC');
  });

  test('T-FE-02: Prioridade soberana de ações pendentes preservada', () => {
    assert.ok(communityViewCode.includes('hasPendingLike'), 'Deve verificar ações pendentes de like');
    assert.ok(communityViewCode.includes('hasPendingVote'), 'Deve verificar ações pendentes de vote');
  });
});
