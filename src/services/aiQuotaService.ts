/**
 * 📊 MIRA AI QUOTA & TELEMETRY SERVICE (2026 SOVEREIGN PROTOCOL)
 * 
 * Rastreia de forma 100% factual o consumo observado de tokens e o tráfego da API Gemini.
 * REGRA ABSOLUTA:
 * - Não inventa "saldo restante" se a API da Google não fornecer o valor.
 * - Registra métricas agregadas locais com persistência em localStorage.
 * - Protege o Free Tier através do Limite Interno de Segurança (INTERNAL_FREE_TIER_SAFETY_LIMIT).
 */

import { supabase } from '../lib/supabase';

export interface ModelUsageStat {
  calls: number;
  tokens: number;
  errors: number;
}

export interface AiGlobalTelemetrySummary {
  model: string;
  provider: string;
  geminiStatus: 'ONLINE' | 'DEGRADED' | 'LOCAL_ONLY' | 'OFFLINE';
  totalCalls: number;
  successfulCalls: number;
  rateLimit429Count: number;
  serverError5xxCount: number;
  successRate: number;
  errorRate: number;
  tokensPromptObserved: number;
  tokensCandidatesObserved: number;
  tokensTotalObserved: number;
  averageTokensPerRequest: number;
  tokensToday: number;
  tokens7Days: number;
  tokensMonth: number;
  lastCallTimestamp: string | null;
  lastCallLatencyMs: number | null;
  lastCallModel: string | null;
  averageLatencyMs: number;
  modelUsage: Record<string, ModelUsageStat>;
  safetyBudgetTokens: number;
  budgetRemaining: number;
  budgetPercent: number;
  safetyBudgetExceeded: boolean;
  quotaRemainingMessage: string;
}

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

  public computeGlobalSummary(rows: any[]): AiGlobalTelemetrySummary {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime();

    let totalCalls = rows.length;
    let successfulCalls = 0;
    let rateLimit429Count = 0;
    let serverError5xxCount = 0;
    let tokensPromptObserved = 0;
    let tokensCandidatesObserved = 0;
    let tokensTotalObserved = 0;
    let tokensToday = 0;
    let tokens7Days = 0;
    let tokensMonth = 0;
    let totalLatency = 0;
    let latencyCount = 0;

    const modelUsage: Record<string, ModelUsageStat> = {};

    for (const r of rows) {
      const time = new Date(r.created_at).getTime();
      const isSuccess = r.http_status === 200 && r.status === 'success';
      if (isSuccess) successfulCalls++;
      if (r.http_status === 429 || r.status === '429') rateLimit429Count++;
      if (r.http_status >= 500 || r.status === '5xx' || r.status === 'exception') serverError5xxCount++;

      const pTok = Number(r.prompt_tokens) || 0;
      const cTok = Number(r.candidate_tokens) || 0;
      const tTok = Number(r.total_tokens) || 0;

      tokensPromptObserved += pTok;
      tokensCandidatesObserved += cTok;
      tokensTotalObserved += tTok;

      if (time >= todayStart) tokensToday += tTok;
      if (time >= sevenDaysAgo) tokens7Days += tTok;
      if (time >= monthStart) tokensMonth += tTok;

      if (r.latency_ms) {
        totalLatency += Number(r.latency_ms);
        latencyCount++;
      }

      const m = r.model || 'gemini-3.6-flash';
      if (!modelUsage[m]) modelUsage[m] = { calls: 0, tokens: 0, errors: 0 };
      modelUsage[m].calls++;
      modelUsage[m].tokens += tTok;
      if (!isSuccess) modelUsage[m].errors++;
    }

    const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 100;
    const errorRate = totalCalls > 0 ? Math.round(((rateLimit429Count + serverError5xxCount) / totalCalls) * 100) : 0;
    const avgTokens = successfulCalls > 0 ? Math.round(tokensTotalObserved / successfulCalls) : 0;

    const safetyBudgetTokens = this.summary.safetyBudgetTokens || 500000;
    const budgetRemaining = Math.max(0, safetyBudgetTokens - tokensTotalObserved);
    const budgetPercent = Math.min(100, Math.round((tokensTotalObserved / safetyBudgetTokens) * 100));
    const safetyBudgetExceeded = tokensTotalObserved >= safetyBudgetTokens;

    const lastCall = rows[0] || null;
    let geminiStatus: 'ONLINE' | 'DEGRADED' | 'LOCAL_ONLY' | 'OFFLINE' = 'ONLINE';
    if (safetyBudgetExceeded) geminiStatus = 'LOCAL_ONLY';
    else if (rateLimit429Count > 0 && lastCall && (lastCall.status === '429' || lastCall.http_status === 429)) geminiStatus = 'DEGRADED';
    else if (serverError5xxCount > 0 && lastCall && lastCall.http_status >= 500) geminiStatus = 'OFFLINE';

    return {
      model: lastCall?.model || 'gemini-3.6-flash',
      provider: 'Google AI Studio',
      geminiStatus,
      totalCalls,
      successfulCalls,
      rateLimit429Count,
      serverError5xxCount,
      successRate,
      errorRate,
      tokensPromptObserved,
      tokensCandidatesObserved,
      tokensTotalObserved,
      averageTokensPerRequest: avgTokens,
      tokensToday,
      tokens7Days,
      tokensMonth,
      lastCallTimestamp: lastCall?.created_at || null,
      lastCallLatencyMs: lastCall?.latency_ms || null,
      lastCallModel: lastCall?.model || null,
      averageLatencyMs: avgLatency,
      modelUsage,
      safetyBudgetTokens,
      budgetRemaining,
      budgetPercent,
      safetyBudgetExceeded,
      quotaRemainingMessage: `Quota oficial restante da Google: não exposta pela API REST. Consumo observado pelo MIRA: ${tokensTotalObserved.toLocaleString('pt-PT')} tokens`
    };
  }

  public async fetchGlobalTelemetry(): Promise<AiGlobalTelemetrySummary> {
    try {
      const { data, error } = await supabase
        .from('ai_api_telemetry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) {
        console.warn('⚠️ [AI QUOTA] Falha ao consultar ai_api_telemetry:', error.message);
        return this.computeGlobalSummary([]);
      }

      return this.computeGlobalSummary(data || []);
    } catch (err: any) {
      console.warn('⚠️ [AI QUOTA] Exceção ao consultar telemetria global:', err.message);
      return this.computeGlobalSummary([]);
    }
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
