import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import {
  Search, Plus, X, ChevronDown, Trash2, Loader2, RefreshCw, Star, ShieldAlert, Sparkles, Send, Check,
  ChevronLeft, ChevronRight, Globe
} from 'lucide-react';

/**
 * 👑 MIRA COMMUNITY VIEW V2026.GOLD - DESIGN BY AMANDA ABREU
 * ----------------------------------------------------------------
 * STATUS: DIAMOND MASTER (SINCRO TOTAL)
 * FIX: Reconstrução Pixel-Perfect do Modal "Nova Partilha" Online.
 * ----------------------------------------------------------------
 */

// --- IMPORTS REAIS ---
import { Post, UNIFIED_CATEGORIES, ViewType, UnifiedCategory } from '../types';
import { t } from '../utils/translations';
import { communityService } from '../services/communityService';
import { getCategoryKey, normalizeCategory } from '../utils/categoryUtils';
import { syncService } from '../services/syncService';
import { analytics } from '../services/analyticsService';
import { useToast } from './Toast';
import { PostCard } from './PostCard';
import { Stories } from './Stories';
import { TranslatedText } from './TranslatedText';
import { supabase } from '../lib/supabase';
import { followService } from '../services/followService';

// --- CONSTANTES DE DESIGN ORIGINAL ---
const POST_BACKGROUNDS = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80",
  "https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80",
  "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80",
  "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
  "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
];

// --- COMPONENTE PRINCIPAL ---

const CommunityViewComponent = ({
  language, user, onViewChange, onEarnPoints, masterPosts, setMasterPosts, 
  savedPostsIds, onToggleSavePost, likedPosts, setLikedPosts, likedComments, 
  setLikedComments, userVotes, setUserVotes, targetPostId, targetCommentId, 
  onClearTargetPost, onUpdateUser, onLoadMore, hasMore, isLoading, onViewProfile, 
  translatedPosts, setTranslatedPosts
}) => {
  const [activeCategory, setActiveCategory] = useState<UnifiedCategory | 'Todos'>(() => {
    const saved = localStorage.getItem('mira_community_cat') || 'Todos';
    return (saved === 'Todos' ? 'Todos' : normalizeCategory(saved)) as any;
  });
  
  useEffect(() => {
    localStorage.setItem('mira_community_cat', activeCategory);
  }, [activeCategory]);

  // V2026.GOLD: Listener de Sincronização para Persistência Total
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      setSyncQueueSize(e.detail.size);
    };
    window.addEventListener('mira_sync_status', handleSyncStatus);
    return () => window.removeEventListener('mira_sync_status', handleSyncStatus);
  }, []);

  const [searchFilter, setSearchFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { showToast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 💎 MIRA SOBERANIA: O Manual é sempre o Story #1, injetado imediatamente
  const MANUAL_STORY = {
    id: 'manual-soberania-v2026',
    authorId: 'mira-official',
    authorName: 'MANUAL MIRA',
    authorAvatar: '/mira-robot.png',
    authorIsVerified: true,
    nobelScore: 999999,
    title: 'MANUAL MIRA v2026 1.0',
    content: 'O guia definitivo para a tua regularização em Portugal.',
    category: 'AIMA',
    backgroundImage: '/mira-robot.png',
    isManual: true,
  };
  const [dbStories, setDbStories] = useState<Post[]>([]);
  const [isStoriesLoading, setIsStoriesLoading] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  // --- MIRA: COMMENT SYSTEM STATES ---
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [replyToComment, setReplyToComment] = useState<{ id: string; name: string } | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      followService.getFollowingSet(user.id).then(set => setFollowedUserIds(set));
    }
  }, [user?.id]);

  // 🧬 1. MEMO DE POSTS COM REGRAS DE SOBERANIA
  const masterPostsWithLocal = useMemo(() => {
    const pendingActions = syncService?.getPendingActions() || [];
    const pendingDeletes = new Set(pendingActions.filter(a => a.action === 'delete' || a.action === 'delete_post').map(a => (a.payload as any).postId));
    
    // MIRA V2026: Resgate de posts em fila de espera (Persistência Blindada)
    const pendingPosts: Post[] = pendingActions
        .filter(a => a.action === 'post')
        .map(a => ({
            id: `local-${a.id}`,
            authorId: a.payload.authorId || user?.id,
            authorName: user?.name || user?.full_name || user?.user_metadata?.full_name || 'Amanda Abreu',
            authorAvatar: user?.avatar || user?.avatar_url || user?.user_metadata?.avatar_url || '',
            content: a.payload.content,
            title: a.payload.title || 'Nova Partilha',
            category: a.payload.category,
            backgroundImage: a.payload.backgroundImage,
            timestamp: new Date(a.timestamp).toISOString(),
            likes: 0,
            usefulVotes: 0,
            fakeVotes: 0,
            comments: [],
            validationStatus: 'approved',
            isVerified: false,
            nobelScore: 10,
            authorityLevel: 0,
            isSyncing: true
        } as any));

    // Unir posts reais com pendentes
    const combined = [...masterPosts];
    pendingPosts.forEach(pending => {
        const alreadyInMaster = combined.some(p => p.content === pending.content && p.authorId === pending.authorId);
        if (!alreadyInMaster) {
            combined.unshift(pending);
        }
    });

    return combined
        .filter(p => !pendingDeletes.has(p.id))
        .map(p => {
            const isLocalLiked = likedPosts.has(p.id);
            const isLocalSaved = savedPostsIds.has(p.id);
            const localV = userVotes[p.id];
            const isFollowingAuthor = followedUserIds.has(p.authorId);
            
            return {
                ...p,
                isLikedByUser: isLocalLiked,
                userVote: localV,
                isSaved: isLocalSaved,
                isFollowing: isFollowingAuthor,
                likes: isLocalLiked ? Math.max(1, p.likes || 0) : (p.likes || 0),
                usefulVotes: localV === 'true' ? Math.max(1, p.usefulVotes || 0) : (p.usefulVotes || 0),
                fakeVotes: localV === 'false' ? Math.max(1, p.fakeVotes || 0) : (p.fakeVotes || 0)
            };
        })
        .sort((a, b) => {
            const isASyncing = (a as any).isSyncing;
            const isBSyncing = (b as any).isSyncing;
            if (isASyncing && !isBSyncing) return -1;
            if (!isASyncing && isBSyncing) return 1;

            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            
            if (timeB !== timeA) {
                return timeB - timeA;
            }

            return (b.nobelScore || 0) - (a.nobelScore || 0);
        });
  }, [masterPosts, likedPosts, userVotes, savedPostsIds, followedUserIds, syncQueueSize, user]);


  // 🧬 MIRA STORIES: Cálculo Reativo via useMemo (Prevenção de Loops de Render)
  const stories = useMemo(() => {
    const manualStory = MANUAL_STORY;
    // Combina dbStories com masterPostsWithLocal fundindo dados de perfil para evitar piscar ou desparecer
    const combinedMap = new Map<string, Post>();
    [...masterPostsWithLocal, ...dbStories].forEach(p => {
      if (p?.id) {
        const existing = combinedMap.get(p.id);
        if (!existing) {
          combinedMap.set(p.id, { ...p });
        } else {
          combinedMap.set(p.id, {
            ...existing,
            ...p,
            authorAvatar: (p.authorAvatar && p.authorAvatar.trim() !== '') ? p.authorAvatar : (existing.authorAvatar || ''),
            authorName: (p.authorName && p.authorName !== 'Membro MIRA') ? p.authorName : (existing.authorName || 'Membro MIRA')
          });
        }
      }
    });
    let refinedStories = Array.from(combinedMap.values());

    // 1. Filtro de Segurança: Apenas posts REAIS
    refinedStories = refinedStories.filter(p => 
        p?.id && 
        !String(p.id).startsWith('manual') && 
        !String(p.id).includes('00000000') &&
        p?.authorName &&
        p?.content && 
        !p.content.includes('Consultoria Otimizada')
    );

    // 2. Cálculo do Nobel Score
    const scoredStories = refinedStories.map(p => {
        const isVerified = p.authorIsVerified || p.isVerified || false;
        const score = (isVerified ? 1000 : 0) + ((p.likes || 0) * 50) + ((p.comments?.length || 0) * 30);
        return { ...p, calculatedScore: score };
    });

    // 3. Ordenação Top 9
    const sorted = scoredStories
        .sort((a, b) => b.calculatedScore - a.calculatedScore)
        .slice(0, 9);

    const recentLocals = masterPostsWithLocal
        .filter(p => p.id?.toString().startsWith('local-') && !sorted.find(s => s.id === p.id))
        .slice(0, 3);

    return [manualStory, ...recentLocals, ...sorted];
  }, [dbStories, masterPostsWithLocal]);

  // --- STORY AUTOMATIC TRANSITION AND AUTOPLAY ---
  const goToNextStory = () => {
    if (!selectedStoryId) return;
    const currentIndex = stories.findIndex(s => s.id === selectedStoryId);
    if (currentIndex !== -1 && currentIndex < stories.length - 1) {
      setSelectedStoryId(stories[currentIndex + 1].id);
    } else {
      setSelectedStoryId(null);
    }
  };

  const goToPrevStory = () => {
    if (!selectedStoryId) return;
    const currentIndex = stories.findIndex(s => s.id === selectedStoryId);
    if (currentIndex > 0) {
      setSelectedStoryId(stories[currentIndex - 1].id);
    }
  };

  useEffect(() => {
    if (!selectedStoryId) return;

    const timer = setTimeout(() => {
      goToNextStory();
    }, 5000);

    return () => clearTimeout(timer);
  }, [selectedStoryId, stories]);

  // 🧬 MIRA STORIES: Destaques Reais (V2026.GOLD PATCHED)
  useEffect(() => {
    let active = true;

    const fetchStories = async () => {
      try {
        setIsStoriesLoading(true);
        const topStories = await communityService.fetchTopStories();
        if (active) {
          setDbStories(topStories || []);
        }
      } catch (e) {
        console.error("MIRA: Erro ao carregar Stories do banco:", e);
      } finally {
        if (active) {
          setIsStoriesLoading(false);
        }
      }
    };
    
    // Always fetch stories on mount and on interval - do not block on isLoading
    fetchStories();

    // 🔄 MIRA AUTO-REFRESH: Atualiza stories a cada 30 segundos
    const intervalId = setInterval(() => {
      fetchStories();
    }, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, []);

  // Estados para o NOVO POST (Fidelidade Online)
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<UnifiedCategory>(UNIFIED_CATEGORIES[0]);
  const [newPostBackground, setNewPostBackground] = useState(POST_BACKGROUNDS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🧬 2. EXTERMÍNÍO NUCLEAR (ANTI-ZOMBIES)
const handleDeletePost = async (postId: string) => {
  const targetPost = masterPosts.find(p => p.id === postId);

  if (!targetPost) {
    showToast(t('toast_server_error', language), "error");
    return;
  }

  const userIsAdmin =
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'amandasabreu89@gmail.com';

  const canDelete =
    userIsAdmin ||
    targetPost.authorId === user?.id;

  if (!canDelete) {
    showToast('Você só pode apagar os seus próprios posts.', 'error');
    return;
  }

  setMasterPosts(prev => prev.filter(p => p.id !== postId));

  try {
    await communityService.deletePost(postId, user.id);
    showToast(t('toast_post_deleted', language), 'success');
    analytics.track(
      'post_deleted',
      user.id,
      'comunidade',
      { postId }
    );
  } catch (e) {
    console.error("🚨 Erro ao eliminar post:", e);
    showToast(t('toast_server_error', language), "error");
    // Re-adicionar post se a eliminação falhar no servidor
    setMasterPosts(prev => [...prev, targetPost]);
  }
};

  const handleToggleTranslate = (postId: string) => {
    if (setTranslatedPosts) {
      setTranslatedPosts(prev => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
    }
  };

  // 🧬 3. PUBLICAÇÃO SOBERANA OTIMISTA (V2026.ELITE)
  const handleSubmitPost = async () => {
    if (!newPostContent.trim()) return;
    
    const initialContent = newPostContent;
    const initialCategory = newPostCategory;
    const initialBackground = newPostBackground;

    // Fechar modal e limpar input imediatamente
    setShowCreateModal(false);
    setNewPostContent('');

    const tempId = `temp-${Date.now()}`;
    const displayPost: Post = {
        id: tempId,
        authorId: user.id,
        authorName: user.name || user.full_name || user.user_metadata?.full_name || 'Amanda Abreu',
        authorAvatar: user.avatar || user.avatar_url || user.user_metadata?.avatar_url || '',
        authorIsVerified: user.isVerified,
        authorFollowersCount: user.followers_count || 0,
        authorFollowingCount: user.following_count || 0,
        authorityLevel: user.level || 0,
        content: initialContent,
        category: initialCategory,
        backgroundImage: initialBackground,
        title: 'Nova Partilha',
        timestamp: new Date().toISOString(),
        isVerified: user.isVerified || false,
        likes: 0,
        usefulVotes: 0,
        fakeVotes: 0,
        reports: 0,
        nobelScore: 10,
        tags: [],
        isFraudWarning: false,
        urgency: 0,
        validationStatus: 'validated',
        reviewVotes: 0,
        comments: [],
        translations: {}
    };

    // 🚀 OTIMISMO DE INTERFACE: Exibir post imediatamente no feed
    setMasterPosts(prev => [displayPost, ...prev]);
    showToast(t('toast_post_created', language), "success");

    try {
      // 🛡️ PERSISTÊNCIA SOBERANA: Inserção atómica direta no PostgreSQL Supabase
      const createdPost = await communityService.createPost({
        authorId: user.id,
        authorName: user.name || user.full_name || 'Membro MIRA',
        authorAvatar: user.avatar || user.avatar_url || '',
        content: initialContent,
        category: initialCategory,
        backgroundImage: initialBackground,
        title: 'Nova Partilha'
      });

      if (createdPost && createdPost.id) {
        console.log("✅ [MIRA DB] Post reconciliado com ID permanente PostgreSQL:", createdPost.id);
        setMasterPosts(prev => prev.map(p => p.id === tempId ? createdPost : p));
      }

      onEarnPoints && onEarnPoints(10);
      analytics.track('post_created', user.id, 'comunidade', { category: initialCategory });
    } catch (err: any) {
      console.error("🚨 [MIRA ERRO CRÍTICO NA GRAVAÇÃO DO POST]:", err);
      showToast("Erro ao gravar post no banco de dados. Tente novamente.", "error");
      setMasterPosts(prev => prev.filter(p => p.id !== tempId));
    }
  };

  // 🧬 4. INTERAÇÕES SOBERANAS (LIKE, VERDADEIRO, FALSO)
  const handleReportPost = async (postId: string, targetAuthorId?: string, content?: string) => {
    const post = masterPostsWithLocal.find(p => p.id === postId);
    const authorName = post?.authorName || 'Membro';
    const postContent = content || post?.content || '';

    // 🛡️ MIRA SOBERANIA: Contexto total para a administração
    const reportBody = `DENÚNCIA DE POST MIRA\n\n` +
                       `ID DO POST: ${postId}\n` +
                       `AUTOR: ${authorName}\n` +
                       `CONTEÚDO DO POST:\n------------------\n${postContent}\n------------------\n\n` +
                       `Ação necessária: Revisão de conteúdo.`;
                       
    window.open(`mailto:mira.app@hotmail.com?subject=DENUNCIA POST ${postId}&body=${encodeURIComponent(reportBody)}`);
    
    try {
        await communityService.report({
            postId,
            reporterId: user.id,
            targetAuthorId,
            reason: 'Denúncia via App',
            reportedContentText: postContent
        });
    } catch (e) {
        console.warn("MIRA: Falha ao registar denúncia no banco.");
    }
    
    showToast(t('toast_report_sent', language), 'success');
  };

  const handleReportComment = async (postId: string, commentId: string, targetAuthorId?: string, content?: string) => {
    // 🛡️ MIRA SOBERANIA: Contexto total para a administração
    const reportBody = `DENÚNCIA DE COMENTÁRIO MIRA\n\n` +
                       `ID DO POST: ${postId}\n` +
                       `ID DO COMENTÁRIO: ${commentId}\n` +
                       `CONTEÚDO DO COMENTÁRIO:\n------------------\n${content}\n------------------\n\n` +
                       `Ação necessária: Revisão de conduta.`;
                       
    window.open(`mailto:mira.app@hotmail.com?subject=DENUNCIA COMENTARIO ${commentId}&body=${encodeURIComponent(reportBody)}`);
    
    try {
        await communityService.report({
            postId,
            commentId,
            reporterId: user.id,
            targetAuthorId,
            reason: 'Denúncia via App',
            reportedContentText: content
        });
    } catch (e) {
        console.warn("MIRA: Falha ao registar denúncia no banco.");
    }
    
    showToast(t('toast_report_sent', language), 'success');
  };

  const handleLike = async (postId: string) => {
    try {
      // 🛡️ MIRA SOBERANIA: Precisamos encontrar o post atual para saber o estado real
      const targetPost = masterPostsWithLocal.find(p => p.id === postId);
      if (!targetPost) return;

      // O estado atual do like vem da união resiliente no useMemo
      const isCurrentlyLiked = targetPost.isLikedByUser;
      const action = isCurrentlyLiked ? 'removed' : 'added';

      // Atualizar o estado local (Sets) para feedback instantâneo
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (action === 'added') next.add(postId);
        else next.delete(postId);
        return next;
      });
      
      // Atualizar o contador no masterPosts imediatamente
      // 🛡️ MIRA SOBERANIA: Atualização Atómica do Estado Master
      setMasterPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const countChange = action === 'added' ? 1 : -1;
          return { 
            ...p, 
            likes: Math.max(0, p.likes + countChange),
            isLikedByUser: action === 'added' // Sincronização direta
          };
        }
        return p;
      }));
      
      if (action === 'added') onEarnPoints && onEarnPoints(1);

      // Persistência: Enfileirar via SyncService (Idempotente)
      await syncService.enqueue('like', { postId, userId: user.id, voteType: 'like' });
      analytics.track('post_like', user.id, 'comunidade', { postId, action });
    } catch (e) {
      console.error("MIRA Like Error:", e);
    }
  };

  const handleFactVote = async (postId: string, isTrue: boolean) => {
    const voteType = isTrue ? 'useful' : 'fake';
    try {
      // Otimista: Actualizar UI
      const targetPost = masterPostsWithLocal.find(p => p.id === postId);
      const currentVote = userVotes[postId] || targetPost?.userVote;
      const action = currentVote === (isTrue ? 'true' : 'false') ? 'removed' : 'added';

      setUserVotes(prev => ({
        ...prev,
        [postId]: action === 'added' ? (isTrue ? 'true' : 'false') : undefined
      }));

      setMasterPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const countKey = isTrue ? 'usefulVotes' : 'fakeVotes';
          const countChange = action === 'added' ? 1 : -1;
          
          let updates: any = { 
            [countKey]: Math.max(0, ((p as any)[countKey] || 0) + countChange),
            userVote: action === 'added' ? (isTrue ? 'true' : 'false') : undefined 
          };

          if (action === 'added' && currentVote) {
             const oppositeKey = isTrue ? 'fakeVotes' : 'usefulVotes';
             updates[oppositeKey] = Math.max(0, ((p as any)[oppositeKey] || 0) - 1);
          }

          return { ...p, ...updates };
        }
        return p;
      }));

      showToast(isTrue ? t('toast_fact_true', language) : t('toast_fact_false', language), "success");
      if (action === 'added') onEarnPoints && onEarnPoints(2);

      // Persistência: Enfileirar via SyncService
      await syncService.enqueue('vote', { postId, userId: user.id, voteType });
      analytics.track('post_fact_vote', user.id, 'comunidade', { postId, voteType, action });
    } catch (e) {
      console.error("MIRA Vote Error:", e);
    }
  };

  const handleOpenComment = (postId: string) => {
    setCommentingPostId(postId);
    setReplyToComment(null);
    setCommentContent('');
    setShowCommentModal(true);
  };

  const handleOpenReply = (postId: string, replyToName: string, commentId: string) => {
    setCommentingPostId(postId);
    setReplyToComment({ id: commentId, name: replyToName });
    setCommentContent('');
    setShowCommentModal(true);
  };

  const handleSubmitComment = async () => {
    if (!commentingPostId || !commentContent.trim()) return;
    
    setIsCommenting(true);
    const text = commentContent;
    const postId = commentingPostId;
    const parentId = replyToComment?.id;

    try {
      // 🛡️ MIRA OFFLINE-FIRST: Geramos o ID local otimista
      const tempCommentId = `local-comment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      
      // 1. Atualização Otimista Instantânea (UI atualizada em <50ms)
      setMasterPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const newComment = {
            id: tempCommentId,
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            content: text,
            timestamp: new Date().toISOString(),
            likes: 0,
            parentId: parentId,
            translations: {}
          };
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
        }
        return p;
      }));

      // 2. Persistência Híbrida de Alta Fiabilidade (Síncrona se online)
      let persistedData = null;
      if (navigator.onLine) {
        try {
          console.log("⚡ [MIRA PERSISTENCE] Gravando comentário diretamente em tempo real...");
          persistedData = await communityService.createComment(postId, user.id, text, parentId);
          
          if (persistedData && persistedData.id) {
            console.log("✅ [MIRA PERSISTENCE] Gravado com sucesso! Reconciliando ID temporário com UUID real:", persistedData.id);
            // Reconciliação imediata: substitui o ID temporário pelo real na UI
            setMasterPosts(prev => prev.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  comments: (p.comments || []).map(c => c.id === tempCommentId ? { ...c, id: persistedData.id } : c)
                };
              }
              return p;
            }));
          }
        } catch (dbErr) {
          console.warn("⚠️ [MIRA PERSISTENCE] Falha na persistência síncrona, enfileirando para sync em background:", dbErr);
        }
      }

      // 3. Fallback Resiliente (Sync offline se falhou ou offline)
      if (!persistedData) {
        await syncService.enqueue('comment', {
          postId,
          userId: user.id,
          content: text,
          parentId,
          tempCommentId
        });
      }
      
      showToast(t('toast_comment_sent', language), "success");
      onEarnPoints && onEarnPoints(2);
      analytics.track('comment_created', user.id, 'comunidade', { postId, parentId });
      
    } catch (e) {
      console.error("MIRA: Comment Error:", e);
      showToast(t('toast_comment_error', language), "error");
    } finally {
      setIsCommenting(false);
      setShowCommentModal(false);
    }
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    // Note: communityService doesn't have a direct voteComment yet, 
    // but we can add it or just handle it optimistically if needed.
    // For now, let's just toast and set local state if we want to follow the pattern.
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    // 🛡️ RECURSIVE PURGE: Garante que comentários e respostas sumam da UI instantaneamente
    const recursiveFilter = (comments: any[]): any[] => {
      return (comments || [])
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies ? recursiveFilter(c.replies) : []
        }));
    };

    setMasterPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: recursiveFilter(p.comments || [])
        };
      }
      return p;
    }));

    try {
      await syncService.enqueue('delete_comment', { commentId });
      showToast(t('toast_comment_deleted', language), "success");
    } catch (e) {
      console.error("MIRA: Delete Comment Error:", e);
    }
  };

  const handleFollow = async (authorId: string) => {
    if (!user || user.id === authorId) return;
    try {
      const isCurrentlyFollowing = followedUserIds.has(authorId);
      const isNowFollowing = !isCurrentlyFollowing;

      // Optimistic update for set
      setFollowedUserIds(prev => {
        const next = new Set(prev);
        if (isNowFollowing) next.add(authorId);
        else next.delete(authorId);
        return next;
      });

      await followService.toggleFollow(user.id, authorId, isNowFollowing);
      
      showToast(isNowFollowing ? (t('toast_follow_success', language) || 'A seguir utilizador! +5 Pontos 🎉') : (t('toast_unfollow_success', language) || 'Deixaste de seguir.'), "success");
      
      if (isNowFollowing && onEarnPoints) {
        onEarnPoints(5);
      }

      // Update local counts and follow status for the author if they are in the feed
      setMasterPosts(prev => prev.map(p => {
        if (p.authorId === authorId) {
          return {
            ...p,
            isFollowing: isNowFollowing,
            authorFollowersCount: Math.max(0, (p.authorFollowersCount || 0) + (isNowFollowing ? 1 : -1))
          };
        }
        return p;
      }));
    } catch (e) {
      console.error("MIRA Follow Error:", e);
      showToast("Seguido com sucesso! +5 Pontos 🎉", "success");
    }
  };


  // MIRA: Tradução removida por ordem da CEO para simplificação total.

  const filteredPosts = useMemo(() => {
    return masterPostsWithLocal.filter(p => {
      const pCat = normalizeCategory(p.category || '');
      const aCat = activeCategory as string;
      const catMatch = aCat === 'Todos' || pCat === aCat;
      const searchMatch = !searchFilter || p.content.toLowerCase().includes(searchFilter.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [masterPostsWithLocal, activeCategory, searchFilter]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative font-sans text-slate-900 border-none shadow-none outline-none">
      
      {/* 🚀 MODAL "NOVA PARTILHA" - RECONSTRUÇÃO FIEL E RESPONSIVA */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-300 sm:p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] rounded-b-none sm:rounded-[3rem] p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
              
              {/* Header do Modal */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-blue-200">
                    <Plus size={24} className="sm:hidden text-white" strokeWidth={3} />
                    <Plus size={32} className="hidden sm:block text-white" strokeWidth={3} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">{t('comm_create_post_title', language)}</h2>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">MIRA Community Portal</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 sm:p-3 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {/* Área de Texto Sem Bordas */}
                <div className="relative">
                   <textarea 
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value.slice(0, 300))}
                      placeholder={t('comm_create_post_placeholder', language)}
                      className="w-full h-40 sm:h-48 bg-slate-50/70 border-none rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-inner"
                   />
                   <div className="absolute bottom-4 right-6 sm:bottom-6 sm:right-8 text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">{newPostContent.length} / 300</div>
                </div>

                {/* Seletor de Categoria */}
                <div className="space-y-2 sm:space-y-3">
                   <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">{t('comm_create_post_category', language).toUpperCase()}</p>
                   <div className="relative group">
                      <select 
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value as UnifiedCategory)}
                        className="w-full pl-6 sm:pl-8 pr-10 sm:pr-12 py-4 sm:py-5 bg-slate-50 border-none rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-blue-100 text-slate-700 cursor-pointer transition-all shadow-sm"
                      >
                         {UNIFIED_CATEGORIES.map(cat => (
                           <option key={cat} value={cat}>{cat}</option>
                         ))}
                      </select>
                      <ChevronDown className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={18} />
                   </div>
                </div>

                {/* Seletor de Visual (Grid Adaptativo) */}
                <div className="space-y-3 sm:space-y-4">
                   <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 italic">{t('comm_create_post_background', language).toUpperCase()}</p>
                   <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                      {POST_BACKGROUNDS.map((url, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setNewPostBackground(url)}
                          className={`relative aspect-square rounded-[0.8rem] sm:rounded-[1.2rem] overflow-hidden transition-all transform active:scale-90 ${newPostBackground === url ? 'ring-2 sm:ring-4 ring-blue-600 scale-105 shadow-xl opacity-100 z-10' : 'opacity-60 hover:opacity-100'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" alt="" />
                          {newPostBackground === url && (
                            <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                               <div className="bg-blue-600 p-1 rounded-full shadow-lg">
                                  <Check size={12} className="text-white" strokeWidth={4} />
                               </div>
                            </div>
                          )}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Botão de Acção Final */}
                <button 
                   onClick={handleSubmitPost}
                   disabled={isSubmitting || !newPostContent.trim()}
                   className={`w-full py-5 sm:py-6 rounded-xl sm:rounded-[2rem] font-black text-[11px] sm:text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 sm:gap-4 shadow-2xl ${isSubmitting || !newPostContent.trim() ? 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed' : 'bg-[#FF8C00] text-white shadow-orange-200 hover:scale-[1.02] active:scale-95'}`}
                >
                   {isSubmitting ? <Loader2 size={20} className="animate-spin text-white" /> : <Send size={20} className="text-white" />}
                   {isSubmitting ? t('comm_publishing', language) : t('comm_create_post_submit', language)}
                </button>
              </div>
           </div>
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar pb-48 bg-white">
        
        {/* HEADER IMPERIAL */}
        <div className="bg-white/90 backdrop-blur-md px-4 sm:px-6 pt-8 pb-4 space-y-4 border-b border-slate-100 z-[100] shadow-sm sticky top-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => onViewChange(ViewType.PROFILE)} className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#FF8C00] via-[#FFD700] to-[#FF8C00] shadow-lg active:scale-90 transition-transform">
                <img src={user.avatar} className="w-full h-full object-cover rounded-full border-2 border-transparent" alt="Perfil" />
              </button>
              <div>
                <h2 className="mira-module-title !text-slate-900">MIRA HUB</h2>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 hover:scale-105 transition-all"
            >
              <Plus size={24} strokeWidth={4} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t('comm_search', language)} 
                value={searchFilter} 
                onChange={(e) => setSearchFilter(e.target.value)} 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm" 
              />
            </div>

            <div className="relative group">
              <select 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value as any)} 
                className="w-full pl-6 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-blue-600 text-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <option value="Todos">{t('comm_all_cats', language) || "Todas as Categorias"}</option>
                {UNIFIED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{t(getCategoryKey(cat), language)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
            </div>
          </div>
        </div>

        {/* 🌟 MIRA STORIES (Destaques da Tribo) */}
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <Stories 
            stories={stories} 
            onStoryClick={(id) => {
              const story = stories.find(s => s.id === id);
              if (story?.id === 'manual-soberania-v2026') {
                  onViewChange(ViewType.LEARNING, { articleId: '408' });
              } else {
                  setSelectedStoryId(id);
              }
            }} 
          />
        </div>

        {/* FEED */}
        <div className="px-3 sm:px-5 space-y-8 sm:space-y-12 mt-8 sm:mt-12 pb-20">
          {(filteredPosts.length > 0) ? filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              language={language}
              isPostLiked={likedPosts.has(post.id)}
              isPostSaved={savedPostsIds.has(post.id)}
              userVote={userVotes[post.id]}
              translatedPosts={translatedPosts}
              likedComments={likedComments}
              onLike={handleLike} 
              onDelete={() => setConfirmDeleteId(post.id)}
              onToggleTranslate={handleToggleTranslate}
              onTranslationGenerated={(translated) => {
                setMasterPosts(prev => prev.map(p => p.id === post.id ? { ...p, translations: { ...p.translations, [language.toUpperCase()]: translated } } : p));
              }}
              onOpenProfile={(postData) => onViewProfile && onViewProfile(postData.authorId, postData.authorName, postData.authorAvatar)}
              isAdmin={user.role === 'admin' || ['amandasabreu89@gmail.com'].includes(user.email?.toLowerCase() || '')}
              onComment={handleOpenComment}
              onDeleteComment={handleDeleteComment}
              onToggleSave={() => onToggleSavePost(post.id)}
              onFactVote={handleFactVote}
              onReport={handleReportPost}
              onReplyComment={handleOpenReply}
              onLikeComment={handleLikeComment}
              onReportComment={handleReportComment}
              onFollow={handleFollow}
            />
          )) : filteredPosts.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <ShieldAlert size={60} strokeWidth={1} className="mb-4 opacity-10" />
                <p className="font-black text-[10px] uppercase tracking-[0.3em]">{t('comm_no_posts', language)}</p>
            </div>
          ) : filteredPosts.length === 0 && isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <Loader2 size={40} className="animate-spin text-orange-500 mb-4 opacity-40" />
                <p className="font-black text-[10px] uppercase tracking-[0.3em] opacity-40">Sincronizando...</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* 🎬 CINEMATIC STORY MODAL (V2026.GOLD) */}
      {selectedStoryId && (
        <div className="fixed inset-0 z-[20000] bg-black flex flex-col items-center justify-center animate-in fade-in duration-500">
           {/* Background Cinematográfico com Blur Dinâmico */}
            {(() => {
             const story = stories.find(s => s.id === selectedStoryId) || masterPosts.find(p => p.id === selectedStoryId);
             if (!story) return null;
             return (
               <>
                 <img src={story.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 blur-md" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
                 
                 {/* Left/Right Tap Zones for Mobile */}
                 <div 
                   onClick={(e) => { e.stopPropagation(); goToPrevStory(); }} 
                   className="absolute left-0 top-0 bottom-0 w-[30%] cursor-pointer z-10" 
                 />
                 <div 
                   onClick={(e) => { e.stopPropagation(); goToNextStory(); }} 
                   className="absolute right-0 top-0 bottom-0 w-[70%] cursor-pointer z-10" 
                 />

                 <div className="relative z-20 w-full max-w-md h-full max-h-[96dvh] flex flex-col px-4 sm:px-6 py-6 sm:py-8 justify-between pointer-events-none">
                     {/* Top Bar do Modal */}
                     <div className="flex justify-between items-center mb-6 pointer-events-auto">
                        <div className="flex items-center gap-3">
                           <img 
                               src={story.authorAvatar && story.authorAvatar.trim() !== '' ? story.authorAvatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName || 'Membro')}&background=f97316&color=fff`} 
                               className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-orange-500 shadow-xl object-cover" 
                               alt={story.authorName || 'Membro'} 
                               onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName || 'Membro')}&background=f97316&color=fff`;
                               }}
                            />
                           <div>
                              <p className="text-white font-black text-xs uppercase tracking-widest">{story.authorName || 'Membro MIRA'}</p>
                              <p className="text-white/40 text-[9px] font-bold uppercase tracking-tighter">Destaque Oficial</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleToggleTranslate(story.id);
                             }} 
                             className={`p-3 rounded-full backdrop-blur-md transition-all border shadow-lg active:scale-95 ${
                               translatedPosts.has(story.id)
                               ? 'bg-orange-500 border-orange-500 text-white shadow-orange-500/30'
                               : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                             }`}
                             title={translatedPosts.has(story.id) ? "Ver Original" : "Traduzir com IA"}
                           >
                             <Globe size={18} />
                           </button>
                           <button onClick={() => setSelectedStoryId(null)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all">
                              <X size={20} />
                           </button>
                        </div>
                     </div>

                     {/* Conteúdo Central */}
                     <div className="flex-1 flex flex-col justify-center text-center space-y-6 my-auto relative">
                        {/* Navigation Chevrons for Desktop */}
                        {stories.findIndex(s => s.id === selectedStoryId) > 0 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
                            className="hidden md:flex absolute left-[-70px] top-1/2 -translate-y-1/2 p-3 bg-white/15 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all z-30 active:scale-90 pointer-events-auto"
                          >
                            <ChevronLeft size={24} />
                          </button>
                        )}
                        {stories.findIndex(s => s.id === selectedStoryId) < stories.length - 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
                            className="hidden md:flex absolute right-[-70px] top-1/2 -translate-y-1/2 p-3 bg-white/15 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all z-30 active:scale-90 pointer-events-auto"
                          >
                            <ChevronRight size={24} />
                          </button>
                        )}

                        <div className="bg-white/10 backdrop-blur-3xl p-6 sm:p-8 rounded-[2rem] border border-white/20 shadow-2xl animate-in zoom-in-95 duration-500 relative vertical-story-content w-full pointer-events-auto">
                            {/* Instagram Segmented Progress Bar */}
                            <div className="absolute top-4 left-6 right-6 flex gap-1.5 h-[3px] z-30">
                               {stories.map((s, idx) => {
                                 const currentIdx = stories.findIndex(item => item.id === selectedStoryId);
                                 let widthClass = "bg-white/30";
                                 let childElement = null;

                                 if (idx < currentIdx) {
                                   widthClass = "bg-white";
                                 } else if (idx === currentIdx) {
                                   widthClass = "bg-white/30";
                                   childElement = (
                                     <div 
                                       key={s.id} 
                                       className="h-full bg-white animate-[story-progress_5s_linear_forwards]" 
                                     />
                                   );
                                 }

                                 return (
                                   <div key={s.id} className={`flex-1 rounded-full overflow-hidden ${widthClass}`}>
                                     {childElement}
                                   </div>
                                 );
                               })}
                            </div>

                            <Sparkles className="text-orange-400 mx-auto mt-2 mb-4 animate-pulse" size={24} />
                            
                            {/* Safe scrollable area for story text */}
                            <div className="overflow-y-auto max-h-[42vh] no-scrollbar px-2">
                              <h3 className={`text-white uppercase tracking-tighter leading-snug italic drop-shadow-lg ${
                                story.content && story.content.length > 120 ? 'text-base sm:text-lg font-bold' : 'text-xl sm:text-2xl font-black'
                              }`}>
                                <TranslatedText 
                                   text={story.content} 
                                   language={language} 
                                   shouldTranslate={translatedPosts.has(story.id)}
                                   translations={story.translations}
                                   onTranslationGenerated={(translated) => {
                                     communityService.updateTranslation(story.id, 'post', language, translated);
                                     setMasterPosts(prev => prev.map(p => p.id === story.id ? { ...p, translations: { ...p.translations, [language.toUpperCase()]: translated } } : p));
                                   }}
                                />
                              </h3>
                            </div>
                        </div>

                        {/* Ações de Admin no Stories */}
                        {['amandasabreu89@gmail.com'].includes(user?.email?.toLowerCase() || '') && (
                          <div className="flex justify-center gap-4 pointer-events-auto">
                             <button 
                               onClick={async () => {
                                 try {
                                   const newStatus = !story.isVerified;
                                   // 🛡️ [V2026.GOLD] Tenta RPC primeiro, fallback para update direto
                                   const { error } = await supabase.rpc('verify_post', { p_post_id: story.id, p_is_verified: newStatus });
                                   
                                   if (error) {
                                      console.warn("MIRA: RPC verify_post falhou, tentando update direto.");
                                      const { error: upError } = await supabase.from('posts').update({ is_verified: newStatus }).eq('id', story.id);
                                      if (upError) throw upError;
                                    }

                                   showToast(newStatus ? t('toast_post_verified_success', language) : t('toast_post_unverified_success', language), "success");
                                   setMasterPosts(prev => prev.map(p => p.id === story.id ? { ...p, isVerified: newStatus } : p));
                                 } catch (e) {
                                   console.error("Verify Post Error:", e);
                                   showToast(t('toast_verify_post_error', language), "error");
                                 }
                               }}
                               className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${story.isVerified ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white border border-white/20'}`}
                             >
                                <Check size={16} strokeWidth={4} />
                                {story.isVerified ? "VERIFICADO" : "VERIFICAR"}
                             </button>
                          </div>
                        )}
                     </div>

                     {/* Footer Info */}
                     <div className="text-center mt-6">
                        <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em]">MIRA 2026</p>
                     </div>
                     {/* Decorative background element */}
                     <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-50 rounded-full blur-[100px] -z-10 opacity-60" />
                  </div>
               </>
             );
            })()}
        </div>
      )}

      {/* 💬 MODAL DE COMENTÁRIO SOBERANO */}
      {showCommentModal && (
        <div className="fixed inset-0 z-[10002] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-100 backdrop-blur-2xl w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-20 duration-500 relative overflow-hidden">
               
               {/* Header do Modal */}
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-orange-500 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <Sparkles size={24} className="text-white" strokeWidth={3} />
                   </div>
                   <div>
                     <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none italic">
                       {replyToComment ? t('comm_reply_to', language) : t('comm_new_comment', language)}
                     </h2>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                       {replyToComment ? `@${replyToComment.name}` : "Voz MIRA"}
                     </p>
                   </div>
                 </div>
                 <button onClick={() => setShowCommentModal(false)} className="p-3 bg-slate-50 border border-slate-100 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"><X size={20} /></button>
               </div>

               <div className="space-y-6">
                 {/* Área de Comentário */}
                 <div className="relative">
                    <textarea 
                       autoFocus
                       value={commentContent}
                       onChange={(e) => setCommentContent(e.target.value.slice(0, 500))}
                       placeholder={replyToComment ? t('comm_write_reply', language) : t('comm_create_post_placeholder', language)}
                       className="w-full h-40 sm:h-48 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-inner"
                    />
                    <div className="absolute bottom-6 right-8 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/80 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">{commentContent.length} / 500</div>
                 </div>

                 {/* Botão de Envio Sniper */}
                 <button 
                    onClick={handleSubmitComment}
                    disabled={isCommenting || !commentContent.trim()}
                    className={`w-full py-4.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isCommenting || !commentContent.trim() ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-55 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-95 shadow-orange-500/20'}`}
                 >
                    {isCommenting ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
                    {isCommenting ? "ENVIANDO..." : replyToComment ? t('comm_publish_reply', language) : t('comm_publish_comment', language)}
                 </button>
               </div>

               {/* Decorative background element */}
               <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -z-10 opacity-60" />
            </div>
        </div>
      )}

      {/* MODAL NUCLEAR */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center space-y-8 shadow-2xl border-t-8 border-red-600 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={48} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Vaporizar Post?</h3>
              <p className="text-sm text-slate-500 font-bold mt-3 leading-relaxed">
                CEO Amanda, esta ação apaga o rasto deste post permanentemente.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfirmDeleteId(null)} 
                className="py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => { handleDeletePost(confirmDeleteId); setConfirmDeleteId(null); }} 
                className="py-5 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-red-200 active:scale-95 transition-all"
              >
                EXTERMINAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default memo(CommunityViewComponent);