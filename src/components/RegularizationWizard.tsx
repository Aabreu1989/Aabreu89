// src/components/RegularizationWizard.tsx
import React, { useState, useMemo, memo } from "react";
import {
    ChevronRight, ArrowLeft, CheckCircle2, FileText, Info,
    Landmark, AlertCircle, Volume2, UserX, UserCheck, Briefcase,
    GraduationCap, Users, ShieldCheck, Sparkles, RotateCcw, Zap, Globe, ExternalLink,
    ChevronDown, ChevronUp
} from "lucide-react";
import { t } from "../utils/translations";
import { audioService } from "../services/audioService";
import { PATHWAY_DOCS_DETAIL_GUIDE } from "../utils/visaDocumentsDatabase";

interface WizardProps {
    language: string;
    onSelectTemplate: (templateId: string) => void;
    onGoToDocs: () => void;
    initialChoice?: string;
    onBack?: () => void;
}

type SituationId = "legal" | "irregular" | "contract" | "student" | "family" | "via_verde" | "asylum" | "voluntary_return" | "visa_consular" | "retirement";
type OriginId = "cplp" | "eu" | "other";
type PurposeId = "art88" | "art89" | "art90a" | "art122" | "humanitarian" | "visa_d7" | "visa_d4" | "visa_job_search";

const OFFICIAL_LINKS = {
    AIMA: "https://aima.gov.pt",
    GOV_PT_RESIDENCE: "https://www.gov.pt/pt/servicos/centros-nacionais-de-apoio-a-integracao-de-migrantes-cnaim-",
    DGES: "https://www.dges.gov.pt",
    SNS: "https://www.sns.gov.pt"
};

const TEMPLATE_META: Record<string, string> = {
    aima_ar_temp: "aima_ar_temp",
    aima_renewal: "aima_renewal",
    crue_req: "crue_req",
    nif_req: "nif_req",
    ss_niss: "ss_niss",
    aima_dec_sustento: "aima_dec_sustento",
    aima_dec_alojamento: "aima_dec_alojamento",
    aima_dec_responsabilidade: "aima_dec_responsabilidade",
    certidao_civil_req: "certidao_civil_req",
    work_contract_template: "work_contract_template",
    nomad_income_proof: "nomad_income_proof",
    aima_deferimento_tacito: "aima_deferimento_tacito",
    aima_audiencia_previa: "aima_audiencia_previa",
    promessa_trabalho_art88: "promessa_trabalho_art88",
    sef_declaracao_entrada: "sef_declaracao_entrada",
    aima_asilo_req: "aima_asilo_req",
    aima_refugiado_status: "aima_refugiado_status"
};

// ─── Step Indicator Dots ─────────────────────────────────────────────────────
const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-orange-400 shadow-md shadow-orange-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-orange-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-orange-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

// Choice button component for DRY rendering in premium style
const ChoiceButton = ({ icon, label, badgeText, onClick, idx, isRevoked }: {
    icon: React.ReactNode;
    label: string;
    badgeText?: string;
    onClick: () => void;
    idx: number;
    isRevoked?: boolean;
}) => (
    <button
        onClick={onClick}
        style={{ animationDelay: `${idx * 60}ms` }}
        className={`group w-full animate-in slide-in-from-bottom-4 duration-500 bg-white border rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/5 active:scale-[0.97]
            ${isRevoked 
                ? 'border-amber-200/80 hover:border-amber-400/50 shadow-sm' 
                : 'border-slate-100 hover:border-orange-400/30 shadow-sm'}`}
    >
        {/* Icon Box */}
        <div className={`relative w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500
            ${isRevoked
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-slate-50 border-slate-100 text-slate-600'}`}
        >
            {icon}
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
                {badgeText && (
                    <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full
                        ${isRevoked
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}
                    >
                        {badgeText}
                    </span>
                )}
                {isRevoked && (
                    <span className="px-2 py-0.5 text-[7px] font-black uppercase tracking-wider bg-amber-500 text-white rounded-md">
                        Pendente de Alteração
                    </span>
                )}
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                {label}
            </h4>
        </div>

        {/* Arrow Button */}
        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
            <ChevronRight size={14} />
        </div>
    </button>
);

export const RegularizationWizard: React.FC<WizardProps> = memo(({
    language,
    onSelectTemplate,
    onGoToDocs,
    initialChoice,
    onBack,
}) => {
    const [step, setStep] = useState<number>(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [activeDocTip, setActiveDocTip] = useState<string | null>(null);

    const handleAnswer = (key: string, value: string) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        audioService.playClick();
        if (key === 'situation' && (value === 'asylum' || value === 'voluntary_return' || value === 'retirement' || value === 'via_verde')) {
            setStep(4);
        } else {
            setStep(prev => prev + 1);
        }
    };

    React.useEffect(() => {
        if (initialChoice && step === 1) {
            if (initialChoice === 'visa_job_search') {
                setAnswers({
                    situation: 'visa_consular',
                    origin: 'other',
                    purpose: 'visa_job_search'
                });
                setStep(4);
            } else if (initialChoice === 'asylum' || initialChoice === 'voluntary_return' || initialChoice === 'retirement') {
                handleAnswer('situation', initialChoice);
            } else if (['legal', 'irregular', 'contract', 'student', 'family', 'visa_consular'].includes(initialChoice)) {
                handleAnswer('situation', initialChoice);
            }
        }
    }, [initialChoice, step]);


    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
            audioService.playClick();
        } else if (onBack) {
            audioService.playClick();
            onBack();
        }
    };

    const resetWizard = () => {
        setStep(1);
        setAnswers({});
        audioService.playClick();
    };

    const getChecklist = useMemo(() => {
        const sit = answers.situation as SituationId | undefined;
        const origin = answers.origin as OriginId | undefined;
        const purpose = answers.purpose as PurposeId | undefined;

        const result = {
            title: t("wiz_fallback_title", language),
            desc: t("wiz_fallback_desc", language),
            steps: [
                t("wiz_fallback_step1", language),
                t("wiz_fallback_step2", language),
                t("wiz_fallback_step3", language)
            ],
            docs: ["nif_req", "ss_niss"],
            needsConsularVisa: false,
            needsAIMAAppointment: true,
            infoNote: "",
            warnings: [] as string[]
        };

        if (sit === "voluntary_return") {
            result.title = t("wiz_voluntary_return_title", language);
            result.desc = t("wiz_voluntary_return_desc", language);
            result.steps = [
                t("wiz_voluntary_return_step1", language),
                t("wiz_voluntary_return_step2", language),
                t("wiz_voluntary_return_step3", language)
            ];
            result.docs = [];
            result.needsConsularVisa = false;
            result.needsAIMAAppointment = false;
            result.infoNote = t("wiz_voluntary_return_note", language);
        } else if (origin === "eu") {
            result.title = t("wiz_eu_title", language);
            result.desc = t("wiz_eu_desc", language);
            result.steps = [t("wiz_eu_step1", language), t("wiz_eu_step2", language), t("wiz_eu_step3", language)];
            result.docs = ["crue_req", "nif_req"];
            result.needsAIMAAppointment = false;
        } else if (purpose === "art88" || purpose === "art89") {
            result.title = t("wiz_work_title", language);
            result.desc = t("wiz_work_desc", language);
            result.steps = [t("wiz_work_step1", language), t("wiz_work_step2", language), t("wiz_work_step3", language)];
            result.docs = ["nif_req", "ss_niss"];
            result.needsConsularVisa = true;
        } else if (sit === "irregular") {
            result.title = t("wiz_fallback_title", language);
            result.desc = t("wiz_fallback_desc", language);
            result.steps = [t("wiz_fallback_step1", language), t("wiz_fallback_step2", language), t("wiz_fallback_step3", language)];
            result.docs = ["nif_req", "ss_niss"];
            result.needsConsularVisa = true;
        } else if (purpose === "art90a") {
            result.title = t("wiz_nomad_title", language);
            result.desc = t("wiz_nomad_desc", language);
            result.steps = [t("wiz_nomad_step1", language), t("wiz_nomad_step2", language), t("wiz_nomad_step3", language)];
            result.docs = ["nomad_income_proof", "nif_req"];
        } else if (sit === "retirement" || purpose === "visa_d7") {
            result.title = t("wiz_d7_title", language);
            result.desc = t("wiz_d7_desc", language);
            result.steps = [t("wiz_d7_step1", language), t("wiz_d7_step2", language), t("wiz_d7_step3", language)];
            result.docs = ["nomad_income_proof", "nif_req"];
            result.needsConsularVisa = true;
        } else if (purpose === "visa_d4") {
            result.title = t("wiz_d4_title", language);
            result.desc = t("wiz_d4_desc", language);
            result.steps = [t("wiz_d4_step1", language), t("wiz_d4_step2", language), t("wiz_d4_step3", language)];
            result.docs = ["nif_req"];
            result.needsConsularVisa = true;
        } else if (purpose === "visa_job_search") {
            result.title = t("wiz_job_search_title", language);
            result.desc = t("wiz_job_search_desc", language);
            result.steps = [t("wiz_job_search_step1", language), t("wiz_job_search_step2", language), t("wiz_job_search_step3", language)];
            result.docs = ["nif_req", "ss_niss"];
            result.needsConsularVisa = true;
        } else if (sit === "via_verde") {
            result.title = t("wiz_via_verde_title", language);
            result.desc = t("wiz_via_verde_desc", language);
            result.steps = [
                t("wiz_via_verde_step1", language),
                t("wiz_via_verde_step2", language),
                t("wiz_via_verde_step3", language)
            ];
            result.docs = ["work_contract_template", "aima_dec_responsabilidade", "nif_req", "ss_niss"];
            result.needsConsularVisa = true;
            result.needsAIMAAppointment = true;
            result.infoNote = language === 'pt' 
                ? "Canal prioritário para contratação de trabalhadores estrangeiros por empresas com parecer célere AIMA/IEFP." 
                : "Priority channel for hiring foreign workers with fast-track consular and AIMA processing.";
        } else if (purpose === "art122") {
            result.title = t("wiz_art122_title", language);
            result.desc = t("wiz_art122_desc", language);
            result.steps = [t("wiz_art122_step1", language), t("wiz_art122_step2", language), t("wiz_art122_step3", language)];
            result.docs = ["aima_dec_responsabilidade", "aima_dec_alojamento", "certidao_civil_req"];
        } else if (sit === "family") {
            result.title = t("wiz_family_title", language);
            result.desc = t("wiz_family_desc", language);
            result.steps = [t("wiz_family_step1", language), t("wiz_family_step2", language), t("wiz_family_step3", language)];
            result.docs = ["aima_dec_responsabilidade", "aima_dec_alojamento", "aima_dec_sustento", "certidao_civil_req", "nif_req"];
            result.needsAIMAAppointment = true;
        } else if (purpose === "humanitarian" || sit === "asylum") {
            result.title = t("wiz_sit_asylum", language);
            result.desc = t("wiz_purp_humanitarian_desc", language);
            result.steps = [
                t("wiz_purp_humanitarian_step1", language),
                t("wiz_purp_humanitarian_step2", language),
                t("wiz_purp_humanitarian_step3", language)
            ];
            result.docs = ["aima_asilo_req", "aima_refugiado_status", "ss_niss"];
            result.infoNote = t("wiz_humanitarian_note", language);
        }

        if (sit === "contract" || sit === "student") {
            if (!result.docs.includes("aima_deferimento_tacito")) {
                result.docs.push("aima_deferimento_tacito");
            }
        }

        if (sit !== "voluntary_return" && !result.docs.includes("aima_audiencia_previa")) {
            result.docs.push("aima_audiencia_previa");
        }

        // 📝 MIRA LEGISLATIVO: Telemetria de acompanhamento parlamentar em tempo real
        const warningsList: string[] = [];
        if (sit === "family" || purpose === "art122") {
            warningsList.push(
                language.toLowerCase() === 'pt' 
                    ? "AVISO LEGISLATIVO: Existem propostas em apreciação parlamentar sobre a regularização por filho menor (Artigo 122). Este procedimento encontra-se pendente de alteração regulamentar." 
                    : "LEGISLATIVE NOTICE: Proposals are currently under parliamentary review regarding regularization via minor children (Article 122). This pathway is pending legislative amendment."
            );
        }
        if (sit === "student" || purpose === "visa_d4") {
            warningsList.push(
                language.toLowerCase() === 'pt'
                    ? "AVISO LEGISLATIVO: Existem propostas em análise para alteração das regras de cursos profissionais. Acompanhe os desenvolvimentos e consulte sempre os canais oficiais."
                    : "LEGISLATIVE NOTICE: Proposed changes exist regarding professional course rules. Monitor ongoing legislative proceedings."
            );
        }
        if (sit === "contract" || sit === "student" || result.docs.includes("aima_deferimento_tacito")) {
            warningsList.push(
                language.toLowerCase() === 'pt'
                    ? "AVISO LEGAL: A aplicação do 'Deferimento Tácito' encontra-se em debate legislativo e pendente de regulamentação e decisão final."
                    : "LEGAL NOTICE: The application of 'Tacit Deferral' is under parliamentary debate and pending final legislative decision."
            );
        }
        result.warnings = warningsList;

        return result;
    }, [answers, language]);

    const getTemplateName = (id: string) => {
        const key = TEMPLATE_META[id] || id;
        return t(key, language);
    };

    const isStep1Done = step > 1;
    const isStep2Done = step > 2;

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-orange-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-orange-600/5 rounded-full blur-[60px] pointer-events-none" />

                {/* Sticky Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    {step <= 3 && <StepDots total={3} current={step} />}

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-orange-400 animate-pulse" />
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                            ✦ {step <= 3 ? `${step}/3` : t('wizard_result', language)}
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<ShieldCheck size={10} />}
                            text={t('jornadas_legal_title', language)}
                        />
                    </div>

                    {step === 1 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t("wizard_step0_q", language)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t("wizard_step0_h", language)}
                            </p>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('wizard_step1_q', language)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('wizard_step1_h', language)}
                            </p>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t("wizard_step3_q", language)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t("wizard_step3_h", language)}
                            </p>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('wizard_plan_title', language)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {getChecklist.title}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {[
                                { id: 'visa_consular', label: t("wiz_sit_visa_consular", language), icon: <Globe size={18} className="text-sky-500" />, badge: t('badge_visa_consular', language) },
                                { id: 'via_verde',     label: t("wiz_sit_via_verde", language),     icon: <Zap size={18} className="text-amber-500" />,   badge: t('badge_via_verde', language) },
                                { id: 'legal',         label: t("wiz_sit_legal", language),         icon: <UserCheck size={18} className="text-emerald-500" />, badge: t('badge_valid_visa', language) },
                                { id: 'irregular',     label: t("wiz_sit_irregular", language),     icon: <UserX size={18} className="text-red-500" />,         badge: t('badge_no_visa', language) },
                                { id: 'contract',      label: t("wiz_sit_contract", language),      icon: <Briefcase size={18} className="text-blue-500" />,    badge: t('badge_work_contract', language) },
                                { id: 'student',       label: t("wiz_sit_student", language),       icon: <GraduationCap size={18} className="text-red-500 animate-pulse" />, badge: t('badge_study_research', language), isRevoked: true },
                                { id: 'family',        label: t("wiz_sit_family", language),        icon: <Users size={18} className="text-indigo-500" />,        badge: t('badge_reunification', language) },
                                { id: 'asylum',        label: t("wiz_sit_asylum", language),        icon: <ShieldCheck size={18} className="text-purple-500" />, badge: t('badge_asylum_refugee', language) },
                                { id: 'retirement',    label: t("wiz_sit_retirement", language),    icon: <Landmark size={18} className="text-amber-500" />, badge: t('badge_retirement', language) },
                                { id: 'voluntary_return', label: t("wiz_sit_voluntary_return", language), icon: <RotateCcw size={18} className="text-amber-500" />, badge: t('badge_voluntary_return', language) }
                            ].map((opt, idx) => (
                                <ChoiceButton
                                    key={opt.id}
                                    icon={opt.icon}
                                    label={opt.label}
                                    badgeText={opt.badge}
                                    onClick={() => handleAnswer('situation', opt.id)}
                                    idx={idx}
                                    isRevoked={opt.isRevoked}
                                />
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 2 — Origin ════════════════════──────────────── */}
                    {step === 2 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {[
                                { id: 'cplp',  label: t('wizard_step1_cplp', language),  icon: <Sparkles size={18} className="text-orange-500" />, badge: t('badge_cplp_agreement', language) },
                                { id: 'eu',    label: t('wizard_step1_eu', language),    icon: <ShieldCheck size={18} className="text-blue-500" />, badge: t('badge_eu_union', language) },
                                { id: 'other', label: t('wizard_step1_other', language), icon: <Landmark size={18} className="text-slate-500" />,  badge: t('badge_other_countries', language) }
                            ].map((opt, idx) => (
                                <ChoiceButton
                                    key={opt.id}
                                    icon={opt.icon}
                                    label={opt.label}
                                    badgeText={opt.badge}
                                    onClick={() => handleAnswer('origin', opt.id)}
                                    idx={idx}
                                />
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 3 — Purpose ═══════════════════──────────────── */}
                    {step === 3 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {(answers.situation === "visa_consular"
                                ? [
                                    { id: 'visa_job_search', label: t("wiz_purp_visa_job_search", language), icon: <Briefcase size={18} className="text-teal-500" />,  badge: t('badge_visa_job_search', language) },
                                    { id: 'art88',           label: t("wiz_purp_art88_consular", language),  icon: <Briefcase size={18} className="text-emerald-500" />,  badge: t('badge_dependent_work_consular', language) },
                                    { id: 'art90a',          label: t("wiz_purp_art90a", language),          icon: <Globe size={18} className="text-purple-500" />,       badge: t('badge_digital_nomad', language) },
                                    { id: 'visa_d7',         label: t("wiz_purp_visa_d7", language),         icon: <Landmark size={18} className="text-amber-500" />,     badge: t('badge_visa_d7', language) },
                                    { id: 'visa_d4',         label: t("wiz_purp_visa_d4", language),         icon: <GraduationCap size={18} className="text-red-500 animate-pulse" />, badge: t('badge_visa_d4', language), isRevoked: true },
                                    { id: 'art89',           label: t("wiz_purp_art89", language),           icon: <Sparkles size={18} className="text-blue-500" />,       badge: t('badge_independent_work', language) }
                                  ]
                                : [
                                    { id: 'art88',           label: t("wiz_purp_art88", language),           icon: <Briefcase size={18} className="text-emerald-500" />,  badge: t('badge_dependent_work', language) },
                                    { id: 'art89',           label: t("wiz_purp_art89", language),           icon: <Sparkles size={18} className="text-blue-500" />,       badge: t('badge_independent_work', language) },
                                    { id: 'art90a',          label: t("wiz_purp_art90a", language),          icon: <Globe size={18} className="text-purple-500" />,       badge: t('badge_digital_nomad', language) },
                                    { id: 'visa_d7',         label: t("wiz_purp_visa_d7", language),         icon: <Landmark size={18} className="text-amber-500" />,     badge: t('badge_visa_d7', language) },
                                    { id: 'visa_d4',         label: t("wiz_purp_visa_d4", language),         icon: <GraduationCap size={18} className="text-red-500 animate-pulse" />, badge: t('badge_visa_d4', language), isRevoked: true },
                                    { id: 'visa_job_search', label: t("wiz_purp_visa_job_search", language), icon: <Briefcase size={18} className="text-teal-500" />,  badge: t('badge_visa_job_search', language) },
                                    { id: 'art122',          label: t("wiz_purp_art122", language),          icon: <Users size={18} className="text-red-500 animate-pulse" />,           badge: t('badge_reunification_others', language), isRevoked: true },
                                    { id: 'humanitarian',    label: t("wiz_purp_humanitarian", language),    icon: <ShieldCheck size={18} className="text-slate-500" />,   badge: t('badge_humanitarian_reasons', language) }
                                  ]
                            ).map((opt, idx) => (
                                <ChoiceButton
                                    key={opt.id}
                                    icon={opt.icon}
                                    label={opt.label}
                                    badgeText={opt.badge}
                                    onClick={() => handleAnswer('purpose', opt.id)}
                                    idx={idx}
                                    isRevoked={opt.isRevoked}
                                />
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 4 — Result Checklist ═════════──────────────── */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Description Banner & Alerts */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-4">
                                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                    {getChecklist.desc}
                                </p>

                                {getChecklist.warnings && getChecklist.warnings.length > 0 && (
                                    <div className="space-y-3">
                                        {getChecklist.warnings.map((w, idx) => (
                                            <div key={idx} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3.5 items-start">
                                                <AlertCircle className="text-rose-500 mt-0.5 shrink-0" size={16} />
                                                <div className="space-y-1">
                                                    <h4 className="text-[8.5px] font-black uppercase tracking-widest text-rose-600 font-mono">Alteração de Lei (Parlamento)</h4>
                                                    <p className="text-xs text-rose-800 font-bold leading-normal">
                                                        {w}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {getChecklist.infoNote && (
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                                        <Info className="text-blue-500 mt-0.5 shrink-0" size={16} />
                                        <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                                            {getChecklist.infoNote}
                                        </p>
                                    </div>
                                )}

                                {getChecklist.needsConsularVisa && (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                                        <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={16} />
                                        <span className="text-xs text-amber-700 font-semibold leading-relaxed">
                                            {t('wizard_consular_visa_alert', language)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Checklist of Steps */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('wizard_mandatory_steps_title', language)}
                                    </h3>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden divide-y divide-slate-50">
                                    {getChecklist.steps.map((s, idx) => (
                                        <div
                                            key={idx}
                                            style={{ animationDelay: `${idx * 60}ms` }}
                                            className="group flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors animate-in slide-in-from-left-4 duration-500"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-black text-orange-500 shrink-0">
                                                {idx + 1}
                                            </div>
                                            <p className="flex-1 text-xs font-bold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                                {s}
                                            </p>
                                            <button
                                                onClick={() => audioService.speak(s, language)}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 transition-all active:scale-90 shrink-0"
                                                title={t('listen_instruction', language)}
                                            >
                                                <Volume2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Documents */}
                            {getChecklist.docs.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {t('wizard_recommended_templates_title', language)}
                                        </h3>
                                    </div>

                                    <div className="space-y-2.5">
                                        {getChecklist.docs.map((docId, idx) => (
                                            <button
                                                key={docId}
                                                onClick={() => onSelectTemplate(docId)}
                                                style={{ animationDelay: `${idx * 80}ms` }}
                                                className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all duration-300">
                                                    <FileText size={18} className="text-orange-500 group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                            {t('wizard_view_fill_template', language)}
                                                        </p>
                                                        {docId === 'aima_deferimento_tacito' && (
                                                            <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider bg-amber-500 text-white rounded">
                                                                Pendente de Alteração
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-orange-500 transition-colors">
                                                        {getTemplateName(docId)}
                                                    </h4>
                                                </div>
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-300">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        ))}

                                        <div className="flex items-start gap-2.5 text-[10px] text-orange-600 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                            <Info size={14} className="shrink-0 mt-0.5" />
                                            <span className="font-semibold leading-normal">
                                                {t('wiz_pdf_explicit_notice', language)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Detailed Documents Specifications & Hacks Guide */}
                            {(() => {
                                let pathwayKey = (answers.purpose || answers.situation) || '';
                                if (pathwayKey === 'retirement') pathwayKey = 'visa_d7';
                                const langKey = language?.toLowerCase() || 'pt';
                                const detailDocs = PATHWAY_DOCS_DETAIL_GUIDE[langKey]?.[pathwayKey] || [];
                                if (detailDocs.length === 0) return null;
                                return (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {language.toLowerCase() === 'pt' ? '📋 Especificação de Documentos & Hacks' 
                                                 : language.toLowerCase() === 'es' ? '📋 Especificación de Documentos y Trucos' 
                                                 : language.toLowerCase() === 'fr' ? '📋 Spécifications des Documents & Hacks' 
                                                 : '📋 Document Specifications & Hacks'}
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {detailDocs.map((item, idx) => {
                                                const isDocOpen = activeDocTip === `${pathwayKey}_doc_${idx}`;
                                                return (
                                                    <div key={idx} className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden transition-all duration-300">
                                                        <button
                                                            onClick={() => setActiveDocTip(isDocOpen ? null : `${pathwayKey}_doc_${idx}`)}
                                                            className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                                                        >
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug">
                                                                {item.docName}
                                                            </span>
                                                            {isDocOpen ? (
                                                                <ChevronUp size={16} className="text-slate-400" />
                                                            ) : (
                                                                <ChevronDown size={16} className="text-slate-400" />
                                                            )}
                                                        </button>
                                                        {isDocOpen && (
                                                            <div className="p-6 pt-0 border-t border-slate-50 text-[11px] text-slate-650 font-semibold leading-relaxed space-y-4 bg-white animate-in slide-in-from-top-2 duration-300">
                                                                
                                                                {/* Format Accepted */}
                                                                <div className="space-y-1.5">
                                                                    <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {language.toLowerCase() === 'pt' ? '✅ O que é aceite' 
                                                                         : language.toLowerCase() === 'es' ? '✅ Qué se acepta' 
                                                                         : language.toLowerCase() === 'fr' ? '✅ Format Accepté' 
                                                                         : '✅ What is Accepted'}
                                                                    </h5>
                                                                    <p className="text-[10.5px] text-slate-700 leading-relaxed font-semibold">
                                                                        {item.accepted}
                                                                    </p>
                                                                </div>

                                                                {/* Where to Obtain */}
                                                                <div className="space-y-1.5 border-t border-slate-100/60 pt-3">
                                                                    <h5 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {language.toLowerCase() === 'pt' ? '📍 Onde conseguir' 
                                                                         : language.toLowerCase() === 'es' ? '📍 Dónde conseguirlo' 
                                                                         : language.toLowerCase() === 'fr' ? '📍 Où se le procurer' 
                                                                         : '📍 Where to Obtain'}
                                                                    </h5>
                                                                    <p className="text-[10.5px] text-slate-700 leading-relaxed font-semibold">
                                                                        {item.where}
                                                                    </p>
                                                                </div>

                                                                {/* Pro Hacks */}
                                                                <div className="space-y-1.5 border-t border-slate-100/60 pt-3 bg-orange-500/[0.02] -mx-6 px-6 pb-2">
                                                                    <h5 className="text-[8px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1">
                                                                        <span>💡</span> 
                                                                        {language.toLowerCase() === 'pt' ? 'Life Hacks & Conselhos' 
                                                                         : language.toLowerCase() === 'es' ? 'Trucos y Consejos' 
                                                                         : language.toLowerCase() === 'fr' ? 'Life Hacks & Conseils' 
                                                                         : 'Life Hacks & Advice'}
                                                                    </h5>
                                                                    <p className="text-[10.5px] text-orange-700 leading-relaxed font-bold">
                                                                        {item.hack}
                                                                    </p>
                                                                </div>

                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ── Official portal / links ── */}
                            {answers.situation === "voluntary_return" ? (
                                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                            <Globe size={18} />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                                {t('wiz_voluntary_return_links_title', language)}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                {t('wiz_voluntary_return_links_desc', language)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                        <a
                                            href="https://www.retornovoluntario.pt"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                        >
                                            <Globe size={11} />
                                            {t('link_oim_portal', language)}
                                            <ExternalLink size={10} />
                                        </a>
                                        <span className="text-slate-200">|</span>
                                        <a
                                            href="https://portugal.iom.int/pt-pt/retorno-voluntario-e-reintegracao"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                        >
                                            <ExternalLink size={11} />
                                            {t('link_oim_reintegration', language)}
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                    <div className="flex items-start gap-3.5">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                            <Globe size={18} />
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                                {t('wiz_official_link_label', language)}
                                            </h4>
                                            <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                {t('wiz_official_portal_desc', language)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                        <a
                                            href="https://portalaima.portugal.gov.pt"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                        >
                                            <Globe size={11} />
                                            {t('wiz_official_portal_btn', language)}
                                            <ExternalLink size={10} />
                                        </a>
                                        <span className="text-slate-200">|</span>
                                        <a
                                            href="https://siga.marcacaodeatendimento.pt"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                        >
                                            <ExternalLink size={11} />
                                            {t('wiz_official_siga_btn', language)}
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Reset Button */}
                            <button
                                onClick={resetWizard}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-orange-500 hover:text-orange-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('wizard_reset', language)}
                            </button>

                            {/* Disclaimer */}
                            <div className="p-4 bg-red-50/50 border border-red-100/50 rounded-2xl">
                                <p className="text-[9px] text-red-800/60 font-bold leading-relaxed text-center italic">
                                    {t('general_disclaimer_note', language)}
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
});
