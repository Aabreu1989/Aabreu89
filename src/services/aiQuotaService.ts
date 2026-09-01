/**
 * 📊 MIRA AI QUOTA & TELEMETRY SERVICE (2026 SOVEREIGN PROTOCOL)
 * 
 * Rastreia de forma 100% factual o consumo observado de tokens e o tráfego da API Gemini.
 * REGRA ABSOLUTA:
 * - Não inventa "saldo restante" se a API da Google não fornecer o valor.
 * - Registra métricas agregadas locais com persistência em localStorage.
 * - Protege o Free Tier através do Limite Interno de Segurança (INTERNAL_FREE_TIER_SAFETY_LIMIT).
 */

export interface AiUsageRecord {
  timestamp: string;
  source: 'gemini' | 'local' | 'local_fallback';
  provider: 'google' | 'none';
  model: string;
  status: number;
  latencyMs?: number;
  promptTokens?: number;
  candidatesTokens?: number;
  thoughtsTokens?: number;
  totalTokens?: number;
  finishReason?: string;
  fallbackReason?: string;
}

export interface AiMetricsSummary {
  model: string;
  provider: string;
  geminiStatus: 'ONLINE' | 'DEGRADED' | 'LOCAL_ONLY' | 'OFFLINE';
  totalCalls: number;
  geminiResponses: number;
  localResponses: number;
  fallbackResponses: number;
  rateLimit429Count: number;
  quotaExceededCount: number;
  serverError5xxCount: number;
  tokensPromptObserved: number;
  tokensCandidatesObserved: number;
  tokensThoughtsObserved: number;
  tokensTotalObserved: number;
  averageTokensPerRequest: number;
  safetyBudgetTokens: number;
  safetyBudgetExceeded: boolean;
  lastCallTimestamp: string | null;
  lastCallLatencyMs: number | null;
  lastError: string | null;
  quotaRemainingMessage: string;
}

const STORAGE_KEY = 'mira_gemini_quota_metrics_v2026';

class AiQuotaService {
  private summary: AiMetricsSummary = {
    model: 'gemini-3.6-flash',
    provider: 'Google AI Studio',
    geminiStatus: 'ONLINE',
    totalCalls: 0,
    geminiResponses: 0,
    localResponses: 0,
    fallbackResponses: 0,
    rateLimit429Count: 0,
    quotaExceededCount: 0,
    serverError5xxCount: 0,
    tokensPromptObserved: 0,
    tokensCandidatesObserved: 0,
    tokensThoughtsObserved: 0,
    tokensTotalObserved: 0,
    averageTokensPerRequest: 0,
    safetyBudgetTokens: 500000, // Limite interno de segurança padrão (500k tokens)
    safetyBudgetExceeded: false,
    lastCallTimestamp: null,
    lastCallLatencyMs: null,
    lastError: null,
    quotaRemainingMessage: 'Quota oficial restante da Google: não exposta pela API. Consumo observado pelo MIRA: 0 tokens'
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.summary = { ...this.summary, ...parsed };
      }
    } catch (e) {
      console.warn('⚠️ [AI QUOTA] Error reading storage:', e);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      this.summary.safetyBudgetExceeded = this.summary.tokensTotalObserved >= this.summary.safetyBudgetTokens;
      if (this.summary.geminiResponses > 0) {
        this.summary.averageTokensPerRequest = Math.round(this.summary.tokensTotalObserved / this.summary.geminiResponses);
      }
      this.summary.quotaRemainingMessage = `Quota oficial restante da Google: não exposta pela API. Consumo observado pelo MIRA: ${this.summary.tokensTotalObserved.toLocaleString('pt-PT')} tokens`;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.summary));
    } catch (e) {
      console.warn('⚠️ [AI QUOTA] Error saving storage:', e);
    }
  }

  public isSafetyBudgetExceeded(): boolean {
    return this.summary.tokensTotalObserved >= this.summary.safetyBudgetTokens;
  }

  public setSafetyBudgetTokens(limit: number) {
    this.summary.safetyBudgetTokens = limit;
    this.summary.safetyBudgetExceeded = this.summary.tokensTotalObserved >= limit;
    if (this.summary.safetyBudgetExceeded) {
      this.summary.geminiStatus = 'LOCAL_ONLY';
    }
    this.saveToStorage();
  }

  public recordCall(record: AiUsageRecord) {
    this.summary.totalCalls += 1;
    this.summary.lastCallTimestamp = record.timestamp || new Date().toISOString();
    if (record.latencyMs) this.summary.lastCallLatencyMs = record.latencyMs;

    if (record.source === 'gemini') {
      this.summary.geminiResponses += 1;
      this.summary.geminiStatus = this.isSafetyBudgetExceeded() ? 'LOCAL_ONLY' : 'ONLINE';
      this.summary.model = record.model || 'gemini-3.6-flash';

      if (record.promptTokens) this.summary.tokensPromptObserved += record.promptTokens;
      if (record.candidatesTokens) this.summary.tokensCandidatesObserved += record.candidatesTokens;
      if (record.thoughtsTokens) this.summary.tokensThoughtsObserved += record.thoughtsTokens;
      if (record.totalTokens) this.summary.tokensTotalObserved += record.totalTokens;

      if (this.summary.geminiResponses > 0) {
        this.summary.averageTokensPerRequest = Math.round(this.summary.tokensTotalObserved / this.summary.geminiResponses);
      }
    } else if (record.source === 'local') {
      this.summary.localResponses += 1;
    } else if (record.source === 'local_fallback') {
      this.summary.fallbackResponses += 1;
      if (record.status === 429 || record.fallbackReason?.includes('429') || record.fallbackReason?.includes('QUOTA')) {
        this.summary.rateLimit429Count += 1;
        this.summary.quotaExceededCount += 1;
        this.summary.geminiStatus = 'DEGRADED';
      } else if (record.fallbackReason?.includes('SAFETY_LIMIT')) {
        this.summary.geminiStatus = 'LOCAL_ONLY';
      } else if (record.status >= 500) {
        this.summary.serverError5xxCount += 1;
        this.summary.geminiStatus = 'OFFLINE';
      }
      this.summary.lastError = record.fallbackReason || `HTTP ${record.status}`;
    }

    this.saveToStorage();
  }

  public getMetrics(): AiMetricsSummary {
    return { ...this.summary };
  }

  public resetMetrics() {
    this.summary = {
      model: 'gemini-3.6-flash',
      provider: 'Google AI Studio',
      geminiStatus: 'ONLINE',
      totalCalls: 0,
      geminiResponses: 0,
      localResponses: 0,
      fallbackResponses: 0,
      rateLimit429Count: 0,
      quotaExceededCount: 0,
      serverError5xxCount: 0,
      tokensPromptObserved: 0,
      tokensCandidatesObserved: 0,
      tokensThoughtsObserved: 0,
      tokensTotalObserved: 0,
      averageTokensPerRequest: 0,
      safetyBudgetTokens: 500000,
      safetyBudgetExceeded: false,
      lastCallTimestamp: null,
      lastCallLatencyMs: null,
      lastError: null,
      quotaRemainingMessage: 'Quota oficial restante da Google: não exposta pela API. Consumo observado pelo MIRA: 0 tokens'
    };
    this.saveToStorage();
  }
}

export const aiQuotaService = new AiQuotaService();
