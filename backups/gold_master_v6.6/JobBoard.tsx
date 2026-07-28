
import React, { useState, useEffect } from 'react';
import { JobPost, WORK_TOPICS, CATEGORIES, ViewType } from '../types';
import { Search, Briefcase, ExternalLink, MapPin, Building2, TrendingUp, ChevronDown, Filter, X, SlidersHorizontal, Map as MapIcon, Globe, FileText, RefreshCcw, AlertTriangle, Volume2, AlertCircle, Activity, CheckCircle2 } from 'lucide-react';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { t } from '../utils/translations';
import { PROTECTED_JOBS } from '../utils/protectedData';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeCategory } from '../utils/categoryUtils';
import JobItem from './JobItem';

interface JobBoardProps {
  language: string;
  isAdmin?: boolean;
  onViewChange?: (view: ViewType, params?: any) => void;
  initialTab?: 'jobs' | 'trends';
}

const JOB_TRENDS = (lang: string) => [
  { id: 1, name: t('jobs_trend_turismo', lang), demandLevel: t('jobs_demand_vhigh', lang), averageSalary: '850 - 1.200', growth: '+15%' },
  { id: 2, name: t('jobs_trend_tech', lang), demandLevel: t('jobs_demand_high', lang), averageSalary: '1.200 - 3.500', growth: '+22%' },
  { id: 3, name: t('jobs_trend_const', lang), demandLevel: t('jobs_demand_vhigh', lang), averageSalary: '900 - 1.500', growth: '+10%' },
  { id: 4, name: t('jobs_trend_energy', lang), demandLevel: t('jobs_demand_med', lang), averageSalary: '1.100 - 2.000', growth: '+30%' },
  { id: 5, name: t('jobs_trend_health', lang), demandLevel: t('jobs_demand_high', lang), averageSalary: '1.000 - 1.800', growth: '+12%' },
];

const LOCATIONS = (lang: string) => [
  t('jobs_all_districts', lang), "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];



export const JobBoard: React.FC<JobBoardProps> = ({ language, isAdmin, onViewChange, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'trends'>(initialTab || 'jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedWorkTopic, setSelectedWorkTopic] = useState('Todos');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleJobsCount, setVisibleJobsCount] = useState(20); // Pagination state
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const fetchJobs = async () => {
    setError(null);
    setLoading(true);

    // Show cached data immediately (but validate it first)
    const cached = localStorage.getItem('mira_jobs_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Only use cache if it has real DB jobs (not just protected ones)
        if (Array.isArray(parsed) && parsed.length > 2) {
          setJobs(parsed);
          setLoading(false);
        } else {
          // Cache is stale/nearly empty, clear it
          localStorage.removeItem('mira_jobs_cache');
        }
      } catch (e) {
        localStorage.removeItem('mira_jobs_cache');
      }
    }

    try {
      const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, location, source_name, source_url, date_posted, tags, category, work_topic, created_at')
        .order('created_at', { ascending: false })
        .limit(100); // MIRA V2026.ELITE: Otimizado para 100 vagas/fetch


      let formattedJobs: JobPost[] = [];
      if (data && data.length > 0) {
        formattedJobs = data.map(dbJob => ({
          id: dbJob.id,
          title: dbJob.title || t('jobs_no_title', language),
          location: dbJob.location || 'Portugal',
          sourceName: dbJob.source_name || 'MIRA',
          sourceUrl: (dbJob.source_name?.toLowerCase().includes('glassdoor') || dbJob.source_url?.toLowerCase().includes('glassdoor')) ? 'https://www.glassdoor.com' : (dbJob.source_url || '#'),
          datePosted: dbJob.date_posted || t('jobs_today', language),
          tags: Array.isArray(dbJob.tags) ? dbJob.tags : [],
          category: normalizeCategory(dbJob.category || 'Trabalho & Carreira'),
          workTopic: dbJob.work_topic || 'Outros'
        }));
      }

      // Always include protected jobs
      const finalJobs = [...formattedJobs];
      PROTECTED_JOBS.forEach(pj => {
        if (!finalJobs.some(j => j.id === pj.id)) {
          finalJobs.push(pj);
        }
      });

      setJobs(finalJobs);
      localStorage.setItem('mira_jobs_cache', JSON.stringify(finalJobs));

    } catch (err: any) {
      console.error('MIRA JobBoard fetch error:', err);
      // Fallback: merge existing state with protected jobs
      setJobs(prev => {
        const base = prev.length > 0 ? [...prev] : [];
        PROTECTED_JOBS.forEach(pj => {
          if (!base.some(j => j.id === pj.id)) base.push(pj);
        });
        return base;
      });
      if (jobs.length === 0) setError(t('job_connection_error', language));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery.trim() ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'Todos' || 
      t('jobs_all_districts', language) === selectedCity ||
      (job.location || '').toLowerCase().includes(selectedCity.toLowerCase());
    
    // V2026.FIX: More robust workTopic matching
    const currentTopic = (job.workTopic || 'Outros').toLowerCase();
    const targetTopic = selectedWorkTopic === 'Todos' ? 'todos' : selectedWorkTopic.toLowerCase();
    
    // Split targets by comma/& to match better
    const targetKeywords = targetTopic.split(/[|,&]/).map(k => k.trim()).filter(k => k.length > 2);
    
    const matchesTopic = targetTopic === 'todos' || 
                         targetKeywords.some(kw => currentTopic.includes(kw)) ||
                         currentTopic.includes(targetTopic);

    return matchesSearch && matchesCity && matchesTopic;
  });

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
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900">
      {/* Header Sticky Section - IMPERIAL */}
      <div className="bg-white/90 backdrop-blur-2xl px-6 pt-8 pb-4 space-y-6 z-30 border-b border-slate-100 sticky top-0 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{t('jobs_title', language)}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] animate-pulse shadow-[0_0_10px_#FF8C00]"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] !mb-0">{t('jobs_subtitle', language)}</p>
            </div>
          </div>
          <button
            onClick={() => fetchJobs()}
            disabled={loading}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:rotate-180 duration-500 w-full sm:w-auto flex justify-center shrink-0 border border-slate-100"
            title={t('job_sync_button', language)}
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl w-full sm:w-auto overflow-hidden border border-slate-100">
          <button
              onClick={() => {
                setActiveTab('jobs');
                if (onViewChange) onViewChange(ViewType.JOBS, { tab: 'jobs' });
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-8 py-3.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'jobs' ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-transparent text-slate-400 hover:text-slate-900'}`}
          >
            <Briefcase size={14} />
            <span className="whitespace-nowrap">{t('nav_vagas', language)}</span>
          </button>
          <button
              onClick={() => {
                setActiveTab('trends');
                if (onViewChange) onViewChange(ViewType.JOBS, { tab: 'trends' });
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-8 py-3.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${activeTab === 'trends' ? 'bg-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-transparent text-slate-400 hover:text-slate-900'}`}
          >
            <Activity size={14} />
            <span className="whitespace-nowrap">{t('jobs_insight_title', language)}</span>
          </button>
        </div>
        </div>

        <button
          onClick={() => {
            analytics.track('europass_click', 'u1');
            window.open('https://europa.eu/europass/eportfolio/screen/cv-editor/legacy-cv-editor?lang=pt', '_blank');
          }}
          className="w-full bg-mira-blue text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:bg-[#001F3F] transition-all active:scale-95"
        >
          <FileText size={18} /> {t('jobs_create_cv', language)}
        </button>

        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF8C00] transition-colors" size={20} />
              <input
                type="text"
                placeholder={t('jobs_search_placeholder', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-[#FF8C00] outline-none transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('jobs_label_loc', language)}</label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-[#FF8C00]/20 border border-slate-100 text-slate-700 transition-all font-bold"
                  >
                    {LOCATIONS(language).map(city => (
                      <option key={city} value={city} className="bg-white">{city}</option>
                    ))}
                  </select>
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                </div>
              </div>

              <div className="relative space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('jobs_label_domain', language)}</label>
                <div className="relative">
                  <select
                    value={selectedWorkTopic}
                    onChange={(e) => setSelectedWorkTopic(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-[#FF8C00]/20 border border-slate-100 text-slate-700 transition-all font-bold"
                  >
                    <option value="Todos" className="bg-white">{t('jobs_all_areas', language)}</option>
                    {WORK_TOPICS.map(topic => (
                      <option key={topic} value={topic} className="bg-white">{topic}</option>
                    ))}
                  </select>
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={14} />
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
            <button onClick={() => fetchJobs()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Tentar Novamente</button>
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
          <div className="space-y-6">
            <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-mira-blue/10 rounded-full blur-[80px]"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-mira-orange/10 rounded-full blur-[80px]"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp size={24} className="text-mira-yellow shrink-0" />
                  <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.4em] text-white/60 truncate">{t('jobs_insight_title', language)}</h4>
                </div>
                <p className="text-lg sm:text-xl font-black tracking-tight leading-tight mb-4 min-w-0 break-words text-white">
                  {t('jobs_growth_desc', language)}
                </p>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  <div className="bg-white/5 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10">
                    <p className="text-[7px] sm:text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1">{t('jobs_avg_salary', language)}</p>
                    <p className="text-sm sm:text-md font-black text-white">1.450€</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10">
                    <p className="text-[7px] sm:text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5 sm:mb-1">{t('jobs_active_offers', language)}</p>
                    <p className="text-sm sm:text-md font-black text-white">+4.200</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {JOB_TRENDS(language).map(trend => (
                <div 
                  key={trend.id} 
                  className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col sm:flex-row sm:items-center justify-between group hover:bg-slate-50 transition-all border border-mira-blue/20 shadow-sm gap-4"
                >
                  <div className="min-w-0 flex-1">
                        <h4 className="font-black text-slate-900 text-sm sm:text-lg tracking-tight uppercase truncate mb-1 sm:mb-0">{trend.name}</h4>
                        <div className="flex flex-row items-center gap-x-6 gap-y-1">
                          <div className="flex flex-col">
                            <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{t('jobs_avg_salary', language)}</span>
                            <span className="text-[10px] sm:text-xs font-black text-slate-700 leading-none">{trend.averageSalary}€</span>
                          </div>
                      <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>
                      <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{t('jobs_growth', language)}</span>
                        <span className="text-[10px] sm:text-xs font-black text-mira-orange leading-none">{trend.growth}</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0 flex justify-start sm:justify-end">
                    <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap ${trend.demandLevel.includes('Alta') || trend.demandLevel.includes('High') || trend.demandLevel.includes('Élevée') ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-[#FF8C00]'}`}>
                      {trend.demandLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
