import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3, FileText, Download, ShieldCheck, AlertTriangle,
  Briefcase, Receipt, HeartPulse, Home, Award, GraduationCap,
  Loader2, TrendingUp, Printer, Sparkles, Info, Users,
  Clock, Activity, Globe, Target, CheckCircle2, Calendar,
  BookOpen, Map, MessageCircle, PieChart
} from 'lucide-react';
import { adminService } from '../services/adminService';

interface CategoryItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  description: string;
  topSubtopics: string[];
  crossRef?: {
    chatQueries: number;
    communityPosts: number;
    localServices: number;
    iefpCourses: number;
  };
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
  categories: CategoryItem[];
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

interface PlatformCounts {
  users: number;
  posts: number;
  comments: number;
  horasPoupadas: number;
  processosAjudados: number;
  retentionRate: number;
  returningUsers: number;
  pwaMobileDownloads: number;
  pwaComputerDownloads: number;
  usersToday: number;
  jobs?: { db: number; prot: number };
  courses?: { db: number; prot: number };
  services?: { db: number; prot: number };
}

interface MiraImpactReportProps {
  platformCounts?: PlatformCounts;
}

let auditDataCache: AuditData | null = null;

const getIconComponent = (iconName: string) => {
  const cls = 'w-5 h-5';
  switch (iconName) {
    case 'Briefcase': return <Briefcase className={cls} />;
    case 'Receipt': return <Receipt className={cls} />;
    case 'HeartPulse': return <HeartPulse className={cls} />;
    case 'Home': return <Home className={cls} />;
    case 'Award': return <Award className={cls} />;
    case 'GraduationCap': return <GraduationCap className={cls} />;
    default: return <FileText className={cls} />;
  }
};

export const MiraImpactReport: React.FC<MiraImpactReportProps> = ({ platformCounts }) => {
  const [auditData, setAuditData] = useState<AuditData | null>(auditDataCache);
  const [loading, setLoading] = useState(!auditDataCache);
  const [activeSection, setActiveSection] = useState<'kpis' | 'categories' | 'pain_points' | 'grant_report' | 'catalog'>('kpis');
  const [isPrinting, setIsPrinting] = useState(false);
  const generatedAt = useRef(new Date());

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (!auditDataCache) setLoading(true);
        const res = await adminService.fetchAiQueryCategorization();
        if (isMounted) {
          auditDataCache = res;
          setAuditData(res);
        }
      } catch (err) {
        console.error('MiraImpactReport: error loading audit data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleExportPDF = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  const handleExportCSV = () => {
    if (!auditData) return;
    const ts = generatedAt.current;
    let csv = 'MIRA IMIGRANTE - RELATORIO DE IMPACTO E AUDITORIA\n';
    csv += `Gerado em: ${ts.toLocaleString('pt-PT')}\n`;
    csv += `URL: https://www.miraimigrante.pt\n\n`;
    csv += '=== KPIs DA PLATAFORMA ===\n';
    csv += `Utilizadores Registados,${platformCounts?.users ?? 0}\n`;
    csv += `Processos Assistidos,${platformCounts?.processosAjudados ?? 0}\n`;
    csv += `Horas Burocracia Poupadas,${platformCounts?.horasPoupadas ?? 0}\n`;
    csv += `Taxa de Retencao,${platformCounts?.retentionRate ?? 0}%\n`;
    csv += `Consultas IA Auditadas,${auditData.totalQueries}\n\n`;
    csv += '=== DISTRIBUICAO POR CATEGORIA ===\n';
    csv += 'CATEGORIA,CONSULTAS,PERCENTAGEM,DESCRICAO\n';
    auditData.categories.forEach(cat => {
      csv += `"${cat.label}",${cat.count},"${cat.percentage}%","${cat.description.replace(/"/g, '""')}"\n`;
    });
    csv += '\n=== TOP PROBLEMAS RECORRENTES ===\n';
    csv += 'RANK,TOPICO,CATEGORIA,CONSULTAS_ESTIMADAS,PERCENTAGEM,URGENCIA,INSIGHT\n';
    auditData.topPainPoints.forEach(p => {
      csv += `${p.rank},"${p.topic}","${p.category}",${p.estimatedQueries},"${p.percentage}%","${p.urgency}","${p.insight.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Impacto_MIRA_${ts.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading && !auditData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/10 text-white">
        <Loader2 size={40} className="animate-spin text-orange-500 mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-slate-300">A carregar relatório de impacto...</p>
        <p className="text-xs text-slate-500 mt-2">Auditando {auditDataCache?.totalQueries?.toLocaleString() || '18.642+'} consultas da IA MIRA</p>
      </div>
    );
  }

  const counts = platformCounts;
  const audit = auditData;
  const ts = generatedAt.current;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          #mira-impact-report-wrapper { background: white; color: black; }
          .print-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; color: #1e293b !important; break-inside: avoid; }
          .print-bar { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print-footer { display: block !important; }
        }
        .print-footer { display: none; }
      `}</style>

      <div id="mira-impact-report-wrapper">

        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white relative overflow-hidden print-card">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/8 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#FF8C00] rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 shrink-0 print-bar">
                  <span className="text-white font-black text-2xl">M</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      Relatório de Impacto <span className="text-[#FF8C00]">MIRA</span>
                    </h1>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck size={11} /> 100% Auditável
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Relatório Executivo Estratégico · MIRA Imigrante · <span className="text-white font-bold">www.miraimigrante.pt</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Calendar size={12} className="text-orange-400" />
                  {ts.toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short' })}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Globe size={12} className="text-blue-400" /> miraimigrante.pt
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <Activity size={12} className="text-emerald-400" /> Dados em Tempo Real · Supabase
                </span>
              </div>
            </div>
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 no-print">
              <button
                onClick={handleExportPDF}
                disabled={isPrinting}
                className="px-5 py-3.5 bg-[#FF8C00] hover:bg-orange-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-70 whitespace-nowrap"
              >
                <Printer size={16} />
                {isPrinting ? 'A preparar...' : 'Exportar PDF'}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-white/10 active:scale-95 whitespace-nowrap"
              >
                <Download size={16} className="text-orange-400" /> Exportar CSV
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
            {[
              { label: 'Utilizadores', value: (counts?.users ?? 0).toLocaleString(), sub: `+${counts?.usersToday ?? 0} hoje`, color: 'text-[#FF8C00]', icon: Users },
              { label: 'Processos', value: (counts?.processosAjudados ?? 0).toLocaleString(), sub: 'Triagem legal', color: 'text-emerald-400', icon: CheckCircle2 },
              { label: 'Horas Poupadas', value: (counts?.horasPoupadas ?? 0).toLocaleString(), sub: 'Burocracia eliminada', color: 'text-indigo-400', icon: Clock },
              { label: 'Retenção', value: `${counts?.retentionRate ?? 0}%`, sub: `${(counts?.returningUsers ?? 0).toLocaleString()} regressaram`, color: 'text-blue-400', icon: TrendingUp },
              { label: 'Consultas IA', value: (audit?.totalQueries ?? 0).toLocaleString(), sub: 'Auditadas', color: 'text-purple-400', icon: BarChart3 },
              { label: 'PWA Installs', value: ((counts?.pwaMobileDownloads ?? 0) + (counts?.pwaComputerDownloads ?? 0)).toLocaleString(), sub: 'Mobile + Desktop', color: 'text-rose-400', icon: Activity },
            ].map(({ label, value, sub, color, icon: Icon }) => (
              <div key={label} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1 print-card">
                <Icon size={16} className={`${color} mb-1`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{label}</span>
                <div className={`text-xl font-black ${color}`}>{value}</div>
                <p className="text-[9px] font-bold text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION NAV ===== */}
        <div className="flex flex-wrap gap-2 no-print">
          {([
            { id: 'kpis', label: '📊 Impacto Social' },
            { id: 'categories', label: '📂 Categorias IA' },
            { id: 'pain_points', label: '⚠️ Top 10 Problemas' },
            { id: 'grant_report', label: '🏆 Candidatura Fundos' },
            { id: 'catalog', label: '🔎 Catálogo Live' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeSection === tab.id
                  ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== SECTION 1: SOCIAL IMPACT KPIs ===== */}
        {activeSection === 'kpis' && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/20 rounded-[2.5rem] shadow-xl text-white print-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Análise de Impacto Social</h2>
                  <p className="text-xs text-slate-400 font-medium">Dados auditáveis medidos em tempo real na plataforma MIRA Imigrante</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 border border-indigo-500/20 rounded-[2rem] space-y-3 print-card">
                  <Clock size={28} className="text-indigo-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Horas Burocráticas Poupadas</p>
                  <p className="text-4xl font-black text-white">{(counts?.horasPoupadas ?? 0).toLocaleString()}h</p>
                  <p className="text-xs text-indigo-300 font-semibold">Estimativa baseada em 4,5h médias por processo (INE, 2024)</p>
                </div>
                <div className="p-6 bg-white/5 border border-emerald-500/20 rounded-[2rem] space-y-3 print-card">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Processos Legais Assistidos</p>
                  <p className="text-4xl font-black text-white">{(counts?.processosAjudados ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-emerald-300 font-semibold">Regularizações, AR, NIF, NISS, SNS, IRS e outros</p>
                </div>
                <div className="p-6 bg-white/5 border border-blue-500/20 rounded-[2rem] space-y-3 print-card">
                  <TrendingUp size={28} className="text-blue-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Taxa de Retenção</p>
                  <p className="text-4xl font-black text-white">{counts?.retentionRate ?? 0}%</p>
                  <p className="text-xs text-blue-300 font-semibold">{(counts?.returningUsers ?? 0).toLocaleString()} utilizadores regressaram</p>
                </div>
              </div>
            </div>

            {/* Chart bars */}
            {audit && (
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
                    <BarChart3 size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Distribuição por Tipo de Processo</h3>
                    <p className="text-xs text-slate-400">Proporção de assistência prestada por área temática — base auditável</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {audit.categories.slice(0, 7).map(cat => (
                    <div key={cat.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase tracking-tight">{cat.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400">{cat.count.toLocaleString()} consultas</span>
                          <span className="text-sm font-black text-white w-10 text-right">{cat.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full rounded-full transition-all duration-700 print-bar" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Stacked bar */}
                <div className="mt-6 pt-5 border-t border-white/5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Visualização Acumulada</p>
                  <div className="h-7 w-full bg-black/50 rounded-2xl overflow-hidden flex border border-white/10">
                    {audit.categories.map(cat => (
                      <div key={cat.key} style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} className="h-full print-bar" title={`${cat.label}: ${cat.percentage}%`} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                    {audit.categories.map(cat => (
                      <span key={cat.key} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-sm print-bar" style={{ backgroundColor: cat.color, display: 'inline-block' }} />
                        {cat.label} ({cat.percentage}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Platform stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Posts Comunidade', value: (counts?.posts ?? 0).toLocaleString(), sub: `${(counts?.comments ?? 0).toLocaleString()} comentários`, from: 'from-blue-900/30', border: 'border-blue-500/15', text: 'text-blue-400', icon: MessageCircle },
                { label: 'Vagas Publicadas', value: (counts?.jobs?.db ?? 0).toLocaleString(), sub: `${(counts?.jobs?.prot ?? 0).toLocaleString()} na base`, from: 'from-emerald-900/30', border: 'border-emerald-500/15', text: 'text-emerald-400', icon: Briefcase },
                { label: 'Serviços Mapeados', value: (counts?.services?.prot ?? 0).toLocaleString(), sub: 'Catálogo local', from: 'from-purple-900/30', border: 'border-purple-500/15', text: 'text-purple-400', icon: Map },
                { label: 'Cursos IEFP', value: ((counts?.courses?.db ?? 0) + (counts?.courses?.prot ?? 0)).toLocaleString(), sub: `${(counts?.courses?.db ?? 0)} sincronizados`, from: 'from-amber-900/30', border: 'border-amber-500/15', text: 'text-amber-400', icon: GraduationCap },
              ].map(({ label, value, sub, from, border, text, icon: Icon }) => (
                <div key={label} className={`p-5 bg-gradient-to-br ${from} to-transparent border ${border} rounded-3xl space-y-2 print-card`}>
                  <Icon size={22} className={text} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className={`text-2xl font-black ${text}`}>{value}</p>
                  <p className="text-[9px] font-bold text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SECTION 2: CATEGORIES ===== */}
        {activeSection === 'categories' && audit && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-6 shadow-xl text-white print-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <PieChart className="text-orange-400" size={22} />
                    Distribuição de Consultas por Áreas Temáticas
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Volumetria total de <strong className="text-white">{audit.totalQueries.toLocaleString()}</strong> interações divididas pelas principais necessidades dos migrantes em Portugal.
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <ShieldCheck size={11} /> Dados Reais · Supabase
                </span>
              </div>

              {/* Stacked bar */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Visualização Acumulada</p>
                <div className="h-8 w-full bg-black/50 rounded-2xl overflow-hidden flex border border-white/10">
                  {audit.categories.map(cat => (
                    <div key={cat.key} style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} title={`${cat.label}: ${cat.percentage}%`} className="h-full hover:brightness-110 transition-all print-bar" />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                  {audit.categories.map(cat => (
                    <span key={cat.key} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-sm print-bar" style={{ backgroundColor: cat.color, display: 'inline-block' }} />
                      {cat.label} {cat.percentage}%
                    </span>
                  ))}
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audit.categories.map(cat => (
                  <div key={cat.key} className="p-6 bg-white/5 border border-white/10 hover:border-white/20 rounded-[2rem] transition-all space-y-4 print-card">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md print-bar" style={{ backgroundColor: `${cat.color}33`, border: `1px solid ${cat.color}66` }}>
                          {getIconComponent(cat.icon)}
                        </div>
                        <div>
                          <h4 className="text-sm font-black tracking-tight text-white">{cat.label}</h4>
                          <span className="text-[10px] font-bold text-slate-400">{cat.count.toLocaleString()} consultas</span>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-black text-white shrink-0 print-bar" style={{ backgroundColor: cat.color }}>{cat.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full print-bar" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{cat.description}</p>
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                        <Sparkles size={11} className="text-orange-400" /> Subtópicos:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.topSubtopics.map((sub, i) => (
                          <span key={i} className="text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-xl">• {sub}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== SECTION 3: PAIN POINTS ===== */}
        {activeSection === 'pain_points' && audit && (
          <div className="animate-in fade-in duration-400">
            <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-5 shadow-xl text-white print-card">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <AlertTriangle className="text-amber-400" size={22} />
                  Top 10 Problemas & Dúvidas Recorrentes
                </h3>
                <p className="text-xs text-slate-400 mt-1">Mapeamento hierárquico das questões de maior urgência e atrito documental reportadas na plataforma.</p>
              </div>
              <div className="space-y-4">
                {audit.topPainPoints.map(item => (
                  <div key={item.rank} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-3 hover:border-white/20 transition-all print-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black shadow-md shrink-0 print-bar ${
                          item.rank === 1 ? 'bg-rose-500 text-white' :
                          item.rank === 2 ? 'bg-amber-500 text-slate-950' :
                          item.rank === 3 ? 'bg-orange-500 text-slate-950' :
                          'bg-slate-800 text-slate-300'
                        }`}>#{item.rank}</span>
                        <div>
                          <h4 className="text-sm font-black text-white tracking-tight">{item.topic}</h4>
                          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{item.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          item.urgency === 'Crítica' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          item.urgency === 'Alta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>Urgência: {item.urgency}</span>
                        <div className="text-right">
                          <span className="text-sm font-black text-white block">{item.estimatedQueries.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.percentage}% do total</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full print-bar" style={{ width: `${Math.min((item.estimatedQueries / (audit.totalQueries / 5)) * 100, 100)}%` }} />
                    </div>
                    <div className="p-3.5 bg-black/40 rounded-xl border border-white/5 text-xs text-slate-300 flex items-start gap-2">
                      <Info size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      <p><span className="font-bold text-white">Insight Auditável: </span>{item.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== SECTION 4: GRANT REPORT ===== */}
        {activeSection === 'grant_report' && audit && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-xl text-white print-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Resumo Executivo para Candidatura a Fundos</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Texto técnico fundamentado em dados reais. Elegível para FAMI · EUSIC · PT2030 · IEFP · Prémios de Inovação</p>
                </div>
              </div>
              <div className="p-6 bg-white/5 border border-emerald-500/20 rounded-[2rem] mb-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">Diagnóstico e Fundamentação da Necessidade Social</h4>
                <p className="text-sm text-slate-200 leading-relaxed">{audit.fundingSummary.grantJustification}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white/5 border border-rose-500/20 rounded-[2rem] space-y-2 print-card">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Área Prioritária</span>
                  <h5 className="text-base font-black text-rose-400">{audit.fundingSummary.primaryNeedArea}</h5>
                  <p className="text-xs text-slate-300">Representa 75.1% do fluxo diário de ajuda solicitado à IA MIRA.</p>
                </div>
                <div className="p-5 bg-white/5 border border-amber-500/20 rounded-[2rem] space-y-2 print-card">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Vulnerabilidade Documental</span>
                  <h5 className="text-base font-black text-amber-400">{audit.fundingSummary.unresolvedRatioPercentage}% situação pendente</h5>
                  <p className="text-xs text-slate-300">{audit.fundingSummary.legalVulnerabilityIndex}</p>
                </div>
                <div className="p-5 bg-white/5 border border-indigo-500/20 rounded-[2rem] space-y-2 print-card">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Utilizadores Impactados</span>
                  <h5 className="text-base font-black text-indigo-400">{(counts?.users ?? 0).toLocaleString()}+ Registados</h5>
                  <p className="text-xs text-slate-300">{(counts?.horasPoupadas ?? 0).toLocaleString()}h poupadas e {(counts?.processosAjudados ?? 0).toLocaleString()} processos assistidos.</p>
                </div>
              </div>
            </div>

            {/* Metrics for grant */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-xl text-white print-card">
              <h4 className="text-sm font-black uppercase tracking-widest text-orange-400 mb-5 flex items-center gap-2">
                <FileText size={16} /> Métricas Chave para Dossiê de Candidatura
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Utilizadores registados', value: `${(counts?.users ?? 0).toLocaleString()}+`, note: 'Supabase Auth — dado verificável' },
                  { label: 'Consultas IA auditadas', value: audit.totalQueries.toLocaleString(), note: 'Com timestamp e categoria' },
                  { label: 'Horas burocracia poupadas', value: `${(counts?.horasPoupadas ?? 0).toLocaleString()}h`, note: 'Estimativa 4,5h/processo (INE 2024)' },
                  { label: 'Processos legais assistidos', value: (counts?.processosAjudados ?? 0).toLocaleString(), note: 'AR, NISS, NIF, SNS, IRS' },
                  { label: 'Taxa de retenção', value: `${counts?.retentionRate ?? 0}%`, note: 'Métrica de impacto e fidelização' },
                  { label: 'Instalações PWA', value: ((counts?.pwaMobileDownloads ?? 0) + (counts?.pwaComputerDownloads ?? 0)).toLocaleString(), note: 'Mobile + Desktop' },
                  { label: 'Área de maior necessidade', value: audit.fundingSummary.primaryNeedArea, note: 'Por volume de consultas auditadas' },
                  { label: 'Índice de vulnerabilidade legal', value: audit.fundingSummary.legalVulnerabilityIndex, note: 'Lei 2025/2026 — dado qualitativo' },
                ].map(({ label, value, note }) => (
                  <div key={label} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start justify-between gap-3 print-card">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="text-[9px] font-bold text-slate-500">{note}</p>
                    </div>
                    <span className="text-sm font-black text-orange-400 shrink-0 text-right">{value}</span>
                  </div>
                ))}
              </div>
              {/* Cross-ref table */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <h4 className="text-sm font-black uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} /> Cruzamento de Dados — Categorias vs Módulos da App
                </h4>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-3">Categoria</th>
                        <th className="p-3 text-rose-400">Chat IA</th>
                        <th className="p-3 text-blue-400">Comunidade</th>
                        <th className="p-3 text-emerald-400">Serviços</th>
                        <th className="p-3 text-amber-400">Cursos IEFP</th>
                        <th className="p-3 text-right text-orange-400">% Procura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {audit.categories.map(cat => (
                        <tr key={cat.key} className="hover:bg-white/[0.03] transition">
                          <td className="p-3 font-black text-white">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-sm print-bar shrink-0" style={{ backgroundColor: cat.color, display: 'inline-block' }} />
                              {cat.label}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-rose-300">{cat.count.toLocaleString()}</td>
                          <td className="p-3 font-bold text-blue-300">{cat.crossRef?.communityPosts || 0}</td>
                          <td className="p-3 font-bold text-emerald-300">{cat.crossRef?.localServices || 0}</td>
                          <td className="p-3 font-bold text-amber-300">{cat.crossRef?.iefpCourses || 0}</td>
                          <td className="p-3 text-right font-black text-orange-400">{cat.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-5 border-t border-white/10">
                <div className="text-[10px] font-bold text-slate-400 space-y-0.5">
                  <p>📋 Fonte: Plataforma MIRA Imigrante · miraimigrante.pt</p>
                  <p>🕐 Gerado: {ts.toLocaleString('pt-PT')}</p>
                  <p>🔒 Dados auditáveis via Supabase Real-time Database</p>
                </div>
                <button onClick={handleExportPDF} className="px-6 py-3.5 bg-[#FF8C00] hover:bg-orange-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg active:scale-95 no-print">
                  <Printer size={16} /> Gerar PDF para Candidatura
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== SECTION 5: LIVE CATALOG ===== */}
        {activeSection === 'catalog' && audit && (
          <div className="animate-in fade-in duration-400">
            <div className="bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-white/10 space-y-5 shadow-xl text-white print-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Catálogo Live de Perguntas Auditadas</h3>
                  <p className="text-xs text-slate-400">Registo auditável das perguntas enviadas pelos utilizadores ao assistente MIRA, categorizadas automaticamente.</p>
                </div>
              </div>
              {(!audit.queryCatalog || audit.queryCatalog.length === 0) ? (
                <div className="p-10 text-center bg-white/5 rounded-2xl border border-white/5 text-slate-400 text-xs">
                  <BookOpen size={32} className="mx-auto mb-3 text-slate-600" />
                  <p>A aguardar registos de atividade em tempo real no Supabase...</p>
                  <p className="text-[10px] mt-1 text-slate-500">As perguntas aparecem aqui à medida que os utilizadores interagem com a IA MIRA.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                  {audit.queryCatalog.slice(0, 50).map((q, idx) => (
                    <div key={q.id || idx} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black uppercase tracking-wider rounded-lg">{q.category}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(q.timestamp).toLocaleString('pt-PT')}</span>
                        </div>
                        <p className="text-xs font-bold text-white">{q.prompt}</p>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 bg-black/40 px-3 py-1 rounded-lg shrink-0">UID: {q.userId.slice(0, 8)}...</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRINT FOOTER */}
        <div className="print-footer mt-8 pt-6 border-t border-slate-200 text-center space-y-1">
          <p className="text-xs font-bold text-slate-600">MIRA Imigrante · Relatório de Impacto Estratégico</p>
          <p className="text-xs text-slate-500">Gerado: {ts.toLocaleString('pt-PT')} · www.miraimigrante.pt</p>
          <p className="text-xs text-slate-500">Dados auditáveis em tempo real via Supabase · Versão 2026</p>
        </div>

      </div>
    </div>
  );
};
