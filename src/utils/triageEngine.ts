// src/utils/triageEngine.ts
import { SafeProfileContext } from '../services/geminiService';

export const CANONICAL_METRO_STATIONS = [
  { id: 'chegada', name: '1. Chegada & Visto Consular', nextTip: 'obtenção do NIF nas Finanças com passaporte' },
  { id: 'nif', name: '2. NIF (Número de Identificação Fiscal)', nextTip: 'obtenção do NISS na Segurança Social' },
  { id: 'niss', name: '3. NISS (Segurança Social)', nextTip: 'inscrição no Centro de Saúde (SNS) para obter Número de Utente' },
  { id: 'sns', name: '4. SNS (Número de Utente do Centro de Saúde)', nextTip: 'procura ativa de emprego e celebração de contrato de trabalho' },
  { id: 'emprego', name: '5. Emprego & Contrato de Trabalho', nextTip: 'agendamento e regularização de residência na AIMA' },
  { id: 'residencia', name: '6. Residência Legal (AIMA / Título de Residência)', nextTip: 'integração plena e consolidação dos direitos' }
];

export interface TriageResult {
  locationStatus: string;
  locationSource: string;
  currentDistrict: string | null;
  completedStations: string[];
  pendingStations: string[];
  nextStation: string | null;
  intentType: string;
  triageAction: string;
  criticalMissing: string;
  triageDirective: string;
  extractedSalary: string | null;
  structuredContextBlock: string;
}

/**
 * Motor Determinístico de Avaliação de Slots e Triagem do MIRA.
 * Executado antes de qualquer chamada ao LLM para garantir que a lógica
 * de slots, precedência, jornada e criticidade seja controlada por código.
 */
export function evaluateTriageProtocol(
  prompt: string = '',
  history: any[] = [],
  profileContext: SafeProfileContext = {}
): TriageResult {
  const p = (prompt || '').toLowerCase().trim();
  const histText = Array.isArray(history)
    ? history.map(h => (h.content || h.text || '').toLowerCase()).join(' ')
    : '';

  // 1. AVALIAÇÃO DE LOCALIZAÇÃO (Precedência: Chat Recente > Perfil > Desconhecido)
  let locationStatus = 'DESCONHECIDO';
  let locationSource = 'NENHUMA';
  let currentDistrict = profileContext.district || null;

  const districts = [
    'lisboa', 'porto', 'braga', 'setúbal', 'setubal', 'aveiro', 'faro', 'coimbra',
    'leiria', 'santarém', 'santarem', 'viseu', 'viana do castelo', 'vila real',
    'castelo branco', 'bragança', 'braganca', 'guarda', 'évora', 'evora', 'beja',
    'portalegre', 'funchal', 'madeira', 'açores', 'acores', 'ponta delgada'
  ];

  for (const d of districts) {
    if (p.includes(d) || p.includes(`em ${d}`) || p.includes(`para ${d}`) || p.includes(`no ${d}`) || p.includes(`na ${d}`)) {
      currentDistrict = d.charAt(0).toUpperCase() + d.slice(1);
      locationStatus = `PORTUGAL (${currentDistrict})`;
      locationSource = 'CHAT_RECENTE (Precedência Ativa)';
      break;
    }
  }

  if (locationStatus === 'DESCONHECIDO') {
    if (
      p.includes('cheguei a portugal') || p.includes('cheguei ontem') || 
      p.includes('estou em portugal') || p.includes('a viver em portugal') || 
      p.includes('já estou cá') || p.includes('ja estou ca')
    ) {
      locationStatus = currentDistrict ? `PORTUGAL (${currentDistrict})` : 'PORTUGAL (Distrito não especificado)';
      locationSource = 'CHAT_RECENTE';
    } else if (
      p.includes('no meu país') || p.includes('no brasil') || 
      p.includes('em angola') || p.includes('em cabo verde') || 
      p.includes('ainda não viajei') || p.includes('quero ir para portugal') || 
      p.includes('pretendo emigrar')
    ) {
      locationStatus = 'PAÍS_DE_ORIGEM (Fora de Portugal)';
      locationSource = 'CHAT_RECENTE';
    } else if (profileContext.district) {
      locationStatus = `PORTUGAL (${profileContext.district})`;
      locationSource = 'PERFIL_ESTÁTICO';
    }
  }

  // 2. AVALIAÇÃO DE ESTAÇÕES E CONTRADIÇÕES (Precedência do Chat)
  const rawCompleted = Array.isArray(profileContext.completedStations)
    ? profileContext.completedStations.map(s => String(s).toLowerCase().trim())
    : [];

  const effectiveCompleted = new Set<string>(rawCompleted);

  // Contradições no Chat Recente (negação expressa)
  if (
    p.includes('ainda não consegui') || p.includes('ainda nao consegui') ||
    p.includes('ainda não tenho') || p.includes('ainda nao tenho') ||
    p.includes('não tenho') || p.includes('nao tenho') ||
    p.includes('falta-me') || p.includes('falta o')
  ) {
    if (p.includes('nif')) effectiveCompleted.delete('nif');
    if (p.includes('niss')) effectiveCompleted.delete('niss');
    if (p.includes('sns') || p.includes('utente')) effectiveCompleted.delete('sns');
    if (p.includes('emprego') || p.includes('trabalho')) effectiveCompleted.delete('emprego');
    if (p.includes('residência') || p.includes('residencia') || p.includes('título') || p.includes('titulo')) effectiveCompleted.delete('residencia');
  }

  // Afirmações positivas no Chat Recente
  if (p.includes('já tenho nif') || p.includes('ja tenho nif') || p.includes('já tirei o nif') || p.includes('tenho nif')) {
    effectiveCompleted.add('nif');
  }
  if (p.includes('já tenho niss') || p.includes('ja tenho niss') || p.includes('tenho niss')) {
    effectiveCompleted.add('niss');
  }
  if (p.includes('já tenho utente') || p.includes('já tenho sns')) {
    effectiveCompleted.add('sns');
  }

  const CANONICAL_KEYS = ['chegada', 'nif', 'niss', 'sns', 'emprego', 'residencia'];
  const completedList = CANONICAL_KEYS.filter(k => effectiveCompleted.has(k));
  const pendingList = CANONICAL_KEYS.filter(k => !effectiveCompleted.has(k));
  const nextStation = pendingList.length > 0 ? pendingList[0] : null;

  // 3. EXTRAÇÃO DE VALORES / PARÂMETROS
  let extractedSalary: string | null = null;
  const salaryMatch = p.match(/(?:^|\s)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d{3,5}(?:[.,]\d{1,2})?)\s*€?/);
  if (salaryMatch && salaryMatch[1]) {
    const rawVal = salaryMatch[1].trim();
    if (rawVal.includes('.') && rawVal.includes(',')) {
      extractedSalary = rawVal.replace(/\./g, '').replace(',', '.');
    } else if (rawVal.includes('.')) {
      extractedSalary = rawVal.replace(/\./g, '');
    } else if (rawVal.includes(',')) {
      extractedSalary = rawVal.replace(',', '.');
    } else {
      extractedSalary = rawVal;
    }
  }

  // 4. CLASSIFICAÇÃO DE INTENÇÃO E CRITICIDADE DE SLOTS
  let intentType = 'CONVERSATION_GENERAL';
  let triageAction = 'DIRECT_ANSWER';
  let criticalMissing = 'Nenhuma - contexto suficiente para orientação';
  let triageDirective = 'Responde de forma acolhedora, objetiva e contextualizada.';

  const isFactual = /^(o que é|o que significa|que é|como funciona|quem tem direito|onde fica|qual a diferença|para que serve)/i.test(p);
  const isCalculation = (extractedSalary !== null) || /\bsalário\b|\bbruto\b|\blíquido\b|\bordernado\b|\brecibos verdes\b/i.test(p);
  const isBroadMigration = (
    p.includes('trabalhar') || p.includes('trabalho') || p.includes('regulariz') ||
    p.includes('imigrar') || p.includes('visto') || p.includes('documentos')
  ) && (
    p.includes('como posso') || p.includes('quero') || p.includes('preciso') ||
    p.includes('posso trabalhar') || p.includes('por onde começo') || p.includes('como começar') ||
    p.includes('o que preciso')
  );

  if (isFactual && !p.includes('meu caso') && !p.includes('para mim')) {
    intentType = 'PERGUNTA_FACTUAL_CONCEITUAL';
    triageAction = 'RESPOSTA_DIRETA_SEM_TRIAGEM';
    criticalMissing = 'Nenhuma';
    triageDirective = 'Responde diretamente e com clareza à dúvida factual. NÃO inicies uma entrevista nem faças perguntas de triagem desnecessárias.';
  } else if (isCalculation) {
    intentType = 'SIMULAÇÃO_OU_CÁLCULO';
    triageAction = 'RESPOSTA_E_AÇÃO_COM_PARÂMETRO';
    criticalMissing = 'Nenhuma';
    triageDirective = `Apresenta a estimativa ou explicação e disponibiliza imediatamente o botão do simulador com os parâmetros identificados (ex: [view:SIMULATORS:salario${extractedSalary ? `?bruto=${extractedSalary}` : ''}:Calcular Salário Líquido]).`;
  } else if (isBroadMigration) {
    if (locationStatus === 'DESCONHECIDO') {
      intentType = 'PEDIDO_AMPLO_COM_AMBIGUIDADE';
      triageAction = 'TRIAGEM_COM_UMA_PERGUNTA';
      criticalMissing = 'LOCALIZAÇÃO & TIPO DE VISTO (Distinguir Visto Consular Prévio no país de origem vs. Procedimentos em Portugal)';
      triageDirective = 'Apresenta um resumo objetivo da legislação vigente em 2026 (fim da Manifestação de Interesse, exigência de visto prévio) e faz EXATAMENTE UMA pergunta de clarificação direta para saber se a pessoa já está em Portugal ou ainda no país de origem.';
    } else {
      intentType = 'PROGRESSÃO_DE_JORNADA';
      triageAction = 'AVANÇO_PARA_PRÓXIMA_ETAPA';
      triageDirective = `O utilizador já tem localização conhecida (${locationStatus}) e progresso [${completedList.join(', ')}]. NÃO perguntes sobre etapas já concluídas. Avança imediatamente para a próxima etapa pendente: ${nextStation ? nextStation.toUpperCase() : 'RESIDÊNCIA'}.`;
    }
  } else if (
    p.includes('próximos passos') || p.includes('proximos passos') ||
    p.includes('o que faço agora') || p.includes('o que fazer') ||
    p.includes('já tratei de tudo') || p.includes('ja tratei de tudo')
  ) {
    intentType = 'CONSULTA_DE_PROGRESSÃO';
    triageAction = 'AVANÇO_PARA_PRÓXIMA_ETAPA';
    triageDirective = `Avança diretamente para a próxima etapa pendente (${nextStation ? nextStation.toUpperCase() : 'RESIDÊNCIA'}) sem repetir instruções de etapas concluídas (${completedList.join(', ') || 'nenhuma'}). Trata etapas pendentes (${pendingList.join(', ')}) como não realizadas.`;
  }

  // 5. GERAÇÃO DO BLOCO ESTRUTURADO DE CONTEXTO E TRIAGEM
  const completedNames = CANONICAL_METRO_STATIONS.filter(s => completedList.includes(s.id)).map(s => s.name);
  const pendingNames = CANONICAL_METRO_STATIONS.filter(s => pendingList.includes(s.id)).map(s => s.name);
  const nextDetail = CANONICAL_METRO_STATIONS.find(s => s.id === nextStation);

  const structuredContextBlock = `
[PROTOCOLO DE TRIAGEM DETERMINÍSTICO MIRA]:
- TIPO DE INTENÇÃO DETETADA: ${intentType}
- LOCALIZAÇÃO DO UTILIZADOR: ${locationStatus} (Origem: ${locationSource})
- ESTAÇÕES CONCLUÍDAS (EFETIVAS): ${completedNames.length > 0 ? completedNames.join(' | ') : 'Nenhuma etapa concluída'}
- ESTAÇÕES PENDENTES: ${pendingNames.join(' | ')}
- PRÓXIMO FOCO PRIORITÁRIO: ${nextDetail ? `${nextDetail.name} (Próximo passo: ${nextDetail.nextTip})` : 'Jornada inicial concluída!'}
- INFORMAÇÃO CRÍTICA EM FALTA: ${criticalMissing}
- AÇÃO DE TRIAGEM OBRIGATÓRIA: ${triageAction}
- DIRETIVA DE EXECUÇÃO: ${triageDirective}

REGRAS DETERMINÍSTICAS MANDATÓRIAS DO AGENTE:
1. NÃO REPETIÇÃO: NUNCA perguntes ou instruas novamente sobre etapas já concluídas (${completedList.map(s => s.toUpperCase()).join(', ') || 'nenhuma'}).
2. NÃO INVENTAR PROGRESSO: Trata TODAS as etapas pendentes (${pendingList.map(s => s.toUpperCase()).join(', ')}) como NÃO concluídas, a menos que haja declaração explícita no chat recente.
3. PRECEDÊNCIA ABSOLUTA DO CHAT: A declaração recente do utilizador na conversa tem SEMPRE prioridade sobre os dados estáticos do perfil.
4. UMA ÚNICA PERGUNTA SE HOUVER AMBIGUIDADE: Se faltar informação crítica, faz apenas UMA pergunta de clarificação objetiva; nunca faças listas de questionamentos.`;

  return {
    locationStatus,
    locationSource,
    currentDistrict,
    completedStations: completedList,
    pendingStations: pendingList,
    nextStation,
    intentType,
    triageAction,
    criticalMissing,
    triageDirective,
    extractedSalary,
    structuredContextBlock
  };
}
