
import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import {
  Handshake, MessageCircle, MoreHorizontal,
  CheckCircle2, Search, Plus, X,
  ImageIcon, Bookmark, ThumbsUp, ThumbsDown,
  ChevronDown, Send, AlertTriangle, Trash2, Filter, Loader2,
  Share2, Flag, UserPlus, UserCheck, Info, Reply, CheckCircle, ShieldX, ShieldAlert, RefreshCw, Star, Users, Zap, Shield, Volume2, Sparkles, Heart,
  Medal, MapPin
} from 'lucide-react';
import { Post, UNIFIED_CATEGORIES, User, UnifiedCategory, Comment, ViewType } from '../types';
import { autoTranslateText, generateSpeech } from '../services/geminiService';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { communityService } from '../services/communityService';
import { getCategoryKey, normalizeCategory } from '../utils/categoryUtils';
import { useToast } from './Toast';
import { syncService } from '../services/syncService';
import { getImageUrl } from '../utils/imageUtils';
import { followService } from '../services/followService';
import { authService } from '../services/authService';
import { debounce } from '../utils/debounce';

import { TranslatedText } from './TranslatedText';
import { PostCard } from './PostCard';


interface CommunityViewProps {
  language: string;
  user: User;
  onViewChange: (view: ViewType) => void;
  onEarnPoints: (points: number, reason?: string, optimisticOnly?: boolean) => void;
  masterPosts: Post[];
  setMasterPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  savedPostsIds: Set<string>;
  onToggleSavePost: (postId: string) => void;
  targetPostId?: string | null;
  targetCommentId?: string | null;
  onClearTargetPost?: () => void;
  onUpdateUser?: (user: User) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  likedPosts: Set<string>;
  setLikedPosts: React.Dispatch<React.SetStateAction<Set<string>>>;
  likedComments: Set<string>;
  setLikedComments: React.Dispatch<React.SetStateAction<Set<string>>>;
  userVotes: Record<string, 'true' | 'false'>;
  setUserVotes: React.Dispatch<React.SetStateAction<Record<string, 'true' | 'false'>>>;
  onViewProfile?: (userId: string, name: string, avatar: string) => void;
}

const THEMED_IMAGES = [
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80',
  'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
  'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80',
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80',
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
  'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80'
];


const CommunityViewComponent: React.FC<CommunityViewProps> = ({
  language, user, onViewChange, onEarnPoints, masterPosts, setMasterPosts, savedPostsIds, onToggleSavePost, likedPosts, setLikedPosts, likedComments, setLikedComments, userVotes, setUserVotes, targetPostId, targetCommentId, onClearTargetPost, onUpdateUser, onLoadMore, hasMore, isLoading, onViewProfile
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const saved = localStorage.getItem('mira_community_cat') || 'Todos';
    return saved === 'Todos' ? 'Todos' : normalizeCategory(saved);
  });
  
  useEffect(() => {
    localStorage.setItem('mira_community_cat', activeCategory);
  }, [activeCategory]);
  const [searchFilter, setSearchFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<UnifiedCategory | ''>('');
  const [selectedImage, setSelectedImage] = useState(THEMED_IMAGES[0]);
  const [commentingOn, setCommentingOn] = useState<{ postId: string, replyToName?: string, parentId?: string } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [reportingItem, setReportingItem] = useState<{ postId: string, commentId?: string } | null>(null);
  const [reportForm, setReportForm] = useState({ name: user.name || '', email: user.email || '', reason: '' });
  const { showToast } = useToast();

  const [activeStory, setActiveStory] = useState<Post | null>(null);
  const [openPostMenu, setOpenPostMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [totalCountFromDB, setTotalCountFromDB] = useState<number | null>(null);

  // V2026.ULTRA: AUDITORIA SILENCIOSA (BASTIDORES)
  useEffect(() => {
    const runAudit = async () => {
        const count = await communityService.getTotalPostCount();
        setTotalCountFromDB(count);
    };
    runAudit();
  }, [masterPosts.length]);

  useEffect(() => {
    if (masterPosts.length > 0) {
        console.group("🛡️ MIRA: AUDITORIA DE POSTS LOADED");
        console.table(masterPosts.map(p => ({ 
            id: p.id, 
            status: p.validationStatus, 
            reports: p.reports, 
            timestamp: p.timestamp,
            content: p.content.substring(0, 30) + "..."
        })));
        console.groupEnd();
    }
  }, [masterPosts.length]);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<{ postId: string; commentId: string } | null>(null);
  const [translatedPosts, setTranslatedPosts] = useState<Set<string>>(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isFollowingMember, setIsFollowingMember] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [dbStories, setDbStories] = useState<Post[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(false);

  // Sync Event Listener to refresh UI when background sync completes
  useEffect(() => {
    const handleSync = () => setSyncVersion(v => v + 1);
    window.addEventListener('mira_sync_status', handleSync);
    
    // 🛡️ NOBEL SOBERANIA: Fetch Stories from Backend View
    const loadTopStories = async () => {
      setIsLoadingStories(true);
      try {
        const stories = await communityService.fetchTopStories();
        console.log(`🛡️ MIRA SOBERANA: ${stories.length} Destaques Nobel recebidos do Supabase.`);
        stories.forEach((s, idx) => {
          console.log(`  [Story ${idx + 1}] Author: ${s.authorName} | Nobel Score: ${s.nobelScore}`);
        });
        setDbStories(stories);
      } catch (err) {
        console.error("Erro ao carregar Destaques Nobel:", err);
      } finally {
        setIsLoadingStories(false);
      }
    };
    
    loadTopStories();
    
    return () => window.removeEventListener('mira_sync_status', handleSync);
  }, []);

  const masterPostsWithLocal = useMemo(() => {
    // V99.0 UNIVERSAL NORMALIZATION BRIDGE
    const pendingActions = syncService.getPendingActions();
    
    const pendingComments = pendingActions.filter(a => a.action === 'comment');
    const pendingPosts = pendingActions.filter(a => a.action === 'post');
    const pendingLikes = pendingActions.filter(a => a.action === 'like');
    const pendingVotes = pendingActions.filter(a => a.action === 'vote');
    const pendingSaves = pendingActions.filter(a => a.action === 'save');
    
    // 1. Start with database posts enriched by global interaction sets
    let currentPosts: Post[] = masterPosts.map(p => ({
        ...p,
        category: normalizeCategory(p.category) as any,
        // V2026.GOLD: Override server state with unified local state
        isLikedByUser: likedPosts.has(p.id),
        userVote: userVotes[p.id],
        isSaved: savedPostsIds.has(p.id)
    }));

    // 2. Inject local pending posts at the top
    const localPosts: Post[] = pendingPosts.map(a => {
        const p = a.payload;
        return {
            id: a.id,
            authorId: p.authorId,
            authorName: user.name,
            authorAvatar: user.avatar || '',
            title: p.title || 'Post Comunitário',
            content: p.content,
            category: normalizeCategory(p.category) as any,
            tags: [],
            likes: 0,
            comments: [],
            isVerified: false,
            timestamp: new Date().toISOString(),
            backgroundImage: p.backgroundImage,
            isPending: false,
            isLikedByUser: false,
            isSaved: false,
            userVote: undefined,
            usefulVotes: 0,
            fakeVotes: 0,
            reviewVotes: 0,
            reports: 0,
            urgency: 0,
            validationStatus: 'pending'
        } as Post;
    });

    // Deduplicate: If a post with exact same content exists in masterPosts, don't show the local one
    const masterContents = new Set(masterPosts.map(p => p.content));
    const uniqueLocalPosts = localPosts.filter(lp => !masterContents.has(lp.content));
    
    currentPosts = [...uniqueLocalPosts, ...currentPosts];

    // 3. Merge pending interactions (Likes, Votes, Saves) into posts
    return currentPosts.map(p => {
      let modifiedPost = { ...p };

      // OVERLAY AUTHORITATIVE LOCAL STATE FROM APP.TSX
      // If we liked it (even if it's a mock post), reflect it to bypass stale DB responses.
      const authoritativeLike = likedPosts.has(p.id) || p.isLikedByUser;
      if (authoritativeLike !== p.isLikedByUser) {
          modifiedPost.isLikedByUser = authoritativeLike;
          if (authoritativeLike && !p.isLikedByUser) modifiedPost.likes = (p.likes || 0) + 1;
      }

      const authoritativeVote = userVotes[p.id] || p.userVote;
      if (authoritativeVote !== p.userVote) {
          modifiedPost.userVote = authoritativeVote;
      }

      // Apply pending likes (ONLY to the post itself, excluding comment likes)
      const pLikes = pendingLikes.filter(a => a.payload.postId === p.id && !a.payload.commentId);
      pLikes.forEach(() => {
        modifiedPost.isLikedByUser = !modifiedPost.isLikedByUser;
        modifiedPost.likes = modifiedPost.isLikedByUser ? (modifiedPost.likes || 0) + 1 : Math.max(0, (modifiedPost.likes || 0) - 1);
      });

      // Overlay comment likes & apply pending comment likes
      if (modifiedPost.comments) {
          modifiedPost.comments = modifiedPost.comments.map(c => {
              let modifiedComment = {
                  ...c,
                  isLikedByUser: likedComments.has(c.id) || c.isLikedByUser
              };
              
              const cLikes = pendingLikes.filter(a => a.payload.commentId === c.id);
              cLikes.forEach(() => {
                  modifiedComment.isLikedByUser = !modifiedComment.isLikedByUser;
                  modifiedComment.likes = modifiedComment.isLikedByUser ? (modifiedComment.likes || 0) + 1 : Math.max(0, (modifiedComment.likes || 0) - 1);
              });
              return modifiedComment;
          });
      }

      // Apply pending votes
      const pVotes = pendingVotes.filter(a => a.payload.postId === p.id);
      if (pVotes.length > 0) {
        const lastVote = pVotes[pVotes.length - 1].payload.voteType; // useful | fake | null
        if (lastVote === null) {
          modifiedPost.userVote = undefined;
        } else {
          modifiedPost.userVote = lastVote === 'useful' ? 'true' : 'false';
        }
      }

      // 4. Inject local pending comments into posts
      const pPending = pendingComments.filter(a => a.payload.postId === p.id);
      if (pPending.length > 0) {
        const localComments: Comment[] = pPending.map(a => ({
          id: a.id,
          authorId: a.payload.userId,
          authorName: user.name,
          authorAvatar: user.avatar || '',
          content: a.payload.content,
          timestamp: language === 'PT' ? 'A enviar...' : 'Agora mesmo',
          likes: 0,
          isPending: true
        }));

        const existingContents = new Set(p.comments?.map(c => c.content) || []);
        const uniqueLocal = localComments.filter(lc => !existingContents.has(lc.content));
        modifiedPost.comments = [...(p.comments || []), ...uniqueLocal];
      }

      return modifiedPost;
    }).sort((a, b) => {
        // 👑 MOTOR DE SOBERANIA MIRA (V2026.ULTRA - PROTOCOLO NOBEL)
        const getWeight = (p: Post) => {
            let weight = 0;
            // AIMA Soberania (5000)
            if (p.authorId === 'aima-official' || p.isAima || p.authorName?.toLowerCase().includes('aima')) weight += 5000; 
            // CEO Amanda Abreu (3000)
            if (p.authorName?.toLowerCase().includes('amanda abreu') || p.isCEO || p.authorEmail === 'amandasabreu89@gmail.com') weight += 3000; 
            if ((p.authorityLevel || 0) > 0) weight += 1000; // Vozes de Autoridade
            if (p.isVerified || p.authorIsVerified) weight += 500;  // Verificados
            return weight;
        };
        const weightA = getWeight(a);
        const weightB = getWeight(b);
        if (weightA !== weightB) return weightB - weightA;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [masterPosts, syncVersion, language, user.id, user.name, user.avatar]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    setIsLoadingMore(true);
    try {
      // Offset: skip local mock posts
      const offset = masterPosts.filter(p => !p.id.startsWith('p-') && !p.id.startsWith('local-')).length;
      const newPosts = await communityService.fetchPosts(user.id, 15, offset);

      if (newPosts.length < 15) setHasMorePosts(false);

      if (newPosts.length > 0) {
        setMasterPosts(prev => {
          const final = [...prev];
          newPosts.forEach(nP => {
            if (!final.some(p => p.id === nP.id)) final.push(nP);
          });
          return final;
        });
      }
    } catch (e) {
      console.error("Erro ao carregar mais posts:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // TARGET POST/COMMENT DEEP LINK LOGIC - V26.6 UNIFIED
  useEffect(() => {
    if (!targetPostId || masterPosts.length === 0) return;

    // V26.6: Reset filters when deep linking to ensure target is visible
    setActiveCategory('Todos');
    setSearchFilter('');

    const executeDeepLink = () => {
      const elementId = targetCommentId ? `comment-${targetCommentId}` : `post-${targetPostId}`;
      const el = document.getElementById(elementId);

      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-mira-orange', 'ring-offset-4', 'transition-all', 'duration-500', 'animate-pulse');
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-mira-orange', 'ring-offset-4', 'animate-pulse');
            if (onClearTargetPost) onClearTargetPost();
          }, 3000);
        }, 300);
        return true;
      }
      return false;
    };

    // Try finding in currently loaded posts
    if (!executeDeepLink()) {
      // If not found, it might be a database post not yet in masterPosts
      communityService.fetchPostById(targetPostId, user.id).then(post => {
        if (post) {
          setMasterPosts(prev => {
            if (prev.some(p => p.id === post.id)) return prev;
            return [post, ...prev];
          });
          // Wait for render
          // Aumentado para 800ms para garantir que a lista e os comentários foram renderizados (V26.8)
        setTimeout(executeDeepLink, 800);
        } else {
          // If post doesn't exist, clear to avoid stuck state
          if (onClearTargetPost) onClearTargetPost();
        }
      }).catch(() => {
        if (onClearTargetPost) onClearTargetPost();
      });
    }
  }, [targetPostId, targetCommentId, masterPosts.length]);

  // V2026.ULTRA: INFINITE SCROLL (INSTAGRAM STYLE)
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !isLoading && hasMorePosts && activeCategory === 'Todos' && !searchFilter) {
        console.log("MIRA_FLOW: Proactive pre-fetch triggered (1200px margin).");
        handleLoadMore();
      }
    }, { 
      rootMargin: '1200px', // V2026.ULTRA: ZERO-LATENCY PRE-FETCH
      threshold: 0.1 
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMorePosts, activeCategory, searchFilter]);

  // Debounced SQL sync for Likes and Votes
  const syncQueue = useRef<Record<string, NodeJS.Timeout>>({});

  const debouncedSync = (key: string, fn: () => Promise<any>) => {
    if (syncQueue.current[key]) clearTimeout(syncQueue.current[key]);
    syncQueue.current[key] = setTimeout(async () => {
      try { await fn(); } catch (e) { }
      delete syncQueue.current[key];
    }, 1000); // 1s debounce for backend sync
  };

  // V2026.SUPREMO: Massive Engagement Algorithm (Weekly Highlights: Likes + Verdadeiros)
  const topStories = useMemo(() => {
    // 🛡️ SOVEREIGN BRIDGE: Prioritize Nobel DB View but allow local injection for ultra-realtime
    const pendingPosts = syncService.getPendingActions().filter(a => a.action === 'post');
    const localStories = pendingPosts.map(a => masterPostsWithLocal.find(p => p.id === a.id)).filter(Boolean) as Post[];
    
    // Combine backend authoritative stories with current local session posts
    return [...localStories, ...dbStories].slice(0, 30);
  }, [dbStories, masterPostsWithLocal]);

  // Story Auto-Advance (Instagram style)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeStory) {
      timer = setTimeout(() => {
        const currentIndex = topStories.findIndex(s => s.id === activeStory.id);
        if (currentIndex !== -1 && currentIndex < topStories.length - 1) {
          setActiveStory(topStories[currentIndex + 1]);
        } else {
          setActiveStory(null);
        }
      }, 5000); // 5 seconds per story
    }
    return () => clearTimeout(timer);
  }, [activeStory, topStories]);

  // No more localStorage.setItem for likes/votes to ensure cross-device consistency.

  // V26.99: Persistent sync is now handled globally in App.tsx via likedPostsIds and userVotes props.
  // We no longer overwrite them here to avoid race conditions with optimistic updates.

  const filteredPosts = useMemo(() => {
    // V99.3: ULTRA-PERMISSIVE FILTERING BRIDGE
    const isAll = !activeCategory || 
                  activeCategory === 'Todos' || 
                  activeCategory === 'Todas as Categorias' ||
                  activeCategory === 'Toutes les catégories' ||
                  activeCategory === 'All Categories';
    
    const normActive = activeCategory.trim();

    let result = isAll ? masterPostsWithLocal : masterPostsWithLocal.filter(p => {
        const pCat = (p.category || '').trim();
        // Compare with both normalized and raw to be 100% safe
        return pCat === normActive || normalizeCategory(pCat) === normActive;
    });

    if (searchFilter.trim()) {
      const term = searchFilter.toLowerCase();
      result = result.filter(p => 
        (p.content || '').toLowerCase().includes(term) || 
        (p.authorName || '').toLowerCase().includes(term) ||
        (p.title || '').toLowerCase().includes(term)
      );
    }
    return result;
  }, [activeCategory, masterPostsWithLocal, searchFilter]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedCategory || isSubmittingPost) {
      if (!isSubmittingPost) showToast("Por favor, preencha o conteúdo e escolha uma categoria.", "warning");
      return;
    }
    
    setIsSubmittingPost(true);
    const postPayload = {
      authorId: user.id,
      title: 'Post Comunitário',
      content: newPostContent,
      category: selectedCategory,
      backgroundImage: selectedImage
    };

    // V26.8: INSTANT UI FEEDBACK PROTOCOL
    // Close modal and clear state immediately so user is not stuck spinning
    setShowCreateModal(false);
    const backupContent = newPostContent;
    const backupCategory = selectedCategory;
    
    setNewPostContent('');
    setSelectedCategory('' as any);
    onEarnPoints(10);

    try {
      // 1. Queue it in SyncService for guaranteed background delivery
      await syncService.enqueue('post', postPayload);
      
      // V26.8: INSTANT UI FEEDBACK - PREPEND TO MASTER POSTS
      const localPost: Post = {
        id: `local-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar || '',
        title: postPayload.title,
        content: postPayload.content,
        category: postPayload.category,
        userVote: null,
        // Optimized rendering hint
        isOptimistic: true,
        backgroundImage: postPayload.backgroundImage,
        likes: 0,
        comments: [],
        timestamp: new Date().toISOString(),
        isVerified: false,
        isPending: false
      } as any;

      setMasterPosts(prev => [localPost, ...prev]);
      setSyncVersion(v => v + 1);

      // 2. Trigger a sync attempt immediately (non-blocking)
      syncService.processQueue();
      
      showToast(t('toast_form_success', language), "success");
      
      // 3. Reset filters & scroll to top to see the "Sending..." post
      setActiveCategory("Todos");
      setSearchFilter("");
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setSyncVersion(v => v + 1); // V98.0: EXTREME SPEED
      analytics.track('post_created', user.id, backupCategory);

    } catch (e: any) {
      console.error('Failed to queue post:', e);
      showToast(t('toast_form_error', language), "error");
      // Restore state if queue failed (rare)
      setNewPostContent(backupContent);
      setSelectedCategory(backupCategory as any);
      setShowCreateModal(true);
    } finally {
      setIsSubmittingPost(false);
    }
  };

    // V98.0: State is managed via props (masterPosts, likedPosts, userVotes)
    // No local effects to save to localStorage here.

  const handleLike = async (postId: string, commentId?: string) => {
    if (!user) return;
    const post = masterPosts.find(p => p.id === postId);
    if (!post) return;

    let isLiked: boolean;
    let targetAuthorId: string | undefined;

    if (commentId) {
      const comment = post.comments.find(c => c.id === commentId);
      isLiked = likedComments.has(commentId) || !!comment?.isLikedByUser;
      targetAuthorId = comment?.authorId;
    } else {
      isLiked = likedPosts.has(postId) || !!post.isLikedByUser;
      targetAuthorId = post.authorId;
    }

    // V2026.NOBEL: OPTIMISTIC REPUTATION (0ms)
    // Server-side triggers in 005_sovereign_logic_lock.sql now handle both:
    // 1. +1 point for the liker (tr_award_reputation_on_like)
    // 2. +5 points for the author (tr_award_reputation_on_like)
    // Client-side calls removed here to prevent double-counting.
    if (!isLiked) {
      // Logic for daily stats/limits can remain local if needed to prevent spamming
      const today = new Date().toDateString();
      const dailyStats = JSON.parse(localStorage.getItem('mira_daily_stats') || '{}');
      if (!dailyStats[today]) dailyStats[today] = { likes: 0 };
      if (dailyStats[today].likes < 10) {
        onEarnPoints(1, 'Interação', true); // Optimistic UI ONLY (Server Trigger handles the real +1)
        dailyStats[today].likes += 1;
        localStorage.setItem('mira_daily_stats', JSON.stringify(dailyStats));
      }

      // Receive Like (+5 points for the author)
      if (targetAuthorId === user.id) {
          onEarnPoints(5, 'Bónus recebido', true); // Optimistic UI ONLY (Server Trigger handles the real +5)
      }
    }

    // Optimistic UI for Likes Count
    setMasterPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      if (!commentId) {
        return { ...p, likes: isLiked ? Math.max(0, p.likes - 1) : p.likes + 1, isLikedByUser: !isLiked };
      }
      return {
        ...p,
        comments: p.comments.map(c => c.id === commentId ? { ...c, likes: isLiked ? Math.max(0, c.likes - 1) : c.likes + 1, isLikedByUser: !isLiked } : c)
      };
    }));

    try {
      if (commentId) {
        setLikedComments(prev => {
          const next = new Set(prev);
          if (isLiked) next.delete(commentId); else next.add(commentId);
          return next;
        });
        const comment = post.comments.find(c => c.id === commentId);
        await syncService.enqueue('like', { commentId, postId, userId: user.id, authorId: comment?.authorId, voteType: isLiked ? null : 'like' });
      } else {
        setLikedPosts(prev => {
          const next = new Set(prev);
          if (isLiked) next.delete(postId); else next.add(postId);
          return next;
        });
        await syncService.enqueue('like', { postId, userId: user.id, authorId: post.authorId, voteType: isLiked ? null : 'like' });
      }
      
      syncService.processQueue();
      setSyncVersion(v => v + 1);
    } finally {
      // In handleLike we don't have a local loading state for individual likes, 
      // but we ensure the sync version is bumped to re-render.
      setSyncVersion(v => v + 1);
    }
  };


  const handleDeletePost = async (postId: string) => {
    setMasterPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await communityService.deletePost(postId);
    } catch (e) { console.error(e); }
  };

  // Delete a single comment without touching the post
  const handleDeleteComment = async (postId: string, commentId: string) => {
    // Optimistic UI: remove comment from post
    setMasterPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: p.comments.filter(c => c.id !== commentId) };
    }));
    try {
      const { supabase } = await import('../lib/supabase');
      await supabase.from('comments').delete().eq('id', commentId);
    } catch (e) { console.error('Erro ao apagar comentário:', e); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentingOn || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const finalContent = commentingOn.replyToName ? `@${commentingOn.replyToName} ${newComment}` : newComment;
    const backupPostId = commentingOn.postId;

    try {
      const isMockPost = backupPostId === '1' || backupPostId.startsWith('p-');
      const dbCommentId = `local-${Date.now()}`;

      // Real DB logic (queued for sync, works offline)
      if (!isMockPost) {
        await syncService.enqueue('comment', { 
            postId: backupPostId, 
            userId: user.id, 
            content: finalContent,
            parentId: commentingOn.parentId 
        });
        syncService.processQueue();
      }

      // Update UI Optimistically
      const comment: Comment = {
        id: dbCommentId,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        content: finalContent,
        timestamp: 'Agora mesmo',
        likes: 0,
        parentId: commentingOn.parentId
      };

      setMasterPosts(prev => prev.map(p => {
        if (p.id !== backupPostId) return p;
        return { ...p, comments: [...p.comments, comment] };
      }));

      setCommentingOn(null);
      setNewComment('');
      setSyncVersion(v => v + 1); // Force immediate local merge
      onEarnPoints(2);
      analytics.track('comment_created', user.id);

    } catch (error: any) {
      console.error("Erro ao publicar comentário:", error);
      showToast(t('toast_form_error', language), 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFactVote = async (postId: string, isTrue: boolean) => {
    const post = masterPosts.find(p => p.id === postId);
    if (!post) return;

    const newVote = isTrue ? 'true' : 'false';
    const currentVote = userVotes[postId] || post.userVote;
    const isRemoving = currentVote === newVote;

    // Optimistic UI for masterPosts
    setMasterPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      let useful = p.usefulVotes || 0;
      let fake = p.fakeVotes || 0;
      
      // Remove current state
      if (currentVote === 'true') useful = Math.max(0, useful - 1);
      if (currentVote === 'false') fake = Math.max(0, fake - 1);
      
      // Add new state
      if (!isRemoving) {
        if (newVote === 'true') useful++; else fake++;
      }
      
      return { ...p, usefulVotes: useful, fakeVotes: fake, userVote: isRemoving ? undefined : newVote };
    }));

    setUserVotes(prev => {
      const next = { ...prev };
      if (isRemoving) delete next[postId];
      else next[postId] = newVote as 'true' | 'false';
      return next;
    });

    // V98.0: NO DEBOUNCE. 
    await syncService.enqueue('vote', { postId, userId: user.id, authorId: post.authorId, voteType: isRemoving ? null : (isTrue ? 'useful' : 'fake') });
    syncService.processQueue();
    setSyncVersion(v => v + 1);
    
    if (!isRemoving) onEarnPoints(1);
  };

  const handleReportSubmit = async () => {
    if (!reportForm.reason.trim() || isSubmittingReport) {
      if (!isSubmittingReport) showToast(t('toast_report_reason_required', language), "warning");
      return;
    }

    setIsSubmittingReport(true);
    
    // V55.0 PROTOCOLO DE TRIAGEM: Instant Feedback & Modal Close
    const isCommentReport = !!reportingItem?.commentId;
    const targetId = reportingItem?.commentId || reportingItem?.postId;

    // Safety timer to prevent "infinite rodinha"
    const safetyTimer = setTimeout(() => {
        setIsSubmittingReport(false);
        setReportingItem(null);
    }, 5000);

    try {
      const payload = {
        postId: reportingItem?.postId,
        commentId: reportingItem?.commentId,
        userId: user.id,
        reason: reportForm.reason,
        name: reportForm.name || user.name,
        email: reportForm.email || user.email,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      // Persist in background
      await syncService.enqueue('report', payload);
      syncService.processQueue();
      
      showToast(t('toast_form_success', language) || "Denúncia enviada com sucesso", "success");
      
      if (typeof analytics !== 'undefined') {
        analytics.track('content_reported', user.id, isCommentReport ? 'comment' : 'post', { targetId });
      }
    } catch (e: any) {
      console.error('MIRA: Error in report submission:', e);
      showToast(t('toast_form_error', language), "error");
    } finally {
      clearTimeout(safetyTimer);
      setReportingItem(null);
      setReportForm({ name: user.name || '', email: user.email || '', reason: '' });
      setTimeout(() => setIsSubmittingReport(false), 600);
    }
  };


  const openMemberProfile = async (authorData: Post | {authorId: string, authorName: string, authorAvatar: string, authorBio?: string, authorBadges?: string[], authorIsVerified?: boolean, authorFollowersCount?: number, authorFollowingCount?: number, authorityLevel?: number}) => {
    if (onViewProfile) {
        onViewProfile(authorData.authorId, authorData.authorName, authorData.authorAvatar);
    } else {
        // MIRA V2026: Sincronização Soberana de Perfil
        const authorId = authorData.authorId;
        setSelectedMember({
          id: authorId,
          name: authorData.authorName,
          avatar: authorData.authorAvatar,
          reputation: authorData.authorityLevel || 0,
          trustLevel: 'Membro' as any,
          bio: authorData.authorBio || '',
          isVerified: authorData.authorIsVerified || false,
          followersCount: authorData.authorFollowersCount || 0,
          followingCount: authorData.authorFollowingCount || 0,
          badges: authorData.authorBadges || [],
          verifiedPostsCount: 0,
          totalLikesReceived: 0
        } as unknown as User);
        
        try {
          const profile = await authService.fetchProfileWithRetry(authorId, '');
          if (profile) {
            const u = authService.mapProfileToUser(profile, null);
            setSelectedMember(u);
            if (user.id !== authorId) {
              const following = await followService.isFollowing(user.id, authorId);
              setIsFollowingMember(following);
            }
          }
        } catch (e) { console.error(e); }
    }
  };

  const handleFollowUser = async () => {
    if (!selectedMember || !user || user.id === selectedMember.id || isFollowLoading) return;

    const targetId = selectedMember.id;
    
    // Prevent following official profiles (which are not in UUID format)
    if (targetId.includes('mira-') || targetId.includes('noticias')) {
      showToast(t('toast_follow_official_error', language), "info");
      return;
    }

    const currentlyFollowing = isFollowingMember;

    // Optimistic UI update immediately
    setIsFollowingMember(!currentlyFollowing);
    setSelectedMember(prev => {
      if (!prev) return null;
      return {
        ...prev,
        followersCount: currentlyFollowing ? Math.max(0, prev.followersCount - 1) : prev.followersCount + 1
      };
    });

    setIsFollowLoading(true);

    // Hard safety: button can NEVER stay frozen more than 8s
    const safetyTimer = setTimeout(() => setIsFollowLoading(false), 8000);

    try {
      if (currentlyFollowing) {
        await followService.unfollowUser(user.id, targetId);
      } else {
        await followService.followUser(user.id, targetId);
        onEarnPoints(5);
      }
      showToast(currentlyFollowing ? t('toast_unfollow_success', language) : t('toast_follow_success', language), "success");
      
      // V26.7: Sync global user state
      if (onUpdateUser) {
        onUpdateUser({
          ...user,
          followingCount: currentlyFollowing ? Math.max(0, user.followingCount - 1) : user.followingCount + 1
        });
      }

      analytics.track('user_followed', user.id);
    } catch (e: any) {
      console.error("MIRA Follow error:", e);
      // Rollback optimistic update
      setIsFollowingMember(currentlyFollowing);
      setSelectedMember(prev => {
        if (!prev) return null;
        return {
          ...prev,
          followersCount: currentlyFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1)
        };
      });
      // Human-readable error
      const rawMsg = e?.message || '';
      let errMsg = t('toast_follow_generic_error', language);
      if (rawMsg.includes('violates') || rawMsg.includes('policy') || rawMsg.includes('RLS') || rawMsg.includes('permission')) {
        errMsg = t('toast_follow_permission_error', language);
      } else if (rawMsg.includes('duplicate') || rawMsg.includes('unique')) {
        errMsg = t('toast_follow_duplicate_error', language);
        setIsFollowingMember(true); // Correct the UI state
      } else if (rawMsg.includes('does not exist') || rawMsg.includes('relation')) {
        errMsg = t('toast_follow_setup_error', language);
      }
      showToast(errMsg, 'error');
    } finally {
      clearTimeout(safetyTimer);
      setIsFollowLoading(false);
    }
  };

  const handleReportAction = (postId: string, commentId?: string) => {
    // Reset form and open report modal, keeping context of what is being reported
    setReportForm({ name: user.name || '', email: user.email || '', reason: '' });
    setReportingItem({ postId, commentId });
  };

  const handleToggleTranslate = (id: string) => {
    setTranslatedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReplyComment = (postId: string, replyToName: string, parentId?: string) => {
    setCommentingOn({ postId, replyToName, parentId });
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-hidden relative font-['Plus_Jakarta_Sans']">

      {/* STORY MODAL - V27.0: IRONCLAD Z-INDEX 9999 & CINEMATIC DARKNESS */}
      {activeStory && (
        <div className="fixed inset-0 z-[9999] bg-[#1a1a1b] flex flex-col pt-safe animate-in zoom-in-95 duration-500 overflow-hidden h-screen h-[100dvh]">
          <div className="px-6 flex justify-between items-center mb-6 pt-10 md:pt-12 relative z-[10000]">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveStory(null); openMemberProfile(activeStory); }}>
              <div className="w-12 h-12 rounded-[1.2rem] p-[2px] bg-gradient-to-tr from-[#f97316] via-[#facc15] to-[#3b82f6] shadow-2xl">
                 <img src={activeStory.authorAvatar} className="w-full h-full rounded-[1.1rem] border-2 border-white/20 group-hover:border-white transition-colors object-cover" />
              </div>
              <div className="flex flex-col">
                <p className="text-white font-black text-sm uppercase tracking-tight leading-none mb-1">{activeStory.authorName}</p>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                   <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">{t(getCategoryKey(activeStory.category), language)}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setActiveStory(null)} className="p-3 bg-white/10 hover:bg-white/25 rounded-full transition-all text-white"><X size={20} /></button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center p-6 relative group">
            {/* Story Navigation areas (Instagram style) */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[30%] z-50 cursor-w-resize"
              onClick={(e) => {
                e.stopPropagation();
                const idx = topStories.findIndex(s => s.id === activeStory.id);
                if (idx > 0) setActiveStory(topStories[idx - 1]);
              }}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-[70%] z-50 cursor-e-resize"
              onClick={(e) => {
                e.stopPropagation();
                const idx = topStories.findIndex(s => s.id === activeStory.id);
                if (idx < topStories.length - 1) setActiveStory(topStories[idx + 1]);
                else setActiveStory(null); // Close if last story
              }}
            />

            <div className="absolute inset-0 z-0 opacity-20 blur-3xl scale-125">
              <img src={activeStory.backgroundImage} className="w-full h-full object-cover transition-opacity duration-300" />
            </div>

            <div className="relative z-10 w-full max-w-xl px-6 md:px-0 max-h-full overflow-y-auto no-scrollbar py-12 flex items-center justify-center">
               <div className="space-y-4 md:space-y-8 animate-in slide-in-from-bottom-5 duration-700 w-full">
                  <div className="h-1 bg-white/20 rounded-full w-full max-w-[120px] mx-auto mb-8 overflow-hidden">
                     <div className="h-full bg-mira-orange rounded-full w-2/3 animate-[progress_5s_linear_infinite]" />
                  </div>
                  
                  <blockquote className="relative">
                    <Sparkles className="absolute -top-12 -left-6 text-white/5 w-24 h-24 rotate-12" />
                    <p className="font-black text-white leading-tight tracking-tighter uppercase drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-2xl sm:text-3xl md:text-5xl lg:text-7xl text-center break-words px-2 sm:px-4">
                      <TranslatedText
                        text={activeStory.content}
                        language={language}
                        shouldTranslate={translatedPosts.has(activeStory.id)}
                      />
                    </p>
                  </blockquote>
               </div>
            </div>
          </div>

          <div className="p-8 pb-12 flex justify-center gap-6 z-10 bg-gradient-to-t from-black to-transparent">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center text-white"><Handshake size={24} className="fill-mira-blue text-mira-blue" /></div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{activeStory.likes} {t('comm_support', language) || 'Apoios'}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center text-white"><MessageCircle size={24} className="text-indigo-400" /></div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">{activeStory.comments.length} {t('comm_comments', language) || 'Coment.'}</span>
            </div>
            <div className="flex flex-col items-center gap-2" onClick={() => {
              const thePost = activeStory.id;
              setActiveStory(null);
              setSearchFilter("");
              setActiveCategory("Todos");
              setTimeout(() => {
                const el = document.getElementById(`post-${thePost}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}>
              <div className="w-14 h-14 bg-mira-orange rounded-[1.2rem] flex items-center justify-center text-white cursor-pointer shadow-[0_0_20px_#f97316] hover:scale-105 active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></div>
              <span className="text-mira-orange text-[10px] font-black uppercase tracking-widest">Abrir Post</span>
            </div>
          </div>
        </div>
      )}

      {/* Perfil Popup Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[600] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <button onClick={() => setSelectedMember(null)} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X size={20} /></button>

            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-[2.8rem] p-1 bg-gradient-to-tr from-[#f97316] via-[#facc15] to-[#3b82f6] shadow-2xl">
                <img src={selectedMember.avatar} className="w-full h-full rounded-[2.5rem] object-cover border-4 border-white" alt="" referrerPolicy="no-referrer" />
              </div>
              {selectedMember.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 size={24} className="text-mira-blue fill-mira-blue" />
                </div>
              )}
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">{selectedMember.name}</h3>
            <p className="text-[10px] font-black text-mira-orange uppercase tracking-[0.2em] mb-6">{selectedMember.trustLevel}</p>

            <div className="grid grid-cols-2 gap-3 w-full mb-8">
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <Users size={18} className="text-mira-orange mb-1" />
                <span className="text-sm font-black">{selectedMember.followersCount || 0}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">{t('profile_followers', language)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <Zap size={18} className="text-mira-blue mb-1" />
                <span className="text-sm font-black">{selectedMember.followingCount || 0}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">{t('profile_following', language)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <CheckCircle2 size={18} className="text-emerald-500 mb-1" />
                <span className="text-sm font-black">{selectedMember.verifiedPostsCount || 0}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">{t('verified_posts_count', language) || 'Posts Verificados'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl flex flex-col items-center shadow-inner">
                <Heart size={18} className="text-rose-500 mb-1" />
                <span className="text-sm font-black">{selectedMember.totalLikesReceived || 0}</span>
                <span className="text-[7px] font-black text-slate-400 uppercase">{t('total_likes_received', language) || 'Total Curtidas'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl flex items-center justify-center col-span-2 shadow-inner">
                 <div className="flex flex-col items-center py-2">
                    <Handshake size={18} className="text-mira-blue mb-1" />
                    <span className="text-sm font-black">{selectedMember.reputation || 0}</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase">{t('profile_impact', language) || 'Impacto Comunitário'}</span>
                 </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 italic">"{selectedMember.bio}"</p>

            {/* SELOS DE ELITE (V2026) */}
            {selectedMember.badges && selectedMember.badges.length > 0 && (
              <div className="w-full space-y-3 mb-10">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Conquistas de Elite</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedMember.badges.map(bid => {
                     const b = {
                        'pioneiro': { name: 'Pioneiro MIRA', color: 'text-slate-400', icon: Star },
                        'verificada': { name: 'Conta Verificada', color: 'text-mira-blue', icon: CheckCircle2 },
                        'sentinela': { name: 'Sentinela', color: 'text-red-500', icon: ShieldAlert },
                        'escudo_anti_burla': { name: 'Escudo Anti-Burla', color: 'text-red-600', icon: Shield },
                        'mestre_docs': { name: 'Mestre dos Documentos', color: 'text-amber-500', icon: Bookmark },
                        'curador': { name: 'Curador da Comunidade', color: 'text-emerald-500', icon: CheckCircle2 },
                        'exemplar': { name: 'Utilizador Exemplar', color: 'text-slate-500', icon: Medal },
                        'voz_autoridade': { name: 'Voz de Autoridade', color: 'text-mira-orange', icon: Sparkles },
                        'guia_local': { name: 'Guia Local', color: 'text-blue-500', icon: MapPin },
                        'coracao': { name: 'Coração da Comunidade', color: 'text-rose-500', icon: Heart },
                     }[bid] || { name: bid, color: 'text-slate-400', icon: Star };
                     
                     const Icon = b.icon;
                     return (
                        <div key={bid} className={`p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-2 ${b.color}`}>
                           <Icon size={14} strokeWidth={3} />
                           <span className="text-[8px] font-black uppercase tracking-tighter">{b.name}</span>
                        </div>
                     );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4 w-full">
              {user.id !== selectedMember.id && (
                <button 
                  onClick={handleFollowUser} 
                  disabled={isFollowLoading}
                  className="flex-1 py-4 !bg-mira-orange !text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(255,140,0,0.5)]"
                >
                  {isFollowLoading ? <Loader2 size={14} className="animate-spin" /> : isFollowingMember ? <UserCheck size={14} /> : <UserPlus size={14} />}
                  {isFollowingMember ? t('profile_following_status', language) || 'A seguir' : t('profile_follow_btn', language) || 'Seguir Membro'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-48 bg-white">

        {/* TOP BAR NOW SCROLLS WITH CONTENT FOR BETTER MOBILE VIEWING - IMPERIAL DESIGN */}
        <div className="bg-white px-6 pt-8 pb-4 space-y-4 border-b border-slate-100 z-[100] shadow-sm mb-6 sticky top-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button onClick={() => onViewChange(ViewType.PROFILE)} className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#FF8C00] via-[#FFD700] to-[#FF8C00] shadow-lg active:scale-90 transition-transform">
                <img src={user.avatar} className="w-full h-full object-cover rounded-full border-2 border-transparent" alt="Perfil" referrerPolicy="no-referrer" />
              </button>
              <div><h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">MIRA HUB</h2></div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="w-12 h-12 bg-[#FF8C00] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 active:scale-90 hover:scale-105 transition-all relative z-[150] cursor-pointer"
            >
              <Plus size={24} strokeWidth={4} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors" size={18} />
              <input type="text" placeholder={t('comm_search', language) || "Pesquisar..."} value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#FF8C00] outline-none transition-all shadow-sm" />
            </div>
            <div className="relative group">
              <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full pl-6 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:border-[#FF8C00] text-slate-700 shadow-sm transition-all">
                <option value="Todos" className="bg-white">{t('comm_all_cats', language) || "Todas as Categorias"}</option>
                {UNIFIED_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-white">{t(getCategoryKey(cat), language)}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
            </div>
          </div>
        </div>

        {/* STORIES SECTION - MODERN WHITE DESIGN (V27.1) */}
        {(topStories.length > 0 || isLoadingStories) && (
          <div className="mb-2 border-b border-slate-100 pb-6 bg-white mt-4 relative z-20">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] px-8 pt-4 mb-3 flex items-center gap-2">
              <Star size={12} className="text-[#FF8C00] fill-[#FF8C00]" /> 
              {t('home_popular_title', language)} ({topStories.length})
              {isLoadingStories && <Loader2 size={10} className="animate-spin" />}
            </h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-8 snap-x">
              {topStories.map((story, i) => (
                <div key={story.id} className="flex flex-col items-center gap-2.5 cursor-pointer group shrink-0 snap-start active:scale-95 transition-transform" onClick={() => setActiveStory(story)}>
                  <div className="w-[4.6rem] h-[4.6rem] rounded-full p-[2.5px] bg-gradient-to-tr from-[#FF8C00] via-[#FFD700] to-[#3b82f6] shadow-xl group-hover:scale-110 transition-all relative overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                      <img 
                        src={story.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName)}&background=1e293b&color=fff`} 
                        className="w-full h-full rounded-full object-cover z-10 group-hover:scale-110 transition-transform duration-500" 
                        alt="" 
                        referrerPolicy="no-referrer" 
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate w-[4.5rem] text-center opacity-80 group-hover:opacity-100 group-hover:text-slate-600">{(story.authorName || 'Membro').split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 space-y-10">
          {filteredPosts.length > 0 ? filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              language={language}
              isPostLiked={likedPosts.has(post.id) || !!post.isLikedByUser}
              isPostSaved={savedPostsIds.has(post.id)}
              userVote={userVotes[post.id] || post.userVote}
              translatedPosts={translatedPosts}
              likedComments={likedComments}
              onLike={handleLike}
              onComment={(id) => setCommentingOn({ postId: id })}
              onToggleSave={onToggleSavePost}
              onFactVote={handleFactVote}
              onReport={handleReportAction}
              onDelete={(id) => setConfirmDeleteId(id)}
              onDeleteAccount={() => {
                  communityService.deleteUserAccount(user.id).then(() => {
                      showToast("Conta excluída com sucesso (RGPD).", "success");
                      onViewChange(ViewType.HOME);
                  });
              }}
              onFollow={(authorId) => communityService.toggleFollow(user.id, authorId)}
              onDeleteComment={(postId, commentId) => setConfirmDeleteComment({ postId, commentId })}
              onOpenProfile={openMemberProfile}
              onToggleTranslate={handleToggleTranslate}
              onReplyComment={handleReplyComment}
              onLikeComment={handleLike}
              onReportComment={handleReportAction}
              isAdmin={user.role === 'admin'}
            />
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Search size={24} /></div>
               <p className="font-bold text-sm uppercase tracking-widest">{t('comm_no_posts', language) || "Nenhuma publicação encontrada"}</p>
            </div>
          )}

          {/* INFINITE SCROLL SENTINEL & SPINNER */}
          <div ref={loaderRef} className="flex justify-center py-10">
            {hasMorePosts && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-mira-orange opacity-40" />
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">MIRA FLOW ATIVO</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Confirmação de Delete Modals e Outros modais continuam aqui... */}
      </div>

      {/* REPORT MODAL - Separated context for POST vs COMMENT */}
      {reportingItem && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className={`bg-white w-full max-w-sm rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 shadow-2xl relative border-t-8 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh] ${reportingItem.commentId ? 'border-red-500' : 'border-mira-orange'}`}>
            <button 
              onClick={() => setReportingItem(null)} 
              className="absolute top-3 right-3 sm:top-5 sm:right-5 p-3 bg-slate-900/10 hover:bg-slate-200 rounded-full transition-all text-slate-800 z-50 shadow-sm active:scale-95"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6 sm:mb-8 pr-8">
              <div className={`p-3 rounded-2xl shadow-sm shrink-0 ${reportingItem.commentId ? 'bg-red-50 text-red-500' : 'bg-mira-orange/10 text-mira-orange'}`}>
                <ShieldAlert size={28} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter leading-none truncate">
                  {reportingItem.commentId ? t('comm_report_comment_title', language) : t('comm_report_post_title', language)}
                </h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                  {reportingItem.commentId ? t('comm_report_only_comment', language) : t('comm_report_entire_post', language)}
                </p>
              </div>
            </div>

            {/* Visual badge - what is being reported */}
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl mb-6 ${reportingItem.commentId ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
              {reportingItem.commentId
                ? <><Flag size={14} className="text-red-500 shrink-0" /><p className="text-[10px] text-red-700 font-bold">{t('comm_report_comment_warning', language)}</p></>
                : <><ShieldAlert size={14} className="text-amber-600 shrink-0" /><p className="text-[10px] text-amber-800 font-bold">{t('comm_report_post_warning', language)}</p></>}
            </div>

            <div className="space-y-4">
              {/* Quick Report Options */}
              {!reportingItem.commentId && (
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={() => setReportForm({ ...reportForm, reason: t('comm_report_fake', language) })}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-red-100 shadow-sm"
                  >
                    <ShieldX size={14} /> {t('comm_report_fake', language)}
                  </button>
                </div>
              )}

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{t('comm_report_your_name', language)}</label>
                <input type="text" value={reportForm.name} onChange={e => setReportForm({ ...reportForm, name: e.target.value })} className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none" placeholder={t('comm_report_name_placeholder', language)} />
              </div>
              <div className="mt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">{t('comm_report_reason_label', language)}</label>
                <textarea
                  autoFocus
                  value={reportForm.reason}
                  onChange={e => setReportForm({ ...reportForm, reason: e.target.value })}
                  className="w-full h-28 sm:h-32 p-4 sm:p-5 bg-slate-50 border-2 border-transparent focus:border-red-400 focus:bg-white rounded-[2rem] sm:rounded-3xl text-xs sm:text-sm font-bold outline-none transition-all resize-none shadow-inner"
                  placeholder={reportingItem.commentId ? t('comm_report_comment_placeholder', language) : t('comm_report_post_placeholder', language)}
                />
              </div>
              <button
                onClick={handleReportSubmit}
                disabled={!reportForm.reason.trim() || isSubmittingReport}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('comm_report_sending', language)}
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className="shrink-0" />
                    {t('comm_report_send_btn', language)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-md flex flex-col justify-end sm:items-center sm:justify-center sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl sm:rounded-[2.5rem] shadow-2xl relative flex flex-col h-[92dvh] sm:h-auto sm:max-h-[90vh] animate-in slide-in-from-bottom-8 overflow-hidden rounded-t-[2.5rem]">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-50 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-mira-blue/10 text-mira-blue rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{t('comm_create_post_title', language)}</h3>
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">MIRA Community Portal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-3 bg-slate-900/5 text-slate-900/40 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                title="Fechar"
              >
                <X size={22} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 space-y-8 pb-[100px] sm:pb-8">

              {/* Post Message */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value.substring(0, 300))}
                    placeholder={t('comm_create_post_placeholder', language)}
                    className="w-full h-48 bg-slate-50/70 border-2 border-transparent focus:border-mira-orange focus:bg-white rounded-[2.5rem] p-8 text-lg font-bold outline-none transition-all resize-none shadow-inner"
                  />
                  <div className={`absolute bottom-6 right-8 text-[10px] font-black uppercase tracking-widest ${newPostContent.length >= 280 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                    {newPostContent.length} / 300
                  </div>
                </div>
              </div>

              {/* Categorias & Fundo */}
              <div className="grid grid-cols-1 gap-8">

                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('comm_create_post_category', language)}</label>
                  <div className="relative">
                    <select
                      required
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as UnifiedCategory)}
                      className="w-full pl-6 pr-12 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-700 uppercase tracking-widest appearance-none outline-none focus:bg-white focus:border-mira-blue transition-all cursor-pointer"
                    >
                      <option value="" disabled className="text-slate-300">{t('comm_create_post_select_cat', language)}</option>
                      {UNIFIED_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                  </div>
                </div>

                {/* Image Selection Grid */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('comm_create_post_background', language)}</label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMED_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-full aspect-square rounded-2xl overflow-hidden border-[3px] transition-all relative ${selectedImage === img ? 'border-mira-blue scale-100 shadow-xl shadow-mira-blue/20 opacity-100 z-10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={getImageUrl(img)} className="w-full h-full object-cover" alt={`Fundo ${idx + 1}`} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.jpg'; }} />
                        {selectedImage === img && (
                          <div className="absolute inset-0 bg-mira-blue/20 flex items-center justify-center backdrop-blur-[1px]">
                            <CheckCircle2 size={24} className="text-white fill-mira-blue drop-shadow-md" />
                          </div>
                        )}
                        {selectedImage !== img && (
                          <div className="absolute inset-0 bg-[#001F3F]/10 transition-colors"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div className="p-6 sm:p-8 border-t border-slate-100 shrink-0 bg-white sm:rounded-b-[2.5rem] mt-auto">
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || !selectedCategory || isSubmittingPost}
                className="w-full bg-mira-orange hover:bg-mira-orange/90 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 mb-6 sm:mb-0"
              >
                {isSubmittingPost ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('comm_loading', language)}
                  </>
                ) : (
                  <>
                    <Send size={18} /> {t('comm_create_post_submit', language)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMENTING MODAL with Reply Mention logic */}
      {commentingOn && (
        <div className="fixed inset-0 z-[400] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom-10 border-t-4 border-mira-orange">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {commentingOn.replyToName ? `${t('comm_reply_to', language)} @${commentingOn.replyToName}` : t('comm_new_comment', language)}
              </h3>
              <button onClick={() => setCommentingOn(null)} className="p-3 bg-slate-50 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <textarea autoFocus value={newComment} onChange={(e) => setNewComment(e.target.value)} className="w-full h-40 p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] text-sm font-bold focus:bg-white focus:border-mira-orange outline-none shadow-inner resize-none" placeholder={commentingOn.replyToName ? t('comm_write_reply', language) : t('comm_share_help', language)} />
              <button onClick={handleAddComment} disabled={!newComment.trim()} className="w-full bg-mira-orange text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-30">
                <Send size={20} /> {commentingOn.replyToName ? t('comm_publish_reply', language) : t('comm_publish_comment', language)}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRM DELETE POST MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[800] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center">
              <Trash2 size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('comm_delete_post_q', language)}</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">{t('comm_delete_post_warning', language)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <button onClick={() => setConfirmDeleteId(null)} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">{t('comm_cancel_btn', language)}</button>
              <button onClick={() => { handleDeletePost(confirmDeleteId); setConfirmDeleteId(null); }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 active:scale-95 transition-all">{t('comm_delete_post_btn', language)}</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE COMMENT MODAL */}
      {confirmDeleteComment && (
        <div className="fixed inset-0 z-[800] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center">
              <MessageCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('comm_delete_comment_q', language)}</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">{t('comm_delete_comment_warning', language)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <button onClick={() => setConfirmDeleteComment(null)} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">{t('comm_cancel_btn', language)}</button>
              <button
                onClick={() => { handleDeleteComment(confirmDeleteComment.postId, confirmDeleteComment.commentId); setConfirmDeleteComment(null); }}
                className="py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 shadow-xl shadow-orange-100 active:scale-95 transition-all"
              >{t('comm_delete_comment_btn', language)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(CommunityViewComponent);
