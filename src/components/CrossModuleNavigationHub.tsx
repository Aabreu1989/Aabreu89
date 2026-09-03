// src/components/CrossModuleNavigationHub.tsx
import React from 'react';
import { Compass, ArrowRight, Calculator, Briefcase, GraduationCap } from 'lucide-react';
import { ViewType } from '../types';
import { t } from '../utils/translations';
import { audioService } from '../services/audioService';

export interface CrossNavAction {
    id: string;
    labelKey: string;
    descKey: string;
    icon: React.ReactNode;
    view: ViewType;
    hoverBorder?: string;
    hoverBg?: string;
}

interface CrossModuleNavigationHubProps {
    language: string;
    onViewChange?: (view: ViewType, params?: any) => void;
    actions?: CrossNavAction[];
    className?: string;
}

export const CrossModuleNavigationHub: React.FC<CrossModuleNavigationHubProps> = ({
    language,
    onViewChange,
    actions,
    className = ''
}) => {
    if (!onViewChange) return null;

    const defaultActions: CrossNavAction[] = [
        {
            id: 'simulators',
            labelKey: 'wiz_cross_nav_simulators_plural',
            descKey: 'wiz_cross_nav_simulators_desc',
            icon: <Calculator size={18} className="text-cyan-500" />,
            view: ViewType.SIMULATORS,
            hoverBorder: 'hover:border-cyan-300',
            hoverBg: 'hover:bg-cyan-50/50'
        },
        {
            id: 'jobs',
            labelKey: 'wiz_cross_nav_jobs',
            descKey: 'wiz_cross_nav_jobs_desc',
            icon: <Briefcase size={18} className="text-emerald-500" />,
            view: ViewType.JOBS,
            hoverBorder: 'hover:border-emerald-300',
            hoverBg: 'hover:bg-emerald-50/50'
        },
        {
            id: 'courses',
            labelKey: 'wiz_cross_nav_courses',
            descKey: 'wiz_cross_nav_courses_desc',
            icon: <GraduationCap size={18} className="text-blue-500" />,
            view: ViewType.LEARNING,
            hoverBorder: 'hover:border-blue-300',
            hoverBg: 'hover:bg-blue-50/50'
        }
    ];

    const items = actions || defaultActions;

    return (
        <div className={`bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-4 animate-in slide-in-from-bottom-3 duration-500 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                    <Compass size={20} />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {t('wiz_cross_nav_title', language)}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                        {t('wiz_cross_nav_subtitle', language)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {items.map((btn, idx) => (
                    <button
                        key={btn.id + '_' + idx}
                        onClick={() => {
                            audioService.playClick();
                            onViewChange(btn.view);
                        }}
                        className={`group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-300 hover:shadow-md ${btn.hoverBorder || 'hover:border-orange-300'} ${btn.hoverBg || 'hover:bg-orange-50/40'} active:scale-[0.98]`}
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                                {btn.icon}
                            </div>
                            <div className="text-left min-w-0">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-tight block truncate group-hover:text-orange-600 transition-colors">
                                    {t(btn.labelKey, language)}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold block truncate">
                                    {t(btn.descKey, language)}
                                </span>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-orange-600 group-hover:border-orange-200 transition-all shrink-0 ml-2">
                            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
