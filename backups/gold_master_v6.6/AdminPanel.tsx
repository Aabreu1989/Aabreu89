import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { User, Post } from '../types';
import {
    ShieldCheck, Users, ShieldAlert, Trash2, Ban,
    Search, CheckCircle2, RefreshCcw, Database, 
    Activity, ChevronDown, Loader2, GraduationCap, MapPin,
    User as UserIcon, CheckCircle, Bot, Star, X, MessageCircle, AlertCircle, Briefcase, ChevronRight, MailX, Sparkles, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface AdminPanelProps {
    onBack: () => void;
    onNavigateToPost?: (postId: string, commentId?: string) => void;
    onNavigateToService?: (serviceId: string) => void;
    language: string;
    onUpdatePosts?: React.Dispatch<React.SetStateAction<Post[]>>;
    onEarnPoints?: (amount: number) => void;
    initialTab?: 'dashboard' | 'users' | 'moderation' | 'suggestions' | 'knowledge';
    onTabChange?: (tab: 'dashboard' | 'users' | 'moderation' | 'suggestions' | 'knowledge') => void;
    isSuperAdmin?: boolean;
    onLogout?: () => void;
}

const confirmAction = (msg: string) => {
    if (typeof window !== 'undefined' && localStorage.getItem('mira_bypass_confirm') === 'true') return true;
    return window.confirm(msg);
};

const UserCard = React.memo(({ user, isAdmin, onToggleBlock, onDelete, isDark }: { user: User, isAdmin: boolean, onToggleBlock: () => void, onDelete: () => void, isDark: boolean }) => (
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
                    </div>
                    {/* 🕵️ PROTOCOLO AMANDA: Email sempre visível para moderação */}
                    <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest truncate ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{user.email}</p>
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
    isSuperAdmin
}) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'moderation' | 'suggestions' | 'knowledge'>(initialTab as any || 'dashboard');
    
    useEffect(() => {
        if (initialTab && initialTab !== activeTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const [users, setUsers] = useState<User[]>([]);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [communityReports, setCommunityReports] = useState<any[]>([]);
    const [aiKnowledge, setAIKnowledge] = useState<any[]>([]);
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<{
        courses: { db: number; prot: number };
        services: { db: number; prot: number };
        users: number;
        jobs: { db: number; prot: number };
        reports: number;
    }>({ 
        courses: { db: 0, prot: 0 }, 
        services: { db: 0, prot: 0 }, 
        users: 0, 
        jobs: { db: 0, prot: 0 }, 
        reports: 0
    });
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [knowledgeSearch, setKnowledgeSearch] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isBootstrapping, setIsBootstrapping] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [deniedEmails, setDeniedEmails] = useState<string[]>([]);
    const [newKnowledge, setNewKnowledge] = useState({ topic: '', information: '', category: 'AIMA imigração', url: '' });
    const [dataCache, setDataCache] = useState<Record<string, { timestamp: number, data: any }>>({});
    const [usersPage, setUsersPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [knowledgePage, setKnowledgePage] = useState(0);
    const [totalKnowledge, setTotalKnowledge] = useState(0);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [schemaHealth, setSchemaHealth] = useState<Record<string, boolean>>({});
    const { showToast } = useToast();

    useEffect(() => {
        loadData(true);
        const interval = setInterval(() => loadData(false), 30000);
        return () => clearInterval(interval);
    }, [activeTab, usersPage]);

    const loadData = async (force = false) => {
        const now = Date.now();
        const cached = dataCache[activeTab];
        const threshold = document.visibilityState === 'visible' ? 30000 : 180000;
        
        if (!force && cached && (now - cached.timestamp < threshold)) {
            return;
        }

        setLoading(true);
        try {
            const tasks = [];
            
            // Dashboard counts
            tasks.push(adminService.fetchSyncStatus().then(status => {
                if (status) {
                    const newCounts = { 
                        courses: status.courses || { db: 0, prot: 0 }, 
                        services: status.services || { db: 0, prot: 0 }, 
                        users: status.users || 0, 
                        jobs: status.jobs || { db: 0, prot: 0 },
                        reports: status.reports || 0
                    };
                    setCounts(newCounts);
                    setDataCache(prev => ({ ...prev, dashboard: { timestamp: now, data: newCounts } }));
                }
            }));

            if (activeTab === 'dashboard') {
                tasks.push(adminService.fetchUsers(0, 5).then(res => setUsers(res.users || [])));
                tasks.push(adminService.fetchAIKnowledge(undefined, true).then(kb => setAIKnowledge(kb.slice(0, 5))));
            }
            
            if (activeTab === 'users') {
                tasks.push(adminService.fetchUsers(usersPage, 20).then(result => {
                    setUsers(result.users || []);
                    setTotalUsers(result.total || 0);
                }));
                tasks.push(adminService.fetchDeniedEmails().then(dData => setDeniedEmails(dData || [])));
            } else if (activeTab === 'moderation') {
                tasks.push(adminService.fetchCommunityReports().then(reports => setCommunityReports(reports || [])));
            } else if (activeTab === 'suggestions') {
                tasks.push(adminService.fetchSuggestions().then(suggestions => setSuggestions(suggestions || [])));
            } else if (activeTab === 'knowledge') {
                const kbRes = await adminService.fetchAIKnowledgePaginated(knowledgePage, 20).catch(() => ({ total: 0, items: [] }));
                setAIKnowledge(kbRes.items || []);
                setTotalKnowledge(kbRes.total || 0);
            }

            if (force) {
                // Health check
                const tables = ['profiles', 'reports', 'community_reports', 'saber_ia', 'knowledge_base', 'suggestions'];
                const health: Record<string, boolean> = {};
                await Promise.all(tables.map(async (t) => {
                    const { error } = await supabase.from(t).select('id').limit(1);
                    health[t] = !error;
                }));
                setSchemaHealth(health);
                
                const { data: { user } } = await supabase.auth.getUser();
                setDebugInfo({ email: user?.email, role: user?.email === 'amandasabreu89@gmail.com' ? 'admin' : 'member', health });
            }

            await Promise.allSettled(tasks);
        } catch (e) {
            console.error("MIRA Admin Hub Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: () => Promise<void>, actionId?: string) => {
        if (processing) return;
        if (actionId) setProcessing(actionId);
        try {
            await action();
            showToast('Operação realizada com sucesso! ✅', 'success');
            await loadData(true);
        } catch (err: any) {
            showToast('Erro: ' + (err.message || 'Falha na operação'), 'error');
        } finally {
            setProcessing(null);
        }
    };

    const handleSyncAll = async () => {
        setIsSyncing(true);
        try {
            await adminService.syncAll();
            showToast('Sincronização global concluída!', 'success');
            await loadData(true);
        } catch (err) {
            showToast('Erro na sincronização', 'error');
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

    const handleAddKnowledge = async () => {
        if (!newKnowledge.topic || !newKnowledge.information) return;
        setProcessing('knowledge_inject');
        try {
            await adminService.addAIKnowledge(newKnowledge);
            setNewKnowledge({ topic: '', information: '', category: 'AIMA imigração', url: '' });
            showToast('💡 Conhecimento injetado!', 'success');
            await loadData(true);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-black text-white no-scrollbar">
            {/* 💎 MIRA TOPBAR OVERRIDE (ADMIN VERSION) */}
            <div className="p-6 pb-2 flex items-center justify-between sticky top-0 z-[100] bg-black/80 backdrop-blur-3xl border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#FF8C00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tighter">ADMIN HUB <span className="text-[#FF8C00]">MIRA</span></h1>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Controle Soberano V2026</p>
                    </div>
                </div>
                <button onClick={onBack} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><X size={20}/></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-2 p-2 sm:p-4 bg-white/5 mx-4 sm:mx-8 mt-4 sm:mt-6 rounded-2xl border border-white/10 sticky top-[80px] z-[90] backdrop-blur-md">
                {[
                    { id: 'dashboard', label: 'DASHBOARD', icon: Activity },
                    { id: 'knowledge', label: 'SABER IA', icon: Sparkles },
                    { id: 'users', label: 'USUÁRIOS', icon: Users },
                    { id: 'moderation', label: 'DENÚNCIAS', icon: ShieldAlert },
                    { id: 'suggestions', label: 'SUGESTÕES', icon: MessageCircle }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); onTabChange?.(tab.id as any); }}
                        className={`flex-1 min-w-[120px] p-4 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-[#FF8C00] text-white shadow-xl shadow-orange-500/20 scale-[1.02] z-10' : 'text-white/40 hover:bg-white/10 hover:text-white'}`}
                    >
                        <tab.icon size={16} className="shrink-0" /> <span className="whitespace-nowrap">{tab.label}</span>
                        {tab.id === 'moderation' && communityReports.length > 0 && (
                            <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">{communityReports.length}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="p-4 sm:p-8">
                {loading ? (
                    <div className="flex justify-center p-20"><Loader2 className="animate-spin" size={40} /></div>
                ) : (
                    <div className="space-y-8">
                        {activeTab === 'dashboard' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* GARGALO RESOLVIDO: Dashboards estatísticos restaurados */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    <div className="p-8 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-[#FF8C00]/50 transition-all">
                                        <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-orange-500/10 transition-colors" />
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Utilizadores Totais</p>
                                        <h3 className="text-4xl font-black text-white">{counts.users}</h3>
                                        <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-[#FF8C00] uppercase tracking-widest">
                                            <Activity size={10} /> Sincronizado agora
                                        </div>
                                    </div>
                                    <div className="p-8 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
                                        <GraduationCap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-blue-500/10 transition-colors" />
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Cursos Academy</p>
                                        <h3 className="text-4xl font-black text-white">{counts.courses.db}</h3>
                                        <p className="mt-4 text-[8px] font-black text-blue-400 uppercase tracking-widest">{counts.courses.prot} Verificados</p>
                                    </div>
                                    <div className="p-8 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                                        <Briefcase className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-emerald-500/10 transition-colors" />
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Vagas Ativas</p>
                                        <h3 className="text-4xl font-black text-white">{counts.jobs.db}</h3>
                                        <p className="mt-4 text-[8px] font-black text-emerald-400 uppercase tracking-widest">Triagem em Tempo Real</p>
                                    </div>
                                    <div className="p-8 bg-gradient-to-br from-white/10 to-transparent border border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
                                        <MapPin className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:text-purple-500/10 transition-colors" />
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Serviços Locais</p>
                                        <h3 className="text-4xl font-black text-white">{counts.services.db}</h3>
                                        <p className="mt-4 text-[8px] font-black text-purple-400 uppercase tracking-widest">{counts.services.prot} Mapeados</p>
                                    </div>
                                    <div className="p-8 bg-white text-black rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                        <ShieldAlert className="absolute -right-4 -top-4 w-24 h-24 text-black/5" />
                                        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-4">Denúncias Pendentes</p>
                                        <h3 className="text-4xl font-black">{counts.reports}</h3>
                                        <button onClick={() => setActiveTab('moderation')} className="mt-4 flex items-center gap-2 text-[8px] font-black bg-black text-white px-3 py-2 rounded-full uppercase tracking-widest hover:scale-105 transition-all">
                                            Moderar Tudo <ChevronRight size={10} />
                                        </button>
                                    </div>
                                </div>

                                {/* Quick Actions Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                                    <button onClick={handleSyncAll} disabled={isSyncing} className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-left hover:bg-white/10 transition-all group overflow-hidden relative">
                                        {isSyncing && <Loader2 className="absolute right-8 top-8 animate-spin text-[#FF8C00]" size={24} />}
                                        <RefreshCcw className={`mb-4 ${isSyncing ? 'animate-spin' : ''} text-[#FF8C00]`} size={32} />
                                        <h4 className="text-xl font-black uppercase tracking-tight">Sincronização Nuclear</h4>
                                        <p className="text-xs text-white/40 font-bold mt-2 uppercase">Atualiza toda a rede de vagas e serviços</p>
                                    </button>
                                    <button onClick={() => setActiveTab('knowledge')} className="w-full p-8 bg-gradient-to-br from-[#FF8C00] to-orange-700 border border-orange-500/20 rounded-[2.5rem] text-left hover:scale-[1.02] transition-all group shadow-2xl shadow-orange-500/20">
                                        <Bot className="mb-4 text-white" size={32} />
                                        <h4 className="text-xl font-black uppercase tracking-tight text-white">Injetar Inteligência</h4>
                                        <p className="text-xs text-white/80 font-bold mt-2 uppercase">Garante que o MIRA sabe as leis de 2026</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                        <input type="text" placeholder="Localizar utilizador..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="w-full pl-14 sm:pl-16 pr-6 py-4 sm:py-5 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF8C00]/50 transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {users.filter(u => u.name?.toLowerCase().includes(userSearchTerm.toLowerCase())).map(u => (
                                        <UserCard key={u.id} user={u} isAdmin={u.role === 'admin'} isDark={true} onToggleBlock={() => handleAction(() => adminService.toggleBlockUser(u.id, !u.isBlocked))} onDelete={() => handleAction(() => adminService.deleteUser(u.id))} />
                                    ))}
                                </div>

                                {totalUsers > 20 && (
                                    <div className="flex justify-center items-center gap-6 mt-12 bg-white/5 p-6 rounded-3xl border border-white/10">
                                        <button 
                                            disabled={usersPage === 0}
                                            onClick={() => { setUsersPage(p => p - 1); loadData(true); }}
                                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-black text-[10px] uppercase tracking-widest"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Página {usersPage + 1} de {Math.ceil(totalUsers / 20)}</span>
                                        <button 
                                            disabled={usersPage >= Math.ceil(totalUsers / 20) - 1}
                                            onClick={() => { setUsersPage(p => p + 1); loadData(true); }}
                                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-black text-[10px] uppercase tracking-widest"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'moderation' && (
                            <div className="space-y-4">
                                {communityReports.map(r => (
                                    <div key={r.id} className="p-5 sm:p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 sm:gap-0">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <p className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md inline-block ${
                                                    r.target_type === 'POST' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'bg-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.4)]'
                                                }`}>
                                                    [DENÚNCIA] [{r.target_type}]
                                                </p>
                                                {r.author_email && (
                                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                                        Autor: {r.author_email}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] font-black text-white/40 uppercase block mb-2 tracking-widest">Motivo: {r.reason}</p>
                                            <p className="text-sm font-bold leading-relaxed text-white/90 italic line-clamp-3">"{r.reported_content_text}"</p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <button onClick={() => handleAction(() => adminService.deleteCommunityReport(r.id))} className="flex-1 sm:flex-none p-3.5 bg-white/5 rounded-xl hover:bg-emerald-600 transition-all border border-white/10 flex items-center justify-center" title="Resolver"><CheckCircle size={18}/></button>
                                            <button onClick={() => handleAction(() => adminService.adminDeleteReportedContent(r))} className="flex-[2] sm:flex-none p-3.5 px-6 bg-red-600/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                                <Trash2 size={16}/> <span className="sm:inline">ELIMINAR</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'suggestions' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestions.map(s => (
                                    <div key={s.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                        <p className="text-[10px] font-black text-mira-orange uppercase">SUGESTÃO: {s.subject}</p>
                                        <p className="text-sm font-medium mt-2 text-white/60">{s.content}</p>
                                        <button onClick={() => handleAction(() => adminService.deleteSuggestion(s.id))} className="mt-4 p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'knowledge' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white/5 border border-white/10 rounded-[2.5rem]">
                                    <input type="text" placeholder="Tópico" value={newKnowledge.topic} onChange={(e) => setNewKnowledge({...newKnowledge, topic: e.target.value})} className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold outline-none focus:border-mira-orange/50" />
                                    <textarea placeholder="Informação" value={newKnowledge.information} onChange={(e) => setNewKnowledge({...newKnowledge, information: e.target.value})} className="px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold h-14 outline-none focus:border-mira-orange/50" />
                                    <button onClick={handleAddKnowledge} className="bg-[#FF8C00] text-white font-black uppercase rounded-2xl py-4 shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-xs tracking-widest">Injetar Saber</button>
                                </div>
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
                                    <div className="flex justify-center items-center gap-6 mt-12 bg-white/5 p-6 rounded-3xl border border-white/10">
                                        <button 
                                            disabled={knowledgePage === 0}
                                            onClick={() => { setKnowledgePage(p => p - 1); loadData(true); }}
                                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-black text-[10px] uppercase tracking-widest"
                                        >
                                            Anterior
                                        </button>
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Página {knowledgePage + 1} de {Math.ceil(totalKnowledge / 20)}</span>
                                        <button 
                                            disabled={knowledgePage >= Math.ceil(totalKnowledge / 20) - 1}
                                            onClick={() => { setKnowledgePage(p => p + 1); loadData(true); }}
                                            className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-black text-[10px] uppercase tracking-widest"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminPanel;
