/**
 * 🧠 MIRA SESSION KNOWLEDGE CACHE
 * Cache de sessão para respostas do agente MIRA.
 *
 * REGRAS FUNDAMENTAIS (aprovadas na Fase E):
 * - Ámbito: apenas memória da sessão (não persiste entre sessões, não grava em DB)
 * - TTL factual estável: 60 minutos
 * - TTL contextual: duração da sessão (Infinity)
 * - TTL temporal (custos/prazos): 0 (nunca reutilizar)
 * - Dados sensíveis (NIF, NISS, IBAN): NUNCA guardados aqui
 * - Invalidação: mudança de localização, contradição de estação, KB mais recente
 */

export type IntentType =
  | 'GREETING'         // saudações — shortcircuit sem Gemini
  | 'FACTUAL_STABLE'   // o que é NIF, como funciona SNS — TTL 60min
  | 'CONTEXTUAL'       // depende de localização/estação — TTL sessão
  | 'TEMPORAL'         // custos, prazos, preços — nunca reutilizar
  | 'PERSONALISED'     // depende do estado completo do utilizador — TTL sessão
  | 'CONTINUATION';    // "e no meu caso?", "e depois?" — resposta delta

export interface SessionCacheEntry {
  promptKey: string;        // hash normalizado da pergunta
  response: string;         // resposta gerada
  contextHash: string;      // hash do contexto relevante (estações + localização + idioma)
  kbVersion: string;        // timestamp do registo ai_knowledge mais recente consultado
  timestamp: number;        // quando foi gerado (Date.now())
  ttlMs: number;            // validade em ms (0 = nunca reutilizar)
  intentType: IntentType;

  // Tópicos cobertos nesta resposta — usado para E16/E21 (delta sem repetição)
  coveredTopics: string[];
  // Tópicos de KB que foram consultados para gerar esta resposta
  sourceTopics: string[];
}

const TTL = {
  GREETING: 0,            // não armazenar saudações (irrelevante)
  FACTUAL_STABLE: 60 * 60 * 1000,   // 60 minutos
  CONTEXTUAL: Infinity,             // duração da sessão
  TEMPORAL: 0,                      // nunca reutilizar
  PERSONALISED: Infinity,           // duração da sessão
  CONTINUATION: 0,                  // não armazenar continuações
} as const;

// Palavras que sinalizam intenção temporal (custos, prazos, preços)
const TEMPORAL_SIGNALS = [
  'quanto custa', 'qual o preço', 'qual o valor', 'taxa', 'custo',
  'prazo', 'demora', 'quanto tempo', 'how much', 'how long', 'coût',
  'combien', 'cuánto', 'plazo'
];

// Palavras que sinalizam continuação/delta
const CONTINUATION_SIGNALS = [
  'e no meu caso', 'e depois', 'e então', 'e agora', 'e eu',
  'como fica', 'e para mim', 'and then', 'what about me', 'et ensuite'
];

// Saudações que fazem shortcircuit sem Gemini
export const GREETING_PATTERNS = [
  'olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite',
  'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
  'bonjour', 'salut', 'bonsoir', 'hola', 'buenos días', 'buenas tardes'
];

/**
 * Determina o tipo de intenção com base no prompt.
 */
export const detectIntentType = (prompt: string): IntentType => {
  const p = prompt.toLowerCase().trim();

  // Saudação
  if (GREETING_PATTERNS.some(g => p === g || p.startsWith(g + ' ') || p.startsWith(g + '!'))) {
    return 'GREETING';
  }

  // Continuação/delta
  if (CONTINUATION_SIGNALS.some(s => p.includes(s))) {
    return 'CONTINUATION';
  }

  // Temporal (custos, prazos)
  if (TEMPORAL_SIGNALS.some(s => p.includes(s))) {
    return 'TEMPORAL';
  }

  // Contextual — se menciona localização, cidade, distrito
  const locationSignals = ['lisboa', 'porto', 'braga', 'coimbra', 'faro', 'aveiro', 'setúbal', 'setubal', 'onde', 'perto', 'near', 'local'];
  if (locationSignals.some(s => p.includes(s))) {
    return 'CONTEXTUAL';
  }

  // Personalizado — se menciona dados pessoais contextuais
  const personalSignals = ['sou', 'tenho', 'meu', 'minha', 'i am', 'i have', 'je suis', 'j\'ai', 'soy', 'tengo'];
  if (personalSignals.some(s => p.includes(s))) {
    return 'PERSONALISED';
  }

  return 'FACTUAL_STABLE';
};

/**
 * Gera um hash leve e determinístico de uma string.
 * Não é criptográfico — apenas para comparação de cache.
 */
const lightHash = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
};

/**
 * Normaliza o prompt para uso como chave de cache.
 * Remove acentos, pontuação e espaços extra.
 */
export const normalizeForCache = (prompt: string): string => {
  return prompt
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .substring(0, 120); // máx 120 chars para a chave
};

/**
 * Gera o hash de contexto (estações + localização + idioma).
 * Não inclui dados sensíveis.
 */
export const buildContextHash = (
  completedStations: string[] = [],
  district: string = '',
  language: string = 'PT'
): string => {
  const contextStr = [
    completedStations.sort().join(','),
    district.toLowerCase(),
    language.toUpperCase()
  ].join('|');
  return lightHash(contextStr);
};

// --- Store principal (Map em memória de sessão) ---
const store = new Map<string, SessionCacheEntry>();

/**
 * Tenta recuperar uma resposta válida da cache.
 * Retorna null se: não existe, expirou, contexto mudou, ou KB mais recente.
 */
export const cacheGet = (
  prompt: string,
  contextHash: string,
  currentKbVersion: string
): SessionCacheEntry | null => {
  const key = normalizeForCache(prompt);
  const entry = store.get(key);
  if (!entry) return null;

  // TTL = 0 → nunca reutilizar
  if (entry.ttlMs === 0) {
    store.delete(key);
    return null;
  }

  // Expirado
  if (entry.ttlMs !== Infinity && Date.now() - entry.timestamp > entry.ttlMs) {
    store.delete(key);
    return null;
  }

  // Contexto mudou (localização, estações, idioma)
  if (entry.contextHash !== contextHash) return null;

  // KB foi actualizada desde que esta resposta foi gerada
  if (currentKbVersion && entry.kbVersion && currentKbVersion > entry.kbVersion) {
    store.delete(key);
    return null;
  }

  return entry;
};

/**
 * Guarda uma resposta na cache de sessão.
 * Não guarda saudações, continuações, nem respostas temporais.
 */
export const cacheSet = (
  prompt: string,
  response: string,
  contextHash: string,
  kbVersion: string,
  intentType: IntentType,
  coveredTopics: string[] = [],
  sourceTopics: string[] = []
): void => {
  const ttlMs = TTL[intentType];
  if (ttlMs === 0) return; // não armazenar

  const key = normalizeForCache(prompt);
  store.set(key, {
    promptKey: key,
    response,
    contextHash,
    kbVersion,
    timestamp: Date.now(),
    ttlMs,
    intentType,
    coveredTopics,
    sourceTopics,
  });
};

/**
 * Retorna os tópicos já cobertos na sessão actual.
 * Usado para evitar repetição (E16/E21).
 */
export const getSessionCoveredTopics = (): string[] => {
  const topics: string[] = [];
  store.forEach(entry => {
    topics.push(...entry.coveredTopics);
  });
  return [...new Set(topics)];
};

/**
 * Invalida entradas cujo kbVersion seja anterior à versão fornecida.
 * Chamado quando o SABER IA é actualizado.
 */
export const invalidateByKbVersion = (newKbVersion: string): void => {
  store.forEach((entry, key) => {
    if (entry.kbVersion && entry.kbVersion < newKbVersion) {
      store.delete(key);
    }
  });
};

/**
 * Limpa toda a cache de sessão.
 */
export const cacheClear = (): void => {
  store.clear();
};

/**
 * Retorna métricas da cache actual (para auditoria E15–E22).
 */
export const getCacheStats = () => ({
  size: store.size,
  entries: [...store.values()].map(e => ({
    promptKey: e.promptKey,
    intentType: e.intentType,
    coveredTopics: e.coveredTopics,
    ageMs: Date.now() - e.timestamp,
    ttlMs: e.ttlMs,
  }))
});
