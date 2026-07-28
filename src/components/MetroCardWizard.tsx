// src/components/MetroCardWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, FileText, Info,
    Train, RotateCcw, Compass, MapPin, ExternalLink, Globe, Sparkles, AlertTriangle
} from 'lucide-react';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';

interface MetroCardWizardProps {
    language: string;
    onBack: () => void;
}

const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-violet-400 shadow-md shadow-violet-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-violet-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-violet-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

export const MetroCardWizard: React.FC<MetroCardWizardProps> = ({ language, onBack }) => {
    const [step, setStep] = useState(1);
    const [passType, setPassType] = useState<string>('');

    const lang = language?.toLowerCase() || 'pt';

    const handleBack = () => {
        if (step > 1) setStep(s => s - 1);
        else onBack();
    };

    const tLocalDict = {
        pt: {
            title: "Cartão de Metro / Navegante",
            subtitle: "Guia Mobilidade Portugal 2026",
            intro: "Aprenda a retirar o seu cartão de transporte público (Lisboa Navegante / Porto Andante) com todas as regras e passes gratuitos atualizados em 2026.",
            step1_q: "Qual o seu perfil de passe?",
            step1_desc: "Selecione a opção que melhor se adequa ao seu perfil para ver descontos e gratuidades",
            step2_q: "Documentos e Procedimento",
            step2_desc: "Veja a lista de documentos necessários e onde solicitar o seu cartão",
            reset: "Reiniciar Guia",
            type_normal: "Passe Metropolitano Padrão",
            type_normal_sub: "Passe geral unificado para toda a área metropolitana por 30€ (Municipal) ou 40€ (Metropolitano).",
            type_student: "Estudante Sub-23 / 24 (Gratuito)",
            type_student_sub: "Passe 100% gratuito para todos os estudantes dos 4 aos 23 anos (e até aos 24 para cursos de Ensino Superior).",
            type_family: "Navegante Família",
            type_family_sub: "Pague no máximo 2 passes unificados (60€ ou 80€) para todo o agregado familiar de morada fiscal comum.",
            type_senior: "Navegante 65+ / Sénior",
            type_senior_sub: "Desconto especial de 20€ mensais para seniores a partir dos 65 anos de idade.",
            docs_title: "Documentos Obrigatórios (2026)",
            doc_id: "Passaporte / Título de Residência / Cartão de Cidadão",
            doc_nif: "NIF (Número de Identificação Fiscal) ativo",
            doc_photo: "1 Foto tipo passe (alguns postos tiram na hora)",
            doc_student_proof: "Comprovativo de matrícula escolar (necessário apenas para passe gratuito de estudante)",
            doc_family_proof: "Requerimento e Declaração da Autoridade Tributária com agregado familiar (apenas para passe família)",
            where_title: "Onde e Como Solicitar?",
            where_desc: "• Opção Urgente (Recomendado): Emitido no próprio dia em postos dedicados (ex: Marquês de Pombal, Campo Grande em Lisboa, ou Trindade no Porto) por 12€.\n\n• Opção Normal: Emitido em qualquer bilheteira ou posto de atendimento geral por 6€, com entrega estimada em até 10 dias úteis.\n\n• Novidade 2026: Passe Metropolitano digital direto no telemóvel via App Navegante (dispensa cartão físico).",
            alert_warning: "Migrantes recém-chegados sem Título de Residência podem emitir o cartão Navegante Normal utilizando o Passaporte e NIF temporário."
        },
        en: {
            title: "Metro & Transport Card",
            subtitle: "Portugal Mobility Guide 2026",
            intro: "Learn how to obtain your public transport pass (Lisbon Navegante / Porto Andante) with all the new 2026 rules, routes, and free fare templates.",
            step1_q: "What is your pass profile?",
            step1_desc: "Select the option that best fits you to view discounts and free fares",
            step2_q: "Documents & Procedure",
            step2_desc: "Check the mandatory documents and where to request your transport card",
            reset: "Reset Guide",
            type_normal: "Standard Metropolitan Pass",
            type_normal_sub: "General unified pass for the metropolitan area costing 30€ (Municipal) or 40€ (Metropolitan).",
            type_student: "Student Under-23 / 24 (Free)",
            type_student_sub: "100% free pass for all students aged 4 to 23 (and up to 24 for Higher Education degree students).",
            type_family: "Navegante Family",
            type_family_sub: "Pay a maximum of 2 unified passes (60€ or 80€) for the entire fiscal family aggregate.",
            type_senior: "Navegante 65+ / Senior",
            type_senior_sub: "Special discounted fare of 20€ per month for senior citizens aged 65 or older.",
            docs_title: "Mandatory Documents (2026)",
            doc_id: "Passport / Residence Title / Citizen Card",
            doc_nif: "Active NIF (Tax Identification Number)",
            doc_photo: "1 Passport-size photo (some stations take it on the spot)",
            doc_student_proof: "School enrollment proof (only required for free student pass)",
            doc_family_proof: "Application form and Tax Authority declaration of household (only for family pass)",
            where_title: "Where and How to Request?",
            where_desc: "• Urgent Option (Recommended): Issued on the spot at customer spaces (e.g. Marquês de Pombal, Campo Grande in Lisbon, or Trindade in Porto) for 12€.\n\n• Standard Option: Issued at any regular ticket booth or service desk for 6€, with an estimated delivery time of 10 business days.\n\n• New in 2026: Mobile digital pass directly inside the Navegante App (no physical card needed).",
            alert_warning: "Newly arrived migrants without a Residence Permit can still obtain the standard Navegante card using their Passport and a temporary NIF."
        },
        es: {
            title: "Tarjeta de Metro / Navegante",
            subtitle: "Guía de Movilidad Portugal 2026",
            intro: "Aprenda a obtener su tarjeta de transporte público (Lisboa Navegante / Porto Andante) con todas las normas y abonos gratuitos actualizados en 2026.",
            step1_q: "¿Cuál es su perfil de abono?",
            step1_desc: "Seleccione la opción que mejor se adapte a su perfil para ver descuentos y gratuidades",
            step2_q: "Documentos y Procedimiento",
            step2_desc: "Consulte la lista de documentos necesarios y dónde solicitar su tarjeta",
            reset: "Reiniciar Guía",
            type_normal: "Abono Metropolitano Estándar",
            type_normal_sub: "Abono general unificado para todo el área metropolitana por 30€ (Municipal) o 40€ (Metropolitano).",
            type_student: "Estudiante Sub-23 / 24 (Gratuito)",
            type_student_sub: "Abono 100% gratuito para todos los estudiantes de 4 a 23 años (y hasta los 24 para cursos de Educación Superior).",
            type_family: "Navegante Familia",
            type_family_sub: "Pague como máximo 2 abonos unificados (60€ o 80€) para todo el grupo familiar con domicilio fiscal común.",
            type_senior: "Navegante 65+ / Sénior",
            type_senior_sub: "Descuento especial de 20€ al mes para personas mayores a partir de los 65 años de edad.",
            docs_title: "Documentos Obligatorios (2026)",
            doc_id: "Pasaporte / Título de Residencia / Tarjeta de Identidad",
            doc_nif: "NIF (Número de Identificación Fiscal) activo",
            doc_photo: "1 Foto tamaño carné (algunas oficinas la hacen en el acto)",
            doc_student_proof: "Comprobante de matrícula escolar (solo necesario para el abono gratuito de estudiante)",
            doc_family_proof: "Solicitud y Declaración de la Autoridad Tributaria con el grupo familiar (solo para abono familiar)",
            where_title: "¿Dónde y Cómo Solicitar?",
            where_desc: "• Opción Urgente (Recomendado): Emitido en el mismo día en oficinas dedicadas (ej: Marquês de Pombal, Campo Grande en Lisboa o Trindade en Oporto) por 12€.\n\n• Opción Normal: Emitido en cualquier taquilla o puesto de atención general por 6€, con entrega estimada en hasta 10 días hábiles.\n\n• Novedad 2026: Abono Metropolitano digital directamente en el móvil a través de la App Navegante (sin tarjeta física).",
            alert_warning: "Los inmigrantes recién llegados sin Título de Residencia pueden emitir la tarjeta Navegante Normal utilizando su Pasaporte y un NIF temporal."
        },
        fr: {
            title: "Carte de Métro / Navegante",
            subtitle: "Guide de Mobilité Portugal 2026",
            intro: "Apprenez à obtenir votre carte de transport public (Lisbonne Navegante / Porto Andante) avec toutes les règles et abonnements gratuits mis à jour en 2026.",
            step1_q: "Quel est votre profil d'abonnement ?",
            step1_desc: "Sélectionnez l'option qui correspond le mieux à votre profil pour voir les réductions et la gratuité",
            step2_q: "Documents et Procédure",
            step2_desc: "Consultez les documents requis et l'endroit où demander votre carte de transport",
            reset: "Réinitialiser le Guide",
            type_normal: "Abonnement Métropolitain Standard",
            type_normal_sub: "Abonnement général unifié pour toute l'aire métropolitaine pour 30€ (Municipal) ou 40€ (Métropolitain).",
            type_student: "Étudiant Moins de 23 / 24 ans (Gratuit)",
            type_student_sub: "Abonnement 100% gratuit pour tous les étudiants de 4 à 23 ans (et jusqu'à 24 ans pour les étudiants de l'Enseignement Supérieur).",
            type_family: "Navegante Famille",
            type_family_sub: "Payez un maximum de 2 abonnements unifiés (60€ ou 80€) pour l'ensemble du foyer fiscal commun.",
            type_senior: "Navegante 65+ / Senior",
            type_senior_sub: "Tarif réduit spécial de 20€ par mois pour les seniors à partir de 65 ans.",
            docs_title: "Documents Obligatoires (2026)",
            doc_id: "Passeport / Titre de Séjour / Carte d'Identité",
            doc_nif: "NIF (Numéro d'Identification Fiscale) actif",
            doc_photo: "1 Photo d'identité (certains guichets la prennent sur place)",
            doc_student_proof: "Certificat de scolarité (requis uniquement pour l'abonnement étudiant gratuit)",
            doc_family_proof: "Formulaire de demande et Déclaration de l'Administration Fiscale du foyer (uniquement pour l'abonnement famille)",
            where_title: "Où et Comment Demander ?",
            where_desc: "• Option Urgente (Recommandé) : Délivré le jour même dans les espaces clients dédiés (ex : Marquês de Pombal, Campo Grande à Lisbonne ou Trindade à Porto) pour 12€.\n\n• Option Normale : Délivré dans n'importe quel guichet ou point d'accueil général pour 6€, avec un délai de livraison estimé à 10 jours ouvrés.\n\n• Nouveauté 2026 : Abonnement métropolitain numérique directement sur smartphone via l'App Navegante (sans carte physique).",
            alert_warning: "Les migrants nouvellement arrivés sans Titre de Séjour peuvent obtenir la carte Navegante Normale en utilisant leur Passeport et un NIF temporaire."
        }
    };

    const tLocal = tLocalDict[lang as 'pt' | 'en' | 'es' | 'fr'] || tLocalDict.pt;

    const types = [
        { id: 'normal', emoji: '🚇', label: tLocal.type_normal, sub: tLocal.type_normal_sub },
        { id: 'student', emoji: '🎓', label: tLocal.type_student, sub: tLocal.type_student_sub },
        { id: 'family', emoji: '👨‍👩‍👧‍👦', label: tLocal.type_family, sub: tLocal.type_family_sub },
        { id: 'senior', emoji: '👴', label: tLocal.type_senior, sub: tLocal.type_senior_sub },
    ];

    const checklistBase = [
        { icon: '🛂', text: tLocal.doc_id },
        { icon: '🔢', text: tLocal.doc_nif },
        { icon: '📸', text: tLocal.doc_photo },
    ];

    const checklistExtra = passType === 'student'
        ? [{ icon: '📄', text: tLocal.doc_student_proof }]
        : passType === 'family'
        ? [{ icon: '🏛️', text: tLocal.doc_family_proof }]
        : [];

    const checklist = [...checklistBase, ...checklistExtra];

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* STICKY HERO BANNER */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-violet-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <StepDots total={2} current={step} />

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-violet-400 animate-pulse" />
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                            ✦ {step}/2
                        </span>
                    </div>
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Train size={10} />}
                            text={tLocal.title}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {tLocal.step1_q}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {tLocal.step1_desc}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {types.find(t => t.id === passType)?.label}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {tLocal.step2_desc}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-3.5 animate-in slide-in-from-bottom-4 duration-500">
                            {types.map((type, idx) => (
                                <button
                                    key={type.id}
                                    onClick={() => { setPassType(type.id); setStep(2); }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-violet-400/30 hover:shadow-2xl hover:shadow-violet-500/5 active:scale-[0.97]"
                                >
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        {type.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
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

                            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3">
                                <Info size={16} className="text-violet-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-violet-800 font-medium leading-relaxed">
                                    {tLocal.intro}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Where */}
                            <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500 shrink-0">
                                        <Compass size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {tLocal.where_title}
                                        </h4>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                                            {tLocal.where_desc}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                                    <a
                                        href="https://www.metrolisboa.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-violet-600 text-[9px] font-black uppercase tracking-widest hover:text-violet-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        Lisboa Metro
                                    </a>
                                    <span className="text-slate-300">|</span>
                                    <a
                                        href="https://www.metrodoporto.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-violet-600 text-[9px] font-black uppercase tracking-widest hover:text-violet-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        Porto Metro
                                    </a>
                                    <span className="text-slate-300">|</span>
                                    <a
                                        href="https://www.o-navegante.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-violet-600 text-[9px] font-black uppercase tracking-widest hover:text-violet-700 transition-colors"
                                    >
                                        <Globe size={11} />
                                        Portal Navegante
                                    </a>
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {tLocal.docs_title}
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
                                            <div className="w-6 h-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                                                <CheckCircle2 size={14} className="animate-in zoom-in duration-300" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Warning Box */}
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-bold leading-relaxed">
                                    {tLocal.alert_warning}
                                </p>
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={() => { setStep(1); setPassType(''); }}
                                className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-violet-500 hover:text-violet-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                {tLocal.reset}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
