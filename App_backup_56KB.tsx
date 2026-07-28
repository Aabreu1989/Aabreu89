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
import { LocalServicesList } from './components/LocalServicesList';
import { PROTECTED_POSTS } from './utils/protectedData';
import { PrivacyPage } from './components/PrivacyPage';
import { CookiesPolicy } from './components/CookiesPolicy';
import { ConsentModal } from './components/ConsentModal';
import { AuthScreen } from './components/AuthScreen';
import { ViewType, DocumentTask, ChatSession, GeneratedDocument, User, Course, Post } from './types';
import { analytics } from './services/analyticsService';
import { communityService } from './services/communityService';
import { normalizeCategory } from './utils/categoryUtils';
import { AdminPanel } from './components/AdminPanel';

import { authService } from './services/authService';
import { Bot, Sparkles } from 'lucide-react';
import { t } from './utils/translations';
import { IEFP_MASSIVE_DATABASE } from './utils/iefpCoursesDatabase';
import { ToastProvider } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { useNotifications } from './utils/useNotifications';
import TopBar from './components/TopBar';
import { initPageSDKs } from './src/pageSdkInit';
import { MessagesView } from './components/MessagesView';
import { ChatWindow } from './components/ChatWindow';
import { presenceService } from './services/presenceService';

const AppContent: React.FC = () => {
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
        // V26.15: URL Priority over localStorage for refresh/deep-linking
        const params = new URLSearchParams(window.location.search);
        const urlView = params.get('view');
        if (urlView && Object.values(ViewType).includes(urlView as ViewType)) return urlView as ViewType;

        const saved = localStorage.getItem('mira_current_view');
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
    const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'moderation' | 'suggestions' | 'knowledge' | 'ratings'>('dashboard');
    const [targetServiceId, setTargetServiceId] = useState<string | null>(null);
    const [viewParams, setViewParams] = useState<any>(() => {
        // V26.15: URL Priority for Params
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        if (urlTab) return { tab: urlTab };

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
    const isSystemAdmin = user?.email === 'amandasabreu89@gmail.com';
    const [savedPostsIds, setSavedPostsIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('mira_saved_posts');
        try { return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
    });
    const [likedPostsIds, setLikedPostsIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('mira_liked_posts');
        try { return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
    });
    const [likedCommentsIds, setLikedCommentsIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('mira_liked_comments');
        try { return saved ? new Set(JSON.parse(saved)) : new Set(); } catch { return new Set(); }
    });
    const [userVotes, setUserVotes] = useState<Record<string, 'true' | 'false'>>(() => {
        const saved = localStorage.getItem('mira_user_votes');
        try { return saved ? JSON.parse(saved) : {}; } catch { return {}; }
    });
    const [activeChat, setActiveChat] = useState<{ id: string; otherUser: any } | null>(null);
    const [courses, setCourses] = useState<Course[]>(IEFP_MASSIVE_DATABASE);
    const [commOffset, setCommOffset] = useState(0);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [masterPosts, setMasterPosts] = useState<Post[]>(() => {
        try {
            const cached = localStorage.getItem('mira_community_cache');
            const parsed = cached ? JSON.parse(cached) : [];
            // V99.2: ALWAYS normalize on load to ensure taxonomy consistency
            const normalized = [...(parsed.length > 0 ? parsed : PROTECTED_POSTS)].map(p => ({
                ...p,
                category: normalizeCategory(p.category)
            }));
            return normalized;
        } catch { 
            return [...PROTECTED_POSTS].map(p => ({ ...p, category: normalizeCategory(p.category) })); 
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

    // Track View Changes for Access Stats
    useEffect(() => {
        if (user?.id) {
            analytics.track('view_changed', user.id, 'Navigation', { view: currentView });
        }
    }, [currentView, user?.id]);

    // identity Init (V26.30)
    useEffect(() => { 
        initPageSDKs();
        
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

    useEffect(() => { localStorage.setItem('mira_liked_posts', JSON.stringify([...likedPostsIds])); }, [likedPostsIds]);
    useEffect(() => { localStorage.setItem('mira_liked_comments', JSON.stringify([...likedCommentsIds])); }, [likedCommentsIds]);
    useEffect(() => { localStorage.setItem('mira_user_votes', JSON.stringify(userVotes)); }, [userVotes]);
    useEffect(() => { 
        localStorage.setItem('mira_saved_posts', JSON.stringify([...savedPostsIds])); 
        persistence.set('saved_posts', [...savedPostsIds]); // V2026.PRO: Iron Persistence
    }, [savedPostsIds]); 

    const fetchSavedPosts = async (userId: string) => {
        try {
            const { data, error } = await supabase.from('saved_posts').select('post_id').eq('user_id', userId);
            if (error) throw error;
            if (data) {
                const serverIds = new Set(data.map(d => String(d.post_id)));
                setSavedPostsIds(prev => {
                    // MIRA V2026.FINAL: Merge Protocol
                    // We combine server state with anything already in our local set 
                    // (which includes recent optimistic updates from this session)
                    const merged = new Set([...prev, ...serverIds]);
                    
                    // If server is empty and local isn't, we definitely keep local
                    if (serverIds.size === 0 && prev.size > 0) return prev;
                    
                    return merged;
                });
            }
        } catch (e) { console.error('MIRA: Saved posts catch error:', e); }
    };

    const fetchUserInteractions = async (userId: string) => {
        try {
            // Fetch Likes (post_votes contains vote_type='like')
            const { data: likes, error: lError } = await supabase.from('post_votes').select('post_id').eq('user_id', userId).eq('vote_type', 'like');
            if (lError) throw lError;
            if (likes) {
                setLikedPostsIds(prev => {
                    const serverSet = new Set(likes.map(l => String(l.post_id)));
                    
                    // MIRA V2026.FINAL: Merge Protocol
                    // Combine server likes with optimistic local likes
                    const merged = new Set([...prev, ...serverSet]);

                    // Preserve mock posts & local ids
                    prev.forEach(id => { if (id === '1' || id.startsWith('p-') || id.startsWith('local-')) merged.add(id); });
                    
                    return merged;
                });
            }

            // Fetch Comment Likes
            const { data: cLikes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', userId);
            if (cLikes) {
                setLikedCommentsIds(prev => {
                    const serverSet = new Set(cLikes.map(cl => String(cl.comment_id)));
                    return new Set([...prev, ...serverSet]);
                });
            }

            // Fetch Votes (useful/fake)
            const { data: votes } = await supabase.from('post_votes').select('post_id, vote_type').eq('user_id', userId).in('vote_type', ['useful', 'fake']);
            if (votes) {
                setUserVotes(prev => {
                    const next: Record<string, 'true' | 'false'> = { ...prev };
                    votes.forEach(v => {
                        next[String(v.post_id)] = v.vote_type === 'useful' ? 'true' : 'false';
                    });
                    return next;
                });
            }
        } catch (e) {
            console.error("MIRA: Error fetching interactions:", e);
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
                        setMasterPosts(prev => prev.filter(p => p.id !== (payload.old as any).id));
                    }
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, async (payload) => {
                    console.log("MIRA_REALTIME: Comment change detected:", payload);
                    if (payload.eventType === 'INSERT') {
                        const postId = payload.new.post_id;
                        const { communityService: cS } = await import('./services/communityService');
                        const formattedPost = await cS.fetchPostById(postId, user.id);
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
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
                    console.log("MIRA_REALTIME: Profile Reputation Update:", payload.new);
                    setUser(prev => prev ? { ...prev, reputation: payload.new.reputation, badges: payload.new.badges } : null);
                })
                .subscribe();

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
    }, [isInitializing]);

    // Main Auth Init & Persistence
    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                // V5.4.1: Handle email confirmation hash in URL FIRST
                const hasAuthToken = window.location.hash.includes('access_token') || 
                                     window.location.search.includes('code=') ||
                                     window.location.pathname === '/auth/callback';

                if (hasAuthToken) {
                    // Give Supabase client time to process the token from URL
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (session && mounted) {
                    const profile = await authService.fetchProfileWithRetry(
                        session.user.id, 
                        session.user.email || '', 
                        session.user.user_metadata?.name
                    );

                    if (profile && mounted) {
                        // Sync email if missing in public profile (Ensures Admin can always see email)
                        if (!profile.email && session.user.email) {
                            supabase.from('profiles')
                                .update({ email: session.user.email })
                                .eq('id', profile.id)
                                .then(() => console.log('MIRA: Email synced to profile in App.tsx'));
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
            // V5.4.1: Catch ALL events that indicate a valid user session
            const authEvents = ['SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED', 'USER_UPDATED'];
            if (authEvents.includes(event)) {
                if (session?.user && mounted) {
                    // VERIFICAÇÃO DE SEGURANÇA: Bloqueio de login sem confirmação de email (Apenas para provedor 'email')
                    // V11000: Permissivo em isRecoveryMode ou Provedores OAuth (Google)
                    const isOAuth = session.user.app_metadata.provider !== 'email';
                    if (!session.user.email_confirmed_at && !isRecoveryMode && !isOAuth) {
                        console.warn("MIRA Security: Evento de login/update detetado mas email não confirmado.");
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
                        // Sync email if missing in public profile (Ensures Admin can always see email)
                        if (!profile.email && session.user.email) {
                            supabase.from('profiles')
                                .update({ email: session.user.email })
                                .eq('id', profile.id)
                                .then(() => console.log('MIRA Auth: Email synced to profile on auth change'));
                        }

                        const u = authService.mapProfileToUser(profile, session.user);
                        setUser(u);
                        localStorage.setItem('mira_user', JSON.stringify(u));
                        setShowSplash(false);
                        setIsInitializing(false);
                        sessionStorage.setItem('mira_splash_shown', 'true');
                        // Clean URL hash after email confirmation
                        // Clean URL hash but preserve view parameters (V55.1)
                        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
                            const params = new URLSearchParams(window.location.search);
                            const cleanParams = new URLSearchParams();
                            const authParams = ['code', 'access_token', 'refresh_token', 'expires_in', 'provider_token', 'token_type'];
                            params.forEach((v, k) => { if (!authParams.includes(k)) cleanParams.set(k, v); });
                            const search = cleanParams.toString();
                            const newUrl = window.location.pathname + (search ? '?' + search : '');
                            window.history.replaceState({}, document.title, newUrl);
                        }
                    } else if (mounted) {
                        // Profile fetch failed but session exists - don't keep user stuck
                        console.warn("MIRA: Session exists but profile fetch failed.");
                        setIsInitializing(false);
                        setShowSplash(false);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('mira_user');
                sessionStorage.clear();
                localStorage.removeItem('mira_current_view');
                setIsInitializing(false);
                setCurrentView(ViewType.HOME);
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
            // V48.0: Pagination - Load only 20 posts initially
            const PAGE_SIZE = 20;
            const dbPosts = await communityService.fetchPosts(user.id, PAGE_SIZE, 0);
            const finalPosts = [...(dbPosts || [])].map(p => ({
              ...p,
              category: normalizeCategory(p.category)
            }));
            
            // Ensure protected posts stay if not in DB results (and normalize them too)
            PROTECTED_POSTS.forEach(p => { 
              if (!finalPosts.some(fp => fp.id === p.id)) {
                finalPosts.push({
                  ...p,
                  category: normalizeCategory(p.category)
                });
              } 
            });

            setMasterPosts(prev => {
                const existingLocals = prev.filter(p => String(p.id).startsWith('local-'));
                const combined = [...existingLocals, ...finalPosts];
                
                // Deduplicate if a local post's content now matches a DB post
                const dbContents = new Set(finalPosts.map(p => p.content));
                const unique = combined.filter(p => {
                    if (String(p.id).startsWith('local-') && dbContents.has(p.content)) return false;
                    return true;
                });

                return unique.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });

            setCommOffset(PAGE_SIZE);
            setHasMorePosts(dbPosts.length === PAGE_SIZE);
            
            await fetchSavedPosts(user.id);

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
        setUser(prev => prev ? { ...prev, reputation: (prev.reputation || 0) + amount } : null);
        
        if (optimisticOnly) return; // Do not call server if it's handled by triggers
        
        try {
            const { gamificationService } = await import('./services/gamificationService');
            const newRep = await gamificationService.earnPoints(user.id, amount, reason);
            if (newRep !== null) {
                setUser(prev => prev ? { ...prev, reputation: newRep } : null);
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

    const handleToggleSavePost = async (postId: string) => {
        if (!user) return;
        const isCurrentlySaved = savedPostsIds.has(postId);
        
        // Optimistic UI update
        setSavedPostsIds(prev => {
            const n = new Set(prev);
            if (isCurrentlySaved) n.delete(postId); else n.add(postId);
            return n;
        });

        const { syncService } = await import('./services/syncService');
        syncService.enqueue('save', { postId, userId: user.id });
        
        // Background refresh from DB to ensure local state didn't drift
        setTimeout(() => fetchSavedPosts(user.id), 2000);
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
                targetPostId={targetPostId} 
                targetCommentId={targetCommentId} 
                onClearTargetPost={() => { setTargetPostId(null); setTargetCommentId(null); }} 
                onUpdateUser={setUser} 
                onLoadMore={loadMorePosts} 
                hasMore={hasMorePosts} 
                isLoading={isRefreshing}
                onViewProfile={(id, name, avatar) => handleViewChange(ViewType.PROFILE, { profileUser: { id, name, avatar } as User })} />;
            case ViewType.ASSISTANT: return <AssistantView language={language} onViewChange={handleViewChange} user={user} />;
            case ViewType.JOBS: return <JobBoard language={language} isAdmin={user.role === 'admin'} onViewChange={handleViewChange} initialTab={viewParams?.tab} />;
            case ViewType.MAP: return <LocalServicesList language={language} user={user} targetServiceId={viewParams?.id || targetServiceId} onClearTargetService={() => { setTargetServiceId(null); setViewParams(null); }} />;
            case ViewType.LEARNING: return <LearningView courses={courses} language={language} onNavigateToChat={() => handleViewChange(ViewType.ASSISTANT)} onEarnPoints={(pts) => handleEarnPoints(pts, 'Aprendizagem')} onNavigateToContact={() => {}} />;
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
                    helps={14} 
                    impact={profileUser?.reputation || 0} 
                    badges={profileUser?.badges || []} 
                    activitiesCount={10} 
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
                    onDeletePost={(id) => setMasterPosts(prev => prev.filter(p => p.id !== id))} 
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
            case ViewType.DASHBOARD: return <DashboardView masterPosts={masterPosts} onUpdatePosts={setMasterPosts} totalOfficialDocs={6} onAddCourse={(c) => setCourses([c, ...courses])} onAddMultipleCourses={(cs) => setCourses([...cs, ...courses])} onLogout={handleLogout} onDeleteAllUsers={() => {}} />;
            case ViewType.ADMIN: 
                // SEGURANÇA MÁXIMA V26.2: Bloqueio Total exceto para Amanda
                if (user.email !== 'amandasabreu89@gmail.com') {
                    setCurrentView(ViewType.HOME);
                    return null;
                }
                return <AdminPanel 
                    initialTab={viewParams?.tab || adminTab} 
                    isSuperAdmin={user.email === 'amandasabreu89@gmail.com'} 
                    onTabChange={(tab) => { 
                        setAdminTab(tab); 
                        handleViewChange(ViewType.ADMIN, { tab }); 
                    }} 
                    onBack={() => handleViewChange(ViewType.DASHBOARD)} 
                    onNavigateToPost={(postId, commentId) => { 
                        setTargetPostId(postId); 
                        setTargetCommentId(commentId || null); 
                        handleViewChange(ViewType.COMMUNITY); 
                    }} 
                    onNavigateToService={() => handleViewChange(ViewType.MAP)} 
                    language={language} 
                    onUpdatePosts={setMasterPosts} 
                    onEarnPoints={(pts) => handleEarnPoints(pts, 'Verificação CEO')}
                />;
            case ViewType.NOTIFICATIONS:
                return null;
            case ViewType.PRIVACY: return <PrivacyPage language={language} onBack={() => handleViewChange(user ? ViewType.HOME : ViewType.HOME)} />;
            case ViewType.COOKIES: return <CookiesPolicy language={language} onBack={() => handleViewChange(ViewType.HOME)} />;
            default: return <HomeView user={user} onViewChange={handleViewChange} language={language} onLogout={handleLogout} masterPosts={masterPosts} />;
        }
    };


    return (
        <>
            {showSplash && <SplashScreen onFinish={handleFinishSplash} />}
            {(!user || isRecoveryMode) ? (
                currentView === ViewType.PRIVACY ? (
                    <PrivacyPage language={language} onBack={() => setCurrentView(ViewType.HOME)} />
                ) : currentView === ViewType.COOKIES ? (
                    <CookiesPolicy language={language} onBack={() => setCurrentView(ViewType.HOME)} />
                ) : (
                    <AuthScreen 
                        onLogin={(u) => { setUser(u); handleViewChange(ViewType.HOME); }} 
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

                    {showConsent && <ConsentModal language={language} onAccept={() => { localStorage.setItem('mira_consent_given', 'true'); setShowConsent(false); }} onDecline={() => setShowConsent(false)} />}

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
                            onSetLanguage={handleSetLanguage}
                        />
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        <div className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-slate-100 safe-area-bottom md:hidden transition-colors duration-300`}>
                            <Navigation currentView={currentView} onViewChange={handleViewChange} language={language} />
                        </div>
                        <div className={`hidden md:block w-24 h-full bg-white border-r border-slate-100 z-[1000] relative transition-colors duration-300`}>
                            <Navigation currentView={currentView} onViewChange={handleViewChange} language={language} />
                        </div>
                        <main className={`flex-1 overflow-hidden flex flex-col ${[ViewType.ADMIN, ViewType.DASHBOARD].includes(currentView) ? 'bg-[#0A0A0A]' : currentView === ViewType.COMMUNITY ? 'bg-white' : 'bg-[#F8F9FA]'} transition-colors duration-300`}>
                            <div className={`flex-1 flex flex-col ${currentView === ViewType.ASSISTANT ? 'overflow-hidden pb-0' : 'overflow-y-auto overflow-x-hidden pb-32'}`}>
                                <div className="max-w-5xl mx-auto h-full w-full">{renderView()}</div>

                                {currentView === ViewType.HOME && (
                                    <footer className="w-full bg-white border-t border-slate-100 py-8 px-6 flex flex-col items-center gap-4 mt-8 mb-4 shadow-sm relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center p-2.5 shadow-sm border border-slate-100">
                                                <img src="/logo-mira.png" alt="MIRA" className="w-8 h-8 object-contain" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-lg font-extrabold tracking-tighter text-slate-900 leading-tight">MIRA</h3>
                                                <p className="text-[7px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{t('auth_subtitle', language)}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[9px] font-extrabold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-5 w-full max-w-sm">
                                            <button onClick={() => setCurrentView(ViewType.PRIVACY)} className="hover:text-mira-orange transition-colors">{t('footer_privacy', language)}</button>
                                            <button onClick={() => setCurrentView(ViewType.PRIVACY)} className="hover:text-mira-orange transition-colors">{t('footer_terms', language)}</button>
                                            <button onClick={() => setCurrentView(ViewType.COOKIES)} className="hover:text-mira-orange transition-colors">{t('footer_cookies', language)}</button>
                                        </div>

                                        <p className="text-[8px] font-extrabold text-slate-300 tracking-wider uppercase text-center">
                                            MIRA 2026 © - AMANDA SILVA ABREU
                                        </p>
                                    </footer>
                                )}
                            </div>
                        </main>
                        {currentView !== ViewType.ASSISTANT && (
                            <button onClick={() => setCurrentView(ViewType.ASSISTANT)} className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-mira-orange to-red-600 text-white rounded-full flex items-center justify-center shadow-2xl animate-pulse hover:scale-110 transition-transform z-[4000]">
                                <Bot size={28} />
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
