// src/components/NifWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, FileText, Info,
    Hash, RotateCcw, MapPin, ExternalLink, Globe, Sparkles,
    ChevronDown, ChevronUp
} from 'lucide-react';
import { t } from '../utils/translations';
import { templates } from '../utils/documentsDatabase';
import { TranslatedText } from './TranslatedText';

interface NifWizardProps {
    language: string;
    onBack: () => void;
    onSelectTemplate: (templateId: string) => void;
}

// ─── Step Indicator Dots ─────────────────────────────────────────────────────
const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-amber-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-amber-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

export const NifWizard: React.FC<NifWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [step, setStep] = useState(1);
    const [isResident, setIsResident] = useState<boolean | null>(null);
    const [isRepOpen, setIsRepOpen] = useState(false);
    const [activeTip, setActiveTip] = useState<string | null>(null);

    const lang = language?.toLowerCase() || 'pt';

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
        else onBack();
    };

    const checklistResident = [
        { icon: '🛂', text: t('nif_doc_passport', lang) },
        { icon: '🏠', text: t('nif_doc_address', lang) },
        { icon: '📋', text: t('nif_doc_ar', lang) },
    ];

    const checklistNonResident = [
        { icon: '🛂', text: t('nif_doc_passport', lang) },
        { icon: '👤', text: t('nif_doc_fiscal_rep', lang) },
        { icon: '📄', text: t('nif_doc_rep_id', lang) },
    ];

    const checklist = isResident ? checklistResident : checklistNonResident;

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

                {/* Sticky Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <StepDots total={2} current={step} />

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            ✦ {step}/2
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Hash size={10} />}
                            text={t('nif_title', lang)}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('nif_step1_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('nif_step1_desc', lang)}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {isResident ? t('nif_opt_resident', lang) : t('nif_opt_nonresident', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('nif_subtitle', lang)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — Residence Verification ══════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Option 1: Resident */}
                            <button
                                onClick={() => { setIsResident(true); setStep(2); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.97]"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    🇵🇹
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-amber-500/10 text-amber-500 border-amber-500/20">
                                            {t('badge_resident', lang)}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                        {t('nif_opt_resident', lang)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                        {t('nif_opt_resident_sub', lang)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                    <ChevronRight size={14} />
                                </div>
                            </button>

                            {/* Option 2: Non-Resident */}
                            <button
                                onClick={() => { setIsResident(false); setStep(2); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.97]"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    ✈️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-amber-500/10 text-amber-500 border-amber-500/20">
                                            {t('badge_non_resident', lang)}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                        {t('nif_opt_nonresident', lang)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                        {t('nif_opt_nonresident_sub', lang)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                    <ChevronRight size={14} />
                                </div>
                            </button>

                            {/* Info Box */}
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    {t('nif_info_box', lang)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ════ STEP 2 — Checklist & Process ════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Where to get */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm">
                                <div className="flex items-start gap-3.5 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {t('nif_where_label', lang)}
                                        </h4>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                            {isResident ? t('nif_where_resident', lang) : t('nif_where_nonresident', lang)}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                    <a
                                        href="https://www.portaldasfinancas.gov.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-amber-600 text-[9px] font-black uppercase tracking-widest hover:text-amber-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        Portal das Finanças
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://siga.marcacaodeatendimento.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-amber-600 text-[9px] font-black uppercase tracking-widest hover:text-amber-700 transition-colors"
                                    >
                                        <ExternalLink size={11} />
                                        Agendamento (SIGA)
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>

                            {/* Checklist Container */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('nif_docs_needed', lang)}
                                    </h3>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden divide-y divide-slate-50">
                                    {checklist.map((doc, idx) => (
                                        <div
                                            key={idx}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                            className="group flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors animate-in slide-in-from-left-4 duration-500"
                                        >
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                {doc.icon}
                                            </div>
                                            <p className="flex-1 text-xs font-bold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                                {doc.text}
                                            </p>
                                            <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Fiscal Representative Info Card (Collapsible) */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => setIsRepOpen(!isRepOpen)}
                                    className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                {t('nif_taxation_header', lang)}
                                            </h4>
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug">
                                                {t('nif_rep_fiscal_title', lang)}
                                            </h3>
                                        </div>
                                    </div>
                                    {isRepOpen ? (
                                        <ChevronUp size={16} className="text-slate-400" />
                                    ) : (
                                        <ChevronDown size={16} className="text-slate-400" />
                                    )}
                                </button>
                                {isRepOpen && (
                                    <div className="p-6 pt-0 border-t border-slate-50 text-[11px] text-slate-650 font-semibold leading-relaxed space-y-4 bg-white animate-in slide-in-from-top-2 duration-300">
                                        <div className="text-slate-500 font-bold uppercase tracking-wider text-[9px] mb-1">
                                            {t('nif_guide_hacks_title', lang)}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {[
                                                {
                                                    id: 'viactt',
                                                    title: t('nif_rep_viactt_title', lang),
                                                    desc: t('nif_rep_viactt_desc', lang),
                                                    icon: '⚡',
                                                    badge: t('nif_badge_optional', lang)
                                                },
                                                {
                                                    id: 'address',
                                                    title: t('nif_rep_address_title', lang),
                                                    desc: t('nif_rep_address_desc', lang),
                                                    icon: '🏠',
                                                    badge: t('nif_badge_address', lang)
                                                },
                                                {
                                                    id: 'friend',
                                                    title: t('nif_rep_friend_title', lang),
                                                    desc: t('nif_rep_friend_desc', lang),
                                                    icon: '👥',
                                                    badge: t('nif_badge_free', lang)
                                                },
                                                {
                                                    id: 'alert',
                                                    title: t('nif_rep_alert_title', lang),
                                                    desc: t('nif_rep_alert_desc', lang),
                                                    icon: '🛡️',
                                                    badge: t('nif_badge_liability', lang)
                                                },
                                                {
                                                    id: 'steps',
                                                    title: t('nif_rep_steps_title', lang),
                                                    desc: t('nif_rep_steps_desc', lang),
                                                    icon: '📋',
                                                    badge: t('nif_badge_step_by_step', lang)
                                                }
                                            ].map((tip) => {
                                                const isTipOpen = activeTip === tip.id;
                                                return (
                                                    <div key={tip.id} className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 bg-slate-50/50">
                                                        <button
                                                            onClick={() => setActiveTip(isTipOpen ? null : tip.id)}
                                                            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-base">{tip.icon}</span>
                                                                <div>
                                                                    <span className="block text-[8px] font-black tracking-widest uppercase text-amber-500 mb-0.5">{tip.badge}</span>
                                                                    <span className="block text-[11px] font-black text-slate-800 uppercase tracking-tight leading-tight">{tip.title}</span>
                                                                </div>
                                                            </div>
                                                            {isTipOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                                        </button>
                                                        {isTipOpen && (
                                                            <div className="p-4 pt-0 border-t border-slate-100 bg-white text-[10.5px] text-slate-650 font-semibold leading-relaxed whitespace-pre-line animate-in slide-in-from-top-1 duration-200">
                                                                {tip.desc}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Recommended Form */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('nif_form_label', lang)}
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => onSelectTemplate('nif_req')}
                                        className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-300">
                                            <FileText size={18} className="text-amber-500 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                {t('nif_fill_doc', lang)}
                                            </p>
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-amber-500 transition-colors">
                                                {t('nif_req', lang)}
                                            </h4>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-300">
                                            <ChevronRight size={14} />
                                        </div>
                                    </button>

                                    <div className="flex items-start gap-2.5 text-[10px] text-amber-600 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-normal">
                                            {t('wiz_pdf_explicit_notice', lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => { setStep(1); setIsResident(null); }}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('nif_reset', lang)}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
