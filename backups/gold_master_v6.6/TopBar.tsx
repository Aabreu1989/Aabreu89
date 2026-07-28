
import React, { memo } from 'react';
import { Globe, ChevronDown, LogOut } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { t } from '../utils/translations';
import { User } from '../types';

export interface TopBarProps {
    user: User | null;
    language: string;
    onLogoClick: () => void;
    onLogout: () => void;
    isSystemAdmin: boolean;
    onAdminClick: () => void;
    notifications: any[];
    unreadCount: number;
    notifOpen: boolean;
    onNotifToggle: () => void;
    onNotifRead: (id: string) => void;
    onNotifClear: () => Promise<void> | void;
    onSetLanguage: (lang: string) => void;
    onProfileClick?: () => void;
    isDark?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
    user,
    language,
    onLogoClick,
    onLogout,
    isSystemAdmin,
    onAdminClick,
    notifications,
    unreadCount,
    notifOpen,
    onNotifToggle,
    onNotifRead,
    onNotifClear,
    onSetLanguage,
    onProfileClick,
    isDark = false
}) => {
    const [showLangMenu, setShowLangMenu] = React.useState(false);

    // Logo click: if admin, go to admin panel; otherwise go to home
    const handleLogoClick = () => {
        if (isSystemAdmin) {
            onAdminClick();
        } else {
            onLogoClick();
        }
    };

    return (
        <header className={`${isDark ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white/80 border-slate-100 text-slate-900'} backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between sticky top-0 z-[60] transition-all duration-500 shadow-sm`}>
            <div className="flex items-center gap-4">
                <div 
                    className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform group"
                    onClick={handleLogoClick}
                    title={isSystemAdmin ? 'Admin Hub' : 'MIRA'}
                >
                     <div className="flex-shrink-0 flex items-center">
                        <div className="w-12 h-12 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500 bg-transparent">
                             <img src="/logo-mira.png" alt="MIRA" className="w-[44px] h-[44px] object-contain relative z-10 bg-transparent" style={{ background: 'transparent' }} />
                             {isSystemAdmin && <div className="absolute inset-0 bg-mira-orange/20 blur-2xl rounded-full animate-pulse" />}
                         </div>
                     </div>
                      <div>
                           <h2 className={`font-black text-xl tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{isSystemAdmin ? 'ADMIN HUB' : 'MIRA'}</h2>
                      </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Language button — ALWAYS orange */}
                <div className="relative">
                    <button 
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border bg-mira-orange border-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/20"
                    >
                        <Globe size={14} className="text-white" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">{language}</span>
                        <ChevronDown size={12} className="text-white/70" />
                    </button>

                    {showLangMenu && (
                        <div className="absolute top-full right-0 mt-3 w-40 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 p-2 z-[9999] animate-in slide-in-from-top-2">
                            {['PT', 'EN', 'ES', 'FR'].map(l => (
                                <button 
                                    key={l} 
                                    onClick={() => { onSetLanguage(l); setShowLangMenu(false); }} 
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase transition-all ${language === l ? 'bg-mira-orange text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {user && (
                    <div className={`flex items-center gap-3 pl-3 border-l ${isDark || isSystemAdmin ? 'border-white/10' : 'border-slate-100'}`}>
                        <NotificationBell 
                            isDark={isSystemAdmin}
                            notifications={notifications}
                            unreadCount={unreadCount}
                            isOpen={notifOpen}
                            onToggle={onNotifToggle}
                            onMarkRead={onNotifRead}
                            onClearAll={onNotifClear}
                        />
                        {!isSystemAdmin && (
                            <button 
                                onClick={onProfileClick}
                                className={`w-9 h-9 rounded-full p-[2px] transition-all hover:scale-110 active:scale-95 shadow-md ${isDark ? 'bg-white/10' : 'bg-gradient-to-tr from-[#FF8C00] via-[#FFD700] to-[#FF8C00]'}`}
                                title={t('my_profile', language)}
                            >
                                <img 
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'M')}&background=f97316&color=fff&bold=true`} 
                                    className="w-full h-full object-cover rounded-full border-2 border-white" 
                                    alt="Perfil" 
                                    referrerPolicy="no-referrer"
                                />
                            </button>
                        )}
                        <button 
                            onClick={onLogout}
                            className={`p-2.5 rounded-xl transition-all border ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-500 hover:bg-red-500/10' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50'} active:scale-90`}
                            title={t('logout', language)}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default memo(TopBar);
