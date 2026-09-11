// src/components/CrossModuleNavigationHub.tsx
import React from 'react';
import { Compass, ArrowRight, Calculator, Briefcase, GraduationCap, Users, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { ViewType } from '../types';
import { t } from '../utils/translations';
import { audioService } from '../services/audioService';

export interface CrossNavAction {
    id: string;
    labelKey: string;
    descKey: string;
    icon?: React.ReactNode;
    view: ViewType;
    hoverBorder?: string;
    hoverBg?: string;
    gradient?: string;
    tagKey?: string;
    badgeText?: string;
}

interface CrossModuleNavigationHubProps {
    language: string;
    onViewChange?: (view: ViewType, params?: any) => void;
    actions?: CrossNavAction[];
    className?: string;
}

interface ModuleTheme {
    cardBg: string;
    cardBorder: string;
    glow: string;
    iconBg: string;
    badgeBg: string;
    titleHover: string;
    ctaBg: string;
    tagKey: string;
}

const getModuleTheme = (view: ViewType, id?: string): ModuleTheme => {
    const idLower = (id || '').toLowerCase();

    if (view === ViewType.SIMULATORS || idLower.includes('simul')) {
        return {
            cardBg: 'bg-gradient-to-br from-sky-50/90 via-cyan-50/40 to-white',
            cardBorder: 'border-cyan-300 hover:border-cyan-500',
            glow: 'hover:shadow-cyan-500/20 hover:shadow-xl',
            iconBg: 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30',
            badgeBg: 'bg-cyan-100 border-cyan-300/80 text-cyan-800',
            titleHover: 'group-hover:text-cyan-700',
            ctaBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 group-hover:from-cyan-500 group-hover:to-blue-500 text-white shadow-cyan-500/25',
            tagKey: 'wiz_cross_nav_tag_simulators'
        };
    }

    if (view === ViewType.JOBS || idLower.includes('job')) {
        return {
            cardBg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white',
            cardBorder: 'border-emerald-300 hover:border-emerald-500',
            glow: 'hover:shadow-emerald-500/20 hover:shadow-xl',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30',
            badgeBg: 'bg-emerald-100 border-emerald-300/80 text-emerald-800',
            titleHover: 'group-hover:text-emerald-700',
            ctaBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 text-white shadow-emerald-500/25',
            tagKey: 'wiz_cross_nav_tag_jobs'
        };
    }

    if (view === ViewType.LEARNING || idLower.includes('course')) {
        return {
            cardBg: 'bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white',
            cardBorder: 'border-blue-300 hover:border-blue-500',
            glow: 'hover:shadow-blue-500/20 hover:shadow-xl',
            iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/30',
            badgeBg: 'bg-blue-100 border-blue-300/80 text-blue-800',
            titleHover: 'group-hover:text-blue-700',
            ctaBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 text-white shadow-blue-500/25',
            tagKey: 'wiz_cross_nav_tag_courses'
        };
    }

    if (view === ViewType.COMMUNITY || idLower.includes('comm')) {
        return {
            cardBg: 'bg-gradient-to-br from-purple-50/90 via-fuchsia-50/40 to-white',
            cardBorder: 'border-purple-300 hover:border-purple-500',
            glow: 'hover:shadow-purple-500/20 hover:shadow-xl',
            iconBg: 'bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-purple-500/30',
            badgeBg: 'bg-purple-100 border-purple-300/80 text-purple-800',
            titleHover: 'group-hover:text-purple-700',
            ctaBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 group-hover:from-purple-500 group-hover:to-fuchsia-500 text-white shadow-purple-500/25',
            tagKey: 'wiz_cross_nav_tag_community'
        };
    }

    if (view === ViewType.SERVICES || idLower.includes('serv')) {
        return {
            cardBg: 'bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white',
            cardBorder: 'border-amber-300 hover:border-amber-500',
            glow: 'hover:shadow-amber-500/20 hover:shadow-xl',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30',
            badgeBg: 'bg-amber-100 border-amber-300/80 text-amber-800',
            titleHover: 'group-hover:text-amber-700',
            ctaBg: 'bg-gradient-to-r from-amber-600 to-orange-600 group-hover:from-amber-500 group-hover:to-orange-500 text-white shadow-amber-500/25',
            tagKey: 'wiz_cross_nav_tag_services'
        };
    }

    return {
        cardBg: 'bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white',
        cardBorder: 'border-orange-300 hover:border-orange-500',
        glow: 'hover:shadow-orange-500/20 hover:shadow-xl',
        iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/30',
        badgeBg: 'bg-orange-100 border-orange-300/80 text-orange-800',
        titleHover: 'group-hover:text-orange-700',
        ctaBg: 'bg-gradient-to-r from-orange-600 to-amber-600 group-hover:from-orange-500 group-hover:to-amber-500 text-white shadow-orange-500/25',
        tagKey: 'wiz_cross_nav_badge'
    };
};

const renderIcon = (icon: React.ReactNode) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement<{ className?: string; size?: number }>, {
            className: 'text-white drop-shadow-sm',
            size: 22
        });
    }
    return icon;
};

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
            icon: <Calculator size={22} />,
            view: ViewType.SIMULATORS
        },
        {
            id: 'jobs',
            labelKey: 'wiz_cross_nav_jobs',
            descKey: 'wiz_cross_nav_jobs_desc',
            icon: <Briefcase size={22} />,
            view: ViewType.JOBS
        },
        {
            id: 'courses',
            labelKey: 'wiz_cross_nav_courses',
            descKey: 'wiz_cross_nav_courses_desc',
            icon: <GraduationCap size={22} />,
            view: ViewType.LEARNING
        }
    ];

    const items = actions && actions.length > 0 ? actions : defaultActions;

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br from-orange-500/[0.04] via-amber-500/[0.02] to-slate-50/60 border-2 border-orange-300/60 rounded-[2.25rem] p-6 sm:p-7 shadow-lg shadow-orange-500/5 space-y-5 animate-in slide-in-from-bottom-3 duration-500 ${className}`}>
            {/* Header with Title & Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-200/50 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30 flex items-center justify-center text-white shrink-0">
                        <Compass size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900">
                                {t('wiz_cross_nav_title', language)}
                            </h4>
                            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-400/30 text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                <Sparkles size={11} className="text-orange-500 animate-pulse" />
                                {t('wiz_cross_nav_badge', language)}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                            {t('wiz_cross_nav_subtitle', language)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Interactive Module Cards Grid */}
            <div className={`grid grid-cols-1 ${items.length === 2 ? 'sm:grid-cols-2' : items.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'} gap-3.5 pt-1`}>
                {items.map((btn, idx) => {
                    const theme = getModuleTheme(btn.view, btn.id);
                    return (
                        <button
                            key={btn.id + '_' + idx}
                            type="button"
                            onClick={() => {
                                audioService.playClick();
                                onViewChange(btn.view);
                            }}
                            className={`group relative flex flex-col justify-between text-left p-5 rounded-[1.75rem] border-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98] cursor-pointer ${theme.cardBorder} ${theme.cardBg} ${theme.glow}`}
                        >
                            <div>
                                {/* Upper row: Domain Tag + Clickable Link Indicator */}
                                <div className="flex items-center justify-between w-full mb-3.5">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider shadow-2xs ${theme.badgeBg}`}>
                                        {t(btn.tagKey || theme.tagKey, language)}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400 group-hover:text-slate-800 transition-colors">
                                        <span>Link</span>
                                        <ExternalLink size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </span>
                                </div>

                                {/* Content: Vibrant Gradient Icon + Title + Description */}
                                <div className="flex items-start gap-3.5 min-w-0 w-full mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300 ${theme.iconBg}`}>
                                        {renderIcon(btn.icon)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className={`text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-snug block transition-colors ${theme.titleHover}`}>
                                            {t(btn.labelKey, language)}
                                        </span>
                                        <span className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1 block line-clamp-2">
                                            {t(btn.descKey, language)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Action Bar: High-contrast "Saber Mais" Action Button */}
                            <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between w-full mt-auto">
                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-800 transition-colors uppercase tracking-wider">
                                    {t('wiz_cross_nav_click_to_open', language)}
                                </span>
                                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider shadow-sm transition-all duration-300 ${theme.ctaBg} group-hover:shadow-md`}>
                                    <span>{t('wiz_cross_nav_cta', language)}</span>
                                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

