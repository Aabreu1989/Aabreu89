import React, { useState, useEffect } from 'react';
import { BarChart3, Map, Activity, FileBarChart, Users, TrendingUp, HeartHandshake, Loader2 } from 'lucide-react';
import { adminService } from '../services/adminService';

export const PublicPolicyDashboard: React.FC = () => {
  const [data, setData] = useState<{ totalInteractions: number; categories: any[] }>({ totalInteractions: 0, categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.fetchPolicyAnalytics().then(res => {
      if (res && res.categories) {
        setData(res);
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-white/10 space-y-8 animate-in slide-in-from-bottom-6 duration-700 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30">
                <HeartHandshake size={24} />
            </div>
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Painel de Apoio Comunitário & Políticas Públicas</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">DADOS REAIS E AUDITÁVEIS REGISTADOS NO SUPABASE</p>
            </div>
        </div>
        <span className="text-[9px] font-black text-[#FF8C00] bg-[#FF8C00]/20 px-4 py-2 rounded-2xl border border-orange-500/30 uppercase tracking-widest">
            100% Auditável
        </span>
      </div>

      <p className="text-xs text-slate-400 font-medium leading-relaxed bg-white/5 p-6 rounded-[2rem] border border-white/10">
        Métricas calculadas exclusivamente a partir de dados reais da plataforma (registos de atividade, posts comunitários e minutas de documentos). Não são utilizados dados simulados ou fictícios.
      </p>

      {/* Áreas com Maior Procura (Dados Reais) */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileBarChart size={14} className="text-slate-400"/> Distribuição Real de Pedidos e Interações (Total: {data.totalInteractions})
        </h4>

        {loading ? (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-orange-500" size={24} />
            </div>
        ) : (
            <div className="space-y-4">
                {data.categories.map(issue => (
                    <div key={issue.key} className="group p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                        <div className="flex justify-between text-[11px] text-white font-black uppercase tracking-tight">
                            <span>{issue.label}</span>
                            <span className="text-slate-400">{issue.count} registos ({issue.percentage}%)</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(issue.percentage, 3)}%`, backgroundColor: issue.color }}></div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 justify-center pt-6 border-t border-white/10">
        <Users size={14} className="text-white/40" />
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fonte: Supabase Database Analytics • MIRA 2026 Audit-Ready</p>
      </div>
    </div>
  );
};