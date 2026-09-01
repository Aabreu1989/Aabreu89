import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, AlertTriangle, CheckCircle2, RefreshCw, BarChart2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { aiQuotaService, AiMetricsSummary } from '../services/aiQuotaService';

export const AdminAiQuotaDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AiMetricsSummary>(aiQuotaService.getMetrics());

  const refresh = () => {
    setMetrics(aiQuotaService.getMetrics());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = 
    metrics.geminiStatus === 'ONLINE' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    metrics.geminiStatus === 'LOCAL_ONLY' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
    metrics.geminiStatus === 'DEGRADED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-red-400 bg-red-500/10 border-red-500/30';

  const budgetPercent = Math.min(100, Math.round((metrics.tokensTotalObserved / metrics.safetyBudgetTokens) * 100));

  return (
    <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden space-y-6">
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
              Controlo de Consumo Observado & Free Tier Safety Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
            <Activity size={12} className="animate-pulse" />
            <span>Estado: {metrics.geminiStatus}</span>
          </div>
          <button 
            onClick={refresh}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all active:scale-95"
            title="Atualizar Métricas"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Modelo Ativo */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Modelo Ativo</p>
          <p className="text-sm font-black text-[#FF8C00] truncate">{metrics.model}</p>
          <p className="text-[7px] text-white/30 font-bold uppercase mt-1">Provider: {metrics.provider}</p>
        </div>

        {/* Total de Chamadas */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Requisições</p>
          <p className="text-xl font-black text-white">{metrics.totalCalls.toLocaleString('pt-PT')}</p>
          <p className="text-[7px] text-emerald-400 font-bold uppercase mt-1">
            Gemini: {metrics.geminiResponses} | Local: {metrics.localResponses}
          </p>
        </div>

        {/* Tokens Consumidos & Média */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Tokens Observados</p>
          <p className="text-xl font-black text-cyan-400">{metrics.tokensTotalObserved.toLocaleString('pt-PT')}</p>
          <p className="text-[7px] text-white/30 font-bold uppercase mt-1">
            Média: {metrics.averageTokensPerRequest.toLocaleString('pt-PT')} tok/req
          </p>
        </div>

        {/* Fallbacks & Erros */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Fallbacks / Erros</p>
          <p className="text-xl font-black text-amber-400">{metrics.fallbackResponses}</p>
          <p className="text-[7px] text-red-400 font-bold uppercase mt-1">
            HTTP 429: {metrics.rateLimit429Count} | 5xx: {metrics.serverError5xxCount}
          </p>
        </div>
      </div>

      {/* Orçamento Interno de Segurança do Free Tier */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-white/60 flex items-center gap-1.5">
            <ShieldCheck size={14} className={metrics.safetyBudgetExceeded ? 'text-red-400' : 'text-emerald-400'} />
            Limite Interno de Segurança (Free Tier Budget):
          </span>
          <span className="text-white">
            {metrics.tokensTotalObserved.toLocaleString('pt-PT')} / {metrics.safetyBudgetTokens.toLocaleString('pt-PT')} tokens ({budgetPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              metrics.safetyBudgetExceeded ? 'bg-red-500' :
              budgetPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        {metrics.safetyBudgetExceeded && (
          <p className="text-[9px] font-bold text-red-400">
            ⚠️ Orçamento de segurança atingido. Todas as perguntas abertas estão preventivamente em modo LOCAL ONLY.
          </p>
        )}
      </div>

      {/* Barra de Transparência de Quota */}
      <div className="p-4 bg-gradient-to-r from-blue-950/30 to-slate-900/50 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Zap className="text-blue-400 shrink-0" size={16} />
          <div>
            <p className="font-bold text-white/90 text-[11px]">Estado Oficial da Quota (Google Generative AI):</p>
            <p className="text-white/50 text-[10px]">{metrics.quotaRemainingMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider text-white/40 shrink-0">
          <span>Última chamada: {metrics.lastCallTimestamp ? new Date(metrics.lastCallTimestamp).toLocaleTimeString('pt-PT') : 'Nenhuma'}</span>
          {metrics.lastCallLatencyMs && <span className="text-emerald-400">{metrics.lastCallLatencyMs}ms</span>}
        </div>
      </div>
    </div>
  );
};
