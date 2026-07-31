// src/components/EntrepreneurWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, Briefcase, Building2, Store,
    CheckCircle2, ChevronRight, Info, FileText,
    Sparkles, RotateCcw, TrendingUp, Globe, ExternalLink
} from 'lucide-react';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { templates } from '../utils/documentsDatabase';

interface EntrepreneurWizardProps {
    language: string;
    onBack: () => void;
    onSelectTemplate: (templateId: string) => void;
}

// ─── Step indicator dots ───────────────────────────────────────────────────────
const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-orange-400'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-orange-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

export const EntrepreneurWizard: React.FC<EntrepreneurWizardProps> = ({
    language,
    onBack,
    onSelectTemplate,
}) => {
    const [step, setStep] = useState(1);
    const [businessType, setBusinessType] = useState<string>('');
    const [hasResidence, setHasResidence] = useState<boolean | null>(null);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => {
        if (step > 1) {
            if (businessType === 'activity_control' || businessType === 'unemployment') {
                setStep(1);
            } else {
                setStep(s => s - 1);
            }
        }
        else onBack();
    };

    const lang = language?.toLowerCase() || 'pt';

    // ─── Business-type cards ───────────────────────────────────────────────────
    const types = [
        {
            id: 'freelancer',
            emoji: '🧑‍💻',
            title: t('entr_type_freelancer', lang),
            desc: t('entr_type_freelancer_desc', lang),
            icon: <Briefcase className="w-4 h-4 text-orange-500" />,
            ring: 'hover:ring-orange-400/60',
            glow: 'hover:shadow-orange-500/10',
            badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        },
        {
            id: 'company',
            emoji: '🏢',
            title: t('entr_type_company', lang),
            desc: t('entr_type_company_desc', lang),
            icon: <Building2 className="w-4 h-4 text-sky-400" />,
            ring: 'hover:ring-sky-400/60',
            glow: 'hover:shadow-sky-500/10',
            badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        },
        {
            id: 'startup',
            emoji: '🚀',
            title: t('entr_type_startup', lang),
            desc: t('entr_type_startup_desc', lang),
            icon: <TrendingUp className="w-4 h-4 text-purple-400" />,
            ring: 'hover:ring-purple-400/60',
            glow: 'hover:shadow-purple-500/10',
            badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        },
        {
            id: 'activity_control',
            emoji: '💼',
            title: t('entr_type_activity_control', lang),
            desc: t('entr_type_activity_control_desc', lang),
            icon: <Briefcase className="w-4 h-4 text-emerald-500" />,
            ring: 'hover:ring-emerald-400/60',
            glow: 'hover:shadow-emerald-500/10',
            badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'unemployment',
            emoji: '📋',
            title: t('entr_type_unemployment', lang),
            desc: t('entr_type_unemployment_desc', lang),
            icon: <Info className="w-4 h-4 text-red-500" />,
            ring: 'hover:ring-red-400/60',
            glow: 'hover:shadow-red-500/10',
            badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        }
    ];

    // ─── Action-plan checklist ─────────────────────────────────────────────────
    let checklist: string[] = [];
    let recommendedDocs: string[] = [];
    let stepIcons: string[] = [];

    if (businessType === 'activity_control') {
        stepIcons = ['🔑', '📋', '📊', '🛡️', '❌', '📆'];
        if (lang === 'pt') {
            checklist = [
                'Como Abrir: Aceder ao Portal das Finanças ➔ Entrar ➔ Início de Atividade.',
                'Como Abrir: Escolher os códigos CAE/CIRS adequados à sua profissão (ex: 1519 Outros Prestadores).',
                'Como Abrir: Declarar volume de negócios estimado (Isenção de IVA pelo Artigo 53º se < €15.000/ano em 2025/2026).',
                'Segurança Social: Enquadramento automático com isenção no 1º ano de descontos.',
                'Como Fechar: Portal das Finanças ➔ Cessação de Atividade (não ter faturas ativas em rascunho).',
                'Encerrar Segurança Social: Confirmar nas semanas seguintes que o vínculo foi atualizado para inativo.'
            ];
        } else if (lang === 'es') {
            checklist = [
                'Cómo Abrir: Acceder al Portal das Finanças ➔ Iniciar Sesión ➔ Inicio de Actividad.',
                'Cómo Abrir: Elegir los códigos CAE/CIRS adecuados a su profesión (ej: 1519 Otros Prestadores).',
                'Cómo Abrir: Declarar ingresos estimados (Exención de IVA por Art. 53º si < €15.000/año en 2025/2026).',
                'Seguridad Social: Encuadre automático con exención en el primer año de aportaciones.',
                'Cómo Cerrar: Portal das Finanças ➔ Cierre de Actividad (sin facturas activas en borrador).',
                'Cerrar Seguridad Social: Confirmar en las siguientes semanas que el vínculo pasó a inactivo.'
            ];
        } else if (lang === 'fr') {
            checklist = [
                'Comment Ouvrir : Accéder au Portal das Finanças ➔ Se connecter ➔ Début d\'Activité.',
                'Comment Ouvrir : Choisir les codes CAE/CIRS adaptés à votre profession (ex : 1519 Autres Prestataires).',
                'Comment Ouvrir : Déclarer le chiffre d\'affaires estimé (Exonération de TVA Art. 53 si < 15 000 €/an en 2025/2026).',
                'Sécurité Sociale : Affiliation automatique avec exonération de cotisations la première année.',
                'Comment Fermer : Portal das Finanças ➔ Cessation d\'Activité (aucune facture en projet active).',
                'Clôture Sécurité Sociale : Confirmer dans les semaines suivantes que le statut est mis à jour.'
            ];
        } else {
            checklist = [
                'How to Open: Go to Portal das Finanças ➔ Login ➔ Start of Activity.',
                'How to Open: Choose the appropriate CAE/CIRS business codes for your job (e.g. 1519 Other Providers).',
                'How to Open: Declare estimated business volume (VAT Exemption Art. 53 if < €15,000/year in 2025/2026).',
                'Social Security: Automatic enrollment with exemption from payments in the 1st year.',
                'How to Close: Portal das Finanças ➔ Cessation of Activity (must have no active draft invoices).',
                'Terminate Social Security: Verify in the following weeks that your status is updated to inactive.'
            ];
        }
        recommendedDocs = ['nif_req', 'ss_niss'];
    } else if (businessType === 'unemployment') {
        stepIcons = ['📆', '📋', '🤝', '🖥️', '🛡️', '🎓'];
        if (lang === 'pt') {
            checklist = [
                'Prazo Máximo: Inscrever-se para emprego no IEFP no prazo máximo de 90 dias após o desemprego.',
                'Obter Documentos: Reunir a Declaração de Situação de Desemprego (Mod. RP5005) emitida pela empresa.',
                'Pedido de Subsídio: Submeter o requerimento no portal Segurança Social Direta ou presencialmente.',
                'Apresentação Periódica: Cumprir a obrigação de apresentação periódica (mensal/quinzenal) online ou física.',
                'Procura Ativa: Manter um registo de candidaturas enviadas e respostas recebidas para comprovar.',
                'Formações & Convocações: Responder a todas as convocações e cursos obrigatórios do IEFP.'
            ];
        } else if (lang === 'es') {
            checklist = [
                'Plazo Máximo: Inscribirse para empleo en el IEFP en un plazo máximo de 90 días tras el desempleo.',
                'Obtener Documentos: Reunir la Declaración de Situación de Desempleo (Mod. RP5005) de la empresa.',
                'Solicitar Subsidio: Presentar la solicitud en Seguridad Social Direta o de forma presencial.',
                'Presentación Periódica: Cumplir con las presentaciones periódicas obligatorias online o físicas.',
                'Búsqueda Activa: Guardar un registro de solicitudes de empleo enviadas y respuestas para justificar.',
                'Formaciones y Convocatorias: Asistir a todas las convocatorias y cursos obligatorios del IEFP.'
            ];
        } else if (lang === 'fr') {
            checklist = [
                'Délai Maximum : S\'inscrire comme demandeur d\'emploi à l\'IEFP dans les 90 jours suivant le licenciement.',
                'Documents requis : Rassembler l\'attestation de chômage (Mod. RP5005) délivrée par l\'employeur.',
                'Demande d\'allocation : Soumettre la demande sur Segurança Social Direta ou en personne.',
                'Actualisation Périodique : Effectuer les présentations obligatoires en ligne ou physiquement.',
                'Recherche Active : Conserver un journal de vos candidatures et réponses pour prouver vos démarches.',
                'Formations & Rendez-vous : Répondre à toutes les convocations et formations obligatoires de l\'IEFP.'
            ];
        } else {
            checklist = [
                'Maximum Deadline: Register for work at the IEFP within a maximum of 90 days after losing your job.',
                'Gather Documents: Obtain the Unemployment Status Declaration (Form Mod. RP5005) from your employer.',
                'Claim Benefit: Submit the benefit request online on Social Security Direct or in person.',
                'Periodic Presentation: Fulfill periodic mandatory check-ins online or in person as instructed.',
                'Active Job Search: Maintain a record of job applications sent and answers received for validation.',
                'Mandatory Training: Respond to all IEFP appointments and attend mandatory training courses.'
            ];
        }
        recommendedDocs = ['ss_niss', 'iefp_inscricao'];
    } else {
        stepIcons = ['💼', '✈️', '📋', '🏦', '🔐'];
        checklist = [
            !hasResidence
                ? t('entr_step_nif_nonresident', lang)
                : t('entr_step_nif_resident', lang),
            !hasResidence ? t('entr_step_visa_d2', lang) : null,
            businessType === 'freelancer'
                ? t('entr_step_open_activity', lang)
                : t('entr_step_create_company', lang),
            businessType === 'company'
                ? t('entr_step_bank_company', lang)
                : t('entr_step_bank_freelancer', lang),
            t('entr_step_niss', lang),
        ].filter(Boolean) as string[];
        recommendedDocs = [
            'nif_req',
            !hasResidence ? 'at_rep_fiscal' : null,
            businessType === 'freelancer' ? 'at_inicio_atividade_draft' : null,
            businessType === 'company' || businessType === 'startup' ? 'estatutos_lda_minuta' : null,
            businessType === 'company' || businessType === 'startup' ? 'business_plan_d2' : null,
            businessType === 'freelancer' ? 'iefp_inscricao' : 'promessa_trabalho_art88',
            'ss_niss',
        ].filter(Boolean) as string[];
    }

    // Step-icon lookup for checklist
    // stepIcons is now defined dynamically above

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">

            {/* ── DARK HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative bg-gradient-to-b from-slate-950 via-orange-950/20 to-slate-950 px-6 pt-6 pb-8 overflow-hidden shrink-0">
                {/* Glassmorphism blobs */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-orange-500/20 rounded-full blur-[90px] -mr-20 -mt-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-700/15 rounded-full blur-[70px] -ml-16 -mb-10 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-24 bg-orange-400/5 rounded-full blur-[60px] pointer-events-none" />

                {/* Nav row */}
                <div className="relative z-10 flex items-center justify-between mb-6">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <StepDots total={3} current={step} />

                    {/* Spark badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 backdrop-blur-md border border-orange-400/30 rounded-full">
                        <Sparkles size={11} className="text-orange-300 animate-pulse" />
                        <span className="text-[9px] font-black text-orange-200 uppercase tracking-widest">
                            {step}/3
                        </span>
                    </div>
                </div>

                {/* Hero content */}
                <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                        <span className="text-[8px] font-black text-orange-300 uppercase tracking-[0.2em]">
                            {t('entr_title', lang)}
                        </span>
                    </div>

                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('entr_step1_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Escolha o modelo que melhor descreve o seu negócio
                            </p>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('entr_step2_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('entr_step2_sub', lang)}
                            </p>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('entr_step3_alert_title', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('entr_step3_alert_text', lang)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — Business Type ══════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {types.map((type, idx) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setBusinessType(type.id);
                                        if (type.id === 'activity_control' || type.id === 'unemployment') {
                                            setStep(3);
                                        } else {
                                            handleNext();
                                        }
                                    }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className={`
                                        group w-full animate-in slide-in-from-bottom-4 duration-500
                                        bg-white border border-slate-100 rounded-[2.25rem]
                                        p-5 flex items-center gap-4
                                        shadow-sm hover:shadow-2xl ${type.glow}
                                        ring-2 ring-transparent ${type.ring}
                                        active:scale-[0.98] transition-all duration-300
                                        text-left
                                    `}
                                >
                                    {/* Large emoji */}
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                                        {type.emoji}
                                    </div>

                                    {/* Text block */}
                                    <div className="flex-1 min-w-0">
                                        <span className={`
                                            inline-flex items-center gap-1.5 px-2.5 py-1
                                            rounded-full border text-[8px] font-black uppercase tracking-widest mb-2
                                            ${type.badge}
                                        `}>
                                            {type.icon}
                                            {type.id}
                                        </span>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-slate-950">
                                            {type.title}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {type.desc}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-300 shrink-0">
                                        <ChevronRight size={15} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 2 — Residence? ════════════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                {/* YES */}
                                <button
                                    onClick={() => { setHasResidence(true); handleNext(); }}
                                    className="
                                        group relative overflow-hidden
                                        p-6 bg-white border border-slate-100 rounded-[2rem]
                                        flex flex-col items-center justify-center gap-3
                                        shadow-sm hover:shadow-2xl hover:shadow-orange-500/10
                                        ring-2 ring-transparent hover:ring-orange-400/50
                                        active:scale-[0.97] transition-all duration-300
                                    "
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
                                    <span className="text-5xl group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-500 relative z-10 drop-shadow-sm">
                                        🇵🇹
                                    </span>
                                    <div className="relative z-10 text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700 group-hover:text-slate-950 transition-colors leading-tight">
                                            {t('entr_yes_residence', lang)}
                                        </span>
                                        <span className="mt-1 block text-[8px] font-bold uppercase tracking-wider text-orange-400">
                                            Residente ✓
                                        </span>
                                    </div>
                                </button>

                                {/* NO */}
                                <button
                                    onClick={() => { setHasResidence(false); handleNext(); }}
                                    className="
                                        group relative overflow-hidden
                                        p-6 bg-white border border-slate-100 rounded-[2rem]
                                        flex flex-col items-center justify-center gap-3
                                        shadow-sm hover:shadow-2xl hover:shadow-sky-500/10
                                        ring-2 ring-transparent hover:ring-sky-400/50
                                        active:scale-[0.97] transition-all duration-300
                                    "
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem]" />
                                    <span className="text-5xl group-hover:scale-125 group-hover:rotate-6 transition-transform duration-500 relative z-10 drop-shadow-sm">
                                        ✈️
                                    </span>
                                    <div className="relative z-10 text-center">
                                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-700 group-hover:text-slate-950 transition-colors leading-tight">
                                            {t('entr_no_residence', lang)}
                                        </span>
                                        <span className="mt-1 block text-[8px] font-bold uppercase tracking-wider text-sky-400">
                                            Visto D2 →
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ════ STEP 3 — Action Plan + Forms ══════════════════════ */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">

                            {/* ── Alert card ── */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-[2rem] p-5">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
                                        <Info className="text-orange-400" size={17} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
                                            {t('entr_step3_alert_title', lang)}
                                        </h4>
                                        <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                                            {t('entr_step3_alert_text', lang)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Numbered checklist ── */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                                    {t('entr_steps_order', lang)}
                                </h3>
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                    {checklist.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                                flex items-center gap-4 px-5 py-4
                                                hover:bg-orange-50/40 transition-colors duration-200
                                                ${idx < checklist.length - 1 ? 'border-b border-slate-100/80' : ''}
                                            `}
                                        >
                                            {/* Step number bubble */}
                                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                                                <span className="text-[10px] font-black text-white">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                            {/* Emoji icon */}
                                            <span className="text-lg shrink-0 select-none">
                                                {stepIcons[idx] || '📌'}
                                            </span>
                                            {/* Text */}
                                            <span className="text-[11px] font-bold text-slate-700 leading-snug flex-1">
                                                {item}
                                            </span>
                                            <CheckCircle2 size={14} className="text-orange-300 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Recommended docs ── */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-orange-500 pl-3">
                                    {t('entr_forms_title', lang)}
                                </h3>
                                <div className="grid gap-3">
                                    {recommendedDocs.map((docId) => {
                                        const template = templates.find(t => t.id === docId);
                                        if (!template) return null;
                                        return (
                                            <button
                                                key={docId}
                                                onClick={() => onSelectTemplate(docId)}
                                                className="
                                                    group flex items-center justify-between
                                                    p-4 bg-white border border-slate-100 rounded-[2.25rem]
                                                    hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/8
                                                    active:scale-[0.98] transition-all shadow-sm text-left
                                                "
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl border border-orange-100/50 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0">
                                                        <FileText size={17} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                            {t('entr_fill_doc', lang)}
                                                        </span>
                                                        <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight whitespace-normal break-words leading-tight group-hover:text-orange-500 transition-colors">
                                                            <TranslatedText
                                                                text={template.title}
                                                                language={language}
                                                                shouldTranslate={language !== 'PT'}
                                                            />
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-xl bg-slate-55 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors duration-300 shrink-0 ml-3">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        );
                                    })}

                                    <div className="flex items-start gap-2.5 text-[10px] text-orange-600 bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-normal">
                                            {t('wiz_pdf_explicit_notice', lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Official portals / links ── */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                        <Globe size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                                            {t('entr_portals_title', lang)}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            {t('entr_portals_desc', lang)}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                    <a
                                        href="https://iefponline.iefp.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        IEFP Online
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://empresanahora.justica.gov.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                    >
                                        <ExternalLink size={11} />
                                        Empresa na Hora
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://www.iefp.pt/gip"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                    >
                                        <ExternalLink size={11} />
                                        GIP - Imigrante
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://acaosocial.cm-porto.pt/migrantes-e-minorias-etnicas/guia-de-apoio-a-integracao-de-migrantes"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-orange-600 text-[9px] font-black uppercase tracking-widest hover:text-orange-700 transition-colors"
                                        title="Divisão Municipal de Talento e Promoção da Empregabilidade & Porto_4_all"
                                    >
                                        <Globe size={11} />
                                        {t('entr_porto_talent', lang)}
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>

                            {/* ── Reset button ── */}
                            <button
                                onClick={() => { setStep(1); setBusinessType(''); setHasResidence(null); }}
                                className="
                                    w-full py-5 rounded-[2rem]
                                    border-2 border-dashed border-slate-200
                                    text-slate-400 text-[10px] font-black uppercase tracking-widest
                                    flex items-center justify-center gap-2
                                    hover:border-orange-400 hover:text-orange-500
                                    active:scale-[0.98] transition-all duration-300
                                "
                            >
                                <RotateCcw size={13} />
                                {t('entr_reset', lang)}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
