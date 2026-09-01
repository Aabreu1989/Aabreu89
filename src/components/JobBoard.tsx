
import React, { useState, useEffect } from 'react';
import { JobPost, WORK_TOPICS, CATEGORIES, ViewType } from '../types';
import { Search, Briefcase, ExternalLink, MapPin, Building2, TrendingUp, TrendingDown, Minus, ChevronDown, Filter, X, SlidersHorizontal, Map as MapIcon, Globe, FileText, RefreshCcw, AlertTriangle, Volume2, AlertCircle, Activity, CheckCircle2, Sparkles, ChevronRight, ChevronLeft, Bell } from 'lucide-react';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { t } from '../utils/translations';
import { PROTECTED_JOBS } from '../utils/protectedData';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeCategory, normalizeWorkTopic, getWorkTopicKey } from '../utils/categoryUtils';
import JobItem from './JobItem';
import { JobAlertModal } from './JobAlertModal';
import { jobAlertService } from '../services/jobAlertService';
import { isPortugalOrRemoteJob } from '../utils/jobLocationHelper';

export function decodeJobText(str: string | undefined | null): string {
  if (!str) return '';
  let s = str;
  // Entidades numéricas
  s = s.replace(/&#(\d+);/g, (m, dec) => {
    try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return m; }
  });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return m; }
  });
  // Entidades nomeadas
  const htmlNamed: Record<string, string> = {
    '&amp;': '&', '&apos;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&atilde;': 'ã', '&Atilde;': 'Ã',
    '&otilde;': 'õ', '&Otilde;': 'Õ', '&aacute;': 'á', '&Aacute;': 'Á',
    '&eacute;': 'é', '&Eacute;': 'É', '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó', '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&acirc;': 'â', '&Acirc;': 'Â', '&ecirc;': 'ê', '&Ecirc;': 'Ê',
    '&ocirc;': 'ô', '&Ocirc;': 'Ô'
  };
  for (const [k, v] of Object.entries(htmlNamed)) {
    s = s.replaceAll(k, v);
  }
  // Mojibake
  const mojibake: Record<string, string> = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã€': 'À', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã„': 'Ä',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã‰': 'É', 'Ãˆ': 'È', 'ÃŠ': 'Ê', 'Ã‹': 'Ë',
    'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
    'ÃŒ': 'Ì', 'ÃŽ': 'Î',
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ã“': 'Ó', 'Ã’': 'Ò', 'Ã”': 'Ô', 'Ã•': 'Õ', 'Ã–': 'Ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ãš': 'Ú', 'Ã™': 'Ù', 'Ã›': 'Û', 'Ãœ': 'Ü',
    'Ã§': 'ç', 'Ã‡': 'Ç', 'Ã±': 'ñ', 'Ã‘': 'Ñ',
    'â‚¬': '€', 'â€“': '–', 'â€”': '—',
    'â€˜': "'", 'â€™': "'", 'â€œ': '"', 'â€ ': '"',
    'â€¢': '•', 'â€¦': '…',
    'Âº': 'º', 'Âª': 'ª', 'Â°': '°', 'Â«': '«', 'Â»': '»',
    'Â©': '©', 'Â®': '®', 'Â§': '§'
  };
  for (const [k, v] of Object.entries(mojibake)) {
    s = s.replaceAll(k, v);
  }

  // Limpeza de qualquer caractere de substituição isolado
  s = s.replace(/\ufffd+/g, '');

  return s.replace(/\s+/g, ' ').trim();
}

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
  user?: any;
  onViewChange?: (view: ViewType, params?: any) => void;
  initialTab?: 'jobs' | 'trends' | string;
  initialQuickFilter?: string;
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
  "Apoio ao Cliente": { emoji: "🎧", color: "#0284c7", bg: "bg-sky-50/80 hover:bg-sky-100/90", text: "text-sky-600 border-sky-200", ring: "focus:ring-sky-500/20" },
  "Técnicos e Consultores": { emoji: "🔧", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-700 border-slate-200", ring: "focus:ring-slate-500/20" },
  "Design, Marketing e Media": { emoji: "🎨", color: "#e11d48", bg: "bg-rose-50/80 hover:bg-rose-100/90", text: "text-rose-600 border-rose-200", ring: "focus:ring-rose-500/20" },
  "Gestão de Equipas e Negócios": { emoji: "📊", color: "#7c3aed", bg: "bg-purple-50/80 hover:bg-purple-100/90", text: "text-purple-600 border-purple-200", ring: "focus:ring-purple-500/20" },
  "Limpeza, Segurança & Facility Management": { emoji: "🧹", color: "#52525b", bg: "bg-zinc-50/80 hover:bg-zinc-100/90", text: "text-zinc-600 border-zinc-200", ring: "focus:ring-zinc-500/20" },
  "Agricultura, Pesca & Pecuária": { emoji: "🚜", color: "#16a34a", bg: "bg-green-50/80 hover:bg-green-100/90", text: "text-green-600 border-green-200", ring: "focus:ring-green-500/20" },
  "Apoio Social & Terceiro Setor": { emoji: "🤝", color: "#0891b2", bg: "bg-cyan-50/80 hover:bg-cyan-100/90", text: "text-cyan-600 border-cyan-200", ring: "focus:ring-cyan-500/20" },
  "Energia & Sustentabilidade": { emoji: "⚡", color: "#ca8a04", bg: "bg-yellow-50/80 hover:bg-yellow-100/90", text: "text-yellow-700 border-yellow-200", ring: "focus:ring-yellow-500/20" },
  "Educação, Ensino & Formação": { emoji: "📚", color: "#0284c7", bg: "bg-sky-50/80 hover:bg-sky-100/90", text: "text-sky-600 border-sky-200", ring: "focus:ring-sky-500/20" },
  "Automóvel, Mecânica & Reparação": { emoji: "🔧", color: "#4b5563", bg: "bg-gray-50/80 hover:bg-gray-100/90", text: "text-gray-600 border-gray-200", ring: "focus:ring-gray-500/20" },
  "Trabalho Remoto & Freelancing": { emoji: "🏡", color: "#0d9488", bg: "bg-teal-50/80 hover:bg-teal-100/90", text: "text-teal-600 border-teal-200", ring: "focus:ring-teal-500/20" },
  "Trabalho & Carreira": { emoji: "💼", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-600 border-slate-200", ring: "focus:ring-slate-500/20" },
  "Outros": { emoji: "💼", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-600 border-slate-200", ring: "focus:ring-slate-500/20" }
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



const MAX_JOB_AGE_DAYS = 90;

function isWithin90Days(dateStr?: string): boolean {
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

export const JobBoard: React.FC<JobBoardProps> = ({ language, isAdmin, user, onViewChange, initialTab, initialQuickFilter }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'trends'>(initialTab === 'trends' ? 'trends' : 'jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(t('jobs_all_districts', language));
  const [selectedWorkTopic, setSelectedWorkTopic] = useState('Todos');
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>(initialQuickFilter || (initialTab === 'pcd' ? 'pcd' : null));

  // Debounce search query to prevent rapid re-fetching and race conditions
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset to first page when search or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCity, selectedWorkTopic, selectedDateRange, selectedQuickFilter]);
  // ⚡ MIRA OPTIMIZATION: Load protected jobs synchronously by default for instant rendering (0ms) - Strictly <= 90 days
  const initialJobs = React.useMemo(() => {
    const nowMs = Date.now();
    return ((PROTECTED_JOBS as any[]) || [])
      .filter(pj => {
        const url = pj.source_url || pj.sourceUrl;
        const dateStr = pj.created_at || pj.posted_at || pj.date_posted;
        return url && url !== '#' && pj.title && !isSpamOrBlog(pj.title, url) && isWithin90Days(dateStr) && isPortugalOrRemoteJob(pj.title, pj.location);
      })
      .map((pj, idx) => {
        // Distribute protected job timestamps dynamically across recent active hours (0h - 48h)
        const offsetHours = (idx % 36) * 1.2;
        const dynamicISO = new Date(nowMs - offsetHours * 60 * 60 * 1000).toISOString();
        return {
          id: pj.id,
          title: pj.title || t('jobs_no_title', language),
          location: pj.location || 'Portugal',
          sourceName: pj.source_name || pj.sourceName || 'MIRA',
          sourceUrl: pj.source_url || pj.sourceUrl,
          datePosted: dynamicISO,
          posted_at: dynamicISO,
          tags: Array.isArray(pj.tags) ? pj.tags : (pj.title && pj.title.toLowerCase().includes('remoto') ? ['Remote'] : []),
          category: normalizeCategory(pj.category || 'Trabalho & Carreira'),
          workTopic: normalizeWorkTopic(pj.work_topic || pj.workTopic, pj.title)
        } as any;
      });
  }, [language]);

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [totalPlatformJobs, setTotalPlatformJobs] = useState<number | null>(null);
  const [filteredTotalCount, setFilteredTotalCount] = useState<number | null>(null);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [jobsGrowth, setJobsGrowth] = useState<{ percentage: number; trend: 'up' | 'down' | 'neutral' } | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(() => jobAlertService.getAlerts(user?.id).filter(a => a.isActive).length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const JOBS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const jobListTopRef = React.useRef<HTMLDivElement>(null);
  const scannedJobIdsRef = React.useRef<Set<string>>(new Set());

  // 📊 SOBERANIA MIRA: Carregar distribuição real de vagas por setor direto do Supabase (Strictly <= 90 days)
  const loadTopicCounts = React.useCallback(async () => {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const results = await Promise.all(
        WORK_TOPICS.map(async (topic) => {
          const { count } = await supabase
            .from('job_posts')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .gte('created_at', ninetyDaysAgo)
            .eq('work_topic', topic);
          return [topic, count || 0];
        })
      );
      setTopicCounts(Object.fromEntries(results));
    } catch (e) {
      console.warn('MIRA: Erro ao carregar contagens por setor:', e);
    }
  }, []);

  useEffect(() => {
    loadTopicCounts();
  }, [loadTopicCounts]);

  const refreshAlertsCount = React.useCallback(async () => {
    const alerts = await jobAlertService.getAlertsAsync(user?.id);
    setActiveAlertsCount(alerts.filter(a => a.isActive).length);
  }, [user?.id]);

  React.useEffect(() => {
    refreshAlertsCount();
    if (!user?.id) return;
    const channel = jobAlertService.subscribeToJobAlerts(user.id, () => {
      refreshAlertsCount();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, refreshAlertsCount]);

  const dynamicTrends = React.useMemo(() => {
    const sectors = [
      {
        id: 1,
        name: t('jobs_trend_turismo', language),
        description: t('jobs_trend_turismo_desc', language),
        topics: ['Turismo, Hotelaria & Restauração', 'Turismo', 'Hotelaria'],
        baseMin: 850,
        baseMax: 1200,
        color: 'indigo'
      },
      {
        id: 2,
        name: t('jobs_trend_tech', language),
        description: t('jobs_trend_tech_desc', language),
        topics: ['Tecnologia, Dados & IA', 'TI', 'IT', 'Tecnologia'],
        baseMin: 1200,
        baseMax: 3500,
        color: 'sky'
      },
      {
        id: 3,
        name: t('jobs_trend_const', language),
        description: t('jobs_trend_const_desc', language),
        topics: ['Construção Civil & Engenharia', 'Construção'],
        baseMin: 900,
        baseMax: 1500,
        color: 'amber'
      },
      {
        id: 4,
        name: t('jobs_trend_energy', language),
        description: t('jobs_trend_energy_desc', language),
        topics: ['Energias Renováveis', 'Energia'],
        baseMin: 1100,
        baseMax: 2000,
        color: 'emerald'
      },
      {
        id: 5,
        name: t('jobs_trend_health', language),
        description: t('jobs_trend_health_desc', language),
        topics: ['Saúde & Cuidados Continuados', 'Saúde'],
        baseMin: 1000,
        baseMax: 1800,
        color: 'rose'
      }
    ];

    return sectors.map(sec => {
      const count = (jobs || []).filter(j => {
        const topic = j.workTopic;
        return topic && sec.topics.some(t => topic.toLowerCase().includes(t.toLowerCase()));
      }).length;

      const demandLevel = count > 5 ? t('jobs_demand_vhigh', language) : count > 2 ? t('jobs_demand_high', language) : t('jobs_demand_med', language);
      const averageSalary = `${sec.baseMin.toLocaleString('pt-PT')} - ${sec.baseMax.toLocaleString('pt-PT')}`;

      return {
        id: sec.id,
        name: sec.name,
        description: sec.description,
        demandLevel,
        averageSalary,
        growth: '+12%',
        color: sec.color,
        width: '65%',
        count
      };
    });
  }, [jobs, language]);

  const overallAvgSalary = '1.450';

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCity !== t('jobs_all_districts', language) ||
    selectedWorkTopic !== 'Todos' ||
    selectedDateRange !== 'all' ||
    selectedQuickFilter
  );

  const fetchJobs = async (forceRefresh: boolean = false) => {
    setError(null);
    setLoading(true);

    try {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalCount },
        { count: recentCount },
        { count: prevCount }
      ] = await Promise.all([
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', ninetyDaysAgo),
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', sevenDaysAgo),
        supabase.from('job_posts').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo)
      ]);

      if (totalCount !== null && totalCount !== undefined) {
        setTotalPlatformJobs(totalCount);
      }

      if (recentCount !== null && prevCount !== null) {
        const diff = prevCount === 0 ? (recentCount > 0 ? 100 : 0) : ((recentCount - prevCount) / prevCount) * 100;
        setJobsGrowth({
          percentage: Math.abs(Math.round(diff)),
          trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral'
        });
      }

      let query = supabase
        .from('job_posts')
        .select('id, title, location, source_name, source_url, created_at, category, work_topic', { count: 'exact' })
        .eq('is_active', true);

      if (selectedCity && selectedCity !== t('jobs_all_districts', language)) {
        if (selectedCity.toLowerCase() === 'remoto') {
          query = query.or('location.ilike.%remoto%,title.ilike.%remoto%,location.ilike.%remote%,title.ilike.%remote%');
        } else {
          query = query.ilike('location', `%${selectedCity}%`);
        }
      }

      if (selectedWorkTopic && selectedWorkTopic !== 'Todos') {
        query = query.eq('work_topic', selectedWorkTopic);
      }

      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.trim();
        const tokens = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'no', 'na', 'por', 'a', 'o', 'as', 'os']);
        const significant = tokens.filter(w => !stopWords.has(w));

        if (significant.length > 1) {
          // Multi-word search (e.g. "empregado de mesa", "auxiliar de cozinha"): chain significant tokens
          for (const token of significant) {
            query = query.ilike('title', `%${token}%`);
          }
        } else if (significant.length === 1) {
          const single = significant[0];
          // Common cross-language job synonyms
          if (['garçom', 'garcom', 'garçon', 'camarero', 'camarera', 'waiter', 'waitress', 'serveur', 'serveuse'].includes(single)) {
            query = query.or('title.ilike.%mesa%,title.ilike.%bar%,title.ilike.%restaurante%,title.ilike.%garçom%,title.ilike.%garcom%,title.ilike.%camarer%');
          } else if (['faxina', 'diarista', 'limpeza', 'cleaner', 'limpieza', 'ménage'].includes(single)) {
            query = query.or('title.ilike.%limpeza%,title.ilike.%limp%,title.ilike.%clean%,title.ilike.%serviços gerais%');
          } else if (['motorista', 'estafeta', 'driver', 'chofer', 'conductor', 'chauffeur'].includes(single)) {
            query = query.or('title.ilike.%motorista%,title.ilike.%estafeta%,title.ilike.%distribuição%,title.ilike.%transport%,title.ilike.%driver%');
          } else {
            query = query.or(`title.ilike.%${single}%,location.ilike.%${single}%`);
          }
        } else {
          query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%`);
        }
      }

      if (selectedDateRange === '24h') {
        const d = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', d);
      } else if (selectedDateRange === '7d') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', d);
      } else if (selectedDateRange === '30d') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', d);
      } else {
        // Regra Inviolável MIRA: Máximo de 90 dias de antiguidade para qualquer vaga ativa
        query = query.gte('created_at', ninetyDaysAgo);
      }

      if (selectedQuickFilter === 'english') {
        query = query.or('title.ilike.%english%,title.ilike.%inglês%,title.ilike.%ingles%,title.ilike.%speaker%,title.ilike.%bilingual%,title.ilike.%bilingue%,title.ilike.%international%,title.ilike.%internacional%,title.ilike.%developer%,title.ilike.%engineer%,title.ilike.%consultant%');
      } else if (selectedQuickFilter === 'visa') {
        query = query.or('title.ilike.%visto%,title.ilike.%visa%,title.ilike.%relocation%,title.ilike.%repatriamento%,title.ilike.%sponsorship%,title.ilike.%patroc%,title.ilike.%tech visa%,title.ilike.%contrato sem termo%,title.ilike.%contrato de trabalho%');
      } else if (selectedQuickFilter === 'remote') {
        query = query.or('location.ilike.%remoto%,title.ilike.%remoto%,location.ilike.%remote%,title.ilike.%remote%,title.ilike.%teletrabalho%,location.ilike.%teletrabalho%,work_topic.ilike.%remoto%,location.ilike.%híbrido%,location.ilike.%hybrid%');
      } else if (selectedQuickFilter === 'entry') {
        query = query.or('title.ilike.%junior%,title.ilike.%júnior%,title.ilike.%estágio%,title.ilike.%estagio%,title.ilike.%trainee%,title.ilike.%entry%,title.ilike.%inicial%,title.ilike.%aprendiz%,title.ilike.%estagiário%,title.ilike.%estagiaria%,title.ilike.%sem experiência%,title.ilike.%assistente%,title.ilike.%ajudante%,title.ilike.%operador%,title.ilike.%auxiliar%');
      } else if (selectedQuickFilter === 'pcd') {
        query = query.or('title.ilike.%pcd%,title.ilike.%inclusiv%,title.ilike.%inclusão%,title.ilike.%inclusion%,title.ilike.%defici%,title.ilike.%igualdade%,title.ilike.%diversidade%,title.ilike.%acessib%,title.ilike.%(m/f/d)%,title.ilike.%(m/f/x)%,title.ilike.%cota%,title.ilike.%adaptad%');
      } else if (selectedQuickFilter === 'via_verde') {
        query = query.or('title.ilike.%tech visa%,title.ilike.%via verde%,title.ilike.%urgente%,title.ilike.%urgência%,title.ilike.%imediato%,title.ilike.%imediata%,title.ilike.%admissão imediata%,title.ilike.%entrada imediata%,title.ilike.%sponsorship%');
      }

      const from = (currentPage - 1) * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;

      const { data, count, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      setFilteredTotalCount(count !== null ? count : 0);

      const formatted: JobPost[] = (data || [])
        .map(dbJob => {
          const rawTime = (dbJob as any).created_at || (dbJob as any).posted_at;
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
            title: decodeJobText(dbJob.title) || t('jobs_no_title', language),
            location: decodeJobText(dbJob.location) || 'Portugal',
            sourceName: dbJob.source_name || 'MIRA',
            sourceUrl: dbJob.source_url,
            datePosted: displayDate,
            posted_at: rawTime || now.toISOString(),
            tags: Array.isArray((dbJob as any).tags) ? (dbJob as any).tags : (dbJob.title && dbJob.title.toLowerCase().includes('remoto') ? ['Remote'] : []),
            category: normalizeCategory(dbJob.category || 'Trabalho & Carreira'),
            workTopic: normalizeWorkTopic((dbJob as any).work_topic, dbJob.title)
          };
        })
        .filter(job => isPortugalOrRemoteJob(job.title, job.location));

      setJobs(formatted);

      if (formatted.length > 0) {
        const unscanned = formatted.filter(j => !scannedJobIdsRef.current.has(j.id));
        if (unscanned.length > 0) {
          unscanned.forEach(j => scannedJobIdsRef.current.add(j.id));
          setTimeout(() => {
            jobAlertService.processJobMatching(unscanned, user?.id);
          }, 50);
        }
      }
    } catch (err: any) {
      console.error('MIRA JobBoard error:', err);
      setError(err?.message || 'Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [debouncedSearchQuery, selectedCity, selectedWorkTopic, selectedDateRange, selectedQuickFilter, currentPage]);

  const totalEffectiveCount = filteredTotalCount !== null ? filteredTotalCount : (totalPlatformJobs || 0);
  const totalPages = Math.max(1, Math.ceil(totalEffectiveCount / JOBS_PER_PAGE));
  const paginatedJobs = jobs;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (jobListTopRef.current) {
      jobListTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity(t('jobs_all_districts', language));
    setSelectedWorkTopic('Todos');
    setSelectedDateRange('all');
    setSelectedQuickFilter(null);
    setCurrentPage(1);
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900 font-sans">
      {/* Header Sticky Section - SLIM & RESPONSIVE */}
      <div className="bg-white/95 backdrop-blur-xl px-4 sm:px-6 pt-4 pb-3 space-y-3 z-30 border-b border-slate-200/80 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h2 className="text-base xs:text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 leading-tight break-words">
              {t('jobs_title', language)}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-mira-orange animate-pulse shadow-[0_0_10px_#FF8C00] shrink-0" />
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">{t('jobs_subtitle', language)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-2 sm:p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl sm:rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-red-100 shrink-0"
              >
                <X size={15} /> <span className="hidden sm:inline">{t('jobs_reset_filters_btn', language)}</span>
              </button>
            )}
            <button
              onClick={() => fetchJobs(true)}
              disabled={loading}
              title={language === 'en' ? 'Refresh Job Offers' : 'Atualizar Vagas em Tempo Real'}
              className="p-2 sm:p-3 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl sm:rounded-2xl transition-all border border-slate-200 shrink-0"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tab Switcher - LIGHT/DARK DYNAMIC STYLING */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl w-full border border-slate-200/80 shadow-inner relative overflow-hidden">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'jobs' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Briefcase size={14} className={activeTab === 'jobs' ? 'animate-mira-blink-modern' : ''} /> {t('nav_vagas', language)}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'trends' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Activity size={14} className={activeTab === 'trends' ? 'animate-mira-blink-modern' : ''} /> {t('jobs_insight_title', language)}
          </button>
        </div>
      </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:brightness-110 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 border border-emerald-400/40 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            <Bell size={18} className="animate-bounce text-white shrink-0 drop-shadow" />
            <span className="drop-shadow-sm font-black text-white">
              {language === 'EN' ? 'Create Job Alert' :
               language === 'ES' ? 'Crear Alerta de Empleo' :
               language === 'FR' ? 'Créer une Alerte d\'Emploi' :
               'Criar Alerta de Vagas'}
            </span>
            {activeAlertsCount > 0 && (
              <span className="bg-white text-emerald-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-white/40 shadow-sm ml-1">
                {activeAlertsCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {
              analytics.track('europass_click', 'u1');
              window.open('https://europa.eu/europass/eportfolio/screen/cv-editor/legacy-cv-editor?lang=pt', '_blank');
            }}
            className="w-full bg-[#003399] text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:bg-[#001F3F] transition-all active:scale-95"
          >
            <FileText size={18} /> {t('jobs_create_cv', language)}
          </button>
        </div>

        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 📊 SOBERANIA MIRA: Metrics Dashboard (Market & Platform Analytics) */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-[2rem] border border-slate-100/50 shadow-inner">
              {/* Metric 1: Total Active Jobs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={10} className="text-sky-500" /> {t('jobs_active_title', language)}</span>
                {totalPlatformJobs !== null ? (
                  <span className="text-xl font-black font-mono text-slate-800 tracking-tighter mt-1">+{totalPlatformJobs.toLocaleString('pt-PT')}</span>
                ) : (
                  <span className="text-xl font-black font-mono text-slate-400 tracking-tighter mt-1 animate-pulse">••••</span>
                )}
              </div>
              
              {/* Metric 2: Average Estimated Salary */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp size={10} className="text-emerald-500" /> {t('jobs_avg_salary_title', language)}</span>
                <span className="text-xl font-black font-mono text-slate-800 tracking-tighter mt-1">{overallAvgSalary}€</span>
              </div>
            </div>

            {/* Search Bar - TOUCH ISOLATED & INTUITIVE */}
            <div className="relative z-10 block w-full touch-manipulation">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                  <Search className="text-slate-400 group-focus-within:text-mira-orange transition-colors duration-300" size={20} />
                </div>
                <input
                  type="text"
                  placeholder={t('jobs_search_placeholder', language)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-12 py-3.5 sm:py-4 bg-white border border-slate-200 hover:border-slate-300 rounded-[1.5rem] text-sm font-bold text-slate-800 focus:bg-white focus:border-mira-orange focus:ring-4 focus:ring-mira-orange/10 outline-none transition-all shadow-sm placeholder-slate-400 touch-manipulation select-text cursor-text relative z-10"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    aria-label="Limpar pesquisa"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors z-20 p-2 touch-manipulation cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters for Foreigners & Expats - 6 Quick Filter Pills in Single Unified Group */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5 w-full relative z-0">
              {[
                { id: 'english', label: t('jobs_quick_english', language), color: 'border-blue-200 text-blue-600 bg-blue-50/70 hover:bg-blue-100' },
                { id: 'visa', label: t('jobs_quick_visa', language), color: 'border-amber-200 text-amber-700 bg-amber-50/70 hover:bg-amber-100' },
                { id: 'remote', label: t('jobs_quick_remote', language), color: 'border-teal-200 text-teal-600 bg-teal-50/70 hover:bg-teal-100' },
                { id: 'entry', label: t('jobs_quick_entry', language), color: 'border-purple-200 text-purple-600 bg-purple-50/70 hover:bg-purple-100' },
                { id: 'pcd', label: t('jobs_quick_pcd', language) || '♿ Vagas PCD', color: 'border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100' },
                { id: 'via_verde', label: t('jobs_quick_via_verde', language) || '🚦 Via Verde', color: 'border-emerald-200 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100' },
              ].map(pill => {
                const isActive = selectedQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSelectedQuickFilter(isActive ? null : pill.id)}
                    className={`w-full py-3 px-2 sm:px-3 border rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-sm touch-manipulation cursor-pointer ${
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

            {/* Expat Job Seeker Visa & Relocation Guide - Direct Navigation to Legalization Module */}
            <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('jobs_insight_title', language)}
                    </h4>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug truncate">
                      {t('jobs_visa_guide_title', language)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal">
                      {t('jobs_visa_guide_sub', language)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onViewChange) {
                      onViewChange(ViewType.DOCUMENTS, { tab: 'regularize' });
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0 text-center flex items-center justify-center gap-2 shadow-sm shadow-slate-900/10 cursor-pointer touch-manipulation"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  {t('jobs_visa_guide_btn_read', language)}
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* PCD & Inclusive Employment Rights Banner (Visible when PCD quick filter is active) */}
            {selectedQuickFilter === 'pcd' && (
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-[2rem] p-5 shadow-sm space-y-2 animate-in slide-in-from-top-2 duration-300">
                <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 font-mono">
                  ♿ {language === 'EN' ? 'Disability & Inclusive Employment Rights (Portugal)' :
                      language === 'ES' ? 'Derechos y Empleo Inclusivo PCD (Portugal)' :
                      language === 'FR' ? 'Droits et Emploi Inclusif Handicap (Portugal)' :
                      'Direitos & Apoio ao Emprego Inclusivo PCD (Portugal)'}
                </h4>
                <p className="text-[11px] text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                  {language === 'EN'
                    ? '• Employment Quotas (Law 4/2019): Companies with 75+ workers must reserve 1% to 2% of jobs for people with disability (degree ≥ 60%).\n• Multipurpose Medical Certificate (AMIM): Official proof of disability issued by Health Centers/ULS Medical Boards.\n• IEFP Support: Professional rehabilitation, workplace adaptation subsidies, and assistive technology.\n• Social Security (PSI): Social Benefit for Inclusion available for individuals with verified disability.'
                    : language === 'ES'
                    ? '• Cuotas de Empleo (Ley 4/2019): Empresas de más de 75 empleados deben reservar del 1% al 2% de puestos para personas con discapacidad (grado ≥ 60%).\n• Certificado Médico Multiusos (AMIM): Acreditación oficial emitida por Juntas Médicas de Centros de Salud.\n• Apoyos del IEFP: Adaptación del puesto de trabajo y subsidios de rehabilitación profesional.\n• Seguridad Social (PSI): Prestación Social para la Inclusión para situaciones de vulnerabilidad.'
                    : language === 'FR'
                    ? '• Quotas d\'emploi (Loi 4/2019) : Les entreprises de plus de 75 salariés doivent réserver 1% à 2% des postes aux personnes handicapées (≥ 60%).\n• Certificat Médical Multiusage (AMIM) : Délivré par les commissions médicales des centres de santé.\n• Aides de l\'IEFP : Adaptation du poste de travail et réhabilitation professionnelle.\n• Sécurité Sociale (PSI) : Prestation Sociale pour l\'Inclusion pour les personnes en situation de vulnérabilité.'
                    : '• Quotas Legais (Lei n.º 4/2019): Empresas com 75+ trabalhadores devem admitir 1% a 2% de trabalhadores com deficiência (grau ≥ 60%).\n• Atestado Médico de Incapacidade Multiuso (AMIM): Documento oficial emitido pelas Juntas Médicas dos Centros de Saúde/ULS.\n• Apoios do IEFP: Financiamento de adaptação do posto de trabalho, teletrabalho e bolsas de reabilitação profissional.\n• Segurança Social (PSI): Prestação Social para a Inclusão para apoio financeiro a cidadãos com incapacidade.'}
                </p>
              </div>
            )}

            {/* Advanced Filters Grid ( responsive 2-column grid with Area and Location dropdowns ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
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
                    <option value="Todos">🌐 {t('jobs_all_areas', language)} ({totalPlatformJobs !== null ? totalPlatformJobs.toLocaleString('pt-PT') : '••••'})</option>
                    {scrollerTopics.map(topic => {
                      const details = TOPIC_DETAILS[topic] || TOPIC_DETAILS["Outros"];
                      const count = topicCounts[topic];
                      return (
                        <option key={topic} value={topic}>
                          {details?.emoji || "💼"} {t(getWorkTopicKey(topic), language)} ({typeof count === 'number' ? count.toLocaleString('pt-PT') : '•'})
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

      <div className="px-6 space-y-6 pb-10 mt-4">
        {loading && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
              <Briefcase size={40} />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{t('jobs_loading', language)}</p>
              <p className="text-xs font-bold text-slate-400">{t('jobs_loading_desc', language)}</p>
            </div>
          </div>
        ) : error && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-4 bg-red-50 text-red-500 rounded-3xl"><AlertCircle size={32} /></div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchJobs(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">{t('jobs_btn_try_again', language)}</button>
          </div>
        ) : activeTab === 'jobs' ? (
          paginatedJobs.length > 0 ? (
            <div className="space-y-5">
              <div ref={jobListTopRef} className="scroll-mt-6" />

              {/* 📊 Responsive Results Counter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 border border-slate-200/70 px-4 sm:px-5 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'EN'
                      ? `Showing ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} of ${totalEffectiveCount.toLocaleString()} jobs`
                      : language === 'ES'
                      ? `Mostrando ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} de ${totalEffectiveCount.toLocaleString()} ofertas`
                      : language === 'FR'
                      ? `Affichage de ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} sur ${totalEffectiveCount.toLocaleString()} offres`
                      : `A mostrar ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} de ${totalEffectiveCount.toLocaleString('pt-PT')} vagas`}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest self-end sm:self-auto">
                  {language === 'EN' ? `Page ${currentPage} of ${totalPages}` : language === 'ES' ? `Pág. ${currentPage} de ${totalPages}` : language === 'FR' ? `Page ${currentPage} sur ${totalPages}` : `Página ${currentPage} de ${totalPages}`}
                </span>
              </div>

              {/* 📋 Paginated Jobs Grid */}
              <div className="grid grid-cols-1 gap-5">
                {paginatedJobs.map(job => (
                  <JobItem key={job.id} job={job} language={language} />
                ))}
              </div>

              {/* 📱 Mobile & Desktop Sovereign Responsive Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-slate-100">
                  {/* Mobile Quick Page Selector */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs font-bold text-slate-500">
                    <span>
                      {language === 'EN' ? 'Jump to page:' : language === 'ES' ? 'Ir a la página:' : language === 'FR' ? 'Aller à la page :' : 'Ir para página:'}
                    </span>
                    <select
                      value={currentPage}
                      onChange={(e) => handlePageChange(Number(e.target.value))}
                      aria-label="Selecionar página"
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-mira-orange/30 cursor-pointer"
                    >
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p}>
                          {p} / {totalPages}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Navigation Buttons (Touch Optimized) */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-label="Página anterior"
                      className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 touch-manipulation"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">{language === 'EN' ? 'Prev' : language === 'ES' ? 'Ant.' : language === 'FR' ? 'Préc.' : 'Anterior'}</span>
                    </button>

                    {/* Numeric buttons on desktop/tablet */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`ellipsis-${idx}`} className="w-7 sm:w-8 text-center text-slate-400 font-black text-xs">
                              …
                            </span>
                          );
                        }
                        const isActive = p === currentPage;
                        return (
                          <button
                            key={`page-${p}`}
                            type="button"
                            onClick={() => handlePageChange(Number(p))}
                            className={`h-9 min-w-[34px] sm:min-w-[38px] px-2 rounded-xl text-xs font-black transition-all active:scale-95 touch-manipulation ${
                              isActive
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-label="Página seguinte"
                      className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 touch-manipulation"
                    >
                      <span className="hidden sm:inline">{language === 'EN' ? 'Next' : language === 'ES' ? 'Sig.' : language === 'FR' ? 'Suiv.' : 'Seguinte'}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
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
                    {totalPlatformJobs !== null ? (
                      <span className="text-xl font-black font-mono text-slate-800 leading-none tracking-tighter">+{totalPlatformJobs.toLocaleString('pt-PT')}</span>
                    ) : (
                      <span className="text-xl font-black font-mono text-slate-400 leading-none tracking-tighter animate-pulse">••••</span>
                    )}
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

      <JobAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        language={language}
        user={user}
        onAlertsChanged={refreshAlertsCount}
      />
    </div>
  );
};
