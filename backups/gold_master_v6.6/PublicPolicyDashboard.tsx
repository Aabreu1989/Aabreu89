import React from 'react';
import { BarChart3, Map, Activity, FileBarChart, Users, AlertTriangle, TrendingUp, HeartHandshake } from 'lucide-react';

export const PublicPolicyDashboard: React.FC = () => {
  // Mock data for the dashboard simulation
  const topIssues = [
    { label: 'Apoio Agendamento AIMA', value: 85, color: 'bg-red-500' },
    { label: 'Acesso a Habitação', value: 72, color: 'bg-orange-500' },
    { label: 'Informação NISS', value: 45, color: 'bg-yellow-500' },
    { label: 'Dúvidas Emprego', value: 30, color: 'bg-blue-500' },
  ];

  const regionalData = [
    { region: 'Lisboa', activity: 'Alta', type: 'Habitação' },
    { region: 'Porto', activity: 'Média', type: 'Emprego' },
    { region: 'Setúbal', activity: 'Alta', type: 'Saúde' },
    { region: 'Faro', activity: 'Baixa', type: 'Legal' },
    { region: 'Braga', activity: 'Média', type: 'Educação' },
    { region: 'Coimbra', activity: 'Baixa', type: 'Legal' },
  ];

  return (
    <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-white/10 space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <HeartHandshake size={24} />
            </div>
            <div>
                <h3 className="mira-module-title !text-2xl !leading-none tracking-tight">Painel de Apoio Comunitário</h3>
                <p className="mira-module-subtitle !mb-0 mt-1 uppercase tracking-widest">DADOS ANONIMIZADOS DA COMUNIDADE</p>
            </div>
        </div>
        <button className="text-[10px] font-black text-white bg-mira-orange px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 uppercase tracking-widest transition-all active:scale-95">
            Ver Relatório
        </button>
      </div>

      <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
        Os dados recolhidos ajudam a nossa ONG a identificar onde é necessário mais apoio voluntário e recursos para ajudar a comunidade migrante.
      </p>
      
      {/* AI Analysis */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <h4 className="text-[10px] font-black text-slate-400 flex items-center gap-2 mb-4 relative z-10 uppercase tracking-[0.2em]">
            <TrendingUp size={14} className="text-mira-secondary"/> Previsão de Necessidades
        </h4>
        <div className="flex items-end gap-3 mb-4 relative z-10">
            <span className="text-4xl font-black tracking-tighter">85%</span>
            <span className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Necessidade de Apoio em Saúde</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mb-4 relative z-10">
            <div className="bg-red-500 h-full w-[85%] rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
        </div>
        <p className="text-[11px] text-slate-400 font-medium relative z-10 leading-relaxed">
            Estimativa: Aumento da procura por orientação no acesso aos Centros de Saúde em Lisboa.
        </p>
      </div>

      {/* Top Issues Bar Chart */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileBarChart size={14} className="text-slate-400"/> Áreas com Maior Procura
        </h4>
        <div className="space-y-5">
            {topIssues.map(issue => (
                <div key={issue.label} className="group">
                    <div className="flex justify-between text-[11px] text-slate-600 mb-2 font-black uppercase tracking-tight">
                        <span>{issue.label}</span>
                        <span className="text-slate-400">{issue.value}% IMPACTO</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${issue.color} transition-all duration-1000 group-hover:opacity-80`} style={{width: `${issue.value}%`}}></div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Regional List */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Map size={14} className="text-slate-400"/> Atividade por Região
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {regionalData.map(r => (
                <div key={r.region} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center hover:border-indigo-100 hover:bg-white transition-all group">
                    <p className="text-xs font-black text-slate-900 tracking-tight">{r.region}</p>
                    <span className={`inline-block text-[8px] px-2 py-0.5 rounded-lg mt-2 font-black uppercase tracking-widest ${r.activity === 'Alta' ? 'bg-red-50 text-red-500' : r.activity === 'Média' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-500'}`}>
                        {r.activity}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter truncate w-full">{r.type}</p>
                </div>
            ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 justify-center pt-6 border-t border-slate-50">
        <Users size={14} className="text-white/20" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Baseado em interações da rede de solidariedade • MIRA 2026</p>
      </div>
    </div>
  );
};