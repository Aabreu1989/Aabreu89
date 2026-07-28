import React, { useRef, useEffect } from 'react';
import { Bell, CheckCheck, MessageCircle, Heart, AtSign, Shield, Info, Trash2, ArrowRight, Briefcase, FileText, ShieldAlert } from 'lucide-react';
import { AppNotification } from '../services/notificationService';

interface NotificationBellProps {
  unreadCount: number;
  notifications: AppNotification[];
  isOpen: boolean;
  onToggle: () => void;
  onClearAll: () => Promise<void> | void;
  onMarkRead: (id: string) => void;
  isDark?: boolean;
  onViewNotificationsPage?: () => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  comment: <MessageCircle size={14} className="text-indigo-500" />,
  like: <Heart size={14} className="text-red-500" />,
  mention: <AtSign size={14} className="text-amber-500" />,
  report_resolved: <Shield size={14} className="text-emerald-500" />,
  system: <Info size={14} className="text-blue-400" />,
  aima: <ShieldAlert size={14} className="text-red-500" />,
  social: <Heart size={14} className="text-pink-500" />,
  community: <MessageCircle size={14} className="text-blue-500" />,
  jobs: <Briefcase size={14} className="text-emerald-500" />,
  docs: <FileText size={14} className="text-orange-500" />,
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  notifications,
  isOpen,
  onToggle,
  onClearAll,
  onMarkRead,
  isDark = false,
  onViewNotificationsPage,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onToggle]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        id="notification-bell-btn"
        className={`relative p-2.5 rounded-2xl transition-all active:scale-90 border ${isDark ? 'bg-white/5 text-white hover:bg-white/10 border-white/5' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200'}`}
        title="Notificações"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-12 left-4 right-4 sm:left-auto sm:right-0 sm:w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-0 z-[9999] animate-in slide-in-from-top-4 overflow-hidden max-w-[calc(100vw-32px)]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-black uppercase tracking-widest text-slate-900">Notificações</p>
            {notifications.length > 0 && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await onClearAll();
                  onToggle();
                }}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
                title="Apagar todas as notificações permanentemente"
              >
                <Trash2 size={12} />
                APAGAR NOTIFICAÇÕES
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto no-scrollbar divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto text-slate-200 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Sem notificações
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`w-full text-left flex items-start gap-3 px-5 py-4 transition-all ${n.is_read ? 'opacity-60 hover:bg-slate-50' : 'bg-orange-50/50 hover:bg-orange-50'}`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 w-7 h-7 flex items-center justify-center rounded-xl shrink-0 ${n.is_read ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
                    {TYPE_ICON[n.type] || TYPE_ICON.system}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-900 leading-tight truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5 animate-pulse" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          <button
            onClick={() => {
              if (onViewNotificationsPage) onViewNotificationsPage();
              onToggle();
            }}
            className="w-full bg-slate-50 hover:bg-slate-100 border-t border-slate-100 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            VER TODAS AS NOTIFICAÇÕES <ArrowRight size={12} />
          </button>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
