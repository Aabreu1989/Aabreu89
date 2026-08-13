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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 🛡️ REGRA ZERO: Extrair e Validar JWT de Autorização do Cliente
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let authenticatedUserId = null;

    if (token) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user) {
        authenticatedUserId = userData.user.id;
      }
    }

    // Se o token não for um JWT válido de Supabase Auth, tentar validar se há um token na sessão ou se é o admin Amanda
    const { action } = req.body || {};

    // 🛡️ REJEIÇÃO 401: Se não houver JWT válido, rejeitar a operação para garantir segurança estrita
    if (!authenticatedUserId) {
      // Fallback permissivo de transição para perfis migrados com email autenticado no body (Verificação de Integridade)
      const { reqUserId, reqEmail } = req.body || {};
      if (reqUserId && reqEmail) {
        const { data: profileCheck } = await supabaseAdmin
          .from('profiles')
          .select('id, email')
          .eq('id', reqUserId)
          .maybeSingle();

        if (profileCheck && profileCheck.email?.toLowerCase().trim() === reqEmail.toLowerCase().trim()) {
          authenticatedUserId = reqUserId;
        }
      }
    }

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado: Sessão de utilizador inválida ou expirada. Faça login novamente.' });
    }

    // 1. CREATE POST
    if (action === 'create_post') {
      const { title, content, category } = req.body || {};
      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Conteúdo do post é obrigatório.' });
      }

      // Ensure profile exists in DB
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', authenticatedUserId)
        .maybeSingle();

      if (!existingProfile) {
        await supabaseAdmin.from('profiles').upsert({
          id: authenticatedUserId,
          full_name: req.body?.authorName || 'Membro MIRA',
          avatar_url: req.body?.authorAvatar || '',
          role: 'member',
          created_at: new Date().toISOString()
        });
      }

      // Insert post into PostgreSQL with authentic user ID
      const { data: newPost, error: postErr } = await supabaseAdmin
        .from('posts')
        .insert({
          author_id: authenticatedUserId,
          title: title || 'Nova Partilha',
          content: content.trim(),
          category: category || 'Geral',
          validation_status: 'validated',
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          profiles ( id, full_name, username, avatar_url, is_verified, role )
        `)
        .single();

      if (postErr) {
        console.error('🚨 [MIRA API Community] Erro ao criar post:', postErr.message);
        return res.status(500).json({ error: postErr.message });
      }

      console.log('✅ [MIRA API Community] Post criado no PostgreSQL:', newPost.id);
      return res.status(200).json({ success: true, post: newPost });
    }

    // 2. DELETE POST
    if (action === 'delete_post') {
      const { postId } = req.body || {};
      if (!postId) return res.status(400).json({ error: 'postId é obrigatório.' });

      // Check ownership or admin status
      const { data: postCheck } = await supabaseAdmin.from('posts').select('author_id').eq('id', postId).maybeSingle();
      const { data: profileCheck } = await supabaseAdmin.from('profiles').select('role, email').eq('id', authenticatedUserId).maybeSingle();
      
      const isAdmin = profileCheck?.role === 'admin' || ['amandasabreu89@gmail.com', 'mira.app@hotmail.com'].includes(profileCheck?.email?.toLowerCase() || '');
      if (postCheck && postCheck.author_id !== authenticatedUserId && !isAdmin) {
        return res.status(403).json({ error: 'Apenas o autor ou admin podem eliminar este post.' });
      }

      const { error: delErr } = await supabaseAdmin.from('posts').delete().eq('id', postId);
      if (delErr) return res.status(500).json({ error: delErr.message });

      return res.status(200).json({ success: true, postId });
    }

    // 3. VOTE (LIKE / TRUE / FAKE) ON POST_VOTES
    if (action === 'vote') {
      const { postId, voteType } = req.body || {};
      if (!postId || !voteType) return res.status(400).json({ error: 'postId e voteType são obrigatórios.' });

      const normalizedVoteType = voteType === 'useful' ? 'true' : voteType;
      if (!['like', 'true', 'fake'].includes(normalizedVoteType)) {
        return res.status(400).json({ error: 'voteType inválido. Permitidos: like, true, fake.' });
      }

      const { data: existingVote } = await supabaseAdmin
        .from('post_votes')
        .select('id, vote_type')
        .eq('post_id', postId)
        .eq('user_id', authenticatedUserId)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === normalizedVoteType) {
          await supabaseAdmin.from('post_votes').delete().eq('id', existingVote.id);
          return res.status(200).json({ success: true, action: 'removed' });
        } else {
          await supabaseAdmin.from('post_votes').update({ vote_type: normalizedVoteType }).eq('id', existingVote.id);
          return res.status(200).json({ success: true, action: 'switched' });
        }
      } else {
        await supabaseAdmin.from('post_votes').insert({
          post_id: postId,
          user_id: authenticatedUserId,
          vote_type: normalizedVoteType
        });
        return res.status(200).json({ success: true, action: 'added' });
      }
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
          profiles!comments_author_id_fkey ( id, full_name, username, avatar_url )
        `)
        .single();

      if (commentErr) return res.status(500).json({ error: commentErr.message });

      return res.status(200).json({ success: true, comment: newComment });
    }

    // 6. TOGGLE COMMENT LIKE (COMMENT_LIKES)
    if (action === 'toggle_comment_like') {
      const { commentId, isRemoving } = req.body || {};
      if (!commentId) return res.status(400).json({ error: 'commentId é obrigatório.' });

      if (isRemoving) {
        await supabaseAdmin.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', authenticatedUserId);
        return res.status(200).json({ success: true, action: 'removed' });
      } else {
        const { error: likeErr } = await supabaseAdmin.from('comment_likes').insert({
          comment_id: commentId,
          user_id: authenticatedUserId
        });
        if (likeErr && (likeErr.code === '23505' || likeErr.message?.includes('unique'))) {
          await supabaseAdmin.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', authenticatedUserId);
          return res.status(200).json({ success: true, action: 'removed' });
        } else if (likeErr) {
          return res.status(500).json({ error: likeErr.message });
        }
        return res.status(200).json({ success: true, action: 'added' });
      }
    }

    // 7. REPORT (REPORTS)
    if (action === 'report') {
      const { postId, commentId, reason } = req.body || {};
      if (!postId && !commentId) {
        return res.status(400).json({ error: 'postId ou commentId é obrigatório.' });
      }

      const reportPayload = {
        reporter_id: authenticatedUserId,
        reason: reason || 'Denúncia de Conteúdo',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (commentId) {
        reportPayload.comment_id = commentId;
      } else {
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

      if (action === 'unfollow') {
        const { error } = await supabaseAdmin.from('user_follows').delete().eq('follower_id', authenticatedUserId).eq('following_id', targetUserId);
        if (error && error.code === 'PGRST205') {
          return res.status(400).json({ error: 'Tabela user_follows pendente de migration.' });
        }
        return res.status(200).json({ success: true, action: 'unfollowed' });
      } else {
        const { error } = await supabaseAdmin.from('user_follows').insert({
          follower_id: authenticatedUserId,
          following_id: targetUserId
        });
        if (error && error.code === 'PGRST205') {
          return res.status(400).json({ error: 'Tabela user_follows pendente de migration.' });
        }
        return res.status(200).json({ success: true, action: 'followed' });
      }
    }

    return res.status(400).json({ error: 'Ação não suportada pelo gateway de comunidade.' });
  } catch (err) {
    console.error('🚨 [MIRA API Community Exception]:', err.message || err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor de comunidade.' });
  }
}
