// src/components/MetroCardWizard.tsx
import React, { useState } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, Info,
    Train, RotateCcw, Compass, MapPin, ExternalLink, Globe, Sparkles, AlertTriangle,
    CreditCard, Bus, Ticket, Building2, Map, ShieldCheck, FileText, Check, Navigation
} from 'lucide-react';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';

interface MetroCardWizardProps {
    language: string;
    onBack: () => void;
}

interface CityTransportData {
    id: string;
    name: string;
    region: string;
    emoji: string;
    cardName: string;
    cardPrice: string;
    urgentCardPrice: string;
    passes: {
        name: string;
        price: string;
        scope: string;
        desc: string;
        badge?: string;
    }[];
    transportTypes: {
        type: string;
        operators: string;
        icon: string;
    }[];
    individualTickets: {
        ticket: string;
        price: string;
        notes: string;
    }[];
    whereToGet: {
        mode: string;
        time: string;
        cost: string;
        locations: string[];
    }[];
    officialWebsites: {
        name: string;
        url: string;
    }[];
}

const CITY_DATA: Record<string, CityTransportData> = {
    lisboa: {
        id: 'lisboa',
        name: 'Lisboa (Área Metropolitana)',
        region: 'Lisboa, Sintra, Cascais, Margem Sul, Setúbal',
        emoji: '🟡',
        cardName: 'Cartão Navegante (Físico / Digital)',
        cardPrice: '6,00€ (Emissão Normal - 10 dias)',
        urgentCardPrice: '12,00€ (Emissão Urgente na Hora - Mesmo Dia)',
        passes: [
            {
                name: 'Navegante Metropolitano',
                price: '40,00€ / mês',
                scope: 'Todos os 18 municípios da Área Metropolitana de Lisboa',
                desc: 'Acesso ilimitado a todos os transportes (Metro, Carris, CP, Fertagus, Barcos Transtejo, TST, Carris Metropolitana, Rodoviária de Lisboa, Scotturb).',
                badge: 'Mais Popular'
            },
            {
                name: 'Navegante Municipal',
                price: '30,00€ / mês',
                scope: '1 único município escolhido (ex: apenas Lisboa ou apenas Sintra)',
                desc: 'Válido para todos os operadores dentro dos limites daquele concelho específico.',
            },
            {
                name: 'Navegante Sub-23 (Estudante)',
                price: '0,00€ (GRATUITO)',
                scope: 'Toda a Área Metropolitana de Lisboa (18 Municípios)',
                desc: 'Gratuito para todos os jovens dos 4 aos 23 anos (e estudantes do Ensino Superior até aos 24 anos com comprovativo de matrícula).',
                badge: '100% Grátis'
            },
            {
                name: 'Navegante 65+ (Sénior)',
                price: '20,00€ / mês',
                scope: 'Toda a Área Metropolitana de Lisboa',
                desc: 'Passe com desconto especial para cidadãos a partir dos 65 anos de idade.'
            },
            {
                name: 'Navegante Família',
                price: 'Máx. 80,00€ / mês',
                scope: 'Agregado Familiar completo de morada fiscal comum',
                desc: 'Pague no máximo o valor equivalente a 2 passes metropolitanos (80€) ou 2 municipais (60€) para toda a família.'
            }
        ],
        transportTypes: [
            { type: 'Metro de Lisboa', operators: 'Linhas Azul, Amarela, Verde, Vermelha', icon: '🚇' },
            { type: 'Autocarros Urbanos', operators: 'Carris (Lisboa concelho)', icon: '🚌' },
            { type: 'Elétricos Tradicionais & Ascensores', operators: 'Carris (ex: Elétrico 28E, Bica, Glória, Lavra)', icon: '🚃' },
            { type: 'Comboios Urbanos', operators: 'CP (Linha de Sintra, Cascais, Azambuja, Sado)', icon: '🚆' },
            { type: 'Comboio Ponte 25 de Abril', operators: 'Fertagus (Lisboa ↔ Margem Sul / Setúbal)', icon: '🚄' },
            { type: 'Barcos / Cacilheiros', operators: 'Transtejo / Soflusa (Cais Sodré ↔ Cacilhas, Seixal, Montijo, Barreiro)', icon: '⛴️' },
            { type: 'Autocarros Intermunicipais', operators: 'Carris Metropolitana (Margem Sul e Norte)', icon: '🚐' },
            { type: 'Metro Ligeiro Margem Sul', operators: 'MST — Metro do Sul do Tejo (Almada / Seixal)', icon: '🚋' }
        ],
        individualTickets: [
            { ticket: 'Cartão Recarregável Viva Viagem / Navegante Otimista', price: '0,50€', notes: 'Reutilizável durante 1 ano' },
            { ticket: 'Viagem Zapping (Metro/Carris/CP/Barco/Fertagus)', price: '1,81€', notes: 'Descontado do saldo do cartão por viagem' },
            { ticket: 'Bilhete Simples de 1 Viagem (Metro / Carris)', price: '1,80€', notes: 'Válido por 60 minutos após validação' },
            { ticket: 'Bilhete Diário 24 Horas (Metro + Carris)', price: '6,80€', notes: 'Viagens ilimitadas por 24h' },
            { ticket: 'Bilhete a Bordo no Autocarro (Carris)', price: '2,10€', notes: 'Comprado diretamente ao motorista' },
            { ticket: 'Bilhete a Bordo no Elétrico Histórico (28E)', price: '3,10€', notes: 'Comprado no elétrico' },
            { ticket: 'Bilhete Elevador de Santa Justa', price: '6,00€', notes: 'Inclui acesso ao miradouro' }
        ],
        whereToGet: [
            {
                mode: 'Emissão Urgente na Hora (Mesmo Dia)',
                time: 'Imediato (10 a 20 minutos)',
                cost: '12,00€',
                locations: [
                    'Espace Navegante Marquês de Pombal (Estação de Metro)',
                    'Espace Navegante Campo Grande (Estação de Metro)',
                    'Estação de Metro Cais do Sodré',
                    'Estação CP / Metro Entrecampos',
                    'Loja do Cidadão das Laranjeiras / Saldanha'
                ]
            },
            {
                mode: 'Quiosque Ponto Navegante (Self-Service 24/7)',
                time: '2 minutos (Autosserviço)',
                cost: '12,00€',
                locations: [
                    'Máquinas Ponto Navegante em estações de metro e comboio',
                    'Lojas do Cidadão e Juntas de Freguesia aderentes',
                    'Centros Comerciais (ex: Colombo, Vasco da Gama)'
                ]
            },
            {
                mode: 'Emissão Normal nas Bilheteiras / Postos',
                time: 'Até 10 dias úteis',
                cost: '6,00€',
                locations: [
                    'Qualquer bilheteira do Metro de Lisboa ou CP',
                    'Lojas de atendimento Carris Metropolitana',
                    'Juntas de Freguesia da Área Metropolitana de Lisboa'
                ]
            },
            {
                mode: 'Pedido Online (Portal / App Navegante)',
                time: 'Entregue em casa em 5-7 dias',
                cost: '6,00€ + Porte de envio',
                locations: [
                    'Site Oficial: www.o-navegante.pt',
                    'Aplicação Móvel Navegante (Android & iOS)'
                ]
            }
        ],
        officialWebsites: [
            { name: 'Portal Oficial Navegante', url: 'https://www.o-navegante.pt' },
            { name: 'Metropolitano de Lisboa', url: 'https://www.metrolisboa.pt' },
            { name: 'CP — Comboios de Portugal', url: 'https://www.cp.pt' },
            { name: 'Carris Metropolitana', url: 'https://www.carrismetropolitana.pt' }
        ]
    },

    porto: {
        id: 'porto',
        name: 'Porto (Área Metropolitana)',
        region: 'Porto, Vila Nova de Gaia, Matosinhos, Maia, Gondomar',
        emoji: '🔵',
        cardName: 'Cartão Andante (Físico / App)',
        cardPrice: '6,00€ (Emissão Normal)',
        urgentCardPrice: '12,00€ (Emissão Urgente no próprio dia)',
        passes: [
            {
                name: 'Andante Metropolitano',
                price: '40,00€ / mês',
                scope: 'Todos os 17 municípios da Área Metropolitana do Porto',
                desc: 'Acesso ilimitado ao Metro do Porto, autocarros STCP, comboios urbanos CP e rede UNIR.',
                badge: 'Mais Popular'
            },
            {
                name: 'Andante Municipal / 3Z',
                price: '30,00€ / mês',
                scope: 'Até 3 zonas contíguas ou 1 município selecionado',
                desc: 'Ideal para quem viaja apenas na cidade do Porto ou entre 2 concelhos vizinhos.',
            },
            {
                name: 'Andante Sub-23 (Estudante)',
                price: '0,00€ (GRATUITO)',
                scope: 'Toda a Área Metropolitana do Porto',
                desc: 'Gratuito para todos os estudantes dos 4 aos 23 anos (e 24 anos para ensino superior).',
                badge: '100% Grátis'
            },
            {
                name: 'Andante 65+ (Sénior)',
                price: '20,00€ / mês',
                scope: 'Toda a Área Metropolitana do Porto',
                desc: 'Passe com tarifa social reduzida para seniores a partir dos 65 anos.'
            }
        ],
        transportTypes: [
            { type: 'Metro do Porto', operators: 'Linhas A, B, C, D, E, F', icon: '🚇' },
            { type: 'Autocarros Urbanos', operators: 'STCP (Porto, Gaia, Matosinhos)', icon: '🚌' },
            { type: 'Comboios Urbanos Porto', operators: 'CP (Linha de Guimarães, Braga, Aveiro, Marco)', icon: '🚆' },
            { type: 'Autocarros Metropolitanos', operators: 'Rede UNIR (em toda a AMP)', icon: '🚐' },
            { type: 'Elétricos Históricos', operators: 'STCP Elétricos (Linha 1, 18, 22)', icon: '🚃' },
            { type: 'Funicular dos Guindais', operators: 'Funicular da Batalha à Ribeira', icon: '🚡' }
        ],
        individualTickets: [
            { ticket: 'Cartão Recarregável Andante Azul', price: '0,60€', notes: 'Reutilizável durante 1 ano' },
            { ticket: 'Viagem Ocasional Z2', price: '1,40€', notes: 'Válido por 1 hora dentro de 2 zonas' },
            { ticket: 'Viagem Ocasional Z3', price: '1,80€', notes: 'Válido por 1h15' },
            { ticket: 'Viagem Ocasional Z4', price: '2,25€', notes: 'Válido por 1h30' },
            { ticket: 'Andante 24 Horas (Z2)', price: '5,50€', notes: 'Viagens ilimitadas em 2 zonas por 24h' },
            { ticket: 'Andante Tour 1 Dia (Toda a Rede)', price: '7,50€', notes: 'Ilimitado em todas as zonas por 24h' }
        ],
        whereToGet: [
            {
                mode: 'Lojas Andante (Emissão na Hora)',
                time: 'No próprio dia (15 minutos)',
                cost: '6,00€ / 12,00€',
                locations: [
                    'Loja Andante Trindade (Estação de Metro Central)',
                    'Loja Andante Campanhã (Interface de Transportes)',
                    'Loja Andante Casa da Música',
                    'Loja Andante São Bento (Estação CP)',
                    'Loja Andante Aeroporto Francisco Sá Carneiro'
                ]
            },
            {
                mode: 'Lojas do Cidadão & Bilheteiras CP',
                time: 'Até 5 a 10 dias',
                cost: '6,00€',
                locations: [
                    'Loja do Cidadão do Porto (Passos Manuel)',
                    'Loja do Cidadão de Vila Nova de Gaia / Matosinhos',
                    'Bilheteiras da CP Urbanos do Porto'
                ]
            },
            {
                mode: 'App Anda / Anda Digital (Telemóvel)',
                time: 'Imediato (Sem cartão físico)',
                cost: 'Gratuito',
                locations: [
                    'Aplicação Anda no telemóvel Android com NFC',
                    'Calcula automaticamente a tarifa mais barata no fim do mês'
                ]
            }
        ],
        officialWebsites: [
            { name: 'Portal Oficial Andante', url: 'https://www.linhandante.pt' },
            { name: 'Metro do Porto', url: 'https://www.metrodoporto.pt' },
            { name: 'STCP Autocarros', url: 'https://www.stcp.pt' }
        ]
    },

    coimbra: {
        id: 'coimbra',
        name: 'Coimbra (Região Centro)',
        region: 'Coimbra, Figueira da Foz, Cantanhede',
        emoji: '🟢',
        cardName: 'Cartão SMTUC / CIM Região de Coimbra',
        cardPrice: '5,00€ (Cartão Físico)',
        urgentCardPrice: '10,00€ (Urgente)',
        passes: [
            {
                name: 'Passe SMTUC Urbano Geral',
                price: '30,00€ / mês',
                scope: 'Rede Urbana de Coimbra',
                desc: 'Acesso a toda a rede de autocarros e ecovias SMTUC na cidade de Coimbra.',
                badge: 'Mais Popular'
            },
            {
                name: 'Passe Intermunicipal CIM Coimbra',
                price: '40,00€ / mês',
                scope: 'Todos os 19 municípios da Região de Coimbra',
                desc: 'Válido para transportes regionais, comboios CP regionais e ligação à Figueira da Foz.'
            },
            {
                name: 'Passe Estudante Coimbra (Sub-23)',
                price: '0,00€ (GRATUITO)',
                scope: 'Rede SMTUC / Região de Coimbra',
                desc: 'Gratuito para estudantes inscritos no ensino básico, secundário ou Universidade de Coimbra.'
            }
        ],
        transportTypes: [
            { type: 'Autocarros Urbanos', operators: 'SMTUC Coimbra', icon: '🚌' },
            { type: 'Metrobus Coimbra (Sistema Mondego)', operators: 'Metro Mondego (Lousã ↔ Coimbra B)', icon: '🚊' },
            { type: 'Comboios Regionais', operators: 'CP (Linha do Norte / Figueira da Foz)', icon: '🚆' }
        ],
        individualTickets: [
            { ticket: 'Cartão Recarregável SMTUC', price: '0,50€', notes: 'Reutilizável' },
            { ticket: 'Viagem Pré-Comprada (Zapping SMTUC)', price: '0,85€', notes: 'Descontado no cartão' },
            { ticket: 'Bilhete de 1 Viagem Comprado a Bordo', price: '1,60€', notes: 'Ao motorista' },
            { ticket: 'Bilhete Diário 24h SMTUC', price: '3,80€', notes: 'Viagens ilimitadas por 24h' }
        ],
        whereToGet: [
            {
                mode: 'Lojas SMTUC & Praça da República',
                time: 'Mesmo dia ou até 5 dias',
                cost: '5,00€',
                locations: [
                    'Loja SMTUC Praça da República',
                    'Loja SMTUC Mercado D. Pedro V',
                    'Estação CP Coimbra-A / Coimbra-B'
                ]
            }
        ],
        officialWebsites: [
            { name: 'SMTUC Coimbra', url: 'https://www.smtuc.pt' }
        ]
    },

    braga: {
        id: 'braga',
        name: 'Braga (Região Norte)',
        region: 'Braga, Guimarães, Famalicão, Barcelos',
        emoji: '🔴',
        cardName: 'Cartão TUB (Transportes Urbanos de Braga)',
        cardPrice: '5,00€',
        urgentCardPrice: '10,00€',
        passes: [
            {
                name: 'Passe TUB Urbano Braga',
                price: '30,00€ / mês',
                scope: 'Concelho de Braga',
                desc: 'Viagens ilimitadas em todos os autocarros urbanos de Braga.',
                badge: 'Mais Popular'
            },
            {
                name: 'Passe Cimbru / Cávado',
                price: '40,00€ / mês',
                scope: 'Região do Cávado (Braga, Barcelos, Esposende, Verde)',
                desc: 'Válido para deslocações intermunicipais na comunidade do Cávado.'
            },
            {
                name: 'Passe Estudante TUB Sub-23',
                price: '0,00€ (GRATUITO)',
                scope: 'Concelho de Braga / Universidade do Minho',
                desc: 'Passe 100% gratuito para estudantes residentes ou matriculados em Braga.'
            }
        ],
        transportTypes: [
            { type: 'Autocarros Urbanos', operators: 'TUB (Transportes Urbanos de Braga)', icon: '🚌' },
            { type: 'Funicular do Bom Jesus', operators: 'Elevador do Bom Jesus do Monte (Movido a Água)', icon: '🚡' },
            { type: 'Comboios Urbanos CP', operators: 'CP (Linha de Braga ↔ Porto)', icon: '🚆' }
        ],
        individualTickets: [
            { ticket: 'Cartão TUB Recarregável', price: '0,50€', notes: 'Reutilizável' },
            { ticket: 'Viagem Pré-Comprada TUB 1 Categoria', price: '0,90€', notes: 'Desconto no cartão' },
            { ticket: 'Bilhete a Bordo no Autocarro', price: '1,55€', notes: 'Comprado ao motorista' },
            { ticket: 'Funicular Bom Jesus (Ida e Volta)', price: '2,50€', notes: 'Histórico de 1882' }
        ],
        whereToGet: [
            {
                mode: 'Posto Central TUB Central de Camionagem',
                time: 'Imediato ou 3 dias',
                cost: '5,00€',
                locations: [
                    'Central de Camionagem de Braga (Avenida General Norton de Matos)',
                    'Quiosque TUB na Universidade do Minho (Gualtar)'
                ]
            }
        ],
        officialWebsites: [
            { name: 'TUB — Transportes Urbanos de Braga', url: 'https://www.tub.pt' }
        ]
    },

    faro: {
        id: 'faro',
        name: 'Faro & Algarve (Região Sul)',
        region: 'Faro, Portimão, Albufeira, Olhão, Loulé, Lagos',
        emoji: '🟡',
        cardName: 'Passe VAMUS Algarve / Próximo Faro',
        cardPrice: '5,00€',
        urgentCardPrice: '10,00€',
        passes: [
            {
                name: 'Passe VAMUS Algarve Regional',
                price: '40,00€ / mês',
                scope: 'Todo o território da região do Algarve (16 Municípios)',
                desc: 'Acesso a toda a rede de autocarros regionais VAMUS Algarve.',
                badge: 'Mais Popular'
            },
            {
                name: 'Passe Próximo Faro (Urbano)',
                price: '30,00€ / mês',
                scope: 'Rede urbana da cidade de Faro e Praias',
                desc: 'Válido para todos os autocarros urbanos "Próximo" em Faro.'
            },
            {
                name: 'Passe Estudante Algarve (Sub-23)',
                price: '0,00€ (GRATUITO)',
                scope: 'Todo o Algarve / Universidade do Algarve (UAlg)',
                desc: 'Passe gratuito para alunos matriculados nas escolas e Universidade do Algarve.'
            }
        ],
        transportTypes: [
            { type: 'Autocarros Regionais', operators: 'VAMUS Algarve (Ligação entre todas as cidades)', icon: '🚌' },
            { type: 'Autocarros Urbanos Faro', operators: 'Próximo (Rede Urbana de Faro)', icon: '🚐' },
            { type: 'Comboio Regional do Algarve', operators: 'CP (Linha do Algarve: Vila Real Sto. António ↔ Lagos)', icon: '🚆' }
        ],
        individualTickets: [
            { ticket: 'Cartão VAMUS / Próximo', price: '0,50€', notes: 'Reutilizável' },
            { ticket: 'Viagem Urbana Faro (Próximo)', price: '1,15€', notes: 'Comprado no cartão' },
            { ticket: 'Viagem a Bordo Urbano Faro', price: '2,25€', notes: 'Ao motorista' },
            { ticket: 'Viagem Regional VAMUS (Faro ↔ Olhão)', price: '2,40€', notes: 'Variável por distância' }
        ],
        whereToGet: [
            {
                mode: 'Terminal Rodoviário de Faro & Portimão',
                time: 'Mesmo dia ou 3 dias',
                cost: '5,00€',
                locations: [
                    'Terminal Rodoviário de Faro (Avenida da República)',
                    'Terminal Rodoviário de Portimão',
                    'Quiosque UAlg no Campus de Gambelas'
                ]
            }
        ],
        officialWebsites: [
            { name: 'VAMUS Algarve', url: 'https://www.vamusalgarve.pt' },
            { name: 'CP — Linha do Algarve', url: 'https://www.cp.pt' }
        ]
    }
};

export const MetroCardWizard: React.FC<MetroCardWizardProps> = ({ language, onBack }) => {
    const [selectedCity, setSelectedCity] = useState<string>('lisboa');
    const [activeTab, setActiveTab] = useState<'passes' | 'transportes' | 'precos' | 'onde'>('passes');

    const city = CITY_DATA[selectedCity] || CITY_DATA.lisboa;

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* HERO HEADER */}
            <div className="relative shrink-0 bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950 px-6 pt-5 pb-6 border-b border-white/10">
                <div className="relative z-10 flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1.5">
                            <Sparkles size={12} className="animate-pulse" /> Guia Oficial 2026
                        </span>
                    </div>
                </div>

                <div className="relative z-10 space-y-3">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                        <Train className="text-[#FF8C00]" size={26} /> Transportes Públicos & Passes
                    </h2>
                    <p className="text-xs text-slate-300 font-medium">
                        Selecione a sua cidade para ver os passes, tarifários, transportes e onde tirar o cartão.
                    </p>

                    {/* CITY SELECTOR PILLS */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 pb-1">
                        {Object.values(CITY_DATA).map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedCity(c.id)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                                    selectedCity === c.id
                                        ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/25 scale-[1.02]'
                                        : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white border border-white/10'
                                }`}
                            >
                                <span>{c.emoji}</span>
                                <span>{c.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="bg-slate-900 border-b border-white/10 px-4 py-2 flex items-center justify-around">
                {[
                    { id: 'passes', label: 'Passes & Alcance', icon: Ticket },
                    { id: 'transportes', label: 'Tipos Transportes', icon: Bus },
                    { id: 'precos', label: 'Preços & Bilhetes', icon: CreditCard },
                    { id: 'onde', label: 'Onde Tirar', icon: MapPin },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all ${
                            activeTab === tab.id
                                ? 'text-[#FF8C00] font-black'
                                : 'text-slate-400 hover:text-slate-200 font-medium'
                        }`}
                    >
                        <tab.icon size={18} />
                        <span className="text-[9px] uppercase tracking-wider">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT BODY */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar p-5 space-y-5 pb-32">
                {/* CITY INFO BADGE */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{city.emoji}</span>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{city.name}</h3>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold mt-1">{city.region}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                            {city.cardName}
                        </span>
                    </div>
                </div>

                {/* TAB 1: PASSES & ALCANCE GEOGRÁFICO */}
                {activeTab === 'passes' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-400">
                        <div className="bg-indigo-900 text-white rounded-3xl p-5 border border-indigo-700 shadow-md space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200 flex items-center gap-2">
                                <ShieldCheck size={16} /> Regras de Gratuidade & Descontos 2026
                            </h4>
                            <p className="text-xs text-indigo-100 leading-relaxed">
                                Em Portugal, o <strong>Passe de Estudante (Sub-23/24) é 100% gratuito</strong> para todos os jovens e estudantes do ensino superior. Seniores a partir de 65 anos pagam no máximo 20€/mês.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {city.passes.map((p, idx) => (
                                <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
                                    {p.badge && (
                                        <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white px-3 py-1 rounded-full shadow-sm">
                                            {p.badge}
                                        </span>
                                    )}
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{p.name}</h4>
                                        <p className="text-2xl font-black text-[#FF8C00]">{p.price}</p>
                                    </div>

                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Até onde vale (Validade Geográfica):</p>
                                        <p className="text-xs font-bold text-slate-800">{p.scope}</p>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: TIPOS DE TRANSPORTES */}
                {activeTab === 'transportes' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-400">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Bus size={18} className="text-indigo-600" /> Meios de Transporte Incluídos na Cidade
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Com o passe mensal unificado de {city.name}, pode andar em todos estes meios de transporte sem pagar bilhete adicional:
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {city.transportTypes.map((t, idx) => (
                                <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-start gap-4">
                                    <span className="text-3xl shrink-0 p-2 bg-slate-50 rounded-2xl border border-slate-100">{t.icon}</span>
                                    <div className="space-y-1">
                                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{t.type}</h5>
                                        <p className="text-[11px] font-medium text-slate-600">{t.operators}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: PREÇOS INDIVIDUAIS & CARTÃO */}
                {activeTab === 'precos' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-400">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <CreditCard size={18} className="text-emerald-600" /> Tarifário de Bilhetes Ocasionais & Cartões
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Se não tiver passe mensal, estes são os custos dos cartões físicos recarregáveis e viagens ocasionais:
                            </p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                            <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs font-black uppercase tracking-wider">
                                <span>Tipo de Bilhete / Cartão</span>
                                <span>Preço Oficial 2026</span>
                            </div>
                            {city.individualTickets.map((it, idx) => (
                                <div key={idx} className="p-4.5 flex justify-between items-center gap-3 hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="text-xs font-black text-slate-900">{it.ticket}</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{it.notes}</p>
                                    </div>
                                    <span className="text-sm font-black text-[#FF8C00] shrink-0">{it.price}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-3 text-xs text-amber-900">
                            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-black uppercase tracking-wider">Dica de Poupança MIRA:</p>
                                <p className="mt-1 leading-relaxed">Comprar bilhetes a bordo diretamente ao motorista é sempre mais caro. Use sempre a opção <strong>Zapping</strong> no cartão recarregável para pagar a tarifa mínima por viagem!</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: ONDE TIRAR O PASSE */}
                {activeTab === 'onde' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-400">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <MapPin size={18} className="text-rose-600" /> Onde & Como Solicitar o Passe
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Escolha a opção mais conveniente para emitir o seu cartão de transporte:
                            </p>
                        </div>

                        <div className="space-y-3">
                            {city.whereToGet.map((w, idx) => (
                                <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start">
                                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{w.mode}</h5>
                                        <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                            {w.cost}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500">⏱ Tempo de Emissão: {w.time}</p>

                                    <div className="space-y-1.5 pt-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Locais / Pontos de Atendimento:</p>
                                        <ul className="space-y-1">
                                            {w.locations.map((loc, lIdx) => (
                                                <li key={lIdx} className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] shrink-0" />
                                                    <span>{loc}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* WEBSITES OFICIAIS */}
                        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-white/10 space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-widest text-[#FF8C00] flex items-center gap-2">
                                <Globe size={16} /> Links & Portais Oficiais da Cidade
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {city.officialWebsites.map((web, wIdx) => (
                                    <a
                                        key={wIdx}
                                        href={web.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold text-white flex items-center justify-between border border-white/10 transition-all"
                                    >
                                        <span>{web.name}</span>
                                        <ExternalLink size={14} className="text-[#FF8C00]" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
