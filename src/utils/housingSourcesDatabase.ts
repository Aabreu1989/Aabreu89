export type HousingMarketSegment =
  | 'long_term'
  | 'room'
  | 'mid_term'
  | 'rural'
  | 'tourist_excluded'
  | 'official_statistics';

export interface HousingSource {
  id: string;
  name: string;
  url: string;
  category: string;
  trust_level: number; // 1-10 (10 = Oficial/Governamental, 9 = Agregador Líder, etc.)
  segment?: HousingMarketSegment;
  isOfficial?: boolean;
  notes?: string;
}

export const HOUSING_SOURCES_DATABASE: HousingSource[] = [
  // 1. FONTES OFICIAIS DO ESTADO E AUTORIDADES REGULADORAS
  {
    id: 'ine-oficial',
    name: 'INE — Instituto Nacional de Estatística',
    url: 'https://www.ine.pt',
    category: 'Estatística Oficial do Estado',
    trust_level: 10,
    segment: 'official_statistics',
    isOfficial: true,
    notes: 'Estatísticas de Rendas da Habitação ao nível local (Medianas de novos contratos em €/m²).'
  },
  {
    id: 'bdp-oficial',
    name: 'Banco de Portugal',
    url: 'https://www.bportugal.pt',
    category: 'Autoridade Macroprudencial',
    trust_level: 10,
    segment: 'official_statistics',
    isOfficial: true,
    notes: 'Recomendação macroprudencial para concessão de crédito (LTV até 90% em HPP, DSTI referência <= 50%).'
  },
  {
    id: 'at-oficial',
    name: 'Autoridade Tributária e Aduaneira (AT)',
    url: 'https://info.portaldasfinancas.gov.pt',
    category: 'Autoridade Tributária',
    trust_level: 10,
    segment: 'official_statistics',
    isOfficial: true,
    notes: 'Tabelas do CIMT e regime de isenção IMT Jovem (DL n.º 48-A/2024 e Ofício-Circulado n.º 40019/2024).'
  },
  {
    id: 'ihru-oficial',
    name: 'IHRU — Instituto da Habitação e da Reabilitação Urbana',
    url: 'https://www.portaldahabitacao.pt/porta-65-jovem',
    category: 'Instituto Público da Habitação',
    trust_level: 10,
    segment: 'official_statistics',
    isOfficial: true,
    notes: 'Programa Porta 65 Jovem (DL n.º 42/2024 e Portaria n.º 277-A/2010 consolidada).'
  },
  {
    id: 'dgtf-oficial',
    name: 'DGTF — Direção-Geral do Tesouro e Finanças',
    url: 'https://www.dgtf.gov.pt',
    category: 'Garantia Pública do Estado',
    trust_level: 10,
    segment: 'official_statistics',
    isOfficial: true,
    notes: 'Garantia pessoal do Estado para crédito à habitação jovem (DL n.º 44/2024 e Portaria n.º 236-A/2024).'
  },

  // 2. OS 13 PORTAIS DE MERCADO SEGMENTADOS
  {
    id: 'house-1',
    name: 'Idealista',
    url: 'https://www.idealista.pt/',
    category: 'Imobiliária / Líder',
    trust_level: 9,
    segment: 'long_term',
    notes: 'Benchmark principal de arrendamento e venda residencial de longa duração.'
  },
  {
    id: 'house-2',
    name: 'Imovirtual',
    url: 'https://www.imovirtual.com/',
    category: 'Imobiliária / Líder',
    trust_level: 9,
    segment: 'long_term',
    notes: 'Cobertura metropolitana e distrital em arrendamento e venda residencial.'
  },
  {
    id: 'house-3',
    name: 'OLX Imóveis',
    url: 'https://www.olx.pt/imoveis/casas-moradias-para-arrendar-vender/',
    category: 'Classificados',
    trust_level: 8,
    segment: 'long_term',
    notes: 'Classificados diretos proprietário e agências para periferias e interior.'
  },
  {
    id: 'house-4',
    name: 'CustoJusto',
    url: 'https://www.custojusto.pt/',
    category: 'Classificados',
    trust_level: 8,
    segment: 'long_term',
    notes: 'Forte penetração concelhia fora dos grandes centros urbanos.'
  },
  {
    id: 'house-5',
    name: 'Uniplaces',
    url: 'https://www.uniplaces.com/',
    category: 'Alojamento Universitário/Médio Prazo',
    trust_level: 9,
    segment: 'mid_term',
    notes: 'Mobilidade internacional de médio prazo (1-12 meses); segregado de longa duração.'
  },
  {
    id: 'house-6',
    name: 'Casa SAPO',
    url: 'https://casa.sapo.pt/',
    category: 'Portal Imobiliário',
    trust_level: 9,
    segment: 'long_term',
    notes: 'Portal imobiliário institucional com presença nacional.'
  },
  {
    id: 'house-7',
    name: 'BQuarto',
    url: 'https://www.bquarto.pt/',
    category: 'Arrendamento de Quartos',
    trust_level: 8,
    segment: 'room',
    notes: 'Especializado exclusivamente em quartos individuais e partilhados.'
  },
  {
    id: 'house-8',
    name: 'Roomgo',
    url: 'https://www.roomgo.pt/',
    category: 'Arrendamento de Quartos',
    trust_level: 8,
    segment: 'room',
    notes: 'Comunidade de partilha de habitação e quartos.'
  },
  {
    id: 'house-9',
    name: 'Casafari',
    url: 'https://pt.casafari.com/',
    category: 'Metasearch Imobiliário',
    trust_level: 8,
    segment: 'long_term',
    notes: 'Metasearch B2B para agregação analítica inter-portais.'
  },
  {
    id: 'house-10',
    name: 'Spotahome',
    url: 'https://www.spotahome.com/',
    category: 'Reserva Online Médio Prazo',
    trust_level: 9,
    segment: 'mid_term',
    notes: 'Arrendamento 100% online verificado de médio prazo para recém-chegados.'
  },
  {
    id: 'house-11',
    name: 'HousingAnywhere',
    url: 'https://housinganywhere.com/',
    category: 'Plataforma Internacional / Estudantes',
    trust_level: 9,
    segment: 'mid_term',
    notes: 'Plataforma internacional de transição e estudantes.'
  },
  {
    id: 'house-12',
    name: 'Pure Portugal',
    url: 'https://pureportugal.co.uk/',
    category: 'Propriedades Rurais / Ecológicas',
    trust_level: 8,
    segment: 'rural',
    notes: 'Foco exclusivo em propriedades rurais e quintas no interior de Portugal.'
  },
  {
    id: 'house-13',
    name: 'Airbnb Portugal',
    url: 'https://www.airbnb.pt/portugal/stays',
    category: 'Alojamento Local / Curto-Médio Prazo',
    trust_level: 9,
    segment: 'tourist_excluded',
    notes: '🔴 EXCLUÍDO do benchmark de residência permanente de longa duração.'
  }
];
