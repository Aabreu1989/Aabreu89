// src/components/RevalidationWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, BookOpen, GraduationCap, School, CheckCircle2,
    ChevronRight, Info, FileText, RotateCcw, Sparkles, Globe, ExternalLink
} from 'lucide-react';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { templates } from '../utils/documentsDatabase';

interface RevalidationWizardProps {
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
                        ? 'w-6 h-2 bg-emerald-400 shadow-md shadow-emerald-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-emerald-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-emerald-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

export const RevalidationWizard: React.FC<RevalidationWizardProps> = ({
    language,
    onBack,
    onSelectTemplate,
}) => {
    const [step, setStep] = useState(1);
    const [educationLevel, setEducationLevel] = useState<string>('');

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
        else onBack();
    };

    const lang = language?.toLowerCase() || 'pt';

    const levels = [
        {
            id: 'secondary',
            emoji: '🏫',
            title: t('edu_level_secondary', lang),
            icon: <School className="w-4 h-4 text-emerald-500" />,
            ring: 'hover:ring-emerald-400/60',
            glow: 'hover:shadow-emerald-500/10',
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'higher',
            emoji: '🎓',
            title: t('edu_level_higher', lang),
            icon: <GraduationCap className="w-4 h-4 text-teal-400" />,
            ring: 'hover:ring-teal-400/60',
            glow: 'hover:shadow-teal-500/10',
            badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        },
        {
            id: 'school_enrollment',
            emoji: '🎒',
            title: t('edu_level_kids', lang),
            icon: <School className="w-4 h-4 text-amber-400" />,
            ring: 'hover:ring-amber-400/60',
            glow: 'hover:shadow-amber-500/10',
            badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        }
    ];

    const checklistDocs = educationLevel === 'school_enrollment'
        ? [
            { icon: '🛂', text: t('req_passport', lang) + t('edu_doc_minor_guardian', lang) },
            { icon: '🩺', text: t('req_vaccines', lang) },
            { icon: '🏠', text: t('req_proof_address', lang) },
            { icon: '📜', text: t('req_school_transcripts', lang) }
          ]
        : [
            { icon: '📜', text: t('req_apostilled_diploma', lang) },
            { icon: '📋', text: educationLevel === 'higher' ? t('req_transcripts', lang) : t('req_secondary_transcripts', lang) },
            { icon: '🌐', text: t('req_translation_certified', lang) },
            { icon: '🛂', text: t('req_passport', lang) }
          ];

    const docIds = educationLevel === 'higher'
        ? ['revalidacao_diploma_autenticacao', 'revalidacao_diploma_extranjero', 'dges_reconhecimento']
        : educationLevel === 'school_enrollment'
        ? ['school_enrollment_kids']
        : ['revalidacao_diploma_equivalencia', 'dge_secundario_equivalencia'];

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-emerald-600/5 rounded-full blur-[60px] pointer-events-none" />

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
                        <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            ✦ {step}/2
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<BookOpen size={10} />}
                            text={t('jornadas_education_title', lang)}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('edu_step1_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('edu_step1_desc_v3', lang)}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {educationLevel === 'higher'
                                    ? t('edu_level_higher', lang)
                                    : educationLevel === 'school_enrollment'
                                    ? t('edu_level_kids', lang)
                                    : t('edu_level_secondary', lang)
                                }
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {educationLevel === 'school_enrollment'
                                    ? t('edu_level_kids_badge', lang)
                                    : t('edu_step2_alert_title', lang)
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — Education Level ═════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {levels.map((level, idx) => (
                                <button
                                    key={level.id}
                                    onClick={() => { setEducationLevel(level.id); handleNext(); }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className={`
                                        group w-full animate-in slide-in-from-bottom-4 duration-500
                                        bg-white border border-slate-100 rounded-[2.25rem]
                                        p-5 flex items-center gap-4 text-left transition-all duration-500
                                        hover:border-slate-200 active:scale-[0.97]
                                        hover:shadow-2xl hover:shadow-slate-200/50 ${level.ring} ${level.glow}
                                    `}
                                >
                                    {/* Icon Box */}
                                    <div className="relative w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        <span>{level.emoji}</span>
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full ${level.badge}`}>
                                                {level.id === 'higher' ? t('badge_university', lang) : t('badge_school', lang)}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-slate-950 transition-colors">
                                            {level.title}
                                        </h4>
                                    </div>

                                    {/* Arrow Button */}
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                        <ChevronRight size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 2 — Checklist & Forms ═══════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Alert Box */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                        <Info size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                            {educationLevel === 'school_enrollment'
                                                ? t('edu_step2_alert_kids_title', lang)
                                                : t('edu_step2_alert_title', lang)}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            {educationLevel === 'school_enrollment'
                                                ? t('edu_step2_alert_kids_text', lang)
                                                : t('edu_step2_alert_text', lang)}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                    {educationLevel === 'higher' && (
                                        <a
                                            href="https://www.dges.gov.pt"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                        >
                                            <Globe size={11} />
                                            {t('reval_portal_dges', lang)}
                                            <ExternalLink size={10} />
                                        </a>
                                    )}
                                    {educationLevel === 'secondary' && (
                                        <a
                                            href="https://www.dge.mec.pt"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                        >
                                            <Globe size={11} />
                                            {t('reval_portal_dge', lang)}
                                            <ExternalLink size={10} />
                                        </a>
                                    )}
                                    {educationLevel === 'school_enrollment' && (
                                        <>
                                            <a
                                                href="https://www.dge.mec.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_dge', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
                                            <a
                                                href="https://www.seg-social.pt/creche-feliz"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <ExternalLink size={11} />
                                                {t('reval_creche_feliz', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
                                            <a
                                                href="https://acaosocial.cm-porto.pt/images/Kit_Ferramentas_Inclusao_Intercultural_RPCI.pdf"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <ExternalLink size={11} />
                                                {t('reval_kit_inclusion', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
                                            <a
                                                href="https://acaosocial.cm-porto.pt/images/Abordagem_Intercultural_Escolas_Professores_RPCI.pdf"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <ExternalLink size={11} />
                                                {t('reval_guide_intercultural', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Checklist Container */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('edu_checklist_title', lang)}
                                    </h3>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden divide-y divide-slate-50">
                                    {checklistDocs.map((doc, idx) => (
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
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Forms */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('edu_forms_title', lang)}
                                    </h3>
                                </div>

                                <div className="space-y-2.5">
                                    {docIds.map((docId, idx) => {
                                        const template = templates.find(t => t.id === docId);
                                        if (!template) return null;

                                        return (
                                            <button
                                                key={docId}
                                                onClick={() => onSelectTemplate(docId)}
                                                style={{ animationDelay: `${idx * 80}ms` }}
                                                className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all duration-300">
                                                    <FileText size={18} className="text-emerald-500 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                        {t('edu_fill_doc', lang)}
                                                    </p>
                                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-emerald-500 transition-colors">
                                                        <TranslatedText text={template.title} language={language} shouldTranslate={language !== 'PT'} />
                                                    </h4>
                                                </div>
                                                <div className="w-9 h-9 rounded-xl bg-slate-55 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        );
                                    })}

                                    <div className="flex items-start gap-2.5 text-[10px] text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-normal">
                                            {t('wiz_pdf_explicit_notice', lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => { setStep(1); setEducationLevel(''); }}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('edu_reset', lang)}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
