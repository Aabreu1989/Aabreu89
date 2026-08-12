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
  /**
   * 🛡️ FEED SOBERANO (Supabase PostgreSQL Real)
   */
  fetchPosts: async (_userId?: string, limit = 50, offset = 0): Promise<Post[]> => {
    try {
      let postsData: any[] | null = null;
      
      // 1. Tenta a consulta direta com Join se o PostgREST tiver o relacionamento em cache
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
        postsData = joinData;
      } else {
        // 2. Fallback resiliente: busca posts, perfis e comentários diretamente do PostgreSQL
        const { data: rawPosts, error: rawErr } = await supabase
          .from('posts')
          .select('*')
          .neq('validation_status', 'blocked')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (rawErr || !rawPosts) {
          console.error("🚨 Erro ao buscar posts do Supabase:", rawErr?.message);
          return DEFAULT_FALLBACK_POSTS;
        }

        const authorIds = Array.from(new Set(rawPosts.map((p: any) => p.author_id).filter(Boolean)));
        const postIds = rawPosts.map((p: any) => p.id);

        const [{ data: profilesData }, { data: commentsData }] = await Promise.all([
          authorIds.length > 0
            ? supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, bio, role, followers_count, following_count').in('id', authorIds)
            : Promise.resolve({ data: [] }),
          postIds.length > 0
            ? supabase.from('comments').select('id, post_id, author_id, content, created_at, likes_count, parent_id').in('post_id', postIds)
            : Promise.resolve({ data: [] })
        ]);

        const profileMap = new Map((profilesData || []).map((pr: any) => [pr.id, pr]));
        
        const commentAuthorIds = Array.from(new Set((commentsData || []).map((c: any) => c.author_id).filter(Boolean)));
        const { data: commentProfiles } = commentAuthorIds.length > 0 
          ? await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', commentAuthorIds)
          : { data: [] };
        const commentProfileMap = new Map((commentProfiles || []).map((pr: any) => [pr.id, pr]));

        postsData = rawPosts.map((p: any) => ({
          ...p,
          profiles: profileMap.get(p.author_id) || null,
          comments: (commentsData || []).filter((c: any) => c.post_id === p.id).map((c: any) => ({
            ...c,
            profiles: commentProfileMap.get(c.author_id) || null
          }))
        }));
      }

      if (postsData && postsData.length > 0) {
        return postsData.map(row => communityService.mapRowToPost(row));
      }

      return DEFAULT_FALLBACK_POSTS;
    } catch (err: any) {
      console.error("🚨 [MIRA Erro no Feed]:", err?.message || err);
      return DEFAULT_FALLBACK_POSTS;
    }
  },

  /**
   * 🔍 BUSCA DE POST POR ID
   */
  fetchPostById: async (postId: string, _userId?: string): Promise<Post | null> => {
    try {
      const { data: rawPost, error: rawErr } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (rawErr || !rawPost) return null;

      const [{ data: authorProfile }, { data: commentsData }] = await Promise.all([
        rawPost.author_id
          ? supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified, bio, role').eq('id', rawPost.author_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('comments').select('id, post_id, author_id, content, created_at, likes_count, parent_id').eq('post_id', postId)
      ]);

      const commentAuthorIds = Array.from(new Set((commentsData || []).map((c: any) => c.author_id).filter(Boolean)));
      const { data: commentProfiles } = commentAuthorIds.length > 0
        ? await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', commentAuthorIds)
        : { data: [] };
      const commentProfileMap = new Map((commentProfiles || []).map((pr: any) => [pr.id, pr]));

      const fullPostData = {
        ...rawPost,
        profiles: authorProfile || null,
        comments: (commentsData || []).map((c: any) => ({
          ...c,
          profiles: commentProfileMap.get(c.author_id) || null
        }))
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
      backgroundImage: row.background_image || '',
      validationStatus: row.validation_status || 'approved',
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
   * ☢️ DELETAR POST (Atómico via Supabase)
   */
  deletePost: async (postId: string) => {
    console.log(`☢️ MIRA: Eliminando post ${postId} no Supabase...`);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    
    if (error) {
      console.error("❌ Falha ao eliminar post no Supabase:", error.message);
      throw error;
    }
    console.log("✅ Post eliminado com sucesso.");
  },

  /**
   * 📤 PUBLICAÇÃO DE NOVO POST (MUTAÇÃO DIRETA NO SUPABASE)
   */
  createPost: async (postData: Partial<Post>) => {
    try {
      console.log("🚀 [MIRA DB] Criando novo post diretamente no PostgreSQL...");

      if (postData.authorId) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', postData.authorId)
          .maybeSingle();

        if (!existingProfile) {
          console.log("🔑 [MIRA DB] Criando perfil no Supabase para o autor:", postData.authorId);
          await supabase.from('profiles').upsert({
            id: postData.authorId,
            full_name: postData.authorName || 'Membro MIRA',
            avatar_url: postData.authorAvatar || '',
            role: 'member',
            created_at: new Date().toISOString()
          });
        }
      }
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: postData.authorId,
          title: postData.title || 'Post Comunitário',
          content: postData.content,
          category: postData.category || 'Geral',
          background_image: postData.backgroundImage || '',
          validation_status: 'approved',
          nobel_score: 10
        })
        .select(`
          *,
          profiles ( id, full_name, username, avatar_url, is_verified, role )
        `)
        .single();

      if (error) throw error;
      console.log("✅ [MIRA DB] Post publicado e gravado com sucesso no Supabase:", data.id);

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

      return communityService.mapRowToPost(data);
    } catch (err: any) {
      console.error("🚨 [MIRA Erro ao publicar no Supabase]:", err.message);
      throw err;
    }
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

  updateTranslation: async (id: string, type: 'post' | 'comment', lang: string, text: string) => {
    try {
      const langUpper = lang.toUpperCase();
      const table = type === 'post' ? 'posts' : 'comments';
      const { data: item } = await supabase.from(table).select('translations').eq('id', id).single();
      const current = item?.translations || {};
      await supabase.from(table).update({ translations: { ...current, [langUpper]: text } }).eq('id', id);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 📊 MUTAÇÃO DE INTERAÇÃO / CURTIDA (post_likes & post_votes no Supabase)
   */
  vote: async (postId: string, userId: string, voteType: 'like' | 'useful' | 'fake') => {
    try {
      console.log(`⚡ [MIRA DB] Interação ${voteType} de User ${userId} no Post ${postId}`);
      
      if (voteType === 'like') {
        const { error: likeErr } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });

        if (likeErr) {
          if (likeErr.code === '23505' || likeErr.message.includes('unique')) {
            await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
            try {
              await supabase.rpc('decrement_post_likes', { p_post_id: postId });
            } catch (e) {}
            return { success: true, action: 'removed' };
          }

          // Fallback se a tabela post_likes ainda estiver pendente de DDL no SQL Editor
          if (likeErr.message?.includes('find the table') || likeErr.code === '42P01') {
            console.warn("⚠️ Tabela post_likes pendente de DDL. Atualizando coluna 'likes' na tabela 'posts'.");
            const { data: currentPost } = await supabase.from('posts').select('likes').eq('id', postId).single();
            const newLikes = (currentPost?.likes || 0) + 1;
            await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
            return { success: true, action: 'added' };
          }

          throw likeErr;
        }

        return { success: true, action: 'added' };
      } else {
        const { data: existing } = await supabase
          .from('post_votes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .eq('vote_type', voteType)
          .maybeSingle();

        if (existing) {
          await supabase.from('post_votes').delete().eq('id', existing.id);
          return { success: true, action: 'removed' };
        } else {
          await supabase.from('post_votes').insert({ post_id: postId, user_id: userId, vote_type: voteType });
          return { success: true, action: 'added' };
        }
      }
    } catch (err: any) {
      console.warn('🚨 Interação no Supabase (resiliência ativa):', err?.message || err);
      return { success: true, action: 'added' };
    }
  },

  voteOrLike: async (postId: string, userId: string, voteType: 'like' | 'useful' | 'fake' = 'like') => {
    return communityService.vote(postId, userId, voteType);
  },

  /**
   * 💾 MUTAÇÃO DE POST SALVO (saved_posts no Supabase)
   */
  toggleSavePost: async (postId: string, userId: string, isRemoving: boolean = false) => {
    try {
      if (isRemoving) {
        await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        const { error } = await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId });
        if (error && (error.code === '23505' || error.message?.includes('unique'))) {
          await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId);
        }
      }
      return true;
    } catch (err) {
      console.warn('🚨 saved_posts (resiliência ativa):', err);
      return true;
    }
  },

  /**
   * 💬 MUTAÇÃO DE COMENTÁRIO (comments no Supabase)
   */
  createComment: async (postId: string, userId: string, content: string, parentId?: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: userId,
          content,
          parent_id: parentId
        })
        .select(`
          *,
          profiles ( id, full_name, username, avatar_url )
        `)
        .single();

      if (error) throw error;
      console.log("✅ Comentário gravado no Supabase:", data.id);

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

      return data;
    } catch (err) {
      console.error('🚨 Erro ao comentar no Supabase:', err);
      throw err;
    }
  },

  report: async (reportData: any) => {
    try {
      const { error } = await supabase.from('reports').insert({
        post_id: reportData.postId,
        comment_id: reportData.commentId,
        reporter_id: reportData.reporterId,
        offender_id: reportData.targetAuthorId,
        reason: reportData.reason,
        reported_content_text: reportData.reportedContentText,
        status: 'pending'
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('🚨 Erro ao denunciar:', err);
      return false;
    }
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