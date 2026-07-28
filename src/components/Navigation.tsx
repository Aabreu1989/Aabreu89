import React from 'react';
import { 
    Home, Heart, Briefcase, MapPin, FileText, GraduationCap, User, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { ViewType } from '../types';
import { t } from '../utils/translations';

interface NavigationProps {
    currentView: ViewType;
    onViewChange: (view: ViewType, params?: any) => void;
    language: string;
    user?: any;
}

/**
 * 👑 MIRA NAVIGATION IMPERIAL V2026 (REPLICAS)
 * DESIGN: miraimigrante.pt DNA (100% Identical)
 */
const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, language, user }) => {
    const isES = language === 'ES';
    const navItems = [
        { id: ViewType.HOME, label: t('nav_home', language), icon: Home },
        { id: ViewType.COMMUNITY, label: t('nav_community', language), icon: Heart },
        { id: ViewType.JOBS, label: t('nav_bottom_vagas', language), icon: Briefcase },
        { id: ViewType.MAP, label: t('nav_map', language), icon: MapPin },
        { id: ViewType.LEARNING, label: t('nav_learning_bottom', language), icon: GraduationCap },
        { id: ViewType.DOCUMENTS, label: t('nav_bottom_docs', language), icon: FileText },
    ];



    return (
        <nav className={`h-full w-full flex md:flex-col justify-around md:justify-start items-center md:items-stretch bg-white md:bg-transparent shadow-[0_-4px_10px_rgba(0,0,0,0.03)] md:shadow-none px-2 md:px-0 md:pt-10 backdrop-blur-3xl md:backdrop-blur-none`}>
            {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
                            flex-1 md:flex-none flex flex-col items-center justify-center gap-1 md:py-6 transition-all duration-300
                            ${isActive ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        <Icon 
                            size={22} 
                            strokeWidth={isActive ? 3 : 2.5} 
                            className={`transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                            fill={isActive && item.id === ViewType.COMMUNITY ? '#FF6B00' : 'none'}
                        />
                        
                        <span className={`
                            text-[9px] font-black uppercase tracking-tighter transition-all duration-300
                            ${isActive ? 'opacity-100' : 'opacity-70'}
                        `}>
                            {item.label}
                        </span>
                        
                        {/* Desktop Active Bar */}
                        {isActive && (
                            <div className="hidden md:block absolute right-0 w-1 h-8 bg-[#FF6B00] rounded-l-full shadow-[0_0_10px_rgba(255,107,0,0.3)] animate-in fade-in slide-in-from-right-2" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default Navigation;
