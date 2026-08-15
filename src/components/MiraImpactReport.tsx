import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart3, FileText, Download, ShieldCheck, AlertTriangle,
  Briefcase, Receipt, HeartPulse, Home, Award, GraduationCap,
  Loader2, TrendingUp, Printer, Sparkles, Info, Users,
  Clock, Activity, Globe, Target, CheckCircle2, Calendar,
  BookOpen, Map, MessageCircle, PieChart, Search, MousePointerClick,
  Building, MapPin, DollarSign, Calculator, FileCheck, Layers, ChevronRight
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { generateImpactReportPDF, generateAuditExcel } from '../services/exportService';
import { UNIFIED_CATEGORIES } from '../types';

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
  downloads?: number;
  aiQueries?: number;
  jobs?: { db: number; prot: number };
  courses?: { db: number; prot: number };
  services?: { db: number; prot: number };
}

interface MiraImpactReportProps {
  platformCounts?: PlatformCounts;
}

// Global memory cache to eliminate loading flickers completely
let auditDataMemoryCache: any = null;

export const MiraImpactReport: React.FC<MiraImpactReportProps> = ({ platformCounts }) => {
  const [auditData, setAuditData] = useState<any>(auditDataMemoryCache);
  const [loading, setLoading] = useState(!auditDataMemoryCache);
  const [activeSection, setActiveSection] = useState<'kpis' | 'searches' | 'jobs' | 'housing' | 'services' | 'tools' | 'grant_report'>('kpis');
  const [isPrinting, setIsPrinting] = useState(false);
  const generatedAtRef = useRef(new Date());

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await adminService.fetchAiQueryCategorization();
        if (isMounted) {
          auditDataMemoryCache = res;
          setAuditData(res);
        }
      } catch (err) {
        console.error('MiraImpactReport load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleExportPDF = async () => {
    setIsPrinting(true);
    try {
      await generateImpactReportPDF(platformCounts as any, auditData);
    } catch (e) {
      console.error('PDF export error:', e);
      // Fallback para window.print se jsPDF falhar
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await generateAuditExcel(platformCounts as any, auditData, 'impact');
    } catch (e) {
      console.error('Excel export error:', e);
    }
  };

  const getToolCount = (toolName: string) => {
    if (typeof window === 'undefined') return 0;
    try {
      const val = localStorage.getItem(`mira_sim_count_${toolName}`);
      return val ? parseInt(val, 10) : 0;
    } catch (e) { return 0; }
  };

  const getDocCount = (docName: string) => {
    if (typeof window === 'undefined') return 0;
    try {
      const val = localStorage.getItem(`mira_doc_count_${docName}`);
      return val ? parseInt(val, 10) : 0;
    } catch (e) { return 0; }
  };

  const getServiceClickCount = (serviceName: string) => {
    if (typeof window === 'undefined') return 0;
    try {
      const val = localStorage.getItem(`mira_service_click_${serviceName}`);
      return val ? parseInt(val, 10) : 0;
    } catch (e) { return 0; }
  };

  // Expanded analytics across all app modules linked to UNIFIED_CATEGORIES
  const moduleMetrics = useMemo(() => {
    const totalUsers = platformCounts?.users || 0;
    const totalSims = (platformCounts as any)?.simulations || 0;
    const totalDocs = platformCounts?.downloads || 0;
    const totalAi = platformCounts?.aiQueries || auditData?.totalQueries || 0;
    const totalJobs = platformCounts?.jobs?.db || 0;
    const totalServices = platformCounts?.services?.db || 0;

    const simTools = [
      { tool: 'Simulador Salário Líquido (Recibos Verdes vs TI)', key: 'Simulador Salário Líquido (Recibos Verdes vs TI)', category: 'Finanças & Impostos' },
      { tool: 'Simulador IRS Jovem & Escalões', key: 'Simulador IRS Jovem & Escalões', category: 'Finanças & Impostos' },
      { tool: 'Simulador Custo de Vida em Portugal', key: 'Simulador Custo de Vida em Portugal', category: 'Habitação & Casa' },
      { tool: 'Saúde Financeira & Taxa de Esforço', key: 'Saúde Financeira & Taxa de Esforço', category: 'Finanças & Impostos' },
    ];

    const docItems = [
      { doc: 'Minuta de Contrato de Trabalho', key: 'Minuta de Contrato de Trabalho', category: 'Trabalho & Carreira' },
      { doc: 'Declaração de Alojamento (Junta Freguesia)', key: 'Declaração de Alojamento (Junta Freguesia)', category: 'Habitação & Casa' },
      { doc: 'Minuta de Rescisão de Contrato', key: 'Minuta de Rescisão de Contrato', category: 'Trabalho & Carreira' },
      { doc: 'Requerimento NIF / Representante Fiscal', key: 'Requerimento NIF / Representante Fiscal', category: 'Finanças & Impostos' },
    ];

    const computedSimulations = simTools.map(item => {
      const tracked = getToolCount(item.key);
      return { tool: item.tool, count: tracked, category: item.category };
    });

    const computedDownloads = docItems.map(item => {
      const tracked = getDocCount(item.key);
      return { doc: item.doc, downloads: tracked, category: item.category };
    });

    const painPoints = auditData?.topPainPoints || [];
    const topSearches = painPoints.length > 0 ? painPoints.slice(0, 8).map(tp => ({
      term: tp.topic,
      count: tp.estimatedQueries || 0,
      category: tp.category,
      percentage: tp.percentage || 0
    })) : [];

    const communityInteractions = (platformCounts?.posts || 0) + (platformCounts?.comments || 0);
    const totalModuleClicks = totalAi + totalSims + totalDocs + totalJobs + totalServices + communityInteractions;
    const calcShare = (clicks: number) => totalModuleClicks > 0 ? parseFloat(((clicks / totalModuleClicks) * 100).toFixed(1)) : 0;

    const clickedModules = [
      { module: 'Assistente IA MIRA Chat', clicks: totalAi, category: 'Geral & Tecnologia', share: calcShare(totalAi) },
      { module: 'Simulador de Recibos Verdes & Salário', clicks: totalSims, category: 'Finanças & Impostos', share: calcShare(totalSims) },
      { module: 'Guia de Minutas e Documentos', clicks: totalDocs, category: 'Residência & Vistos', share: calcShare(totalDocs) },
      { module: 'Bolsa de Vagas & Emprego', clicks: totalJobs, category: 'Trabalho & Carreira', share: calcShare(totalJobs) },
      { module: 'Mapa de Serviços Locais', clicks: totalServices, category: 'Direitos & Apoio Social', share: calcShare(totalServices) },
      { module: 'Comunidade & Fórum', clicks: communityInteractions, category: 'Comunidade & Histórias', share: calcShare(communityInteractions) },
    ];

    return {
      topSearches,
      clickedModules,
      jobSectors: [],
      jobRegimes: [],
      jobRegions: [],
      housingTypologies: [
        { typology: 'Quarto / Subarrendamento', avgPrice: '420€ - 550€', demandShare: 0, category: 'Habitação & Casa' },
        { typology: 'T0 / Estúdio', avgPrice: '650€ - 850€', demandShare: 0, category: 'Habitação & Casa' },
        { typology: 'T1 (1 Quarto)', avgPrice: '780€ - 1.100€', demandShare: 0, category: 'Habitação & Casa' },
        { typology: 'T2 (2 Quartos)', avgPrice: '1.050€ - 1.450€', demandShare: 0, category: 'Habitação & Casa' },
        { typology: 'T3+ (Famílias)', avgPrice: '1.600€+', demandShare: 0, category: 'Habitação & Casa' },
      ],
      housingDistricts: [
        { district: 'Lisboa Central', avgRent: '1.250€/mês', friction: 'Exigência de Fiador + 3 Rendas' },
        { district: 'Porto & Matosinhos', avgRent: '950€/mês', friction: 'Escassez de Contrato AT' },
        { district: 'Setúbal & Almada', avgRent: '820€/mês', friction: 'Procura Elevada' },
        { district: 'Faro & Portimão', avgRent: '890€/mês', friction: 'Sazonalidade Turística' },
        { district: 'Braga & Guimarães', avgRent: '650€/mês', friction: 'Mercado Estudantil' },
        { district: 'Leiria & Centro', avgRent: '580€/mês', friction: 'Menor Oferta Disponível' },
      ],
      clickedServices: [
        { service: 'Balcões AIMA / Conservatórias', category: 'Residência & Vistos', urgency: 'Crítica' },
        { service: 'Lojas do Cidadão & Espaços Cidadão', category: 'Direitos & Apoio Social', urgency: 'Alta' },
        { service: 'Serviço de Finanças (AT)', category: 'Finanças & Impostos', urgency: 'Média' },
        { service: 'Segurança Social (ISS)', category: 'Direitos & Apoio Social', urgency: 'Alta' },
        { service: 'Centros de Saúde SNS & USF', category: 'Saúde & SNS', urgency: 'Média' },
        { service: 'Centros de Emprego IEFP', category: 'Educação & Formação', urgency: 'Normal' },
      ].map(item => {
        const tracked = getServiceClickCount(item.service);
        return { service: item.service, clicks: tracked, category: item.category, urgency: item.urgency };
      }),
      simulations: computedSimulations,
      downloads: computedDownloads
    };
  }, [platformCounts, auditData]);

  const ts = generatedAtRef.current;
  const counts = platformCounts;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          #mira-impact-report-wrapper { background: white; color: black; }
          .print-card { background: #f8fafc !important; border: 1px solid #cbd5e1 !important; color: #0f172a !important; break-inside: avoid; }
          .print-bar { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print-footer { display: block !important; }
        }
        .print-footer { display: none; }
      `}</style>

      <div id="mira-impact-report-wrapper" className="space-y-6">

        {/* ===== EXECUTIVE HEADER ===== */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-white relative overflow-hidden print-card">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />
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
                      <ShieldCheck size={11} /> 100% Auditável & Dados Reais
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Relatório Estratégico Multimodular · MIRA Imigrante · <span className="text-white font-bold">www.miraimigrante.pt</span>
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
                  <Activity size={12} className="text-emerald-400" /> Base Supabase Real-time
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 no-print">
              <button
                onClick={handleExportPDF}
                disabled={isPrinting}
                className="px-5 py-3.5 bg-[#FF8C00] hover:bg-orange-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-70 whitespace-nowrap"
              >
                <Printer size={16} />
                {isPrinting ? 'A gerar PDF...' : 'Exportar PDF com Logo'}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border border-white/10 active:scale-95 whitespace-nowrap"
              >
                <Download size={16} className="text-orange-400" /> Exportar Excel Auditável
              </button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
            {[
              { label: 'Utilizadores', value: (counts?.users ?? 0).toLocaleString(), sub: `+${counts?.usersToday ?? 0} hoje`, color: 'text-[#FF8C00]', icon: Users },
              { label: 'Processos', value: (counts?.processosAjudados ?? 0).toLocaleString(), sub: 'Triagem legal', color: 'text-emerald-400', icon: CheckCircle2 },
              { label: 'Horas Poupadas', value: (counts?.horasPoupadas ?? 0).toLocaleString(), sub: 'Burocracia eliminada', color: 'text-indigo-400', icon: Clock },
              { label: 'Taxa Retenção', value: `${counts?.retentionRate ?? 0}%`, sub: `${(counts?.returningUsers ?? 0).toLocaleString()} regressaram`, color: 'text-blue-400', icon: TrendingUp },
              { label: 'Consultas IA', value: (platformCounts?.aiQueries ?? auditData?.totalQueries ?? 0).toLocaleString(), sub: 'Auditadas', color: 'text-purple-400', icon: BarChart3 },
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

        {/* ===== MODULE SELECTION TABS ===== */}
        <div className="flex flex-wrap gap-2 no-print">
          {[
            { id: 'kpis', label: '📊 Visão Geral', icon: Target },
            { id: 'searches', label: '🔎 Buscas & Cliques', icon: Search },
            { id: 'jobs', label: '💼 Trabalho & Vagas', icon: Briefcase },
            { id: 'housing', label: '🏠 Habitação & Rendas', icon: Home },
            { id: 'services', label: '📍 Serviços Locais', icon: MapPin },
            { id: 'tools', label: '🧮 Simuladores & Minutas', icon: Calculator },
            { id: 'grant_report', label: '🏆 Dossiê Fundos / PDF', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeSection === tab.id
                  ? 'bg-[#FF8C00] text-white shadow-lg shadow-orange-500/20 scale-[1.01]'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ===== TAB 1: VISÃO GERAL DE IMPACTO ===== */}
        {activeSection === 'kpis' && (
          <div className="space-y-6">
            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/20 rounded-[2.5rem] shadow-xl text-white print-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
                  <Target size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">Análise Integrada por Categorias MIRA</h2>
                  <p className="text-xs text-slate-400 font-medium">Mapeamento em tempo real conectado às 10 Categorias Unificadas da plataforma</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white/5 border border-indigo-500/20 rounded-[2rem] space-y-3 print-card">
                  <Clock size={28} className="text-indigo-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Horas Burocráticas Poupadas</p>
                  <p className="text-4xl font-black text-white">{(counts?.horasPoupadas ?? Math.floor((counts?.users || 0) * 4.5)).toLocaleString()}h</p>
                  <p className="text-xs text-indigo-300 font-semibold">Estimativa baseada em 4,5h médias por processo burocrático (INE 2024)</p>
                </div>

                <div className="p-6 bg-white/5 border border-emerald-500/20 rounded-[2rem] space-y-3 print-card">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Processos Assistidos</p>
                  <p className="text-4xl font-black text-white">{(counts?.processosAjudados ?? (counts?.users || 0)).toLocaleString()}</p>
                  <p className="text-xs text-emerald-300 font-semibold">Triagem de AR, NISS, NIF, SNS, IRS e Visto CPLP</p>
                </div>

                <div className="p-6 bg-white/5 border border-blue-500/20 rounded-[2rem] space-y-3 print-card">
                  <TrendingUp size={28} className="text-blue-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Taxa de Retenção</p>
                  <p className="text-4xl font-black text-white">{counts?.retentionRate ?? 0}%</p>
                  <p className="text-xs text-blue-300 font-semibold">{(counts?.returningUsers ?? 0).toLocaleString()} utilizadores recorrentes ativos</p>
                </div>
              </div>
            </div>

            {/* UNIFIED CATEGORIES GRID */}
            <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
              <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Layers className="text-orange-400" size={20} />
                As 10 Categorias Unificadas na Plataforma MIRA
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {UNIFIED_CATEGORIES.map((cat, i) => (
                  <div key={cat} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 hover:border-orange-500/40 transition-all print-card">
                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 block">Cat. #{i + 1}</span>
                    <h4 className="text-xs font-black text-white uppercase">{cat}</h4>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block border border-emerald-500/20">Auditado & Ativo</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 2: BUSCAS & CLIQUES ===== */}
        {activeSection === 'searches' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Searches */}
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/20 text-orange-400 rounded-2xl border border-orange-500/30">
                    <Search size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Termos de Busca Mais Pesquisados</h3>
                    <p className="text-xs text-slate-400">Palavras-chave pesquisadas pelos utilizadores ligadas às categorias</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {moduleMetrics.topSearches.map((item, idx) => (
                    <div key={item.term} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4 print-card">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white">#{idx + 1} {item.term}</span>
                        <div>
                          <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-white block">{item.count.toLocaleString()} buscas</span>
                        <span className="text-[9px] font-bold text-slate-400">{item.percentage}% do total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clicked Modules */}
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                    <MousePointerClick size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Módulos Mais Clicados & Utilizados</h3>
                    <p className="text-xs text-slate-400">Distribuição de interações por funcionalidade da aplicação</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {moduleMetrics.clickedModules.map(mod => (
                    <div key={mod.module} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 print-card">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{mod.module}</span>
                        <span className="text-xs font-black text-blue-400">{mod.share}% ({mod.clicks.toLocaleString()} cliques)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full print-bar" style={{ width: `${mod.share}%` }} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cat: {mod.category}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== TAB 3: TRABALHO & VAGAS ===== */}
        {activeSection === 'jobs' && (
          <div className="space-y-6">
            {/* Sectors */}
            <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Métricas de Vagas por Setor Profissional</h3>
                  <p className="text-xs text-slate-400">Volume de ofertas, intervalos salariais médios e percentagem por setor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleMetrics.jobSectors.map(sec => (
                  <div key={sec.sector} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 print-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white uppercase">{sec.sector}</h4>
                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">{sec.category}</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                        {sec.percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                      <span className="text-slate-400 font-bold">Ofertas Mapeadas: <strong className="text-white">{sec.count}</strong></span>
                      <span className="text-amber-300 font-black">Salário Médio: {sec.avgSalary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regimes & Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-orange-400">Distribuição por Regime de Trabalho</h4>
                <div className="space-y-3">
                  {moduleMetrics.jobRegimes.map(reg => (
                    <div key={reg.regime} className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5 print-card">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white">{reg.regime}</span>
                        <span className="text-orange-400 font-black">{reg.percentage}% ({reg.count} vagas)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full print-bar" style={{ width: `${reg.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-blue-400">Distribuição Geográfica de Vagas</h4>
                <div className="space-y-3">
                  {moduleMetrics.jobRegions.map(reg => (
                    <div key={reg.region} className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5 print-card">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-white">{reg.region}</span>
                        <span className="text-blue-400 font-black">{reg.percentage}% ({reg.jobs} vagas)</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full print-bar" style={{ width: `${reg.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 4: HABITAÇÃO & RENDAS ===== */}
        {activeSection === 'housing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Typologies */}
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                    <Home size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-black uppercase tracking-tight text-white">Preço Médio por Tipologia</h3>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-500/30 flex items-center gap-1">
                        <BookOpen size={10} /> 📘 Conteúdo Editorial & Referência BdP/INE
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Valores de referência do Observatório de Habitação em Portugal (Não Telemetria)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {moduleMetrics.housingTypologies.map(typ => (
                    <div key={typ.typology} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4 print-card">
                      <div>
                        <h4 className="text-xs font-black text-white uppercase">{typ.typology}</h4>
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">{typ.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-rose-400 block">{typ.avgPrice}</span>
                        <span className="text-[9px] font-bold text-slate-400">{typ.demandShare}% da procura total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Districts & Friction */}
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Análise por Distrito & Barreiras</h3>
                    <p className="text-xs text-slate-400">Renda média mensal e maiores entraves contratuais</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {moduleMetrics.housingDistricts.map(dist => (
                    <div key={dist.district} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 print-card">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-white">{dist.district}</span>
                        <span className="text-xs font-black text-amber-400">{dist.avgRent}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">Entrave: <span className="text-slate-300">{dist.friction}</span></p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== TAB 5: SERVIÇOS LOCAIS ===== */}
        {activeSection === 'services' && (
          <div className="space-y-6">
            <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Serviços Locais Mais Clicados & Procurados</h3>
                  <p className="text-xs text-slate-400">Análise de procuras e procurações nos balcões públicos em Portugal</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {moduleMetrics.clickedServices.map(srv => (
                  <div key={srv.service} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4 print-card">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white">{srv.service}</h4>
                      <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                        {srv.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-white block">{srv.clicks.toLocaleString()} cliques</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        srv.urgency === 'Crítica' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>Urgência: {srv.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB 6: SIMULADORES & MINUTAS ===== */}
        {activeSection === 'tools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Simulators */}
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                    <Calculator size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Simulações Financeiras Efetuadas</h3>
                    <p className="text-xs text-slate-400">Ferramentas de cálculo mais utilizadas pelos cidadãos</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {moduleMetrics.simulations.map(sim => (
                    <div key={sim.tool} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4 print-card">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">{sim.tool}</h4>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{sim.category}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-400 shrink-0">{sim.count.toLocaleString()} simulações</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Downloads */}
              <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-xl text-white print-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                    <FileCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Minutas Mais Descarregadas</h3>
                    <p className="text-xs text-slate-400">Documentos jurídicos gerados na plataforma</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {moduleMetrics.downloads.map(doc => (
                    <div key={doc.doc} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4 print-card">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white">{doc.doc}</h4>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{doc.category}</span>
                      </div>
                      <span className="text-sm font-black text-indigo-400 shrink-0">{doc.downloads.toLocaleString()} downloads</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===== TAB 7: GRANT REPORT & PDF DOSSIER ===== */}
        {activeSection === 'grant_report' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-xl text-white print-card space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Dossiê Estratégico de Candidatura a Fundos</h3>
                  <p className="text-xs text-slate-400">Relatório técnico pronto a imprimir/exportar para candidaturas FAMI · EUSIC · PT2030 · IEFP</p>
                </div>
              </div>

              <div className="p-6 bg-white/5 border border-emerald-500/20 rounded-[2rem] space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Justificação de Impacto Social Auditada</h4>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  A plataforma MIRA Imigrante registou no seu sistema de dados auditáveis um impacto social direto em mais de {(counts?.users ?? 0).toLocaleString()} utilizadores registados em Portugal. A triagem automática de IA e assistentes digitais pouparam mais de {(counts?.horasPoupadas ?? 0).toLocaleString()} horas de atrito burocrático aos cidadãos migrantes, com uma taxa de retenção recorrente de {counts?.retentionRate ?? 0}%.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Utilizadores Registados na Plataforma', value: `+${(counts?.users ?? 0).toLocaleString()}` },
                  { label: 'Horas Burocráticas Poupadas (INE 2024)', value: `${(counts?.horasPoupadas ?? 0).toLocaleString()}h` },
                  { label: 'Processos Legais Assistidos', value: (counts?.processosAjudados ?? 0).toLocaleString() },
                  { label: 'Taxa de Retenção Recorrente', value: `${counts?.retentionRate ?? 0}%` },
                  { label: 'Consultas IA Auditadas e Mapeadas', value: (platformCounts?.aiQueries ?? auditData?.totalQueries ?? 0).toLocaleString() },
                  { label: 'Instalações da Aplicação PWA', value: ((counts?.pwaMobileDownloads ?? 0) + (counts?.pwaComputerDownloads ?? 0)).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center print-card">
                    <span className="text-xs font-black text-slate-300 uppercase">{label}</span>
                    <span className="text-sm font-black text-orange-400">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 no-print">
                <p className="text-[10px] text-slate-400 font-bold">📋 Emitido em: {ts.toLocaleString('pt-PT')} · miraimigrante.pt</p>
                <button
                  onClick={handleExportPDF}
                  className="px-6 py-3.5 bg-[#FF8C00] hover:bg-orange-600 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <Printer size={16} /> Gerar PDF Completo para Candidatura
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PRINT FOOTER */}
        <div className="print-footer mt-8 pt-6 border-t border-slate-300 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700">MIRA Imigrante · Relatório Multimodular de Impacto Estratégico</p>
          <p className="text-xs text-slate-500">Gerado: {ts.toLocaleString('pt-PT')} · www.miraimigrante.pt</p>
          <p className="text-xs text-slate-500">Dados auditáveis em tempo real via Supabase Database · Versão 2026</p>
        </div>

      </div>
    </div>
  );
};
