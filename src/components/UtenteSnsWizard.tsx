// src/components/UtenteSnsWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, FileText, Info,
    HeartPulse, RotateCcw, MapPin, ExternalLink, Globe, AlertCircle, Sparkles
} from 'lucide-react';
import { t } from '../utils/translations';

interface UtenteSnsWizardProps {
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
                        ? 'w-6 h-2 bg-rose-400 shadow-md shadow-rose-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-rose-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-rose-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

export const UtenteSnsWizard: React.FC<UtenteSnsWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [step, setStep] = useState(1);
    const [hasNif, setHasNif] = useState<boolean | null>(null);

    const lang = language?.toLowerCase() || 'pt';

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
        else onBack();
    };

    const checklist = [
        { icon: '🛂', text: t('sns_doc_passport', lang) },
        { icon: '🔢', text: t('sns_doc_nif', lang) },
        { icon: '📍', text: t('sns_doc_address', lang) },
        ...(hasNif === false ? [{ icon: '⚠️', text: t('sns_doc_nif_warning', lang) }] : []),
    ];

    const urgencySteps = [
        { num: 1, text: t('sns_urgent_step1', lang) },
        { num: 2, text: t('sns_urgent_step2', lang) },
        { num: 3, text: t('sns_urgent_step3', lang) },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-rose-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

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
                        <Sparkles size={12} className="text-rose-400 animate-pulse" />
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            ✦ {step}/2
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<HeartPulse size={10} />}
                            text={t('sns_title', lang)}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('sns_step1_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('sns_step1_desc', lang)}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {hasNif ? t('sns_opt_has_nif', lang) : t('sns_opt_no_nif', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('sns_subtitle', lang)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — Has NIF? ════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Rights Banner */}
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-rose-800 font-bold leading-relaxed">
                                    {t('sns_rights_info', lang)}
                                </p>
                            </div>

                            {/* Option 1: Yes, has NIF */}
                            <button
                                onClick={() => { setHasNif(true); setStep(2); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-rose-400/30 hover:shadow-2xl hover:shadow-rose-500/5 active:scale-[0.97]"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    ✅
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-rose-500/10 text-rose-500 border-rose-500/20">
                                            {t('badge_with_nif', lang)}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                        {t('sns_opt_has_nif', lang)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                        {t('sns_opt_has_nif_sub', lang)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                    <ChevronRight size={14} />
                                </div>
                            </button>

                            {/* Option 2: No NIF */}
                            <button
                                onClick={() => { setHasNif(false); setStep(2); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-rose-400/30 hover:shadow-2xl hover:shadow-rose-500/5 active:scale-[0.97]"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    ⚠️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-rose-500/10 text-rose-500 border-rose-500/20">
                                            {t('badge_without_nif', lang)}
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                        {t('sns_opt_no_nif', lang)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                        {t('sns_opt_no_nif_sub', lang)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                    <ChevronRight size={14} />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ════ STEP 2 — Process & Requirements ══════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Urgent Alert (No NIF) */}
                            {hasNif === false && (
                                <div className="bg-amber-50 border border-amber-200 rounded-[2.25rem] p-5">
                                    <div className="flex items-start gap-3.5">
                                        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                                                {t('sns_no_nif_alert_title', lang)}
                                            </h4>
                                            <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                                {t('sns_no_nif_alert_text', lang)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Where to get */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm">
                                <div className="flex items-start gap-3.5 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {t('sns_where_label', lang)}
                                        </h4>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                            {t('sns_where_text', lang)}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                    <a
                                        href="https://www.sns24.gov.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:text-rose-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        {t('sns_portal_sns24', lang)}
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://www.sns24.gov.pt/guia/rnu/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:text-rose-700 transition-colors"
                                    >
                                        <ExternalLink size={11} />
                                        {t('sns_rnu_guide', lang)}
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://acaosocial.cm-porto.pt/images/I%E2%80%99m%20sick%20what%20should%20I%20do.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:text-rose-700 transition-colors"
                                        title="Guia oficial da CMP para urgências/cuidados básicos"
                                    >
                                        <ExternalLink size={11} />
                                        {t('sns_estou_doente', lang)}
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://acaosocial.cm-porto.pt/images/Kit_Saude_Mental_Migrantes_OPP.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:text-rose-700 transition-colors"
                                    >
                                        <ExternalLink size={11} />
                                        {t('sns_opp_mental', lang)}
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://gps-vih.pt/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:text-rose-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        GPS VIH/SIDA
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>

                            {/* Process Steps */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('sns_steps_title', lang)}
                                    </h3>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden divide-y divide-slate-50">
                                    {urgencySteps.map((s, idx) => (
                                        <div
                                            key={idx}
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                            className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors animate-in slide-in-from-left-4 duration-500"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xs font-black text-rose-500 shrink-0">
                                                {s.num}
                                            </div>
                                            <p className="flex-1 text-xs font-bold text-slate-700 leading-snug">
                                                {s.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Checklist Container */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('sns_docs_needed', lang)}
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
                                            <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                                <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Form */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('sns_form_label', lang)}
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => onSelectTemplate('sns_inscricao')}
                                        className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:border-rose-500 transition-all duration-300">
                                            <FileText size={18} className="text-rose-500 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                {t('sns_fill_doc', lang)}
                                            </p>
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-rose-500 transition-colors">
                                                {t('sns_inscricao', lang)}
                                            </h4>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500 transition-all duration-300">
                                            <ChevronRight size={14} />
                                        </div>
                                    </button>

                                    <div className="flex items-start gap-2.5 text-[10px] text-rose-600 bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-normal">
                                            {t('wiz_pdf_explicit_notice', lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => { setStep(1); setHasNif(null); }}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-rose-500 hover:text-rose-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('sns_reset', lang)}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
