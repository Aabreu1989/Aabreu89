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
    onNotifNavigate?: () => void;
    onSetLanguage: (lang: string) => void;
    onProfileClick?: () => void;
    onInstallApp?: () => void;
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
    onNotifNavigate,
    onSetLanguage,
    onProfileClick,
    onInstallApp,
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
        <header className={`${isDark ? 'bg-[#0A0A0A] border-white/10 text-white backdrop-blur-xl' : 'bg-white border-slate-200/80 text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'} border-b px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between sticky top-0 z-[60] transition-all duration-500 max-w-full overflow-visible flex-nowrap`}>
            {/* BRAND / LOGO */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink min-w-0">
                <div 
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer active:scale-95 transition-transform group min-w-0"
                    onClick={handleLogoClick}
                    title={isSystemAdmin ? 'Admin Hub' : 'MIRA'}
                >
                     <div className="flex-shrink-0 flex items-center">
                        <div className="w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-500 bg-transparent">
                             <img src="/logo-mira.png" alt="MIRA" className="w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] object-contain relative z-10 bg-transparent" style={{ background: 'transparent' }} />
                             {isSystemAdmin && <div className="absolute inset-0 bg-mira-orange/20 blur-xl rounded-full animate-pulse" />}
                         </div>
                     </div>
                      <div className="min-w-0">
                           <h2 className={`font-black text-base sm:text-xl tracking-tighter uppercase truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{isSystemAdmin ? 'ADMIN HUB' : 'MIRA'}</h2>
                      </div>
                </div>
            </div>

            {/* ACTION BUTTONS (RESPONSIVE FLEX BAR) */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* LANGUAGE SELECTOR */}
                <div className="relative shrink-0">
                    <button 
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-full transition-all border bg-mira-orange border-orange-500 hover:bg-orange-600 active:scale-95 shadow-sm shadow-orange-500/20 shrink-0"
                    >
                        <Globe size={13} className="text-white shrink-0" />
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-white">{language}</span>
                        <ChevronDown size={11} className="text-white/80 shrink-0" />
                    </button>

                    {showLangMenu && (
                        <div className="absolute top-full right-0 mt-3 w-36 sm:w-40 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 p-2 z-[9999] animate-in slide-in-from-top-2">
                            {['PT', 'EN', 'ES', 'FR'].map(l => (
                                <button 
                                    key={l} 
                                    onClick={() => { onSetLanguage(l); setShowLangMenu(false); }} 
                                    className={`w-full text-left px-3.5 py-2 sm:py-2.5 rounded-xl text-[10px] font-extrabold uppercase transition-all ${language === l ? 'bg-mira-orange text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* USER ACTIONS: NOTIFICATIONS + LOGOUT */}
                {user && (
                    <div className={`flex items-center gap-1 sm:gap-2.5 pl-1.5 sm:pl-3 border-l shrink-0 ${isDark || isSystemAdmin ? 'border-white/10' : 'border-slate-200'}`}>
                        <NotificationBell 
                            isDark={isSystemAdmin}
                            notifications={notifications}
                            unreadCount={unreadCount}
                            isOpen={notifOpen}
                            onToggle={onNotifToggle}
                            onMarkRead={onNotifRead}
                            onClearAll={onNotifClear}
                            onViewNotificationsPage={onNotifNavigate}
                        />
                        <button 
                            onClick={onLogout}
                            className={`p-1.5 sm:p-2 rounded-xl transition-all border ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-500 hover:bg-red-500/10' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50'} active:scale-90`}
                            title={t('logout', language)}
                        >
                            <LogOut size={15} className="sm:w-4 sm:h-4" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default memo(TopBar);
