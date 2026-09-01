// src/components/RevalidationWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, BookOpen, GraduationCap, School, CheckCircle2,
    ChevronRight, Info, FileText, RotateCcw, Sparkles, Globe, ExternalLink,
    Award, Stethoscope, Wrench, ShieldCheck
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

    // ─── 7 Níveis Educativos Completos (Crianças até Doutoramento & Ordens) ───
    const levels = [
        {
            id: 'basic_school',
            emoji: '🎒',
            title: t('edu_level_kids', lang),
            subtitle: t('edu_level_kids_sub', lang),
            category: t('badge_school_basic', lang),
            icon: <School className="w-4 h-4 text-amber-400" />,
            ring: 'hover:ring-amber-400/60',
            glow: 'hover:shadow-amber-500/10',
            badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        },
        {
            id: 'secondary',
            emoji: '🏫',
            title: t('edu_level_secondary', lang),
            subtitle: t('edu_level_secondary_sub', lang),
            category: t('badge_school_secondary', lang),
            icon: <School className="w-4 h-4 text-emerald-500" />,
            ring: 'hover:ring-emerald-400/60',
            glow: 'hover:shadow-emerald-500/10',
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'vocational_technical',
            emoji: '🛠️',
            title: t('edu_level_vocational', lang),
            subtitle: t('edu_level_vocational_sub', lang),
            category: t('badge_vocational', lang),
            icon: <Wrench className="w-4 h-4 text-indigo-400" />,
            ring: 'hover:ring-indigo-400/60',
            glow: 'hover:shadow-indigo-500/10',
            badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        },
        {
            id: 'higher_bachelor',
            emoji: '🎓',
            title: t('edu_level_bachelor', lang),
            subtitle: t('edu_level_bachelor_sub', lang),
            category: t('badge_university_1st', lang),
            icon: <GraduationCap className="w-4 h-4 text-teal-400" />,
            ring: 'hover:ring-teal-400/60',
            glow: 'hover:shadow-teal-500/10',
            badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        },
        {
            id: 'higher_master',
            emoji: '📜',
            title: t('edu_level_master', lang),
            subtitle: t('edu_level_master_sub', lang),
            category: t('badge_university_2nd', lang),
            icon: <Award className="w-4 h-4 text-blue-400" />,
            ring: 'hover:ring-blue-400/60',
            glow: 'hover:shadow-blue-500/10',
            badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        },
        {
            id: 'higher_doctorate',
            emoji: '🔬',
            title: t('edu_level_doctorate', lang),
            subtitle: t('edu_level_doctorate_sub', lang),
            category: t('badge_university_3rd', lang),
            icon: <Sparkles className="w-4 h-4 text-purple-400" />,
            ring: 'hover:ring-purple-400/60',
            glow: 'hover:shadow-purple-500/10',
            badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        },
        {
            id: 'regulated_professions',
            emoji: '⚕️',
            title: t('edu_level_regulated', lang),
            subtitle: t('edu_level_regulated_sub', lang),
            category: t('badge_regulated_orders', lang),
            icon: <Stethoscope className="w-4 h-4 text-rose-400" />,
            ring: 'hover:ring-rose-400/60',
            glow: 'hover:shadow-rose-500/10',
            badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        }
    ];

    const currentLevelObj = levels.find(l => l.id === educationLevel) || levels[0];

    // ─── Documentos & Checklist Especializados por Nível ─────────────────────
    const getChecklistDocs = (lvl: string) => {
        switch (lvl) {
            case 'basic_school':
                return [
                    { icon: '🛂', text: t('req_passport', lang) + ' (' + t('edu_doc_minor_guardian', lang) + ')' },
                    { icon: '🩺', text: t('req_vaccines', lang) },
                    { icon: '🏠', text: t('req_proof_address', lang) },
                    { icon: '📜', text: t('req_school_transcripts', lang) },
                    { icon: '🎯', text: t('req_school_diagnostic_test', lang) }
                ];
            case 'secondary':
                return [
                    { icon: '📜', text: t('req_apostilled_diploma', lang) },
                    { icon: '📋', text: t('req_secondary_transcripts', lang) },
                    { icon: '🌐', text: t('req_translation_certified_note', lang) },
                    { icon: '🛂', text: t('req_passport', lang) + ' & NIF' },
                    { icon: '⚖️', text: t('req_dge_grade_conversion', lang) }
                ];
            case 'vocational_technical':
                return [
                    { icon: '📜', text: t('req_technical_diploma_apostilled', lang) },
                    { icon: '📋', text: t('req_technical_transcripts', lang) },
                    { icon: '💼', text: t('req_internship_work_proof', lang) },
                    { icon: '🌐', text: t('req_translation_certified', lang) },
                    { icon: '🛂', text: t('req_passport', lang) + ' & NIF' }
                ];
            case 'higher_bachelor':
                return [
                    { icon: '📜', text: t('req_bachelor_diploma_apostilled', lang) },
                    { icon: '📋', text: t('req_transcripts', lang) },
                    { icon: '📖', text: t('req_program_syllabi', lang) },
                    { icon: '🌐', text: t('req_translation_certified', lang) },
                    { icon: '🛂', text: t('req_passport', lang) + ' & NIF' }
                ];
            case 'higher_master':
                return [
                    { icon: '📜', text: t('req_master_diploma_apostilled', lang) },
                    { icon: '📋', text: t('req_transcripts', lang) },
                    { icon: '📑', text: t('req_master_dissertation', lang) },
                    { icon: '🏛️', text: t('req_master_defense_minutes', lang) },
                    { icon: '🛂', text: t('req_passport', lang) + ' & NIF' }
                ];
            case 'higher_doctorate':
                return [
                    { icon: '📜', text: t('req_phd_diploma_apostilled', lang) },
                    { icon: '📚', text: t('req_phd_thesis', lang) },
                    { icon: '🔬', text: t('req_scientific_cv', lang) },
                    { icon: '🏛️', text: t('req_phd_defense_minutes', lang) },
                    { icon: '🛂', text: t('req_passport', lang) + ' & NIF' }
                ];
            case 'regulated_professions':
                return [
                    { icon: '📜', text: t('req_regulated_specific_recognition', lang) },
                    { icon: '📋', text: t('req_transcripts', lang) + ' & ' + t('req_program_syllabi', lang) },
                    { icon: '🏛️', text: t('req_good_standing', lang) },
                    { icon: '⚖️', text: t('req_criminal_record', lang) },
                    { icon: '🩺', text: t('req_regulated_exams', lang) }
                ];
            default:
                return [
                    { icon: '📜', text: t('req_apostilled_diploma', lang) },
                    { icon: '📋', text: t('req_transcripts', lang) },
                    { icon: '🌐', text: t('req_translation_certified', lang) },
                    { icon: '🛂', text: t('req_passport', lang) }
                ];
        }
    };

    // ─── Templates de Documentos por Nível ───────────────────────────────────
    const getDocIds = (lvl: string) => {
        switch (lvl) {
            case 'basic_school':
                return ['school_enrollment_kids'];
            case 'secondary':
                return ['dge_secundario_equivalencia', 'revalidacao_diploma_equivalencia'];
            case 'vocational_technical':
                return ['revalidacao_diploma_tecnico', 'revalidacao_diploma_extranjero'];
            case 'higher_bachelor':
                return ['dges_reconhecimento', 'revalidacao_diploma_autenticacao', 'revalidacao_diploma_extranjero'];
            case 'higher_master':
                return ['revalidacao_grau_mestre', 'dges_reconhecimento'];
            case 'higher_doctorate':
                return ['revalidacao_grau_doutoramento', 'dges_reconhecimento'];
            case 'regulated_professions':
                return ['revalidacao_profissao_regulamentada', 'revalidacao_diploma_autenticacao', 'dges_reconhecimento'];
            default:
                return ['dges_reconhecimento', 'revalidacao_diploma_autenticacao'];
        }
    };

    // ─── Alertas e Textos Institucionais ─────────────────────────────────────
    const getAlertInfo = (lvl: string) => {
        switch (lvl) {
            case 'basic_school':
                return {
                    title: t('edu_alert_basic_title', lang),
                    text: t('edu_alert_basic_text', lang)
                };
            case 'secondary':
                return {
                    title: t('edu_alert_secondary_title', lang),
                    text: t('edu_alert_secondary_text', lang)
                };
            case 'vocational_technical':
                return {
                    title: t('edu_alert_vocational_title', lang),
                    text: t('edu_alert_vocational_text', lang)
                };
            case 'higher_bachelor':
                return {
                    title: t('edu_alert_bachelor_title', lang),
                    text: t('edu_alert_bachelor_text', lang)
                };
            case 'higher_master':
                return {
                    title: t('edu_alert_master_title', lang),
                    text: t('edu_alert_master_text', lang)
                };
            case 'higher_doctorate':
                return {
                    title: t('edu_alert_doctorate_title', lang),
                    text: t('edu_alert_doctorate_text', lang)
                };
            case 'regulated_professions':
                return {
                    title: t('edu_alert_regulated_title', lang),
                    text: t('edu_alert_regulated_text', lang)
                };
            default:
                return {
                    title: t('edu_step2_alert_title', lang),
                    text: t('edu_step2_alert_text', lang)
                };
        }
    };

    const alertData = getAlertInfo(educationLevel);
    const checklistDocs = getChecklistDocs(educationLevel);
    const docIds = getDocIds(educationLevel);

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
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{currentLevelObj.emoji}</span>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-tight">
                                    {currentLevelObj.title}
                                </h2>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {alertData.title}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — Education Level Selection (7 Níveis) ═══════ */}
                    {step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {levels.map((level, idx) => (
                                <button
                                    key={level.id}
                                    onClick={() => { setEducationLevel(level.id); handleNext(); }}
                                    style={{ animationDelay: `${idx * 40}ms` }}
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
                                                {level.category}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-slate-950 transition-colors">
                                            {level.title}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-bold leading-snug line-clamp-2 mt-0.5">
                                            {level.subtitle}
                                        </p>
                                    </div>

                                    {/* Arrow Button */}
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                        <ChevronRight size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 2 — Checklist, Portais & Formulários ═══════════ */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Alert Box Institucional */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                        <Info size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                            {alertData.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                            {alertData.text}
                                        </p>
                                    </div>
                                </div>

                                {/* Portais Oficiais de Consulta Direta */}
                                <div className="pt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                    {educationLevel === 'basic_school' && (
                                        <>
                                            <a
                                                href="https://portaldasmatriculas.dgeste.mec.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_matriculas', lang)}
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
                                                href="https://www.dge.mec.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_dge', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                        </>
                                    )}

                                    {educationLevel === 'secondary' && (
                                        <>
                                            <a
                                                href="https://www.dge.mec.pt/equivalencias-estrangeiras"
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
                                                href="https://www.dges.gov.pt/pt/pagina/concurso-especial-para-estudantes-internacionais"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <ExternalLink size={11} />
                                                {t('reval_portal_dges', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                        </>
                                    )}

                                    {educationLevel === 'vocational_technical' && (
                                        <>
                                            <a
                                                href="https://www.anqep.gov.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_anqep', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
                                            <a
                                                href="https://www.passaportequalifica.gov.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <ExternalLink size={11} />
                                                {t('reval_passaporte_qualifica', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                        </>
                                    )}

                                    {(educationLevel === 'higher_bachelor' || educationLevel === 'higher_master') && (
                                        <>
                                            <a
                                                href="https://www.dges.gov.pt/pt/pagina/reconhecimento"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_recnre', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
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
                                        </>
                                    )}

                                    {educationLevel === 'higher_doctorate' && (
                                        <>
                                            <a
                                                href="https://www.dges.gov.pt/pt/pagina/reconhecimento"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_recnre', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
                                            <a
                                                href="https://www.fct.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_fct', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                        </>
                                    )}

                                    {educationLevel === 'regulated_professions' && (
                                        <>
                                            <a
                                                href="https://www.acss.min-saude.pt"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_acss', lang)}
                                                <ExternalLink size={10} />
                                            </a>
                                            <span className="text-slate-200">|</span>
                                            <a
                                                href="https://www.dges.gov.pt/pt/pagina/reconhecimento-especifico"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                            >
                                                <Globe size={11} />
                                                {t('reval_portal_recnre', lang)}
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
                                            style={{ animationDelay: `${idx * 40}ms` }}
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

                            {/* Formulários Recomendados & Gerador de PDF */}
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
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        );
                                    })}

                                    <div className="flex items-start gap-2.5 text-[10px] text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <ShieldCheck size={14} className="shrink-0 mt-0.5 text-emerald-600" />
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
