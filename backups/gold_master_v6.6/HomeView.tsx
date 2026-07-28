import React, { useMemo, useState, memo } from 'react';
import { ViewType, User as UserType, Post, NotificationPreferences } from '../types';
import { 
  Briefcase, MapPin, FileText,
  Bell, Bot, 
  Heart, BookOpen, User, CheckCircle2, MessageSquare, Sparkles, ArrowRight, BellRing, X, ToggleLeft, ToggleRight, AlertTriangle, Activity, Scale, Newspaper, ShieldQuestion, Shield, Lock, LogOut, MessageCircle, ChevronRight, Loader2, Send, GraduationCap
} from 'lucide-react';
import { HandsHeartIcon } from './HandsHeartIcon';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { COLORS, MIRA_LOGO } from '../constants';
import { getImageUrl } from '../utils/imageUtils';


interface HomeViewProps {
  user: UserType;
  onViewChange: (view: ViewType) => void;
  language: string;
  onLogout: () => void;
  masterPosts: Post[];
}

// getMockPosts removed as Stories/Highlights are only for Community section

import { useToast } from './Toast';

export const HomeView: React.FC<HomeViewProps> = memo(({ user, onViewChange, language, onLogout, masterPosts }) => {
  const { showToast } = useToast();
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    OFFICIAL_AIMA: true,
    LEGAL_CHANGES: true,
    JOB_MATCHES: true,
    COMMUNITY_REPUTATION: true,
    MAP_URGENCY: true,
    MIRA_INSIGHTS: true,
    SOCIAL_CONNECT: true,
    MIRA_ARTICLE: true,
    COMMUNITY_REPLY: true,
    COMMUNITY_FOLLOW_UP: true,
    DOC_EXPIRATION: true
  });

  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionData, setSuggestionData] = useState({ subject: 'Sugestão Geral', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuggestionSubmit = async () => {
    if (!suggestionData.message || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
        const { submitSuggestion } = await import('../services/reportService');
        
        // V2026: 10s Timeout to prevent persistent terminal/UI hangs
        await Promise.race([
            submitSuggestion({
                subject: suggestionData.subject,
                content: suggestionData.message,
                email: user.email
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 25000))
        ]);
        
        showToast(t('toast_form_success', language), "success");
        setShowSuggestionModal(false);
        setSuggestionData({ subject: 'Sugestão Geral', message: '' });
    } catch (e: any) {
        console.error('Suggestion Error:', e);
        const isTimeout = e.message === 'Timeout';
        showToast(isTimeout ? t('timeout_error', language) : t('toast_form_error', language), "error");
    } finally {
        setIsSubmitting(false);
    }
  };


  const quickAccess = [
    { id: ViewType.COMMUNITY, label: t('nav_community', language), icon: HandsHeartIcon, color: 'bg-orange-100 text-orange-700' },
    { id: ViewType.PROFILE, label: t('nav_profile', language), icon: User, color: 'bg-slate-200 text-slate-900' },
    { id: ViewType.ASSISTANT, label: t('home_chat_mira', language), icon: Bot, color: 'bg-blue-100 text-blue-700' },
    { id: ViewType.DOCUMENTS, label: t('nav_docs', language), icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
    { id: ViewType.LEARNING, label: t('nav_learning', language), icon: GraduationCap, color: 'bg-amber-100 text-amber-700' },
    { id: ViewType.JOBS, label: t('nav_vagas', language), icon: Briefcase, color: 'bg-emerald-100 text-emerald-700' },
    { id: ViewType.MAP, label: t('nav_map', language), icon: MapPin, color: 'bg-rose-100 text-rose-700' },
    { id: ViewType.PRIVACY, label: t('nav_privacy', language), icon: Shield, color: 'bg-indigo-200 text-indigo-900' },
  ];

    // Stories and Community Highlights removed from Home as per CEO instructions

  const toggleNotif = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-transparent min-h-screen pb-20 animate-fade-in px-4 md:px-0 relative font-['Plus_Jakarta_Sans']">
      
      {/* Notif Modal - Light Theme */}
      {showNotifSettings && (
        <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tighter">{t('notificacoes', language)}</h3>
              <button onClick={() => setShowNotifSettings(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                {['OFFICIAL_AIMA', 'LEGAL_CHANGES', 'JOB_MATCHES', 'COMMUNITY_REPUTATION', 'MAP_URGENCY', 'MIRA_INSIGHTS', 'SOCIAL_CONNECT', 'MIRA_ARTICLE', 'COMMUNITY_REPLY', 'COMMUNITY_FOLLOW_UP'].map(id => (
                    <div key={id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-xs font-extrabold text-slate-700 uppercase">{t(`notif_${id.toLowerCase()}`, language)}</span>
                        <button onClick={() => toggleNotif(id as any)} className={(prefs as any)[id] ? 'text-mira-orange' : 'text-slate-300'}>
                             {(prefs as any)[id] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        </button>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero - Premium Design */}
      <div className="flex items-center gap-5 mb-10 p-1 group pt-8 md:pt-12">
        <div 
          onClick={() => onViewChange(ViewType.PROFILE)}
          className="relative cursor-pointer"
        >
          <div className="absolute inset-0 bg-mira-orange blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white hover:scale-105 active:scale-95 transition-all duration-500 p-[2px] bg-gradient-to-tr from-[#f97316] via-[#facc15] to-[#3b82f6]">
            <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-white">
                <img src={getImageUrl(user.avatar, 400)} alt={user.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-mira-orange rounded-full border-4 border-white shadow-xl flex items-center justify-center">
              <Sparkles size={14} className="text-white fill-white" />
          </div>
        </div>
        <div className="flex-1">
          <p className="mira-module-subtitle">{t('home_welcome_back', language)}</p>
          <h1 className="mira-module-title !text-[#0f172a] drop-shadow-sm">{user.name}</h1>
        </div>
      </div>


      {/* AI Banner - Light Theme */}
      <div onClick={() => onViewChange(ViewType.ASSISTANT)} className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-all group mb-12 z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[8px] font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={10} className="text-mira-orange fill-mira-orange" />
                    {t('home_ai_badge', language)}
                </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-normal leading-none uppercase">{t('home_ai_question', language)}</h2>
            <p className="text-sm text-slate-400 font-medium max-w-md">{t('home_ai_desc', language)}</p>
          </div>
          <div className="bg-mira-orange text-white px-8 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all">
              {t('home_chat_btn', language)} <ArrowRight size={16} strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Grid - High Contrast (V2026: Strict 2 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-8 mb-16 px-1">
          {quickAccess.map((item) => (
            <button 
              key={item.id} 
              onClick={() => {
                  analytics.track('home_module_click', user.id, 'HomeView', { moduleId: item.id });
                  onViewChange(item.id);
              }} 
              className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border-2 border-slate-100 hover:shadow-[0_40px_80px_-20px_rgba(249,115,22,0.15)] hover:border-mira-orange transition-all text-center group active:scale-[0.98] flex flex-col items-center justify-center relative overflow-hidden min-h-[160px] md:min-h-[280px]"
            >
              {/* High-End interactive pulse background */}
              <div className="absolute inset-0 bg-gradient-to-br from-mira-orange/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2.2rem] md:rounded-[3rem] flex items-center justify-center mb-6 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 shadow-2xl relative z-10 ${item.color} group-hover:shadow-mira-orange/20`}>
                  <item.icon size={36} className="text-white drop-shadow-md" strokeWidth={2.5} />
                  
                  {/* Internal halo effect */}
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 animate-ping duration-1000" />
              </div>
              
              <div className="space-y-2 relative z-10">
                <p className="font-black text-slate-900 text-sm md:text-lg tracking-tight uppercase leading-none px-1">{item.label}</p>
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-[9px] font-extrabold text-mira-orange tracking-[0.2em] uppercase">Aceder ao Módulo</span>
                    <ChevronRight size={12} className="text-mira-orange" />
                </div>
              </div>
            </button>
          ))}
      </div>


      {/* Suggestion - Reduced Size */}
      <button
        onClick={() => setShowSuggestionModal(true)}
        className="w-full relative overflow-hidden bg-gradient-to-br from-mira-orange to-[#FF8C00] p-6 rounded-[2rem] flex flex-row items-center justify-center gap-4 hover:brightness-110 transition-all group shadow-[0_20px_40px_-10px_rgba(249,115,22,0.3)] active:scale-[0.98] border-none"
      >
        <div className="absolute top-0 right-0 p-4 text-white/10 group-hover:scale-110 transition-transform">
          <Sparkles size={60} />
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-xl shrink-0">
           <Sparkles size={20} className="text-white fill-white" />
        </div>
        <div className="text-left relative z-10">
           <span className="font-extrabold text-white uppercase tracking-[0.2em] text-[11px] block leading-none">{t('home_suggest_title', language)}</span>
           <span className="font-bold text-white/70 uppercase tracking-[0.1em] text-[8px]">{t('home_suggest_desc', language)}</span>
        </div>
      </button>

      {/* Modal Suggestion */}
      {showSuggestionModal && (
          <div className="fixed inset-0 z-[5000] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tighter mb-6">{t('home_suggest_modal_title', language)}</h3>
                  <textarea 
                    value={suggestionData.message}
                    onChange={e => setSuggestionData({...suggestionData, message: e.target.value})}
                    placeholder={t('home_suggest_placeholder', language)}
                    className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-mira-orange text-sm font-bold mb-4 resize-none"
                   />
                  <button 
                    onClick={handleSuggestionSubmit} 
                    disabled={isSubmitting}
                    className="w-full bg-mira-orange text-white py-5 rounded-2xl font-extrabold uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {isSubmitting ? t('home_sending', language) : t('home_suggest_submit', language)}
                  </button>
                  <button onClick={() => setShowSuggestionModal(false)} className="w-full mt-2 text-slate-400 font-extrabold uppercase text-[10px] py-2">{t('btn_cancel', language)}</button>
              </div>
          </div>
      )}
    </div>
  );
});
