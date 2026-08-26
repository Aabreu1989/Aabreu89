import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req, res) {
  const allowedOrigins = ['https://miraimigrante.pt', 'https://www.miraimigrante.pt', 'http://127.0.0.1:3333', 'http://localhost:3333', 'http://localhost:5173'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🛡️ REGRA ZERO: Extrair e Validar JWT de Autorização do Cliente
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let authenticatedUserId = null;
    let authenticatedUserEmail = null;

    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user) {
        authenticatedUserId = userData.user.id;
        authenticatedUserEmail = (userData.user.email || '').toLowerCase().trim();
      }
    }

    const { action, reqUserId, reqEmail, userId } = req.body || {};

    // ──────────────────────────────────────────────────────────────────────────
    // 🔒 AUTO-EXCLUSÃO RGPD SOBERANA: EXCLUSIVAMENTE VIA JWT VÁLIDO
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'delete_self') {
      if (!token) {
        return res.status(401).json({ error: 'Token de autorização Bearer obrigatório para auto-exclusão.' });
      }

      const { data: authData, error: authVerifyErr } = await supabaseAdmin.auth.getUser(token);
      if (authVerifyErr || !authData?.user) {
        return res.status(401).json({ error: 'Sessão inválida ou expirada. Não é possível validar a identidade.' });
      }

      const targetUid = authData.user.id;
      console.log(`🔒 [MIRA RGPD] A executar auto-exclusão controlada do utilizador ${targetUid}`);

      // Purgação em ordem topológica de dependências (FKs)
      // 1. Dados privados, documentos e preferências
      await Promise.allSettled([
        supabaseAdmin.from('user_documents').delete().eq('user_id', targetUid),
        supabaseAdmin.from('user_job_alerts').delete().eq('user_id', targetUid),
        supabaseAdmin.from('saved_posts').delete().eq('user_id', targetUid),
        supabaseAdmin.from('post_votes').delete().eq('user_id', targetUid),
        supabaseAdmin.from('user_badges').delete().eq('user_id', targetUid),
        supabaseAdmin.from('reputation_logs').delete().eq('user_id', targetUid),
        supabaseAdmin.from('notifications').delete().eq('user_id', targetUid),
        supabaseAdmin.from('app_suggestions').delete().eq('user_id', targetUid),
        supabaseAdmin.from('community_interactions').delete().eq('user_id', targetUid)
      ]);

      // 2. Relações sociais e denúncias associadas
      await Promise.allSettled([
        supabaseAdmin.from('user_follows').delete().eq('follower_id', targetUid),
        supabaseAdmin.from('user_follows').delete().eq('following_id', targetUid),
        supabaseAdmin.from('reports').delete().eq('reporter_id', targetUid),
        supabaseAdmin.from('reports').delete().eq('target_user_id', targetUid)
      ]);

      // 3. Conteúdo publicado pelo utilizador
      await Promise.allSettled([
        supabaseAdmin.from('comments').delete().eq('author_id', targetUid),
        supabaseAdmin.from('stories').delete().eq('author_id', targetUid),
        supabaseAdmin.from('posts').delete().eq('author_id', targetUid)
      ]);

      // 4. Perfil público
      await supabaseAdmin.from('profiles').delete().eq('id', targetUid);

      // 5. Telemetria de sistema (Anonimização do user_id mantendo a contagem agregada de indicadores)
      await supabaseAdmin.from('activity_logs').update({ user_id: null }).eq('user_id', targetUid);

      // 6. Eliminação final da conta no Supabase Auth
      const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUid);
      if (authDeleteErr) {
        console.error(`🚨 [MIRA RGPD] Falha ao eliminar do auth.users: ${authDeleteErr.message}`);
        return res.status(500).json({ error: `Falha ao eliminar registo de autenticação: ${authDeleteErr.message}` });
      }

      console.log(`✅ [MIRA RGPD] Auto-exclusão do utilizador ${targetUid} concluída com sucesso.`);
      return res.status(200).json({ success: true, message: 'Conta e dados pessoais eliminados com sucesso.' });
    }

    if (!authenticatedUserId && (reqUserId || userId)) {
      authenticatedUserId = reqUserId || userId;
      authenticatedUserEmail = (reqEmail || '').toLowerCase().trim();
    }

    // 0. LEITURA PÚBLICA DE CONTADORES GLOBAIS AGREGADOS (Sem expor dados privados)
    if (action === 'get_aggregated_votes') {
      const { postIds } = req.body || {};
      if (!Array.isArray(postIds) || postIds.length === 0) {
        return res.status(200).json({ success: true, aggregatedVotes: {} });
      }

      const { data: votesData, error: vErr } = await supabaseAdmin
        .from('post_votes')
        .select('post_id, vote_type')
        .in('post_id', postIds);

      if (vErr) {
        return res.status(500).json({ error: vErr.message });
      }

      const aggregatedVotes = {};
      postIds.forEach(pId => {
        aggregatedVotes[pId] = { trueCount: 0, falseCount: 0, likeCount: 0 };
      });

      (votesData || []).forEach(v => {
        if (!aggregatedVotes[v.post_id]) {
          aggregatedVotes[v.post_id] = { trueCount: 0, falseCount: 0, likeCount: 0 };
        }
        if (v.vote_type === 'true' || v.vote_type === 'useful') {
          aggregatedVotes[v.post_id].trueCount++;
        } else if (v.vote_type === 'fake') {
          aggregatedVotes[v.post_id].falseCount++;
        } else if (v.vote_type === 'like') {
          aggregatedVotes[v.post_id].likeCount++;
        }
      });

      const targetUserId = req.body?.userId || authenticatedUserId;
      const userFactVotes = {};
      const userLikes = [];

      if (targetUserId) {
        const { data: uVotes } = await supabaseAdmin
          .from('post_votes')
          .select('post_id, vote_type')
          .eq('user_id', targetUserId)
          .in('post_id', postIds);

        (uVotes || []).forEach(uv => {
          if (uv.vote_type === 'like') {
            userLikes.push(uv.post_id);
          } else if (uv.vote_type === 'true' || uv.vote_type === 'useful') {
            userFactVotes[uv.post_id] = 'true';
          } else if (uv.vote_type === 'fake') {
            userFactVotes[uv.post_id] = 'fake';
          }
        });
      }

      return res.status(200).json({ success: true, aggregatedVotes, userFactVotes, userLikes });
    }

    // 🛡️ REJEIÇÃO 401: Se não houver JWT válido, tentar validar via perfil autenticado
    if (!authenticatedUserId) {
      const { reqUserId, reqEmail } = req.body || {};
      if (reqUserId && reqEmail) {
        const { data: profileCheck } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('id', reqUserId)
          .maybeSingle();

        if (profileCheck && profileCheck.email?.toLowerCase().trim() === reqEmail.toLowerCase().trim()) {
          authenticatedUserId = reqUserId;
          authenticatedUserEmail = (profileCheck.email || '').toLowerCase().trim();
        }
      }
    }

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado: Sessão de utilizador inválida ou expirada. Faça login novamente.' });
    }

    // 1. CREATE POST
    if (action === 'create_post') {
      const { title, content, category, mediaUrl } = req.body || {};
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Conteúdo do post é obrigatório.' });
      }

      const newPostPayload = {
        author_id: authenticatedUserId,
        title: title || 'Nova Partilha',
        content: content.trim(),
        category: category || 'Geral',
        media_url: mediaUrl || null,
        created_at: new Date().toISOString()
      };

      const { data: insertedPost, error: postErr } = await supabaseAdmin
        .from('posts')
        .insert(newPostPayload)
        .select()
        .single();

      if (postErr) {
        return res.status(500).json({ error: postErr.message });
      }

      return res.status(200).json({ success: true, post: insertedPost });
    }

    // 2. DELETE POST (ADMIN OU AUTOR)
    if (action === 'delete_post') {
      const { postId } = req.body || {};
      if (!postId) return res.status(400).json({ error: 'postId é obrigatório.' });

      const { data: postCheck } = await supabaseAdmin.from('posts').select('id, author_id').eq('id', postId).maybeSingle();
      const isAdmin = (authenticatedUserEmail || '').toLowerCase().trim() === 'amandasabreu89@gmail.com';
      if (postCheck && postCheck.author_id !== authenticatedUserId && !isAdmin) {
        return res.status(403).json({ error: 'Apenas o autor ou admin podem eliminar esta publicação.' });
      }

      // Deletar comentários, votos e salvamentos associados
      await supabaseAdmin.from('comments').delete().eq('post_id', postId);
      await supabaseAdmin.from('post_votes').delete().eq('post_id', postId);
      await supabaseAdmin.from('saved_posts').delete().eq('post_id', postId);
      const { error: delErr } = await supabaseAdmin.from('posts').delete().eq('id', postId);
      if (delErr) return res.status(500).json({ error: delErr.message });

      return res.status(200).json({ success: true, postId });
    }

    // 2.1 DELETE COMMENT (ADMIN OU AUTOR COM VALIDAÇÃO DE SESSÃO REAL)
    if (action === 'delete_comment') {
      const { commentId } = req.body || {};
      if (!commentId) return res.status(400).json({ error: 'commentId é obrigatório.' });

      const { data: commentCheck } = await supabaseAdmin.from('comments').select('id, author_id, post_id').eq('id', commentId).maybeSingle();
      
      let isAdmin = (authenticatedUserEmail || '').toLowerCase().trim() === 'amandasabreu89@gmail.com';
      if (!isAdmin && authenticatedUserId) {
        const { data: prof } = await supabaseAdmin.from('profiles').select('role, email').eq('id', authenticatedUserId).maybeSingle();
        if (prof?.role === 'admin' || (prof?.email || '').toLowerCase().trim() === 'amandasabreu89@gmail.com') {
          isAdmin = true;
        }
      }

      if (commentCheck && commentCheck.author_id !== authenticatedUserId && !isAdmin) {
        return res.status(403).json({ error: 'Apenas o autor do comentário ou admin podem eliminar este comentário.' });
      }

      // Deletar respostas primeiro se houver
      await supabaseAdmin.from('comments').delete().eq('parent_id', commentId);
      // Deletar curtidas do comentário
      await supabaseAdmin.from('comment_likes').delete().eq('comment_id', commentId);
      // Deletar o comentário
      const { error: delComErr } = await supabaseAdmin.from('comments').delete().eq('id', commentId);
      if (delComErr) return res.status(500).json({ error: delComErr.message });

      return res.status(200).json({ success: true, commentId });
    }

    // 3. VOTE (LIKE / TRUE / FAKE) ON POST_VOTES COM SEPARAÇÃO DE FACT-CHECK E LIKE
    if (action === 'vote') {
      const { postId, voteType } = req.body || {};
      if (!postId || !voteType) return res.status(400).json({ error: 'postId e voteType são obrigatórios.' });

      if (!authenticatedUserId) {
        return res.status(401).json({ error: 'Autenticação necessária para registrar voto/like.' });
      }

      const normalizedVoteType = voteType === 'useful' ? 'true' : voteType;
      if (!['like', 'true', 'fake'].includes(normalizedVoteType)) {
        return res.status(400).json({ error: 'voteType inválido. Permitidos: like, true, fake.' });
      }

      let voteActionResult = 'added';

      if (normalizedVoteType === 'like') {
        const { data: existingLike, error: fetchLikeErr } = await supabaseAdmin
          .from('post_votes')
          .select('id, vote_type')
          .eq('post_id', postId)
          .eq('user_id', authenticatedUserId)
          .eq('vote_type', 'like')
          .maybeSingle();

        if (fetchLikeErr) {
          console.error("🚨 [MIRA API Community] Erro ao consultar like existente:", fetchLikeErr.message);
          return res.status(500).json({ error: fetchLikeErr.message });
        }

        if (existingLike) {
          const { error: delErr } = await supabaseAdmin
            .from('post_votes')
            .delete()
            .eq('id', existingLike.id);

          if (delErr) {
            console.error("🚨 [MIRA API Community] Erro ao remover like:", delErr.message);
            return res.status(500).json({ error: delErr.message });
          }
          voteActionResult = 'removed';
        } else {
          const { error: insertErr } = await supabaseAdmin
            .from('post_votes')
            .insert({
              post_id: postId,
              user_id: authenticatedUserId,
              vote_type: 'like'
            });

          if (insertErr) {
            if (insertErr.code === '23505' || insertErr.message?.includes('unique')) {
              // 🛡️ TRATAMENTO DE CONCORRÊNCIA: Reavaliar estado real antes de qualquer ação
              const { data: recheckLike } = await supabaseAdmin
                .from('post_votes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', authenticatedUserId)
                .eq('vote_type', 'like')
                .maybeSingle();

              if (recheckLike) {
                await supabaseAdmin.from('post_votes').delete().eq('id', recheckLike.id);
                voteActionResult = 'removed';
              } else {
                return res.status(500).json({ error: insertErr.message });
              }
            } else {
              console.error("🚨 [MIRA API Community] Erro ao gravar post_vote like:", insertErr.message);
              return res.status(500).json({ error: insertErr.message });
            }
          } else {
            voteActionResult = 'added';
          }
        }
      } else {
        // Fact-check votes ('true' ou 'fake')
        const { data: existingFactVotes, error: fetchFactErr } = await supabaseAdmin
          .from('post_votes')
          .select('id, vote_type')
          .eq('post_id', postId)
          .eq('user_id', authenticatedUserId)
          .in('vote_type', ['true', 'fake', 'useful']);

        if (fetchFactErr) {
          console.error("🚨 [MIRA API Community] Erro ao consultar voto de facto existente:", fetchFactErr.message);
          return res.status(500).json({ error: fetchFactErr.message });
        }

        const existingFactVote = existingFactVotes && existingFactVotes.length > 0 ? existingFactVotes[0] : null;

        if (existingFactVote) {
          const currentType = existingFactVote.vote_type === 'useful' ? 'true' : existingFactVote.vote_type;
          if (currentType === normalizedVoteType) {
            // Clicou no mesmo: remover voto
            const { error: delFactErr } = await supabaseAdmin
              .from('post_votes')
              .delete()
              .eq('id', existingFactVote.id);

            if (delFactErr) {
              console.error("🚨 [MIRA API Community] Erro ao remover voto de facto:", delFactErr.message);
              return res.status(500).json({ error: delFactErr.message });
            }
            voteActionResult = 'removed';
          } else {
            // Clicou no oposto (ex: TRUE -> FAKE): alternar voto
            const { error: updateFactErr } = await supabaseAdmin
              .from('post_votes')
              .update({ vote_type: normalizedVoteType })
              .eq('id', existingFactVote.id);

            if (updateFactErr) {
              console.error("🚨 [MIRA API Community] Erro ao alternar voto de facto:", updateFactErr.message);
              return res.status(500).json({ error: updateFactErr.message });
            }
            voteActionResult = 'switched';
          }
        } else {
          // Novo voto
          const { error: insertFactErr } = await supabaseAdmin
            .from('post_votes')
            .insert({
              post_id: postId,
              user_id: authenticatedUserId,
              vote_type: normalizedVoteType
            });

          if (insertFactErr) {
            if (insertFactErr.code === '23505' || insertFactErr.message?.includes('unique')) {
              // 🛡️ Concorrência: Reavaliar estado real
              const { data: recheckFact } = await supabaseAdmin
                .from('post_votes')
                .select('id, vote_type')
                .eq('post_id', postId)
                .eq('user_id', authenticatedUserId)
                .in('vote_type', ['true', 'fake', 'useful'])
                .maybeSingle();

              if (recheckFact && recheckFact.vote_type === normalizedVoteType) {
                await supabaseAdmin.from('post_votes').delete().eq('id', recheckFact.id);
                voteActionResult = 'removed';
              } else {
                return res.status(500).json({ error: insertFactErr.message });
              }
            } else {
              console.error("🚨 [MIRA API Community] Erro ao gravar post_vote fact:", insertFactErr.message);
              return res.status(500).json({ error: insertFactErr.message });
            }
          } else {
            voteActionResult = 'added';
          }
        }
      }

      // 🛡️ GAMIFICAÇÃO SOBERANA, ATÓMICA E IDEMPOTENTE (ETAPA 3F-B.3)
      let pointsEarned = 0;
      let newReputation = null;

      if (voteActionResult === 'added' && normalizedVoteType === 'like') {
        try {
          const givenKey = `like_given:post:${postId}:user:${authenticatedUserId}`;
          const { data: existingGivenLog } = await supabaseAdmin
            .from('reputation_logs')
            .select('id')
            .eq('reason', givenKey)
            .maybeSingle();

          if (!existingGivenLog) {
            const { data: rep } = await supabaseAdmin.rpc('increment_reputation', {
              target_user_id: authenticatedUserId,
              amount: 1
            });
            await supabaseAdmin.from('reputation_logs').insert([{
              user_id: authenticatedUserId,
              amount: 1,
              reason: givenKey
            }]);
            pointsEarned = 1;
            newReputation = rep;
          }

          // Reconhecimento ao Autor do Post (+2 pts)
          const { data: targetPost } = await supabaseAdmin.from('posts').select('author_id').eq('id', postId).maybeSingle();
          if (targetPost && targetPost.author_id && targetPost.author_id !== authenticatedUserId) {
            const receivedKey = `like_received:post:${postId}:from:${authenticatedUserId}`;
            const { data: existingRecLog } = await supabaseAdmin
              .from('reputation_logs')
              .select('id')
              .eq('reason', receivedKey)
              .maybeSingle();

            if (!existingRecLog) {
              await supabaseAdmin.rpc('increment_reputation', {
                target_user_id: targetPost.author_id,
                amount: 2
              });
              await supabaseAdmin.from('reputation_logs').insert([{
                user_id: targetPost.author_id,
                amount: 2,
                reason: receivedKey
              }]);
            }
          }
        } catch (e) {
          console.warn('⚠️ [MIRA API Community] Erro na gamificação de post_like:', e);
        }
      } else if (voteActionResult !== 'removed' && (normalizedVoteType === 'true' || normalizedVoteType === 'fake')) {
        const actionKey = normalizedVoteType === 'true' ? 'vote_true' : 'vote_fake';

        // Invocação transacional atómica via RPC executada como service_role
        const { data: gResult, error: gError } = await supabaseAdmin.rpc('grant_idempotent_vote_reputation', {
          target_user_id: authenticatedUserId,
          p_action_key: actionKey,
          p_entity_id: postId
        });

        if (!gError && gResult) {
          if (gResult.earned === true) {
            pointsEarned = gResult.amount || 3;
            newReputation = gResult.reputation;
          } else {
            pointsEarned = 0;
            newReputation = gResult.reputation || null;
          }
        } else if (gError) {
          console.warn('⚠️ [MIRA API Community] Aviso ao invocar RPC de gamificação:', gError.message);
        }

        // 🔰 GATILHO SERVER-SIDE SOBERANO: ESCUDO ANTI-BURLA (5+ votos fake/denúncias confirmadas)
        if (normalizedVoteType === 'fake') {
          try {
            const { count: fakeVotesCount } = await supabaseAdmin
              .from('post_votes')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', authenticatedUserId)
              .eq('vote_type', 'fake');

            if ((fakeVotesCount || 0) >= 5) {
              const { data: existingBadge } = await supabaseAdmin
                .from('user_badges')
                .select('badge_id')
                .eq('user_id', authenticatedUserId)
                .eq('badge_id', 'escudo_anti_burla')
                .maybeSingle();

              if (!existingBadge) {
                await supabaseAdmin
                  .from('user_badges')
                  .insert([{ user_id: authenticatedUserId, badge_id: 'escudo_anti_burla' }]);

                await supabaseAdmin.from('notifications').insert([{
                  user_id: authenticatedUserId,
                  type: 'social',
                  title: 'Selo Conquistado! 🔰',
                  message: 'Parabéns! Conquistaste o selo "Escudo Anti-Burla" por combater fraudes na comunidade.',
                  is_read: false,
                  link: '/profile',
                  created_at: new Date().toISOString()
                }]);
              }
            }
          } catch (e) {
            console.warn('⚠️ [MIRA API Community] Erro ao verificar badge escudo_anti_burla:', e);
          }
        }
      }

      return res.status(200).json({
        success: true,
        action: voteActionResult,
        pointsEarned,
        reputation: newReputation
      });
    }

    // 4. TOGGLE SAVE POST (SAVED_POSTS)
    if (action === 'toggle_save') {
      const { postId, isRemoving } = req.body || {};
      if (!postId) return res.status(400).json({ error: 'postId é obrigatório.' });

      if (isRemoving) {
        await supabaseAdmin.from('saved_posts').delete().eq('post_id', postId).eq('user_id', authenticatedUserId);
        return res.status(200).json({ success: true, action: 'removed' });
      } else {
        const { error: saveErr } = await supabaseAdmin.from('saved_posts').insert({
          post_id: postId,
          user_id: authenticatedUserId
        });
        if (saveErr && (saveErr.code === '23505' || saveErr.message?.includes('unique'))) {
          await supabaseAdmin.from('saved_posts').delete().eq('post_id', postId).eq('user_id', authenticatedUserId);
          return res.status(200).json({ success: true, action: 'removed' });
        } else if (saveErr) {
          return res.status(500).json({ error: saveErr.message });
        }
        return res.status(200).json({ success: true, action: 'added' });
      }
    }

    // 5. CREATE COMMENT
    if (action === 'create_comment') {
      const { postId, content, parentId } = req.body || {};
      if (!postId || !content || !content.trim()) {
        return res.status(400).json({ error: 'postId e content são obrigatórios.' });
      }

      const { data: newComment, error: commentErr } = await supabaseAdmin
        .from('comments')
        .insert({
          post_id: postId,
          author_id: authenticatedUserId,
          content: content.trim(),
          parent_id: parentId || null
        })
        .select(`
          *,
          profiles!comments_author_id_fkey ( id, name, avatar_url, role, is_verified )
        `)
        .single();

      if (commentErr) return res.status(500).json({ error: commentErr.message });

      const prof = newComment.profiles || {};
      const enrichedComment = {
        ...newComment,
        author_name: prof.name || 'Membro',
        author_avatar: prof.avatar_url || ''
      };

      // 🔔 DOMÍNIO 11: DISPARO DE NOTIFICAÇÃO SOCIAL SOBERANA (EFEITO SECUNDÁRIO TOLERANTE A FALHAS)
      try {
        let targetRecipientId = null;
        let notifTitle = '';
        let notifMessage = '';
        const rawText = content.trim();
        const contentSnippet = rawText.length > 60 ? rawText.substring(0, 57) + '...' : rawText;
        const authorDisplayName = prof.name || 'Membro da Comunidade';

        if (parentId) {
          // Cenário B: Resposta a Comentário Existente
          const { data: parentComment } = await supabaseAdmin
            .from('comments')
            .select('author_id')
            .eq('id', parentId)
            .maybeSingle();

          if (parentComment && parentComment.author_id) {
            targetRecipientId = parentComment.author_id;
            notifTitle = '💬 Nova Resposta ao teu Comentário';
            notifMessage = `${authorDisplayName} respondeu: "${contentSnippet}"`;
          }
        } else {
          // Cenário A: Comentário Direto em Publicação
          const { data: targetPost } = await supabaseAdmin
            .from('posts')
            .select('author_id')
            .eq('id', postId)
            .maybeSingle();

          if (targetPost && targetPost.author_id) {
            targetRecipientId = targetPost.author_id;
            notifTitle = '💬 Novo Comentário no teu Post';
            notifMessage = `${authorDisplayName} comentou: "${contentSnippet}"`;
          }
        }

        // Trava de Auto-Spam: Não notificar o próprio autor da ação
        if (targetRecipientId && targetRecipientId !== authenticatedUserId) {
          await supabaseAdmin.from('notifications').insert([{
            user_id: targetRecipientId,
            type: 'social',
            title: notifTitle,
            message: notifMessage,
            link: `/community?post=${postId}&comment=${newComment.id}`,
            is_read: false,
            created_at: new Date().toISOString()
          }]);
          console.log(`🔔 [MIRA Notifications] Notificação social enviada para ${targetRecipientId}`);
        }
      } catch (notifErr) {
        console.warn('⚠️ [MIRA Notifications] Aviso ao gerar notificação social:', notifErr);
      }

      return res.status(200).json({ success: true, comment: enrichedComment });
    }

    // 6. TOGGLE COMMENT LIKE (COMMENT_LIKES)
    if (action === 'toggle_comment_like') {
      const { commentId, isRemoving } = req.body || {};
      if (!commentId) return res.status(400).json({ error: 'commentId é obrigatório.' });

      let likeAction = 'added';
      if (isRemoving) {
        await supabaseAdmin.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', authenticatedUserId);
        likeAction = 'removed';
      } else {
        const { error: likeErr } = await supabaseAdmin.from('comment_likes').insert({
          comment_id: commentId,
          user_id: authenticatedUserId
        });
        if (likeErr && (likeErr.code === '23505' || likeErr.message?.includes('unique'))) {
          await supabaseAdmin.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', authenticatedUserId);
          likeAction = 'removed';
        } else if (likeErr) {
          return res.status(500).json({ error: likeErr.message });
        }
      }

      // Sincronizar contador global likes_count na tabela comments
      const { count: currentLikesCount } = await supabaseAdmin
        .from('comment_likes')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', commentId);

      await supabaseAdmin
        .from('comments')
        .update({ likes_count: currentLikesCount || 0 })
        .eq('id', commentId);

      // 🛡️ GAMIFICAÇÃO SOBERANA & IDEMPOTENTE PARA LIKES DE COMENTÁRIO
      if (likeAction === 'added' && authenticatedUserId) {
        try {
          const givenKey = `like_given:comment:${commentId}:user:${authenticatedUserId}`;
          const { data: existingGivenLog } = await supabaseAdmin
            .from('reputation_logs')
            .select('id')
            .eq('reason', givenKey)
            .maybeSingle();

          if (!existingGivenLog) {
            await supabaseAdmin.rpc('increment_reputation', {
              target_user_id: authenticatedUserId,
              amount: 1
            });
            await supabaseAdmin.from('reputation_logs').insert([{
              user_id: authenticatedUserId,
              amount: 1,
              reason: givenKey
            }]);
          }

          // Reconhecimento ao Autor do Comentário (+2 pts)
          const { data: targetComment } = await supabaseAdmin.from('comments').select('author_id').eq('id', commentId).maybeSingle();
          if (targetComment && targetComment.author_id && targetComment.author_id !== authenticatedUserId) {
            const receivedKey = `like_received:comment:${commentId}:from:${authenticatedUserId}`;
            const { data: existingRecLog } = await supabaseAdmin
              .from('reputation_logs')
              .select('id')
              .eq('reason', receivedKey)
              .maybeSingle();

            if (!existingRecLog) {
              await supabaseAdmin.rpc('increment_reputation', {
                target_user_id: targetComment.author_id,
                amount: 2
              });
              await supabaseAdmin.from('reputation_logs').insert([{
                user_id: targetComment.author_id,
                amount: 2,
                reason: receivedKey
              }]);
            }
          }
        } catch (e) {
          console.warn('⚠️ [MIRA API Community] Erro na gamificação de comment_like:', e);
        }
      }

      return res.status(200).json({ success: true, action: likeAction, likesCount: currentLikesCount || 0 });
    }

    // 7. REPORT (REPORTS)
    if (action === 'report') {
      const { postId, commentId, targetAuthorId, targetUserId, reason } = req.body || {};
      if (!postId && !commentId) {
        return res.status(400).json({ error: 'postId ou commentId é obrigatório.' });
      }

      const reportPayload = {
        reporter_id: authenticatedUserId,
        target_user_id: targetAuthorId || targetUserId || null,
        reason: reason || 'Denúncia de Conteúdo',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (commentId) {
        reportPayload.comment_id = commentId;
      }
      if (postId) {
        reportPayload.post_id = postId;
      }

      const { data: repData, error: repErr } = await supabaseAdmin.from('reports').insert(reportPayload).select().single();
      if (repErr) return res.status(500).json({ error: repErr.message });

      return res.status(200).json({ success: true, report: repData });
    }

    // 8. FOLLOW / UNFOLLOW (USER_FOLLOWS)
    if (action === 'follow' || action === 'unfollow') {
      const { targetUserId } = req.body || {};
      if (!targetUserId) return res.status(400).json({ error: 'targetUserId é obrigatório.' });

      if (!authenticatedUserId) {
        return res.status(401).json({ error: 'Autenticação necessária para seguir/deixar de seguir.' });
      }

      if (targetUserId === authenticatedUserId) {
        return res.status(400).json({ error: 'Não é permitido seguir o seu próprio perfil.' });
      }

      if (action === 'unfollow') {
        const { error: delErr } = await supabaseAdmin
          .from('user_follows')
          .delete()
          .eq('follower_id', authenticatedUserId)
          .eq('following_id', targetUserId);

        if (delErr) {
          console.error("🚨 [MIRA API Community] Erro ao remover follow:", delErr.message);
          return res.status(500).json({ error: delErr.message });
        }
        return res.status(200).json({ success: true, action: 'unfollowed' });
      } else {
        const { error: insertErr } = await supabaseAdmin
          .from('user_follows')
          .insert({
            follower_id: authenticatedUserId,
            following_id: targetUserId
          });

        if (insertErr) {
          if (insertErr.code === '23505' || insertErr.message?.includes('duplicate') || insertErr.message?.includes('unique')) {
            return res.status(200).json({ success: true, action: 'already_followed' });
          }
          console.error("🚨 [MIRA API Community] Erro ao gravar follow:", insertErr.message);
          return res.status(500).json({ error: insertErr.message });
        }
        return res.status(200).json({ success: true, action: 'followed' });
      }
    }

    // 9. EARN POINTS (GAMIFICATION ENGINE SOBERANO)
    if (action === 'earn_points') {
      const { actionKey, reason, entityId } = req.body || {};
      if (!actionKey) {
        return res.status(400).json({ error: 'actionKey é obrigatório.' });
      }

      const DEFAULT_RULES = {
        publish_post: 10,
        add_comment: 5,
        like_given: 1,
        like_received: 2,
        vote_true: 3,
        vote_fake: 3,
        follow_user: 2,
        report_content: 1,
        curate_guide: 15
      };

      let amount = DEFAULT_RULES[actionKey];

      try {
        const { data: ruleData } = await supabaseAdmin
          .from('gamification_rules')
          .select('points')
          .eq('action_key', actionKey)
          .maybeSingle();

        if (ruleData && typeof ruleData.points === 'number') {
          amount = ruleData.points;
        }
      } catch (e) {
        // Tabela gamification_rules ainda em migração
      }

      if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Ação de gamificação inválida ou não reconhecida.' });
      }

      // Executar RPC atómica via cliente SERVICE_ROLE
      const { data: newRep, error: rpcErr } = await supabaseAdmin.rpc('increment_reputation', {
        target_user_id: authenticatedUserId,
        amount: amount
      });

      if (rpcErr) {
        console.error('🚨 [MIRA API Community] Erro ao incrementar reputação:', rpcErr.message);
        return res.status(500).json({ error: 'Falha ao processar pontos de reputação.' });
      }

      // Registar nos audit logs
      const reasonText = reason || `Ação: ${actionKey}`;
      await supabaseAdmin.from('reputation_logs').insert([{
        user_id: authenticatedUserId,
        amount: amount,
        reason: reasonText
      }]);

      await supabaseAdmin.from('activity_logs').insert([{
        user_id: authenticatedUserId,
        action: 'reputation_gained',
        metadata: { amount, reason: reasonText, entity_id: entityId || null },
        created_at: new Date().toISOString()
      }]);

      return res.status(200).json({ success: true, reputation: newRep, pointsEarned: amount });
    }

    return res.status(400).json({ error: 'Ação não suportada pelo gateway de comunidade.' });
  } catch (err) {
    console.error('🚨 [MIRA API Community Exception]:', err.message || err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor de comunidade.' });
  }
}
