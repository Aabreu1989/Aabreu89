// src/components/RegularizationWizard.tsx
import React, { useState, useMemo, memo } from "react";
import {
    ChevronRight, ArrowLeft, CheckCircle2, FileText, Info,
    Landmark, AlertCircle, Star, HelpCircle, Volume2, UserX, UserCheck, Briefcase, GraduationCap, Users, ShieldCheck, Sparkles
} from "lucide-react";
import { t } from "../utils/translations";
import { audioService } from "../services/audioService";
import { templates } from "../utils/documentsDatabase";
import { TranslatedText } from "./TranslatedText";

interface WizardProps {
    language: string;
    onSelectTemplate: (templateId: string) => void;
    onGoToDocs: () => void;
    initialChoice?: string;
}

type SituationId = "legal" | "irregular" | "contract" | "student" | "family" | "asylum";
type OriginId = "cplp" | "eu" | "other";
type PurposeId = "art88" | "art89" | "art90a" | "art122" | "humanitarian";

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

export const RegularizationWizard: React.FC<WizardProps> = memo(({ language, onSelectTemplate, onGoToDocs, initialChoice }) => {
    const [step, setStep] = useState<number>(1);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // Deep Linking Support
    React.useEffect(() => {
        if (initialChoice && step === 1) {
            if (initialChoice === 'asylum') {
                handleAnswer('situation', 'asylum');
            } else if (initialChoice === 'legal' || initialChoice === 'irregular' || initialChoice === 'contract' || initialChoice === 'student' || initialChoice === 'family') {
                handleAnswer('situation', initialChoice);
            }
        }
    }, [initialChoice, step]);

    const handleAnswer = (key: string, value: string) => {
        setAnswers(prev => ({ ...prev, [key]: value }));
        audioService.playClick();
        if (key === 'situation' && value === 'asylum') {
            setStep(4);
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
            audioService.playClick();
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
            infoNote: ""
        };

        if (origin === "eu") {
            result.title = t("wiz_eu_title", language);
            result.desc = t("wiz_eu_desc", language);
            result.steps = [t("wiz_eu_step1", language), t("wiz_eu_step2", language), t("wiz_eu_step3", language)];
            result.docs = ["crue_req", "nif_req"];
            result.needsAIMAAppointment = false;
        } else if (purpose === "art88") {
            result.title = t("wiz_work_title", language);
            result.desc = t("wiz_work_desc", language);
            result.steps = [t("wiz_work_step1", language), t("wiz_work_step2", language), t("wiz_work_step3", language)];
            result.docs = ["promessa_trabalho_art88", "ss_niss", "sef_declaracao_entrada"];
            result.needsConsularVisa = (sit === "irregular");
        } else if (purpose === "art89") {
            result.title = t("wiz_work_title", language);
            result.desc = t("wiz_work_desc", language);
            result.steps = [t("wiz_work_step1", language), t("wiz_work_step2", language), t("wiz_work_step3", language)];
            result.docs = ["nif_req", "ss_niss"];
            result.needsConsularVisa = (sit === "irregular");
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
        } else if (purpose === "art122") {
            result.title = t("wiz_art122_title", language);
            result.desc = t("wiz_art122_desc", language);
            result.steps = [t("wiz_art122_step1", language), t("wiz_art122_step2", language), t("wiz_art122_step3", language)];
            result.docs = ["aima_ar_art122", "aima_dec_responsabilidade", "aima_dec_alojamento", "certidao_civil_req"];
        } else if (sit === "family") {
            result.title = t("wiz_family_title", language);
            result.desc = t("wiz_family_desc", language);
            result.steps = [t("wiz_family_step1", language), t("wiz_family_step2", language), t("wiz_family_step3", language)];
            result.docs = ["aima_dec_responsabilidade", "aima_dec_alojamento", "certidao_civil_req"];
        } else if (purpose === "humanitarian" || sit === "asylum") {
            result.title = t("wiz_sit_asylum", language) || "Proteção Internacional";
            result.desc = t("wiz_purp_humanitarian_desc", language);
            result.steps = [
                t("wiz_purp_humanitarian_step1", language),
                t("wiz_purp_humanitarian_step2", language),
                t("wiz_purp_humanitarian_step3", language)
            ];
            result.docs = ["aima_asilo_req", "aima_refugiado_status", "ss_niss"];
            result.infoNote = t("wiz_humanitarian_note", language);
        }

        // Tactical additions
        if (sit === "contract" || sit === "student") {
            if (!result.docs.includes("aima_deferimento_tacito")) {
                result.docs.push("aima_deferimento_tacito");
            }
        }

        if (!result.docs.includes("aima_audiencia_previa")) {
            result.docs.push("aima_audiencia_previa");
        }

        return result;
    }, [answers, language]);

    const getTemplateName = (id: string) => {
        const key = TEMPLATE_META[id] || id;
        return t(key, language);
    };

    const renderStep1 = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {t("wizard_step0_q", language)}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    {t("wizard_step0_h", language)}
                </p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'legal', label: t("wiz_sit_legal", language), icon: <UserCheck className="text-green-500" /> },
                    { id: 'irregular', label: t("wiz_sit_irregular", language), icon: <UserX className="text-red-500" /> },
                    { id: 'contract', label: t("wiz_sit_contract", language), icon: <Briefcase className="text-blue-500" /> },
                    { id: 'student', label: t("wiz_sit_student", language), icon: <GraduationCap className="text-mira-orange" /> },
                    { id: 'family', label: t("wiz_sit_family", language), icon: <Users className="text-pink-500" /> },
                    { id: 'asylum', label: t("wiz_sit_asylum", language), icon: <ShieldCheck className="text-purple-500" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('situation', opt.id)}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">
                <ArrowLeft size={14} /> {t('back', language) || 'Voltar'}
            </button>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t('wizard_step1_q', language)}</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{t('wizard_step1_h', language)}</p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'cplp', label: t('wizard_step1_cplp', language), icon: <Landmark className="text-mira-orange" /> },
                    { id: 'eu', label: t('wizard_step1_eu', language), icon: <Landmark className="text-blue-500" /> },
                    { id: 'other', label: t('wizard_step1_other', language), icon: <Landmark className="text-slate-400" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('origin', opt.id)}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <button onClick={handleBack} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-colors">
                <ArrowLeft size={14} /> {t('back', language) || 'Voltar'}
            </button>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                    {t("wizard_step3_q", language)}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                    {t("wizard_step3_h", language)}
                </p>
            </div>
            <div className="grid gap-3">
                {[
                    { id: 'art88', label: t("wiz_purp_art88", language), icon: <CheckCircle2 className="text-green-500" /> },
                    { id: 'art89', label: t("wiz_purp_art89", language), icon: <CheckCircle2 className="text-blue-500" /> },
                    { id: 'art90a', label: t("wiz_purp_art90a", language), icon: <CheckCircle2 className="text-purple-500" /> },
                    { id: 'art122', label: t("wiz_purp_art122", language), icon: <CheckCircle2 className="text-pink-500" /> },
                    { id: 'humanitarian', label: t("wiz_purp_humanitarian", language), icon: <HelpCircle className="text-slate-400" /> }
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => handleAnswer('purpose', opt.id)}
                        className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-mira-orange hover:bg-white transition-all text-left group"
                    >
                        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderResult = () => {
        const checklist = getChecklist;
        return (
            <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black p-8 md:p-12 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-mira-orange/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-8 border border-white/20">
                            <ShieldCheck className="text-mira-orange w-8 h-8" />
                        </div>
                        
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-6">
                            {t('wizard_plan_title', language)}
                        </h2>
                        
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-mira-orange rounded-full mb-8 shadow-lg shadow-mira-orange/30">
                            <Sparkles size={16} className="text-white animate-pulse" />
                            <p className="text-[12px] font-black uppercase tracking-widest">{checklist.title}</p>
                        </div>
                        
                        <p className="text-sm md:text-lg text-slate-300 font-medium leading-relaxed mb-8">
                            {checklist.desc}
                        </p>

                        {checklist.infoNote && (
                            <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] mb-6">
                                <div className="flex items-start gap-4">
                                    <Info className="text-mira-orange mt-1 shrink-0" size={20} />
                                    <p className="text-sm text-white font-medium leading-relaxed">
                                        {checklist.infoNote}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {checklist.needsConsularVisa && (
                            <div className="p-6 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-[2.5rem] flex gap-4 items-start">
                                <AlertCircle className="mt-1 shrink-0" size={20} />
                                <span className="text-sm font-bold leading-relaxed italic">
                                    {t('wizard_consular_visa_alert', language)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-orange pl-3">{t('wizard_mandatory_steps_title', language)}</h3>
                    <div className="grid gap-3">
                        {checklist.steps.map((s, i) => (
                            <div key={i} className="flex gap-4 items-center p-4 md:p-6 bg-slate-50 rounded-3xl border border-slate-100/50 group transition-all hover:bg-white hover:shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[11px] font-black text-slate-900 shadow-sm shrink-0 border border-slate-100">{i + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight leading-normal">
                                            {s}
                                        </p>
                                        <button
                                            onClick={() => audioService.speak(s, language)}
                                            className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 rounded-2xl hover:text-mira-orange hover:shadow-md transition-all active:scale-90 border border-slate-100 shadow-sm shrink-0"
                                            title={t('listen_instruction', language)}
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-blue pl-3">{t('wizard_recommended_templates_title', language)}</h3>
                    <div className="grid gap-3">
                        {checklist.docs.map(docId => (
                                <button
                                    key={docId}
                                    onClick={() => onSelectTemplate(docId)}
                                    className="flex items-center justify-between p-4 md:p-5 bg-white border border-slate-100 rounded-[2.5rem] hover:border-mira-blue hover:shadow-lg transition-all shadow-sm group text-left"
                                >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-3 bg-blue-50 text-mira-blue rounded-2xl group-hover:bg-mira-blue group-hover:text-white transition-colors shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('wizard_view_fill_template', language)}</span>
                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight truncate leading-tight group-hover:text-mira-blue transition-colors">
                                            {getTemplateName(docId)}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-mira-blue transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={resetWizard}
                    className="w-full py-5 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-mira-orange hover:text-mira-orange transition-all"
                >
                    {t('wizard_reset', language)}
                </button>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 sm:p-8 pb-32">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderResult()}
            </div>
            {/* Footer note */}
            <div className="p-4 bg-white border-t text-[11px] text-slate-500 flex flex-col gap-3">
                <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-100">
                    <p className="text-[9px] font-bold leading-relaxed text-center italic">
                        {t('general_disclaimer_note', language)}
                    </p>
                </div>
                <div>
                    <p>
                        <strong>{t('wizard_footer_note_label', language)}</strong> {t('wizard_footer_note_text', language)}
                    </p>
                </div>
            </div>
        </div>
    );
});
