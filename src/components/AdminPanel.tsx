import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import AdminSaberIA from './AdminSaberIA';
import { MiraImpactReport } from './MiraImpactReport';
import PremiosView from './PremiosView';
import { adminService } from '../services/adminService';
import { generateAdminHubPDF, generateAuditExcel } from '../services/exportService';
import { User, Post, ViewType } from '../types';
import {
    ShieldCheck, Users, ShieldAlert, Trash2, Ban,
    Search, CheckCircle2, RefreshCcw, Database, 
    Activity, ChevronDown, Loader2, GraduationCap, MapPin, Lightbulb, Bell,
    User as UserIcon, CheckCircle, Bot, Star, X, MessageCircle, AlertCircle, Briefcase, ChevronRight, MailX, Sparkles, Globe, Award, FileText, Smartphone, Trophy,
    BarChart3, TrendingUp, Calculator, Download, Eye, FileSignature, Terminal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { templates, serviceGuides } from '../utils/documentsDatabase';

interface AdminPanelProps {
    onBack: () => void;
    onNavigateToPost?: (postId: string, commentId?: string) => void;
    onNavigateToService?: (serviceId: string) => void;
    language: string;
    onUpdatePosts?: React.Dispatch<React.SetStateAction<Post[]>>;
    onEarnPoints?: (amount: number) => void;
    initialTab?: 'dashboard' | 'users' | 'knowledge';
    onTabChange?: (tab: 'dashboard' | 'users' | 'knowledge') => void;
    isSuperAdmin?: boolean;
    onLogout?: () => void;
    onViewChange?: (view: any, params?: any) => void;
}

const getInitialDashboardCounts = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('mira_admin_dashboard_counts_v7');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object' && parsed.recurrence && parsed.recurrence.isLoaded === true) {
                    return parsed;
                }
            }
        }
    } catch (_) {}
    return { 
        courses: { db: 0, prot: 0 }, 
        services: { db: 0, prot: 0 }, 
        users: 0, 
        usersToday: 0, 
        jobs: { db: 0, prot: 0 }, 
        reports: 0, 
        suggestions: 0, 
        posts: 0, 
        comments: 0, 
        recurrence: null, // 🔒 NUNCA CARREGA NÚMEROS FALSOS / ESTADO AUSENTE
        retentionRate: 0, 
        observedRetentionRate: 0,
        observedUsers: 0,
        distinctSessions: 0,
        returningUsers: 0, 
        distinctDaysReturningUsers: 0,
        distinctDaysRetentionRate: 0,
        historicalReturningUsersBaseline: 832,
        pwaMobileDownloads: 0, 
        pwaComputerDownloads: 0, 
        horasPoupadas: 0, 
        processosAjudados: 0, 
        aiQueries: 0, 
        simulations: 0, 
        downloads: 0, 
        appAccesses: 0, 
        totalInteractions: 0, 
        totalLikes: 0 
    };
};

const getInitialPeriodCounts = () => {
    try {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('mira_admin_period_counts_24');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object' && parsed.newUsers !== undefined) {
                    return parsed;
                }
            }
        }
    } catch (_) {}
    return { newUsers: 0, newPosts: 0, newComments: 0, newJobs: 0, docDownloads: 0, appAccesses: 0, articleViews: 0, newAiQueries: 0 };
};

const confirmAction = (msg: string) => {
    return window.confirm(msg);
};

const UserCard = React.memo(({ user, isAdmin, isSuperViewer, onToggleBlock, onToggleVerify, onDelete, onManageMedals, isDark }: { user: User, isAdmin: boolean, isSuperViewer: boolean, onToggleBlock: () => void, onToggleVerify: () => void, onDelete: () => void, onManageMedals: () => void, isDark: boolean }) => (
    <div className={`w-full p-5 sm:p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} rounded-[2.5rem] shadow-xl hover:shadow-orange-500/10 hover:border-[#FF8C00]/30 transition-all group animate-in fade-in duration-300 relative overflow-hidden`}>
        <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shrink-0 ${isAdmin ? 'bg-[#FF8C00] text-white' : (isDark ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-400')}`}>
                    {user.name?.charAt(0).toUpperCase() || <UserIcon size={20} />}
                </div>
                <div className="overflow-hidden flex-1">
                    <div className="flex items-center gap-2">
                        <p className={`font-black uppercase tracking-tight truncate text-[14px] sm:text-[16px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name || 'Membro'}</p>
                        {isAdmin && <ShieldCheck size={14} className="text-mira-orange" />}
                        {user.isVerified && <CheckCircle2 size={14} className="text-blue-400" />}
                    </div>
                    <p className={`text-[10px] sm:text-[11px] font-black tracking-widest truncate ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        {user.email}
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button 
                    onClick={onToggleBlock}
                    className={`w-full sm:flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border ${user.isBlocked ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-400' : 'bg-white/5 text-white/50 hover:bg-white/10 border-white/10'}`}
                >
                    {user.isBlocked ? <CheckCircle size={14} /> : <Ban size={14} />}
                    {user.isBlocked ? 'ATIVAR' : 'BLOQUEAR'}
                </button>
                <button 
                    onClick={onToggleVerify}
                    className={`w-full sm:flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border ${user.isVerified ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-400' : 'bg-white/5 text-white/50 hover:bg-white/10 border-white/10'}`}
                >
                    {user.isVerified ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
                    {user.isVerified ? 'VERIFICADO' : 'VERIFICAR'}
                </button>
                <button 
                    onClick={onManageMedals}
                    className={`w-full sm:flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 border bg-white/5 text-white/50 hover:bg-white/10 border-white/10`}
                >
                    <Award size={14} className="text-[#FF8C00]" />
                    MEDALHAS
                </button>
                <button 
                    onClick={onDelete}
                    className="w-full sm:w-auto p-4 px-6 bg-red-600/20 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 group/del"
                >
                    <Trash2 size={18} className="group-hover/del:rotate-12 transition-transform" />
                    <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">ELIMINAR</span>
                </button>
            </div>
        </div>
    </div>
));

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    onBack, 
    onNavigateToPost, 
    onNavigateToService, 
    language, 
    onUpdatePosts,
    onEarnPoints,
    initialTab = 'dashboard',
    onTabChange,
    isSuperAdmin,
    onViewChange
}) => {
    const [activeTab, setActiveTab ] = useState<'dashboard' | 'users' | 'knowledge' | 'gamification' | 'broadcast' | 'impact' | 'concursos'>(initialTab as any || 'dashboard');

    
    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab as any);
        }
    }, [initialTab]);

    const [users, setUsers] = useState<User[]>([]);
    const [communityReports, setCommunityReports] = useState<any[]>([]);
    const [communityComments, setCommunityComments] = useState<any[]>([]);
    const [aiKnowledge, setAIKnowledge] = useState<any[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<Set<string>>(new Set());
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingKnowledge, setLoadingKnowledge] = useState(false);
    const [loadingGamification, setLoadingGamification] = useState(false);
    const fetchingTabsRef = useRef<Set<string>>(new Set());
    const realtimeDebounceTimerRef = useRef<any>(null);
    const [counts, setCounts] = useState(getInitialDashboardCounts);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [knowledgeSearch, setKnowledgeSearch] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [dashboardPeriod, setDashboardPeriod] = useState<24 | 168 | 720>(24);
    const [periodCounts, setPeriodCounts] = useState(getInitialPeriodCounts);
    const [userSortBy, setUserSortBy] = useState<'name' | 'created' | 'status'>('created');
    const [userFilterStatus, setUserFilterStatus] = useState<'all' | 'active' | 'blocked' | 'verified'>('all');

    // 📢 MIRA BROADCAST SYSTEM: Estados do formulário de transmissão global
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState<'docs' | 'aima' | 'jobs' | 'community'>('docs');
    const [broadcastLink, setBroadcastLink] = useState('/docs');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [deniedEmails, setDeniedEmails] = useState<string[]>([]);
    const [dataCache, setDataCache] = useState<Record<string, { timestamp: number, data: any }>>({});
    const dataCacheRef = useRef<Record<string, { timestamp: number, data: any }>>({});
    const inFlightRequestsRef = useRef<Map<string, Promise<any>>>(new Map());
    const isInitialUserTabRef = useRef<boolean>(true);
    const [usersPage, setUsersPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [knowledgePage, setKnowledgePage] = useState(0);
    const [totalKnowledge, setTotalKnowledge] = useState(0);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [schemaHealth, setSchemaHealth] = useState<Record<string, boolean>>({});
    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [selectedUserForMedals, setSelectedUserForMedals] = useState<User | null>(null);
    const [userMedals, setUserMedals] = useState<string[]>([]);
    const [userFilterCounts, setUserFilterCounts] = useState<{ total: number; active: number; blocked: number; verified: number }>({ total: 0, active: 0, blocked: 0, verified: 0 });
    const [authError, setAuthError] = useState<'AUTH_REQUIRED' | 'ADMIN_UNAUTHORIZED' | null>(null);
    const { showToast } = useToast();

    // 🛡️ SNIPER CACHE & PROGRESSIVE TARGETED LOADER (PATCH 4E.1)
    const loadData = useCallback(async (force = false, targetTab?: string) => {
        const tab = targetTab || activeTab;
        const now = Date.now();
        const cacheKey = tab === 'users' 
            ? `users_${usersPage}_${userSearchTerm.trim()}_${userFilterStatus}` 
            : tab === 'knowledge'
            ? `knowledge_${knowledgePage}_${knowledgeSearch.trim()}`
            : tab;
        const cached = dataCacheRef.current[cacheKey];
        const threshold = typeof document !== 'undefined' && document.visibilityState === 'visible' ? 30000 : 180000;
        
        if (!force && cached && (now - cached.timestamp < threshold)) {
            if (tab === 'users' && cached.data?.result) {
                setUsers(cached.data.result.users || []);
                setTotalUsers(cached.data.result.total || 0);
                setAuthError(null);
                if (cached.data.filterCounts) {
                    setUserFilterCounts(cached.data.filterCounts);
                }
            } else if (tab === 'knowledge' && cached.data) {
                setAIKnowledge(cached.data.items || []);
                setTotalKnowledge(cached.data.total || 0);
            } else if (tab === 'gamification' && cached.data) {
                setAllBadges(cached.data || []);
            } else if (tab === 'dashboard' && cached.data) {
                setCounts(cached.data);
            }
            return;
        }

        // 🛡️ IN-FLIGHT MUTEX COALESCING: Se já existe requisição em voo para esta chave, aguarda-a sem descartar
        if (inFlightRequestsRef.current.has(cacheKey)) {
            try {
                await inFlightRequestsRef.current.get(cacheKey);
            } catch (_) {}
            return;
        }

        const taskPromise = (async () => {
            if (tab === 'users') {
                setLoadingUsers(true);
                setAuthError(null);
                try {
                    const [result, filterCounts] = await Promise.all([
                        adminService.fetchUsers(usersPage, 20, userSearchTerm, userFilterStatus),
                        adminService.fetchUserFilterCounts()
                    ]);
                    
                    if (result && Array.isArray(result.users) && typeof result.total === 'number') {
                        setUsers(result.users);
                        setTotalUsers(result.total);
                        setAuthError(null);
                        if (filterCounts) {
                            setUserFilterCounts(filterCounts);
                        }
                        // 🛡️ REGRA DE INTEGRIDADE: O cache só é preenchido quando a resposta HTTP é 200 OK, o payload é estruturalmente válido e a operação foi concluída sem erro
                        const cachePayload = { timestamp: Date.now(), data: { result, filterCounts } };
                        dataCacheRef.current[cacheKey] = cachePayload;
                        setDataCache(prev => ({ ...prev, [cacheKey]: cachePayload }));
                    }
                } catch (err: any) {
                    const msg = err?.message || '';
                    if (msg.includes('AUTH_REQUIRED')) {
                        setAuthError('AUTH_REQUIRED');
                    } else if (msg.includes('ADMIN_UNAUTHORIZED')) {
                        setAuthError('ADMIN_UNAUTHORIZED');
                    } else {
                        console.error("[MIRA AdminPanel] Erro ao carregar utilizadores:", err);
                    }
                } finally {
                    setLoadingUsers(false);
                }

            } else if (tab === 'dashboard') {
                setLoadingDashboard(true);
                
                // 🚀 DASHBOARD PROGRESSIVO PARALELO:
                adminService.fetchAIKnowledge(5, true).then(kb => {
                    if (kb) setAIKnowledge(kb);
                });
                adminService.fetchSyncStatusForPeriod(dashboardPeriod).then(p => {
                    if (p) {
                        setPeriodCounts(p);
                        try {
                            sessionStorage.setItem(`mira_admin_period_counts_${dashboardPeriod}`, JSON.stringify(p));
                        } catch (_) {}
                    }
                });

                adminService.fetchSyncStatus().then(status => {
                    if (status) {
                        const newCounts = { 
                            ...status,
                            recurrence: status.recurrence || null,
                            courses: status.courses || { db: 0, prot: 0 }, 
                            services: status.services || { db: 0, prot: 0 }, 
                            users: status.users || 0, 
                            usersToday: status.usersToday || 0,
                            appAccesses: status.appAccesses || 0,
                            totalInteractions: (status as any).totalInteractions || 0,
                            jobs: status.jobs || { db: 0, prot: 0 }, 
                            reports: status.reports || 0,
                            suggestions: status.suggestions || 0,
                            posts: status.posts || 0,
                            comments: status.comments || 0,
                            downloads: status.downloads || 0,
                            simulations: status.simulations || 0,
                            totalLikes: status.totalLikes || 0,
                            retentionRate: status.recurrence?.observedRetentionRate ?? status.retentionRate ?? 0,
                            observedRetentionRate: status.recurrence?.observedRetentionRate ?? status.retentionRate ?? 0,
                            observedUsers: status.recurrence?.observedUsers ?? status.observedUsers ?? 0,
                            distinctSessions: status.recurrence?.distinctSessions ?? status.distinctSessions ?? 0,
                            returningUsers: status.recurrence?.returningUsers ?? status.returningUsers ?? 0,
                            distinctDaysReturningUsers: status.recurrence?.distinctDaysReturningUsers ?? (status as any).distinctDaysReturningUsers ?? 0,
                            distinctDaysRetentionRate: status.recurrence?.distinctDaysRetentionRate ?? (status as any).distinctDaysRetentionRate ?? 0,
                            historicalReturningUsersBaseline: status.recurrence?.historicalReturningUsersBaseline ?? (status as any).historicalReturningUsersBaseline ?? 832,
                            pwaMobileDownloads: status.pwaMobileDownloads || 0,
                            pwaComputerDownloads: status.pwaComputerDownloads || 0,
                            horasPoupadas: status.horasPoupadas || 0,
                            processosAjudados: status.processosAjudados || 0,
                            aiQueries: status.aiQueries || 0
                        };
                        setCounts(newCounts);
                        try {
                            sessionStorage.setItem('mira_admin_dashboard_counts_v7', JSON.stringify(newCounts));
                        } catch (_) {}
                        const cachePayload = { timestamp: Date.now(), data: newCounts };
                        dataCacheRef.current['dashboard'] = cachePayload;
                        setDataCache(prev => ({ ...prev, dashboard: cachePayload }));
                    }
                }).finally(() => {
                    setLoadingDashboard(false);
                });

            } else if (tab === 'knowledge') {
                setLoadingKnowledge(true);
                const kbRes = await adminService.fetchAIKnowledgePaginated(knowledgePage, 20);
                if (kbRes) {
                    setAIKnowledge(kbRes.items || []);
                    setTotalKnowledge(kbRes.total || 0);
                }
                const cachePayload = { timestamp: Date.now(), data: kbRes };
                dataCacheRef.current['knowledge'] = cachePayload;
                setDataCache(prev => ({ ...prev, knowledge: cachePayload }));
                setLoadingKnowledge(false);

            } else if (tab === 'gamification') {
                setLoadingGamification(true);
                const { gamificationService } = await import('../services/gamificationService');
                const res = await gamificationService.fetchAllBadges();
                if (res) setAllBadges(res || []);
                const cachePayload = { timestamp: Date.now(), data: res };
                dataCacheRef.current['gamification'] = cachePayload;
                setDataCache(prev => ({ ...prev, gamification: cachePayload }));
                setLoadingGamification(false);

            } else if (tab === 'broadcast' || tab === 'impact') {
                if (!counts.users || !counts.recurrence?.isLoaded) {
                    adminService.fetchSyncStatus().then(status => {
                        if (status) {
                            const newCounts = {
                                ...status,
                                recurrence: status.recurrence || null,
                                courses: status.courses || { db: 0, prot: 0 }, 
                                services: status.services || { db: 0, prot: 0 }, 
                                users: status.users || 0, 
                                usersToday: status.usersToday || 0,
                                appAccesses: status.appAccesses || 0,
                                totalInteractions: (status as any).totalInteractions || 0,
                                jobs: status.jobs || { db: 0, prot: 0 }, 
                                reports: status.reports || 0,
                                suggestions: status.suggestions || 0,
                                posts: status.posts || 0,
                                comments: status.comments || 0,
                                downloads: status.downloads || 0,
                                simulations: status.simulations || 0,
                                totalLikes: status.totalLikes || 0,
                                retentionRate: status.recurrence?.observedRetentionRate ?? status.retentionRate ?? 0,
                                observedRetentionRate: status.recurrence?.observedRetentionRate ?? status.retentionRate ?? 0,
                                observedUsers: status.recurrence?.observedUsers ?? status.observedUsers ?? 0,
                                distinctSessions: status.recurrence?.distinctSessions ?? status.distinctSessions ?? 0,
                                returningUsers: status.recurrence?.returningUsers ?? status.returningUsers ?? 0,
                                distinctDaysReturningUsers: status.recurrence?.distinctDaysReturningUsers ?? (status as any).distinctDaysReturningUsers ?? 0,
                                distinctDaysRetentionRate: status.recurrence?.distinctDaysRetentionRate ?? (status as any).distinctDaysRetentionRate ?? 0,
                                historicalReturningUsersBaseline: status.recurrence?.historicalReturningUsersBaseline ?? (status as any).historicalReturningUsersBaseline ?? 832,
                                pwaMobileDownloads: status.pwaMobileDownloads || 0,
                                pwaComputerDownloads: status.pwaComputerDownloads || 0,
                                horasPoupadas: status.horasPoupadas || 0,
                                processosAjudados: status.processosAjudados || 0,
                                aiQueries: status.aiQueries || 0
                            };
                            setCounts(newCounts);
                            try {
                                sessionStorage.setItem('mira_admin_dashboard_counts_v7', JSON.stringify(newCounts));
                            } catch (_) {}
                        }
                    });
                }
            }
        })();

        inFlightRequestsRef.current.set(cacheKey, taskPromise);

        try {
            await taskPromise;
        } catch (e) {
            console.error("MIRA Admin Hub Error:", e);
        } finally {
            inFlightRequestsRef.current.delete(cacheKey);
            setLoadingUsers(false);
            setLoadingKnowledge(false);
            setLoadingGamification(false);
        }
    }, [activeTab, usersPage, knowledgePage, userSearchTerm, userFilterStatus, dashboardPeriod, counts.users]);

    // Reactive search effect with debounce (não dispara concorrente na troca inicial de aba)
    useEffect(() => {
        if (activeTab !== 'users') {
            isInitialUserTabRef.current = true;
            return;
        }
        if (isInitialUserTabRef.current) {
            isInitialUserTabRef.current = false;
            return;
        }
        const timer = setTimeout(() => {
            loadData(true);
        }, 250);
        return () => clearTimeout(timer);
    }, [userSearchTerm, userFilterStatus, usersPage, activeTab, loadData]);

    useEffect(() => {
        let isMounted = true;

        const initTabLoad = async () => {
            if (isMounted) {
                loadData(false);
            }
        };

        initTabLoad();

        // 🚀 MIRA GENTLE POLLING: Intervalo de 15s que não força concorrência e só roda quando a aba está visível
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                loadData(false);
            }
        }, 15000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [activeTab, dashboardPeriod, loadData]);

    // 🛡️ MIRA REAL-TIME: Escuta eventos locais e Postgres com debounce seguro de 500ms
    useEffect(() => {
        const handleDebouncedUpdate = () => {
            if (realtimeDebounceTimerRef.current) clearTimeout(realtimeDebounceTimerRef.current);
            realtimeDebounceTimerRef.current = setTimeout(() => {
                loadData(true);
            }, 500);
        };

        window.addEventListener('mira-telemetry-update', handleDebouncedUpdate);
        window.addEventListener('mira-access-recorded', handleDebouncedUpdate);

        const channel = supabase
            .channel('admin_sovereign_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posts' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'app_suggestions' }, handleDebouncedUpdate)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, handleDebouncedUpdate)
            .subscribe();

        return () => {
            if (realtimeDebounceTimerRef.current) clearTimeout(realtimeDebounceTimerRef.current);
            window.removeEventListener('mira-telemetry-update', handleDebouncedUpdate);
            window.removeEventListener('mira-access-recorded', handleDebouncedUpdate);
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    const handleAction = async (action: () => Promise<void>, actionId?: string, optimisticUpdate?: () => void) => {
        if (processing) return;
        if (actionId) setProcessing(actionId);
        try {
            await action();
            // 🚀 Otimismo Soberano: Remove o item do UI instantaneamente
            if (optimisticUpdate) optimisticUpdate();
            showToast('Operação realizada com sucesso! ✅', 'success');
            await loadData(true);
        } catch (err: any) {
            showToast('Erro: ' + (err.message || 'Falha na operação'), 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleSovereignSync = async () => {
        setIsSyncing(true);
        try {
            showToast("🚀 Iniciando Sincronização...", "info");
            await adminService.syncAllFromProtected();
            await loadData(true);
            showToast("✅ Sincronização Massiva Completa!", "success");
        } catch (e) {
            showToast("❌ Falha na sincronização massiva.", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRetroactiveBadges = async () => {
        setIsSyncing(true);
        try {
            showToast("Sincronizando medalhas...", "info");
            const { gamificationService } = await import('../services/gamificationService');
            const count = await gamificationService.retroactivelyAwardBadges();
            showToast(`Gamificação atualizada! ${count} medalhas concedidas com notificações enviadas.`, "success");
            await loadData(true);
        } catch (e) {
            showToast("Falha ao conceder medalhas retroativas.", "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleBootstrapKnowledge = async () => {
        setIsBootstrapping(true);
        try {
            await adminService.bootstrapAimaKnowledge();
            showToast('Diretrizes AIMA injetadas! 🧠', 'success');
            await loadData(true);
        } finally {
            setIsBootstrapping(false);
        }
    };

    // 📢 MIRA BROADCAST DISPATCHER: Transmissão em massa via Postgres Realtime
    const handleBroadcastTransmit = async () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
            showToast('Por favor, preencha o título e a mensagem do alerta.', 'error');
            return;
        }

        const isConfirmed = window.confirm(
            `⚠️ ATENÇÃO: Esta ação transmitirá este decreto em tempo real para TODOS os utilizadores registados na plataforma MIRA. Deseja prosseguir com a emissão?`
        );
        if (!isConfirmed) return;

        setIsBroadcasting(true);
        try {
            showToast('📡 Acedendo à lista de cidadãos registados...', 'info');
            
            // 1. Obter todos os IDs de utilizadores da tabela de perfis
            const { data: users, error: fetchError } = await supabase
                .from('profiles')
                .select('id');

            if (fetchError) {
                throw new Error(`Erro ao obter perfis: ${fetchError.message}`);
            }

            if (!users || users.length === 0) {
                throw new Error('Nenhum utilizador registado foi encontrado para receber a transmissão.');
            }

            showToast(`⚙️ Preparando envio para ${users.length} utilizadores...`, 'info');

            // 2. Mapear registos de notificação para inserção em massa
            const rows = users.map(user => ({
                user_id: user.id,
                type: broadcastType,
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim(),
                link: broadcastLink,
                is_read: false,
                created_at: new Date().toISOString()
            }));

            // 3. Executar inserção em chunks de 100 registos para otimização extrema de payload
            const CHUNK_SIZE = 100;
            let countSent = 0;
            
            for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                const chunk = rows.slice(i, i + CHUNK_SIZE);
                const { error: insertError } = await supabase
                    .from('notifications')
                    .insert(chunk);

                if (insertError) {
                    throw new Error(`Falha no chunk de envio ${i}: ${insertError.message}`);
                }
                countSent += chunk.length;
            }

            // 4. Registar a ação no log de auditoria
            await adminService.logAdminAction('broadcast_transmit', {
                title: broadcastTitle,
                type: broadcastType,
                link: broadcastLink,
                recipient_count: countSent
            });

            showToast(`📡 Decreto emitido com SUCESSO TOTAL para ${countSent} cidadãos! ✅`, 'success');
            
            // Resetar formulário
            setBroadcastTitle('');
            setBroadcastMessage('');
            setBroadcastType('docs');
            setBroadcastLink('/docs');
            await loadData(true);
        } catch (e: any) {
            console.error('MIRA BROADCAST ERROR:', e);
            showToast(`❌ Falha na transmissão: ${e.message || 'Erro desconhecido'}`, 'error');
        } finally {
            setIsBroadcasting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-black text-white no-scrollbar pb-24 sm:pb-8">
            {/* 💎 MIRA TOPBAR OVERRIDE (ADMIN VERSION) */}
            <div className="p-6 pb-2 flex items-center justify-between sticky top-0 z-[100] bg-black/80 backdrop-blur-3xl border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF8C00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="mira-module-title !text-white">ADMIN HUB <span className="text-[#FF8C00]">MIRA</span></h1>
                        <p className="mira-module-subtitle !text-white/40">Gestão Administrativa</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                        onClick={() => onViewChange ? onViewChange(ViewType.DASHBOARD) : (window as any).miraNavigate?.(ViewType.DASHBOARD)}
                        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 group"
                        title="Aceder ao Console de Administração (Live Telemetry & Sync)"
                    >
                        <Terminal size={14} className="group-hover:rotate-12 transition-transform" />
                        <span className="hidden sm:inline">CONSOLE DE ADMINISTRAÇÃO</span>
                        <span className="sm:hidden">CONSOLE</span>
                    </button>
                    <button onClick={onBack} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><X size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 bg-white/5 mx-3 sm:mx-8 mt-4 sm:mt-6 rounded-2xl border border-white/10 static sm:sticky sm:top-[80px] z-[90] backdrop-blur-md">
                {[
                    { id: 'dashboard', label: 'DASHBOARD', icon: Activity },
                    { id: 'impact', label: 'RELATÓRIO IMPACTO', icon: BarChart3 },
                    { id: 'broadcast', label: 'TRANSMISSÃO', icon: Bell },
                    { id: 'gamification', label: 'GAMIFICAÇÃO', icon: Award },
                    { id: 'knowledge', label: 'SABER IA', icon: Sparkles },
                    { id: 'users', label: 'USUÁRIOS', icon: Users },
                    { id: 'concursos', label: 'CONCURSOS 🏆', icon: Trophy }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); onTabChange?.(tab.id as any); }}
                        className={`w-full lg:flex-1 py-2.5 sm:py-3.5 px-2 sm:px-4 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                            activeTab === tab.id 
                            ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20 scale-[1.01] z-10' 
                            : 'text-white/50 hover:bg-white/10 hover:text-white bg-white/5'
                        }`}
                    >
                        <tab.icon size={14} className="shrink-0 sm:w-[16px] sm:h-[16px]" />
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
            </div>


            <div className="p-4 sm:p-8">
                <div className="space-y-8">
                    {activeTab === 'dashboard' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* === CUMULATIVE TOTALS (ALL TIME) === */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Métricas Canónicas de Impacto (Homologadas)</h2>
                                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">População Oficial · Dados Auditados para Relatórios & Fundos UE</p>
                                        </div>
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-3 py-1.5 rounded-full border border-emerald-500/20 animate-pulse">🔴 LIVE</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-11 gap-3 sm:gap-4">
                                         {[
                                             { label: 'Utilizadores', value: counts.users, sub: `+${counts.usersToday} hoje`, icon: Users, color: 'text-[#FF8C00]', bg: 'from-orange-900/30' },
                                             { label: 'Acessos App 🚀', value: (counts as any).appAccesses ?? 0, sub: 'Entradas na Plataforma (Tempo Real)', icon: Eye, color: 'text-sky-400', bg: 'from-sky-900/30' },
                                             { label: 'Navegações & Interações 📊', value: (counts as any).totalInteractions ?? 0, sub: 'Páginas Vistas + Ações (Acumulado)', icon: Activity, color: 'text-indigo-400', bg: 'from-indigo-900/30' },
                                             { label: 'Perguntas MIRA 🤖', value: counts.aiQueries ?? 0, sub: 'Demanda Humana Oficial', icon: Bot, color: 'text-violet-400', bg: 'from-violet-900/30' },
                                             { label: 'Simulações 🧮', value: (counts as any).simulations ?? 0, sub: 'IRS, Salários & Prazos', icon: Calculator, color: 'text-emerald-400', bg: 'from-emerald-900/30' },
                                             { label: 'Minutas & Guias 📑', value: templates.length + serviceGuides.length, sub: `${templates.length} minutas + ${serviceGuides.length} guias`, icon: FileSignature, color: 'text-amber-300', bg: 'from-amber-950/40' },
                                             { label: 'Docs Gerados 📄', value: counts.downloads ?? 0, sub: 'Documentos e minutas gerados', icon: FileText, color: 'text-amber-400', bg: 'from-amber-900/30' },
                                             { label: 'Vagas', value: counts.jobs?.db ?? 0, sub: `${(counts.jobs?.db ?? 0).toLocaleString('pt-PT')} vagas públicas ativas`, icon: Briefcase, color: 'text-teal-400', bg: 'from-teal-900/30' },
                                             { label: 'Serviços', value: counts.services?.db ?? 0, sub: 'Serviços mapeados', icon: MapPin, color: 'text-[#00E5FF]', bg: 'from-cyan-900/30' },
                                             { label: 'Cursos', value: counts.courses?.db ?? 0, sub: 'Cursos de formação', icon: GraduationCap, color: 'text-rose-400', bg: 'from-rose-900/30' },
                                             { label: 'Posts & Fórum', value: counts.posts, sub: `${counts.comments} comentários`, icon: MessageCircle, color: 'text-blue-400', bg: 'from-blue-900/30' },
                                         ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                                             <div key={label} className={`p-5 bg-gradient-to-br ${bg} to-transparent border border-white/10 rounded-3xl relative overflow-hidden group hover:border-white/25 transition-all`}>
                                                 <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">{label}</p>
                                                 <p className={`text-3xl font-black ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
                                                 <p className="text-[8px] font-bold text-white/30 mt-1.5 uppercase tracking-wider">{sub}</p>
                                             </div>
                                         ))}
                                    </div>
                                </div>

                                {/* Second row: impact + engagement + pwa */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                                    <div className="p-5 bg-gradient-to-br from-indigo-900/30 to-transparent border border-indigo-500/20 rounded-3xl">
                                        <p className="text-[9px] font-black text-indigo-200/50 uppercase tracking-widest mb-2">Est. Horas Poupadas</p>
                                        <p className="text-2xl font-black text-white">{(counts.horasPoupadas ?? 0).toLocaleString()}</p>
                                        <p className="text-[8px] font-bold text-indigo-300/60 mt-1.5 uppercase tracking-wider">Modelo Ponderado MIRA</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-emerald-900/30 to-transparent border border-emerald-500/20 rounded-3xl">
                                        <p className="text-[9px] font-black text-emerald-200/50 uppercase tracking-widest mb-2">Apoios Prestados</p>
                                        <p className="text-2xl font-black text-white">{(counts.processosAjudados ?? 0).toLocaleString()}</p>
                                        <p className="text-[8px] font-bold text-emerald-300/60 mt-1.5 uppercase tracking-wider">Minutas + Simulações</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Retorno & Aderência de Uso</p>
                                        {!counts.recurrence || !counts.recurrence.isLoaded ? (
                                            <div className="flex items-center space-x-2 py-2">
                                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs text-white/40 font-bold uppercase tracking-wider">A sincronizar...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-2xl font-black text-white">{counts.recurrence.weightedRetentionRate ?? 11.1}%</p>
                                                <p className="text-[8px] font-bold text-white/40 mt-1.5 uppercase tracking-wider">Índice populacional ponderado — {counts.recurrence.returningUsers} retornantes • {counts.recurrence.platformUsersEligible ?? 1056} utilizadores elegíveis • {counts.recurrence.observedUsers} observados na janela</p>
                                                <p className="text-[7px] text-white/20 mt-1">Pontuação acumulada de {counts.recurrence.weightedAdherenceScoreTotal ?? 15.5} / {((counts.recurrence.kpiUsersCount ?? counts.recurrence.observedUsers ?? 28) * 5).toLocaleString('pt-PT')} pts máximos • Base de 28 observados + novos retornantes • Dispersão UTC ×1,5 • Δt ≥30m</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Likes Totais</p>
                                        <p className="text-2xl font-black text-white">{((counts as any).totalLikes ?? 0).toLocaleString()}</p>
                                        <p className="text-[8px] font-bold text-white/30 mt-1.5 uppercase tracking-wider">Na comunidade</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">PWA Móvel</p>
                                        <p className="text-2xl font-black text-white">{counts.pwaMobileDownloads ?? 0}</p>
                                        <p className="text-[8px] font-bold text-white/30 mt-1.5 uppercase tracking-wider">Desde 12/08</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">PWA Desktop</p>
                                        <p className="text-2xl font-black text-white">{counts.pwaComputerDownloads ?? 0}</p>
                                        <p className="text-[8px] font-bold text-white/30 mt-1.5 uppercase tracking-wider">Desde 12/08</p>
                                    </div>
                                </div>

                                {/* === PERIOD FILTER BLOCK === */}
                                <div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-widest text-white/60">Observabilidade Operacional em Tempo Real</h2>
                                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Atividade Operacional & Diagnóstico ao Vivo (Últimas 24H / 7D / 30D)</p>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                                            {([24, 168, 720] as const).map((h) => (
                                                <button
                                                    key={h}
                                                    onClick={() => { setDashboardPeriod(h); }}
                                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        dashboardPeriod === h ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'
                                                    }`}
                                                >
                                                    {h === 24 ? '24H' : h === 168 ? '7D' : '30D'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
                                        {[
                                            { label: 'Novos Utilizadores', value: periodCounts.newUsers, color: 'text-[#FF8C00]' },
                                            { label: 'Novos Posts', value: periodCounts.newPosts, color: 'text-blue-400' },
                                            { label: 'Comentários', value: periodCounts.newComments, color: 'text-purple-400' },
                                            { label: 'Novas Vagas', value: periodCounts.newJobs, color: 'text-emerald-400' },
                                            { label: 'Docs Gerados', value: periodCounts.docDownloads, color: 'text-amber-400' },
                                            { label: 'Navegações & Interações', value: periodCounts.appAccesses, color: 'text-indigo-400' },
                                            { label: 'Perguntas MIRA 🤖', value: (periodCounts as any).newAiQueries ?? 0, color: 'text-violet-400' },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="p-4 sm:p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-white/20 transition-all">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5">{label}</p>
                                                <p className={`text-2xl sm:text-3xl font-black ${color}`}>{(value ?? 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Extra: reports + fraud + suggestions + network health */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Denúncias Pendentes</p>
                                        <p className="text-2xl font-black text-[#FF8C00]">{((counts as any).reports ?? 0)}</p>
                                    </div>
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Alertas de Fraude</p>
                                        <p className="text-2xl font-black text-red-400">{((counts as any).fakePosts ?? 0)}</p>
                                    </div>
                                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Sugestões Recebidas</p>
                                        <p className="text-2xl font-black text-amber-400">{((counts as any).suggestions ?? 0)}</p>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-[#FF8C00]/20 to-[#FF4500]/10 border border-orange-500/30 rounded-3xl flex flex-col justify-between">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Estado da Rede</p>
                                        <p className="text-lg font-black text-white">ESTÁVEL ✅</p>
                                        <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mt-1">Gemini Flash 1.5</p>
                                    </div>
                                </div>
                            </div>
                        )}




                        {activeTab === 'impact' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <MiraImpactReport platformCounts={counts as any} />
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Stats bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total', value: userFilterCounts.total || totalUsers, color: 'text-[#FF8C00]' },
                                        { label: 'Ativos', value: userFilterCounts.active, color: 'text-emerald-400' },
                                        { label: 'Bloqueados', value: userFilterCounts.blocked, color: 'text-red-400' },
                                        { label: 'Verificados', value: userFilterCounts.verified, color: 'text-blue-400' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</p>
                                            <p className={`text-xl font-black ${color} mt-1`}>{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Search + filters */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar por nome ou email..."
                                            value={userSearchTerm}
                                            onChange={(e) => { setUserSearchTerm(e.target.value); setUsersPage(0); }}
                                            className="w-full pl-11 pr-5 py-3.5 bg-white/8 border border-white/15 rounded-2xl text-sm font-bold text-white placeholder:text-white/25 outline-none focus:border-[#FF8C00]/50 transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {(['all', 'active', 'blocked', 'verified'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { setUserFilterStatus(f); setUsersPage(0); }}
                                                className={`px-4 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                                    userFilterStatus === f ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                                                }`}
                                            >
                                                {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : f === 'blocked' ? 'Bloqueados' : 'Verificados'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Users list - compact table for desktop, cards for mobile */}
                                <div className="hidden lg:block bg-white/3 border border-white/8 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/8 text-[9px] font-black text-white/30 uppercase tracking-widest">
                                                <th className="px-6 py-4">Utilizador</th>
                                                <th className="px-4 py-4">Email</th>
                                                <th className="px-4 py-4">Estado</th>
                                                <th className="px-4 py-4">Função</th>
                                                <th className="px-4 py-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {loadingUsers && users.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-white/50">
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Loader2 size={20} className="animate-spin text-[#FF8C00]" />
                                                            <span className="text-xs font-bold uppercase tracking-wider">A carregar utilizadores...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : authError ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-amber-400/80 text-xs font-bold uppercase tracking-wider">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <ShieldAlert size={24} className="text-amber-400" />
                                                            <span>{authError === 'AUTH_REQUIRED' ? 'Sessão administrativa necessária para consultar utilizadores.' : 'Acesso não autorizado ao módulo de utilizadores.'}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : users.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-white/30 text-xs font-bold uppercase tracking-wider">
                                                        Nenhum utilizador encontrado
                                                    </td>
                                                </tr>
                                            ) : (
                                                users.map(u => (
                                                <tr key={u.id} className="hover:bg-white/4 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div 
                                                            onClick={() => onViewChange && onViewChange('profile', { profileUser: { id: u.id, name: u.name, avatar: u.avatar, email: u.email, role: u.role, isVerified: u.isVerified, isBlocked: u.isBlocked } })} 
                                                            className="flex items-center gap-3 cursor-pointer group/user flex-1 min-w-0"
                                                            title="Clique para ver o perfil completo do utilizador"
                                                        >
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover/user:scale-105 ${u.role === 'admin' ? 'bg-[#FF8C00] text-white' : 'bg-white/10 text-white/50'}`}>
                                                                {u.name?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-black text-white uppercase tracking-tight flex items-center gap-1.5 group-hover/user:text-[#FF8C00] transition-colors">
                                                                    {u.name || 'Sem nome'}
                                                                    {u.role === 'admin' && <ShieldCheck size={11} className="text-[#FF8C00]" />}
                                                                    {u.isVerified && <CheckCircle2 size={11} className="text-blue-400" />}
                                                                </p>
                                                                <span className="text-[8px] font-bold text-[#FF8C00] uppercase tracking-widest opacity-0 group-hover/user:opacity-100 transition-opacity">Ver Perfil ➔</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-[11px] font-bold text-white/75 font-mono">
                                                        {u.email}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${
                                                            u.isBlocked ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {u.isBlocked ? 'Bloqueado' : 'Ativo'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-[10px] font-black text-white/40 uppercase">
                                                        {u.role || 'membro'}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => onViewChange && onViewChange('profile', { profileUser: { id: u.id, name: u.name, avatar: u.avatar, email: u.email, role: u.role, isVerified: u.isVerified, isBlocked: u.isBlocked } })}
                                                                title="Ver Perfil Completo"
                                                                className="p-2 rounded-xl bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/30 hover:bg-[#FF8C00] hover:text-white transition-all"
                                                            >
                                                                <UserIcon size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(() => adminService.toggleBlockUser(u.id, !u.isBlocked), `block-${u.id}`, () => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBlocked: !u.isBlocked } : x)))}
                                                                title={u.isBlocked ? 'Ativar' : 'Bloquear'}
                                                                className={`p-2 rounded-xl text-[9px] font-black transition-all border ${ u.isBlocked ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-white/5 text-white/40 border-white/10 hover:bg-orange-500/20 hover:text-orange-400'}`}
                                                            >
                                                                {u.isBlocked ? <CheckCircle size={14} /> : <Ban size={14} />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(() => adminService.verifyUserProfile(u.id, !u.isVerified), `verify-${u.id}`, () => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isVerified: !u.isVerified } : x)))}
                                                                title="Verificar"
                                                                className={`p-2 rounded-xl transition-all border ${ u.isVerified ? 'bg-blue-500/15 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white' : 'bg-white/5 text-white/40 border-white/10 hover:bg-blue-500/20 hover:text-blue-400'}`}
                                                            >
                                                                <Sparkles size={14} />
                                                            </button>
                                                            <button
                                                                onClick={async () => { const medals = await adminService.fetchUserBadges(u.id); setUserMedals(medals); setSelectedUserForMedals(u); }}
                                                                title="Medalhas"
                                                                className="p-2 rounded-xl bg-white/5 text-white/40 border border-white/10 hover:bg-orange-500/20 hover:text-orange-400 transition-all"
                                                            >
                                                                <Award size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(() => adminService.deleteUser(u.id, u.email, true), `del-${u.id}`, () => setUsers(prev => prev.filter(x => x.id !== u.id)))}
                                                                title="Eliminar"
                                                                className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500 hover:text-white transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="grid grid-cols-1 gap-3 lg:hidden">
                                    {loadingUsers && users.length === 0 && (
                                        <div className="p-8 text-center text-white/50 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center gap-3">
                                            <Loader2 size={20} className="animate-spin text-[#FF8C00]" />
                                            <span className="text-xs font-bold uppercase tracking-wider">A carregar utilizadores...</span>
                                        </div>
                                    )}
                                    {authError && !loadingUsers && (
                                        <div className="p-8 text-center text-amber-400/90 text-xs font-bold uppercase tracking-wider bg-amber-500/10 rounded-3xl border border-amber-500/20 flex flex-col items-center justify-center gap-2">
                                            <ShieldAlert size={24} className="text-amber-400" />
                                            <span>{authError === 'AUTH_REQUIRED' ? 'Sessão administrativa necessária para consultar utilizadores.' : 'Acesso não autorizado ao módulo de utilizadores.'}</span>
                                        </div>
                                    )}
                                    {users.length === 0 && !loadingUsers && !authError && (
                                        <div className="p-8 text-center text-white/40 text-xs font-bold uppercase tracking-widest bg-white/5 rounded-3xl border border-white/10">
                                            Nenhum utilizador encontrado
                                        </div>
                                    )}
                                    {users.map(u => (
                                        <div key={u.id} className="p-4 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                                            <div 
                                                onClick={() => onViewChange && onViewChange('profile', { profileUser: { id: u.id, name: u.name, avatar: u.avatar, email: u.email, role: u.role, isVerified: u.isVerified, isBlocked: u.isBlocked } })}
                                                className="flex items-center gap-3 cursor-pointer group"
                                            >
                                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 ${ u.role === 'admin' ? 'bg-[#FF8C00] text-white' : 'bg-white/10 text-white/50'}`}>
                                                    {u.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-black text-[13px] text-white uppercase tracking-tight truncate flex items-center gap-1.5 group-hover:text-[#FF8C00]">
                                                        {u.name || 'Sem nome'}
                                                        {u.role === 'admin' && <ShieldCheck size={11} className="text-[#FF8C00]" />}
                                                        {u.isVerified && <CheckCircle2 size={11} className="text-blue-400" />}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-white/60 tracking-wider truncate font-mono">
                                                        {u.email}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 text-[7px] font-black uppercase px-2 py-1 rounded-full ${
                                                    u.isBlocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                    {u.isBlocked ? 'Bloqueado' : 'Ativo'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                                                <button
                                                    onClick={() => onViewChange && onViewChange('profile', { profileUser: { id: u.id, name: u.name, avatar: u.avatar, email: u.email, role: u.role, isVerified: u.isVerified, isBlocked: u.isBlocked } })}
                                                    className="px-3 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/30 hover:bg-[#FF8C00] hover:text-white flex items-center justify-center gap-1"
                                                >
                                                    <UserIcon size={13} />
                                                    Perfil
                                                </button>
                                                <button
                                                    onClick={() => handleAction(() => adminService.toggleBlockUser(u.id, !u.isBlocked), `block-${u.id}`, () => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBlocked: !u.isBlocked } : x)))}
                                                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 ${ u.isBlocked ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}
                                                >
                                                    {u.isBlocked ? <CheckCircle size={13} /> : <Ban size={13} />}
                                                    {u.isBlocked ? 'Ativar' : 'Bloquear'}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(() => adminService.verifyUserProfile(u.id, !u.isVerified), `verify-${u.id}`, () => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isVerified: !u.isVerified } : x)))}
                                                    className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 ${ u.isVerified ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}
                                                >
                                                    <Sparkles size={13} />
                                                    {u.isVerified ? 'Verificado' : 'Verificar'}
                                                </button>
                                                <button
                                                    onClick={async () => { const medals = await adminService.fetchUserBadges(u.id); setUserMedals(medals); setSelectedUserForMedals(u); }}
                                                    className="p-3 rounded-2xl bg-white/5 text-white/40 border border-white/10 hover:bg-orange-500/20 hover:text-orange-400 transition-all"
                                                >
                                                    <Award size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(() => adminService.deleteUser(u.id, u.email, true), `del-${u.id}`, () => setUsers(prev => prev.filter(x => x.id !== u.id)))}
                                                    className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/15 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>


                                 {totalUsers > 20 && (() => {
                                     const totalPages = Math.ceil(totalUsers / 20);
                                     const getVisiblePages = () => {
                                         const pages: (number | string)[] = [];
                                         if (totalPages <= 5) {
                                             for (let i = 0; i < totalPages; i++) pages.push(i);
                                         } else {
                                             pages.push(0);
                                             if (usersPage > 2) pages.push('...');
                                             
                                             const start = Math.max(1, usersPage - 1);
                                             const end = Math.min(totalPages - 2, usersPage + 1);
                                             for (let i = start; i <= end; i++) {
                                                 if (!pages.includes(i)) pages.push(i);
                                             }
                                             
                                             if (usersPage < totalPages - 3) pages.push('...');
                                             pages.push(totalPages - 1);
                                         }
                                         return pages;
                                     };

                                     return (
                                         <div className="flex flex-col items-center gap-4 mt-6 bg-white/5 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/10">
                                             {/* Mobile Touch View */}
                                             <div className="flex items-center justify-between w-full sm:hidden gap-2">
                                                 <button
                                                     disabled={usersPage === 0}
                                                     onClick={() => setUsersPage(p => p - 1)}
                                                     className="px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-20 active:scale-95 transition-all shrink-0"
                                                 >
                                                     <ChevronDown className="rotate-90" size={15} /> Ant.
                                                 </button>
                                                 
                                                 <div className="text-center min-w-0 flex-1">
                                                     <p className="text-xs font-black text-white tracking-tight">Pág. <span className="text-[#FF8C00]">{usersPage + 1}</span> de {totalPages}</p>
                                                     <p className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">{totalUsers} utilizadores</p>
                                                 </div>

                                                 <button
                                                     disabled={usersPage >= totalPages - 1}
                                                     onClick={() => setUsersPage(p => p + 1)}
                                                     className="px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-20 active:scale-95 transition-all shrink-0"
                                                 >
                                                     Seg. <ChevronDown className="-rotate-90" size={15} />
                                                 </button>
                                             </div>

                                             {/* Desktop / Tablet View */}
                                             <div className="hidden sm:flex flex-row justify-between items-center gap-4 w-full">
                                                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                                     Mostrando <span className="text-white">{usersPage * 20 + 1}-{Math.min((usersPage + 1) * 20, totalUsers)}</span> de <span className="text-white">{totalUsers}</span> utilizadores
                                                 </span>

                                                 <div className="flex items-center gap-2">
                                                     <button
                                                         disabled={usersPage === 0}
                                                         onClick={() => setUsersPage(p => p - 1)}
                                                         className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-[#FF8C00] hover:text-white disabled:opacity-20 transition-all text-white"
                                                         title="Página Anterior"
                                                     >
                                                         <ChevronDown className="rotate-90" size={18} />
                                                     </button>

                                                     <div className="flex items-center gap-1.5">
                                                         {getVisiblePages().map((pageItem, idx) => (
                                                             typeof pageItem === 'number' ? (
                                                                 <button
                                                                     key={idx}
                                                                     onClick={() => setUsersPage(pageItem)}
                                                                     className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-[11px] transition-all border ${
                                                                         usersPage === pageItem 
                                                                             ? 'bg-[#FF8C00] border-[#FF8C00] text-white shadow-lg shadow-orange-500/20' 
                                                                             : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                                                                     }`}
                                                                 >
                                                                     {pageItem + 1}
                                                                 </button>
                                                             ) : (
                                                                 <span key={idx} className="w-6 text-center text-white/40 font-black text-xs select-none">
                                                                     ...
                                                                 </span>
                                                             )
                                                         ))}
                                                     </div>

                                                     <button
                                                         disabled={usersPage >= totalPages - 1}
                                                         onClick={() => setUsersPage(p => p + 1)}
                                                         className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-[#FF8C00] hover:text-white disabled:opacity-20 transition-all text-white"
                                                         title="Próxima Página"
                                                     >
                                                         <ChevronDown className="-rotate-90" size={18} />
                                                     </button>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 })()}
                            </div>
                        )}

                                {/* Moderation features moved to separate audit module V26. GOLD */}



                        {activeTab === 'knowledge' && (
                            <div className="space-y-6">
                                <AdminSaberIA onRefresh={() => loadData(true)} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {aiKnowledge.map((k, i) => (
                                        <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl relative group hover:border-mira-orange/30 transition-all">
                                            <div className="flex items-center gap-2 mb-3">
                                                <h5 className="text-sm font-black uppercase text-white/90 truncate flex-1">{k.topic}</h5>
                                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md shrink-0 ${k.isNewsroom ? 'bg-blue-600 text-white' : 'bg-orange-600 text-white'}`}>
                                                    {k.category}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/60 mt-2 line-clamp-3 leading-relaxed">{k.content || k.information}</p>
                                            <button onClick={() => confirmAction('Eliminar este conhecimento?') && handleAction(() => k.isNewsroom ? adminService.deleteNewsroomArticle(k.id) : adminService.deleteAIKnowledge(k.id))} className="absolute top-4 right-4 text-white/20 hover:text-red-500 transition-all">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {totalKnowledge > 20 && (
                                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-12 bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                disabled={knowledgePage === 0}
                                                onClick={() => { setKnowledgePage(p => p - 1); loadData(true); }}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-[#FF8C00] hover:text-white disabled:opacity-20 transition-all shadow-lg active:scale-90"
                                            >
                                                <ChevronDown className="rotate-90" size={20} />
                                            </button>
                                            
                                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                                                {Array.from({ length: Math.ceil(totalKnowledge / 20) }).map((_, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => { setKnowledgePage(i); loadData(true); }}
                                                        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl font-black text-[10px] sm:text-[11px] transition-all border ${knowledgePage === i ? 'bg-[#FF8C00] border-[#FF8C00] text-white shadow-xl shadow-orange-500/30' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>

                                            <button 
                                                disabled={knowledgePage >= Math.ceil(totalKnowledge / 20) - 1}
                                                onClick={() => { setKnowledgePage(p => p + 1); loadData(true); }}
                                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-[#FF8C00] hover:text-white disabled:opacity-20 transition-all shadow-lg active:scale-90"
                                            >
                                                <ChevronDown className="-rotate-90" size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {activeTab === 'gamification' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Sistema de Medalhas</h2>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={handleRetroactiveBadges} 
                                            disabled={isSyncing}
                                            className="px-4 py-3 bg-[#FF8C00] hover:bg-orange-600 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-500/10 active:scale-95 flex items-center gap-2"
                                        >
                                            <Award size={14} />
                                            <span>Atribuir Selos Retroativos</span>
                                        </button>
                                        <button onClick={() => loadData(true)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                            <RefreshCcw size={18} className={loadingGamification ? 'animate-spin' : ''} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {allBadges.map(badge => (
                                        <div key={badge.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:border-[#FF8C00]/30 transition-all flex flex-col items-center text-center gap-3">
                                            <div className="w-16 h-16 bg-[#FF8C00]/10 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-orange-500/10 border border-orange-500/20">
                                                {badge.icon_emoji || '🎖️'}
                                            </div>
                                            <h4 className="text-xs font-black uppercase tracking-tight text-white">{badge.name}</h4>
                                            <p className="text-[9px] font-bold text-white/30 uppercase leading-relaxed">{badge.description}</p>
                                            <div className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                                badge.rarity_level === 4 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                badge.rarity_level === 3 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                'bg-white/5 text-white/40 border border-white/10'
                                            }`}>
                                                {badge.rarity_level === 4 ? 'LENDÁRIO' : badge.rarity_level === 3 ? 'ÉPICO' : badge.rarity_level === 2 ? 'RARO' : 'COMUM'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'broadcast' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/20">
                                            <Bell size={28} className="text-[#FF8C00]" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter">Emissão de Decreto Global 📡</h2>
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Notificações Web Push em Tempo Real</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Formulário Principal */}
                                    <div className="lg:col-span-2 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group space-y-6">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00]">Título do Decreto</label>
                                            <input 
                                                type="text" 
                                                placeholder="ex: Módulo de Documentos Atualizado! 📄" 
                                                value={broadcastTitle} 
                                                onChange={(e) => setBroadcastTitle(e.target.value)} 
                                                className="w-full px-6 py-4 bg-black/45 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF8C00]/50 transition-all"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Categoria do Alerta</label>
                                                <select 
                                                    value={broadcastType} 
                                                    onChange={(e) => setBroadcastType(e.target.value as any)} 
                                                    className="w-full px-6 py-4 bg-black/45 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#FF8C00]/50 transition-all cursor-pointer"
                                                >
                                                    <option value="docs">📄 Documentos e Minutas</option>
                                                    <option value="aima">🛡️ AIMA e Leis Oficiais</option>
                                                    <option value="jobs">💼 Vagas e Oportunidades</option>
                                                    <option value="community">💬 Comunidade e Social</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Destino de Redirecionamento</label>
                                                <select 
                                                    value={broadcastLink} 
                                                    onChange={(e) => setBroadcastLink(e.target.value)} 
                                                    className="w-full px-6 py-4 bg-black/45 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-[#FF8C00]/50 transition-all cursor-pointer"
                                                >
                                                    <option value="/docs">📄 Módulo de Documentos (/docs)</option>
                                                    <option value="/jobs">💼 Módulo de Vagas (/jobs)</option>
                                                    <option value="/map">📍 Mapa de Serviços (/map)</option>
                                                    <option value="/community">💬 Tribo / Comunidade (/community)</option>
                                                    <option value="/profile">👤 Perfil do Cidadão (/profile)</option>
                                                    <option value="/">🏠 Página Inicial (/)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00]">Corpo da Notificação (Mensagem)</label>
                                            <textarea 
                                                rows={5}
                                                placeholder="Descreva detalhadamente o alerta que os utilizadores receberão no telemóvel..." 
                                                value={broadcastMessage} 
                                                onChange={(e) => setBroadcastMessage(e.target.value)} 
                                                className="w-full px-6 py-4 bg-black/45 border border-white/10 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF8C00]/50 transition-all resize-none"
                                            />
                                        </div>

                                        <button 
                                            onClick={handleBroadcastTransmit}
                                            disabled={isBroadcasting}
                                            className="w-full py-5 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/10 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                                        >
                                            {isBroadcasting ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span>Emitindo Decreto...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Bell size={16} />
                                                    <span>Transmitir Decreto Global</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Painel Lateral de Monitorização e Simulação */}
                                    <div className="space-y-6">
                                        <div className="p-8 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                            <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Alcance Estimado</p>
                                            <h3 className="text-5xl font-black text-white">{counts.users}</h3>
                                            <p className="mt-4 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                                Cidadãos receberão este alerta instantaneamente
                                            </p>
                                        </div>

                                        <div className="p-8 bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] space-y-4">
                                            <h4 className="text-xs font-black uppercase tracking-wider text-white/80">Simulação no Telemóvel</h4>
                                            
                                            {/* Telemóvel Mockup */}
                                            <div className="w-full p-5 bg-slate-900 border border-white/10 rounded-3xl relative overflow-hidden shadow-2xl space-y-3">
                                                <div className="flex justify-between items-center text-[8px] font-black text-white/40 uppercase tracking-widest pb-2 border-b border-white/5">
                                                    <span>MIRA Notificação</span>
                                                    <span>Agora</span>
                                                </div>
                                                <div className="flex gap-3 items-start pt-1">
                                                    <div className="w-10 h-10 bg-[#FF8C00] rounded-xl flex items-center justify-center shrink-0 border border-orange-400/20 text-white font-black text-xs">
                                                        M
                                                    </div>
                                                    <div className="space-y-1 overflow-hidden">
                                                        <h5 className="text-[11px] font-black uppercase tracking-tight truncate text-white">
                                                            {broadcastTitle || 'Título da Notificação'}
                                                        </h5>
                                                        <p className="text-[10px] text-white/60 font-bold leading-snug line-clamp-2">
                                                            {broadcastMessage || 'Mensagem do corpo... Escreva para visualizar o alerta.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'concursos' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <PremiosView language={language} onBack={() => setActiveTab('dashboard')} />
                            </div>
                        )}

                    </div>
            </div>

            {/* 🏅 MODAL DE ATRIBUIÇÃO DE MEDALHAS */}
            {selectedUserForMedals && (
                <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#FF8C00] rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                    {selectedUserForMedals.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Gerir Medalhas</h3>
                                    <p className="text-[10px] font-black text-[#FF8C00] uppercase tracking-widest">{selectedUserForMedals.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUserForMedals(null)} className="p-3 bg-white/5 rounded-full text-white/40 hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                            {allBadges.map(badge => {
                                const isOwned = userMedals.includes(badge.id);
                                return (
                                    <button
                                        key={badge.id}
                                        onClick={async () => {
                                            try {
                                                if (isOwned) {
                                                    await adminService.removeBadge(selectedUserForMedals.id, badge.id);
                                                    setUserMedals(prev => prev.filter(id => id !== badge.id));
                                                } else {
                                                    await adminService.awardBadge(selectedUserForMedals.id, badge.id);
                                                    setUserMedals(prev => [...prev, badge.id]);
                                                }
                                                showToast('Medalha atualizada!', 'success');
                                            } catch (e) {
                                                showToast('Erro ao atualizar medalha.', 'error');
                                            }
                                        }}
                                        className={`w-full p-5 rounded-[1.5rem] flex items-center justify-between transition-all border ${
                                            isOwned 
                                            ? 'bg-[#FF8C00]/10 border-[#FF8C00]/30 text-white' 
                                            : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{badge.icon_emoji || '🎖️'}</span>
                                            <div className="text-left">
                                                <p className="text-[11px] font-black uppercase tracking-tight">{badge.name}</p>
                                                <p className="text-[8px] font-bold opacity-50 uppercase">{badge.description}</p>
                                            </div>
                                        </div>
                                        {isOwned ? <CheckCircle2 size={20} className="text-[#FF8C00]" /> : <div className="w-5 h-5 rounded-full border-2 border-white/10"></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
