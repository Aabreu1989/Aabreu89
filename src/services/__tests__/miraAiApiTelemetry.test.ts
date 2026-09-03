import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

export interface AiApiTelemetryRow {
  id?: string;
  created_at: string;
  user_id?: string | null;
  guest_id?: string | null;
  request_id: string;
  model: string;
  status: string;
  prompt_tokens: number;
  candidate_tokens: number;
  total_tokens: number;
  latency_ms?: number;
  http_status: number;
  error_code?: string | null;
  error_message?: string | null;
  finish_reason?: string | null;
}

export function computeTelemetrySummary(rows: AiApiTelemetryRow[], safetyBudgetTokens = 500000) {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime();

  let totalCalls = rows.length;
  let successfulCalls = 0;
  let rateLimit429 = 0;
  let serverError5xx = 0;
  let promptTokens = 0;
  let candidateTokens = 0;
  let totalTokens = 0;
  let tokensToday = 0;
  let tokens7Days = 0;
  let tokensMonth = 0;
  let totalLatency = 0;
  let latencyCount = 0;

  const modelUsage: Record<string, { calls: number; tokens: number }> = {};

  for (const r of rows) {
    const time = new Date(r.created_at).getTime();
    if (r.http_status === 200 && r.status === 'success') {
      successfulCalls++;
    }
    if (r.http_status === 429 || r.status === '429') {
      rateLimit429++;
    }
    if (r.http_status >= 500 || r.status === '5xx') {
      serverError5xx++;
    }

    const pTok = r.prompt_tokens || 0;
    const cTok = r.candidate_tokens || 0;
    const tTok = r.total_tokens || 0;

    promptTokens += pTok;
    candidateTokens += cTok;
    totalTokens += tTok;

    if (time >= todayStart) tokensToday += tTok;
    if (time >= sevenDaysAgo) tokens7Days += tTok;
    if (time >= monthStart) tokensMonth += tTok;

    if (r.latency_ms) {
      totalLatency += r.latency_ms;
      latencyCount++;
    }

    const m = r.model || 'unknown';
    if (!modelUsage[m]) modelUsage[m] = { calls: 0, tokens: 0 };
    modelUsage[m].calls++;
    modelUsage[m].tokens += tTok;
  }

  const avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;
  const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 100;
  const errorRate = totalCalls > 0 ? Math.round(((rateLimit429 + serverError5xx) / totalCalls) * 100) : 0;
  const budgetRemaining = Math.max(0, safetyBudgetTokens - totalTokens);
  const budgetPercent = Math.min(100, Math.round((totalTokens / safetyBudgetTokens) * 100));

  const sortedRows = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const lastCall = sortedRows[0] || null;

  return {
    totalCalls,
    successfulCalls,
    rateLimit429,
    serverError5xx,
    promptTokens,
    candidateTokens,
    totalTokens,
    tokensToday,
    tokens7Days,
    tokensMonth,
    avgLatency,
    successRate,
    errorRate,
    modelUsage,
    safetyBudgetTokens,
    budgetRemaining,
    budgetPercent,
    lastCallTimestamp: lastCall?.created_at || null,
    lastCallLatencyMs: lastCall?.latency_ms || null,
    lastCallModel: lastCall?.model || null
  };
}

describe('📊 U-GEMINI-01: TELEMETRIA REAL NO BACKEND & ADMIN HUB', () => {
  test('T-TEL-01: Captura e agregação exata de tokens, chamadas, 429 e latência', () => {
    const nowIso = new Date().toISOString();
    const rows: AiApiTelemetryRow[] = [
      {
        created_at: nowIso,
        request_id: 'req_1',
        model: 'gemini-3.6-flash',
        status: 'success',
        prompt_tokens: 350,
        candidate_tokens: 150,
        total_tokens: 500,
        latency_ms: 800,
        http_status: 200
      },
      {
        created_at: nowIso,
        request_id: 'req_2',
        model: 'gemini-3.6-flash',
        status: 'success',
        prompt_tokens: 400,
        candidate_tokens: 200,
        total_tokens: 600,
        latency_ms: 1000,
        http_status: 200
      },
      {
        created_at: nowIso,
        request_id: 'req_3',
        model: 'gemini-3.6-flash',
        status: '429',
        prompt_tokens: 0,
        candidate_tokens: 0,
        total_tokens: 0,
        latency_ms: 200,
        http_status: 429,
        error_code: 'QUOTA_EXCEEDED'
      }
    ];

    const summary = computeTelemetrySummary(rows, 500000);

    assert.equal(summary.totalCalls, 3);
    assert.equal(summary.successfulCalls, 2);
    assert.equal(summary.rateLimit429, 1);
    assert.equal(summary.promptTokens, 750);
    assert.equal(summary.candidateTokens, 350);
    assert.equal(summary.totalTokens, 1100);
    assert.equal(summary.tokensToday, 1100);
    assert.equal(summary.tokens7Days, 1100);
    assert.equal(summary.tokensMonth, 1100);
    assert.equal(summary.avgLatency, Math.round((800 + 1000 + 200) / 3));
    assert.equal(summary.budgetRemaining, 500000 - 1100);
    assert.equal(summary.lastCallModel, 'gemini-3.6-flash');
    assert.equal(summary.modelUsage['gemini-3.6-flash'].calls, 3);
    assert.equal(summary.modelUsage['gemini-3.6-flash'].tokens, 1100);
  });

  test('T-TEL-02: Orçamento interno de 500k tokens é tratado estritamente como proteção interna', () => {
    const rows: AiApiTelemetryRow[] = [
      {
        created_at: new Date().toISOString(),
        request_id: 'req_heavy',
        model: 'gemini-3.6-flash',
        status: 'success',
        prompt_tokens: 70000,
        candidate_tokens: 17420,
        total_tokens: 87420,
        latency_ms: 1200,
        http_status: 200
      }
    ];

    const summary = computeTelemetrySummary(rows, 500000);

    assert.equal(summary.totalTokens, 87420);
    assert.equal(summary.safetyBudgetTokens, 500000);
    assert.equal(summary.budgetRemaining, 412580);
    assert.equal(summary.budgetPercent, 17); // 17% arredondado
  });
});
