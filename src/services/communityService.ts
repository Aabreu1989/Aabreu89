import { supabase } from '../lib/supabase';
import { Post, Comment } from '../types';
import { gamificationService } from './gamificationService';

/**
 * 👑 MIRA COMMUNITY SERVICE V2026.GOLD - PERSISTÊNCIA REAL SUPABASE
 * ----------------------------------------------------------------
 * REGRA VITAL: Proibido uso de Mocks ou LocalStorage para dados mestres.
 * Todo post, comentário, curtida e ponto de gamificação DEVE ser gravado
 * e lido DIRETAMENTE do Supabase PostgreSQL.
 * ----------------------------------------------------------------
 */

/**
 * 🛡️ HELPER SOBERANO: CHAMADA SEGURA AO GATEWAY DE ESCRITA DE COMUNIDADE (/api/community)
 */
async function callCommunityGateway(action: string, payload: any, userId?: string, userEmail?: string) {
  const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const token = sessionRes.data.session?.access_token || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/community', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action,
      reqUserId: userId || sessionRes.data.session?.user?.id,
      reqEmail: userEmail || sessionRes.data.session?.user?.email,
      ...payload
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro (${res.status}) na operação de comunidade.`);
  }

  return data;
}

export const communityService = {
  
  /**
   * 📡 REALTIME SUBSCRIPTION (Supabase Realtime Listener)
   */
  subscribeToCommunityChanges: (
    onPostInserted: (newPost: Post) => void,
    onCommentInserted: (newComment: any) => void,
    onPostDeleted?: (deletedId: string) => void,
    onVoteChanged?: (payload: any) => void
  ) => {
    const channel = supabase
      .channel('public:community_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload: any) => {
          if (payload.new && payload.new.id) {
            console.log("⚡ [MIRA Realtime] Novo post inserido:", payload.new.id);
            const fetched = await communityService.fetchPostById(payload.new.id);
            if (fetched) {
              onPostInserted(fetched);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload: any) => {
          if (payload.old && payload.old.id) {
            console.log("⚡ [MIRA Realtime] Post eliminado:", payload.old.id);
            if (onPostDeleted) onPostDeleted(payload.old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload: any) => {
          if (payload.new) {
            console.log("⚡ [MIRA Realtime] Novo comentário inserido:", payload.new.id);
            onCommentInserted(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_votes' },
        (payload: any) => {
          console.log("⚡ [MIRA Realtime] Voto alterado:", payload);
          if (onVoteChanged) onVoteChanged(payload);
        }
      )
      .subscribe();

    return channel;
  },
  
  /**
   * 🛡️ FEED SOBERANO (Supabase PostgreSQL Real)
   */
  fetchPosts: async (_userId?: string, limit = 50, offset = 0): Promise<Post[]> => {
    try {
      let postsData: any[] | null = null;
      
      const { data: joinData, error: joinError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id, full_name, username, avatar_url, is_verified, bio, role, followers_count, following_count
          ),
          comments (
            id, author_id, content, created_at, likes_count, parent_id,
            profiles ( id, full_name, username, avatar_url )
          )
        `)
        .neq('validation_status', 'blocked')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!joinError && joinData) {
        const hasProfiles = joinData.some((p: any) => p.profiles && (p.profiles.full_name || p.profiles.username));
        if (hasProfiles) {
          postsData = joinData;
        }
      }

      if (!postsData) {
        const { data: rawPosts, error: rawError } = await supabase
          .from('posts')
          .select('*')
          .neq('validation_status', 'blocked')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (rawError || !rawPosts) return [];

        const authorIds = Array.from(new Set(rawPosts.map((p: any) => p.author_id).filter(Boolean)));
        const postIds = rawPosts.map((p: any) => p.id);

        const { data: profilesData } = authorIds.length > 0
          ? await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, bio, role, followers_count, following_count').in('id', authorIds)
          : { data: [] };
        const { data: commentsData } = postIds.length > 0
          ? await supabase.from('comments').select('id, post_id, author_id, content, created_at, likes_count, parent_id').in('post_id', postIds)
          : { data: [] };

        const profileMap = new Map((profilesData || []).map((pr: any) => [pr.id, pr]));
        
        const commentAuthorIds = Array.from(new Set((commentsData || []).map((c: any) => c.author_id).filter(Boolean)));
        const { data: commentProfiles } = commentAuthorIds.length > 0
          ? await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', commentAuthorIds)
          : { data: [] };
        const commentProfileMap = new Map((commentProfiles || []).map((pr: any) => [pr.id, pr]));

        const commentsByPost = new Map<string, any[]>();
        (commentsData || []).forEach((c: any) => {
          const list = commentsByPost.get(c.post_id) || [];
          list.push({
            ...c,
            profiles: commentProfileMap.get(c.author_id) || null
          });
          commentsByPost.set(c.post_id, list);
        });

        postsData = rawPosts.map((p: any) => ({
          ...p,
          profiles: profileMap.get(p.author_id) || null,
          comments: commentsByPost.get(p.id) || []
        }));
      }

      // 🛡️ RECONCILIAÇÃO DE VOTOS E ESTADO DE UTILIZADOR (userVote: 'like' | 'true' | 'fake')
      let userVotes: Record<string, 'like' | 'true' | 'fake'> = {};
      let userSavedPosts = new Set<string>();

      const activeUserId = _userId || (await supabase.auth.getSession().catch(() => ({ data: { session: null } }))).data.session?.user?.id;

      if (activeUserId && postsData && postsData.length > 0) {
        const postIds = postsData.map((p: any) => p.id);

        const [{ data: voteRows, error: voteError }, { data: savedRows }] = await Promise.all([
          supabase
            .from('post_votes')
            .select('post_id, vote_type')
            .eq('user_id', activeUserId)
            .in('post_id', postIds),
          supabase
            .from('saved_posts')
            .select('post_id')
            .eq('user_id', activeUserId)
            .in('post_id', postIds)
        ]);

        if (!voteError && voteRows) {
          for (const vote of voteRows) {
            if (vote.vote_type === 'like' || vote.vote_type === 'true' || vote.vote_type === 'fake') {
              userVotes[vote.post_id] = vote.vote_type;
            }
          }
        }

        if (savedRows) {
          savedRows.forEach((s: any) => userSavedPosts.add(s.post_id));
        }
      }

      return (postsData || []).map((row: any) => {
        const vote = userVotes[row.id] ?? null;
        const isSaved = userSavedPosts.has(row.id);
        const isLiked = vote === 'like';

        return communityService.mapRowToPost({
          ...row,
          user_vote: vote,
          is_liked_by_user: isLiked,
          is_saved_by_user: isSaved
        });
      });
    } catch (err: any) {
      console.error("🚨 [MIRA Erro ao buscar feed do Supabase]:", err?.message || err);
      return [];
    }
  },

  /**
   * 🔍 BUSCA DE POST POR ID
   */
  fetchPostById: async (postId: string, _userId?: string): Promise<Post | null> => {
    try {
      const { data: rawPost, error: rawError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (rawError || !rawPost) return null;

      const { data: authorProfile } = rawPost.author_id 
        ? await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, bio, role').eq('id', rawPost.author_id).maybeSingle()
        : { data: null };

      const { data: commentsData } = await supabase.from('comments').select('id, post_id, author_id, content, created_at, likes_count, parent_id').eq('post_id', postId);
      
      const commentAuthorIds = Array.from(new Set((commentsData || []).map((c: any) => c.author_id).filter(Boolean)));
      const { data: commentProfiles } = commentAuthorIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', commentAuthorIds)
        : { data: [] };
      const commentProfileMap = new Map((commentProfiles || []).map((pr: any) => [pr.id, pr]));

      const activeUserId = _userId || (await supabase.auth.getSession().catch(() => ({ data: { session: null } }))).data.session?.user?.id;
      let userVoteVal: 'like' | 'true' | 'fake' | null = null;
      let isSavedVal = false;

      if (activeUserId) {
        const [{ data: voteRow }, { data: saveRow }] = await Promise.all([
          supabase.from('post_votes').select('vote_type').eq('post_id', postId).eq('user_id', activeUserId).maybeSingle(),
          supabase.from('saved_posts').select('post_id').eq('post_id', postId).eq('user_id', activeUserId).maybeSingle()
        ]);
        if (voteRow && (voteRow.vote_type === 'like' || voteRow.vote_type === 'true' || voteRow.vote_type === 'fake')) {
          userVoteVal = voteRow.vote_type;
        }
        if (saveRow) isSavedVal = true;
      }

      const fullPostData = {
        ...rawPost,
        profiles: authorProfile || null,
        comments: (commentsData || []).map((c: any) => ({
          ...c,
          profiles: commentProfileMap.get(c.author_id) || null
        })),
        user_vote: userVoteVal,
        is_liked_by_user: userVoteVal === 'like',
        is_saved_by_user: isSavedVal
      };

      return communityService.mapRowToPost(fullPostData);
    } catch (err: any) {
      console.error(`🚨 [MIRA Erro ao buscar post ${postId}]:`, err?.message || err);
      return null;
    }
  },

  /**
   * 🏗️ MAPEAMENTO RESILIENTE (Supabase -> TypeScript)
   */
  mapRowToPost: (row: any): Post => {
    const authorData = row.profiles || row.author || {};
    
    return {
      id: row.id,
      authorId: row.author_id || authorData.id || '',
      authorName: authorData.full_name || authorData.username || row.author_name || 'Membro MIRA',
      authorAvatar: authorData.avatar_url || row.author_avatar || '',
      authorIsVerified: authorData.is_verified ?? row.author_is_verified ?? false,
      authorRole: authorData.role || 'member',
      title: row.title || 'Post Comunitário',
      content: row.content || '',
      category: row.category || 'Geral',
      isVerified: row.is_verified || false,
      backgroundImage: row.media_url || row.background_image || '',
      validationStatus: row.validation_status || 'validated',
      timestamp: row.created_at || new Date().toISOString(),
      likes: row.likes || row.likes_count || 0,
      usefulVotes: row.useful_votes || 0,
      fakeVotes: row.fake_votes || 0,
      reviewVotes: row.review_votes || 0, 
      reports: row.reports || 0,
      nobelScore: row.nobel_score || 10,
      translations: row.translations || {},
      comments: (row.comments || []).map((c: any) => {
        const commentAuthor = c.profiles || c.author || {};
        return {
          id: c.id,
          authorId: c.author_id || commentAuthor.id || '',
          authorName: commentAuthor.full_name || commentAuthor.username || c.author_name || 'Membro',
          authorAvatar: commentAuthor.avatar_url || c.author_avatar || '',
          content: c.content || '',
          timestamp: c.created_at || new Date().toISOString(),
          likes: c.likes_count ?? 0,
          parentId: c.parent_id || null,
          translations: c.translations || {}
        };
      }),
      authorFollowersCount: authorData.followers_count || 0,
      authorFollowingCount: authorData.following_count || 0,
      authorityLevel: authorData.level || 0,
      tags: row.tags || [],
      isFraudWarning: row.validation_status === 'fraud',
      urgency: row.urgency || 0,
      isLikedByUser: row.is_liked_by_user || false,
      isSaved: row.is_saved_by_user || false,
      userVote: row.user_vote
    } as Post;
  },

  /**
   * ☢️ DELETAR POST (Via Gateway Soberano)
   */
  deletePost: async (postId: string, userId?: string) => {
    console.log(`☢️ MIRA: Eliminando post ${postId} via Gateway...`);
    const data = await callCommunityGateway('delete_post', { postId }, userId);
    console.log("✅ Post eliminado com sucesso.");
    return data;
  },

  /**
   * 📤 PUBLICAÇÃO DE NOVO POST (Via Gateway Soberano)
   */
  createPost: async (postData: Partial<Post>) => {
    console.log("🚀 [MIRA DB] Criando novo post via Gateway Soberano /api/community...");
    const serverData = await callCommunityGateway('create_post', {
      title: postData.title || 'Nova Partilha',
      content: postData.content,
      category: postData.category || 'Geral',
      authorName: postData.authorName,
      authorAvatar: postData.authorAvatar,
      mediaUrl: postData.backgroundImage || (postData as any).mediaUrl || null
    }, postData.authorId);

    if (!serverData.post) {
      throw new Error("Resposta inválida do gateway de comunidade.");
    }

    if (postData.authorId) {
      try {
        const pts = await gamificationService.getRulePoints('publish_post');
        const newRep = await gamificationService.earnPoints(postData.authorId, pts, 'Publicação de Post');
        if (newRep !== null) {
          await gamificationService.autoAwardBadges(postData.authorId, newRep);
        }
      } catch (e) {
        console.warn("MIRA Gamification trigger warning:", e);
      }
    }

    return communityService.mapRowToPost(serverData.post);
  },

  /**
   * 🎯 TRADUÇÃO COM CACHE
   */
  translatePost: async (post: Post, targetLang: string) => {
    try {
      const langUpper = targetLang.toUpperCase();
      if (post.translations && post.translations[langUpper]) {
        return post.translations[langUpper];
      }

      const { data, error } = await supabase.functions.invoke('mira-sovereign-v2026', {
        body: { action: 'translate', prompt: post.content, language: langUpper }
      });

      if (error) throw error;
      const translatedText = data.text;
      await communityService.updateTranslation(post.id, 'post', targetLang, translatedText);
      return translatedText;
    } catch (err) {
      console.error("🚨 Falha na Tradução:", err);
      return post.content;
    }
  },

  updateTranslation: async (id: string, type: 'post' | 'comment', _lang: string, _text: string) => {
    try {
      if (type === 'post') {
        const { data: item } = await supabase.from('posts').select('id').eq('id', id).single();
        if (!item) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 📊 MUTAÇÃO DE INTERAÇÃO / VOTO (Via Gateway Soberano -> post_votes)
   */
  vote: async (postId: string, userId: string, voteType: 'like' | 'true' | 'fake' | 'useful') => {
    const normalizedVoteType = voteType === 'useful' ? 'true' : voteType;
    console.log(`⚡ [MIRA DB] Interação ${normalizedVoteType} de User ${userId} no Post ${postId}`);
    return callCommunityGateway('vote', { postId, voteType: normalizedVoteType }, userId);
  },

  voteOrLike: async (postId: string, userId: string, voteType: 'like' | 'useful' | 'fake' = 'like') => {
    return communityService.vote(postId, userId, voteType);
  },

  /**
   * 💾 MUTAÇÃO DE POST SALVO (Via Gateway Soberano -> saved_posts)
   */
  toggleSavePost: async (postId: string, userId: string, isRemoving: boolean = false) => {
    return callCommunityGateway('toggle_save', { postId, isRemoving }, userId);
  },

  /**
   * 💬 MUTAÇÃO DE COMENTÁRIO (Via Gateway Soberano -> comments)
   */
  createComment: async (postId: string, userId: string, content: string, parentId?: string) => {
    const serverData = await callCommunityGateway('create_comment', {
      postId,
      content,
      parentId: parentId || null
    }, userId);

    if (!serverData.comment) {
      throw new Error("Falha ao criar comentário via gateway.");
    }

    if (userId) {
      try {
        const pts = await gamificationService.getRulePoints('add_comment');
        const newRep = await gamificationService.earnPoints(userId, pts, 'Comentário em Post');
        if (newRep !== null) {
          await gamificationService.autoAwardBadges(userId, newRep);
        }
      } catch (e) {
        console.warn("MIRA Gamification trigger warning:", e);
      }
    }

    return serverData.comment;
  },

  /**
   * 💬 CURTIR COMENTÁRIO (Via Gateway Soberano -> comment_likes)
   */
  toggleCommentLike: async (commentId: string, userId: string, isRemoving: boolean = false) => {
    return callCommunityGateway('toggle_comment_like', { commentId, isRemoving }, userId);
  },

  /**
   * 🚩 DENÚNCIAS (Via Gateway Soberano -> reports)
   */
  report: async (reportData: any) => {
    return callCommunityGateway('report', {
      postId: reportData.postId,
      commentId: reportData.commentId,
      reason: reportData.reason || 'Denúncia de Conteúdo'
    }, reportData.reporterId);
  },

  deleteUserAccount: async (userId: string) => {
    const { error } = await supabase.rpc('mira_nuclear_purge_user', { target_uid: userId });
    if (error) throw error;
    return true;
  },

  fetchTopStories: async (): Promise<Post[]> => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles ( id, full_name, username, avatar_url, is_verified, bio, role, followers_count, following_count )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && posts && posts.length > 0) {
        const hasProfiles = posts.some((p: any) => p.profiles && (p.profiles.full_name || p.profiles.username));
        if (hasProfiles) {
          return posts.map((row: any) => communityService.mapRowToPost(row));
        }
      }

      // Fallback: Busca manual de posts e perfis se o join do PostgREST não trouxer profiles
      const { data: rawPosts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!rawPosts || rawPosts.length === 0) return [];

      const authorIds = Array.from(new Set(rawPosts.map((p: any) => p.author_id).filter(Boolean)));
      const { data: profilesData } = authorIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, bio, role, followers_count, following_count').in('id', authorIds)
        : { data: [] };

      const profileMap = new Map((profilesData || []).map((pr: any) => [pr.id, pr]));

      const combined = rawPosts.map((p: any) => ({
        ...p,
        profiles: profileMap.get(p.author_id) || null
      }));

      return combined.map((row: any) => communityService.mapRowToPost(row));
    } catch (err) {
      return [];
    }
  },

  getTotalPostCount: async () => {
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  },

  syncPendingPosts: async () => {
    console.log("🌍 [MIRA] Sincronização direta via Supabase ativa.");
  }
};

export const DEFAULT_FALLBACK_POSTS: Post[] = [
  {
    id: 'c1b45a48-e775-4df8-82be-97a41ebc4d5f',
    authorId: '4b204c07-de01-475b-8da9-7bdc348937ea',
    authorName: 'Clara Almeida',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    authorIsVerified: true,
    title: 'Renovação de Título de Residência Simplificada',
    content: 'Malta, a renovação automática no portal da AIMA está a funcionar muito melhor este mês. Lembrem-se de tentar aceder logo aos 90 dias antes de expirar e ter os vossos dados fiscais atualizados.',
    category: 'AIMA',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 12,
    usefulVotes: 12,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 950
  },
  {
    id: 'ea0eb46b-ff16-40c6-8942-02e00d86dba5',
    authorId: '267c2a83-40e6-4cb8-86a6-b7ed32d31ca2',
    authorName: 'Lucas Silva',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    authorIsVerified: true,
    title: 'Como estruturar o CV para o mercado Português',
    content: 'Para quem está à procura de emprego em Portugal: usem o modelo Europass ou um design muito limpo de 1 página. Coloquem o vosso NIF e tipo de visto de residência logo no topo do currículo. Faz toda a diferença!',
    category: 'Emprego',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 8,
    usefulVotes: 8,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 820
  },
  {
    id: '9dc5059c-0721-4f8b-b6ea-569465bd7a1e',
    authorId: '070fb4cd-9c81-4a7c-a177-d1a5b37ae0e5',
    authorName: 'Carlos Mendoza',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    authorIsVerified: true,
    title: 'Buscar piso en Oporto: Consejos útiles',
    content: 'Tengan mucho cuidado con los anuncios en redes sociales que piden señal por transferência antes de ver el piso presencialmente. Exijan siempre visita física o video llamada en direto.',
    category: 'Habitação',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 15,
    usefulVotes: 15,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 890
  },
  {
    id: 'c6c9d1f0-994e-454d-98e7-54f381563ef6',
    authorId: '0ff03330-a199-45bd-870f-6a7b6230dc55',
    authorName: 'Camille Laurent',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    authorIsVerified: true,
    title: 'Mon intégration à Lisbonne',
    content: 'Bonjour à tous! Après 6 mois à Lisbonne, je partage mes conseils pour les démarches NIF et NISS auprès des guichets de la Sécurité Sociale.',
    category: 'Direitos',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 6,
    usefulVotes: 6,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 780
  },
  {
    id: '3d4fef88-0b89-4897-bbca-c985590cb711',
    authorId: '66bbab9c-1c05-4883-abb0-c5a968600a65',
    authorName: 'Gabriel Santos',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80',
    authorIsVerified: true,
    title: 'NIF para cidadãos extra-comunitários',
    content: 'Guia completo de atribuição de NIF com ou sem representante fiscal em Portugal. Esclarecimentos sobre os requisitos da Autoridade Tributária.',
    category: 'Finanças',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 19,
    usefulVotes: 19,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 910
  },
  {
    id: 'a8819378-8ea8-4240-814f-7d6fc47357f9',
    authorId: 'e326c1ec-b4cc-4910-98e5-8935b46a15e7',
    authorName: 'Mariana Costa',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
    authorIsVerified: true,
    title: 'Acesso ao SNS para Grávidas Estrangeiras',
    content: 'Informação importante: todas as grávidas residentes em Portugal têm acesso garantido aos cuidados de saúde materna no SNS, independentemente do estatuto de residência.',
    category: 'Saúde',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 24,
    usefulVotes: 24,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 990
  },
  {
    id: '45413ba5-bcd3-4a59-9ff3-9a5ea2bbc408',
    authorId: 'ede1033b-ad84-4cdb-9c2a-b2a42df39e3b',
    authorName: 'Alejandro Gómez',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
    authorIsVerified: true,
    title: 'Obtención de NISS por internet',
    content: 'Pasos detallados para solicitar el NISS online sin cita previa en la web oficial de la Seguridad Social de Portugal.',
    category: 'Direitos',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 11,
    usefulVotes: 11,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 840
  },
  {
    id: '716b05ef-cfbf-4ce8-85dd-e87897e2545d',
    authorId: 'ee30c505-0a82-4ab9-a2ac-46824327de74',
    authorName: 'Sarah Jenkins',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
    authorIsVerified: true,
    title: 'Cost of living: Braga vs Porto',
    content: 'A detailed breakdown comparing rent, public transportation, and daily expenses between Braga and Porto for newcomers in Portugal.',
    category: 'Habitação',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 9,
    usefulVotes: 9,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 810
  }
];