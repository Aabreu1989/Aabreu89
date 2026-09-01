/**
 * 🧠 MOTOR DE NORMALIZAÇÃO SEMÂNTICA & RECONHECIMENTO DE INTENÇÕES MIRA 2026
 * 
 * Elimina a dependência de correspondência literal e regex frágil.
 * Trata:
 * - Flexões verbais (procurar, procuro, procurei, procurando, busca, buscar, arranjar, arrumar, tentar, conseguir...)
 * - Sinónimos (emprego, trabalho, vaga, serviço, profissão, trampo, oportunidade)
 * - Paráfrases complexas ("vir sem contrato e procurar depois", "tentar a sorte profissionalmente")
 * - Singular / Plural (visto/vistos, filho/filhos, diploma/diplomas)
 * - Variações ortográficas e diacríticos (acentos)
 * - Proteção estrita contra falsos positivos em palavras soltas
 */

export interface SemanticMatchResult {
  intentId: string;
  confidence: number;
  kbKey: string | null;
  concept: string;
}

export const normalizeUserQuery = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^\w\s]/g, ' ')       // substitui pontuação por espaços
    .replace(/\s+/g, ' ')           // normaliza múltiplos espaços
    .trim();
};

const ROOT_MAP: Record<string, string> = {
  // Procura / busca / encontrar / arranjar / arrumar / tentar / conseguir
  'procura': 'procur', 'procurar': 'procur', 'procuro': 'procur', 'procurando': 'procur', 'procurei': 'procur', 'procurava': 'procur', 'procuraria': 'procur', 'procuram': 'procur', 'procuramos': 'procur',
  'busca': 'procur', 'buscar': 'procur', 'busco': 'procur', 'buscando': 'procur', 'busquei': 'procur', 'buscam': 'procur', 'buscamos': 'procur',
  'encontrar': 'procur', 'encontro': 'procur', 'encontrando': 'procur', 'encontrei': 'procur', 'achar': 'procur', 'acho': 'procur',
  'arranjar': 'procur', 'arranjo': 'procur', 'arrumar': 'procur', 'arrumo': 'procur', 'arrumando': 'procur',
  'conseguir': 'procur', 'consigo': 'procur', 'conseguindo': 'procur', 'consegui': 'procur',
  'tentar': 'procur', 'tento': 'procur', 'tentando': 'procur', 'tentei': 'procur', 'sorte': 'procur',

  // Emprego / trabalho / carreira / trampo / oportunidade
  'trabalho': 'trabalh', 'trabalhar': 'trabalh', 'trabalhando': 'trabalh', 'trabalhei': 'trabalh', 'trabalhador': 'trabalh', 'trabalham': 'trabalh', 'trabalhamos': 'trabalh',
  'emprego': 'trabalh', 'empregos': 'trabalh', 'vaga': 'trabalh', 'vagas': 'trabalh', 'servico': 'trabalh', 'servicos': 'trabalh', 'profissao': 'trabalh',
  'trampo': 'trabalh', 'trampos': 'trabalh', 'trampar': 'trabalh',
  'oportunidade': 'trabalh', 'oportunidades': 'trabalh', 'profissional': 'trabalh', 'profissionalmente': 'trabalh',

  // Vistos & Residência
  'visto': 'visto', 'vistos': 'visto', 'visa': 'visto', 'visado': 'visto', 'visados': 'visto',
  'autorizacao': 'residencia', 'residencia': 'residencia', 'titulo': 'residencia', 'ar': 'residencia',

  // Retorno / Regresso / Voltar
  'retorno': 'retorn', 'retornar': 'retorn', 'retorno-voluntario': 'retorn', 'voltar': 'retorn', 'volto': 'retorn', 'volta': 'retorn', 'voltando': 'retorn', 'voltei': 'retorn',
  'regresso': 'retorn', 'regressar': 'retorn', 'repatriamento': 'retorn', 'repatriar': 'retorn', 'arvi': 'retorn',

  // Revalidação / Diplomas / Estudos
  'revalidacao': 'revalid', 'revalidar': 'revalid', 'reconhecimento': 'revalid', 'reconhecer': 'revalid', 'equivalencia': 'revalid', 'equivalencias': 'revalid',
  'diploma': 'diploma', 'diplomas': 'diploma', 'curso': 'diploma', 'graduacao': 'diploma', 'licenciatura': 'diploma', 'mestrado': 'diploma', 'doutoramento': 'diploma',

  // Família / Reagrupamento
  'reagrupamento': 'reagrup', 'reagrupar': 'reagrup', 'familia': 'reagrup', 'familiar': 'reagrup', 'familiares': 'reagrup',
  'esposa': 'reagrup', 'marido': 'reagrup', 'filho': 'reagrup', 'filhos': 'reagrup', 'filha': 'reagrup', 'filhas': 'reagrup', 'conjuge': 'reagrup', 'conjugue': 'reagrup', 'pais': 'reagrup',

  // Aposentadoria / Reforma (D7)
  'aposentadoria': 'aposent', 'aposentado': 'aposent', 'aposentados': 'aposent', 'reformado': 'aposent', 'reformados': 'aposent', 'reforma': 'aposent', 'd7': 'aposent',

  // Nómada Digital / Remoto (D8)
  'nomada': 'nomada', 'nomadas': 'nomada', 'nomade': 'nomada', 'nomades': 'nomada', 'd8': 'nomada', 'remoto': 'nomada', 'teletrabalho': 'nomada',

  // Nacionalidade / Cidadania
  'nacionalidade': 'nacionalid', 'cidadania': 'nacionalid', 'passaporte': 'nacionalid', 'naturalizacao': 'nacionalid', 'naturalizar': 'nacionalid',

  // Identificação e Serviços Públicos
  'nif': 'nif', 'financas': 'nif', 'fiscal': 'nif',
  'niss': 'niss', 'seguranca social': 'niss', 'seg social': 'niss',
  'sns': 'sns', 'saude': 'sns', 'utente': 'sns', 'medico de familia': 'sns', 'centro de saude': 'sns'
};

export interface IntentDefinition {
  id: string;
  concept: string;
  requiredRoots: string[];
  bonusRoots: string[];
  negativeRoots: string[];
  kbKey: string;
  minWordCount?: number;
}

export const INTENT_CATALOG: IntentDefinition[] = [
  {
    id: 'VISTO_PROCURA_TRABALHO',
    concept: 'Visto de Procura de Trabalho (120+60 dias / IEFP)',
    requiredRoots: ['procur', 'trabalh'],
    bonusRoots: ['visto', 'portugal', 'meses', 'iefp', 'validade', 'trabalho', 'emprego', 'sem contrato', 'sem emprego', 'oportunidade'],
    negativeRoots: ['revalid', 'retorn', 'nacionalid'],
    kbKey: 'visto de procura de trabalho',
    minWordCount: 2
  },
  {
    id: 'RETORNO_VOLUNTARIO',
    concept: 'Apoio ao Retorno Voluntário e Reintegração (ARVI / OIM)',
    requiredRoots: ['retorn'],
    bonusRoots: ['pais', 'origem', 'apoio', 'iom', 'oim', 'passagem', 'voluntario', 'cabo verde', 'brasil', 'angola', 'voltar', 'regressar', 'terra natal'],
    negativeRoots: ['revalid'],
    kbKey: 'retorno voluntário',
    minWordCount: 2
  },
  {
    id: 'VISTO_D1_TRABALHO',
    concept: 'Visto de Trabalho Subordinado (D1 / Contrato / Via Verde)',
    requiredRoots: ['visto', 'trabalh'],
    bonusRoots: ['contrato', 'promessa', 'empresa', 'd1', 'via verde'],
    negativeRoots: ['procur'],
    kbKey: 'visto d1',
    minWordCount: 2
  },
  {
    id: 'REAGRUPAMENTO_FAMILIAR',
    concept: 'Reagrupamento Familiar (Artigo 98.º Lei 23/2007)',
    requiredRoots: ['reagrup'],
    bonusRoots: ['filho', 'esposa', 'marido', 'familia', 'artigo 98', 'aima', 'rendimentos'],
    negativeRoots: [],
    kbKey: 'reagrupamento familiar',
    minWordCount: 1
  },
  {
    id: 'REVALIDACAO_DIPLOMA',
    concept: 'Revalidação de Diplomas e Equivalências de Graus (DGES / DGE)',
    requiredRoots: ['revalid'],
    bonusRoots: ['diploma', 'superior', 'dges', 'universidade', 'medico', 'engenheiro', 'doutoramento', 'mestrado', 'licenciatura'],
    negativeRoots: [],
    kbKey: 'revalidação de diplomas',
    minWordCount: 1
  },
  {
    id: 'VISTO_D7_REFORMADOS',
    concept: 'Visto D7 para Reformados e Titulares de Rendimentos Passivos',
    requiredRoots: ['aposent'],
    bonusRoots: ['rendimentos', 'pensao', 'banco', 'visto', 'd7', 'reforma'],
    negativeRoots: [],
    kbKey: 'visto d7',
    minWordCount: 1
  },
  {
    id: 'VISTO_D8_NOMADAS',
    concept: 'Visto D8 para Nómadas Digitais e Teletrabalho Remoto',
    requiredRoots: ['nomada'],
    bonusRoots: ['remoto', 'teletrabalho', 'visto', 'd8', 'salario', '4x rmmg'],
    negativeRoots: [],
    kbKey: 'visto d8',
    minWordCount: 1
  },
  {
    id: 'NACIONALIDADE_PORTUGUESA',
    concept: 'Nacionalidade Portuguesa e Contagem de Tempo (5 Anos)',
    requiredRoots: ['nacionalid'],
    bonusRoots: ['tempo', 'anos', 'residencia', 'irn', 'lei', 'manifestacao', 'passaporte'],
    negativeRoots: [],
    kbKey: 'lei da nacionalidade',
    minWordCount: 1
  },
  {
    id: 'NIF_FINANCAS',
    concept: 'Obtenção e Registo do NIF (Autoridade Tributária)',
    requiredRoots: ['nif'],
    bonusRoots: ['financas', 'fiscal', 'obter', 'morada', 'at'],
    negativeRoots: [],
    kbKey: 'nif',
    minWordCount: 1
  },
  {
    id: 'NISS_SEGURANCA_SOCIAL',
    concept: 'Inscrição no NISS (Segurança Social)',
    requiredRoots: ['niss'],
    bonusRoots: ['seguranca', 'social', 'trabalhador', 'inscricao'],
    negativeRoots: [],
    kbKey: 'niss',
    minWordCount: 1
  },
  {
    id: 'SNS_NUMERO_UTENTE',
    concept: 'Acesso ao SNS e Número de Utente de Saúde',
    requiredRoots: ['sns'],
    bonusRoots: ['saude', 'utente', 'centro', 'medico', 'inscricao'],
    negativeRoots: [],
    kbKey: 'sns',
    minWordCount: 1
  }
];

export const detectSemanticIntent = (query: string): SemanticMatchResult => {
  const norm = normalizeUserQuery(query);
  if (!norm || norm.length < 3) {
    return { intentId: 'UNKNOWN', confidence: 0, kbKey: null, concept: '' };
  }

  const words = norm.split(' ').filter(w => w.length > 1);

  // Paraphrase special phrases
  const hasNoJobPhrase = norm.includes('sem emprego') || norm.includes('sem contrato') || norm.includes('procurar depois') || norm.includes('tentar a minha sorte') || norm.includes('ir para portugal e trabalhar') || norm.includes('vir para portugal e trabalhar');
  
  const extractedRoots = new Set<string>();

  if (hasNoJobPhrase) {
    extractedRoots.add('procur');
    extractedRoots.add('trabalh');
  }

  words.forEach(w => {
    if (ROOT_MAP[w]) extractedRoots.add(ROOT_MAP[w]);
    Object.keys(ROOT_MAP).forEach(k => {
      if ((w.startsWith(k) || k.startsWith(w)) && Math.min(w.length, k.length) >= 4) {
        extractedRoots.add(ROOT_MAP[k]);
      }
    });
  });

  let bestMatch: SemanticMatchResult | null = null;
  let highestScore = 0;

  for (const intent of INTENT_CATALOG) {
    // Check minimum word count to avoid single-word ambiguous false positives
    if (intent.minWordCount && words.length < intent.minWordCount) {
      continue;
    }

    const hasAllRequired = intent.requiredRoots.every(r => extractedRoots.has(r));
    if (!hasAllRequired) continue;

    const hasNegative = intent.negativeRoots.some(r => extractedRoots.has(r));
    if (hasNegative) continue;

    let score = 0.85;
    const matchedBonus = intent.bonusRoots.filter(r => extractedRoots.has(r) || norm.includes(r));
    score += Math.min(0.14, matchedBonus.length * 0.05);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        intentId: intent.id,
        confidence: Math.min(0.99, score),
        kbKey: intent.kbKey,
        concept: intent.concept
      };
    }
  }

  return bestMatch || { intentId: 'UNKNOWN', confidence: 0, kbKey: null, concept: '' };
};
