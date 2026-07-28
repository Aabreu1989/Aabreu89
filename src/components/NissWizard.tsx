// src/components/NissWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, FileText, Info,
    Shield, RotateCcw, Zap, MapPin, ExternalLink, Globe, Sparkles
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
        niss_title: "Segurança Social",
        niss_menu_desc: "Gerencie o seu NISS ou solicite prestações de apoio social em Portugal.",
        menu_get_niss: "Obter Número NISS",
        menu_get_niss_sub: "Passo a passo e documentação para solicitar o NISS.",
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
        niss_title: "Social Security",
        niss_menu_desc: "Manage your NISS or request social security benefits in Portugal.",
        menu_get_niss: "Get NISS Number",
        menu_get_niss_sub: "Step-by-step instructions and documentation to request NISS.",
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
                { icon: "🛂", text: "ID Document for the child and parents" },
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
    },
    rsi: {
        pt: {
            title: "Rendimento Social de Inserção (RSI)",
            description: "Prestação social de apoio a indivíduos ou agregados familiares em situação de pobreza extrema.",
            category: "Apoio Social & Integração",
            steps: [
                { icon: "1️⃣", text: "Requeira um atestado de residência na Junta de Freguesia local provando residência efetiva em Portugal." },
                { icon: "2️⃣", text: "Preencha por completo o formulário Mod. RV1010-DGSS e anexe a declaração de rendimentos do agregado." },
                { icon: "3️⃣", text: "Agende atendimento na Segurança Social ou submeta o pedido pela internet." },
                { icon: "4️⃣", text: "Assine e cumpra o Contrato de Inserção (plano de formação/inserção laboral)." }
            ],
            docs: [
                { icon: "🛂", text: "Documentos de Identificação, NIF e NISS de todo o agregado" },
                { icon: "🏠", text: "Atestado de residência emitido pela Junta de Freguesia" },
                { icon: "📋", text: "Formulário Mod. RV1010-DGSS devidamente assinado" },
                { icon: "📄", text: "Extratos bancários dos últimos 3 meses de todas as contas do agregado" }
            ],
            applyInfo: "A entrega física do formulário e anexos é recomendada num balcão local da Segurança Social ou através da Cooperativa de Ação Social da sua zona. Também pode submeter via Segurança Social Direta.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Agendamento Presencial (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        },
        en: {
            title: "Social Insertion Income (RSI)",
            description: "Social support benefit aimed at individuals or households living in extreme poverty.",
            category: "Social Support & Integration",
            steps: [
                { icon: "1️⃣", text: "Request a proof of address certificate (atestado) from the local Junta de Freguesia." },
                { icon: "2️⃣", text: "Complete application Form Mod. RV1010-DGSS and attach your household income statement." },
                { icon: "3️⃣", text: "Book an appointment at the Social Security office or submit your application online." },
                { icon: "4️⃣", text: "Sign and comply with the Insertion Contract (training/employment integration plan)." }
            ],
            docs: [
                { icon: "🛂", text: "IDs, NIFs, and NISS numbers for all household members" },
                { icon: "🏠", text: "Residence certificate issued by the local Junta de Freguesia" },
                { icon: "📋", text: "Duly signed Form Mod. RV1010-DGSS" },
                { icon: "📄", text: "Bank statements from the last 3 months for all household accounts" }
            ],
            applyInfo: "Physical delivery of the forms is highly recommended at a local Social Security office or through your area's Social Action support unit. You can also submit via Social Security Direct.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Online Bookings (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        }
    },
    parentalidade: {
        pt: {
            title: "Subsídio de Parentalidade",
            description: "Apoio financeiro pago a mãe e pai trabalhadores durante a licença por nascimento ou adoção de filhos.",
            category: "Família & Crianças",
            steps: [
                { icon: "1️⃣", text: "Obtenha o registo de nascimento da criança ou a certidão emitida pela maternidade/hospital." },
                { icon: "2️⃣", text: "Articule e defina com o outro progenitor o período de licença partilhada escolhido." },
                { icon: "3️⃣", text: "Preencha o formulário Mod. RP5049-DGSS (Requerimento de Subsídio de Parentalidade)." },
                { icon: "4️⃣", text: "Submeta o requerimento na Segurança Social Direta no prazo de 30 dias após o parto." }
            ],
            docs: [
                { icon: "📄", text: "Certidão ou registo de nascimento da criança" },
                { icon: "🛂", text: "Documentos de identificação dos pais" },
                { icon: "📋", text: "Formulário Mod. RP5049-DGSS preenchido" },
                { icon: "💼", text: "Declaração da entidade patronal indicando as datas de início e fim da licença" }
            ],
            applyInfo: "O requerimento deve ser submetido preferencialmente online através da Segurança Social Direta (Família > Parentalidade) para maior celeridade na aprovação e pagamento.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" }
            ]
        },
        en: {
            title: "Parental Benefit",
            description: "Financial support paid to working mothers and fathers during birth or adoption leaves.",
            category: "Family & Children",
            steps: [
                { icon: "1️⃣", text: "Obtain the child's birth registration or the certificate issued by the hospital." },
                { icon: "2️⃣", text: "Coordinate and define the shared leave period structure with the other parent." },
                { icon: "3️⃣", text: "Complete application Form Mod. RP5049-DGSS (Parental Benefit Request)." },
                { icon: "4️⃣", text: "Submit the request on the Social Security Direct portal within 30 days of the birth." }
            ],
            docs: [
                { icon: "📄", text: "Child's birth registration certificate" },
                { icon: "🛂", text: "ID documents of both parents" },
                { icon: "📋", text: "Completed Form Mod. RP5049-DGSS" },
                { icon: "💼", text: "Employer declaration specifying the start and end dates of the leave" }
            ],
            applyInfo: "The application should be submitted online through the Social Security Direct portal (Family > Parental Leave) to ensure faster processing and payment approval.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" }
            ]
        }
    },
    doenca: {
        pt: {
            title: "Subsídio de Doença",
            description: "Compensação financeira temporária para trabalhadores impedidos de exercer atividade profissional por doença.",
            category: "Saúde & Proteção",
            steps: [
                { icon: "1️⃣", text: "Agende consulta médica no Centro de Saúde (SNS) ou dirija-se a um hospital público." },
                { icon: "2️⃣", text: "O médico emite eletronicamente o Certificado de Incapacidade Temporária (CIT) - a Baixa Médica." },
                { icon: "3️⃣", text: "A baixa é enviada de forma digital automática pelo SNS para a Segurança Social." },
                { icon: "4️⃣", text: "Registe o seu IBAN na Segurança Social Direta para o pagamento do subsídio." }
            ],
            docs: [
                { icon: "🏥", text: "CIT (Baixa Médica) emitido eletronicamente pelo médico do SNS" },
                { icon: "🏦", text: "Comprovativo de IBAN registado no perfil da Segurança Social Direta" }
            ],
            applyInfo: "Não é necessário entregar nenhum requerimento físico na Segurança Social. O processo inicia-se de forma 100% eletrónica pelo serviço de saúde pública (SNS). Certifique-se apenas de ter o seu IBAN associado no portal.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" }
            ]
        },
        en: {
            title: "Sickness Benefit",
            description: "Temporary financial compensation for workers who are unable to work due to medical reasons.",
            category: "Health & Protection",
            steps: [
                { icon: "1️⃣", text: "Book an appointment at your local Health Center (SNS) or visit a public hospital." },
                { icon: "2️⃣", text: "The doctor electronically issues the Certificate of Temporary Incapacity (CIT) - 'Baixa Médica'." },
                { icon: "3️⃣", text: "The sick leave certificate is automatically transmitted digitally from the health service to Social Security." },
                { icon: "4️⃣", text: "Link your IBAN bank details in the Social Security Direct portal to receive payments." }
            ],
            docs: [
                { icon: "🏥", text: "CIT Certificate issued electronically by the NHS (SNS) doctor" },
                { icon: "🏦", text: "IBAN details registered on your Social Security Direct profile" }
            ],
            applyInfo: "You do not need to submit any physical paperwork to the Social Security. The process starts automatically through the public health system (SNS). You only need to ensure your IBAN is updated in your account.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" }
            ]
        }
    },
    psi: {
        pt: {
            title: "Prestação Social para a Inclusão (PSI)",
            description: "Apoio destinado a cidadãos residentes com grau de incapacidade permanente igual ou superior a 60%.",
            category: "Apoio Social & Integração",
            steps: [
                { icon: "1️⃣", text: "Submeta-se a uma junta médica do SNS para obter o Atestado Médico de Incapacidade Multiuso (AMIM)." },
                { icon: "2️⃣", text: "Preencha o formulário de requerimento Mod. PSI 1-DGSS." },
                { icon: "3️⃣", text: "Junte comprovativos de residência e extrato de IBAN atualizado." },
                { icon: "4️⃣", text: "Submeta eletronicamente na Segurança Social Direta ou presencialmente." }
            ],
            docs: [
                { icon: "🏥", text: "Atestado Médico de Incapacidade Multiuso (AMIM) indicando incapacidade >= 60%" },
                { icon: "📋", text: "Formulário Mod. PSI 1-DGSS preenchido e assinado" },
                { icon: "🛂", text: "Documento de identificação civil, NIF e NISS" },
                { icon: "🏦", text: "Documento comprovativo de IBAN bancário" }
            ],
            applyInfo: "A candidatura pode ser efetuada online na Segurança Social Direta (Ações Sociais > Prestação Social para a Inclusão) ou entregando a documentação presencialmente num balcão local.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Agendamento Presencial (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        },
        en: {
            title: "Social Benefit for Inclusion (PSI)",
            description: "Financial support for resident citizens with a permanent degree of disability of 60% or higher.",
            category: "Social Support & Integration",
            steps: [
                { icon: "1️⃣", text: "Book a public health medical board evaluation to obtain the Multipurpose Medical Disability Certificate (AMIM)." },
                { icon: "2️⃣", text: "Complete application Form Mod. PSI 1-DGSS." },
                { icon: "3️⃣", text: "Gather your proof of legal residence and an updated IBAN certificate." },
                { icon: "4️⃣", text: "Submit electronically via Social Security Direct or deliver in person." }
            ],
            docs: [
                { icon: "🏥", text: "Multipurpose Medical Disability Certificate (AMIM) showing disability >= 60%" },
                { icon: "📋", text: "Completed and signed Form Mod. PSI 1-DGSS" },
                { icon: "🛂", text: "Civil identification documents, NIF, and NISS" },
                { icon: "🏦", text: "Proof of IBAN bank account details" }
            ],
            applyInfo: "The application can be submitted online on Social Security Direct (Social Action > Social Benefit for Inclusion) or by delivering the paperwork in person to a local office.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Online Bookings (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        }
    },
    csi: {
        pt: {
            title: "Complemento Solidário para Idosos (CSI)",
            description: "Apoio mensal em dinheiro pago a idosos de baixos recursos que tenham atingido a idade da reforma.",
            category: "Apoio Social & Integração",
            steps: [
                { icon: "1️⃣", text: "Comprove residência legal efetiva em território nacional há pelo menos 6 anos consecutivos." },
                { icon: "2️⃣", text: "Preencha o requerimento oficial Mod. CSI 1-DGSS e recolha dados de rendimentos do seu agregado." },
                { icon: "3️⃣", text: "Junte a folha de rendimentos tributários IRS do último ano fiscal." },
                { icon: "4️⃣", text: "Entregue a documentação presencialmente num balcão local da Segurança Social." }
            ],
            docs: [
                { icon: "🛂", text: "Documento de identificação civil, NIF e NISS do requerente" },
                { icon: "🏠", text: "Comprovativo de residência legal há pelo menos 6 anos" },
                { icon: "📋", text: "Formulário Mod. CSI 1-DGSS preenchido" },
                { icon: "📄", text: "Comprovativo de rendimentos (IRS) do próprio e do cônjuge/companheiro" }
            ],
            applyInfo: "Dada a complexidade da avaliação patrimonial e de parentesco familiar, a candidatura é habitualmente instruída e entregue de forma presencial no balcão da Segurança Social da sua área de residência.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Agendamento Presencial (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        },
        en: {
            title: "Solidarity Supplement for the Elderly (CSI)",
            description: "Monthly financial support paid to low-income seniors who have reached the legal retirement age.",
            category: "Social Support & Integration",
            steps: [
                { icon: "1️⃣", text: "Prove legal and continuous residence in Portugal for at least the last 6 consecutive years." },
                { icon: "2️⃣", text: "Complete application Form Mod. CSI 1-DGSS and collect household income information." },
                { icon: "3️⃣", text: "Attach last year's IRS tax return statements." },
                { icon: "4️⃣", text: "Deliver the completed forms in person to a local Social Security office." }
            ],
            docs: [
                { icon: "🛂", text: "Civil ID, NIF, and NISS of the applicant" },
                { icon: "🏠", text: "Proof of legal residence for at least 6 years" },
                { icon: "📋", text: "Completed Form Mod. CSI 1-DGSS" },
                { icon: "📄", text: "Proof of income (IRS tax returns) of the applicant and their spouse" }
            ],
            applyInfo: "Due to the complex evaluation of family income and assets, this application is typically submitted in person at the local Social Security branch in your area of residence.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Online Bookings (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        }
    }
};

export const NissWizard: React.FC<NissWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [flow, setFlow] = useState<'menu' | 'niss' | 'supports'>('menu');
    const [step, setStep] = useState(1);
    const [workerType, setWorkerType] = useState<string>('');
    const [selectedSupport, setSelectedSupport] = useState<string>('');

    const lang: 'pt' | 'en' = (language?.toLowerCase() === 'en' ? 'en' : 'pt');

    const handleBack = () => {
        if (flow === 'niss') {
            if (step > 1) setStep(s => s - 1);
            else setFlow('menu');
        } else if (flow === 'supports') {
            if (step > 1) setStep(1);
            else setFlow('menu');
        } else {
            onBack();
        }
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

    const currentSupportData = selectedSupport ? SOCIAL_SUPPORTS[selectedSupport][lang] : null;

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
                            ✦ {flow === 'menu' ? 'MENU' : flow === 'niss' ? `NISS ${step}/2` : step === 1 ? 'APOIOS' : 'DETALHES'}
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

                    {/* ════ FLOW MENU — Get NISS or Social Supports ════════════════ */}
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

                            {/* Option 2: Social Supports */}
                            <button
                                onClick={() => { setFlow('supports'); setStep(1); setSelectedSupport(''); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 active:scale-[0.98] flex items-center gap-4"
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
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300">
                                        <ChevronRight size={14} />
                                    </div>
                                </button>
                            ))}

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                    {t('niss_info_box', lang)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ════ FLOW NISS — Step 2: Checklist & Process ═══════════════ */}
                    {flow === 'niss' && step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Where */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm">
                                <div className="flex items-start gap-3.5 mb-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                        <MapPin size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {t('niss_where_label', lang)}
                                        </h4>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                            {t('niss_where_text', lang)}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                    <a
                                        href="https://www.seg-social.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 text-[9px] font-black uppercase tracking-widest hover:text-blue-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        Segurança Social
                                        <ExternalLink size={10} />
                                    </a>
                                    <span className="text-slate-200">|</span>
                                    <a
                                        href="https://siga.marcacaodeatendimento.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-blue-600 text-[9px] font-black uppercase tracking-widest hover:text-blue-700 transition-colors"
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
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('niss_docs_needed', lang)}
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
                                            <p className="flex-1 text-xs font-bold text-slate-700 leading-snug group-hover:text-slate-950 transition-colors">
                                                {doc.text}
                                            </p>
                                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Form */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {t('niss_form_label', lang)}
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => onSelectTemplate('ss_niss')}
                                        className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:border-blue-500 transition-all duration-300">
                                            <FileText size={18} className="text-blue-500 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                {t('niss_fill_doc', lang)}
                                            </p>
                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-blue-500 transition-colors">
                                                {t('ss_niss', lang)}
                                            </h4>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all duration-300">
                                            <ChevronRight size={14} />
                                        </div>
                                    </button>

                                    <div className="flex items-start gap-2.5 text-[10px] text-blue-600 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <span className="font-semibold leading-normal">
                                            {t('wiz_pdf_explicit_notice', lang)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => { setStep(1); setWorkerType(''); }}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {t('niss_reset', lang)}
                            </button>
                        </div>
                    )}

                    {/* ════ FLOW SUPPORTS — Step 1: Catalog List ══════════════════ */}
                    {flow === 'supports' && step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {Object.entries(SOCIAL_SUPPORTS).map(([id, itemData], idx) => {
                                const details = itemData[lang];
                                return (
                                    <button
                                        key={id}
                                        onClick={() => { setSelectedSupport(id); setStep(2); }}
                                        style={{ animationDelay: `${idx * 60}ms` }}
                                        className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 active:scale-[0.97]"
                                    >
                                        <div className="relative w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                            {id === 'abono' ? '👶' : id === 'desemprego' ? '📋' : id === 'rsi' ? '🤝' : id === 'parentalidade' ? '🍼' : id === 'doenca' ? '🏥' : id === 'psi' ? '♿' : '👵'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                {details.category}
                                            </span>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-blue-500 transition-colors mt-1">
                                                {details.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal line-clamp-1">
                                                {details.description}
                                            </p>
                                        </div>
                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                            <ChevronRight size={12} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* ════ FLOW SUPPORTS — Step 2: Detail, Steps, Links ═════════════ */}
                    {flow === 'supports' && step === 2 && currentSupportData && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Summary description card */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-3">
                                <span className="px-3 py-1 text-[8px] font-black uppercase tracking-widest border rounded-full bg-blue-500/10 text-blue-500 border-blue-500/20">
                                    {currentSupportData.category}
                                </span>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mt-1">
                                    {currentSupportData.title}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {currentSupportData.description}
                                </p>
                            </div>

                            {/* Step by step */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {localT('support_steps_title')}
                                    </h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-4">
                                    {currentSupportData.steps.map((s, idx) => (
                                        <div key={idx} className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-md shrink-0">
                                                {s.icon}
                                            </div>
                                            <p className="text-xs text-slate-600 font-bold leading-relaxed pt-0.5">
                                                {s.text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Required documents */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {localT('support_docs_title')}
                                    </h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden divide-y divide-slate-50">
                                    {currentSupportData.docs.map((d, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-xl shrink-0">
                                                {d.icon}
                                            </div>
                                            <p className="flex-1 text-xs font-bold text-slate-700 leading-snug">
                                                {d.text}
                                            </p>
                                            <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Where and How to Apply */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {localT('support_apply_title')}
                                    </h3>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-4">
                                    <div className="flex gap-3 items-start">
                                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                            <MapPin size={16} />
                                        </div>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                            {currentSupportData.applyInfo}
                                        </p>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                                        {currentSupportData.links.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-700 transition-colors"
                                            >
                                                <Globe size={12} />
                                                {link.label}
                                                <ExternalLink size={11} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Back to supports catalog */}
                            <button
                                onClick={() => setStep(1)}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {localT('back_to_menu')}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
