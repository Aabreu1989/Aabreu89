// src/components/AccommodationWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, Home, CheckCircle2, ChevronRight, Info, FileText,
    Sparkles, RotateCcw, ShieldCheck, MapPin, Globe, ExternalLink
} from 'lucide-react';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { templates } from '../utils/documentsDatabase';

interface AccommodationWizardProps {
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
                        ? 'w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-amber-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-amber-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

export const housingSupports = [
    {
        id: 'porta65',
        emoji: '🚪',
        title: {
            pt: 'Porta 65 Jovem (Apoio ao Arrendamento)',
            en: 'Porta 65 Jovem (Rent Subsidy)',
            es: 'Porta 65 Jovem (Apoyo al Alquiler)',
            fr: 'Porta 65 Jovem (Aide au Logement)'
        },
        desc: {
            pt: 'Programa de apoio financeiro que subsidia uma percentagem do valor da renda mensal a jovens arrendatários.',
            en: 'Financial support program that subsidizes a percentage of the monthly rent for young tenants.',
            es: 'Programa de apoyo financiero que subsidia un porcentaje del alquiler mensual a jóvenes inquilinos.',
            fr: "Programme d'aide financière qui subventionne un pourcentage du loyer mensuel pour les jeunes locataires."
        },
        fullDesc: {
            pt: 'O programa Porta 65 Jovem tem como objetivo apoiar o arrendamento de habitação para residência, atribuindo uma percentagem do valor da renda como apoio financeiro mensal. É destinado a jovens com idades entre os 18 e 35 anos (até 37 no caso de casais). O apoio dura 12 meses, podendo ser renovado.',
            en: 'The Porta 65 Jovem program aims to support youth housing rentals by providing a monthly financial subsidy corresponding to a percentage of the rent. It is targeted at young people aged 18 to 35 (up to 37 for couples). The support is granted for 12 months and can be renewed.',
            es: 'El programa Porta 65 Jovem tiene como objetivo apoyar el alquiler de vivienda residencial, otorgando un porcentaje del valor de la renta como apoyo financiero mensual. Está dirigido a jóvenes de entre 18 y 35 años (hasta 37 para parejas). El apoyo tiene una duración de 12 meses, renovable.',
            fr: "Le programme Porta 65 Jovem vise à soutenir la location de logements en attribuant un pourcentage du loyer sous forme d'aide financière mensuelle. Il s'adresse aux jeunes de 18 à 35 ans (jusqu'à 37 ans pour les couples). L'aide est accordée pour 12 mois et peut être renouvelée."
        },
        tramites: {
            pt: [
                'Registar o contrato de arrendamento no Portal das Finanças.',
                'Reunir os comprovativos de rendimento do agregado (IRS ou recibos de vencimento recentes).',
                'Submeter a candidatura online através do Portal da Habitação durante os períodos oficiais de candidatura.',
                'Consultar o resultado e, se aprovado, registar o IBAN para receber as transferências mensais.'
            ],
            en: [
                'Register the rental contract on the Portal das Finanças.',
                'Gather proof of income for the household (IRS tax return or recent payslips).',
                'Submit the application online on the Portal da Habitação during the official application windows.',
                'Check the results and, if approved, link your IBAN to receive the monthly transfers.'
            ],
            es: [
                'Registrar el contrato de alquiler en el Portal das Finanças.',
                'Reunir comprobantes de ingresos del hogar (IRS o nóminas recientes).',
                'Presentar la solicitud online en el Portal da Habitação durante los períodos oficiales de solicitud.',
                'Consultar el resultado y, si es aprobado, registrar el IBAN para recibir las transferencias mensuales.'
            ],
            fr: [
                'Enregistrer le contrat de location sur le Portal das Finanças.',
                'Rassembler les justificatifs de revenus du foyer (IRS ou fiches de paie récentes).',
                'Soumettre la candidature en ligne sur le Portal da Habitação pendant les périodes officielles.',
                'Consulter le résultat et, si approuvé, enregistrer son IBAN pour recevoir les virements mensuels.'
            ]
        },
        docs: {
            pt: [
                'Contrato de arrendamento (ou contrato-promessa) registado nas Finanças.',
                'Última declaração de IRS (e nota de liquidação) ou recibos de vencimento dos últimos 3 meses.',
                'Comprovativo de morada fiscal atual.',
                'Documentos de identificação (Passaporte, Título de Residência ou Cartão de Cidadão) de todos os candidatos.'
            ],
            en: [
                'Rental contract (or draft lease agreement) registered with the Tax Authority.',
                'Latest IRS tax return (and settlement note) or payslips for the last 3 months.',
                'Proof of current tax address.',
                'Identification documents (Passport, Residence Permit or Citizen Card) of all candidates.'
            ],
            es: [
                'Contrato de alquiler (o promesa de contrato) registrado en las Finanças.',
                'Última declaración del IRS o recibos de nómina de los últimos 3 meses.',
                'Comprobante de dirección fiscal actual.',
                'Documento de identidad (Pasaporte, Tarjeta de Residencia) de todos los solicitantes.'
            ],
            fr: [
                'Contrat de location (ou promesse de bail) enregistré auprès de l\'administration fiscale.',
                'Dernière déclaration fiscale IRS ou fiches de paie des 3 derniers mois.',
                'Justificatif de domicile fiscal actuel.',
                'Pièces d\'identité (Passeport, Titre de séjour) de tous les candidats.'
            ]
        },
        link: 'https://www.portaldahabitacao.pt/web/portal-da-habitacao/porta-65-jovem',
        linkLabel: {
            pt: 'Candidatura Porta 65',
            en: 'Apply to Porta 65',
            es: 'Solicitar Porta 65',
            fr: 'Candidature Porta 65'
        }
    },
    {
        id: 'garantiapublica',
        emoji: '🏢',
        title: {
            pt: 'Garantia Pública & Isenção IMT (Compra de Casa)',
            en: 'Public Guarantee & IMT Exemption (First Home Purchase)',
            es: 'Garantía Pública y Exención de IMT (Compra de Vivienda)',
            fr: 'Garantie Publique & Exonération d\'IMT (Achat)'
        },
        desc: {
            pt: 'Apoio do Estado para jovens até 35 anos comprarem a primeira casa, com financiamento até 100% e isenção de impostos.',
            en: 'State support for young people up to 35 to buy their first home, with up to 100% mortgage financing and tax exemptions.',
            es: 'Apoyo estatal para jóvenes hasta 35 años para comprar su primera casa, con financiación hasta el 100% y exención de impuestos.',
            fr: 'Soutien de l\'État pour les jeunes jusqu\'à 35 ans achetant leur premier logement, avec financement à 100% et exonérations.'
        },
        fullDesc: {
            pt: 'Destinado a jovens até aos 35 anos com domicílio fiscal em Portugal. Permite obter financiamento bancário a 100% do valor de compra (com o Estado como fiador da entrada) e isenção total de IMT (Imposto Municipal sobre as Transmissões Onerosas de Imóveis) e Imposto do Selo na compra da primeira habitação própria e permanente.',
            en: 'Targeted at young people up to 35 with tax residence in Portugal. It allows obtaining 100% bank financing of the purchase value (with the State acting as guarantor for the deposit) and full exemption from IMT and Stamp Duty on the purchase of the first permanent home.',
            es: 'Dirigido a jóvenes de hasta 35 años con residencia fiscal en Portugal. Permite obtener financiación bancaria al 100% del valor de compra (con el Estado como fiador del depósito) y exención total del impuesto IMT e Impuesto del Sello en la compra de la primera vivienda permanente.',
            fr: 'Destiné aux jeunes jusqu\'à 35 ans résidant fiscalement au Portugal. Permet d\'obtenir un financement bancaire à 100% de la valeur d\'achat (l\'État se portant garant de l\'apport) et une exonération totale d\'IMT et de droit de timbre lors de l\'achat de la première résidence principale.'
        },
        tramites: {
            pt: [
                'Confirmar os requisitos básicos (idade inferior ou igual a 35 anos, residência fiscal em Portugal, não ser proprietário de outra casa).',
                'Reunir documentos de rendimento e histórico de crédito do Banco de Portugal.',
                'Apresentar proposta de crédito habitação nos bancos aderentes solicitando a Garantia Pública do Estado.',
                'Declarar a isenção de IMT e Imposto do Selo no momento do agendamento da escritura pública (junto do cartório notarial).'
            ],
            en: [
                'Confirm basic eligibility requirements (age 35 or under, tax residence in Portugal, not owning another house).',
                'Gather income documents and your credit history map from the Banco de Portugal.',
                'Submit a mortgage proposal to participating banks requesting the State Public Guarantee.',
                'Declare the IMT and Stamp Duty exemption at the time of booking the public deed with the notary office.'
            ],
            es: [
                'Confirmar los requisitos básicos (edad menor o igual a 35 años, residencia fiscal en Portugal, no poseer otra vivienda).',
                'Reunir documentos de ingresos e informe de crédito del Banco de Portugal.',
                'Presentar solicitud de préstamo hipotecario en bancos colaboradores pidiendo la Garantía Pública.',
                'Solicitar la exención de IMT e Impuesto del Sello al programar la escritura pública ante notario.'
            ],
            fr: [
                'Confirmer les critères de base (âge inférieur ou égal à 35 ans, résidence fiscale au Portugal, ne pas posséder d\'autre logement).',
                'Rassembler les justificatifs de revenus et l\'historique des crédits de la Banque du Portugal.',
                'Présenter un dossier de prêt immobilier aux banques partenaires en demandant la Garantie Publique de l\'État.',
                'Déclarer l\'exonération d\'IMT et de droit de timbre lors de la planification de l\'acte notarié.'
            ]
        },
        docs: {
            pt: [
                'Documentos de identificação (Passaporte ou Título de Residência) e NIF de todos os compradores.',
                'Última declaração de IRS com Nota de Liquidação.',
                'Últimos 3 recibos de vencimento e declaração de efetividade laboral emitida pela entidade patronal.',
                'Extratos bancários dos últimos 3 meses.',
                'Mapa de responsabilidades de crédito extraído do site do Banco de Portugal.',
                'Certidão de não dívida ativa à Autoridade Tributária e à Segurança Social.'
            ],
            en: [
                'Identification documents (Passport or Residence Permit) and NIF of all buyers.',
                'Latest IRS tax return and assessment note.',
                'Last 3 payslips and employment contract certificate from your employer.',
                'Bank statements for the last 3 months.',
                'Credit Liabilities Map extracted from the Banco de Portugal website.',
                'Clearance certificates (no debt) from the Tax Authority (Finanças) and Social Security.'
            ],
            es: [
                'Documentos de identidad (Pasaporte, Tarjeta de Residencia) y NIF de todos los compradores.',
                'Última declaración del IRS y Nota de Liquidación.',
                'Últimos 3 recibos de sueldo y constancia de empleo emitida por la empresa.',
                'Extractos bancarios de los últimos 3 meses.',
                'Mapa de responsabilidades de crédito descargado de la web del Banco de Portugal.',
                'Certificado de situación fiscal y de seguridad social regularizada (sin deudas).'
            ],
            fr: [
                'Pièces d\'identité (Passeport, Titre de séjour) et NIF de tous les acheteurs.',
                'Dernière déclaration fiscale IRS et avis d\'imposition.',
                'Les 3 dernières fiches de paie et attestation d\'emploi délivrée par l\'employeur.',
                'Relevés bancaires des 3 derniers mois.',
                'Historique des crédits obtenu sur le site de la Banque du Portugal.',
                'Attestations de régularité fiscale et sociale (non-dette Finanças et Segurança Social).'
            ]
        },
        link: 'https://www.portugal.gov.pt',
        linkLabel: {
            pt: 'Portal do Governo',
            en: 'Government Portal',
            es: 'Portal del Gobierno',
            fr: 'Portail du Gouvernement'
        }
    },
    {
        id: 'arrendamentoapoiado',
        emoji: '🏘️',
        title: {
            pt: 'Arrendamento Apoiado (Habitação Social)',
            en: 'Supported Lease (Social Housing)',
            es: 'Alquiler Apoyado (Vivienda Social)',
            fr: 'Logement Social / Location Aidée'
        },
        desc: {
            pt: 'Arrendamento de imóveis públicos com rendas reduzidas e ajustadas ao rendimento mensal do agregado familiar.',
            en: 'Renting of public properties with reduced rents adjusted to the household\'s monthly income.',
            es: 'Alquiler de inmuebles públicos con rentas reducidas y ajustadas al ingreso mensual del hogar.',
            fr: 'Location de logements publics avec loyers réduits et ajustés aux revenus mensuels du foyer.'
        },
        fullDesc: {
            pt: 'O Arrendamento Apoiado destina-se a famílias com baixos rendimentos ou em situação de carência habitacional grave. As habitações são atribuídas pelo Estado (IHRU) ou pelos municípios, e a renda mensal é calculada com base na taxa de esforço proporcional aos rendimentos declarados do agregado.',
            en: 'Supported Lease is designed for families with low incomes or in severe housing need. Dwellings are allocated by the State (IHRU) or municipalities, and the monthly rent is calculated based on an effort rate proportional to the declared household income.',
            es: 'El Alquiler Apoyado está destinado a familias con bajos ingresos o en situación de vulnerabilidad habitacional. Las viviendas son asignadas por el Estado (IHRU) o los municipios, y el alquiler se calcula aplicando una tasa de esfuerzo a los ingresos del hogar.',
            fr: 'La location aidée est destinée aux familles à faibles revenus ou en situation de mal-logement grave. Les logements sont attribués par l\'État (IHRU) ou les municipalités, et le loyer est calculé selon un taux d\'effort proportionnel aux revenus déclarés.'
        },
        tramites: {
            pt: [
                'Efetuar o registo no Portal da Habitação na plataforma de arrendamento apoiado.',
                'Preencher a Candidatura à Habitação detalhando a composição do agregado, rendimentos e situação atual.',
                'Submeter a candidatura para avaliação e pontuação técnica.',
                'Aguardar o contacto para atribuição de habitação assim que existam imóveis disponíveis adequados.'
            ],
            en: [
                'Register on the Portal da Habitação under the social leasing platform.',
                'Complete the Housing Application detailing household composition, income and current housing status.',
                'Submit the application for technical evaluation and scoring.',
                'Wait for contact regarding housing allocation as soon as compatible properties become available.'
            ],
            es: [
                'Registrarse en el Portal da Habitação en la sección de alquiler apoyado.',
                'Completar la Solicitud de Vivienda detallando la composición del hogar, ingresos y situación actual.',
                'Presentar la solicitud para evaluación y puntuación técnica.',
                'Esperar el contacto para la asignación de vivienda una vez que haya propiedades adecuadas disponibles.'
            ],
            fr: [
                'S\'inscrire sur le Portal da Habitação sur la plateforme dédiée à la location aidée.',
                'Remplir la demande de logement en détaillant la composition du foyer, les revenus et la situation actuelle.',
                'Soumettre le dossier pour évaluation technique et attribution de points.',
                'Attendre d\'être contacté pour l\'attribution d\'un logement dès que des biens adaptés sont disponibles.'
            ]
        },
        docs: {
            pt: [
                'Documentos de identificação (AR / Passaporte) e NIF de todos os elementos do agregado familiar.',
                'NISS (Segurança Social) de todos os membros.',
                'Declaração de IRS mais recente e nota de liquidação (ou declaração de isenção).',
                'Comprovativos de rendimentos recentes (recibos de vencimento, pensões, apoios sociais ou RSI).',
                'Comprovativo de morada fiscal ou Atestado de Residência emitido pela Junta de Freguesia.'
            ],
            en: [
                'Identification documents (AR / Passport) and NIF of all household members.',
                'NISS (Social Security) of all members.',
                'Latest IRS tax return and assessment note (or exemption certificate).',
                'Recent proof of income (payslips, pension slips, social benefits, or RSI).',
                'Proof of address or Residence Certificate issued by the Junta de Freguesia.'
            ],
            es: [
                'Documentos de identidad (AR / Pasaporte) y NIF de todos los miembros del hogar.',
                'NISS (Seguridad Social) de todos los miembros.',
                'Declaración del IRS más reciente (o certificado de exención).',
                'Comprobantes de ingresos recientes (nóminas, pensiones o ayudas sociales/RSI).',
                'Comprobante de domicilio fiscal o certificado de residencia emitido por la Junta de Freguesia.'
            ],
            fr: [
                'Pièces d\'identité (Titre de séjour / Passeport) et NIF de tous les membres du foyer.',
                'NISS (Sécurité Sociale) de tous les membres.',
                'Dernière déclaration fiscale IRS et avis d\'imposition (ou certificat d\'exonération).',
                'Justificatifs de revenus récents (fiches de paie, pensions, allocations ou RSI).',
                'Justificatif de domicile fiscal ou attestation de résidence délivrée par la Junta de Freguesia.'
            ]
        },
        link: 'https://www.portaldahabitacao.pt/web/portal-da-habitacao/arrendamento-apoiado',
        linkLabel: {
            pt: 'Portal da Habitação',
            en: 'Housing Portal',
            es: 'Portal de Vivienda',
            fr: 'Portail du Logement'
        }
    },
    {
        id: 'apoioextraordinario',
        emoji: '📈',
        title: {
            pt: 'Apoio Extraordinário à Renda',
            en: 'Extraordinary Rent Support',
            es: 'Apoyo Extraordinario al Alquiler',
            fr: 'Soutien Extraordinaire au Loyer'
        },
        desc: {
            pt: 'Subsídio mensal pago diretamente a agregados familiares com taxa de esforço com o aluguer superior a 35%.',
            en: 'Monthly subsidy paid directly to households with a rental effort rate exceeding 35%.',
            es: 'Subsidio mensual pagado directamente a hogares con una tasa de esfuerzo en alquiler superior al 35%.',
            fr: 'Aide mensuelle versée directement aux ménages dont le taux d\'effort pour le loyer dépasse 35%.'
        },
        fullDesc: {
            pt: 'Apoio financeiro mensal extraordinário destinado a atenuar o encargo com rendas habitacionais. Aplica-se a arrendatários com contratos de arrendamento registados nas Finanças, cujos rendimentos não ultrapassem o 6.º escalão de IRS e que tenham uma taxa de esforço com a habitação superior a 35%.',
            en: 'Monthly extraordinary financial support aimed at reducing the burden of housing rent. It applies to tenants with registered rental contracts with Finanças whose annual household income does not exceed the 6th IRS tax bracket and who have a rent effort rate over 35%.',
            es: 'Subsidio financiero mensual extraordinario para atenuar el gasto en alquileres. Se aplica a inquilinos con contrato registrado en las Finanças, con ingresos que no superen el 6.º tramo de IRS y cuya tasa de esfuerzo con la vivienda sea superior al 35%.',
            fr: 'Aide financière mensuelle extraordinaire visant à réduire la charge des loyers. Concerne les locataires avec contrat enregistré auprès du fisc, dont les revenus ne dépassent pas la 6e tranche d\'IRS et dont le taux d\'effort logement dépasse 35%.'
        },
        tramites: {
            pt: [
                'Garantir que o senhorio registou o contrato de arrendamento no Portal das Finanças.',
                'Confirmar que os dados do agregado familiar (IRS) e rendimentos estão corretos e declarados.',
                'Associar o IBAN bancário no Portal das Finanças e na Segurança Social Direta.',
                'O cálculo e a atribuição são automáticos. Se elegível, receberá o subsídio mensalmente por transferência bancária.'
            ],
            en: [
                'Ensure the landlord has registered the rental contract on the Portal das Finanças.',
                'Verify that your household tax data (IRS) and income details are correct and submitted.',
                'Register your IBAN bank details on the Portal das Finanças and Segurança Social Direta portals.',
                'The calculation and grant are automatic. If eligible, you will receive the subsidy monthly via bank transfer.'
            ],
            es: [
                'Asegurarse de que el arrendador registró el contrato de alquiler en el Portal das Finanças.',
                'Confirmar que los datos del hogar (IRS) e ingresos son correctos y declarados.',
                'Registrar el IBAN bancario en el Portal de Finanças y en la Seguridad Social Direta.',
                'El cálculo y asignación son automáticos. Si cumple los requisitos, recibirá el subsidio mensualmente por transferencia bancaria.'
            ],
            fr: [
                'S\'assurer que le bailleur a enregistré le bail sur le Portal das Finanças.',
                'Vérifier que les données du foyer (IRS) et les revenus déclarés sont corrects.',
                'Associer ses coordonnées bancaires (IBAN) sur le Portal das Finanças et la Segurança Social Direta.',
                'Le calcul et l\'attribution sont automatiques. Si éligible, vous recevrez l\'aide mensuellement par virement.'
            ]
        },
        docs: {
            pt: [
                'Contrato de arrendamento habitacional registado na Autoridade Tributária.',
                'Recibo de renda eletrónico atual ou comprovativos de pagamento.',
                'Último IRS do agregado familiar comprobatório dos rendimentos e composição familiar.',
                'Comprovativo de IBAN registado nas plataformas oficiais (Finanças e Segurança Social).'
            ],
            en: [
                'Housing rental contract registered with the Tax Authority (Finanças).',
                'Current electronic rent receipt or proofs of payment.',
                'Latest household IRS tax return proving income and family composition.',
                'IBAN certificate registered on the official platforms (Finanças and Social Security).'
            ],
            es: [
                'Contrato de alquiler de vivienda registrado en Hacienda (Finanças).',
                'Recibo de alquiler electrónico actual o justificante de pago.',
                'Último IRS del hogar que demuestre los ingresos y la composición familiar.',
                'Comprobante del IBAN registrado en las plataformas oficiales (Finanças y Seguridad Social).'
            ],
            fr: [
                'Contrat de location de logement enregistré auprès de l\'administration fiscale.',
                'Reçu de loyer électronique récent ou preuve de paiement.',
                'Dernière déclaration IRS prouvant les revenus et le composition du foyer.',
                'Justificatif de l\'IBAN enregistré sur les plateformes officielles (Finanças et Sécurité Sociale).'
            ]
        },
        link: 'https://www.portaldasfinancas.gov.pt',
        linkLabel: {
            pt: 'Portal das Finanças',
            en: 'Portal das Finanças',
            es: 'Portal das Finanças',
            fr: 'Portal das Finanças'
        }
    }
];

export const AccommodationWizard: React.FC<AccommodationWizardProps> = ({
    language,
    onBack,
    onSelectTemplate,
}) => {
    const [step, setStep] = useState(1);
    const [situation, setSituation] = useState<string>('');
    const [selectedSupport, setSelectedSupport] = useState<string>('');

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => {
        if (situation === 'supports' && selectedSupport) {
            setSelectedSupport('');
        } else if (step > 1) {
            setStep(s => s - 1);
            setSituation('');
        } else {
            onBack();
        }
    };

    const lang = (language?.toLowerCase() || 'pt') as 'pt' | 'en' | 'es' | 'fr';

    const options = [
        {
            id: 'contract',
            emoji: '📜',
            title: t('acc_opt_contract', lang),
            desc: t('acc_opt_contract_desc', lang),
            badge: t('badge_financas', lang),
            ring: 'hover:ring-amber-400/60',
            glow: 'hover:shadow-amber-500/10',
            badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        },
        {
            id: 'supports',
            emoji: '🏛️',
            title: t('acc_opt_supports', lang),
            desc: t('acc_opt_supports_desc', lang),
            badge: t('badge_state_support', lang),
            ring: 'hover:ring-emerald-400/60',
            glow: 'hover:shadow-emerald-500/10',
            badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'nocontract',
            emoji: '📜',
            title: t('acc_opt_nocontract', lang),
            desc: t('acc_opt_nocontract_desc', lang),
            badge: t('badge_junta', lang),
            ring: 'hover:ring-orange-400/60',
            glow: 'hover:shadow-orange-500/10',
            badgeStyle: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        },
        {
            id: 'shared',
            emoji: '🤝',
            title: t('acc_opt_shared', lang),
            desc: t('acc_opt_shared_desc', lang),
            badge: t('badge_family_transfer', lang),
            ring: 'hover:ring-yellow-400/60',
            glow: 'hover:shadow-yellow-500/10',
            badgeStyle: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        },
        {
            id: 'buying',
            emoji: '🔑',
            title: t('acc_opt_buying', lang),
            desc: t('acc_opt_buying_desc', lang),
            badge: t('badge_propriedade', lang),
            ring: 'hover:ring-sky-400/60',
            glow: 'hover:shadow-sky-500/10',
            badgeStyle: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        }
    ];

    // Build checklist based on selection
    let checklistDocs: { icon: string; text: string }[] = [];

    if (situation === 'contract') {
        checklistDocs = [
            { icon: '📄', text: t('req_lease_agreement', lang) },
            { icon: '🛂', text: t('req_passport', lang) },
            { icon: '🧾', text: t('acc_doc_rent_receipts', lang) },
            { icon: '🏛️', text: t('req_junta_cert', lang) + ' ' + t('acc_doc_optional_recommended', lang) }
        ];
    } else if (situation === 'nocontract') {
        checklistDocs = [
            { icon: '👥', text: t('acc_doc_witnesses', lang) },
            { icon: '🛂', text: t('req_passport', lang) },
            { icon: '🏛️', text: t('req_junta_cert', lang) + ' ' + t('acc_doc_issued_by_junta', lang) },
            { icon: '🧾', text: t('acc_doc_alternative_address', lang) }
        ];
    } else if (situation === 'shared') {
        checklistDocs = [
            { icon: '✍️', text: t('acc_doc_owner_declaration', lang) },
            { icon: '📄', text: t('acc_doc_owner_land_registry', lang) },
            { icon: '🛂', text: t('acc_doc_guest_owner_ids', lang) },
            { icon: '🏛️', text: t('req_junta_cert', lang) + ' ' + t('acc_doc_requested_after_dec', lang) }
        ];
    } else if (situation === 'buying') {
        if (lang === 'pt') {
            checklistDocs = [
                { icon: '✍️', text: 'Contrato Promessa Compra e Venda (CPCV) assinado por ambas as partes' },
                { icon: '🏦', text: 'Aprovação de Crédito Habitação (Ficha de Informação Normalizada Europeia - FINE)' },
                { icon: '🧾', text: 'Guias de pagamento do IMT e Imposto do Selo liquidadas antes da escritura' },
                { icon: '🛂', text: 'Documentos de Identificação válidos (Passaporte/Título de Residência) e NIF português' },
                { icon: '📜', text: 'Caderneta Predial e Certidão de Teor atualizadas do imóvel' },
                { icon: '🖋️', text: 'Escritura Pública de Compra e Venda realizada no Notário ou Casa Pronta' }
            ];
        } else if (lang === 'es') {
            checklistDocs = [
                { icon: '✍️', text: 'Contrato Promesa de Compraventa (CPCV) firmado por ambas partes' },
                { icon: '🏦', text: 'Aprobación del Crédito Hipotecario (Ficha de Información Normalizada Europea - FINE)' },
                { icon: '🧾', text: 'Guías de pago del IMT e Impuesto de Sello liquidadas antes de la escritura' },
                { icon: '🛂', text: 'Documentos de identificación válidos (Pasaporte/Tarjeta de Residencia) y NIF portugués' },
                { icon: '📜', text: 'Ficha catastral (Caderneta Predial) y Certificado de Registro actualizados del inmueble' },
                { icon: '🖋️', text: 'Escritura Pública de Compraventa realizada ante Notario o Casa Pronta' }
            ];
        } else if (lang === 'fr') {
            checklistDocs = [
                { icon: '✍️', text: 'Contrat Promesse d\'Achat (CPCV) signé par les deux parties' },
                { icon: '🏦', text: 'Approbation du Prêt Immobilier (Fiche d\'Information Standardisée Européenne - FISE)' },
                { icon: '🧾', text: 'Preuves de paiement de l\'IMT et du droit de timbre liquidées avant l\'acte' },
                { icon: '🛂', text: 'Documents d\'identité valides (Passeport/Titre de séjour) et NIF portugais' },
                { icon: '📜', text: 'Fiche matricule (Caderneta Predial) et Certificat de propriété mis à jour' },
                { icon: '🖋️', text: 'Acte authentique de vente signé devant le notaire ou Casa Pronta' }
            ];
        } else {
            checklistDocs = [
                { icon: '✍️', text: 'Promissory Purchase and Sale Agreement (CPCV) signed by both parties' },
                { icon: '🏦', text: 'Mortgage Approval (European Standardised Information Sheet - ESIS)' },
                { icon: '🧾', text: 'IMT and Stamp Duty tax payment guides settled before signing the deed' },
                { icon: '🛂', text: 'Valid Identification Documents (Passport/Residence Permit) and Portuguese NIF' },
                { icon: '📜', text: 'Land Registry Certificate (Certidão de Teor) and Tax Booklet (Caderneta Predial)' },
                { icon: '🖋️', text: 'Deed of Purchase and Sale (Escritura Pública) signed before a Notary' }
            ];
        }
    }

    const docIds = situation === 'nocontract' || situation === 'shared'
        ? ['junta_declaracao_alojamento_testemunhas', 'at_declaracao_cedencia', 'junta_atestado_residencia']
        : ['junta_declaracao_alojamento_testemunhas', 'junta_atestado_residencia'];

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-amber-600/5 rounded-full blur-[60px] pointer-events-none" />

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
                        <Sparkles size={12} className="text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            ✦ {step}/2
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Home size={10} />}
                            text={t('acc_subtitle', lang)}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('acc_step1_q', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('acc_step1_desc', lang)}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {situation === 'contract'
                                    ? t('acc_opt_contract', lang)
                                    : situation === 'nocontract'
                                    ? t('acc_opt_nocontract', lang)
                                    : situation === 'shared'
                                    ? t('acc_opt_shared', lang)
                                    : selectedSupport
                                    ? (housingSupports.find(s => s.id === selectedSupport)?.title[lang] || t('acc_opt_supports', lang))
                                    : t('acc_opt_supports', lang)
                                }
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {situation === 'supports'
                                    ? (selectedSupport ? t('acc_supports_subtitle', lang) : t('acc_supports_select_prompt', lang))
                                    : t('acc_step2_alert_title', lang)
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ STEP 1 — Situation ══════════════════════════════════ */}
                    {step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {options.map((opt, idx) => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setSituation(opt.id); handleNext(); }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className={`
                                        group w-full animate-in slide-in-from-bottom-4 duration-500
                                        bg-white border border-slate-100 rounded-[2.25rem]
                                        p-5 flex items-center gap-4 text-left transition-all duration-500
                                        hover:border-slate-200 active:scale-[0.97]
                                        hover:shadow-2xl hover:shadow-slate-200/50 ${opt.ring} ${opt.glow}
                                    `}
                                >
                                    {/* Icon Box */}
                                    <div className="relative w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100/50 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        <span>{opt.emoji}</span>
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full ${opt.badgeStyle}`}>
                                                {opt.badge}
                                            </span>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight group-hover:text-slate-950 transition-colors">
                                            {opt.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 font-medium leading-tight mt-1 group-hover:text-slate-600 transition-colors">
                                            {opt.desc}
                                        </p>
                                    </div>

                                    {/* Arrow Button */}
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-amber-950 group-hover:text-white group-hover:border-amber-950 transition-all duration-300">
                                        <ChevronRight size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ STEP 2 — Checklist & Forms ═══════════════════════════ */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            
                            {situation !== 'supports' ? (
                                <>
                                    {/* Alert Box */}
                                    {situation === 'buying' ? (
                                        <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-550 shrink-0">
                                                    <MapPin size={18} className="text-amber-500" />
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                        {lang === 'pt' ? 'Isenção de IMT e IMI' : lang === 'es' ? 'Exención de IMT e IMI' : lang === 'fr' ? 'Exonération d\'IMT et d\'IMI' : 'IMT and IMI Tax Exemptions'}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                        {lang === 'pt' 
                                                            ? 'Se comprar para habitação própria e permanente, pode estar isento de IMT (até certo patamar de valor). Após a escritura, tem 6 meses para mudar a morada fiscal no Portal das Finanças para pedir isenção de IMI por 3 anos.' 
                                                            : lang === 'es'
                                                            ? 'Si compra para vivienda propia y permanente, puede estar exento del IMT (hasta cierto límite de valor). Tras la escritura, tiene 6 meses para cambiar la dirección fiscal en Hacienda y solicitar la exención del IMI durante 3 años.'
                                                            : lang === 'fr'
                                                            ? 'Si vous achetez pour votre résidence principale et permanente, vous pouvez être exonéré d\'IMT (jusqu\'à un certain seuil). Après l\'acte, vous avez 6 mois pour changer votre adresse fiscale pour demander l\'exonération d\'IMI pendant 3 ans.'
                                                            : 'If you buy for primary permanent residence, you may be exempt from IMT (up to a certain value threshold). After the deed, you have 6 months to update your tax address to request a 3-year IMI tax exemption.'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                                <a
                                                    href="https://www.portaldasfinancas.gov.pt"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-amber-600 text-[9px] font-black uppercase tracking-widest hover:text-amber-700 transition-colors"
                                                >
                                                    <Globe size={11} />
                                                    {lang === 'pt' ? 'Portal das Finanças' : 'Portal das Finanças'}
                                                    <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-3">
                                            <div className="flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-550 shrink-0">
                                                    <MapPin size={18} className="text-amber-500" />
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                        {t('acc_step2_alert_title', lang)}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                        {t('acc_step2_alert_text', lang)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 mt-2">
                                                <a
                                                    href="https://eportugal.gov.pt/pt/servicos/pedir-atestado-de-residencia"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-amber-600 text-[9px] font-black uppercase tracking-widest hover:text-amber-700 transition-colors"
                                                >
                                                    <Globe size={11} />
                                                    {t('acc_portal_eportugal_atestado', lang)}
                                                    <ExternalLink size={10} />
                                                </a>
                                                <span className="text-slate-200">|</span>
                                                <a
                                                    href="https://acaosocial.cm-porto.pt/migrantes-e-minorias-etnicas/guia-de-apoio-a-integracao-de-migrantes"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-amber-600 text-[9px] font-black uppercase tracking-widest hover:text-amber-700 transition-colors"
                                                >
                                                    <ExternalLink size={11} />
                                                    {t('acc_porto_guide', lang)}
                                                    <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Checklist Container */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
                                                    <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-550">
                                                        <CheckCircle2 size={14} className="text-amber-500 animate-in zoom-in duration-300" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recommended Forms */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
                                                        className="group w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-[2.25rem] hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 active:scale-[0.98] transition-all text-left animate-in slide-in-from-right-4 duration-500"
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:border-amber-500 transition-all duration-300">
                                                            <FileText size={18} className="text-amber-500 group-hover:text-white transition-colors" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                                {t('edu_fill_doc', lang)}
                                                            </p>
                                                            <h4 className="text-xs font-black text-slate-700 uppercase tracking-tight leading-tight whitespace-normal break-words group-hover:text-amber-500 transition-colors">
                                                                <TranslatedText text={template.title} language={language} shouldTranslate={language !== 'PT'} />
                                                            </h4>
                                                        </div>
                                                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-300">
                                                            <ChevronRight size={14} />
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            <div className="flex items-start gap-2.5 text-[10px] text-amber-600 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 animate-in fade-in duration-500">
                                                <Info size={14} className="shrink-0 mt-0.5" />
                                                <span className="font-semibold leading-normal">
                                                    {t('wiz_pdf_explicit_notice', lang)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Apoios à Habitação UI */
                                !selectedSupport ? (
                                    /* Program List */
                                    <div className="space-y-3">
                                        {housingSupports.map((sup, idx) => (
                                            <button
                                                key={sup.id}
                                                onClick={() => setSelectedSupport(sup.id)}
                                                style={{ animationDelay: `${idx * 60}ms` }}
                                                className="group w-full animate-in slide-in-from-bottom-4 duration-500 bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 active:scale-[0.98]"
                                            >
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                                    {sup.emoji}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                        {sup.title[lang]}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-bold leading-tight mt-1 group-hover:text-slate-600 transition-colors">
                                                        {sup.desc[lang]}
                                                    </p>
                                                </div>
                                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all duration-300">
                                                    <ChevronRight size={14} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    /* Program Details View */
                                    (() => {
                                        const supObj = housingSupports.find(s => s.id === selectedSupport);
                                        if (!supObj) return null;

                                        return (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                {/* Overview Description */}
                                                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-2xl">
                                                            {supObj.emoji}
                                                        </div>
                                                        <div>
                                                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                                {t('acc_supports_badge', lang)}
                                                            </span>
                                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-0.5">
                                                                {supObj.title[lang]}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-bold leading-relaxed border-t border-slate-100 pt-3">
                                                        {supObj.fullDesc[lang]}
                                                    </p>
                                                    <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                                                        <a
                                                            href={supObj.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                                        >
                                                            <Globe size={12} className="text-emerald-500" />
                                                            {supObj.linkLabel[lang]}
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Step by step procedures (Trâmites) */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 px-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            {t('acc_supports_procedures', lang)}
                                                        </h3>
                                                    </div>
                                                    <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-4">
                                                        {supObj.tramites[lang].map((stepText, sIdx) => (
                                                            <div key={sIdx} className="flex gap-4 items-start">
                                                                <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 shrink-0 mt-0.5">
                                                                    {sIdx + 1}
                                                                </div>
                                                                <p className="text-xs font-bold text-slate-600 leading-snug">
                                                                    {stepText}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Documents checklist */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 px-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                            {t('acc_supports_docs', lang)}
                                                        </h3>
                                                    </div>
                                                    <div className="bg-white border border-slate-100 rounded-[2.25rem] shadow-sm overflow-hidden divide-y divide-slate-50">
                                                        {supObj.docs[lang].map((docText, dIdx) => (
                                                            <div key={dIdx} className="flex gap-4 p-5 items-center hover:bg-slate-50/50 transition-colors">
                                                                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100/50 flex items-center justify-center text-lg shrink-0">
                                                                    📋
                                                                </div>
                                                                <p className="flex-1 text-xs font-bold text-slate-700 leading-snug">
                                                                    {docText}
                                                                </p>
                                                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-550">
                                                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Return button */}
                                                <button
                                                    onClick={() => setSelectedSupport('')}
                                                    className="w-full py-4 bg-slate-900 border border-slate-800 text-white rounded-[2.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-850 active:scale-95 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ArrowLeft size={14} />
                                                    {t('acc_supports_back', lang)}
                                                </button>
                                            </div>
                                        );
                                    })()
                                )
                            )}

                            {/* Reset Button */}
                            {(!situation || !selectedSupport) && (
                                <button
                                    onClick={() => { setStep(1); setSituation(''); setSelectedSupport(''); }}
                                    className="group w-full py-5 rounded-[2.25rem] border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                    {t('edu_reset', lang)}
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

