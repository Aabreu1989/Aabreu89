import React from 'react';
import { 
    Home, Heart, Briefcase, MapPin, FileText 
} from 'lucide-react';
import { ViewType } from '../types';

interface NavigationProps {
    currentView: ViewType;
    onViewChange: (view: ViewType, params?: any) => void;
    language: string;
}

/**
 * 👑 MIRA NAVIGATION IMPERIAL V2026 (ONLINE REPLICA)
 * DESIGN: miraimigrante.pt DNA (100% Identical)
 * MANDATO: No background fills, simple color-toggle.
 */
const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
    const navItems = [
        { id: ViewType.HOME, label: 'HOME', icon: Home },
        { id: ViewType.COMMUNITY, label: 'MIRA HUB', icon: Heart },
        { id: ViewType.JOBS, label: 'JOBS', icon: Briefcase },
        { id: ViewType.MAP, label: 'SERVICES', icon: MapPin },
        { id: ViewType.DOCUMENTS, label: 'REGULARIZATION', icon: FileText },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[5000] flex justify-around items-center h-[64px] bg-white border-t border-slate-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe px-2 backdrop-blur-3xl">
            {navItems.map((item) => {
                const isActive = currentView === item.id;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
                            flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300
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
                    </button>
                );
            })}
        </nav>
    );
};

export default Navigation;
