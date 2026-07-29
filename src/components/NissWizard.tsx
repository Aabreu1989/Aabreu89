// src/components/NissWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, FileText, Info,
    Shield, RotateCcw, Zap, MapPin, ExternalLink, Globe, Sparkles,
    Calculator, Calendar, DollarSign, Lightbulb, Check, Copy, HelpCircle, AlertTriangle
} from 'lucide-react';
import { t } from '../utils/translations';

interface NissWizardProps {
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
                        ? 'w-6 h-2 bg-blue-400 shadow-md shadow-blue-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-blue-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-blue-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

// Localized translations for the new structures
const LOCAL_TRANS: Record<'pt' | 'en', Record<string, string>> = {
    pt: {
        niss_title: "Segurança Social & Jornada MIRA",
        niss_menu_desc: "NISS, Declaração Trimestral, Simulador de Contribuição e Life Hacks para Imigrantes em Portugal.",
        menu_get_niss: "Obter Número NISS",
        menu_get_niss_sub: "Passo a passo e documentação oficial para obter o seu NISS.",
        menu_decl_trimestral: "Declaração Trimestral SS",
        menu_decl_trimestral_sub: "Guia oficial de como declarar rendimentos de Recibos Verdes na SS Direta.",
        menu_simulador_ss: "Simulador de Contribuição SS",
        menu_simulador_ss_sub: "Calcule quanto vai pagar por mês com opção de variação de -25% a +25%.",
        menu_lifehacks: "Life Hacks & Dicas de Integração",
        menu_lifehacks_sub: "Isenção no 1.º ano, Acordo de Saúde PB4/SNS, Atestado de Morada e Dicas Fiscais.",
        menu_supports: "Apoios Sociais (Prestações)",
        menu_supports_sub: "Consulte abonos, subsídios de desemprego, doença, RSI e mais.",
        back_to_menu: "Voltar ao Menu",
        support_steps_title: "Passo a Passo de Candidatura",
        support_docs_title: "Documentos Exigidos",
        support_apply_title: "Onde e Como Dar Entrada",
        support_list_title: "Catálogo de Apoios Sociais",
        support_list_sub: "Selecione um apoio para ver o procedimento passo a passo e onde aplicar."
    },
    en: {
        niss_title: "Social Security & MIRA Journey",
        niss_menu_desc: "NISS, Quarterly Declaration, Contribution Simulator and Life Hacks for Immigrants in Portugal.",
        menu_get_niss: "Get NISS Number",
        menu_get_niss_sub: "Official step-by-step and paperwork guide to obtain your NISS.",
        menu_decl_trimestral: "Quarterly Declaration SS",
        menu_decl_trimestral_sub: "Official guide on how to report Green Receipt income on Social Security Direct.",
        menu_simulador_ss: "Social Security Simulator",
        menu_simulador_ss_sub: "Calculate your monthly contribution with optional -25% to +25% adjustments.",
        menu_lifehacks: "Life Hacks & Integration Tips",
        menu_lifehacks_sub: "1st Year Exemption, PB4/SNS Health Agreement, Proof of Address & Tax Hacks.",
        menu_supports: "Social Supports (Benefits)",
        menu_supports_sub: "Check allowances, unemployment benefits, sickness, RSI and more.",
        back_to_menu: "Back to Menu",
        support_steps_title: "Step-by-Step Application Guide",
        support_docs_title: "Required Documents",
        support_apply_title: "Where & How to Apply",
        support_list_title: "Social Supports Catalog",
        support_list_sub: "Select a benefit to view the step-by-step procedure and where to apply."
    }
};

interface SupportDetail {
    title: string;
    description: string;
    category: string;
    steps: { icon: string; text: string }[];
    docs: { icon: string; text: string }[];
    applyInfo: string;
    links: { label: string; url: string }[];
}

const SOCIAL_SUPPORTS: Record<string, Record<'pt' | 'en', SupportDetail>> = {
    abono: {
        pt: {
            title: "Abono de Família",
            description: "Apoio mensal para ajudar nas despesas com o sustento e educação de crianças e jovens.",
            category: "Família & Crianças",
            steps: [
                { icon: "1️⃣", text: "Obtenha o NIF e NISS da criança e de todos os membros do agregado familiar." },
                { icon: "2️⃣", text: "Submeta a declaração de IRS ou comprove a situação económica do agregado nas Finanças." },
                { icon: "3️⃣", text: "Preencha o formulário oficial Mod. RP5045-DGSS (Requerimento de Abono de Família)." },
                { icon: "4️⃣", text: "Submeta o requerimento na Segurança Social Direta ou num balcão de atendimento." }
            ],
            docs: [
                { icon: "🛂", text: "Documento de Identificação da Criança e dos Pais" },
                { icon: "🔢", text: "NIF e NISS de todos os membros do agregado" },
                { icon: "📄", text: "Declaração de IRS ou comprovativo de rendimentos" },
                { icon: "📋", text: "Formulário Mod. RP5045-DGSS preenchido" }
            ],
            applyInfo: "Pode submeter o pedido de forma 100% digital através do portal Segurança Social Direta. Se preferir atendimento presencial, deve efetuar o agendamento prévio online através do portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Marcações Online (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        },
        en: {
            title: "Family Allowance",
            description: "Monthly financial support to help cover cost of raising and educating children and young people.",
            category: "Family & Children",
            steps: [
                { icon: "1️⃣", text: "Obtain NIF (Tax Number) and NISS (Social Security Number) for the child and all household members." },
                { icon: "2️⃣", text: "Submit your IRS tax return or prove your household's financial status at the Tax Authority." },
                { icon: "3️⃣", text: "Fill in the official Form Mod. RP5045-DGSS (Family Allowance Application)." },
                { icon: "4️⃣", text: "Submit the application on the Social Security Direct portal or at a physical branch." }
            ],
            docs: [
                { icon: "... ", text: "ID Document for the child and parents" },
                { icon: "🔢", text: "NIF and NISS of all household members" },
                { icon: "📄", text: "IRS tax return or proof of income" },
                { icon: "📋", text: "Completed Form Mod. RP5045-DGSS" }
            ],
            applyInfo: "You can submit the application 100% digitally via the Social Security Direct portal. If you prefer in-person support, you must book an appointment in advance via the SIGA portal.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Online Bookings (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        }
    },
    desemprego: {
        pt: {
            title: "Subsídio de Desemprego",
            description: "Apoio financeiro mensal para trabalhadores que perderam o emprego de forma involuntária.",
            category: "Emprego & Carreira",
            steps: [
                { icon: "1️⃣", text: "Obtenha a Declaração de Situação de Desemprego (Mod. RP5005-DGSS) da sua antiga entidade empregadora." },
                { icon: "2️⃣", text: "Inscreva-se para procura de emprego no Centro de Emprego (IEFP) num prazo de 90 dias após o despedimento." },
                { icon: "3️⃣", text: "Submeta o requerimento do subsídio de desemprego no portal Segurança Social Direta ou diretamente no IEFP." },
                { icon: "4️⃣", text: "Registe o seu IBAN na Segurança Social Direta para garantir o recebimento automático dos pagamentos." }
            ],
            docs: [
                { icon: "📄", text: "Declaração Mod. RP5005-DGSS emitida pelo empregador" },
                { icon: "📋", text: "Comprovativo de inscrição para emprego no IEFP" },
                { icon: "🛂", text: "Documento de Identificação válido, NIF e NISS" },
                { icon: "🏦", text: "Comprovativo de IBAN bancário em nome do titular" }
            ],
            applyInfo: "O pedido deve ser formalizado no ato de inscrição para o emprego no portal IEFP Online ou no balcão físico do IEFP. Alternativamente, pode ser submetido online na Segurança Social Direta nas 24h seguintes.",
            links: [
                { label: "Portal IEFP Online", url: "https://iefponline.iefp.pt" },
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" }
            ]
        },
        en: {
            title: "Unemployment Benefit",
            description: "Monthly financial support for workers who have involuntarily lost their job.",
            category: "Employment & Career",
            steps: [
                { icon: "1️⃣", text: "Obtain the Declaration of Unemployment Status (Form Mod. RP5005-DGSS) from your former employer." },
                { icon: "2️⃣", text: "Register for job seeking at the Job Center (IEFP) within 90 consecutive days after your dismissal." },
                { icon: "3️⃣", text: "Submit the unemployment benefit request on the Social Security Direct portal or at the IEFP." },
                { icon: "4️⃣", text: "Register your IBAN bank details on Social Security Direct to receive payments automatically." }
            ],
            docs: [
                { icon: "📄", text: "Declaration Form Mod. RP5005-DGSS issued by the employer" },
                { icon: "📋", text: "Proof of job registration with the IEFP" },
                { icon: "🛂", text: "Valid identification document, NIF, and NISS" },
                { icon: "🏦", text: "Proof of bank account IBAN matching your name" }
            ],
            applyInfo: "The application must be formalized during your job registration on the IEFP Online portal or at a physical IEFP center. Alternatively, it can be submitted online on Social Security Direct within 24 hours.",
            links: [
                { label: "IEFP Online Portal", url: "https://iefponline.iefp.pt" },
                { label: "Social Security Direct", url: "https://app.seg-social.pt" }
            ]
        }
    }
};

export const NissWizard: React.FC<NissWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [flow, setFlow] = useState<'menu' | 'niss' | 'decl_trimestral' | 'simulador_ss' | 'lifehacks' | 'supports'>('menu');
    const [step, setStep] = useState(1);
    const [workerType, setWorkerType] = useState<string>('');
    const [selectedSupport, setSelectedSupport] = useState<string>('');

    // Simulator Interactive State
    const [simRevenue, setSimRevenue] = useState<number>(3000);
    const [simActivity, setSimActivity] = useState<'servicos' | 'vendas' | 'saude_producao'>('servicos');
    const [simAdjustment, setSimAdjustment] = useState<number>(0); // -0.25, 0, 0.25
    const [simTaxRate, setSimTaxRate] = useState<number>(0.214); // 0.214 (21.4%), 0.252 (25.2%)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const lang: 'pt' | 'en' = (language?.toLowerCase() === 'en' ? 'en' : 'pt');

    // Simulator Calculations
    const activityCoeff = simActivity === 'servicos' ? 0.70 : simActivity === 'vendas' ? 0.20 : 0.50;
    const relevantQuarterlyRevenue = Math.max(0, simRevenue) * activityCoeff;
    const monthlyAverageBase = relevantQuarterlyRevenue / 3;
    const adjustedMonthlyBase = monthlyAverageBase * (1 + simAdjustment);
    const computedMonthlyContrib = Math.max(20, adjustedMonthlyBase * simTaxRate);
    const computedQuarterlyTotal = computedMonthlyContrib * 3;

    const handleBack = () => {
        if (flow !== 'menu') {
            if (flow === 'niss' && step > 1) {
                setStep(s => s - 1);
            } else {
                setFlow('menu');
            }
        } else {
            onBack();
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const types = [
        { id: 'employed', emoji: '💼', label: t('niss_type_employed', lang), sub: t('niss_type_employed_sub', lang) },
        { id: 'selfemployed', emoji: '🧑‍💻', label: t('niss_type_self', lang), sub: t('niss_type_self_sub', lang) },
        { id: 'unemployed', emoji: '📋', label: t('niss_type_unemployed', lang), sub: t('niss_type_unemployed_sub', lang) },
    ];

    const checklistBase = [
        { icon: '🛂', text: t('niss_doc_passport', lang) },
        { icon: '🔢', text: t('niss_doc_nif', lang) },
        { icon: '📍', text: t('niss_doc_address', lang) },
    ];

    const checklistExtra = workerType === 'employed'
        ? [{ icon: '📄', text: t('niss_doc_contract', lang) }]
        : workerType === 'selfemployed'
        ? [{ icon: '🏛️', text: t('niss_doc_activity', lang) }]
        : [];

    const checklist = [...checklistBase, ...checklistExtra];

    // Helper translation accessor
    const localT = (key: string) => LOCAL_TRANS[lang][key] || key;

    const currentSupportData = selectedSupport ? SOCIAL_SUPPORTS[selectedSupport]?.[lang] : null;

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

                {/* Sticky Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    {flow === 'niss' ? (
                        <StepDots total={2} current={step} />
                    ) : flow === 'supports' && step === 2 ? (
                        <StepDots total={2} current={2} />
                    ) : null}

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-blue-400 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                            ✦ {flow === 'menu' ? 'MENU' : flow === 'decl_trimestral' ? 'DECLARAÇÃO SS' : flow === 'simulador_ss' ? 'SIMULADOR SS' : flow === 'lifehacks' ? 'LIFE HACKS' : flow === 'niss' ? `NISS ${step}/2` : 'APOIOS'}
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Shield size={10} />}
                            text={localT('niss_title')}
                        />
                    </div>

                    {flow === 'menu' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {localT('niss_title')}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {localT('niss_menu_desc')}
                            </p>
                        </div>
                    )}

                    {flow === 'decl_trimestral' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                Declaração Trimestral SS
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Passo a passo oficial de preenchimento para Recibos Verdes na Segurança Social Direta.
                            </p>
                        </div>
                    )}

                    {flow === 'simulador_ss' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                Simulador de Contribuição SS
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Calcule em tempo real o valor mensal a pagar com os coeficientes de variação oficiais.
                            </p>
                        </div>
                    )}

                    {flow === 'lifehacks' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                Life Hacks de Integração 🇵🇹
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Isenções fiscais, Acordo de Saúde PB4/SNS, Atestado de Morada e Dicas Fiscais Vitais.
                            </p>
                        </div>
                    )}

                    {flow === 'niss' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {step === 1 ? t('niss_step1_q', lang) : types.find(t => t.id === workerType)?.label}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {step === 1 ? t('niss_step1_desc', lang) : t('niss_subtitle', lang)}
                            </p>
                        </div>
                    )}

                    {flow === 'supports' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {step === 1 ? localT('support_list_title') : currentSupportData?.title}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {step === 1 ? localT('support_list_sub') : currentSupportData?.category}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ FLOW MENU — Core Hub ════════════════ */}
                    {flow === 'menu' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Option 1: Get NISS */}
                            <button
                                onClick={() => { setFlow('niss'); setStep(1); setWorkerType(''); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    🆔
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-blue-500 transition-colors">
                                        {localT('menu_get_niss')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_get_niss_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                            </button>

                            {/* Option 2: Declaração Trimestral SS */}
                            <button
                                onClick={() => { setFlow('decl_trimestral'); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-indigo-400/30 hover:shadow-2xl hover:shadow-indigo-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    📋
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-indigo-500 transition-colors">
                                        {localT('menu_decl_trimestral')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_decl_trimestral_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
                            </button>

                            {/* Option 3: Simulador SS */}
                            <button
                                onClick={() => { setFlow('simulador_ss'); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    🧮
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-amber-500 transition-colors">
                                        {localT('menu_simulador_ss')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_simulador_ss_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-amber-500 transition-colors" size={20} />
                            </button>

                            {/* Option 4: Life Hacks & Dicas de Integração */}
                            <button
                                onClick={() => { setFlow('lifehacks'); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-purple-400/30 hover:shadow-2xl hover:shadow-purple-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-purple-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    💡
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-purple-500 transition-colors">
                                        {localT('menu_lifehacks')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_lifehacks_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-purple-500 transition-colors" size={20} />
                            </button>

                            {/* Option 5: Social Supports */}
                            <button
                                onClick={() => { setFlow('supports'); setStep(1); setSelectedSupport(''); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    🤝
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">
                                        {localT('menu_supports')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_supports_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={20} />
                            </button>

                            {/* Legal Notice */}
                            <div className="bg-slate-100 border border-slate-200/60 rounded-2xl p-4 flex items-start gap-3 mt-4">
                                <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                                    {t('general_disclaimer_note', lang)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ════ FLOW DECLARAÇÃO TRIMESTRAL ═════════════════════════════ */}
                    {flow === 'decl_trimestral' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Schedule Card */}
                            <div className="bg-indigo-900/90 text-white rounded-3xl p-6 border border-indigo-700/50 shadow-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-indigo-300" size={20} />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-indigo-200">
                                        Calendário Oficial de Entregas 2026
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 31 de JANEIRO</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Outubro, Novembro e Dezembro</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 30 de ABRIL</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Janeiro, Fevereiro e Março</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 31 de JULHO</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Abril, Maio e Junho</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 31 de OUTUBRO</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Julho, Agosto e Setembro</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step-by-Step Instructions */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <span>📝</span> Passo a Passo na Segurança Social Direta
                                </h3>
                                <div className="space-y-4 text-xs text-slate-700">
                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Aceder ao Portal Oficial</p>
                                            <p className="text-slate-500 mt-0.5">Entre em <a href="https://app.seg-social.pt" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">app.seg-social.pt</a> com o seu NISS e Palavra-passe ou Chave Móvel Digital.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Navegar até ao Menu Correto</p>
                                            <p className="text-slate-500 mt-0.5">No menu superior, escolha: <strong className="text-slate-800">Emprego</strong> ➔ <strong className="text-slate-800">Trabalho Independente</strong> ➔ <strong className="text-slate-800">Declaração Trimestral</strong>.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            3
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Inserir os Rendimentos Ilíquidos</p>
                                            <p className="text-slate-500 mt-0.5">Preencha o valor total bruto das Faturas-Recibos emitidas em cada um dos 3 meses do trimestre anterior. Se não faturou num mês, insira <strong>0,00€</strong>.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            4
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Escolher a Opção de Variação (-25% a +25%)</p>
                                            <p className="text-slate-500 mt-0.5">Pode optar por reduzir a base em <strong>-25%</strong> para pagar menos nos 3 meses seguintes ou aumentar até <strong>+25%</strong> para acumular mais direitos de proteção social.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            5
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Submeter e Guardar o Comprovativo</p>
                                            <p className="text-slate-500 mt-0.5">Confirme a declaração. O sistema irá gerar a nota com o valor fixo mensal a pagar a cada dia 20 nos 3 meses seguintes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Button to Open Simulator */}
                            <button
                                onClick={() => setFlow('simulador_ss')}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Calculator size={18} />
                                Abrir Simulador Interativo de Contribuição
                            </button>
                        </div>
                    )}

                    {/* ════ FLOW SIMULADOR SEGURANÇA SOCIAL ═════════════════════════ */}
                    {flow === 'simulador_ss' && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Input Form */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Calculator className="text-amber-500" size={22} />
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                                        Simulador de Contribuição SS (Recibos Verdes)
                                    </h3>
                                </div>

                                {/* Revenue Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        Rendimento Bruto Total do Trimestre (€):
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                                        <input
                                            type="number"
                                            value={simRevenue}
                                            onChange={(e) => setSimRevenue(Number(e.target.value))}
                                            placeholder="Ex: 3000"
                                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black text-base focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">Soma dos valores emitidos nos 3 meses do trimestre.</p>
                                </div>

                                {/* Activity Type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        Tipo de Atividade:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setSimActivity('servicos')}
                                            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                simActivity === 'servicos'
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            💼 Prestação de Serviços (70%)
                                        </button>
                                        <button
                                            onClick={() => setSimActivity('vendas')}
                                            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                simActivity === 'vendas'
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            🛍️ Venda / Comércio (20%)
                                        </button>
                                        <button
                                            onClick={() => setSimActivity('saude_producao')}
                                            className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                                                simActivity === 'saude_producao'
                                                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            🩺 Saúde / Produção (50%)
                                        </button>
                                    </div>
                                </div>

                                {/* Adjustment Coeff */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        Ajuste de Variação Escolhido:
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setSimAdjustment(-0.25)}
                                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                                                simAdjustment === -0.25
                                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            📉 -25% (Pagar Menos)
                                        </button>
                                        <button
                                            onClick={() => setSimAdjustment(0)}
                                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                                                simAdjustment === 0
                                                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            ⚖️ 0% (Padrão)
                                        </button>
                                        <button
                                            onClick={() => setSimAdjustment(0.25)}
                                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                                                simAdjustment === 0.25
                                                    ? 'bg-purple-600 text-white border-purple-700 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            📈 +25% (Proteger Mais)
                                        </button>
                                    </div>
                                </div>

                                {/* Tax Rate */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        Taxa Contributiva Aplicável:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSimTaxRate(0.214)}
                                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                                                simTaxRate === 0.214
                                                    ? 'bg-slate-900 text-white border-slate-950 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            21,4% (Trabalhador Independente)
                                        </button>
                                        <button
                                            onClick={() => setSimTaxRate(0.252)}
                                            className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all ${
                                                simTaxRate === 0.252
                                                    ? 'bg-slate-900 text-white border-slate-950 shadow-md'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200'
                                            }`}
                                        >
                                            25,2% (Empresário Nome Individual)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Result Card */}
                            <div className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 text-white rounded-3xl p-6 border border-amber-500/30 shadow-2xl space-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                                        📊 Resultado da Simulação
                                    </span>
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                                        Cálculo Oficial DGSS 2026
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                                        Contribuição Mensal a Pagar (durante 3 meses):
                                    </p>
                                    <p className="text-3xl font-black text-amber-400 tracking-tight">
                                        € {computedMonthlyContrib.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ mês</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-white/10">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Rendimento Relevante Apurado:</p>
                                        <p className="font-black text-white">€ {relevantQuarterlyRevenue.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total do Trimestre (3 meses):</p>
                                        <p className="font-black text-amber-300">€ {computedQuarterlyTotal.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-[11px] text-slate-300 space-y-1">
                                    <p className="font-bold text-white">💡 Nota MIRA:</p>
                                    <p>O pagamento deve ser efetuado mensalmente entre os dias <strong>10 e 20</strong> do mês seguinte àquele a que respeita (ex: contribuição de Janeiro paga até 20 de Fevereiro).</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════ FLOW LIFE HACKS ═══════════════════════════════════════════ */}
                    {flow === 'lifehacks' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Hack 1 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎉</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #1: Isenção no 1.º Ano de Recibos Verdes
                                        </h3>
                                        <p className="text-[10px] text-purple-600 font-bold uppercase">Artigo 157.º do Código dos Contratantes</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Ao abrir atividade de Trabalhador Independente pela primeira vez em Portugal, fica <strong>isento de pagar Segurança Social durante os primeiros 12 meses</strong> consecutivos.
                                </p>
                                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-[11px] text-purple-900 font-medium">
                                    💡 <strong>Dica de Ouro:</strong> Pode optar por renunciar à isenção caso necessite de comprovar contribuições para subsidios ou renovação de visto.
                                </div>
                            </div>

                            {/* Hack 2 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🇧🇷</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #2: Acordo de Saúde PB4 / CDAM para Brasileiros
                                        </h3>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Acesso ao SNS sem Título Físico</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Cidadãos brasileiros com o certificado PB4 (emitido pelo Ministério da Saúde do Brasil) têm direito a ser atendidos no Sistema Nacional de Saúde (SNS) exatamente com os mesmos custos e direitos de um cidadão português, mesmo antes de terem a residência emitida.
                                </p>
                            </div>

                            {/* Hack 3 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🏠</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #3: Atestado na Junta de Freguesia
                                        </h3>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase">Sem necessidade de 2 testemunhas</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Se não tiver 2 testemunhas recenseadas na mesma freguesia, pode apresentar o <strong>Contrato de Arrendamento ou Contrato de Comodato</strong> acompanhado pelo recibo de renda eletrónico emitido nas Finanças.
                                </p>
                            </div>

                            {/* Hack 4 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #4: Isenção de Retenção de IRS até 14.500€
                                        </h3>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase">Artigo 101.º, n.º 1 do CIRS (2026)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Se estima faturar menos de <strong>14.500€ em 2026</strong>, pode selecionar a opção <em>"Sem retenção - art. 101.º, n.º 1 do CIRS"</em> ao emitir faturas-recibos verdes, evitando retenções de imposto na fonte no arranque.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ════ FLOW NISS — Step 1: Worker Type ════════════════════════ */}
                    {flow === 'niss' && step === 1 && (
                        <div className="space-y-3.5 animate-in slide-in-from-bottom-4 duration-500">
                            {types.map((type, idx) => (
                                <button
                                    key={type.id}
                                    onClick={() => { setWorkerType(type.id); setStep(2); }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 active:scale-[0.97]"
                                >
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        {type.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                {type.id === 'employed' ? t('badge_employed', lang) : type.id === 'selfemployed' ? t('badge_self_employed', lang) : t('badge_registration', lang)}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                            {type.label}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                            {type.sub}
                                        </p>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={18} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ FLOW NISS — Step 2: Checklist & Apply ══════════════════ */}
                    {flow === 'niss' && step === 2 && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Checklist */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <span>📋</span> Documentos Necessários
                                </h3>
                                <div className="space-y-3">
                                    {checklist.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700">
                                            <span className="text-lg">{item.icon}</span>
                                            <span>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Direct Action Link */}
                            <a
                                href="https://app.seg-social.pt"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={18} />
                                Solicitar NISS na Segurança Social Direta
                            </a>
                        </div>
                    )}

                    {/* ════ FLOW SUPPORTS — List or Detail ═════════════════════════ */}
                    {flow === 'supports' && step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {Object.entries(SOCIAL_SUPPORTS).map(([key, data]) => {
                                const support = data[lang];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedSupport(key); setStep(2); }}
                                        className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 text-left transition-all duration-500 hover:border-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/5 active:scale-[0.98] flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                                            🤝
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-1 inline-block">
                                                {support.category}
                                            </span>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                {support.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                                                {support.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" size={18} />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {flow === 'supports' && step === 2 && currentSupportData && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                    {localT('support_steps_title')}
                                </h3>
                                <div className="space-y-3">
                                    {currentSupportData.steps.map((st, idx) => (
                                        <div key={idx} className="flex gap-3 text-xs text-slate-700 p-3 bg-slate-50 rounded-2xl">
                                            <span className="text-base shrink-0">{st.icon}</span>
                                            <span className="font-medium">{st.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                    {localT('support_docs_title')}
                                </h3>
                                <div className="space-y-2.5">
                                    {currentSupportData.docs.map((dc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-700 p-3 bg-slate-50 rounded-2xl">
                                            <span className="text-base shrink-0">{dc.icon}</span>
                                            <span>{dc.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-emerald-950 text-white rounded-3xl p-6 border border-emerald-800/50 shadow-xl space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                                    {localT('support_apply_title')}
                                </h3>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                    {currentSupportData.applyInfo}
                                </p>
                                <div className="pt-2 space-y-2">
                                    {currentSupportData.links.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
