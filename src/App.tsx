import React, { useState, useEffect } from 'react';
import { persistence } from './utils/persistence';
import { supabase } from './lib/supabase';
import Navigation from './components/Navigation';
import CommunityView from './components/CommunityView';
import AssistantView from './components/AssistantView';
import DashboardView from './components/DashboardView';
import { HomeView } from './components/HomeView';
import { DocumentAssistant } from './components/DocumentAssistant';
import { GamificationProfile } from './components/GamificationProfile';
import { JobBoard } from './components/JobBoard';
import { LearningView } from './components/LearningView';
import { SimulatorsView } from './components/SimulatorsView';
import { NotificationCenter } from './components/NotificationCenter';
import { communityService } from './services/communityService';
import { normalizeCategory } from './utils/categoryUtils';
import { syncService } from './services/syncService';
import { LocalServicesList } from './components/LocalServicesList';
import { PrivacyPage } from './components/PrivacyPage';
import { CookiesPolicy } from './components/CookiesPolicy';
import { ConsentModal } from './components/ConsentModal';
import { AuthScreen } from './components/AuthScreen';
import { ViewType, DocumentTask, ChatSession, GeneratedDocument, User, Course, Post } from './types';
import { analytics } from './services/analyticsService';
import { AdminPanel } from './components/AdminPanel';
import PremiosView from './components/PremiosView';
import { templates, serviceGuides } from './utils/documentsDatabase';
import { authService } from './services/authService';
import { Bot, Sparkles, X, Smartphone } from 'lucide-react';
import { t } from './utils/translations';
import { pwaService } from './utils/pwa';
// import { IEFP_MASSIVE_DATABASE } from './utils/iefpCoursesDatabase'; // MOVED TO DYNAMIC LOAD
import { ToastProvider } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { useNotifications } from './utils/useNotifications';
import TopBar from './components/TopBar';
import { initPageSDKs } from './pageSdkInit';
import { MessagesView } from './components/MessagesView';
import { ChatWindow } from './components/ChatWindow';
import { presenceService } from './services/presenceService';
import { MIRA_LOGO_URL, MIRA_PHOTO_URL } from './constants';

const AppContent: React.FC = () => {
    // 🚀 MIRA v2026.GOLD — SOVEREIGN VERSION
    // 🛡️ RENDER GUARD: CIRCUITO DE SEGURANÇA DIAMANTE
    const renderCount = React.useRef(0);
    const lastRenderTime = React.useRef(Date.now());
    
    useEffect(() => {
        // 🛡️ MIRA RENDER MONITOR: Apenas logamos em desenvolvimento, sem travar a soberania
        const now = Date.now();
        if (now - lastRenderTime.current < 1000) {
            renderCount.current++;
        } else {
            renderCount.current = 1;
            lastRenderTime.current = now;
        }
        if (renderCount.current > 100) {
            console.warn("⚠️ [MIRA] Alto volume de renders detetado.");
        }
    }, []); // Only run on mount to initialize monitor

    // ---------------------------------------------------------
    // 1. STATE INITIALIZATION
    // ---------------------------------------------------------
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('mira_user');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return null; }
        }
        return null;
    });

    const [showSplash, setShowSplash] = useState(() => {
        // ALWAYS show splash on fresh mount to show "MIRA" logo during init
        const hasSeenInSession = sessionStorage.getItem('mira_splash_shown') === 'true';
        return !hasSeenInSession;
    });

    const [isInitializing, setIsInitializing] = useState(true);
    const [currentView, setCurrentView] = useState<ViewType>(() => {
        // Deep-linking support for social innovation awards pitch deck
        if (window.location.pathname === '/institucional/premios') {
            return ViewType.PREMIOS;
        }

        // V26.15: URL Priority over localStorage for refresh/deep-linking
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get('view');
        if (urlView && Object.values(ViewType).includes(urlView as ViewType)) return urlView as ViewType;

        const saved = localStorage.getItem('mira_current_view');
        
        // MIRA V2026.GOLD: If it's the admin, but no view is saved, default to home but check the URL first
        if (saved && Object.values(ViewType).includes(saved as ViewType)) return saved as ViewType;
        return ViewType.HOME;
    });

    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('mira_language');
        if (saved && ['PT', 'EN', 'ES', 'FR'].includes(saved)) return saved;
        const navLang = navigator.language?.split('-')[0]?.toUpperCase();
        return ['PT', 'EN', 'ES', 'FR'].includes(navLang) ? navLang : 'PT';
    });


    const [showConsent, setShowConsent] = useState(false);
    const [targetPostId, setTargetPostId] = useState<string | null>(null);
    const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
    const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'denuncias' | 'knowledge'>('dashboard');
    const [targetServiceId, setTargetServiceId] = useState<string | null>(null);
    const [isInstallable, setIsInstallable] = useState(pwaService.isInstallable());
    const [showSafariGuide, setShowSafariGuide] = useState(false);
    const [showPostLoginInstallModal, setShowPostLoginInstallModal] = useState(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/baixar') {
            return true;
        }
        return false;
    });
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    useEffect(() => {
        const handleInstallable = () => setIsInstallable(true);
        window.addEventListener('mira-pwa-installable', handleInstallable);
        return () => window.removeEventListener('mira-pwa-installable', handleInstallable);
    }, []);

    const [viewParams, setViewParams] = useState<any>(() => {
        // V26.15: URL Priority for Params
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        const urlPost = params.get('post');
        const urlComment = params.get('comment');
        
        if (urlTab) return { tab: urlTab };
        if (urlPost) return { postId: urlPost };
        if (urlComment) return { commentId: urlComment };

        const saved = localStorage.getItem('mira_view_params');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { return null; }
        }
        return null;
    });
    const [isRecoveryMode, setIsRecoveryMode] = useState(() => {
        return localStorage.getItem('mira_recovery_pending') === 'true';
    });
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);

    // Real-time notifications (Bell only — NotificationCenter page removed)
    const { notifications, unreadCount, isOpen: notifOpen, toggleOpen: toggleNotif, clearAll, markAsRead } = useNotifications(user?.id);
    const [tasks, setTasks] = useState<DocumentTask[]>([]);
    const [docDrafts, setDocDrafts] = useState<any[]>([]);
    const [targetProfileUser, setTargetProfileUser] = useState<User | null>(null);
    const [docHistory, setDocHistory] = useState<GeneratedDocument[]>([]);
    const isSystemAdmin = [
        'mira.app@hotmail.com',
        'amandajhonnes@yahoo.com.br',
        'amandasabreu89@gmail.com'
    ].includes(user?.email?.toLowerCase() || '') || user?.role === 'admin';
    const [savedPostsIds, setSavedPostsIds] = useState<Set<string>>(() => {
        const userId = user?.id || 'guest';
        const saved = localStorage.getItem(`mira_saved_posts_${userId}`) || localStorage.getItem('mira_saved_posts');
        try { return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
    });
    const [likedPostsIds, setLikedPostsIds] = useState<Set<string>>(() => {
        const userId = user?.id || 'guest';
        const saved = localStorage.getItem(`mira_liked_posts_${userId}`) || localStorage.getItem('mira_liked_posts');
        try { return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
    });
    const [likedCommentsIds, setLikedCommentsIds] = useState<Set<string>>(() => {
        const userId = user?.id || 'guest';
        const saved = localStorage.getItem(`mira_liked_comments_${userId}`) || localStorage.getItem('mira_liked_comments');
        try { return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
    });
    const [userVotes, setUserVotes] = useState<Record<string, 'true' | 'false'>>(() => {
        const userId = user?.id || 'guest';
        const saved = localStorage.getItem(`mira_user_votes_${userId}`) || localStorage.getItem('mira_user_votes');
        try { return saved ? JSON.parse(saved) : {}; } catch { return {}; }
    });
    const [activeChat, setActiveChat] = useState<{ id: string; otherUser: any } | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [commOffset, setCommOffset] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [translatedPosts, setTranslatedPosts] = useState<Set<string>>(new Set());
    const [masterPosts, setMasterPosts] = useState<Post[]>(() => {
        try {
            const cached = localStorage.getItem('mira_community_cache');
            if (!cached) return [];
            const parsed = JSON.parse(cached);
            if (!Array.isArray(parsed)) return [];
            
            // V99.2: ALWAYS normalize on load to ensure taxonomy consistency
            return parsed.map((p: any) => ({
                ...p,
                category: normalizeCategory(p.category)
            }));
        } catch (e) { 
            console.error("MIRA: Community cache load error:", e);
            return [];
        }
    });

    // REFS for Pull-to-Refresh
    const touchStartY = React.useRef(0);
    const isAtTop = React.useRef(true);

    // ---------------------------------------------------------
    // 2. EFFECTS (DATA & AUTH)
    // ---------------------------------------------------------
    
    // View & Tab Persistence
    useEffect(() => { localStorage.setItem('mira_current_view', currentView); }, [currentView]);
    useEffect(() => { 
        if (viewParams) localStorage.setItem('mira_view_params', JSON.stringify(viewParams));
        else localStorage.removeItem('mira_view_params');
    }, [viewParams]);
    
    // Language Persistence
    const handleSetLanguage = (lang: string) => { setLanguage(lang); localStorage.setItem('mira_language', lang); };

    // User State Persistence (Synchronize to localStorage for immediate consistency)
    useEffect(() => {
        if (user) {
            localStorage.setItem('mira_user', JSON.stringify(user));
            // MIRA V2026.PRO: Track activity on state change
            analytics.track('app_launch', user.id, 'Authentication');
        } else {
            localStorage.removeItem('mira_user');
        }
    }, [user]);

    // GDPR Consent Enforcement Effect
    useEffect(() => {
        if (localStorage.getItem('mira_consent_v26') !== 'true') {
            setShowConsent(true);
        }
    }, []);

    // ⚡ Real-Time Automatic App Access Telemetry
    useEffect(() => {
        const activeUserId = user?.id || 'guest_' + Math.random().toString(36).substr(2, 6);
        analytics.track('app_access', activeUserId, 'AppLaunch');
    }, []);

    // Track View Changes for Access Stats
    useEffect(() => {
        const activeUserId = user?.id || 'guest';
        analytics.track('view_changed', activeUserId, 'Navigation', { view: currentView });
    }, [currentView, user?.id]);

    useEffect(() => { 
        initPageSDKs();

        // 🚀 MIRA: Initial load of massive courses database
        import('./utils/iefpCoursesDatabase').then(({ IEFP_MASSIVE_DATABASE }) => {
            setCourses(prev => prev.length === 0 ? IEFP_MASSIVE_DATABASE : prev);
        });

        import('./services/communityService').then(({ communityService }) => {
            communityService.fetchPosts(user?.id).then(fetchedPosts => {
                if (fetchedPosts && fetchedPosts.length > 0) {
                    setMasterPosts(prev => {
                        const prevMap = new Map(prev.map(p => [p.id, p]));
                        const merged = fetchedPosts.map(remotePost => {
                            const localPost = prevMap.get(remotePost.id);
                            if (!localPost) return remotePost;
                            
                            // Merge comments: include remote comments + any local comments created by user that aren't in remote
                            const remoteCommentIds = new Set((remotePost.comments || []).map(c => c.id));
                            const extraLocalComments = (localPost.comments || []).filter(c => !remoteCommentIds.has(c.id));
                            const mergedComments = [...(remotePost.comments || []), ...extraLocalComments];

                            return {
                                ...remotePost,
                                likes: Math.max(remotePost.likes || 0, localPost.likes || 0),
                                usefulVotes: Math.max(remotePost.usefulVotes || 0, localPost.usefulVotes || 0),
                                fakeVotes: Math.max(remotePost.fakeVotes || 0, localPost.fakeVotes || 0),
                                comments: mergedComments
                            };
                        });

                        // Keep local-only posts (e.g. pending offline posts starting with local-)
                        prev.forEach(p => {
                            if (!merged.some(m => m.id === p.id) && String(p.id).startsWith('local-')) {
                                merged.unshift(p);
                            }
                        });

                        return merged;
                    });
                }
            });
        });
        
        // MIRA V26.90: Global Audio High-End Gesture Bridge
        // Prime the audio system on the very first interaction with the app
        const unlock = () => {
            import('./services/audioService').then(({ audioService }) => {
                audioService.initChromeSafety();
                audioService.prime();
            });
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);
        
        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
    }, []);
    
    // Community Cache
    useEffect(() => { localStorage.setItem('mira_community_cache', JSON.stringify(masterPosts)); }, [masterPosts]);
    
    // Phase 2 Social presence
    useEffect(() => {
        if (!user?.id) return;
        const channel = presenceService.trackPresence(user.id, (presences) => {
            console.log('MIRA_PRESENCE_SYNC:', presences);
            // In a real app, we might update a global users state here
        });
        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);
    
    // V48.1: Periodic Background Re-Sync
    useEffect(() => {
        if (user?.id) {
            fetchSavedPosts(user.id);
            fetchUserInteractions(user.id);
        }
    }, [user?.id]);

    useEffect(() => {
        const uId = user?.id || 'guest';
        const arr = [...likedPostsIds];
        localStorage.setItem('mira_liked_posts', JSON.stringify(arr));
        localStorage.setItem(`mira_liked_posts_${uId}`, JSON.stringify(arr));
    }, [likedPostsIds, user?.id]);

    useEffect(() => {
        const uId = user?.id || 'guest';
        const arr = [...likedCommentsIds];
        localStorage.setItem('mira_liked_comments', JSON.stringify(arr));
        localStorage.setItem(`mira_liked_comments_${uId}`, JSON.stringify(arr));
    }, [likedCommentsIds, user?.id]);

    useEffect(() => {
        const uId = user?.id || 'guest';
        localStorage.setItem('mira_user_votes', JSON.stringify(userVotes));
        localStorage.setItem(`mira_user_votes_${uId}`, JSON.stringify(userVotes));
    }, [userVotes, user?.id]);

    useEffect(() => { 
        const uId = user?.id || 'guest';
        const arr = [...savedPostsIds];
        localStorage.setItem('mira_saved_posts', JSON.stringify(arr)); 
        localStorage.setItem(`mira_saved_posts_${uId}`, JSON.stringify(arr)); 
        persistence.set('saved_posts', arr); // V2026.PRO: Iron Persistence
    }, [savedPostsIds, user?.id]); 

    const fetchSavedPosts = async (userId: string): Promise<Set<string>> => {
        try {
            console.log("💎 [MIRA] Sincronizando Posts Guardados...");
            const cachedSaved = localStorage.getItem(`mira_saved_posts_${userId}`) || localStorage.getItem('mira_saved_posts');
            const localSaved = new Set<string>(cachedSaved ? JSON.parse(cachedSaved) : []);

            const { data, error } = await supabase.from('saved_posts').select('post_id').eq('user_id', userId);
            if (!error && data) {
                data.forEach(d => localSaved.add(String(d.post_id)));
            }
            setSavedPostsIds(localSaved); 
            localStorage.setItem('mira_saved_posts', JSON.stringify([...localSaved]));
            localStorage.setItem(`mira_saved_posts_${userId}`, JSON.stringify([...localSaved]));
            persistence.set('saved_posts', [...localSaved]);
            return localSaved;
        } catch (e) { 
            console.error('MIRA: Saved posts catch error:', e); 
            const cachedSaved = localStorage.getItem(`mira_saved_posts_${userId}`) || localStorage.getItem('mira_saved_posts');
            return new Set(cachedSaved ? JSON.parse(cachedSaved) : []);
        }
    };

    const fetchUserInteractions = async (userId: string) => {
        try {
            const cachedLikes = localStorage.getItem(`mira_liked_posts_${userId}`) || localStorage.getItem('mira_liked_posts');
            const cachedVotes = localStorage.getItem(`mira_user_votes_${userId}`) || localStorage.getItem('mira_user_votes');
            
            const likeSet = new Set<string>(cachedLikes ? JSON.parse(cachedLikes) : []);
            const voteMap: Record<string, 'true' | 'false'> = cachedVotes ? JSON.parse(cachedVotes) : {};

            // 🛡️ MIRA SOVEREIGN: Merge with pending actions to prevent state regression
            const pendingActions = syncService.getPendingActions();
            
            // Fetch Likes from DB
            const { data: likes, error: likesErr } = await supabase.from('post_votes').select('post_id').eq('user_id', userId).eq('vote_type', 'like');
            if (!likesErr && likes) {
                likes.forEach(l => likeSet.add(String(l.post_id)));
            }
            
            // Apply pending likes
            pendingActions.filter(a => a.action === 'like').forEach(a => {
                likeSet.add(String(a.payload.postId));
            });
            
            setLikedPostsIds(likeSet);
            localStorage.setItem('mira_liked_posts', JSON.stringify([...likeSet]));
            localStorage.setItem(`mira_liked_posts_${userId}`, JSON.stringify([...likeSet]));

            // Fetch Comment Likes
            const cachedcLikes = localStorage.getItem(`mira_liked_comments_${userId}`) || localStorage.getItem('mira_liked_comments');
            const commentLikeSet = new Set<string>(cachedcLikes ? JSON.parse(cachedcLikes) : []);
            const { data: cLikes, error: cLikesErr } = await supabase.from('comment_likes').select('comment_id').eq('user_id', userId);
            if (!cLikesErr && cLikes) {
                cLikes.forEach(cl => commentLikeSet.add(String(cl.comment_id)));
            }
            setLikedCommentsIds(commentLikeSet);
            localStorage.setItem('mira_liked_comments', JSON.stringify([...commentLikeSet]));
            localStorage.setItem(`mira_liked_comments_${userId}`, JSON.stringify([...commentLikeSet]));

            // Fetch Votes
            const { data: votes, error: votesErr } = await supabase.from('post_votes').select('post_id, vote_type').eq('user_id', userId).in('vote_type', ['useful', 'fake']);
            if (!votesErr && votes) {
                votes.forEach(v => {
                    voteMap[String(v.post_id)] = v.vote_type === 'useful' ? 'true' : 'false';
                });
            }
            
            // Apply pending votes
            pendingActions.filter(a => a.action === 'vote').forEach(a => {
                voteMap[String(a.payload.postId)] = a.payload.voteType === 'useful' ? 'true' : 'false';
            });

            setUserVotes(voteMap);
            localStorage.setItem('mira_user_votes', JSON.stringify(voteMap));
            localStorage.setItem(`mira_user_votes_${userId}`, JSON.stringify(voteMap));

            return {
                likes: likeSet,
                comments: commentLikeSet,
                votes: voteMap
            };
        } catch (e) {
            console.error("MIRA: Error fetching interactions:", e);
            const cachedLikes = localStorage.getItem(`mira_liked_posts_${userId}`) || localStorage.getItem('mira_liked_posts');
            const cachedVotes = localStorage.getItem(`mira_user_votes_${userId}`) || localStorage.getItem('mira_user_votes');
            return { 
                likes: new Set(cachedLikes ? JSON.parse(cachedLikes) : []), 
                comments: new Set(), 
                votes: cachedVotes ? JSON.parse(cachedVotes) : {} 
            };
        }
    };

    useEffect(() => { 
        if (user?.id) {
            fetchSavedPosts(user.id);
            fetchUserInteractions(user.id);

            // V98.0 REAL-TIME OR NOTHING PROTOCOL
            const channel = supabase
                .channel('community_realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, async (payload) => {
                    console.log("MIRA_REALTIME: Post change detected:", payload);
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const postId = payload.new.id;
                        const { communityService } = await import('./services/communityService');
                        const formattedPost = await communityService.fetchPostById(postId, user.id);
                        if (formattedPost) {
                            setMasterPosts(prev => {
                                // Deduplicate local placeholders
                                const noLocals = prev.filter(p => !(String(p.id).startsWith('local-') && p.content === formattedPost.content));
                                if (payload.eventType === 'INSERT') {
                                    if (noLocals.some(p => p.id === formattedPost.id)) return noLocals;
                                    return [formattedPost, ...noLocals];
                                } else {
                                    return noLocals.map(p => p.id === formattedPost.id ? { ...p, ...formattedPost } : p);
                                }
                            });
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any).id;
                        setMasterPosts(prev => prev.filter(p => p.id !== deletedId));
                    }
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, async (payload) => {
                    console.log("MIRA_REALTIME: Comment change detected:", payload);
                    if (payload.eventType === 'INSERT') {
                        const postId = payload.new.post_id;
                        const { communityService: cS } = await import('./services/communityService');
                        const formattedPost = await cS.fetchPostById(postId, user.id || '');
                        if (formattedPost) {
                            setMasterPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: formattedPost.comments } : p));
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const commId = payload.old.id;
                        setMasterPosts(prev => prev.map(p => ({
                            ...p,
                            comments: p.comments.filter(c => c.id !== commId)
                        })));
                    }
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: user?.id ? `id=eq.${user.id}` : undefined }, (payload) => {
                    console.log("MIRA_REALTIME: Profile Update:", payload.new);
                    setUser(prev => {
                        if (!prev) return null;
                        const updated = {
                            ...prev,
                            name: payload.new.name || payload.new.full_name || prev.name,
                            bio: payload.new.bio || prev.bio,
                            avatar: payload.new.avatar_url || payload.new.avatar || prev.avatar,
                            reputation: payload.new.reputation !== undefined ? payload.new.reputation : prev.reputation,
                            badges: payload.new.badges || prev.badges
                        };
                        localStorage.setItem('mira_user', JSON.stringify(updated));
                        return updated;
                    });
                })
                .subscribe((status) => {
                    console.log("MIRA_REALTIME_STATUS:", status);
                });

            return () => { supabase.removeChannel(channel); };
        } 
    }, [user?.id]);

    // consolidated URL Deep Linking & Persistence (MIRA V55.1)
    useEffect(() => {
        if (isInitializing) return;

        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        const tab = params.get('tab');
        const postId = params.get('post');
        const commentId = params.get('comment');
        
        // consume params
        if (view && Object.values(ViewType).includes(view as ViewType)) {
            setCurrentView(view as ViewType);
        }
        if (tab) setViewParams({ tab });
        if (postId) setTargetPostId(postId);
        if (commentId) setTargetCommentId(commentId);

        if (params.get('type') === 'recovery' || window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery')) {
            console.log("MIRA: Explicit Recovery Mode detected via URL context.");
            setIsRecoveryMode(true);
            // V26.91: Ensure we don't accidentally redirect the user who is recovering
            localStorage.setItem('mira_recovery_pending', 'true');
        }

        // V26.8: Clean ONLY auth-related URL parameters. Keep view/tab for persistence.
        const authParams = ['access_token', 'refresh_token', 'expires_in', 'provider_token', 'token_type', 'code'];
        let hasAuth = window.location.hash.includes('access_token') || params.has('code');
        
        if (hasAuth) {
            const cleanParams = new URLSearchParams();
            params.forEach((v, k) => {
                if (!authParams.includes(k)) cleanParams.set(k, v);
            });
            const search = cleanParams.toString();
            const newUrl = window.location.pathname + (search ? '?' + search : '');
            window.history.replaceState({}, document.title, newUrl);
            console.log("MIRA_DEBUG: Auth parameters cleaned, persistence params kept.");
        }

        // 🛡️ MIRA V2026.GOLD: Sovereign Admin Guard (Administração & Concursos)
        const isAdmin = user && (user.role === 'admin' || [
            'amandasabreu89@gmail.com', 
            'amandasabreu@gmail.com', 
            'no-reply@miraimigrante.pt',
            'atendimentomira@gmail.com',
            'suportemira@gmail.com',
            'mira.atendimento@gmail.com'
        ].includes(user.email?.toLowerCase() || ''));

        if ((currentView === ViewType.ADMIN || currentView === ViewType.PREMIOS) && user && !isAdmin) {
            console.warn(`🚨 ACESSO NEGADO A ${currentView}: Redirecionando utilizador comum via Guardião Soberano.`);
            setCurrentView(ViewType.DASHBOARD);
        }

        // 🛡️ MIRA: LOCAL BYPASS (No Cloud Required)
        console.log("MIRA_DEBUG: URL Search is", window.location.search);
        // Logic moved above for early exit
    }, [isInitializing, currentView, user?.email]);

    // Main Auth Init & Persistence
    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                // 🛡️ MIRA: Se o bypass global acabou de ser aplicado, não verificamos nada!
                if (sessionStorage.getItem('mira_bypass_applied') === 'true') {
                    console.log("👑 [MIRA] Bypass session confirmed.");
                    const localUser = localStorage.getItem('mira_user');
                    if (localUser) {
                        setUser(JSON.parse(localUser));
                        setShowSplash(false);
                        setIsInitializing(false);
                        sessionStorage.removeItem('mira_bypass_applied'); // Clean flag but keep session
                        return;
                    }
                }

                // V5.4.1: Handle email confirmation hash in URL FIRST
                const hasAuthToken = window.location.hash.includes('access_token') || 
                                     window.location.search.includes('code=') ||
                                     window.location.pathname === '/auth/callback';

                if (hasAuthToken) {
                    // Give Supabase client time to process the token from URL
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // 🛡️ MIRA: Se for o bypass, não verificamos o perfil na nuvem!
                const localToken = localStorage.getItem('mira-token-v4') || '';
                if (localToken.includes('fake_signature_for_local_bypass')) {
                    console.log("👑 [MIRA] Sessão bypass confirmada. Ignorando Cloud Auth.");
                    const localUser = localStorage.getItem('mira_user');
                    if (localUser) {
                        setUser(JSON.parse(localUser));
                        setShowSplash(false);
                        setIsInitializing(false);
                        sessionStorage.setItem('mira_splash_shown', 'true');
                    }
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (session && mounted) {
                    const profile = await authService.fetchProfileWithRetry(
                        session.user.id, 
                        session.user.email || '', 
                        session.user.user_metadata?.name
                    );

                    if (!profile && mounted) {
                        console.warn("MIRA Security: Perfil não encontrado. Tentando criação de emergência.");
                        const fallbackProfile = await authService.createFallbackProfile(
                            session.user.id, 
                            session.user.email || '', 
                            session.user.user_metadata?.name || session.user.user_metadata?.full_name
                        );
                        
                        if (!fallbackProfile) {
                            console.warn("MIRA Security: Falha total na criação do perfil. Encerrando sessão.");
                            await supabase.auth.signOut();
                            setUser(null);
                            localStorage.removeItem('mira_user');
                            return;
                        }
                        
                        // Use fallback profile
                        const u = authService.mapProfileToUser(fallbackProfile, session.user);
                        setUser(u);
                        localStorage.setItem('mira_user', JSON.stringify(u));
                        setShowSplash(false);
                        return;
                    }

                    if (profile && mounted) {
                        if (session.user.email && profile.email !== session.user.email) {
                            supabase.from('profiles').update({ email: session.user.email }).eq('id', profile.id).then(() => {});
                        }
                        // VERIFICAÇÃO DE SEGURANÇA: Bloqueio de sessão sem confirmação de email
                        // V11000: Permissivo em isRecoveryMode, Provedores OAuth (Google) ou Admin Amanda
                        const isOAuth = session.user.app_metadata.provider !== 'email';
                        const isAdmin = ['amandasabreu89@gmail.com'].includes(session.user.email?.toLowerCase() || '') || profile.role === 'admin';
                        if (!session.user.email_confirmed_at && !isRecoveryMode && !isOAuth && !isAdmin) {
                            console.warn("MIRA Security: Sessão ativa mas email não confirmado. Bloqueando acesso.");
                            await supabase.auth.signOut();
                            setUser(null);
                            localStorage.removeItem('mira_user');
                            return;
                        }

                        if (session.user.email && profile.email !== session.user.email) {
                            supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id).then(() => {});
                            profile.email = session.user.email;
                        }

                        const u = authService.mapProfileToUser(profile, session.user);
                        setUser(u);
                        localStorage.setItem('mira_user', JSON.stringify(u));
                        setShowSplash(false); 
                        sessionStorage.setItem('mira_splash_shown', 'true');
                        // Clean URL after successful auth (MIRA V55.2: Persistence Fix)
                        if (hasAuthToken) {
                            const params = new URLSearchParams(window.location.search);
                            const authParams = ['code', 'access_token', 'refresh_token', 'expires_in', 'provider_token', 'token_type', 'code'];
                            const cleanParams = new URLSearchParams();
                            params.forEach((v, k) => {
                                if (!authParams.includes(k)) cleanParams.set(k, v);
                            });
                            const searchHost = cleanParams.toString();
                            const finalPath = window.location.pathname === '/auth/callback' ? '/' : window.location.pathname;
                            const newUrl = finalPath + (searchHost ? '?' + searchHost : '');
                            window.history.replaceState({}, document.title, newUrl);
                            console.log("MIRA: URL cleaned, search params preserved:", newUrl);
                        }
                    }
                } else if (mounted) {
                    // If no session but we have local user, it might be stale or just background re-auth
                    if (!localStorage.getItem('mira-token-v4')) {
                        setUser(null);
                        localStorage.removeItem('mira_user');
                    }
                }
            } catch (err) {
                console.error("MIRA: checkSession error:", err);
            } finally {
                if (mounted) {
                    setIsInitializing(false);
                    if (localStorage.getItem('mira_user')) {
                        setShowSplash(false);
                        sessionStorage.setItem('mira_splash_shown', 'true');
                    }
                }
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // 🛡️ MIRA: Interromper eventos se for Bypass
            const localToken = localStorage.getItem('mira-token-v4') || '';
            if (localToken.includes('fake_signature_for_local_bypass')) {
                return;
            }

            // V5.4.1: Catch ALL events that indicate a valid user session
            const authEvents = ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'];
            if (authEvents.includes(event)) {
                if (session?.user && mounted) {
                    // VERIFICAÇÃO DE SEGURANÇA: Bloqueio de sessão sem confirmação de email (V2026.GOLD)
                    // V11000: Permissivo em isRecoveryMode, Provedores OAuth (Google) ou Admin Amanda
                    const isOAuth = session.user.app_metadata.provider !== 'email';
                    const isAdmin = ['amandasabreu89@gmail.com'].includes(session.user.email?.toLowerCase() || '') || session.user.email === 'amandasabreu89@gmail.com';
                    if (!session.user.email_confirmed_at && !isRecoveryMode && !isOAuth && !isAdmin) {
                        console.warn("MIRA Security: Sessão ativa mas email não confirmado. Bloqueando acesso.");
                        await supabase.auth.signOut();
                        setUser(null);
                        localStorage.removeItem('mira_user');
                        return;
                    }

                    const profile = await authService.fetchProfileWithRetry(
                        session.user.id, 
                        session.user.email || '', 
                        session.user.user_metadata?.name
                    );

                    if (profile && mounted) {
                        if (session.user.email && profile.email !== session.user.email) {
                            supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id).then(() => {});
                            profile.email = session.user.email;
                        }

                        const u = authService.mapProfileToUser(profile, session.user);
                        setUser(u);
                        localStorage.setItem('mira_user', JSON.stringify(u));
                        setShowSplash(false);
                        setIsInitializing(false);
                        sessionStorage.setItem('mira_splash_shown', 'true');
                        
                        // Clean URL hash but preserve view parameters (V55.1)
                        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
                            if (!pwaService.isStandalone()) {
                                setShowPostLoginInstallModal(true);
                            }
                            const params = new URLSearchParams(window.location.search);
                            const cleanParams = new URLSearchParams();
                            const authParams = ['code', 'access_token', 'refresh_token', 'expires_in', 'provider_token', 'token_type'];
                            params.forEach((v, k) => { if (!authParams.includes(k)) cleanParams.set(k, v); });
                            const search = cleanParams.toString();
                            const newUrl = window.location.pathname + (search ? '?' + search : '');
                            window.history.replaceState({}, document.title, newUrl);
                        }
                    } else if (mounted) {
                        // V2026.SUPREMO: Fallback Profile Creation in Real-time Auth Event
                        console.warn("🚨 [MIRA SECURITY] Perfil ausente no evento Auth! Criando perfil de emergência.");
                        const fallbackProfile = await authService.createFallbackProfile(
                            session.user.id, 
                            session.user.email || '', 
                            session.user.user_metadata?.name || session.user.user_metadata?.full_name
                        );

                        if (fallbackProfile && mounted) {
                           const u = authService.mapProfileToUser(fallbackProfile, session.user);
                           setUser(u);
                           localStorage.setItem('mira_user', JSON.stringify(u));
                           setShowSplash(false);
                           setIsInitializing(false);
                        } else if (mounted) {
                            console.warn("🚨 [MIRA SECURITY] Falha crítica na criação de perfil! Purgação de sessão em curso.");
                            await supabase.auth.signOut();
                            setUser(null);
                            localStorage.removeItem('mira_user');
                            setIsInitializing(false);
                            setShowSplash(false);
                        }
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                // MIRA V2026.GOLD: Prevent view reset on refresh "flicker"
                // Only clear if we are NOT initializing (which means it's an explicit logout or session loss)
                if (!isInitializing) {
                    setUser(null);
                    localStorage.removeItem('mira_user');
                    sessionStorage.clear();
                    localStorage.removeItem('mira_current_view');
                    setCurrentView(ViewType.HOME);
                    console.log("MIRA: Signed out - view reset.");
                } else {
                    console.log("MIRA: Signed out during init - preserving view/state.");
                    setUser(null);
                }
                setIsInitializing(false);
            }
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && (window.location.search.includes('type=recovery') || window.location.hash.includes('type=recovery')))) {
                setIsRecoveryMode(true);
                localStorage.setItem('mira_recovery_pending', 'true');
            }
            
            // V26.91: Clean recovery flag if signed out or normal shift
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('mira_recovery_pending');
            }
        });


        return () => { mounted = false; subscription.unsubscribe(); };
    }, []);

    // ---------------------------------------------------------
    // 3. CORE LOGIC (REFRESH & ACTIONS)
    // ---------------------------------------------------------
    const refreshData = async () => {
        if (!user?.id || isRefreshing) return;
        setIsRefreshing(true);
        try {
            // [MIRA V2026.GOLD] SOVEREIGN SYNC: Fetch interactions FIRST to avoid flicker
            const [savedIds, interactions] = await Promise.all([
                fetchSavedPosts(user.id),
                fetchUserInteractions(user.id)
            ]);

            // V48.0: Pagination - Load only 20 posts initially
            const PAGE_SIZE = 20;
            const dbPosts = await communityService.fetchPosts(user.id, PAGE_SIZE, 0);
            
            const hydratedPosts = (dbPosts || []).map(p => ({
              ...p,
              category: normalizeCategory(p.category),
              isLikedByUser: interactions.likes.has(p.id),
              userVote: interactions.votes[p.id],
              isSaved: savedIds.has(p.id)
            }));

            // MIRA V2026.GOLD: Apply pending interactions to fetched posts for local consistency
            const pendingActions = syncService.getPendingActions();
            const pendingInteractions = pendingActions.filter(a => ['like', 'vote'].includes(a.action));
            
            hydratedPosts.forEach(p => {
              pendingInteractions.forEach(a => {
                if (a.payload.postId === p.id) {
                  if (a.action === 'like') {
                    p.isLikedByUser = true;
                    p.likes = (p.likes || 0) + 1;
                  } else if (a.action === 'vote') {
                    p.userVote = a.payload.voteType === 'useful' ? 'true' : 'false';
                    if (a.payload.voteType === 'useful') p.usefulVotes = (p.usefulVotes || 0) + 1;
                    if (a.payload.voteType === 'fake') p.fakeVotes = (p.fakeVotes || 0) + 1;
                  }
                }
              });
            });

            // MIRA V2026.GOLD: Sovereign Content - relying on syncService
            setCommOffset(0);

            setMasterPosts(prev => {
                const combined = [...hydratedPosts];
                
                const deletedIds = new Set(
                    pendingActions
                        .filter(a => a.action === 'delete_post' || a.action === 'delete' || a.action === 'delete_reported_content' || a.action === 'delete_comment')
                        .map(a => a.payload.postId || a.payload.id || a.payload.commentId)
                );

                const cleanedPostsFromDB = combined.filter(p => !deletedIds.has(p.id));

                // 🛡️ MIRA SOVEREIGN: Capture ALL local posts (current pending + previous locals in state)
                const currentLocalsInState = (prev || []).filter(p => String(p.id).startsWith('local-'));

                const pendingPostsFromQueue = pendingActions
                    .filter(a => a.action === 'post')
                    .map(a => {
                        const payload = a.payload;
                        return {
                            id: `local-${a.id}`,
                            authorId: payload.authorId || user.id,
                            authorName: user.name,
                            authorAvatar: user.avatar,
                            content: payload.content,
                            category: normalizeCategory(payload.category),
                            timestamp: new Date(a.timestamp).toISOString(),
                            isPending: true,
                            likes: 0,
                            comments: []
                        } as Post;
                    });

                const allPotentialLocals = [...pendingPostsFromQueue, ...currentLocalsInState];
                
                // Deduplicate locals by content against DB
                const dbContents = new Set((dbPosts || []).map(p => p.content));
                const uniqueLocals = allPotentialLocals.filter(p => !dbContents.has(p.content));
                
                // Final merge with ID-based deduplication
                const finalMap = new Map();
                cleanedPostsFromDB.forEach(p => finalMap.set(p.id, p));
                uniqueLocals.forEach(p => finalMap.set(p.id, p));

                return Array.from(finalMap.values()).sort((a,b) => 
                    new Date(b.timestamp || b.created_at).getTime() - new Date(a.timestamp || a.created_at).getTime()
                );
            });

            setCommOffset(PAGE_SIZE);
            setHasMorePosts(dbPosts.length === PAGE_SIZE);
            
            await fetchSavedPosts(user.id);
            await fetchUserInteractions(user.id);

            // Fetch Courses from DB
            const { courseService } = await import('./services/courseService');
            const dbCourses = await courseService.fetchCourses();
            setCourses(dbCourses);
        } catch (e) { console.error("Refresh error:", e); }
        finally { setPullProgress(0); setIsRefreshing(false); }
    };

    const loadMorePosts = async () => {
        if (!user?.id || isRefreshing || !hasMorePosts) return;
        setIsRefreshing(true);
        try {
            const PAGE_SIZE = 20;
            const newPosts = await communityService.fetchPosts(user.id, PAGE_SIZE, commOffset);
            
            if (newPosts.length > 0) {
              setMasterPosts(prev => {
                const combined = [...prev, ...newPosts];
                // Unique by ID
                const unique = Array.from(new Map(combined.map(p => [p.id, {
                  ...p,
                  category: normalizeCategory(p.category)
                }])).values());
                return unique.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              });
              setCommOffset(prev => prev + PAGE_SIZE);
            }
            
            setHasMorePosts(newPosts.length === PAGE_SIZE);
        } catch (e) { 
            console.error("Load more error:", e); 
        } finally { 
            setIsRefreshing(false); 
        }
    };

    useEffect(() => {
        if (user?.id) {
            refreshData();
        }
    }, [user?.id]);

    // V5.4.1: Handle auth callback URL on mount only (not on user change)
    useEffect(() => {
        const path = window.location.pathname;
        const hash = window.location.hash;
        const search = window.location.search;
        
        if (path === '/institucional/premios') {
            setCurrentView(ViewType.PREMIOS);
            return;
        }
        
        if (path === '/auth/callback' || hash.includes('access_token') || search.includes('code=')) {
            console.log("MIRA Auth: Processing email confirmation callback from URL...");
            // Supabase JS client auto-processes the token from URL hash
            // The onAuthStateChange listener above will fire SIGNED_IN
            // We just clean the URL after a delay, preserving view params (V55.1)
            setTimeout(() => {
                const params = new URLSearchParams(window.location.search);
                const cleanParams = new URLSearchParams();
                const authParams = ['code', 'access_token', 'refresh_token', 'expires_in', 'provider_token', 'token_type'];
                params.forEach((v, k) => { if (!authParams.includes(k)) cleanParams.set(k, v); });
                const search = cleanParams.toString();
                const newUrl = window.location.pathname + (search ? '?' + search : '');
                window.history.replaceState({}, document.title, newUrl);
            }, 2000);
        }
    }, []); // Only on mount


    // Global Events
    useEffect(() => {
        const handleOnline = () => { setIsOffline(false); communityService.syncPendingPosts(); };
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    // Pull-to-Refresh Gesto
    useEffect(() => {
        const hTS = (e: TouchEvent) => { isAtTop.current = window.scrollY === 0; if (isAtTop.current) touchStartY.current = e.touches[0].clientY; };
        const hTM = (e: TouchEvent) => {
            if (!isAtTop.current || isRefreshing || isInitializing) return;
            const diff = e.touches[0].clientY - touchStartY.current;
            if (diff > 0) {
                const prog = Math.min(diff / 2.5, 100);
                setPullProgress(prog);
                if (prog > 10 && e.cancelable) e.preventDefault();
            } else setPullProgress(0);
        };
        const hTE = () => { if (pullProgress > 85) refreshData(); else setPullProgress(0); };

        window.addEventListener('touchstart', hTS, { passive: true });
        window.addEventListener('touchmove', hTM, { passive: false });
        window.addEventListener('touchend', hTE);
        return () => { window.removeEventListener('touchstart', hTS); window.removeEventListener('touchmove', hTM); window.removeEventListener('touchend', hTE); };
    }, [pullProgress, isRefreshing, isInitializing, user]);
    
    // V2026: Android Back Button Support (popstate synchronization)
    useEffect(() => {
        const handleBack = (e: PopStateEvent) => {
            // If in a sub-view, go back to HOME instead of exiting
            if (currentView !== ViewType.HOME) {
                e.preventDefault();
                setCurrentView(ViewType.HOME);
                // Keep history clean by replacing instead of pushing during a back event
                window.history.replaceState({ view: ViewType.HOME }, '', '/?view=' + ViewType.HOME);
            }
        };
        window.addEventListener('popstate', handleBack);
        return () => window.removeEventListener('popstate', handleBack);
    }, [currentView]);

    // Handlers
    const handleViewChange = (view: ViewType, params?: any) => {
        let finalView = view;
        let finalParams = params || null;

        // MIRA V2026: Redirect Asilo queries to Regularização tab (Sovereignty Rule)
        if (finalView === ViewType.DOCUMENTS && (finalParams?.tab?.toLowerCase() === 'asilo' || finalParams?.query?.toLowerCase()?.includes('asilo'))) {
            finalParams = { ...finalParams, tab: 'regularize' };
        }

        setCurrentView(finalView);
        setViewParams(finalParams);
        
        // Update URL for deep linking support
        const url = new URL(window.location.href);
        url.searchParams.set('view', finalView);
        if (finalParams?.tab) url.searchParams.set('tab', finalParams.tab);
        else url.searchParams.delete('tab');
        
        if (finalParams?.articleId) url.searchParams.set('article', finalParams.articleId);
        else url.searchParams.delete('article');

        window.history.pushState({}, '', url);

        if (finalParams?.id) setTargetServiceId(finalParams.id);
        if (finalParams?.postId) setTargetPostId(finalParams.postId);
        setTargetProfileUser(finalParams?.profileUser || null);
    };

    // Expose for deep links from internal components (Privacy -> Cookies etc)
    useEffect(() => {
        (window as any).miraNavigate = (view: any, params?: any) => {
            const v = Object.values(ViewType).find(vt => vt === view);
            if (v) handleViewChange(v as ViewType, params);
        };
    }, []);

    const handleLogout = async () => {
        try {
            // Non-blocking sign out
            await Promise.race([
                authService.signOut(),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);
        } catch (e) {
            console.warn('MIRA: Sign out call error (ignoring for state cleanup):', e);
        }

        // Force clear all local states immediately
        setUser(null);
        localStorage.clear();
        sessionStorage.clear();
        
        // Final nuclear wipe of cookies for safety
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
        });

        // Perform navigation to home and reload to ensure clean environment
        window.location.assign('/');
    };

    const handleEarnPoints = async (amount: number, reason: string = 'Atividade', optimisticOnly: boolean = false) => {
        if (!user) return;
        
        // Optimistic UI update (Instant local feedback)
        const optimisticRep = (user.reputation || 0) + amount;
        const updatedOptUser = { ...user, reputation: optimisticRep };
        setUser(updatedOptUser);
        localStorage.setItem('mira_user', JSON.stringify(updatedOptUser));
        
        if (optimisticOnly) return; // Do not call server if it's handled by triggers
        
        try {
            const { gamificationService } = await import('./services/gamificationService');
            const newRep = await gamificationService.earnPoints(user.id, amount, reason);
            const targetRep = newRep !== null ? newRep : optimisticRep;

            // 🛡️ MIRA AUTO-AWARD: Check for new milestones
            const newBadges = await gamificationService.autoAwardBadges(user.id, targetRep);
            if (newBadges.length > 0) {
                console.log("👑 [MIRA] NOVOS SELOS CONQUISTADOS:", newBadges);
                const updatedFull = await authService.fetchFullProfile(user.id);
                if (updatedFull) {
                    setUser(updatedFull);
                    localStorage.setItem('mira_user', JSON.stringify(updatedFull));
                }
            } else {
                setUser(prev => {
                    if (!prev) return null;
                    const u = { ...prev, reputation: targetRep };
                    localStorage.setItem('mira_user', JSON.stringify(u));
                    return u;
                });
            }
        } catch (err) {
            console.error('MIRA: Error persisting points:', err);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Ação irreversível: Eliminar conta e todos os dados?")) return;
        try {
            await supabase.rpc('delete_user_nuclear');
            await handleLogout();
        } catch {
            await handleLogout();
        }
    };

    const handleToggleTranslate = (id: string) => {
        setTranslatedPosts(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next; // 🛡️ MIRA: New Set instance triggers re-render of memoized PostCards
        });
    };

    const handleToggleSavePost = async (postId: string) => {
        if (!user) return;
        const isCurrentlySaved = savedPostsIds.has(postId);
        
        try {
            // Otimista: Actualizar UI
            setSavedPostsIds(prev => {
                const n = new Set(prev);
                if (isCurrentlySaved) n.delete(postId);
                else n.add(postId);
                return n;
            });

            // Persistência: Enfileirar via SyncService (Soberania V2026.GOLD)
            await syncService.enqueue('save', { 
                postId, 
                userId: user.id, 
                isRemoving: isCurrentlySaved 
            });
            
        } catch (err: any) {
            console.error('MIRA Save Error:', err);
            // Reverter estado local em caso de erro catastrófico imediato
            setSavedPostsIds(prev => {
                const n = new Set(prev);
                if (isCurrentlySaved) n.add(postId);
                else n.delete(postId);
                return n;
            });
        }
    };

    const handleFinishSplash = () => { setShowSplash(false); sessionStorage.setItem('mira_splash_shown', 'true'); };

    // ---------------------------------------------------------
    // 4. RENDER
    // ---------------------------------------------------------
    const renderView = () => {
        if (!user) return null;
        switch (currentView) {
            case ViewType.HOME: return <HomeView user={user} onViewChange={handleViewChange} language={language} onLogout={handleLogout} masterPosts={masterPosts} />;
            case ViewType.COMMUNITY: return <CommunityView 
                language={language} 
                user={user} 
                onViewChange={handleViewChange} 
                onEarnPoints={(pts) => handleEarnPoints(pts, 'Comunidade')} 
                masterPosts={masterPosts} 
                setMasterPosts={setMasterPosts} 
                savedPostsIds={savedPostsIds} 
                onToggleSavePost={handleToggleSavePost} 
                likedPosts={likedPostsIds}
                setLikedPosts={setLikedPostsIds}
                likedComments={likedCommentsIds}
                setLikedComments={setLikedCommentsIds}
                userVotes={userVotes}
                setUserVotes={setUserVotes}
                translatedPosts={translatedPosts}
                setTranslatedPosts={setTranslatedPosts}
                targetPostId={targetPostId} 
                targetCommentId={targetCommentId} 
                onClearTargetPost={() => { setTargetPostId(null); setTargetCommentId(null); }} 
                onUpdateUser={setUser} 
                onLoadMore={loadMorePosts} 
                hasMore={hasMorePosts} 
                isLoading={isRefreshing}
                onViewProfile={(id, name, avatar) => handleViewChange(ViewType.PROFILE, { profileUser: { id, name, avatar } as User })} />;
            case ViewType.ASSISTANT: return <AssistantView language={language} onViewChange={handleViewChange} user={user} />;
            case ViewType.SIMULATORS: return <SimulatorsView language={language} onViewChange={handleViewChange} />;
            case ViewType.JOBS: return <JobBoard language={language} isAdmin={user.role === 'admin'} onViewChange={handleViewChange} initialTab={viewParams?.tab} />;
            case ViewType.MAP: return <LocalServicesList language={language} user={user} targetServiceId={viewParams?.id || targetServiceId} onClearTargetService={() => { setTargetServiceId(null); setViewParams(null); }} />;
            case ViewType.LEARNING: return <LearningView courses={courses} language={language} initialArticleId={viewParams?.articleId} onNavigateToChat={() => handleViewChange(ViewType.ASSISTANT)} onEarnPoints={(pts) => handleEarnPoints(pts, 'Aprendizagem')} onNavigateToContact={() => {}} />;
            case ViewType.DOCUMENTS: 
                console.log("MIRA_DEBUG: App.tsx rendering DOCUMENTS with viewParams =", viewParams);
                return <DocumentAssistant 
                    tasks={tasks} 
                    chatSessions={[]} 
                    drafts={docDrafts} 
                    setDrafts={setDocDrafts} 
                    history={docHistory} 
                    addToHistory={(doc) => setDocHistory([doc, ...docHistory])} 
                    onOpenSession={() => {}} 
                    language={language} 
                    onEarnPoints={(pts) => handleEarnPoints(pts, 'Documentos')} 
                    onToggleTask={() => {}} 
                    onViewChange={handleViewChange} 
                    initialTab={viewParams?.tab} 
                    initialSearch={viewParams?.search} 
                    initialTemplateId={viewParams?.templateId}
                    initialGuideId={viewParams?.guideId}
                    initialArticleId={viewParams?.articleId}
                />;
            case ViewType.PROFILE: 
                const profileUser = targetProfileUser || user;
                return <GamificationProfile 
                    user={profileUser} 
                    currentUser={user}
                    onUpdateUser={setUser} 
                    language={language.toLowerCase()} 
                    onLogout={handleLogout} 
                    helps={profileUser?.help_count || 0} 
                    impact={profileUser?.totalLikesReceived || 0} 
                    badges={(profileUser?.badges as any) || []} 
                    activitiesCount={(profileUser?.verifiedPostsCount || 0) + (profileUser?.completedCoursesCount || 0) + (profileUser?.serviceReviewsCount || 0)} 
                    savedCount={savedPostsIds.size} 
                    onNavigateToPost={(postId) => handleViewChange(ViewType.COMMUNITY, { postId })} 
                    onViewChange={handleViewChange} 
                    onStartChat={async (other) => {
                        const { dmService } = await import('./services/dmService');
                        const { conversationId } = await dmService.startConversation(user.id, other.id);
                        if (conversationId) {
                            setActiveChat({ id: conversationId, otherUser: other });
                            handleViewChange(ViewType.MESSAGES);
                        }
                    }}
                    createdPosts={masterPosts.filter(p => p.authorId === profileUser?.id)} 
                    onDeletePost={async (id) => {
                        try {
                            const { communityService } = await import('./services/communityService');
                            await communityService.deletePost(id);
                            setMasterPosts(prev => prev.filter(p => p.id !== id));
                        } catch (e) {
                            console.error("MIRA: Delete Error:", e);
                        }
                    }} 
                    savedPosts={masterPosts.filter(p => savedPostsIds.has(p.id))} 
                />;
            case ViewType.MESSAGES: 
                if (activeChat) {
                    return <ChatWindow 
                        conversationId={activeChat.id} 
                        currentUser={user} 
                        otherUser={activeChat.otherUser} 
                        onBack={() => setActiveChat(null)} 
                    />;
                }
                return <MessagesView 
                    user={user} 
                    language={language} 
                    onViewChange={(view) => {
                        if (typeof view === 'string') handleViewChange(view as ViewType);
                    }} 
                />;
            case ViewType.SERVICES:
                return <DocumentAssistant 
                    tasks={tasks} 
                    chatSessions={[]} 
                    drafts={docDrafts} 
                    setDrafts={setDocDrafts} 
                    history={docHistory} 
                    addToHistory={(doc) => setDocHistory([doc, ...docHistory])} 
                    onOpenSession={() => {}} 
                    language={language} 
                    onEarnPoints={(pts) => handleEarnPoints(pts, 'Serviços')} 
                    onToggleTask={() => {}} 
                    onViewChange={handleViewChange} 
                    initialTab="services"
                />;
             case ViewType.DASHBOARD: return <DashboardView masterPosts={masterPosts} onUpdatePosts={setMasterPosts} totalOfficialDocs={templates.length + serviceGuides.length} onAddCourse={(c) => setCourses([c, ...courses])} onAddMultipleCourses={(cs) => setCourses([...cs, ...courses])} onLogout={handleLogout} onDeleteAllUsers={() => {}} />;
             case ViewType.ADMIN: 
                 // 💎 SOBERANIA MÁXIMA V2026.GOLD: Render fallback only, logic is in useEffect Guard
                 if (!['amandasabreu89@gmail.com'].includes(user.email?.toLowerCase() || '')) {
                     return <DashboardView masterPosts={masterPosts} onUpdatePosts={setMasterPosts} totalOfficialDocs={templates.length + serviceGuides.length} onAddCourse={(c) => setCourses([c, ...courses])} onAddMultipleCourses={(cs) => setCourses([...cs, ...courses])} onLogout={handleLogout} onDeleteAllUsers={() => {}} />;
                 }
                return <AdminPanel 
                    initialTab={viewParams?.tab || adminTab} 
                    isSuperAdmin={true} 
                    onTabChange={(tab: any) => { 
                        setAdminTab(tab); 
                        handleViewChange(ViewType.ADMIN, { tab }); 
                    }} 
                    onBack={() => handleViewChange(ViewType.DASHBOARD)} 
                    onNavigateToPost={(postId: string, commentId?: string | null) => { 
                        setTargetPostId(postId); 
                        setTargetCommentId(commentId || null); 
                        handleViewChange(ViewType.COMMUNITY); 
                    }} 
                    onNavigateToService={() => handleViewChange(ViewType.MAP)} 
                    language={language} 
                    onUpdatePosts={setMasterPosts} 
                    onEarnPoints={(pts) => handleEarnPoints(pts, 'Verificação CEO')}
                    onViewChange={handleViewChange}
                />;
            case ViewType.NOTIFICATIONS:
                return <NotificationCenter 
                    notifications={notifications} 
                    unreadCount={unreadCount} 
                    onRead={markAsRead} 
                    onClearAll={clearAll} 
                    onViewChange={handleViewChange} 
                    language={language} 
                />;
            case ViewType.PRIVACY: return <PrivacyPage language={language} onBack={() => handleViewChange(ViewType.HOME)} initialSection={viewParams?.section} />;
            case ViewType.COOKIES: return <CookiesPolicy language={language} onBack={() => handleViewChange(ViewType.HOME)} />;
            case ViewType.PREMIOS: return <PremiosView language={language} onBack={() => handleViewChange(ViewType.HOME)} />;
            default: return <HomeView user={user} onViewChange={handleViewChange} language={language} onLogout={handleLogout} masterPosts={masterPosts} />;
        }
    };


    return (
        <>
            {showSplash && <SplashScreen onFinish={handleFinishSplash} />}
            {showConsent && (
                <ConsentModal 
                    language={language} 
                    onSetLanguage={handleSetLanguage} 
                    onAccept={() => { 
                        localStorage.setItem('mira_consent_v26', 'true'); 
                        setShowConsent(false); 
                    }} 
                />
            )}
            {showPostLoginInstallModal && !pwaService.isStandalone() && (
                <div className="fixed inset-0 z-[6000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
                        <button
                            onClick={() => setShowPostLoginInstallModal(false)}
                            className="absolute top-6 right-6 text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <div className="w-16 h-16 rounded-3xl bg-mira-orange/10 flex items-center justify-center mx-auto text-mira-orange text-3xl">
                            📲
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">
                            {isMobile ? (
                                language === 'PT' ? 'MIRA no seu Telemóvel' :
                                language === 'ES' ? 'MIRA en tu Móvil' :
                                language === 'FR' ? 'MIRA sur votre Mobile' :
                                'MIRA on your Phone'
                            ) : (
                                language === 'PT' ? 'MIRA no seu Computador' :
                                language === 'ES' ? 'MIRA en tu Computador' :
                                language === 'FR' ? 'MIRA sur Ordinateur' :
                                'MIRA on your Computer'
                            )}
                        </h3>
                        <p className="text-xs text-white/70 font-medium leading-relaxed">
                            {isMobile ? (
                                language === 'PT' ? 'Deseja adicionar um atalho do MIRA ao ecrã principal do seu telemóvel para um acesso rápido e seguro?' :
                                language === 'ES' ? '¿Desea agregar un acesso directo de MIRA a la pantalla de inicio de su móvil para un acesso rápido y seguro?' :
                                language === 'FR' ? 'Voulez-vous ajouter un raccourci MIRA sur l\'écran d\'accueil de votre mobile pour un accès rapide et sécurisé ?' :
                                'Would you like to add a MIRA shortcut to your phone\'s home screen for quick and secure access?'
                            ) : (
                                language === 'PT' ? 'Deseja instalar a aplicação MIRA no seu computador para um acesso rápido e seguro a partir do seu ambiente de trabalho?' :
                                language === 'ES' ? '¿Desea instalar la aplicación MIRA en su ordenador para un acceso rápido y seguro desde su escritorio?' :
                                language === 'FR' ? 'Voulez-vous installer l\'application MIRA sur votre ordinateur pour un accès rapide et sécurisé depuis votre bureau ?' :
                                'Would you like to install the MIRA application on your computer for quick and secure access from your desktop?'
                            )}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={async () => {
                                    setShowPostLoginInstallModal(false);
                                    if (pwaService.isInstallable()) {
                                        await pwaService.triggerInstall();
                                    } else if (pwaService.isIOS()) {
                                        setShowSafariGuide(true);
                                    } else {
                                        alert("Para instalar o MIRA no seu dispositivo, aceda ao menu do seu navegador (três pontos no canto superior direito) e selecione 'Instalar' ou 'Adicionar'.");
                                    }
                                }}
                                className="w-full py-4 bg-mira-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all"
                            >
                                {language === 'PT' ? 'Instalar Atalho' :
                                 language === 'ES' ? 'Instalar Acceso Directo' :
                                 language === 'FR' ? 'Installer Raccourci' :
                                 'Install Shortcut'}
                            </button>
                            <button
                                onClick={() => setShowPostLoginInstallModal(false)}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/70 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all"
                            >
                                {language === 'PT' ? 'Agora Não' :
                                 language === 'ES' ? 'Ahora No' :
                                 language === 'FR' ? 'Plus Tard' :
                                 'Not Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSafariGuide && (
                <div className="fixed inset-0 z-[6000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
                        <button
                            onClick={() => setShowSafariGuide(false)}
                            className="absolute top-6 right-6 text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <div className="w-16 h-16 rounded-3xl bg-mira-orange/10 flex items-center justify-center mx-auto text-mira-orange text-3xl">
                            📲
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">
                            {language === 'PT' ? 'Instalar no seu iPhone' :
                             language === 'ES' ? 'Instalar en tu iPhone' :
                             language === 'FR' ? 'Installer sur iPhone' :
                             'Install on your iPhone'}
                        </h3>
                        <p className="text-xs text-white/70 font-medium leading-relaxed">
                            {language === 'PT' ? (
                                <>
                                    Para adicionar o atalho ao ecrã principal, toque no botão de partilha <span className="inline-block p-1 bg-white/10 rounded">📤</span> no Safari e selecione <strong>'Adicionar ao Ecrã Principal'</strong> <span className="inline-block p-1 bg-white/10 rounded">➕</span>.
                                </>
                            ) : language === 'ES' ? (
                                <>
                                    Para agregar el acceso directo a la pantalla de inicio, toque el botón de compartir <span className="inline-block p-1 bg-white/10 rounded">📤</span> en Safari y seleccione <strong>'Compartir / Agregar a pantalla de inicio'</strong> <span className="inline-block p-1 bg-white/10 rounded">➕</span>.
                                </>
                            ) : language === 'FR' ? (
                                <>
                                    Pour ajouter le raccourci sur l'écran d'accueil, appuyez sur le bouton de partage <span className="inline-block p-1 bg-white/10 rounded">📤</span> dans Safari et sélectionnez <strong>'Sur l'écran d'accueil'</strong> <span className="inline-block p-1 bg-white/10 rounded">➕</span>.
                                </>
                            ) : (
                                <>
                                    To add the shortcut to your home screen, tap the share button <span className="inline-block p-1 bg-white/10 rounded">📤</span> in Safari and select <strong>'Add to Home Screen'</strong> <span className="inline-block p-1 bg-white/10 rounded">➕</span>.
                                </>
                            )}
                        </p>
                        <button
                            onClick={() => setShowSafariGuide(false)}
                            className="w-full py-4 bg-mira-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all"
                        >
                            {language === 'PT' ? 'Entendido' : 'Got it'}
                        </button>
                    </div>
                </div>
            )}
            {(!user || isRecoveryMode) ? (
                currentView === ViewType.PRIVACY ? (
                    <PrivacyPage language={language} onBack={() => setCurrentView(ViewType.HOME)} />
                ) : currentView === ViewType.COOKIES ? (
                    <CookiesPolicy language={language} onBack={() => setCurrentView(ViewType.HOME)} />
                ) : (
                    <AuthScreen 
                        onLogin={(u) => { 
                            setUser(u); 
                            handleViewChange(ViewType.HOME); 
                            if (!pwaService.isStandalone()) {
                                setShowPostLoginInstallModal(true);
                            }
                        }} 
                        language={language} 
                        setLanguage={handleSetLanguage}
                        isRecoveryMode={isRecoveryMode}
                        onOpenPrivacy={() => handleViewChange(ViewType.PRIVACY)}
                        onOpenTerms={() => handleViewChange(ViewType.PRIVACY)}
                    />
                )
            ) : (
                <div className={`min-h-screen ${[ViewType.ADMIN, ViewType.DASHBOARD].includes(currentView) ? 'bg-[#0A0A0A]' : 'bg-white'} flex flex-col font-sans overflow-hidden relative ${[ViewType.ADMIN, ViewType.DASHBOARD].includes(currentView) ? 'text-white' : 'text-slate-900'}`}>
                    
                    {/* Pull-to-Refresh Indicator */}
                    {(pullProgress > 0 || isRefreshing) && (
                        <div className="absolute top-0 left-0 right-0 z-[5000] flex justify-center pointer-events-none transition-all duration-200"
                             style={{ transform: `translateY(${isRefreshing ? 60 : pullProgress / 1.5}px)`, opacity: Math.min(pullProgress / 50, 1) }}>
                            <div className="bg-white p-3 rounded-full shadow-2xl border border-slate-100 animate-in zoom-in-50">
                                <Sparkles size={20} className={`text-mira-orange ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 3}deg)` }} />
                            </div>
                        </div>
                    )}



                    {/* ✅ MIRA V60.0 — HEADER ISOLADO E MEMOIZADO (Z-Index lowered to 1000 to allow modals above) */}
                    <div className="relative z-[1010]">
                        <TopBar
                            user={user}
                            language={language}
                            isSystemAdmin={isSystemAdmin}
                            isDark={currentView !== ViewType.COMMUNITY && (isSystemAdmin || [ViewType.ADMIN, ViewType.DASHBOARD].includes(currentView))}
                            onLogoClick={() => isSystemAdmin ? handleViewChange(ViewType.ADMIN) : handleViewChange(ViewType.HOME)}
                            onLogout={handleLogout}
                            onAdminClick={() => handleViewChange(ViewType.ADMIN)}
                            notifications={notifications}
                            unreadCount={unreadCount}
                            notifOpen={notifOpen}
                            onNotifToggle={toggleNotif}
                            onNotifRead={markAsRead}
                            onNotifClear={clearAll}
                            onNotifNavigate={() => handleViewChange(ViewType.NOTIFICATIONS)}
                            onSetLanguage={handleSetLanguage}
                        />
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className={`fixed bottom-0 left-0 right-0 z-[5000] h-[64px] bg-white border-t border-slate-100 safe-area-bottom md:hidden transition-colors duration-300`}>
                            <Navigation currentView={currentView} onViewChange={handleViewChange} language={language} user={user} />
                        </div>
                        <div className={`hidden md:block w-24 h-full bg-white border-r border-slate-100 z-[1000] relative transition-colors duration-300`}>
                            <Navigation currentView={currentView} onViewChange={handleViewChange} language={language} user={user} />
                        </div>
                        <main className={`flex-1 overflow-hidden flex flex-col ${[ViewType.ADMIN, ViewType.DASHBOARD].includes(currentView) ? 'bg-[#0A0A0A]' : currentView === ViewType.COMMUNITY ? 'bg-white' : 'bg-[#F8F9FA]'} transition-colors duration-300`}>
                            <div className={`flex-1 flex flex-col ${currentView === ViewType.ASSISTANT ? 'overflow-hidden pb-0' : 'overflow-y-auto overflow-x-hidden pb-32'}`}>
                                <div className="max-w-5xl mx-auto h-full w-full">{renderView()}</div>
                                {currentView !== ViewType.ASSISTANT && (
                                    <div className="max-w-5xl mx-auto w-full px-6 pb-6 text-center text-[8px] text-slate-400/70 font-bold uppercase tracking-wider leading-relaxed border-t border-slate-100/50 pt-4 mt-6">
                                        {t('disclaimer_educational', language)}
                                    </div>
                                )}
                            </div>
                        </main>
                        {currentView !== ViewType.ASSISTANT && (
                            <button 
                                onClick={() => {
                                    console.log("MIRA_DEBUG: Chat Button Clicked");
                                    handleViewChange(ViewType.ASSISTANT);
                                }} 
                                className="fixed bottom-24 right-5 w-16 h-16 bg-mira-orange text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(255,140,0,0.5)] animate-mira-blink hover:scale-110 active:scale-95 transition-all z-[5000]"
                                id="mira-chat-trigger"
                                title="MIRA Assistant"
                            >
                                <Bot size={32} strokeWidth={2.5} />
                                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                            </button>
                        )}
                    </div>

                    <style>{`
                        .safe-area-bottom-white { padding-bottom: env(safe-area-inset-bottom); background-color: white; }
                        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}</style>
                </div>
            )}
        </>
    );
};

const App: React.FC = () => (
    <ToastProvider>
        <AppContent />
    </ToastProvider>
);

export default App;
