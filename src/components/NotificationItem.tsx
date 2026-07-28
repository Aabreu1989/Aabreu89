import React, { memo } from 'react';
import { ShieldAlert, Heart, MessageCircle, Briefcase, FileText, Bell, Zap } from 'lucide-react';
import { Notification, ViewType } from '../types';

interface NotificationItemProps {
    notif: Notification;
    onMarkRead: (id: string) => void;
    onViewChange: (view: ViewType, params?: any) => void;
}

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

const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onMarkRead, onViewChange }) => {
    return (
        <div 
            onClick={() => {
                onMarkRead(notif.id);
                if (notif.link) {
                    const [route, query] = notif.link.split('?');
                    const params: any = {};
                    if (query) {
                        const searchParams = new URLSearchParams(query);
                        searchParams.forEach((v, k) => params[k] = v);
                    }
                    const ROUTE_MAP: Record<string, ViewType> = {
                        '/jobs': ViewType.JOBS,
                        '/map': ViewType.MAP,
                        '/docs': ViewType.DOCUMENTS,
                        '/profile': ViewType.PROFILE,
                        '/community': ViewType.COMMUNITY,
                        '/documents': ViewType.DOCUMENTS
                    };
                    onViewChange(ROUTE_MAP[route] || ViewType.HOME, params);
                }
            }}
            className={`group p-6 rounded-[2.5rem] border transition-all cursor-pointer relative overflow-hidden ${
                notif.is_read 
                ? 'bg-white/5 border-white/5 opacity-60' 
                : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 shadow-2xl scale-[1.02]'
            }`}
        >
            {!notif.is_read && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-mira-orange shadow-[0_0_15px_#FF8C00]" />
            )}
            
            <div className="flex gap-5 items-start">
                <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform ${notif.is_read ? '' : 'shadow-[0_0_20px_rgba(255,140,0,0.1)]'}`}>
                    {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-[15px] font-black uppercase tracking-tight leading-tight">
                            {notif.title}
                        </h4>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest whitespace-nowrap ml-4">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className="text-[12px] text-white/60 font-medium leading-relaxed">
                        {notif.message}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Zap size={14} className="text-mira-orange" />
            </div>
        </div>
    );
};

export default memo(NotificationItem);
