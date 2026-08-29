import React, { useState } from 'react';
import {
    ArrowLeft,
    ShieldCheck,
    FileText,
    CheckCircle2,
    ChevronRight,
    Info,
    Scale,
    Sparkles,
    RotateCcw,
    Globe,
    ExternalLink,
} from 'lucide-react';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { templates } from '../utils/documentsDatabase';

interface CitizenshipWizardProps {
    language: string;
    onBack: () => void;
    onSelectTemplate: (templateId: string) => void;
}

// ─── Step Indicator Dots ─────────────────────────────────────────────────────
const StepDots: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-[#0ea5e9] shadow-md shadow-[#0ea5e9]/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-[#0ea5e9]/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-[#0ea5e9]">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

export const CitizenshipWizard: React.FC<CitizenshipWizardProps> = ({
    language,
    onBack,
    onSelectTemplate,
}) => {
    const [step, setStep] = useState(1);
    const [pathway, setPathway] = useState<string>('');
    const [cplp, setCplp] = useState<boolean | null>(null);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
        else onBack();
    };

    const lang = language?.toLowerCase() || 'pt';

    // ── Vias exclusivas CPLP (Brasil, Angola, Cabo Verde, etc.)
    const cplpPathways = [
        {
            id: 'residence',
            title: 'Naturalização por Residência Legal — CPLP',
            icon: '⏱️',
            tag: '5 ANOS (Art. 15.º)',
            tagColor: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
            glow: 'hover:shadow-sky-500/5',
            ring: 'hover:ring-sky-400/30',
            sub: 'Cidadãos de países CPLP: Brasil, Angola, Cabo Verde, etc. 5 anos de residência legal (Lei Orgânica 1/2024: tempo de espera desde a submissão do pedido na AIMA conta integralmente).'
        },
        {
            id: 'marriage',
            title: 'Casamento ou União de Facto com Cidadão Português',
            icon: '💍',
            tag: '3 ANOS',
            tagColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            glow: 'hover:shadow-pink-500/5',
            ring: 'hover:ring-pink-400/30',
            sub: '3 anos de casamento ou união de facto reconhecida com cidadão português (Art. 3.º da Lei da Nacionalidade).'
        },
        {
            id: 'ancestry',
            title: 'Descendência de Cidadão Português',
            icon: '🧬',
            tag: 'DESCENDÊNCIA',
            tagColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            glow: 'hover:shadow-violet-500/5',
            ring: 'hover:ring-violet-400/30',
            sub: 'Filho ou neto de cidadão português (Art. 1.º da Lei da Nacionalidade). Não exige residência em Portugal.'
        },
        {
            id: 'filho_nascido_portugal',
            title: 'Filho Nascido em Portugal (Filhos de Estrangeiros)',
            icon: '👶',
            tag: 'LEI NACIONALIDADE',
            tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            glow: 'hover:shadow-amber-500/5',
            ring: 'hover:ring-amber-400/30',
            sub: 'Nascimento em Portugal: basta que um dos progenitores resida legalmente no país à data do nascimento (Art. 1.º n.º 1 al. f).'
        },
        {
            id: 'equality_status',
            title: 'Estatuto de Direitos Iguais + Cartão de Cidadão (Brasil)',
            icon: '🪪',
            tag: 'TRATADO PORTO SEGURO',
            tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            glow: 'hover:shadow-emerald-500/5',
            ring: 'hover:ring-emerald-400/30',
            sub: 'Exclusivo para brasileiros com residência válida. Confere igualdade de direitos civis e políticos e emissão de Cartão de Cidadão.'
        },
    ];

    // ── Vias para Resto do Mundo (não-CPLP)
    const otherPathways = [
        {
            id: 'residence',
            title: 'Naturalização por Residência Legal — Geral',
            icon: '⏱️',
            tag: '5 ANOS (Art. 15.º)',
            tagColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            glow: 'hover:shadow-orange-500/5',
            ring: 'hover:ring-orange-400/30',
            sub: 'Regime Geral: 5 anos de residência legal em Portugal. Pela Lei Orgânica 1/2024, o tempo de espera do pedido de residência na AIMA conta para os 5 anos.'
        },
        {
            id: 'marriage',
            title: 'Casamento ou União de Facto com Cidadão Português',
            icon: '💍',
            tag: '3 ANOS',
            tagColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            glow: 'hover:shadow-pink-500/5',
            ring: 'hover:ring-pink-400/30',
            sub: '3 anos de casamento ou união de facto reconhecida com cidadão português (Art. 3.º da Lei da Nacionalidade).'
        },
        {
            id: 'ancestry',
            title: 'Descendência de Cidadão Português',
            icon: '🧬',
            tag: 'DESCENDÊNCIA',
            tagColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            glow: 'hover:shadow-violet-500/5',
            ring: 'hover:ring-violet-400/30',
            sub: 'Filho ou neto de cidadão português (Art. 1.º da Lei da Nacionalidade). Não exige residência em Portugal.'
        },
        {
            id: 'sephardic',
            title: 'Descendência Judaica Sefardita',
            icon: '🕍',
            tag: 'ESPECIAL',
            tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            glow: 'hover:shadow-purple-500/5',
            ring: 'hover:ring-purple-400/30',
            sub: 'Para descendentes de judeus sefarditas portugueses (Art. 6.º n.º 7). Requer certificado de comunidade israelita e ligação a Portugal.'
        },
        {
            id: 'filho_nascido_portugal',
            title: 'Filho Nascido em Portugal (Filhos de Estrangeiros)',
            icon: '👶',
            tag: 'LEI NACIONALIDADE',
            tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            glow: 'hover:shadow-amber-500/5',
            ring: 'hover:ring-amber-400/30',
            sub: 'Nascimento em Portugal: atribuição da nacionalidade originária se um dos progenitores residir legalmente em Portugal.'
        },
    ];

    const isCPLP = cplp === true;

    const activePathways = isCPLP ? cplpPathways : otherPathways;

    const checklistDocs = pathway === 'equality_status' ? [
        'Certificado de Nacionalidade e Pleno Gozo de Direitos (Consulado do Brasil)',
        'Título de Residência Válido em Portugal (AIMA)',
        'Estatuto Tipo 1: Direitos Civis (Concursos públicos, empresas, saúde SNS e igualdade laboral)',
        'Estatuto Tipo 2: Direitos Políticos (Votar e ser votado em eleições em Portugal - 3 anos residência)',
        'Emissão de Cartão de Cidadão para Estrangeiro no IRN + Chave Móvel Digital (CMD)'
    ] : pathway === 'filho_nascido_portugal' ? [
        '📅 Verifique a data de nascimento do filho (ANTES ou APÓS 19/05/2026)',
        '✅ ANTES de 19/05/2026 (Lei 2/2020): 1 ano de residência legal de um dos pais à data do nascimento',
        '✅ APÓS 19/05/2026 (Lei 1/2026): 5 anos de residência legal de um dos pais à data do nascimento',
        'Certidão de Nascimento do Filho (emitida pela maternidade/hospital — registar no IRN em 20 dias)',
        'Título de Residência do(s) progenitor(es) — com carimbos que comprovem a duração da residência legal',
        'Passaportes dos progenitores',
        'Declaração de Vontade (formulário IRN) — necessária para a nacionalidade',
        '⚠️ Mesmo sem direito à nacionalidade: registar o nascimento no IRN é OBRIGATÓRIO',
        'Onde submeter: IRN (irn.justica.gov.pt) ou Nacionalidade Online (nacionalidade.justica.gov.pt)',
    ] : [
        t('citz_doc_birth', lang),
        t('citz_doc_criminal_origin', lang),
        t('citz_doc_criminal_pt', lang),
        pathway === 'marriage'
            ? t('citz_doc_marriage_cert', lang)
            : t('citz_doc_residence_proof', lang),
        isCPLP
            ? t('citz_doc_lang_exempt', lang)
            : t('citz_doc_lang_cert', lang),
    ];

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-sky-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0ea5e9]/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

                {/* Sticky Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <StepDots total={3} current={step} />

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-[#0ea5e9] animate-pulse" />
                        <span className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-widest bg-[#0ea5e9]/10 px-2.5 py-1 rounded-full border border-[#0ea5e9]/20">
                            ✦ {step}/3
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Scale size={10} />}
                            text={t('citz_title', lang)}
                        />
                    </div>

                    {step === 1 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('citz_step1_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('citz_step1_desc', lang)}
                            </p>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('citz_step2_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Escolha a sua base jurídica para o pedido de nacionalidade
                            </p>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                Plano de Cidadania
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {isCPLP ? 'Acordo CPLP' : 'Via Padrão'} · {activePathways.find(p => p.id === pathway)?.title}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — CPLP question ══════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Option 1: CPLP Yes */}
                            <button
                                onClick={() => { setCplp(true); handleNext(); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-[#0ea5e9]/30 hover:shadow-2xl hover:shadow-[#0ea5e9]/5 active:scale-[0.97]"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                    🇧🇷
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-sky-500/10 text-sky-450 border-sky-500/20">
                                            CPLP Benefícios
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                        {t('citz_cplp_btn', lang)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                        {t('citz_cplp_sub', lang)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                    <ChevronRight size={14} />
                                </div>
                            </button>

                            {/* Option 2: Other */}
                            <button
                                onClick={() => { setCplp(false); handleNext(); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-slate-350 hover:shadow-2xl hover:shadow-slate-500/5 active:scale-[0.97]"
                            >
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500 grayscale opacity-80">
                                    🌍
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-slate-500/10 text-slate-500 border-slate-500/20">
                                            Padrão
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                        {t('citz_other_btn', lang)}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                        {t('citz_other_sub', lang)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                    <ChevronRight size={14} />
                                </div>
                            </button>
                        </div>
                    )}

                    {/* ════ STEP 2 — Pathway selection ══════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-3.5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Context label */}
                            <div className="flex items-center gap-2 px-1 pb-1">
                                <div className={`w-2 h-2 rounded-full ${isCPLP ? 'bg-sky-400' : 'bg-orange-400'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCPLP ? 'text-sky-500' : 'text-orange-400'}`}>
                                    {isCPLP ? '🌍 Via CPLP — Brasil, Angola, Cabo Verde...' : '🌐 Via Padrão — Resto do Mundo'}
                                </span>
                            </div>
                            {activePathways.map((p, idx) => (
                                <button
                                    key={p.id}
                                    onClick={() => { setPathway(p.id); handleNext(); }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className={`group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-slate-200 active:scale-[0.97] hover:shadow-2xl hover:shadow-slate-200/50 ${p.glow} ${p.ring}`}
                                >
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        {p.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full ${p.tagColor}`}>
                                                {p.tag}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                            {p.title}
                                        </h4>
                                        {p.sub && (
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal line-clamp-2">
                                                {p.sub}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                        <ChevronRight size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 3 — Checklist & Forms ══════════════════════════ */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Law 2026 Alert */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9] shrink-0">
                                        <Info size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-widest">
                                            {t('citz_step3_alert_title', lang)}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            {t('citz_step3_alert_text', lang)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Official Portal / Booking Links */}
                            <div className="flex items-center gap-1.5 flex-wrap px-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {t('wiz_official_link_label', lang)}:
                                </span>
                                <a
                                    href="https://irn.justica.gov.pt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[#0ea5e9] text-[9px] font-black uppercase tracking-widest hover:text-[#0082c8] transition-colors"
                                >
                                    <Globe size={11} />
                                    IRN
                                    <ExternalLink size={10} />
                                </a>
                                <span className="text-slate-200">|</span>
                                <a
                                    href="https://nacionalidade.justica.gov.pt"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[#0ea5e9] text-[9px] font-black uppercase tracking-widest hover:text-[#0082c8] transition-colors"
                                >
                                    <Globe size={11} />
                                    Nacionalidade Online
                                    <ExternalLink size={10} />
                                </a>
                            </div>

                            {/* Checklist Container */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('citz_checklist_title', lang)}
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
                                                ✓
                                            </div>
                                            <p className="flex-1 text-xs font-bold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                                {doc}
                                            </p>
                                            <div className="w-6 h-6 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                                                <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Special Alert for Filho Nascido em Portugal */}
                            {pathway === 'filho_nascido_portugal' && (
                                <div className="bg-amber-50 border-2 border-amber-300/60 rounded-[2rem] p-5 space-y-3 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">⚠️</span>
                                        <h3 className="text-xs font-black text-amber-700 uppercase tracking-tight">Lei Orgânica n.º 1/2026 — Nova Regra para Filhos</h3>
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="bg-white/80 rounded-2xl p-3.5 border border-emerald-200">
                                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-1">📅 Nascido ANTES de 19 Maio 2026</p>
                                            <p className="text-xs text-slate-600 leading-snug">Lei 2/2020 aplica-se. Basta que <strong>um dos pais</strong> residisse legalmente em Portugal há <strong>1 ano</strong> à data do nascimento.</p>
                                        </div>
                                        <div className="bg-white/80 rounded-2xl p-3.5 border border-amber-200">
                                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">📅 Nascido APÓS 19 Maio 2026</p>
                                            <p className="text-xs text-slate-600 leading-snug">Lei 1/2026 aplica-se. Exige que <strong>um dos pais</strong> resida legalmente em Portugal há <strong>5 anos</strong> à data do nascimento.</p>
                                        </div>
                                        <div className="bg-sky-50 rounded-2xl p-3.5 border border-sky-200">
                                            <p className="text-[10px] font-black text-sky-700 uppercase tracking-wider mb-1">✅ Sempre garantido</p>
                                            <p className="text-xs text-slate-600 leading-snug">Mesmo sem direito à nacionalidade, o filho tem <strong>sempre direito a certidão de nascimento portuguesa</strong> e não fica sem documentação.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recommended Forms */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('citz_forms_title', lang)}
                                    </h3>
                                </div>

                                <div className="space-y-2.5">
                                    {(pathway === 'equality_status'
                                        ? ['g_estatuto_igualdade_cartao_cidadao', 'g_estatuto_igualdade', 'certidao_civil_req']
                                        : pathway === 'filho_nascido_portugal'
                                        ? ['nacionalidade_filhos', 'certidao_civil_req', 'nif_req']
                                        : pathway === 'marriage'
                                        ? ['irn_nacionalidade_casamento', 'certidao_civil_req', 'nif_req']
                                        : ['irn_nacionalidade_residencia', 'certidao_civil_req', 'nif_req']
                                    ).map((docId, idx) => {
                                        const template = templates.find(t => t.id === docId);
                                        if (!template) return null;

                                        return (
                                            <button
                                                key={docId}
                                                onClick={() => onSelectTemplate(docId)}
                                                style={{ animationDelay: `${idx * 80}ms` }}
                                                className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-[#0ea5e9]/40 hover:shadow-xl hover:shadow-[#0ea5e9]/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 group-hover:bg-[#0ea5e9] group-hover:border-[#0ea5e9] transition-all duration-300">
                                                    <FileText size={18} className="text-[#0ea5e9] group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                        {t('citz_fill_doc', lang)}
                                                    </p>
                                                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-[#0ea5e9] transition-colors">
                                                        <TranslatedText text={template.title} language={language} shouldTranslate={language !== 'PT'} />
                                                    </h4>
                                                </div>
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-[#0ea5e9] group-hover:text-white group-hover:border-[#0ea5e9] transition-all duration-300">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        );
                                    })}

                                    <div className="flex items-start gap-2.5 text-[10px] text-[#0ea5e9] bg-[#0ea5e9]/5 border border-[#0ea5e9]/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-normal">
                                            {t('wiz_pdf_explicit_notice', lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => { setStep(1); setPathway(''); setCplp(null); }}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-[#0ea5e9] hover:text-[#0ea5e9] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('citz_reset', lang)}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
