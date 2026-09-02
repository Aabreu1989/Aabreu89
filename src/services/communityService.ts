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
  let sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  let token = sessionRes.data.session?.access_token || '';

  // 🛡️ REVALIDAÇÃO PROATIVA DE JWT: Se não houver token ou se estiver perto de expirar, renovar sessão
  if (!token || (sessionRes.data.session?.expires_at && sessionRes.data.session.expires_at < (Date.now() / 1000) + 30)) {
    const refreshRes = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
    if (refreshRes.data.session?.access_token) {
      token = refreshRes.data.session.access_token;
      sessionRes = refreshRes;
    }
  }

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
   * 🛡️ FEED SOBERANO (Supabase PostgreSQL Real via RPC get_sovereign_community_feed_v25 reconciliado)
   */
  fetchPosts: async (_userId?: string, limit = 50, offset = 0): Promise<Post[]> => {
    try {
      const activeUserId = _userId || (await supabase.auth.getSession().catch(() => ({ data: { session: null } }))).data.session?.user?.id || null;

      const [feedResult, baselineResult] = await Promise.all([
        supabase.rpc('get_sovereign_community_feed_v25', {
          p_limit: limit,
          p_offset: offset,
          p_user_id: activeUserId
        }),
        supabase.from('posts').select('id, likes, likes_count')
      ]);

      const rpcData = feedResult.data;
      const rpcError = feedResult.error;

      if (!rpcError && Array.isArray(rpcData)) {
        const baselineMap = new Map<string, number>();
        baselineResult.data?.forEach(b => {
          baselineMap.set(b.id, b.likes ?? b.likes_count ?? 0);
        });

        return rpcData.map((row: any) => communityService.mapRowToPost(row, baselineMap.get(row.id) || 0));
      }

      if (rpcError) {
        console.warn("⚠️ [MIRA Community] Aviso ao executar get_sovereign_community_feed_v25:", rpcError.message);
      }

      return [];
    } catch (err: any) {
      console.error("🚨 [MIRA Erro ao buscar feed do Supabase]:", err?.message || err);
      return [];
    }
  },

  /**
   * 🔍 BUSCA DE POST POR ID (Via RPC Soberana get_sovereign_community_post_by_id_v25)
   */
  fetchPostById: async (postId: string, _userId?: string): Promise<Post | null> => {
    try {
      const [feedResult, baselineResult] = await Promise.all([
        supabase.rpc('get_sovereign_community_post_by_id_v25', {
          p_post_id: postId,
          p_user_id: null
        }),
        supabase.from('posts').select('id, likes, likes_count').eq('id', postId).maybeSingle()
      ]);

      const rpcData = feedResult.data;
      const rpcError = feedResult.error;

      if (rpcError) {
        console.warn(
          `⚠️ [MIRA Community] Aviso ao buscar post ${postId} via RPC:`,
          rpcError.message
        );
        return null;
      }

      if (Array.isArray(rpcData) && rpcData.length > 0) {
        const baseLikes = baselineResult.data?.likes ?? baselineResult.data?.likes_count ?? 0;
        return communityService.mapRowToPost(rpcData[0], baseLikes);
      }

      return null;
    } catch (err: any) {
      console.error(
        `🚨 [MIRA Erro ao buscar post ${postId}]:`,
        err?.message || err
      );
      return null;
    }
  },

  /**
   * 🏗️ MAPEAMENTO RESILIENTE (Supabase -> TypeScript)
   */
  mapRowToPost: (row: any, baselineLikes = 0): Post => {
    const authorData = (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles) || row.author || {};
    const authorNameVal = row.author_name || authorData.name || authorData.full_name || authorData.username || 'Membro MIRA';
    const authorAvatarVal = row.author_avatar || authorData.avatar_url || '';
    const authorIsVerifiedVal = row.author_is_verified ?? authorData.is_verified ?? false;
    
    // 🛡️ RECONCILIAÇÃO CANÓNICA: Baseline histórico de posts.likes + Votos relacionais de post_votes
    const dynamicVotes = (typeof row.likes === 'number') ? row.likes : 0;
    const baseLikes = baselineLikes || (row.likes_count ?? 0);
    const totalLikes = baseLikes + dynamicVotes;

    return {
      id: row.id,
      authorId: row.author_id || authorData.id || '',
      authorName: authorNameVal,
      authorAvatar: authorAvatarVal,
      authorIsVerified: authorIsVerifiedVal,
      authorRole: authorData.role || 'member',
      title: row.title || 'Post Comunitário',
      content: row.content || '',
      category: row.category || 'Geral',
      isVerified: row.is_verified || false,
      backgroundImage: row.background_image || row.media_url || '',
      validationStatus: row.validation_status || 'validated',
      timestamp: row.created_at || new Date().toISOString(),
      likes: totalLikes,
      usefulVotes: row.useful_votes || 0,
      fakeVotes: row.fake_votes || 0,
      reviewVotes: row.review_votes || 0, 
      reports: row.reports || 0,
      nobelScore: row.nobel_score || 10,
      translations: row.translations || {},
      comments: (row.comments || []).map((c: any) => {
        const commentAuthor = (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) || c.author || {};
        const commentAuthorName = c.author_name || commentAuthor.name || commentAuthor.full_name || commentAuthor.username || 'Membro';
        const commentAuthorAvatar = c.author_avatar || commentAuthor.avatar_url || '';
        return {
          id: c.id,
          authorId: c.author_id || commentAuthor.id || '',
          authorName: commentAuthorName,
          authorAvatar: commentAuthorAvatar,
          content: c.content || '',
          timestamp: c.created_at || new Date().toISOString(),
          likes: c.likes ?? c.likes_count ?? 0,
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
   * 🗑️ DELETAR COMENTÁRIO (Via Gateway Soberano)
   */
  deleteComment: async (commentId: string, userId?: string) => {
    console.log(`🗑️ MIRA: Eliminando comentário ${commentId} via Gateway...`);
    const data = await callCommunityGateway('delete_comment', { commentId }, userId);
    console.log("✅ Comentário eliminado com sucesso do PostgreSQL.");
    return data;
  },

  /**
   * 🛡️ VERIFICAR POST (ADMIN ONLY - Via Gateway Soberano)
   */
  verifyPost: async (postId: string, isVerified: boolean, userId?: string) => {
    console.log(`🛡️ MIRA: Atualizando verificação do post ${postId} para ${isVerified} via Gateway...`);
    const data = await callCommunityGateway('verify_post', { postId, isVerified }, userId);
    console.log("✅ Verificação do post atualizada com sucesso.");
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
   * 🎯 TRADUÇÃO VIA GATEWAY SOBERANO (/api/chat)
   */
  translatePost: async (post: Post, targetLang: string) => {
    try {
      const langUpper = targetLang.toUpperCase();
      if (post.translations && post.translations[langUpper]) {
        return post.translations[langUpper];
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          prompt: post.content,
          language: langUpper
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data && data.text && data.text.trim()) {
        const translatedText = data.text.trim();
        await communityService.updateTranslation(post.id, 'post', targetLang, translatedText);
        return translatedText;
      }

      return post.content;
    } catch (err) {
      console.error("🚨 Falha na Tradução via /api/chat:", err);
      return post.content;
    }
  },

  translateComment: async (commentId: string, targetLang: string, content: string) => {
    try {
      const langUpper = targetLang.toUpperCase();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          prompt: content,
          language: langUpper
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data && data.text && data.text.trim()) {
        return data.text.trim();
      }

      return content;
    } catch (err) {
      console.error("🚨 Falha na Tradução de comentário via /api/chat:", err);
      return content;
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
  vote: async (postId: string, userId?: string, voteType: 'like' | 'true' | 'fake' | 'useful' = 'like') => {
    let activeUserId = userId;
    if (!activeUserId) {
      const sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      activeUserId = sessionRes.data.session?.user?.id;
    }
    const normalizedVoteType = voteType === 'useful' ? 'true' : voteType;
    console.log(`⚡ [MIRA DB] Interação ${normalizedVoteType} de User ${activeUserId} no Post ${postId}`);
    return callCommunityGateway('vote', { postId, voteType: normalizedVoteType }, activeUserId);
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
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_sovereign_community_feed_v25', {
        p_limit: 10,
        p_offset: 0,
        p_user_id: null
      });

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData.map((row: any) => communityService.mapRowToPost(row));
      }

      return [];
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
    try {
      const { syncService } = await import('./syncService');
      await syncService.sync();
      console.log("🌍 [MIRA] Sincronização offline delegada ao SyncService.");
    } catch (e) {
      console.warn("MIRA: Erro ao sincronizar fila offline:", e);
    }
  }
};

export const DEFAULT_FALLBACK_POSTS: Post[] = [
  {
    id: 'f0f94365-1ec3-405e-9d3d-6c90d55fef4b',
    authorId: '70b7679d-b809-48df-b7c7-bf0906e4caf5',
    authorName: 'Amanda Abreu',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
    authorIsVerified: true,
    title: 'AIMA 2026: O que mudou após a revogação da Manifestação de Interesse',
    content: 'Comunidade MIRA, é fundamental lembrar: a Manifestação de Interesse (Art. 88.2 e 89.2) foi formalmente revogada pelo Decreto-Lei 37-A/2024. Atualmente, a entrada em Portugal para trabalho exige Visto Consular prévio. Para quem já está em processo, acompanhem sempre as convocações oficiais no portal AIMA e mantenham os vossos contactos atualizados.',
    category: 'Residência & Vistos',
    backgroundImage: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 1000
  },
  {
    id: 'c1b45a48-e775-4df8-82be-97a41ebc4d5f',
    authorId: '4b204c07-de01-475b-8da9-7bdc348937ea',
    authorName: 'Clara Almeida',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    authorIsVerified: true,
    title: 'Renovação de Título de Residência Simplificada',
    content: 'Malta, a renovação automática no portal da AIMA está a funcionar muito melhor este mês. Lembrem-se de tentar aceder logo aos 90 dias antes de expirar e ter os vossos dados fiscais atualizados.',
    category: 'Residência & Vistos',
    backgroundImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
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
    category: 'Trabalho & Carreira',
    backgroundImage: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 820
  },
  {
    id: 'a8819378-8ea8-4240-814f-7d6fc47357f9',
    authorId: 'e326c1ec-b4cc-4910-98e5-8935b46a15e7',
    authorName: 'Mariana Costa',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80',
    authorIsVerified: true,
    title: 'Acesso ao SNS para Grávidas Estrangeiras',
    content: 'Informação importante: todas as grávidas residentes em Portugal têm acesso garantido aos cuidados de saúde materna no SNS, independentemente do estatuto de residência.',
    category: 'Saúde & SNS',
    backgroundImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 990
  },
  {
    id: '3d4fef88-0b89-4897-bbca-c985590cb711',
    authorId: '66bbab9c-1c05-4883-abb0-c5a968600a65',
    authorName: 'Gabriel Santos',
    authorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&q=80',
    authorIsVerified: true,
    title: 'NIF para cidadãos extra-comunitários',
    content: 'Guia completo de atribuição de NIF com ou sem representante fiscal em Portugal. Esclarecimentos sobre os requisitos da Autoridade Tributária.',
    category: 'Finanças & Impostos',
    backgroundImage: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 910
  },
  {
    id: '45413ba5-bcd3-4a59-9ff3-9a5ea2bbc408',
    authorId: 'ede1033b-ad84-4cdb-9c2a-b2a42df39e3b',
    authorName: 'Alejandro Gómez',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80',
    authorIsVerified: true,
    title: 'Obtención de NISS por internet',
    content: 'Pasos detallados para solicitar el NISS online sin cita previa en la web oficial de la Seguridad Social de Portugal.',
    category: 'Direitos & Apoio Social',
    backgroundImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 840
  },
  {
    id: '9dc5059c-0721-4f8b-b6ea-569465bd7a1e',
    authorId: '070fb4cd-9c81-4a7c-a177-d1a5b37ae0e5',
    authorName: 'Carlos Mendoza',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    authorIsVerified: true,
    title: 'Buscar piso en Oporto: Consejos útiles',
    content: 'Tengan mucho cuidado con los anuncios en redes sociales que piden señal por transferência antes de ver el piso presencialmente. Exijan siempre visita física o video llamada en direto.',
    category: 'Habitação & Casa',
    backgroundImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 890
  },
  {
    id: '716b05ef-cfbf-4ce8-85dd-e87897e2545d',
    authorId: 'ee30c505-0a82-4ab9-a2ac-46824327de74',
    authorName: 'Sarah Jenkins',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
    authorIsVerified: true,
    title: 'Cost of living: Braga vs Porto',
    content: 'A detailed breakdown comparing rent, public transportation, and daily expenses between Braga and Porto for newcomers in Portugal.',
    category: 'Habitação & Casa',
    backgroundImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 810
  },
  {
    id: 'c6c9d1f0-994e-454d-98e7-54f381563ef6',
    authorId: '0ff03330-a199-45bd-870f-6a7b6230dc55',
    authorName: 'Camille Laurent',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    authorIsVerified: true,
    title: 'Mon intégration à Lisbonne & cours de portugais gratuits',
    content: 'Bonjour à tous! Após 6 meses a Lisboa, partilho as minhas dicas para os procedimentos de NIF e NISS junto dos balcões da Segurança Social.',
    category: 'Educação & Formação',
    backgroundImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 0,
    usefulVotes: 0,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 780
  }
];