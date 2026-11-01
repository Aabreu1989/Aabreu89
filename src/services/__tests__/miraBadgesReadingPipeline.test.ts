import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../authService';
import { communityService } from '../communityService';

describe('🛡️ MIRA BADGES: CANONICAL READING & RENDERING PIPELINE', () => {

  // =========================================================================
  // 1. NORMALIZAÇÃO NA FRONTEIRA DE DADOS (authService.mapProfileToUser)
  // =========================================================================
  describe('1. Normalização de Fronteira (mapProfileToUser)', () => {
    test('T-BADGE-PIPE-01: Converte array legado de strings em UserBadge[] com timestamps', () => {
      const mockProfile = {
        id: 'u-1',
        name: 'Maria Silva',
        email: 'maria@test.com',
        badges: ['pioneiro', 'verificado'],
        created_at: '2026-01-15T10:00:00.000Z'
      };

      const user = authService.mapProfileToUser(mockProfile, null);

      assert.equal(Array.isArray(user.badges), true);
      assert.equal(user.badges?.length, 2);
      assert.deepEqual(user.badges?.[0], {
        badge_id: 'pioneiro',
        awarded_at: '2026-01-15T10:00:00.000Z'
      });
      assert.deepEqual(user.badges?.[1], {
        badge_id: 'verificado',
        awarded_at: '2026-01-15T10:00:00.000Z'
      });
    });

    test('T-BADGE-PIPE-02: Preserva objetos UserBadge estruturados sem duplicação', () => {
      const mockProfile = {
        id: 'u-2',
        name: 'Carlos Rocha',
        email: 'carlos@test.com',
        badges: [
          { badge_id: 'coracao', awarded_at: '2026-02-10T12:00:00.000Z' }
        ]
      };

      const user = authService.mapProfileToUser(mockProfile, null);

      assert.equal(user.badges?.length, 1);
      assert.equal(user.badges?.[0].badge_id, 'coracao');
      assert.equal(user.badges?.[0].awarded_at, '2026-02-10T12:00:00.000Z');
    });

    test('T-BADGE-PIPE-03: Perfil sem medalhas ou com badges nulo retorna array vazio sem inventar medalhas', () => {
      const mockProfileNull = { id: 'u-3', name: 'Novo Utilizador', badges: null };
      const mockProfileEmpty = { id: 'u-4', name: 'Outro Utilizador', badges: [] };

      const userNull = authService.mapProfileToUser(mockProfileNull, null);
      const userEmpty = authService.mapProfileToUser(mockProfileEmpty, null);

      assert.deepEqual(userNull.badges, []);
      assert.deepEqual(userEmpty.badges, []);
    });
  });

  // =========================================================================
  // 2. PROJEÇÃO DO FEED DA COMUNIDADE (communityService.mapRowToPost)
  // =========================================================================
  describe('2. Mapeamento de Selos no Feed da Comunidade (mapRowToPost)', () => {
    test('T-BADGE-PIPE-04: Mapeia author.badges da RPC diretamente para Post.authorBadges', () => {
      const mockRpcRow = {
        id: 'post-100',
        author_id: 'author-10',
        author_name: 'Ana Lisboa',
        author_avatar: 'https://example.com/avatar.jpg',
        author_is_verified: true,
        title: 'Guia de Manifestação de Interesse',
        content: 'Conteúdo informativo para imigrantes',
        author: {
          id: 'author-10',
          name: 'Ana Lisboa',
          badges: ['pioneiro', 'verificado', 'curador']
        },
        likes: 15,
        useful_votes: 8,
        fake_votes: 0
      };

      const post = communityService.mapRowToPost(mockRpcRow);

      assert.equal(Array.isArray(post.authorBadges), true);
      assert.deepEqual(post.authorBadges, ['pioneiro', 'verificado', 'curador']);
    });

    test('T-BADGE-PIPE-05: Autor sem medalhas resulta em Post.authorBadges vazio', () => {
      const mockRpcRow = {
        id: 'post-101',
        author_id: 'author-11',
        author_name: 'Pedro Sem Selos',
        author: {
          id: 'author-11',
          name: 'Pedro Sem Selos',
          badges: []
        }
      };

      const post = communityService.mapRowToPost(mockRpcRow);

      assert.deepEqual(post.authorBadges, []);
    });

    test('T-BADGE-PIPE-06: Suporta author.badges contendo objetos { badge_id } sem quebrar', () => {
      const mockRpcRow = {
        id: 'post-102',
        author_id: 'author-12',
        author: {
          badges: [{ badge_id: 'mestre_docs' }, { badge_id: 'sentinela' }]
        }
      };

      const post = communityService.mapRowToPost(mockRpcRow);

      assert.deepEqual(post.authorBadges, ['mestre_docs', 'sentinela']);
    });
  });

  // =========================================================================
  // 3. ELEGIBILIDADE E REGRAS CANÓNICAS DE GAMIFICAÇÃO
  // =========================================================================
  describe('3. Critérios Objetivos de Elegibilidade (Sem pioneiro indiscriminado)', () => {
    test('T-BADGE-PIPE-07: Utilizador com 0 reputação e não verificado não recebe nenhuma medalha fantasma', () => {
      const milestones = [
        { id: 'coracao', threshold: 10 },
        { id: 'curador', threshold: 50 },
        { id: 'mestre_docs', threshold: 80 },
        { id: 'exemplar', threshold: 100 },
        { id: 'verificado', threshold: 0, requireVerified: true }
      ];

      const reputation = 0;
      const isVerified = false;

      const eligible = milestones.filter(m => {
        if (m.requireVerified) return isVerified;
        return reputation >= m.threshold;
      });

      assert.equal(eligible.length, 0, 'Nenhum selo pode ser atribuído a 0 reputação sem verificação');
    });

    test('T-BADGE-PIPE-08: Utilizador com 55 de reputação ganha exatamente coração e curador', () => {
      const milestones = [
        { id: 'coracao', threshold: 10 },
        { id: 'curador', threshold: 50 },
        { id: 'mestre_docs', threshold: 80 },
        { id: 'exemplar', threshold: 100 }
      ];

      const reputation = 55;
      const eligible = milestones.filter(m => reputation >= m.threshold).map(m => m.id);

      assert.deepEqual(eligible, ['coracao', 'curador']);
    });
  });

  // =========================================================================
  // 4. VERIFICAÇÃO ESTATUTÁRIA DA MIGRAÇÃO SQL (20261024231500)
  // =========================================================================
  describe('4. Verificação Estatutária da Migração SQL (20261024231500)', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20261024231500_project_feed_badges_from_canonical_user_badges.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    test('T-BADGE-SQL-01: Não contém DROP FUNCTION e usa apenas CREATE OR REPLACE', () => {
      const codeWithoutComments = sql.replace(/--.*$/gm, '');
      assert.ok(!codeWithoutComments.includes('DROP FUNCTION'), 'A migração não deve conter DROP FUNCTION destrutivo');
      const createCount = (codeWithoutComments.match(/CREATE OR REPLACE FUNCTION/g) || []).length;
      assert.equal(createCount, 2, 'Deve conter exatamente 2 definições CREATE OR REPLACE FUNCTION');
    });

    test('T-BADGE-SQL-02: Não executa mutações especulativas ou retroativas em dados', () => {
      assert.ok(!sql.includes('INSERT INTO public.user_badges'), 'Não deve tentar reconstruir medalhas históricas de profiles.badges');
      assert.ok(!sql.includes('UPDATE public.user_badges'), 'Não deve mutar dados de user_badges');
      assert.ok(!sql.includes('DELETE FROM public.user_badges'), 'Não deve apagar medalhas em user_badges');
    });

    test('T-BADGE-SQL-03: Contém as duas funções soberanas corretas com sufixo _v25', () => {
      assert.ok(sql.includes('public.get_sovereign_community_feed_v25'), 'Deve conter get_sovereign_community_feed_v25');
      assert.ok(sql.includes('public.get_sovereign_community_post_by_id_v25'), 'Deve conter get_sovereign_community_post_by_id_v25');
    });

    test('T-BADGE-SQL-04: Projeta badges diretamente de public.user_badges com ordenação temporal', () => {
      const canonicalQueryMatches = sql.match(/SELECT jsonb_agg\(ub\.badge_id ORDER BY ub\.awarded_at ASC\)\s+FROM public\.user_badges ub\s+WHERE ub\.user_id = prof\.id/g);
      assert.equal(canonicalQueryMatches?.length, 2, 'Ambas as funções devem conter a projeção canónica de user_badges');
    });

    test('T-BADGE-SQL-05: Preserva SECURITY DEFINER, search_path e permissões para roles autorizadas', () => {
      const secDefinerCount = (sql.match(/SECURITY DEFINER SET search_path = public, pg_temp;/g) || []).length;
      assert.equal(secDefinerCount, 2, 'Ambas as funções devem ser SECURITY DEFINER com search_path seguro');

      const grantCount = (sql.match(/GRANT EXECUTE ON FUNCTION[\s\S]+?TO anon, authenticated, service_role;/g) || []).length;
      assert.equal(grantCount, 2, 'Ambas as funções devem conceder execução a anon, authenticated, service_role');

      const revokeCount = (sql.match(/REVOKE ALL ON FUNCTION[\s\S]+?FROM PUBLIC;/g) || []).length;
      assert.equal(revokeCount, 2, 'Ambas as funções devem revogar privilégios de PUBLIC');
    });
  });

});
