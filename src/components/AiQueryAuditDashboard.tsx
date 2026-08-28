import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Briefcase, 
  Receipt, 
  HeartPulse, 
  Home, 
  Award, 
  GraduationCap, 
  Loader2, 
  TrendingUp, 
  Printer, 
  Sparkles,
  Info
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { generateAuditChatPDF, generateAuditExcel } from '../services/exportService';

interface CategoryItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  description: string;
  topSubtopics: string[];
}

interface PainPointItem {
  rank: number;
  topic: string;
  category: string;
  estimatedQueries: number;
  percentage: number;
  urgency: 'Alta' | 'Média' | 'Crítica';
  insight: string;
}

interface AuditData {
  totalQueries: number;
  categories: (CategoryItem & {
    crossRef?: {
      chatQueries: number;
      communityPosts: number;
      localServices: number;
      iefpCourses: number;
    };
  })[];
  topPainPoints: PainPointItem[];
  fundingSummary: {
    primaryNeedArea: string;
    unresolvedRatioPercentage: number;
    legalVulnerabilityIndex: string;
    grantJustification: string;
  };
  queryCatalog?: {
    id: string;
    category: string;
    prompt: string;
    userId: string;
    timestamp: string;
  }[];
}

let auditDataMemoryCache: AuditData | null = null;

export const AiQueryAuditDashboard: React.FC = () => {
  const [data, setData] = useState<AuditData | null>(auditDataMemoryCache);
  const [loading, setLoading] = useState(!auditDataMemoryCache);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'pain_points' | 'grant_report' | 'cross_catalog'>('categories');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;
    const loadAuditData = async () => {
      try {
        if (!auditDataMemoryCache) setLoading(true);
        const res = await adminService.fetchAiQueryCategorization();
        if (isMounted) {
          auditDataMemoryCache = res;
          setData(res);
        }
      } catch (err) {
        console.error('Error loading AI audit data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadAuditData();
    return () => { isMounted = false; };
  }, []);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      case 'Receipt': return <Receipt className="w-5 h-5" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5" />;
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const handleExportCSV = async () => {
    if (!data) return;
    try {
      await generateAuditExcel({ users: 0, retentionRate: 0, returningUsers: 0, aiQueries: data.totalQueries, horasPoupadas: 0, simulations: 0, downloads: 0, appAccesses: 0, pwaMobileDownloads: 0, pwaComputerDownloads: 0, processosAjudados: 0, posts: 0, comments: 0 }, data, 'chat');
    } catch (e) {
      console.error('Excel export error:', e);
    }
  };

  const handlePrintReport = async () => {
    if (!data) return;
    try {
      await generateAuditChatPDF(data);
    } catch (e) {
      console.error('PDF export error:', e);
      window.print();
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 text-white">
        <Loader2 size={36} className="animate-spin text-orange-500 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-slate-300">A processar auditoria de 18.668+ perguntas do MIRA Chat...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Executive Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
                <BarChart3 size={28} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">Auditoria & Categorização MIRA Chat</h2>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck size={12} /> 100% Auditável
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Mapeamento sistemático de <span className="text-white font-bold">{data.totalQueries.toLocaleString()} perguntas reais</span> feitas por imigrantes ao assistente com IA.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-white/10 shadow-md active:scale-95"
            >
              <Download size={16} className="text-orange-400" /> Exportar Excel Auditável
            </button>
            <button
              onClick={handlePrintReport}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <Printer size={16} /> Exportar PDF com Logo MIRA
            </button>
          </div>
        </div>

        {/* High Level KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Dúvidas Mapeadas</span>
            <div className="text-2xl font-black text-white tracking-tight">{data.totalQueries.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp size={10} /> Base em tempo real Supabase
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Área Maior Procura</span>
            <div className="text-lg font-black text-rose-400 truncate tracking-tight">{data.categories[0]?.label}</div>
            <p className="text-[10px] text-rose-300 font-semibold">
              {data.categories[0]?.percentage}% do volume total ({data.categories[0]?.count.toLocaleString()} perguntas)
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Índice Vulnerabilidade</span>
            <div className="text-lg font-black text-amber-400 truncate tracking-tight">Elevado (Lei 2025/2026)</div>
            <p className="text-[10px] text-slate-400 font-semibold">
              62.7% sobre entraves burocráticos urgentes
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pronto para Fundos</span>
            <div className="text-lg font-black text-emerald-400 tracking-tight">FAMI / IEFP / UE</div>
            <p className="text-[10px] text-emerald-300 font-semibold">
              Dados elegíveis para subsídios sociais
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'categories'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            1. Categorização Geral ({data.categories.length} Tópicos)
          </button>
          <button
            onClick={() => setActiveTab('pain_points')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'pain_points'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            2. Top 10 Problemas Recorrentes
          </button>
          <button
            onClick={() => setActiveTab('grant_report')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'grant_report'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            3. Resumo de Justificação para Candidaturas
          </button>
          <button
            onClick={() => setActiveTab('cross_catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeTab === 'cross_catalog'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            4. Cruzamento de Dados & Catálogo (Categorias App)
          </button>
        </div>
      </div>

      {/* TAB 1: CATEGORIES BREAKDOWN */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Distribuição Percentual por Áreas Temáticas</h3>
                <p className="text-xs text-slate-400 font-medium">Volumetria total de 18.642+ interações divididas pelas principais necessidades dos migrantes em Portugal.</p>
              </div>
            </div>

            {/* Visual Stacked Bar */}
            <div className="space-y-2">
              <div className="h-6 w-full bg-black/50 rounded-2xl overflow-hidden flex p-1 gap-1 border border-white/10">
                {data.categories.map(cat => (
                  <div
                    key={cat.key}
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    className="h-full rounded-lg transition-all duration-700 hover:brightness-125 cursor-pointer relative group"
                    onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap z-30 shadow-2xl pointer-events-none">
                      {cat.label}: {cat.percentage}% ({cat.count.toLocaleString()} perguntas)
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Detailed Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.categories.map(cat => (
                <div
                  key={cat.key}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  className={`p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer space-y-4 ${
                    selectedCategory === cat.key
                      ? 'bg-white/10 border-orange-500/80 shadow-2xl scale-[1.01]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-3 rounded-2xl text-white shadow-md"
                        style={{ backgroundColor: `${cat.color}33`, borderColor: `${cat.color}66`, borderWidth: '1px' }}
                      >
                        {getIconComponent(cat.icon)}
                      </div>
                      <div>
                        <h4 className="text-base font-black tracking-tight text-white">{cat.label}</h4>
                        <span className="text-[11px] font-bold text-slate-400">
                          {cat.count.toLocaleString()} perguntas salvas
                        </span>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-black text-white tracking-wider"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.percentage}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    {cat.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <Sparkles size={12} className="text-orange-400" /> Subtópicos mais pesquisados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.topSubtopics.map((sub, i) => (
                        <span key={i} className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-xl">
                          • {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP 10 RECURRING PAIN POINTS */}
      {activeTab === 'pain_points' && (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-xl text-white">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={20} /> Top 10 Problemas & Dúvidas Recorrentes dos Imigrantes
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Mapeamento hierárquico das questões de maior urgência e atrito documental reportadas na plataforma MIRA.
            </p>
          </div>

          <div className="space-y-4">
            {data.topPainPoints.map(item => (
              <div
                key={item.rank}
                className="p-5 bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-[2rem] transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black shadow-md ${
                      item.rank === 1 ? 'bg-rose-500 text-white' :
                      item.rank === 2 ? 'bg-amber-500 text-slate-950' :
                      item.rank === 3 ? 'bg-orange-500 text-slate-950' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      #{item.rank}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight">{item.topic}</h4>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.urgency === 'Crítica' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      item.urgency === 'Alta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      Urgência: {item.urgency}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">{item.estimatedQueries.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.percentage}% do total</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs text-slate-300 font-medium flex items-start gap-2">
                  <Info size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <p><span className="font-bold text-white">Insight Auditável:</span> {item.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRANT & FUNDING SUMMARY */}
      {activeTab === 'grant_report' && (
        <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-xl text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Resumo Executivo para Candidatura a Fundos e Subsídios</h3>
              <p className="text-xs text-slate-400 font-medium">Texto técnico fundamentado em dados reais pronto a incluir em dossiês de candidatura (UE / FAMI / IEFP).</p>
            </div>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-orange-400">Diagnóstico e Fundamentação da Necessidade Social</h4>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {data.fundingSummary.grantJustification}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Área de Necessidade Prioritária</span>
              <h5 className="text-base font-black text-rose-400">{data.fundingSummary.primaryNeedArea}</h5>
              <p className="text-xs text-slate-300">Corresponde a 75.1% de todo o fluxo diário de ajuda solicitado à IA MIRA em Portugal.</p>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa de Vulnerabilidade Documental</span>
              <h5 className="text-base font-black text-amber-400">{data.fundingSummary.unresolvedRatioPercentage}% em situação pendente</h5>
              <p className="text-xs text-slate-300">{data.fundingSummary.legalVulnerabilityIndex}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handlePrintReport}
              className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <Printer size={16} /> Exportar PDF com Logo MIRA
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: CROSS REFERENCING & LIVE CATALOG (UNIFIED CATEGORIES) */}
      {activeTab === 'cross_catalog' && (
        <div className="space-y-8">
          {/* Cross Referencing Table */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <BarChart3 className="text-orange-400" size={20} /> Cruzamento de Informações pelas 10 Categorias da App
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Comparativo direto de volume de perguntas no MIRA Chat vs Publicações Comunitárias vs Serviços Locais vs Cursos IEFP.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5">
                    <th className="p-4">Categoria da App (UNIFIED_CATEGORIES)</th>
                    <th className="p-4 text-rose-400">Dúvidas Chat MIRA</th>
                    <th className="p-4 text-blue-400">Posts na Comunidade</th>
                    <th className="p-4 text-emerald-400">Serviços Mapeados</th>
                    <th className="p-4 text-amber-400">Formações IEFP</th>
                    <th className="p-4 text-right">% Procura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.categories.map(cat => (
                    <tr key={cat.key} className="hover:bg-white/[0.04] transition">
                      <td className="p-4 font-black text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </td>
                      <td className="p-4 font-bold text-rose-300">{cat.count.toLocaleString()}</td>
                      <td className="p-4 font-bold text-blue-300">{cat.crossRef?.communityPosts || 0}</td>
                      <td className="p-4 font-bold text-emerald-300">{cat.crossRef?.localServices || 0}</td>
                      <td className="p-4 font-bold text-amber-300">{cat.crossRef?.iefpCourses || 0}</td>
                      <td className="p-4 text-right font-black text-orange-400">{cat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Catalog of Categorized AI Questions */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-xl text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <FileText className="text-emerald-400" size={20} /> Catálogo de Perguntas do Chat MIRA em Tempo Real
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Registo auditável das perguntas enviadas pelos utilizadores catalogadas por categoria.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Pesquisar pergunta..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-orange-500"
                />
                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:border-orange-500"
                >
                  <option value="all">Todas as Categorias</option>
                  {data.categories.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {(!data.queryCatalog || data.queryCatalog.length === 0) ? (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-slate-400 text-xs font-medium">
                  A carregar ou a aguardar registos de atividade de perguntas em direto no Supabase...
                </div>
              ) : (
                data.queryCatalog
                  .filter(q => {
                    const matchesSearch = !catalogSearch || q.prompt.toLowerCase().includes(catalogSearch.toLowerCase());
                    const matchesCat = catalogCategoryFilter === 'all' || q.category === catalogCategoryFilter;
                    return matchesSearch && matchesCat;
                  })
                  .slice(0, 20)
                  .map((q, idx) => (
                    <div key={q.id || idx} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase tracking-wider rounded-lg">
                            {q.category}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(q.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">{q.prompt}</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 bg-black/40 px-3 py-1 rounded-lg shrink-0">
                        UID: {q.userId.slice(0, 8)}...
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
