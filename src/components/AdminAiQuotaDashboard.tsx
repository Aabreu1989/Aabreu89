import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, Activity, AlertTriangle, CheckCircle2, RefreshCw, 
  BarChart2, ShieldAlert, ShieldCheck, Clock, Layers, TrendingUp, AlertCircle
} from 'lucide-react';
import { aiQuotaService, AiGlobalTelemetrySummary } from '../services/aiQuotaService';

export const AdminAiQuotaDashboard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<AiGlobalTelemetrySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const data = await aiQuotaService.fetchGlobalTelemetry();
      setTelemetry(data);
    } catch (e) {
      console.error('Erro ao atualizar telemetria:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000); // Polling a cada 10s
    return () => clearInterval(interval);
  }, []);

  if (!telemetry) {
    return (
      <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl flex items-center justify-center gap-3 text-white/60">
        <RefreshCw size={18} className="animate-spin text-[#FF8C00]" />
        <span className="text-xs font-bold uppercase tracking-wider">A carregar telemetria soberana do Supabase...</span>
      </div>
    );
  }

  const statusColor = 
    telemetry.geminiStatus === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    telemetry.geminiStatus === 'LOCAL_ONLY' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
    telemetry.geminiStatus === 'DEGRADED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-red-400 bg-red-500/10 border-red-500/30';

  const formatTokens = (val: number) => val.toLocaleString('pt-PT');

  return (
    <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF8C00]/20 border border-[#FF8C00]/40 rounded-2xl flex items-center justify-center">
            <Cpu className="text-[#FF8C00]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              MIRA CHAT — Gemini / Quota & Telemetria
            </h3>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
              Telemetria Backend Soberana &middot; Fonte: <span className="text-emerald-400">public.ai_api_telemetry</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
            <Activity size={12} className="animate-pulse" />
            <span>Estado: {telemetry.geminiStatus}</span>
          </div>
          <button 
            onClick={refresh}
            disabled={isLoading}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            title="Atualizar Telemetria do Banco"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 📊 PAINEL 1: CONSUMO REAL OBSERVADO PELO MIRA (API GEMINI) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
            <BarChart2 size={13} className="text-[#FF8C00]" />
            Consumo Real Observado pelo MIRA (Backend / Gemini API)
          </span>
          <span className="text-[9px] font-bold text-white/40">
            {telemetry.totalCalls} chamadas registadas
          </span>
        </div>

        {/* Linha 1: Métricas de Chamadas e Tokens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Chamadas Reais */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Chamadas Gemini Reais</p>
            <p className="text-2xl font-black text-white">{telemetry.totalCalls}</p>
            <div className="flex items-center gap-2 mt-1 text-[8px] font-bold">
              <span className="text-emerald-400">✓ {telemetry.successfulCalls} ({telemetry.successRate}%)</span>
              {telemetry.errorRate > 0 && (
                <span className="text-red-400">✗ {telemetry.rateLimit429Count + telemetry.serverError5xxCount} ({telemetry.errorRate}%)</span>
              )}
            </div>
          </div>

          {/* Prompt Tokens (Entrada) */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Tokens Entrada (Prompt)</p>
            <p className="text-2xl font-black text-blue-400">{formatTokens(telemetry.tokensPromptObserved)}</p>
            <p className="text-[8px] text-white/30 font-bold uppercase mt-1">Contexto & Directivas</p>
          </div>

          {/* Candidate Tokens (Saída) */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Tokens Saída (Output)</p>
            <p className="text-2xl font-black text-emerald-400">{formatTokens(telemetry.tokensCandidatesObserved)}</p>
            <p className="text-[8px] text-white/30 font-bold uppercase mt-1">Respostas Geradas</p>
          </div>

          {/* Total Tokens & Média */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Tokens Observados</p>
            <p className="text-2xl font-black text-cyan-400">{formatTokens(telemetry.tokensTotalObserved)}</p>
            <p className="text-[8px] text-white/40 font-bold uppercase mt-1">
              Média: {formatTokens(telemetry.averageTokensPerRequest)} tok/req
            </p>
          </div>
        </div>

        {/* Linha 2: Janela Temporal (Hoje / 7 Dias / Mês) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tokens Hoje (00:00 UTC)</p>
              <p className="text-xl font-black text-white mt-0.5">{formatTokens(telemetry.tokensToday)}</p>
            </div>
            <Clock size={18} className="text-white/20" />
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tokens Últimos 7 Dias</p>
              <p className="text-xl font-black text-white mt-0.5">{formatTokens(telemetry.tokens7Days)}</p>
            </div>
            <TrendingUp size={18} className="text-white/20" />
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tokens no Mês Corrente</p>
              <p className="text-xl font-black text-white mt-0.5">{formatTokens(telemetry.tokensMonth)}</p>
            </div>
            <Layers size={18} className="text-white/20" />
          </div>
        </div>

        {/* Linha 3: Performance Técnica, Erros & Modelos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Latência & Última Chamada */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Performance Backend</p>
            <p className="text-sm font-black text-white">Latência Média: <span className="text-emerald-400">{telemetry.averageLatencyMs}ms</span></p>
            <p className="text-[9px] text-white/50">
              Última chamada: {telemetry.lastCallTimestamp ? new Date(telemetry.lastCallTimestamp).toLocaleTimeString('pt-PT') : 'Nenhuma'}
              {telemetry.lastCallLatencyMs ? ` (${telemetry.lastCallLatencyMs}ms)` : ''}
            </p>
          </div>

          {/* Rate Limits & Erros */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Erros & Rate Limits</p>
            <div className="flex items-center gap-4 text-sm font-black mt-0.5">
              <span className={telemetry.rateLimit429Count > 0 ? 'text-red-400' : 'text-white/60'}>
                429: {telemetry.rateLimit429Count}
              </span>
              <span className={telemetry.serverError5xxCount > 0 ? 'text-red-400' : 'text-white/60'}>
                5xx: {telemetry.serverError5xxCount}
              </span>
            </div>
            <p className="text-[8px] text-white/30 uppercase font-bold">Resiliência com Fallback Local</p>
          </div>

          {/* Consumo por Modelo */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Consumo por Modelo</p>
            {Object.keys(telemetry.modelUsage).length === 0 ? (
              <p className="text-xs text-white/40 font-bold">Nenhum modelo registado</p>
            ) : (
              <div className="space-y-1 mt-1">
                {Object.entries(telemetry.modelUsage).map(([mName, mStat]) => (
                  <div key={mName} className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-[#FF8C00] truncate max-w-[130px]">{mName}</span>
                    <span className="text-white/60 font-bold">{formatTokens(mStat.tokens)} tok ({mStat.calls} req)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 🛡️ PAINEL 2: PROTEÇÃO DE ORÇAMENTO (MONITOR INTERNO DE SEGURANÇA) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-white/80 font-bold flex items-center gap-2">
            <ShieldCheck size={16} className={telemetry.safetyBudgetExceeded ? 'text-red-400' : 'text-emerald-400'} />
            <span>PROTEÇÃO DE ORÇAMENTO (MONITOR INTERNO DE SEGURANÇA):</span>
          </span>
          <div className="flex items-center gap-3 text-[11px] font-black">
            <span className="text-white/50">
              Consumido: <span className="text-cyan-400">{formatTokens(telemetry.tokensTotalObserved)}</span>
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/50">
              Orçamento: <span className="text-white">{formatTokens(telemetry.safetyBudgetTokens)}</span>
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/50">
              Restante: <span className={telemetry.budgetPercent > 80 ? 'text-amber-400' : 'text-emerald-400'}>{formatTokens(telemetry.budgetRemaining)}</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
              telemetry.budgetPercent > 80 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {telemetry.budgetPercent}%
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Orçamento Interno */}
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${
              telemetry.safetyBudgetExceeded ? 'bg-red-500' :
              telemetry.budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(2, telemetry.budgetPercent)}%` }}
          />
        </div>

        {telemetry.safetyBudgetExceeded && (
          <p className="text-[10px] font-bold text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={13} />
            Orçamento interno de segurança atingido. Todas as perguntas abertas estão preventivamente em modo LOCAL ONLY para proteger a conta.
          </p>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ⚖️ PAINEL 3: GOVERNANÇA & QUOTA OFICIAL GOOGLE */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/40 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-400 shrink-0" size={18} />
          <div>
            <p className="font-bold text-white/90 text-[11px] uppercase tracking-wider">
              Declaração Soberana de Quota (Google Generative AI):
            </p>
            <p className="text-white/50 text-[10px] mt-0.5">
              A quota oficial restante da Google não é exposta pela API REST. O MIRA controla o consumo observado a partir de cada chamada real recebida e confirmada pelo backend (<code className="text-blue-300">api/chat.js</code>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[9px] font-bold text-blue-300 shrink-0 uppercase tracking-widest">
          <span>{telemetry.provider}</span>
          <span className="text-white/30">&middot;</span>
          <span>{telemetry.model}</span>
        </div>
      </div>
    </div>
  );
};
