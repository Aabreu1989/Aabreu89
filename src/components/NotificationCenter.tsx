import React, { useState, useMemo } from 'react';
import { Bell, Trash2, CheckCheck, X, MessageCircle, Heart, AtSign, Shield, Info, ArrowRight, ExternalLink, Calendar, Briefcase, FileText, ShieldAlert } from 'lucide-react';
import { AppNotification } from '../services/notificationService';
import { ViewType } from '../types';
import { t } from '../utils/translations';

interface NotificationCenterProps {
  notifications: AppNotification[];
  unreadCount: number;
  onRead: (id: string) => void;
  onClearAll: () => Promise<void> | void;
  onViewChange: (view: ViewType, params?: any) => void;
  language: string;
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  comment: { icon: <MessageCircle size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
  like: { icon: <Heart size={18} />, color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
  mention: { icon: <AtSign size={18} />, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
  report_resolved: { icon: <Shield size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
  system: { icon: <Info size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
  aima: { icon: <ShieldAlert size={18} />, color: 'text-red-550', bg: 'bg-red-50 border-red-100' },
  social: { icon: <Heart size={18} />, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' },
  community: { icon: <MessageCircle size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
  jobs: { icon: <Briefcase size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
  docs: { icon: <FileText size={18} />, color: 'text-orange-550', bg: 'bg-orange-50 border-orange-100' },
};

function formatLongDate(dateStr: string, lang: string) {
  try {
    const d = new Date(dateStr);
    const l = (lang || 'pt').toLowerCase();
    const locale = l === 'pt' ? 'pt-PT' : l === 'es' ? 'es-ES' : l === 'fr' ? 'fr-FR' : 'en-US';
    return d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onRead,
  onClearAll,
  onViewChange,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === 'unread') return !n.is_read;
      if (activeTab === 'read') return n.is_read;
      return true;
    });
  }, [notifications, activeTab]);

  const handleNotificationClick = (n: AppNotification) => {
    setSelectedNotification(n);
    if (!n.is_read) {
      onRead(n.id);
    }
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.is_read) onRead(n.id);
    });
  };

  // Maps internal MIRA paths to ViewType enums for deep-linking
  const handleActionLink = (path: string) => {
    setSelectedNotification(null);
    if (!path) return;

    if (path.startsWith('/community')) {
      onViewChange(ViewType.COMMUNITY);
    } else if (path.startsWith('/jobs')) {
      onViewChange(ViewType.JOBS);
    } else if (path.startsWith('/docs') || path.startsWith('/documents')) {
      onViewChange(ViewType.DOCUMENTS);
    } else if (path.startsWith('/map')) {
      onViewChange(ViewType.MAP);
    } else if (path.startsWith('/learning')) {
      onViewChange(ViewType.LEARNING);
    } else if (path.startsWith('/profile')) {
      onViewChange(ViewType.PROFILE);
    } else {
      onViewChange(ViewType.HOME);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900 font-sans">
      {/* Header Section */}
      <div className="bg-white/95 backdrop-blur-3xl px-6 pt-8 pb-4 space-y-6 z-20 border-b border-slate-100 sticky top-0 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{t('notif_title', language)}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-mira-orange animate-pulse shadow-[0_0_10px_#FF8C00]"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] !mb-0">
                {t('notif_subtitle', language)}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2.5 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm"
              >
                <CheckCheck size={14} className="text-emerald-500" /> {t('notif_mark_read', language)}
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm"
              >
                <Trash2 size={14} /> {t('notif_clear', language)}
              </button>
            )}
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl w-full border border-slate-200/50 shadow-inner relative overflow-hidden">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${
              activeTab === 'all' ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('notif_all', language)} ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${
              activeTab === 'unread' ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('notif_unread', language)} ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${
              activeTab === 'read' ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('notif_read', language)} ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 space-y-4 mt-6">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-100 border border-slate-200/60 rounded-[3.2rem] flex items-center justify-center text-slate-300 shadow-sm">
              <Bell size={44} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                {t('notif_empty_title', language)}
              </p>
              <p className="text-xs font-semibold text-slate-400 leading-relaxed px-8">
                {activeTab === 'unread'
                  ? t('notif_empty_desc_unread', language)
                  : activeTab === 'read'
                    ? t('notif_empty_desc_read', language)
                    : t('notif_empty_desc_all', language)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredNotifications.map((n) => {
              const meta = TYPE_ICON[n.type] || TYPE_ICON.system;
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 sm:p-5 rounded-[1.8rem] border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex gap-3.5 sm:gap-4 items-center justify-between group ${
                    n.is_read
                      ? 'bg-white border-slate-100 hover:bg-slate-50 opacity-80'
                      : 'bg-white border-orange-200/60 hover:bg-orange-50/20 ring-1 ring-orange-500/5'
                  }`}
                >
                  <div className="flex gap-3 sm:gap-4 items-start min-w-0 flex-1">
                    {/* Icon Panel */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-2xl border ${meta.bg} ${meta.color} shrink-0 shadow-sm`}>
                      {meta.icon}
                    </div>

                    {/* Content Detail */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-900 leading-tight truncate">
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 animate-pulse" />
                        )}
                      </div>
                      
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-1.5 pt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar size={10} />
                        <span>{formatLongDate(n.created_at, language)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Icon Indicator */}
                  <div className="text-slate-300 group-hover:text-slate-500 transition-colors ml-2 shrink-0">
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🎬 DYNAMIC EXPAND MODAL */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 backdrop-blur-2xl w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-8 space-y-6 sm:space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom-20 duration-500 relative overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 flex items-center justify-center rounded-2xl border ${
                  (TYPE_ICON[selectedNotification.type] || TYPE_ICON.system).bg
                } ${
                  (TYPE_ICON[selectedNotification.type] || TYPE_ICON.system).color
                } shadow-sm shrink-0`}>
                  {(TYPE_ICON[selectedNotification.type] || TYPE_ICON.system).icon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase">
                    {t('notif_alert', language)}
                  </h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {t('notif_details', language)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2.5 bg-slate-50 border border-slate-150 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <h4 className="text-base font-black text-slate-950 tracking-tight leading-snug">
                  {selectedNotification.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={10} />
                  <span>{formatLongDate(selectedNotification.created_at, language)}</span>
                </div>
              </div>

              {/* Message Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 shadow-inner">
                <p className="text-xs font-bold leading-relaxed text-slate-700 whitespace-pre-line">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Link Action Button */}
              {selectedNotification.link && (
                <button
                  onClick={() => handleActionLink(selectedNotification.link!)}
                  className="w-full mt-2 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-mira-orange active:scale-95 shadow-lg shadow-slate-950/10 hover:shadow-orange-500/20"
                >
                  {t('notif_go_section', language)} <ExternalLink size={14} />
                </button>
              )}
            </div>

            {/* Decorative background logo blob */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] -z-10" />
          </div>
        </div>
      )}
    </div>
  );
};
