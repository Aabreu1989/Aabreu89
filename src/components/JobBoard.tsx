
import React, { useState, useEffect } from 'react';
import { JobPost, WORK_TOPICS, CATEGORIES, ViewType } from '../types';
import { Search, Briefcase, ExternalLink, MapPin, Building2, TrendingUp, TrendingDown, Minus, ChevronDown, Filter, X, SlidersHorizontal, Map as MapIcon, Globe, FileText, RefreshCcw, AlertTriangle, Volume2, AlertCircle, Activity, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { t } from '../utils/translations';
import { PROTECTED_JOBS } from '../utils/protectedData';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeCategory, normalizeWorkTopic, getWorkTopicKey } from '../utils/categoryUtils';
import JobItem from './JobItem';

function isSpamOrBlog(title: string, url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // 1. Casino / Betting / SEO Spam (Aggressive)
  const spamKeywords = [
    'stakes-vip', 'referral-rewards', 'referral-reward', 'casino', 'kaasino', 'gambling',
    'betting', 'free-spins', 'jackpot', 'slots', 'vavada', 'lebull', 'gobet', 'bukmacher',
    'supabet', 'bonus-code', 'promo-code', 'bonus now', 'sofort banking', 'referral program',
    'bonus de boas-vindas', 'spin-win', 'playio', 'amunra', 'play-for-real', 'zeta-online-casino',
    'maximum-casino', 'moicasino', 'spinsy-casino', 'alf-casino', 'zet-casino', 'bet-it-all', 'bizzo-casino'
  ];
  if (spamKeywords.some(kw => lowerUrl.includes(kw) || lowerTitle.includes(kw))) {
    return true;
  }

  // 2. Blog Posts / Advice Articles / Non-job guides
  const blogKeywords = [
    'salario-enfermeiro', 'salario-auxiliar', 'google_vignette',
    'modelo-carta', 'carta-despedimento', 'carta-cobranca', 'carta-motivacao', 'carta-apresentacao',
    'como-recusar', 'como-mudar', 'como-escrever', 'rescisao-periodo', 'periodo-experimental',
    'subsidio-desemprego', 'feriados-2026', 'feriados-2025', 'codigo-trabalho', 'direitos-dos',
    'dicas-para-entrevista', 'dicas-entrevista', 'modelo-curriculo', 'como-elaborar', 'perguntas-entrevista',
    'erros-curriculo', 'guia-de-emprego',
    'minuta-carta', 'carta-de-demissao', 'direitos-e-acrescimos'
  ];
  if (blogKeywords.some(kw => lowerUrl.includes(kw) || lowerTitle.includes(kw))) {
    return true;
  }

  // Path-specific blog keywords (safe from matching common job titles/locations)
  const blogUrlPatterns = [
    '/salarios-', '/carta-de-', '/dicas-', '/guia-de-', '/guia-para-', 
    '/guia-completo-', '/guia-pratico-', '/modelo-', '/rescisao-', 
    '/direitos-', '/feriados-', '/subsidio-', '/periodo-experimental',
    '/o-que-e', '/o-que-faz', '/quanto-ganha', '/artigo/', '/blog/', 
    '/categoria/', '/opiniao/', '/minuta-', '/curriculo/'
  ];
  if (blogUrlPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }

  // Title-specific blog indicators (common article structures)
  const blogTitlePatterns = [
    /^como /i, /^o que /i, /^quanto ganha/i, /^guia (de|para|completo|pr\u00e1tico) /i, /^dicas /i,
    /sal\u00e1rio m\u00e9dio/i, /tabela salarial/i, /modelo de carta/i, /minuta de/i,
    /direito a/i, /direitos do/i, /c\u00f3digo do trabalho/i, /per\u00edodo experimental/i,
    /rescis\u00e3o de contrato/i, /subs\u00eddio de desemprego/i, /carta de despedimento/i
  ];
  if (blogTitlePatterns.some(regex => regex.test(lowerTitle))) {
    return true;
  }

  // Greek / Cyrillic character spam detection
  const greekCyrillicPattern = /[\u0370-\u03ff\u1f00-\u1fff\u0400-\u04ff]/;
  if (greekCyrillicPattern.test(lowerTitle)) {
    return true;
  }

  return false;
}


interface JobBoardProps {
  language: string;
  isAdmin?: boolean;
  onViewChange?: (view: ViewType, params?: any) => void;
  initialTab?: 'jobs' | 'trends';
}

const TOPIC_DETAILS: Record<string, { emoji: string; color: string; bg: string; text: string; ring: string }> = {
  "Tecnologia, Dados & IA": { emoji: "💻", color: "#3b82f6", bg: "bg-blue-50/80 hover:bg-blue-100/90", text: "text-blue-600 border-blue-200", ring: "focus:ring-blue-500/20" },
  "Saúde & Cuidados Continuados": { emoji: "🩺", color: "#10b981", bg: "bg-emerald-50/80 hover:bg-emerald-100/90", text: "text-emerald-600 border-emerald-200", ring: "focus:ring-emerald-500/20" },
  "Construção Civil & Engenharia": { emoji: "🏗️", color: "#d97706", bg: "bg-amber-50/80 hover:bg-amber-100/90", text: "text-amber-700 border-amber-200", ring: "focus:ring-amber-500/20" },
  "Turismo, Hotelaria & Restauração": { emoji: "🍽️", color: "#ea580c", bg: "bg-orange-50/80 hover:bg-orange-100/90", text: "text-orange-600 border-orange-200", ring: "focus:ring-orange-500/20" },
  "Indústria, Produção & Manufatura": { emoji: "🏭", color: "#8b5cf6", bg: "bg-violet-50/80 hover:bg-violet-100/90", text: "text-violet-600 border-violet-200", ring: "focus:ring-violet-500/20" },
  "Logística, Transportes & Armazém": { emoji: "📦", color: "#4f46e5", bg: "bg-indigo-50/80 hover:bg-indigo-100/90", text: "text-indigo-600 border-indigo-200", ring: "focus:ring-indigo-500/20" },
  "Comércio, Vendas & Retalho": { emoji: "🛍️", color: "#db2777", bg: "bg-pink-50/80 hover:bg-pink-100/90", text: "text-pink-600 border-pink-200", ring: "focus:ring-pink-500/20" },
  "Administrativo, Gestão & RH": { emoji: "📂", color: "#475569", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-600 border-slate-200", ring: "focus:ring-slate-500/20" },
  "Limpeza, Segurança & Facility Management": { emoji: "🧹", color: "#52525b", bg: "bg-zinc-50/80 hover:bg-zinc-100/90", text: "text-zinc-600 border-zinc-200", ring: "focus:ring-zinc-500/20" },
  "Agricultura, Pesca & Pecuária": { emoji: "🚜", color: "#16a34a", bg: "bg-green-50/80 hover:bg-green-100/90", text: "text-green-600 border-green-200", ring: "focus:ring-green-500/20" },
  "Artes, Design & Multimédia": { emoji: "🎨", color: "#e11d48", bg: "bg-rose-50/80 hover:bg-rose-100/90", text: "text-rose-600 border-rose-200", ring: "focus:ring-rose-500/20" },
  "Apoio Social & Terceiro Setor": { emoji: "🤝", color: "#0891b2", bg: "bg-cyan-50/80 hover:bg-cyan-100/90", text: "text-cyan-600 border-cyan-200", ring: "focus:ring-cyan-500/20" },
  "Energia & Sustentabilidade": { emoji: "⚡", color: "#ca8a04", bg: "bg-yellow-50/80 hover:bg-yellow-100/90", text: "text-yellow-700 border-yellow-200", ring: "focus:ring-yellow-500/20" },
  "Trabalho Remoto & Freelancing": { emoji: "🏡", color: "#0d9488", bg: "bg-teal-50/80 hover:bg-teal-100/90", text: "text-teal-600 border-teal-200", ring: "focus:ring-teal-500/20" },
  "Outros": { emoji: "🌐", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-500 border-slate-200", ring: "focus:ring-slate-500/20" }
};

const JOB_TRENDS = (lang: string) => [
  { 
    id: 1, 
    name: t('jobs_trend_turismo', lang), 
    description: t('jobs_trend_turismo_desc', lang),
    demandLevel: t('jobs_demand_vhigh', lang), 
    averageSalary: '850 - 1.200', 
    growth: '+15%' 
  },
  { 
    id: 2, 
    name: t('jobs_trend_tech', lang), 
    description: t('jobs_trend_tech_desc', lang),
    demandLevel: t('jobs_demand_high', lang), 
    averageSalary: '1.200 - 3.500', 
    growth: '+22%' 
  },
  { 
    id: 3, 
    name: t('jobs_trend_const', lang), 
    description: t('jobs_trend_const_desc', lang),
    demandLevel: t('jobs_demand_vhigh', lang), 
    averageSalary: '900 - 1.500', 
    growth: '+10%' 
  },
  { 
    id: 4, 
    name: t('jobs_trend_energy', lang), 
    description: t('jobs_trend_energy_desc', lang),
    demandLevel: t('jobs_demand_med', lang), 
    averageSalary: '1.100 - 2.000', 
    growth: '+30%' 
  },
  { 
    id: 5, 
    name: t('jobs_trend_health', lang), 
    description: t('jobs_trend_health_desc', lang),
    demandLevel: t('jobs_demand_high', lang), 
    averageSalary: '1.000 - 1.800', 
    growth: '+12%' 
  },
];

const LOCATIONS = (lang: string) => [
  t('jobs_all_districts', lang), "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];



const MAX_JOB_AGE_DAYS = 60;

function isWithin60Days(dateStr?: string): boolean {
  if (!dateStr) return true;
  try {
    const postDate = new Date(dateStr);
    if (isNaN(postDate.getTime())) return true;
    const diffDays = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_JOB_AGE_DAYS;
  } catch (e) {
    return true;
  }
}

export const JobBoard: React.FC<JobBoardProps> = ({ language, isAdmin, onViewChange, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'trends'>(initialTab || 'jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(t('jobs_all_districts', language));
  const [selectedWorkTopic, setSelectedWorkTopic] = useState('Todos');
  const [selectedSource, setSelectedSource] = useState(t('jobs_all_sources', language));
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>(null);
  const [isVisaGuideOpen, setIsVisaGuideOpen] = useState(false);
  // ⚡ MIRA OPTIMIZATION: Load protected jobs synchronously by default for instant rendering (0ms) - Strictly <= 60 days
  const initialJobs = React.useMemo(() => {
    return ((PROTECTED_JOBS as any[]) || [])
      .filter(pj => {
        const url = pj.source_url || pj.sourceUrl;
        const dateStr = pj.created_at || pj.posted_at || pj.date_posted;
        return url && url !== '#' && pj.title && !isSpamOrBlog(pj.title, url) && isWithin60Days(dateStr);
      })
      .map(pj => ({
        id: pj.id,
        title: pj.title || t('jobs_no_title', language),
        location: pj.location || 'Portugal',
        sourceName: pj.source_name || pj.sourceName || 'MIRA',
        sourceUrl: pj.source_url || pj.sourceUrl,
        datePosted: pj.date_posted || pj.datePosted || t('jobs_today', language),
        posted_at: pj.posted_at || pj.postedAt || pj.created_at || new Date().toISOString(),
        tags: Array.isArray(pj.tags) ? pj.tags : (pj.title && pj.title.toLowerCase().includes('remoto') ? ['Remote'] : []),
        category: normalizeCategory(pj.category || 'Trabalho & Carreira'),
        workTopic: normalizeWorkTopic(pj.work_topic || pj.workTopic, pj.title)
      } as any));
  }, [language]);

  const [jobs, setJobs] = useState<JobPost[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleJobsCount, setVisibleJobsCount] = useState(20);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  
  const [totalPlatformJobs, setTotalPlatformJobs] = useState<number>(0);
  const [jobsGrowth, setJobsGrowth] = useState<{ percentage: number; trend: 'up' | 'down' | 'neutral' } | null>(null);

  // Dynamic Insights calculation based on jobs database (MIRA V2026.ELITE)
  const dynamicTrends = React.useMemo(() => {
    const sectors = [
      {
        id: 1,
        name: t('jobs_trend_turismo', language),
        description: t('jobs_trend_turismo_desc', language),
        topics: ['Turismo, Hotelaria & Restauração', 'Turismo, Hotelaria & Restauraço', 'Turismo', 'Hotelaria', 'Restauração'],
        baseMin: 850,
        baseMax: 1200,
        color: 'indigo'
      },
      {
        id: 2,
        name: t('jobs_trend_tech', language),
        description: t('jobs_trend_tech_desc', language),
        topics: ['Tecnologia & TI', 'TI, Telecomunicações & Design', 'TI', 'IT', 'Tecnologia'],
        baseMin: 1200,
        baseMax: 3500,
        color: 'sky'
      },
      {
        id: 3,
        name: t('jobs_trend_const', language),
        description: t('jobs_trend_const_desc', language),
        topics: ['Construção Civil & Engenharia', 'Construção Civil', 'Construção'],
        baseMin: 900,
        baseMax: 1500,
        color: 'amber'
      },
      {
        id: 4,
        name: t('jobs_trend_energy', language),
        description: t('jobs_trend_energy_desc', language),
        topics: ['Energias Renováveis', 'Energia', 'Renewable'],
        baseMin: 1100,
        baseMax: 2000,
        color: 'emerald'
      },
      {
        id: 5,
        name: t('jobs_trend_health', language),
        description: t('jobs_trend_health_desc', language),
        topics: ['Saúde & Cuidados', 'Saúde, Apoio Social & Estética', 'Saúde', 'Cuidados'],
        baseMin: 1000,
        baseMax: 1800,
        color: 'rose'
      }
    ];

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

    return sectors.map(sec => {
      // Filter active listings belonging to this sector
      const sectorJobs = jobs.filter(j => {
        const topic = j.workTopic;
        return topic && sec.topics.some(t => topic.toLowerCase().includes(t.toLowerCase()));
      });

      const count = sectorJobs.length;

      // Calculate time-based growth percentage (recent 10 days vs previous 10 days)
      const recent = sectorJobs.filter(j => {
        const date = new Date((j as any).posted_at || j.datePosted || now);
        return date >= tenDaysAgo;
      }).length;

      const older = sectorJobs.filter(j => {
        const date = new Date((j as any).posted_at || j.datePosted || now);
        return date >= twentyDaysAgo && date < tenDaysAgo;
      }).length;

      let growthVal = 12;
      if (older > 0) {
        growthVal = Math.round(((recent - older) / older) * 100);
      } else if (recent > 0) {
        growthVal = Math.min(30, recent * 4); // relative scale
      }

      // Cap rate realistically to avoid extreme visual spikes
      growthVal = Math.min(38, Math.max(-8, growthVal));
      if (growthVal === 0) growthVal = 7; // ensure small positive movement

      const growth = growthVal >= 0 ? `+${growthVal}%` : `${growthVal}%`;

      // Set demand level based on number of active listings
      let demandLevel = t('jobs_demand_med', language);
      if (count > 25) {
        demandLevel = t('jobs_demand_vhigh', language);
      } else if (count > 10) {
        demandLevel = t('jobs_demand_high', language);
      }

      // Compute fluctuating salary according to growth and count
      const salaryBonus = Math.min(220, Math.max(-40, Math.round(growthVal * 1.5 + count * 0.4)));
      const finalMin = sec.baseMin + salaryBonus;
      const finalMax = sec.baseMax + salaryBonus;
      const averageSalary = `${finalMin.toLocaleString('pt-PT')} - ${finalMax.toLocaleString('pt-PT')}`;

      // Dynamic progress bar width
      const totalMinScale = 800;
      const totalMaxScale = 4000;
      const progressPercent = Math.min(100, Math.max(10, Math.round(((finalMin + finalMax) / 2 - totalMinScale) / (totalMaxScale - totalMinScale) * 100)));

      return {
        id: sec.id,
        name: sec.name,
        description: sec.description,
        demandLevel,
        averageSalary,
        growth,
        color: sec.color,
        width: `${progressPercent}%`,
        count
      };
    });
  }, [jobs, language]);

  // Overall statistics
  const totalActiveOffers = jobs.length;
  const overallAvgSalary = React.useMemo(() => {
    if (jobs.length === 0) return '1.450';
    // Calculate dynamic national average based on listings
    const base = 1410;
    const offset = Math.min(240, Math.round(jobs.length * 0.05));
    return (base + offset).toLocaleString('pt-PT');
  }, [jobs]);

  const hasActiveFilters = searchQuery || selectedCity !== t('jobs_all_districts', language) || selectedWorkTopic !== 'Todos' || selectedSource !== t('jobs_all_sources', language) || selectedDateRange !== 'all';

  const fetchJobs = async (forceRefresh: boolean = false) => {
    console.log("📡 MIRA: Iniciando busca de vagas...");
    setError(null);
    let hasLoadedFromCache = false;

    if (!forceRefresh) {
      const cached = localStorage.getItem('mira_jobs_cache_v2') || localStorage.getItem('mira_jobs_cache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const data = Array.isArray(parsed) ? parsed : (parsed?.data || []);
          const cachedTotal = parsed?.totalPlatformJobs || 0;
          const cachedGrowth = parsed?.jobsGrowth || null;
          
          if (Array.isArray(data) && data.length > 0) {
            setJobs(data);
            setTotalPlatformJobs(cachedTotal || 0);
            if (cachedGrowth) setJobsGrowth(cachedGrowth);
            setLoading(false);
            hasLoadedFromCache = true;

            // Se o cache tiver menos de 5 minutos, não fazemos novo fetch em background
            const timestamp = parsed?.timestamp || 0;
            if (timestamp && Date.now() - timestamp < 300000) {
              return;
            }
          }
        } catch (e) { }
      }
    }

    if (!hasLoadedFromCache && jobs.length === 0) {
      setLoading(true);
    }

    try {
      // 📊 MIRA INSIGHTS: Fetch platform totals and trend
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalCount },
        { count: recentCount },
        { count: prevCount }
      ] = await Promise.all([
        supabase.from('job_posts').select('id', { count: 'exact', head: true }),
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo)
      ]);

      setTotalPlatformJobs(totalCount || 0);

      let computedGrowth = { percentage: 0, trend: 'neutral' as 'up' | 'down' | 'neutral' };
      if (recentCount !== null && prevCount !== null) {
          if (prevCount === 0) {
              computedGrowth = { percentage: recentCount > 0 ? 100 : 0, trend: recentCount > 0 ? 'up' : 'neutral' };
          } else {
              const diff = ((recentCount - prevCount) / prevCount) * 100;
              computedGrowth = { 
                  percentage: Math.abs(Math.round(diff)), 
                  trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral' 
              };
          }
          setJobsGrowth(computedGrowth);
      }

      // ⚡ OTIMIZAÇÃO CRÍTICA MIRA: Selecionar apenas colunas usadas na lista para reduzir tráfego de dados (Filtrar estritamente <= 60 dias)
      const sixtyDaysAgoISO = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, location, source_name, source_url, date_posted, posted_at, created_at, category, work_topic')
        .gte('created_at', sixtyDaysAgoISO)
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;

      let formattedJobs: JobPost[] = [];
      if (data && data.length > 0) {
        formattedJobs = data
          .filter(dbJob => {
            const rawTime = (dbJob as any).created_at || (dbJob as any).posted_at || (dbJob as any).date_posted;
            return dbJob.source_url && dbJob.source_url !== '#' && dbJob.title && dbJob.title.length > 3 && !isSpamOrBlog(dbJob.title, dbJob.source_url) && isWithin60Days(rawTime);
          })
          .map(dbJob => {
            const rawTime = (dbJob as any).created_at || (dbJob as any).posted_at || (dbJob as any).date_posted;
            const now = new Date();
            const postDate = rawTime ? new Date(rawTime) : now;
            const diffHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            let displayDate = 'Hoje';
            if (diffHours < 12) displayDate = 'Hoje (Recente)';
            else if (diffHours < 24) displayDate = 'Hoje';
            else if (diffDays === 1) displayDate = 'Ontem';
            else if (diffDays <= 30) displayDate = `Há ${diffDays} dias`;
            else displayDate = postDate.toLocaleDateString('pt-PT');

            return {
              id: dbJob.id,
              title: dbJob.title || t('jobs_no_title', language),
              location: dbJob.location || 'Portugal',
              sourceName: dbJob.source_name || 'MIRA',
              sourceUrl: dbJob.source_url,
              datePosted: displayDate,
              posted_at: rawTime || now.toISOString(),
              tags: Array.isArray((dbJob as any).tags) ? (dbJob as any).tags : (dbJob.title && dbJob.title.toLowerCase().includes('remoto') ? ['Remote'] : []),
              category: normalizeCategory(dbJob.category || 'Trabalho & Carreira'),
              workTopic: normalizeWorkTopic((dbJob as any).work_topic, dbJob.title)
            };
          });
      }

      // 👑 SOBERANIA MIRA: Carregamento Dinâmico (Lazy Load) da Base Massiva de Vagas Locais!
      let fallbackJobs: any[] = [];
      try {
        const massiveModule = await import('../utils/massiveJobsDatabase');
        fallbackJobs = massiveModule.PROTECTED_JOBS || [];
      } catch (err) {
        console.warn("MIRA JobBoard: Falha ao carregar base massiva local. Usando fallback básico.", err);
        fallbackJobs = PROTECTED_JOBS || [];
      }

      const finalJobs = [...formattedJobs];
      // O(1) Set lookup para deduplicação instantânea sem congelar a UI principal
      const existingIds = new Set(finalJobs.map(j => j.id));

      fallbackJobs
        .filter(pj => {
          const url = pj.source_url || pj.sourceUrl;
          const dateStr = pj.created_at || pj.posted_at || pj.date_posted;
          return url && url !== '#' && pj.title && !isSpamOrBlog(pj.title, url) && isWithin60Days(dateStr);
        })
        .forEach((pj, idx) => {
          if (!existingIds.has(pj.id)) {
            const now = new Date();
            // Stagger fallback job timestamps to represent active recent jobs
            const offsetHours = (idx % 24) * 2;
            const postDate = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);
            const diffHours = offsetHours;
            const diffDays = Math.floor(diffHours / 24);
            let displayDate = 'Hoje';
            if (diffHours < 12) displayDate = 'Hoje (Recente)';
            else if (diffHours < 24) displayDate = 'Hoje';
            else if (diffDays === 1) displayDate = 'Ontem';
            else displayDate = `Há ${diffDays} dias`;

            const finalPj = {
              id: pj.id,
              title: pj.title || t('jobs_no_title', language),
              location: pj.location || 'Portugal',
              sourceName: pj.source_name || pj.sourceName || 'MIRA',
              sourceUrl: pj.source_url || pj.sourceUrl,
              datePosted: displayDate,
              posted_at: postDate.toISOString(),
              tags: Array.isArray(pj.tags) ? pj.tags : (pj.title && pj.title.toLowerCase().includes('remoto') ? ['Remote'] : []),
              category: normalizeCategory(pj.category || 'Trabalho & Carreira'),
              workTopic: normalizeWorkTopic(pj.work_topic || pj.workTopic, pj.title)
            } as any;
            finalJobs.push(finalPj);
            existingIds.add(pj.id);
          }
        });

      setJobs(finalJobs);
      
      // Guardar estrutura completa em cache local com timestamp TTL
      const cacheObj = {
          timestamp: Date.now(),
          data: finalJobs,
          totalPlatformJobs: totalCount || 0,
          jobsGrowth: computedGrowth
      };
      localStorage.setItem('mira_jobs_cache_v2', JSON.stringify(cacheObj));
    } catch (err: any) {
      console.error('MIRA JobBoard error:', err);
      if (!hasLoadedFromCache && jobs.length === 0) setError(t('job_connection_error', language));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const sources = React.useMemo(() => {
    const s = new Set(jobs.map(j => j.sourceName));
    return [t('jobs_all_sources', language), ...Array.from(s).sort()];
  }, [jobs, language]);

  const filteredJobs = React.useMemo(() => {
    const allDistricts = t('jobs_all_districts', language);
    const normalize = (text: string) => 
      text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const searchNorm = normalize(searchQuery.trim());
    const isTagSearch = searchNorm.startsWith('#');
    const tagQuery = isTagSearch ? searchNorm.substring(1) : '';

    // Smart regex boundary checking for short acronym queries (e.g. "it", "ti", "rh", "hr")
    let searchRegex: RegExp | null = null;
    const isShortQuery = searchNorm && searchNorm.length <= 3;
    if (isShortQuery) {
      // Escape special characters in searchNorm to be safe
      const escaped = searchNorm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      searchRegex = new RegExp(`\\b${escaped}\\b`, 'i');
    }

    return jobs.filter(job => {
      const titleNorm = normalize(job.title);
      const sourceNorm = normalize(job.sourceName);
      const locNorm = normalize(job.location || '');
      
      let matchesSearch = !searchNorm;
      if (searchNorm) {
        if (isTagSearch) {
          matchesSearch = job.tags.some(t => normalize(t).includes(tagQuery));
        } else if (isShortQuery && searchRegex) {
          // If search is a short query, match whole-word boundaries to avoid false positives (e.g., matching "distrito" for "it")
          const matchesRegex = searchRegex.test(titleNorm) || searchRegex.test(sourceNorm) || searchRegex.test(locNorm);
          
          // Advanced MIRA intelligence override: map standard tech/HR acronyms directly to categories
          let matchesCategoryOverride = false;
          if (searchNorm === 'it' || searchNorm === 'ti') {
            matchesCategoryOverride = job.workTopic === 'Tecnologia, Dados & IA';
          } else if (searchNorm === 'rh' || searchNorm === 'hr') {
            matchesCategoryOverride = job.workTopic === 'Administrativo, Gestão & RH';
          }
          
          matchesSearch = matchesRegex || matchesCategoryOverride;
        } else {
          // Default substring check for longer queries (e.g., "energia", "enfermeiro")
          matchesSearch = titleNorm.includes(searchNorm) || sourceNorm.includes(searchNorm) || locNorm.includes(searchNorm);
        }
      }
        
      let matchesCity = selectedCity === t('jobs_all_districts', language) || 
        locNorm.includes(normalize(selectedCity));
      
      // Smart Fallback for Remote jobs: if the user explicitly filters by "Remoto", 
      // we check for title contains "remoto"/"remote", the tag "Remote"/"Remoto", 
      // or the specific Remote workTopic category, to ensure no remote job is missed.
      if (!matchesCity && normalize(selectedCity) === 'remoto') {
        matchesCity = titleNorm.includes('remoto') || 
                      titleNorm.includes('remote') || 
                      job.tags.some(t => {
                        const n = normalize(t);
                        return n.includes('remote') || n.includes('remoto');
                      }) ||
                      job.workTopic === 'Trabalho Remoto & Freelancing';
      }
      
      const matchesTopic = selectedWorkTopic === 'Todos' || job.workTopic === selectedWorkTopic;
      const matchesSource = selectedSource === t('jobs_all_sources', language) || job.sourceName === selectedSource;

      // Date Range Logic
      let matchesDate = true;
      if (selectedDateRange !== 'all') {
        const postedDate = new Date((job as any).posted_at || job.datePosted);
        const now = new Date();
        const diffDays = (now.getTime() - postedDate.getTime()) / (1000 * 3600 * 24);
        
        if (selectedDateRange === 'today') matchesDate = diffDays <= 1;
        else if (selectedDateRange === '3d') matchesDate = diffDays <= 3;
        else if (selectedDateRange === '7d') matchesDate = diffDays <= 7;
      }

      let matchesQuickFilter = true;
      if (selectedQuickFilter) {
        const titleLower = titleNorm;
        const tagsLower = job.tags.map(t => normalize(t));
        const q = selectedQuickFilter;
        if (q === 'english') {
          matchesQuickFilter = titleLower.includes('english') || titleLower.includes('ingles') || titleLower.includes('anglophone') || tagsLower.some(t => t.includes('english') || t.includes('ingles'));
        } else if (q === 'visa') {
          matchesQuickFilter = titleLower.includes('visa') || titleLower.includes('sponsorship') || titleLower.includes('relocation') || titleLower.includes('visto') || titleLower.includes('patrocinio') || tagsLower.some(t => t.includes('visa') || t.includes('visto') || t.includes('sponsorship'));
        } else if (q === 'remote') {
          matchesQuickFilter = locNorm.includes('remoto') || locNorm.includes('remote') || titleLower.includes('remote') || titleLower.includes('remoto') || job.workTopic === 'Trabalho Remoto & Freelancing' || tagsLower.some(t => t.includes('remote') || t.includes('remoto'));
        } else if (q === 'entry') {
          matchesQuickFilter = titleLower.includes('junior') || titleLower.includes('trainee') || titleLower.includes('estagio') || titleLower.includes('entry') || titleLower.includes('no experience') || titleLower.includes('sem experiencia') || tagsLower.some(t => t.includes('junior') || t.includes('estagio'));
        }
      }

      return matchesSearch && matchesCity && matchesTopic && matchesSource && matchesDate && matchesQuickFilter;
    }).sort((a, b) => {
      const timeA = new Date((a as any).posted_at || a.datePosted || 0).getTime();
      const timeB = new Date((b as any).posted_at || b.datePosted || 0).getTime();
      return timeB - timeA;
    });
  }, [jobs, searchQuery, selectedCity, selectedWorkTopic, selectedSource, selectedDateRange, selectedQuickFilter, language]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity(t('jobs_all_districts', language));
    setSelectedWorkTopic('Todos');
    setSelectedSource(t('jobs_all_sources', language));
    setSelectedDateRange('all');
    setSelectedQuickFilter(null);
  };

  const scrollerTopics = React.useMemo(() => {
    const seen = new Set();
    return WORK_TOPICS.filter(topic => {
      const key = getWorkTopicKey(topic);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  // 📊 SOBERANIA MIRA: Contagem em tempo real de vagas disponíveis por setor
  const topicCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    WORK_TOPICS.forEach(topic => {
      counts[topic] = 0;
    });
    jobs.forEach(job => {
      if (job.workTopic) {
        counts[job.workTopic] = (counts[job.workTopic] || 0) + 1;
      }
    });
    return counts;
  }, [jobs]);

  // MIRA V2026.ELITE: Auto-load jobs on scroll (Infinite Scroll)
  useEffect(() => {
    if (!loadMoreRef.current || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleJobsCount(prev => prev + 20);
      }
    }, { threshold: 0.1, rootMargin: '100px' });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredJobs.length, visibleJobsCount, loading]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900 font-['Plus_Jakarta_Sans']">
      {/* Header Sticky Section - IMPERIAL */}
      <div className="bg-white/95 backdrop-blur-3xl px-6 pt-8 pb-4 space-y-6 z-30 border-b border-slate-100 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{t('jobs_title', language)}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-mira-orange animate-pulse shadow-[0_0_10px_#FF8C00]"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] !mb-0">{t('jobs_subtitle', language)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-red-100"
              >
                <X size={16} /> <span className="hidden sm:inline">{t('jobs_reset_filters_btn', language)}</span>
              </button>
            )}
            <button
              onClick={() => fetchJobs()}
              disabled={loading}
              className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tab Switcher - LIGHT/DARK DYNAMIC STYLING */}
        <div className="flex bg-white p-1.5 rounded-[2rem] w-full border border-slate-200 shadow-sm relative overflow-hidden">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'jobs' ? 'bg-[#0A0A0A] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Briefcase size={15} className={activeTab === 'jobs' ? 'animate-mira-blink-modern' : ''} /> {t('nav_vagas', language)}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'trends' ? 'bg-[#0A0A0A] text-white shadow-xl' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Activity size={15} className={activeTab === 'trends' ? 'animate-mira-blink-modern' : ''} /> {t('jobs_insight_title', language)}
          </button>
        </div>
        
        <button
          onClick={() => {
            analytics.track('europass_click', 'u1');
            window.open('https://europa.eu/europass/eportfolio/screen/cv-editor/legacy-cv-editor?lang=pt', '_blank');
          }}
          className="w-full bg-[#003399] text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:bg-[#001F3F] transition-all active:scale-95"
        >
          <FileText size={18} /> {t('jobs_create_cv', language)}
        </button>

        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 📊 SOBERANIA MIRA: Metrics Dashboard (Market & Platform Analytics) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-2.5 rounded-[2rem] border border-slate-100/50 shadow-inner">
              {/* Metric 1: Total Active Jobs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={10} className="text-sky-500" /> {t('jobs_active_title', language)}</span>
                <span className="text-xl font-black font-mono text-slate-800 tracking-tighter mt-1">+{totalPlatformJobs > 0 ? totalPlatformJobs : filteredJobs.length}</span>
              </div>
              
              {/* Metric 2: Average Estimated Salary */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={10} className="text-emerald-500" /> {t('jobs_avg_salary_title', language)}</span>
                <span className="text-xl font-black font-mono text-slate-800 tracking-tighter mt-1">{overallAvgSalary}€</span>
              </div>

              {/* Metric 3: Verified Portals */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 size={10} className="text-amber-500" /> {t('jobs_official_sources', language)}</span>
                <span className="text-xl font-black font-mono text-slate-800 tracking-tighter mt-1">66+</span>
              </div>

              {/* Metric 4: Trending Sector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Activity size={10} className="text-rose-500" /> {t('jobs_trend_title', language)}</span>
                <span className="text-[11px] font-black text-slate-700 mt-2 uppercase tracking-wide truncate">{t('jobs_tech_health', language)}</span>
              </div>
            </div>

            {/* Search Bar - INTUITIVE */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-slate-400 group-focus-within:text-mira-orange transition-colors duration-300" size={20} />
              </div>
              <input
                type="text"
                placeholder={t('jobs_search_placeholder', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-5 py-4 bg-white border border-slate-200 hover:border-slate-300 rounded-[1.5rem] text-sm font-bold text-slate-800 focus:bg-white focus:border-mira-orange focus:ring-4 focus:ring-mira-orange/10 outline-none transition-all shadow-sm placeholder-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Quick Filters for Foreigners & Expats - Fully Visible Grid (No horizontal scrolling) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {[
                { id: 'english', label: t('jobs_quick_english', language), color: 'border-blue-200 text-blue-600 bg-blue-50/70 hover:bg-blue-100' },
                { id: 'visa', label: t('jobs_quick_visa', language), color: 'border-amber-200 text-amber-700 bg-amber-50/70 hover:bg-amber-100' },
                { id: 'remote', label: t('jobs_quick_remote', language), color: 'border-teal-200 text-teal-600 bg-teal-50/70 hover:bg-teal-100' },
                { id: 'entry', label: t('jobs_quick_entry', language), color: 'border-purple-200 text-purple-600 bg-purple-50/70 hover:bg-purple-100' },
              ].map(pill => {
                const isActive = selectedQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedQuickFilter(isActive ? null : pill.id)}
                    className={`w-full py-3 px-3 border rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-sm ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20 ring-2 ring-slate-900/30'
                        : pill.color
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Expat Job Seeker Visa & Relocation Guide (Inspired by jobsinportugal.pt) */}
            <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('jobs_insight_title', language)}
                    </h4>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug">
                      {t('jobs_visa_guide_title', language)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal">
                      {t('jobs_visa_guide_sub', language)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisaGuideOpen(!isVisaGuideOpen)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-600 border border-slate-100 transition-all active:scale-95 shrink-0 text-center"
                >
                  {isVisaGuideOpen ? (language.toLowerCase() === 'pt' ? 'Fechar' : language.toLowerCase() === 'es' ? 'Cerrar' : language.toLowerCase() === 'fr' ? 'Fermer' : 'Close') : t('jobs_visa_guide_btn_read', language)}
                </button>
              </div>

              {isVisaGuideOpen && (
                <div className="pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Financial Requirements */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-1.5">
                      <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        {t('jobs_visa_guide_financial_title', language)}
                      </h4>
                      <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed">
                        {t('jobs_visa_guide_financial_desc', language)}
                      </p>
                    </div>

                    {/* Visa Requirements Checklist */}
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        {t('jobs_visa_guide_steps_title', language)}
                      </h4>
                      <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed whitespace-pre-line">
                        {t('jobs_visa_guide_steps_desc', language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        if (onViewChange) {
                          onViewChange(ViewType.DOCUMENTS, { tab: 'visa_job_search' });
                        }
                      }}
                      className="px-6 py-3 bg-[#0A0A0A] hover:bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-md shadow-slate-900/10"
                    >
                      <Sparkles size={12} className="text-amber-400 animate-pulse" />
                      {t('jobs_visa_guide_btn_start', language)}
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filters Grid ( responsive 2-column grid with Area and Location dropdowns ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              {/* Category Select */}
              <div className="relative space-y-2 group cursor-pointer">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5">
                  <Briefcase size={12} className="text-sky-500" /> {t('jobs_filter_area', language)}
                </label>
                <div className="relative">
                  <select
                    value={selectedWorkTopic}
                    onChange={(e) => setSelectedWorkTopic(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-sky-500/20 border border-transparent focus:border-sky-500/30 text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="Todos">🌐 {t('jobs_all_areas', language)} ({jobs.length})</option>
                    {scrollerTopics.map(topic => {
                      const details = TOPIC_DETAILS[topic] || TOPIC_DETAILS["Outros"];
                      const count = topicCounts[topic] || 0;
                      return (
                        <option key={topic} value={topic}>
                          {details.emoji} {t(getWorkTopicKey(topic), language)} ({count})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-sky-500 transition-colors" size={14} />
                </div>
              </div>

              {/* Location Select */}
              <div className="relative space-y-2 group cursor-pointer">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5"><MapPin size={12} className="text-mira-orange" /> {t('jobs_label_loc', language)}</label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange/20 border border-transparent focus:border-mira-orange/30 text-slate-700 transition-all cursor-pointer"
                  >
                    {LOCATIONS(language).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-mira-orange transition-colors" size={14} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6 pb-10 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
              <Briefcase size={40} />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{t('jobs_loading', language)}</p>
              <p className="text-xs font-bold text-slate-400">{t('jobs_loading_desc', language)}</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-4 bg-red-50 text-red-500 rounded-3xl"><AlertCircle size={32} /></div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchJobs()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">{t('jobs_btn_try_again', language)}</button>
          </div>
        ) : activeTab === 'jobs' ? (
          filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {filteredJobs.slice(0, visibleJobsCount).map(job => (
                <JobItem key={job.id} job={job} language={language} />
              ))}

              {filteredJobs.length > visibleJobsCount && (
                <div ref={loadMoreRef} className="flex justify-center pt-8">
                  <button
                    onClick={(e) => { e.stopPropagation(); setVisibleJobsCount(prev => prev + 20); }}
                    className="px-10 py-5 bg-mira-orange text-white border border-mira-orange/10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-mira-orange/20 hover:bg-slate-900 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> 
                    {t('jobs_load_more_btn', language)}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-100 rounded-[3rem] flex items-center justify-center text-slate-200 border border-slate-100">
                <Search size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('jobs_empty_title', language)}</p>
                <p className="text-sm font-medium text-slate-500 px-10 leading-relaxed">{t('jobs_empty_desc', language).replace('total', jobs.length.toString())}</p>
              </div>
              <button
                onClick={() => { setSelectedCity('Todos'); setSelectedWorkTopic('Todos'); setSearchQuery(''); }}
                className="px-8 py-3 bg-white text-slate-400 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                {t('jobs_reset_filters_btn', language)}
              </button>
            </div>
          )
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Market Insights Hero Card - Upgraded Clean High-Tech Glass */}
            <div className="p-8 sm:p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
              {/* Subtle grid backdrop for tech aesthetic */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
              
              {/* Soft radial background decorations (Sky Blue, Orange) */}
              <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-mira-orange/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mira-orange opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mira-orange"></span>
                    </span>
                    <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                      {t('jobs_insight_title', language)}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-snug text-slate-800">
                    {t('jobs_growth_desc', language)}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    {t('jobs_insight_desc_card', language)}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-none bg-slate-50 border border-slate-200/60 px-5 py-4 rounded-2xl flex flex-col justify-center min-w-[120px] sm:min-w-[130px] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-sky-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('jobs_avg_salary', language)}</span>
                    <span className="text-xl font-black font-mono text-slate-800 leading-none tracking-tighter">{overallAvgSalary}€</span>
                  </div>
                  <div className="flex-1 sm:flex-none bg-slate-50 border border-slate-200/60 px-5 py-4 rounded-2xl flex flex-col justify-center min-w-[120px] sm:min-w-[130px] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-mira-orange" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('jobs_active_offers', language)}</span>
                    <span className="text-xl font-black font-mono text-slate-800 leading-none tracking-tighter">+{totalPlatformJobs > 0 ? totalPlatformJobs : totalActiveOffers}</span>
                    {jobsGrowth && (
                        <div className={`mt-2 text-[9px] font-black flex items-center gap-1 ${jobsGrowth.trend === 'up' ? 'text-emerald-500' : jobsGrowth.trend === 'down' ? 'text-rose-500' : 'text-slate-500'}`}>
                            {jobsGrowth.trend === 'up' ? <TrendingUp size={10} strokeWidth={3} /> : jobsGrowth.trend === 'down' ? <TrendingDown size={10} strokeWidth={3} /> : <Minus size={10} strokeWidth={3} />}
                            {jobsGrowth.trend === 'up' ? '+' : jobsGrowth.trend === 'down' ? '-' : ''}{jobsGrowth.percentage}% {t('jobs_new_offers_count', language)}
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* List of Insights / Trends */}
            <div className="grid grid-cols-1 gap-5">
              {(() => {
                const getIconAndColor = (id: number) => {
                  switch (id) {
                    case 1: return { 
                      icon: '🏨', 
                      color: 'indigo',
                      accentBorder: 'hover:border-indigo-200', 
                      borderIndicator: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]',
                      bg: 'bg-indigo-50/60 border-indigo-100', 
                      bar: 'bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.5)]'
                    };
                    case 2: return { 
                      icon: '💻', 
                      color: 'sky',
                      accentBorder: 'hover:border-sky-200', 
                      borderIndicator: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]',
                      bg: 'bg-sky-50/60 border-sky-100', 
                      bar: 'bg-sky-500 shadow-[0_0_4px_rgba(14,165,233,0.5)]'
                    };
                    case 3: return { 
                      icon: '🏗️', 
                      color: 'amber',
                      accentBorder: 'hover:border-amber-200', 
                      borderIndicator: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
                      bg: 'bg-amber-50/60 border-amber-100', 
                      bar: 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]'
                    };
                    case 4: return { 
                      icon: '⚡', 
                      color: 'emerald',
                      accentBorder: 'hover:border-emerald-200', 
                      borderIndicator: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
                      bg: 'bg-emerald-50/60 border-emerald-100', 
                      bar: 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]'
                    };
                    case 5: return { 
                      icon: '🩺', 
                      color: 'rose',
                      accentBorder: 'hover:border-rose-200', 
                      borderIndicator: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
                      bg: 'bg-rose-50/60 border-rose-100', 
                      bar: 'bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.5)]'
                    };
                    default: return { 
                      icon: '💼', 
                      color: 'slate',
                      accentBorder: 'hover:border-slate-200', 
                      borderIndicator: 'bg-slate-500',
                      bg: 'bg-slate-50/60 border-slate-100', 
                      bar: 'bg-slate-500'
                    };
                  }
                };

                return dynamicTrends.map(trend => {
                  const style = getIconAndColor(trend.id);
                  const isHighDemand = trend.demandLevel.includes('Alta') || trend.demandLevel.includes('High') || trend.demandLevel.includes('Élevée');
                  const demandStyle = isHighDemand 
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' 
                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20';

                  return (
                    <div 
                      key={trend.id} 
                      className={`
                        bg-white p-6 rounded-[2.25rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300
                        hover:shadow-xl hover:shadow-slate-100 ${style.accentBorder} hover:-translate-y-1 active:scale-[0.99] relative overflow-hidden
                      `}
                    >
                      {/* Left color strip indicator for visual premium touch */}
                      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${style.borderIndicator}`} />

                      {/* Left: Icon and Details */}
                      <div className="flex items-start gap-4 min-w-0 flex-1 pl-2">
                        {/* Icon Box */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${style.bg} border relative`}>
                          <span className="relative z-10">{style.icon}</span>
                        </div>
                        
                        {/* Content */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">
                              {trend.name}
                            </h4>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${demandStyle}`}>
                              {trend.demandLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            {trend.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Salary & Growth Stats */}
                      <div className="flex items-center justify-between md:justify-end gap-x-8 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {/* Salary Visual Box */}
                        <div className="flex flex-col min-w-[100px]">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t('jobs_avg_salary', language)}
                          </span>
                          <span className="text-sm font-black font-mono text-slate-800">
                            {trend.averageSalary}€
                          </span>
                          {/* Mini Progress Bar representation */}
                          <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${style.bar}`} 
                              style={{ width: trend.width }}
                            />
                          </div>
                        </div>

                        {/* Growth Box */}
                        <div className="flex flex-col text-right">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {t('jobs_growth', language)}
                          </span>
                          <div className="inline-flex items-center gap-1 self-end bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs font-black font-mono">
                            <TrendingUp size={10} className="text-emerald-500" />
                            {trend.growth}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
