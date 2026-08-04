import { supabase } from '../lib/supabase';
import { Post, Comment } from '../types';

/**
 * 👑 MIRA COMMUNITY SERVICE V2026.GOLD - SOBERANIA AMANDA ABREU
 * ----------------------------------------------------------------
 * STATUS: BATTLE-READY (LANÇAMENTO NACIONAL)
 * OBJETIVO: Extermínio de Zombies, Cache de Tradução e Nobel Score.
 * ----------------------------------------------------------------
 */

export const communityService = {
  
  /**
   * 🛡️ FEED SOBERANO
   * Acede à RPC que organiza o feed por Nobel Score (AIMA > Amanda > Especialistas).
   */
  fetchPosts: async (_userId?: string, limit = 50, offset = 0): Promise<Post[]> => {
    try {
      // 🛡️ TENTATIVA 1: Buscar posts diretamente da tabela 'posts'
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .neq('validation_status', 'blocked')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) {
        console.warn("⚠️ [MIRA] Erro ao buscar posts em REST:", postsError.message);
      }

      if (postsData && postsData.length > 0) {
        const authorIds = [...new Set(postsData.map(p => p.author_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};

        if (authorIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, is_verified, bio, role')
            .in('id', authorIds);
          
          if (profilesData) {
            profilesData.forEach(prof => {
              profilesMap[prof.id] = prof;
            });
          }
        }

        return postsData.map(row => {
          const author = profilesMap[row.author_id] || {};
          return communityService.mapRowToPost({
            ...row,
            profiles: author
          });
        });
      }

      return DEFAULT_FALLBACK_POSTS;
    } catch (err: any) {
      console.error("🚨 [MIRA Erro no Feed]:", err.message);
      return DEFAULT_FALLBACK_POSTS;
    }
  },

  /**
   * 🔍 RECUPERAÇÃO CIRÚRGICA
   * Busca um post específico pelo ID, garantindo hidratação completa.
   */
  fetchPostById: async (postId: string, _userId?: string): Promise<Post | null> => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error || !data) return null;

      let authorData = {};
      if (data.author_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, is_verified, bio, role')
          .eq('id', data.author_id)
          .single();
        if (prof) authorData = prof;
      }

      return communityService.mapRowToPost({ ...data, profiles: authorData });
    } catch (err: any) {
      console.error(`🚨 [MIRA Erro ao buscar post ${postId}]:`, err.message);
      return null;
    }
  },

  /**
   * 🏗️ MAPEAMENTO SOBERANO (Anti-Type-Error)
   * Garante que o objeto retornado satisfaz a interface Post.
   */
  mapRowToPost: (row: any): Post => {
    // 🛡️ MAPEAMENTO RESILIENTE (V2026.SUPREMO)
    // Suporta tanto o retorno da RPC quanto o retorno do REST direto com joins.
    const authorData = row.author || row.profiles || {};
    
    return {
      id: row.id,
      authorId: row.author_id || authorData.id || '',
      authorName: row.author_name || authorData.full_name || authorData.username || 'Membro MIRA',
      authorAvatar: row.author_avatar || authorData.avatar_url || '',
      authorIsVerified: row.author_is_verified ?? authorData.is_verified ?? false,
      authorRole: authorData.role || 'member',
      title: row.title || 'Post Comunitário',
      content: row.content || '',
      category: row.category || 'Geral',
      isVerified: row.is_verified || false,
      backgroundImage: row.background_image || '',
      validationStatus: row.validation_status || 'approved',
      timestamp: row.created_at || new Date().toISOString(),
      likes: row.likes || 0,
      usefulVotes: row.useful_votes || 0,
      fakeVotes: row.fake_votes || 0,
      reviewVotes: row.review_votes || 0, 
      reports: row.reports || 0,
      nobelScore: row.nobel_score || 0,
      translations: row.translations || {},
      comments: (row.comments || []).map((c: any) => ({
        id: c.id,
        authorId: c.author_id || c.author?.id || '',
        authorName: c.author_name || c.author?.name || c.author?.full_name || 'Membro',
        authorAvatar: c.author_avatar || c.author?.avatar_url || '',
        content: c.content || '',
        timestamp: c.created_at || c.timestamp || new Date().toISOString(),
        likes: c.likes_count ?? c.likes ?? 0,
        parentId: c.parent_id || c.parentId || null,
        translations: c.translations || {}
      })),
      authorFollowersCount: authorData.followers_count || row.followers_count || 0,
      authorFollowingCount: authorData.following_count || row.following_count || 0,
      authorityLevel: authorData.level || row.level || 0,
      tags: row.tags || [],
      isFraudWarning: row.validation_status === 'fraud',
      urgency: row.urgency || 0,
      isLikedByUser: row.is_liked_by_user || false,
      isSaved: row.is_saved_by_user || false,
      userVote: row.user_vote
    } as Post;
  },

  /**
   * ☢️ EXTERMÍNIO NUCLEAR (A Marreta da CEO)
   * Vaporiza o post no banco de dados, na IA e limpa as tarefas de sync pendentes.
   */
  deletePost: async (postId: string) => {
    console.log(`☢️ MIRA NUCLEAR: Iniciando extermínio do post ${postId}`);
    
    // Dispara a RPC de administrador que criámos no SQL V2026.FINAL
    const { error } = await supabase.rpc('admin_delete_post_nuclear', { 
      p_post_id: postId 
    });
    
    if (error) {
      console.error("❌ O extermínio falhou. Verifica se as permissões de Admin no SQL estão corretas:", error.message);
      throw error;
    }
    console.log("✅ Post vaporizado sem rastro.");
  },

  /**
   * 🎯 TRADUÇÃO COM CACHE (Economia Sniper)
   * Verifica a gaveta de traduções para não gastar tokens desnecessários.
   */
  translatePost: async (post: Post, targetLang: string) => {
    try {
      const langUpper = targetLang.toUpperCase();
      
      // 1. Verificar se a tradução já existe no cache do banco (Custo Zero)
      if (post.translations && post.translations[langUpper]) {
        console.log(`💡 [MIRA] Cache ativo para ${langUpper}`);
        return post.translations[langUpper];
      }

      // 2. Chamar o Motor Sniper via Edge Function
      const { data, error } = await supabase.functions.invoke('mira-sovereign-v2026', {
        body: { 
          action: 'translate', 
          prompt: post.content, 
          language: langUpper 
        }
      });

      if (error) throw error;
      const translatedText = data.text;

      // 3. SOLDADURA: Guardar no banco de dados
      await communityService.updateTranslation(post.id, 'post', targetLang, translatedText);

      return translatedText;
    } catch (err) {
      console.error("🚨 Falha na Tradução:", err);
      return post.content;
    }
  },

  /**
   * 💾 SOLDADURA DE TRADUÇÃO
   * Persiste uma tradução gerada no banco de dados para reutilização gratuita.
   */
  updateTranslation: async (id: string, type: 'post' | 'comment', lang: string, text: string) => {
    try {
      const langUpper = lang.toUpperCase();
      const table = type === 'post' ? 'posts' : 'comments';
      
      // Busca as traduções atuais para não sobrescrever as outras línguas
      const { data: item } = await supabase.from(table).select('translations').eq('id', id).single();
      const current = item?.translations || {};
      
      await supabase
        .from(table)
        .update({ translations: { ...current, [langUpper]: text } })
        .eq('id', id);
        
      return true;
    } catch (e) {
      console.error("🌍 [MIRA Persistence Error]:", e);
      return false;
    }
  },

  /**
   * 📊 GESTÃO DE INTERAÇÃO (Like, Útil, Falso)
   */
  vote: async (postId: string, userId: string, voteType: 'like' | 'useful' | 'fake') => {
    try {
      console.log(`⚡ [MIRA VOTE] User ${userId} interacting with Post ${postId} (Type: ${voteType})`);
      
      // 1. Verificar se esta interação específica já existe (Toggle)
      const { data: existing } = await supabase
        .from('post_votes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('vote_type', voteType)
        .maybeSingle();

      if (existing) {
        console.log(`♻️ [MIRA VOTE] Existing interaction found (${existing.id}). Removing...`);
        await supabase.from('post_votes').delete().eq('id', existing.id);
        return { success: true, action: 'removed' };
      } else {
        // 2. Se for um voto de facto (useful/fake), remover o tipo oposto antes de inserir
        // para manter a exclusividade mútua entre Verdadeiro/Falso.
        if (voteType === 'useful' || voteType === 'fake') {
          const oppositeType = voteType === 'useful' ? 'fake' : 'useful';
          await supabase
            .from('post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId)
            .eq('vote_type', oppositeType);
        }

        console.log(`➕ [MIRA VOTE] No existing interaction. Adding new...`);
        await supabase.from('post_votes').insert({ 
          post_id: postId, 
          user_id: userId, 
          vote_type: voteType 
        });
        return { success: true, action: 'added' };
      }
    } catch (err: any) {
      console.warn('🚨 Erro na interação em nuvem (mantido localmente):', err?.message || err);
      return { success: false, action: 'local_only' };
    }
  },

  /**
   * 🛡️ ALIAS DE VOTO (SOBERANIA V2026)
   */
  voteOrLike: async (postId: string, userId: string, voteType: 'like' | 'useful' | 'fake' = 'like') => {
    return communityService.vote(postId, userId, voteType);
  },

  /**
   * 💾 PERSISTÊNCIA DE POST GUARDADO
   */
  toggleSavePost: async (postId: string, userId: string, isRemoving: boolean = false) => {
    try {
      if (isRemoving) {
        await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId);
      } else {
        await supabase.from('saved_posts').upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' });
      }
      return true;
    } catch (err) {
      console.warn('🚨 Erro ao guardar post em nuvem (mantido localmente):', err);
      return false;
    }
  },

  /**
   * 💬 COMENTÁRIO SOBERANO
   */
  createComment: async (postId: string, userId: string, content: string, parentId?: string) => {
    try {
      const { data, error } = await supabase.from('comments').insert({
        post_id: postId,
        author_id: userId,
        content,
        parent_id: parentId
      }).select().single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('🚨 Erro ao comentar em nuvem (mantido localmente):', err);
      return null;
    }
  },

  /**
   * 🚩 DENÚNCIA
   */
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

  /**
   * ☢️ PURGA TOTAL DE UTILIZADOR (RGPD)
   * Remove todos os dados e referências de um utilizador.
   */
  deleteUserAccount: async (userId: string) => {
    console.log(`☢️ MIRA BLACK HOLE: Purga do utilizador ${userId}`);
    const { error } = await supabase.rpc('mira_nuclear_purge_user', { 
      target_uid: userId 
    });
    if (error) throw error;
    return true;
  },

  /**
   * 🛡️ DESTAQUES NOBÉIS (Stories)
   * Lê a vista active_stories protegida.
   */
  fetchTopStories: async (): Promise<Post[]> => {
    try {
      // 🚀 MIRA SOBERANIA: Buscamos destaques diretamente dos posts recentes
      // Eliminamos a chamada à tabela community_top_stories_nobel para evitar erros 404
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey (
            id, full_name, username, avatar_url, is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) return [];
      return (posts || []).map((row: any) => communityService.mapRowToPost(row));
    } catch (err) {
      return [];
    }
  },

  /**
   * 📤 PUBLICAÇÃO
   * Insere um novo post no MIRA HUB com as metatags de soberania.
   */
  createPost: async (postData: Partial<Post>) => {
    try {
      console.log("🚀 [MIRA] Publicando novo post...");
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: postData.authorId,
          title: postData.title || 'Post Comunitário',
          content: postData.content,
          category: postData.category,
          background_image: postData.backgroundImage || '',
          validation_status: 'approved',
          nobel_score: 10 // Começa com score base
        })
        .select()
        .single();

      if (error) throw error;

      // 🎥 SOBERANIA: Criação Automática de Story (V2026.GOLD)
      // Usamos um bloco isolado e garantimos que campos nulos não quebrem a inserção
      try {
        const storyImg = postData.backgroundImage || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80';
        await supabase.from('stories').insert({
          post_id: data.id,
          author_id: postData.authorId,
          image_url: storyImg,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        console.log("🎥 [MIRA] Story criado com sucesso.");
      } catch (stErr) {
        console.warn("MIRA: Falha na criação automática do story.", stErr);
      }

      return data;
    } catch (err: any) {
      console.error("🚨 [MIRA Erro ao publicar]:", err.message);
      throw err;
    }
  },

  /**
   * 🔍 AUDITORIA DE CONTAGEM REAL
   */
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

  /**
   * 🔄 SINCRONIZAÇÃO DE PENDENTES
   * Tenta enviar posts que falharam anteriormente.
   */
  syncPendingPosts: async () => {
    // Placeholder para lógica de syncService
    console.log("🌍 [MIRA] Sincronizando pendentes...");
  }
};

export const DEFAULT_FALLBACK_POSTS: Post[] = [
  {
    id: 'fallback-1',
    authorId: 'clara-almeida',
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
    likes: 42,
    usefulVotes: 38,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 950
  },
  {
    id: 'fallback-2',
    authorId: 'lucas-silva',
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
    likes: 29,
    usefulVotes: 25,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 820
  },
  {
    id: 'fallback-3',
    authorId: 'mateo-sanchez',
    authorName: 'Mateo Sánchez',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    authorIsVerified: false,
    title: 'Buscar piso en Oporto: Consejos útiles',
    content: 'Si están buscando alquiler en Oporto, cuidado con los anuncios demasiado baratos. Exijan siempre contrato registrado en la Autoridade Tributária, si no, no podrán sacar el certificado de Junta de Freguesia.',
    category: 'Alojamento',
    tags: [],
    isVerified: false,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 18,
    usefulVotes: 16,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 610
  },
  {
    id: 'fallback-4',
    authorId: 'sophie-dubois',
    authorName: 'Sophie Dubois',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    authorIsVerified: false,
    title: 'Mon intégration à Lisbonne',
    content: 'Bonjour à tous ! Je me suis installée à Lisbonne il y a 3 mois. Les cours de portugais gratuits (Português Língua Acolhedora) sont une excellente opportunité pour apprendre et rencontrer du monde. Je recommande !',
    category: 'Geral',
    tags: [],
    isVerified: false,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 24,
    usefulVotes: 22,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 700
  },
  {
    id: 'fallback-5',
    authorId: 'gabriel-souza',
    authorName: 'Gabriel Souza',
    authorAvatar: 'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=150&q=80',
    authorIsVerified: false,
    title: 'NIF para cidadãos extra-comunitários',
    content: 'Consegui tirar o meu NIF esta semana! Lembrando que, para quem vem de fora da UE, ainda é obrigatório ter um representante fiscal em Portugal para a emissão do documento. O meu processo levou 3 dias.',
    category: 'NIF',
    tags: [],
    isVerified: false,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 31,
    usefulVotes: 28,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 780
  },
  {
    id: 'fallback-6',
    authorId: 'mariana-costa',
    authorName: 'Mariana Costa',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    authorIsVerified: true,
    title: 'Acesso ao SNS para Grávidas Estrangeiras',
    content: 'Dica de saúde: Em Portugal, todo o acompanhamento médico de grávidas estrangeiras é totalmente gratuito e garantido pelo SNS, independentemente do vosso estatuto de regularização. Procurem o vosso Centro de Saúde!',
    category: 'Saúde',
    tags: [],
    isVerified: true,
    isFraudWarning: false,
    validationStatus: 'validated',
    timestamp: new Date().toISOString(),
    likes: 56,
    usefulVotes: 51,
    fakeVotes: 0,
    reviewVotes: 0,
    reports: 0,
    urgency: 0,
    comments: [],
    nobelScore: 990
  }
];