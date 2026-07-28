import React, { useState, useMemo } from 'react';
import { 
    Bell, CheckCheck, Trash2, ArrowLeft, Filter, 
    MessageCircle, Heart, UserPlus, Briefcase, FileText, 
    ShieldAlert, Zap, Search, Loader2
} from 'lucide-react';
import { ViewType, Notification } from '../types';
import { t } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
    notifications: Notification[];
    language: string;
    onViewChange: (view: ViewType, params?: any) => void;
    onMarkRead: (id: string) => void;
    onClearAll: () => void;
    isLoading?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications, language, onViewChange, onMarkRead, onClearAll, isLoading
}) => {
    const [filter, setFilter] = useState<'all' | 'aima' | 'social' | 'jobs'>('all');
    const { showToast } = useToast();

    const handleClearAll = () => {
        if (window.confirm(language === 'EN' ? 'Are you sure you want to delete all notifications?' : 'Tem a certeza que deseja apagar todas as notificações?')) {
            onClearAll();
            showToast(language === 'EN' ? 'Notifications deleted' : 'Notificações apagadas', 'success');
        }
    };

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        return notifications.filter(n => {
            if (filter === 'aima') return n.type === 'aima' || n.type === 'docs';
            if (filter === 'social') return n.type === 'community' || n.type === 'social';
            if (filter === 'jobs') return n.type === 'jobs';
            return true;
        });
    }, [notifications, filter]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'aima': return <ShieldAlert className="text-red-500" size={18} />;
            case 'social': return <Heart className="text-pink-500" size={18} />;
            case 'community': return <MessageCircle className="text-blue-500" size={18} />;
            case 'jobs': return <Briefcase className="text-emerald-500" size={18} />;
            case 'docs': return <FileText className="text-orange-500" size={18} />;
            default: return <Bell className="text-slate-400" size={18} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] text-white animate-in fade-in duration-500">
            {/* Header Imperial */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-3xl z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => onViewChange(ViewType.HOME)} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Centro de Comando 🔔</h2>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Notificações em tempo real</p>
                    </div>
                </div>
                <button 
                    onClick={handleClearAll}
                    disabled={notifications.length === 0}
                    className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all disabled:opacity-30 flex items-center gap-2 group"
                >
                    <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">APAGAR NOTIFICAÇÕES</span>
                </button>
            </div>

            {/* Filters High-Tech */}
            <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#0D0D0D]">
                {[
                    { id: 'all', label: 'Tudo', icon: <Bell size={14} /> },
                    { id: 'aima', label: 'AIMA & Leis', icon: <ShieldAlert size={14} /> },
                    { id: 'social', label: 'Comunidade', icon: <MessageCircle size={14} /> },
                    { id: 'jobs', label: 'Vagas', icon: <Briefcase size={14} /> }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                            filter === item.id 
                            ? 'bg-mira-orange border-mira-orange text-white shadow-[0_0_20px_rgba(255,140,0,0.3)]' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                        <Loader2 size={48} className="animate-spin mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Acedendo aos logs...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notif => (
                        <NotificationItem 
                            key={notif.id} 
                            notif={notif} 
                            onMarkRead={onMarkRead} 
                            onViewChange={onViewChange} 
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center">
                        <Bell size={64} className="mb-6" />
                        <h3 className="text-xl font-black uppercase tracking-[0.2em]">Silêncio Total</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Sem novos alertas no radar</p>
                    </div>
                )}
            </div>

            {/* Footer de Impacto */}
            <div className="p-8 bg-gradient-to-t from-black to-transparent border-t border-white/5 text-center">
                <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">MIRA v2026 • Encryption Enabled</p>
            </div>
        </div>
    );
};
