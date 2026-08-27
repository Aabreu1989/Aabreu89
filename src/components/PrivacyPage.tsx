
import React, { useState } from 'react';
import {
  Shield, Scale, Bot, Lock, FileWarning, ChevronDown, ChevronUp,
  Database, Eraser, ExternalLink, Globe, Award, Flame, UserCheck, MailX,
  ShieldAlert, MessageCircle, FileText, MapPin, Book, Heart, Zap, AlertTriangle, AlertCircle,
  Copyright, ShieldCheck, ShieldCheck as ShieldCheckIcon, CalendarCheck, ArrowLeft, Activity
} from 'lucide-react';
import { t } from '../utils/translations';

interface PrivacyPageProps {
  language: string;
  onSetLanguage?: (lang: string) => void;
  onBack?: () => void;
  initialSection?: string;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ 
  language: initialLang, 
  onSetLanguage, 
  onBack, 
  initialSection 
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(initialSection || 'legal');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [localLang, setLocalLang] = useState(initialLang);

  const language = onSetLanguage ? initialLang : localLang;

  const handleLanguageChange = (l: string) => {
    if (onSetLanguage) {
      onSetLanguage(l);
    } else {
      setLocalLang(l);
      localStorage.setItem('mira_language', l);
    }
    setShowLangMenu(false);
  };

  React.useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const Section = ({ id, title, icon: Icon, children, colorClass }: any) => (
    <div className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${activeSection === id ? 'border-mira-blue/20 shadow-lg shadow-mira-blue/5' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-5 text-left bg-white transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl transition-transform duration-300 ${activeSection === id ? 'scale-110' : 'group-hover:scale-105'} ${colorClass}`}>
            <Icon size={20} />
          </div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase">{title}</h3>
        </div>
        <div className={`p-2 rounded-full transition-colors ${activeSection === id ? 'bg-slate-100' : 'bg-transparent'}`}>
          {activeSection === id ? <ChevronUp size={18} className="text-slate-600" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {activeSection === id && (
        <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="text-[13px] text-slate-600 font-medium leading-[1.8] space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6 pb-32 max-w-2xl mx-auto min-h-screen font-sans bg-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-mira-blue/10 to-transparent pointer-events-none"></div>

      {/* Top Controls: Back Button and Language Dropdown */}
      <div className="flex items-center justify-between relative z-20 mb-2">
        {onBack ? (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-mira-orange hover:border-mira-orange/30 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={14} /> {t('back', language)}
          </button>
        ) : <div />}

        {/* Language Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all border bg-mira-orange border-orange-500 hover:bg-orange-600 active:scale-95 shadow-sm shadow-orange-500/20"
          >
            <Globe size={13} className="text-white shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">{language}</span>
            <ChevronDown size={12} className="text-white/80 shrink-0" />
          </button>

          {showLangMenu && (
            <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[9999] animate-in slide-in-from-top-2">
              {['PT', 'EN', 'ES', 'FR'].map(l => (
                <button 
                  key={l} 
                  onClick={() => handleLanguageChange(l)} 
                  className={`w-full text-left px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-all ${language === l ? 'bg-mira-orange text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {l === 'PT' ? '🇵🇹 Português' : l === 'EN' ? '🇬🇧 English' : l === 'ES' ? '🇪🇸 Español' : '🇫🇷 Français'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="text-center py-4 relative z-10">
        <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-5 text-mira-orange shadow-xl shadow-mira-orange/10 border border-white relative">
          <div className="absolute inset-0 rounded-[2.5rem] border-2 border-mira-orange/20 animate-pulse"></div>
          <ShieldCheckIcon size={36} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('privacy_title', language)}</h2>
        <p className="text-[10px] font-black text-mira-blue mt-2 uppercase tracking-[0.2em] bg-mira-blue/10 inline-block px-3 py-1 rounded-full">
          {t('privacy_subtitle', language)}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4 relative z-10">

        <Section id="legal" title={t('legal_s_title', language)} icon={Scale} colorClass="bg-red-50 text-red-600 border border-red-100">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">{t('legal_s_p1', language)}</p>
            <p className="leading-relaxed">
              {t('legal_s_p2', language)}
            </p>
            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>
              <p className="text-sm text-red-800 font-black leading-relaxed relative z-10 flex items-start gap-2">
                {t('legal_s_p3', language)}
              </p>
            </div>
            <p className="leading-relaxed border-t border-slate-100 pt-3">
              {t('legal_s_p4', language)}
            </p>
            <p className="leading-relaxed border-t border-slate-100 pt-3">
              {t('legal_s_p5', language)}
            </p>
          </div>
        </Section>

        {/* 🛡️ POLÍTICA DE TRANSPARÊNCIA, AGREGAÇÃO DE VAGAS E SEGURANÇA */}
        {/* 🛡️ POLÍTICA DE TRANSPARÊNCIA, AGREGAÇÃO DE CONTEÚDOS E SEGURANÇA */}
        <Section id="jobs_policy" title={t('jobs_policy_title', language)} icon={Globe} colorClass="bg-blue-50 text-blue-600 border border-blue-100">
          <div className="space-y-5 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('jobs_policy_intro', language)}
            </p>
            <p className="leading-relaxed">
              {t('jobs_policy_intro_p2', language)}
            </p>

            {/* Secção 1 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-mira-blue">
                1. {t('jobs_policy_sec1_title', language)}
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-600">
                <li>• <strong>{t('jobs_policy_sec1_bullet1_title', language)}:</strong> {t('jobs_policy_sec1_bullet1_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec1_bullet2_title', language)}:</strong> {t('jobs_policy_sec1_bullet2_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec1_bullet3_title', language)}:</strong> {t('jobs_policy_sec1_bullet3_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec1_bullet4_title', language)}:</strong> {t('jobs_policy_sec1_bullet4_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec1_bullet5_title', language)}:</strong> {t('jobs_policy_sec1_bullet5_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec1_bullet6_title', language)}:</strong> {t('jobs_policy_sec1_bullet6_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec1_bullet7_title', language)}:</strong> {t('jobs_policy_sec1_bullet7_desc', language)}</li>
              </ul>
            </div>

            {/* Secção 2 */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <h4 className="font-black text-amber-900 text-xs uppercase tracking-wider">
                2. {t('jobs_policy_sec2_title', language)}
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-amber-950">
                <li>• <strong>{t('jobs_policy_sec2_bullet1_title', language)}:</strong> {t('jobs_policy_sec2_bullet1_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec2_bullet2_title', language)}:</strong> {t('jobs_policy_sec2_bullet2_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec2_bullet3_title', language)}:</strong> {t('jobs_policy_sec2_bullet3_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec2_bullet4_title', language)}:</strong> {t('jobs_policy_sec2_bullet4_desc', language)}</li>
                <li>• <strong>{t('jobs_policy_sec2_bullet5_title', language)}:</strong> {t('jobs_policy_sec2_bullet5_desc', language)}</li>
              </ul>
            </div>

            {/* Secção 3 */}
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
              <h4 className="font-black text-emerald-900 text-xs uppercase tracking-wider">
                3. {t('jobs_policy_sec3_title', language)}
              </h4>
              <div className="space-y-2 text-xs leading-relaxed text-emerald-950">
                <p>{t('jobs_policy_sec3_p1', language)}</p>
                <p>{t('jobs_policy_sec3_p2', language)}</p>
                <p>{t('jobs_policy_sec3_p3', language)}</p>
              </div>
            </div>

            {/* Secção 4 */}
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
              <h4 className="font-black text-indigo-900 text-xs uppercase tracking-wider">
                4. {t('jobs_policy_sec4_title', language)}
              </h4>
              <p className="text-xs text-indigo-950 leading-relaxed">
                {t('jobs_policy_sec4_desc', language)}
              </p>
              <div className="pt-1 flex items-center gap-2 font-black text-indigo-700">
                <MailX size={16} />
                <a href="mailto:mira.app@hotmail.com" className="underline underline-offset-2">mira.app@hotmail.com</a>
              </div>
              <p className="text-xs text-indigo-950 leading-relaxed pt-1">
                {t('jobs_policy_sec4_post', language)}
              </p>
            </div>

            {/* Aviso importante */}
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80 space-y-2 mt-4">
              <h4 className="font-black text-rose-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                {t('jobs_policy_notice_title', language)}
              </h4>
              <p className="text-xs text-rose-950 font-bold leading-relaxed">
                {t('jobs_policy_notice_p1', language)}
              </p>
              <p className="text-xs text-rose-950 leading-relaxed">
                {t('jobs_policy_notice_p2', language)}
              </p>
            </div>
          </div>
        </Section>

        <Section id="copyright" title={t('privacy_s1_title', language)} icon={Copyright} colorClass="bg-mira-orange/10 text-mira-orange border border-mira-orange/20">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('privacy_s1_p1', language)}
            </p>
            <p className="leading-relaxed">
              {t('privacy_s1_p2', language)}
            </p>

            {/* Uso autorizado */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-mira-orange">
                {t('privacy_s1_usage_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s1_usage_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s1_usage_p2', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s1_usage_p3', language)}</p>
            </div>

            {/* Conteúdos de terceiros */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-700">
                {t('privacy_s1_third_party_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s1_third_party_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s1_third_party_p2', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s1_third_party_p3', language)}</p>
            </div>
          </div>
        </Section>

        {/* 🔒 REGRAS DE SEGURANÇA E CONVIVÊNCIA */}
        <Section id="safety_rules" title={t('safety_rules_title', language)} icon={ShieldAlert} colorClass="bg-rose-50 text-rose-600 border border-rose-100">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('safety_rules_intro', language)}
            </p>

            <ul className="space-y-3">
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b1_title', language)}:</strong> {t('safety_rules_b1_desc', language)}
                </div>
              </li>
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b2_title', language)}:</strong> {t('safety_rules_b2_desc', language)}
                </div>
              </li>
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b3_title', language)}:</strong> {t('safety_rules_b3_desc', language)}
                </div>
              </li>
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b4_title', language)}:</strong> {t('safety_rules_b4_desc', language)}
                </div>
              </li>
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b5_title', language)}:</strong> {t('safety_rules_b5_desc', language)}
                </div>
              </li>
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b6_title', language)}:</strong> {t('safety_rules_b6_desc', language)}
                </div>
              </li>
              <li className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                <div>
                  <strong className="text-slate-900 font-black">{t('safety_rules_b7_title', language)}:</strong> {t('safety_rules_b7_desc', language)}
                </div>
              </li>
            </ul>

            <p className="leading-relaxed border-t border-slate-100 pt-3 text-slate-700 font-medium">
              {t('safety_rules_outro', language)}
            </p>
          </div>
        </Section>

        <Section id="badges" title={t('privacy_s2_title', language)} icon={Award} colorClass="bg-mira-yellow/10 text-mira-yellow-dark border border-mira-yellow/20">
          <p className="mb-4">{t('privacy_s2_p1', language)}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {[
              { icon: Flame, name: "badge1_name", desc: "privacy_s2_badge1_desc" },
              { icon: UserCheck, name: "badge2_name", desc: "privacy_s2_badge2_desc" },
              { icon: MessageCircle, name: "badge3_name", desc: "privacy_s2_badge3_desc" },
              { icon: FileText, name: "badge4_name", desc: "privacy_s2_badge4_desc" },
              { icon: MapPin, name: "badge5_name", desc: "privacy_s2_badge5_desc" },
              { icon: Award, name: "badge6_name", desc: "privacy_s2_badge6_desc" },
              { icon: ShieldAlert, name: "badge7_name", desc: "privacy_s2_badge7_desc" },
              { icon: Book, name: "badge8_name", desc: "privacy_s2_badge8_desc" },
              { icon: CalendarCheck, name: "badge9_name", desc: "privacy_s2_badge9_desc" },
              { icon: Heart, name: "badge10_name", desc: "privacy_s2_badge10_desc" },
              { icon: Zap, name: "badge11_name", desc: "privacy_s2_badge11_desc" },
              { icon: ShieldCheckIcon, name: "badge12_name", desc: "privacy_s2_badge12_desc" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gradient-to-br from-mira-yellow to-yellow-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <badge.icon size={18} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-widest leading-tight">{t(badge.name, language)}</h4>
                  <p className="text-[10px] text-slate-500 font-medium leading-snug line-clamp-2">{t(badge.desc, language)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="disclaimer" title={t('privacy_s3_title', language)} icon={AlertCircle} colorClass="bg-mira-orange/10 text-mira-orange border border-mira-orange/20">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 mb-2">
              <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                {t('privacy_s3_notice_title', language)}
              </h4>
              <p className="text-xs text-amber-950 font-bold leading-relaxed mb-2">
                {t('privacy_s3_p1', language)}
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">
                {t('privacy_s3_p2', language)}
              </p>
            </div>

            <p className="leading-relaxed">
              {t('privacy_s3_p3', language)}
            </p>

            <p className="leading-relaxed">
              {t('privacy_s3_p4', language)}
            </p>

            {/* 🔒 Segurança do Utilizador */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 mt-4">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Shield size={16} className="text-mira-blue" />
                {t('privacy_s3_safety_title', language)}
              </h4>
              <p className="text-xs text-slate-800 font-bold leading-relaxed">
                {t('privacy_s3_safety_p1', language)}
              </p>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest pt-1">
                {t('privacy_s3_safety_subtitle', language)}
              </p>
              <ul className="space-y-2 text-xs leading-relaxed text-slate-600">
                <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s3_safety_b1', language)}</li>
                <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s3_safety_b2', language)}</li>
                <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s3_safety_b3', language)}</li>
                <li className="flex gap-2 items-start"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s3_safety_b4', language)}</li>
              </ul>
            </div>

            <p className="leading-relaxed border-t border-slate-100 pt-3">
              {t('privacy_s3_p5', language)}
            </p>
            <p className="leading-relaxed font-bold text-slate-800">
              {t('privacy_s3_p6', language)}
            </p>
          </div>
        </Section>

        <Section id="privacy" title={t('privacy_s4_title', language)} icon={Lock} colorClass="bg-mira-green/10 text-mira-green-dark border border-mira-green/20">
          <div className="space-y-5 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('privacy_s4_intro', language)}
            </p>

            {/* 1. Segurança */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-mira-green-dark flex items-center gap-2">
                {t('privacy_s4_sec1_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec1_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec1_p2', language)}</p>
            </div>

            {/* 2. Transparência e Controlo */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                {t('privacy_s4_sec2_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec2_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec2_p2', language)}</p>
            </div>

            {/* 3. Minimização e Finalidade */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                {t('privacy_s4_sec3_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec3_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec3_p2', language)}</p>
            </div>

            {/* 4. Documentos e Dados Pessoais */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                {t('privacy_s4_sec4_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec4_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec4_p2', language)}</p>
              <p className="text-xs leading-relaxed font-bold text-slate-700">{t('privacy_s4_sec4_p3', language)}</p>
            </div>

            {/* 5. Eliminação da Conta */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-red-700 flex items-center gap-2">
                {t('privacy_s4_sec5_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec5_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s4_sec5_p2', language)}</p>
            </div>

            {/* 6. Exercício dos Direitos */}
            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200/80 space-y-2">
              <h4 className="font-black text-indigo-900 text-xs uppercase tracking-wider flex items-center gap-2">
                {t('privacy_s4_sec6_title', language)}
              </h4>
              <p className="text-xs text-indigo-950 leading-relaxed">
                {t('privacy_s4_sec6_p1', language)}
              </p>
              <div className="pt-1 flex items-center gap-2 font-black text-indigo-700">
                <MailX size={16} />
                <a href="mailto:mira.app@hotmail.com" className="underline underline-offset-2">mira.app@hotmail.com</a>
              </div>
            </div>
          </div>
        </Section>

        <Section id="ai" title={t('privacy_s5_title', language)} icon={Bot} colorClass="bg-mira-blue/10 text-mira-blue border border-mira-blue/20">
          <div className="space-y-5 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('privacy_s5_intro', language)}
            </p>

            {/* 1. Processamento de Dados */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-mira-blue flex items-center gap-2">
                <Bot size={16} />
                {t('privacy_s5_sec1_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s5_sec1_p1', language)}</p>
              <p className="text-xs leading-relaxed font-bold text-slate-700">{t('privacy_s5_sec1_p2', language)}</p>
              
              <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/70 space-y-2">
                <p className="text-xs text-amber-950 leading-relaxed">{t('privacy_s5_sec1_p3', language)}</p>
                <p className="text-xs text-amber-900 font-black leading-relaxed">{t('privacy_s5_sec1_p4', language)}</p>
              </div>
            </div>

            {/* 2. Registos e Métricas */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Activity size={16} />
                {t('privacy_s5_sec2_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s5_sec2_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s5_sec2_p2', language)}</p>
            </div>

            {/* 3. Segurança e Moderação */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck size={16} />
                {t('privacy_s5_sec3_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s5_sec3_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s5_sec3_p2', language)}</p>
            </div>
          </div>
        </Section>



        <Section id="terms" title={t('privacy_s7_title', language)} icon={FileText} colorClass="bg-slate-900 text-white border border-slate-800">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('privacy_s7_intro', language)}
            </p>

            <ul className="space-y-2.5">
              {[
                { title: "privacy_s7_li1_title", desc: "privacy_s7_li1_desc" },
                { title: "privacy_s7_li2_title", desc: "privacy_s7_li2_desc" },
                { title: "privacy_s7_li3_title", desc: "privacy_s7_li3_desc" },
                { title: "privacy_s7_li4_title", desc: "privacy_s7_li4_desc" },
                { title: "privacy_s7_li5_title", desc: "privacy_s7_li5_desc" },
                { title: "privacy_s7_li6_title", desc: "privacy_s7_li6_desc" },
                { title: "privacy_s7_li7_title", desc: "privacy_s7_li7_desc" },
                { title: "privacy_s7_li8_title", desc: "privacy_s7_li8_desc" },
                { title: "privacy_s7_li9_title", desc: "privacy_s7_li9_desc" },
              ].map((item, idx) => (
                <li key={idx} className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 shrink-0"></div>
                  <div>
                    <strong className="text-slate-900 font-black">{t(item.title, language)}:</strong> {t(item.desc, language)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2 mt-4">
              <p className="text-xs text-slate-800 font-bold leading-relaxed">
                {t('privacy_s7_p2', language)}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('privacy_s7_p3', language)}
              </p>
            </div>
          </div>
        </Section>

        <Section id="cookies" title={t('privacy_s8_title', language)} icon={Database} colorClass="bg-mira-blue/10 text-mira-blue-dark border border-mira-blue/20">
          <div className="space-y-5 text-xs sm:text-sm text-slate-600">
            <p className="font-bold text-slate-800 leading-relaxed">
              {t('privacy_s8_intro', language)}
            </p>

            {/* 1. O que são Cookies? */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-amber-800 flex items-center gap-2">
                🍪 {t('privacy_s8_sec1_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec1_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec1_p2', language)}</p>
            </div>

            {/* 2. Cookies e Tecnologias Essenciais */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-mira-blue flex items-center gap-2">
                <Lock size={15} />
                {t('privacy_s8_sec2_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec2_p1', language)}</p>
            </div>

            {/* 3. Preferências */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                ⚙️ {t('privacy_s8_sec3_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec3_p1', language)}</p>
            </div>

            {/* 4. Analítica e Métricas */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Activity size={15} />
                {t('privacy_s8_sec4_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec4_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec4_p2', language)}</p>
            </div>

            {/* 5. Serviços de Terceiros */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Globe size={15} />
                {t('privacy_s8_sec5_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec5_p1', language)}</p>
              <p className="text-xs leading-relaxed font-bold text-slate-700">{t('privacy_s8_sec5_p2', language)}</p>
            </div>

            {/* 6. Como controlar Cookies e Armazenamento? */}
            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                🛠️ {t('privacy_s8_sec6_title', language)}
              </h4>
              <p className="text-xs leading-relaxed text-slate-700">{t('privacy_s8_sec6_p1', language)}</p>
              <p className="text-xs leading-relaxed text-slate-600">{t('privacy_s8_sec6_p2', language)}</p>
            </div>
          </div>
        </Section>

      </div>

      {/* RGPD Data Controller Contact */}
      <div className="px-4">
        <div className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Shield size={14} /> {t('privacy_data_handler_rgpd', language)}
            </h4>
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase">{t('privacy_data_handler_name', language)}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('privacy_data_handler_role', language)}</p>
                    </div>
                </div>
                <div className="group bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MailX size={18} className="text-indigo-600" />
                        <span className="text-[11px] font-black text-indigo-900 truncate">mira.app@hotmail.com</span>
                    </div>
                    <a href="mailto:mira.app@hotmail.com" className="p-2 bg-indigo-600 text-white rounded-xl hover:scale-110 transition-transform">
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-4 leading-relaxed">
                {t('privacy_rights_p', language)}
            </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-10 pb-4 relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2 text-slate-300">
          <ShieldCheckIcon size={16} />
        </div>
        <p className="text-[9px] font-extrabold text-mira-orange text-center uppercase tracking-[0.3em] mb-1">
          {t('auth_subtitle', language)}
        </p>
        <p className="text-[9px] font-extrabold text-slate-400 text-center uppercase tracking-[0.3em]">
          MIRA © 2026 - AMANDA SILVA ABREU
        </p>
        <p className="text-[9px] text-slate-400 text-center mt-1 uppercase">
          {t('contact_prefix', language)}: mira.app@hotmail.com
        </p>
      </div>
    </div>
  );
};

// Simple Check icon for inside lists
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
