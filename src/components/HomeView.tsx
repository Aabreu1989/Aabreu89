import React, { useMemo, useState, memo, useEffect } from 'react';
import { ViewType, User as UserType, Post, NotificationPreferences } from '../types';
import { 
  Briefcase, MapPin, FileText,
  Bell, Bot, 
  Heart, BookOpen, User, CheckCircle2, MessageSquare, Sparkles, ArrowRight, BellRing, X, ToggleLeft, ToggleRight, AlertTriangle, Activity, Scale, Newspaper, ShieldQuestion, Shield, Lock, LogOut, MessageCircle, ChevronRight, Loader2, Send, GraduationCap, Instagram,
  Smartphone, Download, Home, Calculator
} from 'lucide-react';
import { HandsHeartIcon } from './HandsHeartIcon';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { COLORS, MIRA_LOGO } from '../constants';
import { getImageUrl } from '../utils/imageUtils';
import { pwaService } from '../utils/pwa';


interface HomeViewProps {
  user: UserType;
  onViewChange: (view: ViewType, params?: any) => void;
  language: string;
  onLogout: () => void;
  masterPosts: Post[];
}

// getMockPosts removed as Stories/Highlights are only for Community section

import { useToast } from './Toast';
import { SuggestionModal } from './SuggestionModal';

export const HomeView: React.FC<HomeViewProps> = memo(({ user, onViewChange, language, onLogout, masterPosts }) => {
  const { showToast } = useToast();
  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [isInstallable, setIsInstallable] = useState(pwaService.isInstallable());
  const [showSafariGuide, setShowSafariGuide] = useState(false);

  useEffect(() => {
    const handleInstallable = () => setIsInstallable(true);
    window.addEventListener('mira-pwa-installable', handleInstallable);
    return () => window.removeEventListener('mira-pwa-installable', handleInstallable);
  }, []);

  const handleInstallApp = async () => {
    if (pwaService.isInstallable()) {
      const outcome = await pwaService.triggerInstall();
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
    } else if (pwaService.isIOS()) {
      setShowSafariGuide(true);
    } else {
      if (isMobile) {
        showToast("Para instalar o atalho no telemóvel, aceda ao menu do seu navegador e selecione 'Adicionar ao ecrã principal'.", "info");
      } else {
        showToast("Para instalar o atalho no computador, aceda ao menu do seu navegador e selecione 'Instalar MIRA' ou 'Adicionar'.", "info");
      }
    }
  };
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


  const quickAccess = [
    { id: ViewType.COMMUNITY, label: t('nav_community', language), icon: HandsHeartIcon, color: 'bg-orange-100 text-orange-700' },
    { id: ViewType.PROFILE, label: t('nav_profile', language), icon: User, color: 'bg-slate-200 text-slate-900' },
    { id: ViewType.ASSISTANT, label: t('home_chat_mira', language), icon: Bot, color: 'bg-blue-100 text-blue-700' },
    { id: ViewType.DOCUMENTS, label: t('nav_docs', language), icon: FileText, color: 'bg-indigo-100 text-indigo-700' },
    { id: ViewType.LEARNING, label: t('nav_learning', language), icon: GraduationCap, color: 'bg-amber-100 text-amber-700' },
    { id: ViewType.JOBS, label: t('nav_vagas', language), icon: Briefcase, color: 'bg-emerald-100 text-emerald-700' },
    { id: ViewType.MAP, label: t('nav_map', language), icon: MapPin, color: 'bg-rose-100 text-rose-700' },
    { id: ViewType.SIMULATORS, label: t('nav_simulators', language), icon: Calculator, color: 'bg-indigo-100 text-indigo-700' },
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
      <div className="flex items-center gap-5 mb-8 p-1 group pt-8 md:pt-12">
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

      {/* PWA Install Banner */}
      {(isInstallable || pwaService.isIOS()) && !pwaService.isStandalone() && (
        <div className="w-full flex justify-center mb-8">
          <button 
            onClick={handleInstallApp}
            className="w-full max-w-[280px] text-white rounded-2xl p-4 flex items-center justify-between group hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.98] animate-in slide-in-from-top-4 border-0 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF5E00 100%)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-12 -mt-12 transition-transform group-hover:scale-110 pointer-events-none"></div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 bg-white text-mira-orange rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md shrink-0">
                <Smartphone size={18} className="animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/95 leading-none">
                  {language === 'PT' ? 'MIRA NO TELEMÓVEL OU PC' :
                   language === 'ES' ? 'MIRA EN MÓVIL O PC' :
                   language === 'FR' ? 'MIRA SUR MOBILE OU PC' :
                   'MIRA ON MOBILE OR PC'}
                </p>
                <h3 className="text-xs font-black uppercase tracking-tight leading-none mt-1.5 text-white">
                  {language === 'PT' ? 'Adicionar Atalho' :
                   language === 'ES' ? 'Añadir Acceso Directo' :
                   language === 'FR' ? 'Ajouter Raccourci' :
                   'Add Shortcut'}
                </h3>
              </div>
            </div>
            <div className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-mira-orange transition-all shadow-sm shrink-0">
              <Download size={14} strokeWidth={3} />
            </div>
          </button>
        </div>
      )}

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
                    <span className="text-[9px] font-extrabold text-mira-orange tracking-[0.2em] uppercase">{t('home_access_module', language)}</span>
                    <ChevronRight size={12} className="text-mira-orange" />
                </div>
              </div>
            </button>
          ))}
      </div>
      


      {/* Manual Banner - Compact & Responsive Launch Edition */}
      <div 
        onClick={() => onViewChange(ViewType.LEARNING, { articleId: '408' })} 
        className="relative overflow-hidden bg-mira-orange rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 text-white shadow-2xl cursor-pointer hover:scale-[1.01] active:scale-[0.98] transition-all group mt-6 mb-4 z-10 border border-white/30 sm:mx-1"
        style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF4500 100%)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-110 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border border-white/20 group-hover:rotate-6 transition-transform duration-500 shrink-0">
              <BookOpen size={24} className="text-white md:hidden" />
              <BookOpen size={30} className="text-white hidden md:block" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest border border-white/10 whitespace-nowrap">
                  {t('home_manual_launch_badge', language)}
                </span>
              </div>
              <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter leading-none whitespace-normal">
                {t('home_manual_title_v2026', language)}
              </h2>
              <p className="text-[10px] md:text-sm text-white/80 font-bold mt-1 uppercase tracking-tight whitespace-normal">
                {t('home_manual_description', language)}
              </p>
            </div>
          </div>
          <div 
            className="w-10 h-10 md:w-12 md:h-12 bg-mira-orange text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white/50 group-hover:translate-x-2 transition-transform shrink-0"
            style={{ backgroundColor: '#FF8C00' }}
          >
            <ArrowRight size={18} className="md:hidden" strokeWidth={3} />
            <ArrowRight size={22} className="hidden md:block" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Suggestion Hub - Community Logic */}
      <button 
        onClick={() => setShowSuggestionModal(true)}
        className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 mb-12 flex items-center justify-between group hover:border-mira-orange hover:shadow-xl transition-all active:scale-[0.98] sm:mx-1"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-mira-orange rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
            <MessageSquare size={24} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-mira-orange transition-colors">
              {t('home_community_voice', language)}
            </p>
            <h3 className="text-sm md:text-lg font-black text-slate-900 uppercase tracking-tight leading-none mt-1">
              {t('home_send_suggestion', language)}
            </h3>
          </div>
        </div>
        <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-xl flex items-center justify-center group-hover:bg-mira-orange group-hover:text-white transition-all shadow-sm">
          <ChevronRight size={20} strokeWidth={3} />
        </div>
      </button>

      <SuggestionModal 
        isOpen={showSuggestionModal} 
        onClose={() => setShowSuggestionModal(false)} 
        language={language}
        userEmail={user.email}
      />



      {/* iOS Safari Guide Modal */}
      {showSafariGuide && (
        <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowSafariGuide(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 rounded-3xl bg-mira-orange/10 flex items-center justify-center mx-auto text-mira-orange text-3xl">
              📲
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
              {language === 'PT' ? 'Instalar no seu iPhone' :
               language === 'ES' ? 'Instalar en tu iPhone' :
               language === 'FR' ? 'Installer sur iPhone' :
               'Install on your iPhone'}
            </h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {language === 'PT' ? (
                <>
                  Para adicionar o atalho ao ecrã principal, toque no botão de partilha <span className="inline-block p-1 bg-slate-100 rounded">📤</span> no Safari e selecione <strong>'Adicionar ao Ecrã Principal'</strong> <span className="inline-block p-1 bg-slate-100 rounded">➕</span>.
                </>
              ) : language === 'ES' ? (
                <>
                  Para agregar el acceso directo a la pantalla de inicio, toque el botón de compartir <span className="inline-block p-1 bg-slate-100 rounded">📤</span> en Safari y seleccione <strong>'Compartir / Agregar a pantalla de inicio'</strong> <span className="inline-block p-1 bg-slate-100 rounded">➕</span>.
                </>
              ) : language === 'FR' ? (
                <>
                  Pour ajouter le raccourci sur l'écran d'accueil, appuyez sur le bouton de partage <span className="inline-block p-1 bg-slate-100 rounded">📤</span> dans Safari et sélectionnez <strong>'Sur l'écran d'accueil'</strong> <span className="inline-block p-1 bg-slate-100 rounded">➕</span>.
                </>
              ) : (
                <>
                  To add the shortcut to your home screen, tap the share button <span className="inline-block p-1 bg-slate-100 rounded">📤</span> in Safari and select <strong>'Add to Home Screen'</strong> <span className="inline-block p-1 bg-slate-100 rounded">➕</span>.
                </>
              )}
            </p>
            <button
              onClick={() => setShowSafariGuide(false)}
              className="w-full py-4 bg-mira-orange text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all"
            >
              {language === 'PT' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Premium Footer */}
      <footer className="mt-12 py-8 border-t border-slate-100 space-y-4 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm p-1">
                <img src="/logo-mira.png" alt="MIRA" className="w-full h-full object-contain bg-transparent border-none outline-none" style={{ background: 'transparent' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">{t('footer_copyright', language)}</span>
                <span className="text-[9px] font-extrabold text-mira-orange uppercase tracking-tight mt-1">{t('auth_subtitle', language)}</span>
              </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={() => onViewChange(ViewType.PRIVACY)} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-all hover:scale-105 active:scale-95"
            >
              {t('nav_privacy', language)}
            </button>
            <button 
              onClick={() => onViewChange(ViewType.COOKIES)} 
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-mira-orange transition-all hover:scale-105 active:scale-95"
            >
              {t('nav_cookies', language)}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex justify-center md:justify-start gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Shield size={14} />
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Lock size={14} />
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Activity size={14} />
             </div>
          </div>

          <a 
            href="https://www.instagram.com/miraimigrante" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:brightness-110 active:scale-95 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-pink-500/10 transition-all group"
          >
            <Instagram size={14} className="stroke-[2.5] group-hover:scale-110 transition-all duration-300" />
            @miraimigrante
          </a>
        </div>
      </footer>
    </div>
  );
});
