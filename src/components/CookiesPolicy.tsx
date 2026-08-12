
import React from 'react';
import { 
  ShieldCheck, Cookie, Info, Shield, 
  Settings, ExternalLink, ArrowLeft,
  MousePointerClick, ToggleRight, BarChart3,
  Globe, Lock, Zap
} from 'lucide-react';
import { t } from '../utils/translations';

export const CookiesPolicy: React.FC<{ language: string; onBack: () => void }> = ({ language, onBack }) => {
  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-8 pb-32 max-w-2xl mx-auto min-h-screen font-sans bg-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-mira-blue/10 to-transparent pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center text-center py-8">
        <button 
          onClick={onBack}
          className="absolute left-0 top-0 flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-mira-orange hover:border-mira-orange/20 transition-all group shadow-sm active:scale-95"
        >
          <ArrowLeft size={14} /> {t('back', language)}
        </button>

        <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 text-mira-blue shadow-xl shadow-mira-blue/10 border border-white relative">
          <div className="absolute inset-0 rounded-[2.5rem] border-2 border-mira-blue/20 animate-pulse"></div>
          <Cookie size={36} />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">
          {t('privacy_s8_title', language)}
        </h2>
        <div className="h-1 w-12 bg-mira-orange rounded-full mb-4"></div>
        <p className="text-[11px] font-bold text-slate-500 max-w-sm leading-relaxed">
          {t('privacy_s8_p1', language)}
        </p>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-4">
        
        {/* Transparency Card */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-mira-blue/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <h3 className="flex items-center gap-3 text-sm font-black text-slate-900 uppercase tracking-tight mb-4">
              <div className="p-2 bg-mira-blue/10 text-mira-blue rounded-xl">
                <Info size={18} />
              </div>
              {t('cookies_what_title', language)}
            </h3>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
              {t('cookies_what_p', language)}
            </p>
          </div>
        </div>

        {/* Types Grid */}
        <div className="grid grid-cols-1 gap-4">
          <CookieCard 
            icon={Shield} 
            title={t('privacy_s8_li1', language).split(':')[0]} 
            desc={t('privacy_s8_li1', language).split(':')[1]}
            color="bg-mira-blue"
            badge={t('cookies_required', language)}
          />
          <CookieCard 
            icon={Settings} 
            title={t('privacy_s8_li2', language).split(':')[0]} 
            desc={t('privacy_s8_li2', language).split(':')[1]}
            color="bg-mira-orange"
          />
          <CookieCard 
            icon={Zap} 
            title={t('privacy_s8_li3', language).split(':')[0]} 
            desc={t('privacy_s8_li3', language).split(':')[1]}
            color="bg-mira-green"
          />
          <CookieCard 
            icon={BarChart3} 
            title={t('privacy_s8_li4', language).split(':')[0]} 
            desc={t('privacy_s8_li4', language).split(':')[1]}
            color="bg-indigo-500"
          />
          <CookieCard 
            icon={Globe} 
            title={t('privacy_s8_li5', language).split(':')[0]} 
            desc={t('privacy_s8_li5', language).split(':')[1]}
            color="bg-slate-700"
          />
        </div>

        {/* How to control */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-mira-orange/10 rounded-full -mb-32 -mr-32 blur-3xl pointer-events-none"></div>
          
          <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-tight mb-6 relative z-10">
            <div className="p-2 bg-white/10 text-mira-orange rounded-xl">
              <ToggleRight size={18} />
            </div>
            {t('cookies_control_title', language)}
          </h3>
          
          <div className="space-y-4 text-xs font-medium text-slate-300 leading-relaxed relative z-10">
            <p>{t('cookies_control_p1', language)}</p>
            <p>{t('cookies_control_p2', language)}</p>
            
            <div className="pt-4 flex flex-wrap gap-2">
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                <span className="text-[10px] font-black uppercase">Chrome</span>
                <ExternalLink size={12} />
              </a>
              <a href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                <span className="text-[10px] font-black uppercase">Safari</span>
                <ExternalLink size={12} />
              </a>
              <a href="https://support.mozilla.org/pt-PT/kb/ativar-e-desativar-cookies-que-os-websites-utilizam" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                <span className="text-[10px] font-black uppercase">Firefox</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Legal link */}
        <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-mira-blue/20 transition-all hover:shadow-lg shadow-mira-blue/5" onClick={onBack}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-mira-blue/10 flex items-center justify-center text-mira-blue group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-slate-900">{t('privacy_title', language)}</p>
              <p className="text-[10px] font-bold text-slate-400">{t('cookies_review_terms', language)}</p>
            </div>
          </div>
          <ArrowLeft size={20} className="text-slate-300 group-hover:-translate-x-1 transition-transform" />
        </div>

      </div>

      {/* Footer info */}
      <div className="pt-10 pb-6 text-center space-y-4">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
          MIRA PORTUGAL &copy; 2026
        </p>
        <div className="flex items-center justify-center gap-4 text-slate-300">
           <Globe size={16} />
           <Lock size={16} />
           <ShieldCheck size={16} />
        </div>
      </div>
    </div>
  );
};

const CookieCard = ({ icon: Icon, title, desc, color, badge }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all group overflow-hidden relative">
    {badge && (
      <div className="absolute top-0 right-0 py-1 px-3 bg-mira-blue text-white text-[8px] font-black tracking-widest rounded-bl-xl uppercase">
        {badge}
      </div>
    )}
    <div className="flex gap-4">
      <div className={`p-3 rounded-2xl ${color} text-white shadow-lg shrink-0 h-fit group-hover:scale-110 transition-transform`}>
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">{title}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);
