
import React, { useState } from 'react';
import {
  Shield, Scale, Bot, Lock, FileWarning, ChevronDown, ChevronUp,
  Database, Eraser, ExternalLink, Globe, Award, Flame, UserCheck, MailX,
  ShieldAlert, MessageCircle, FileText, MapPin, Book, Heart, Zap, AlertTriangle, AlertCircle,
  Copyright, ShieldCheck as ShieldCheckIcon, CalendarCheck, ArrowLeft
} from 'lucide-react';
import { t } from '../utils/translations';

export const PrivacyPage: React.FC<{ language: string; onBack?: () => void; initialSection?: string }> = ({ language, onBack, initialSection }) => {
  const [activeSection, setActiveSection] = useState<string | null>(initialSection || 'legal');

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

      {/* Header */}
      <div className="text-center py-6 relative z-10">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-mira-orange hover:border-mira-orange/20 transition-all group shadow-sm active:scale-95"
          >
            <ArrowLeft size={14} /> {t('back', language)}
          </button>
        )}
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
              </ul>
            </div>

            {/* Secção 2 */}
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <h4 className="font-black text-amber-900 text-xs uppercase tracking-wider">
                2. {t('jobs_policy_sec2_title', language)}
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-amber-950">
                <li>• {t('jobs_policy_sec2_bullet1', language)}</li>
                <li>• {t('jobs_policy_sec2_bullet2', language)}</li>
                <li>• <strong>{t('jobs_policy_sec2_bullet3', language)}</strong></li>
                <li>• {t('jobs_policy_sec2_bullet4', language)}</li>
              </ul>
            </div>

            {/* Secção 3 */}
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
              <h4 className="font-black text-emerald-900 text-xs uppercase tracking-wider">
                3. {t('jobs_policy_sec3_title', language)}
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-emerald-950">
                <li>• {t('jobs_policy_sec3_bullet1', language)}</li>
                <li>• {t('jobs_policy_sec3_bullet2', language)}</li>
              </ul>
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
            </div>

            {/* Aviso importante */}
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200/80 space-y-1.5 mt-4">
              <h4 className="font-black text-rose-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                {t('jobs_policy_notice_title', language)}
              </h4>
              <p className="text-xs text-rose-950 font-bold leading-relaxed">
                {t('jobs_policy_notice_desc', language)}
              </p>
            </div>
          </div>
        </Section>

        <Section id="copyright" title={t('privacy_s1_title', language)} icon={Copyright} colorClass="bg-mira-orange/10 text-mira-orange border border-mira-orange/20">
          <div className="space-y-4">
            <p className="font-black text-slate-900 leading-tight">{t('privacy_s1_p1', language)}</p>
            <p className="leading-relaxed">
              {t('privacy_s1_p2', language)}
            </p>
            <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t('privacy_s1_box_title', language)}</h4>
              <p className="text-[13px] text-slate-700 font-bold leading-relaxed">
                {t('privacy_s1_box_p', language)}
              </p>
            </div>
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

          <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <h4 className="font-black text-red-600 uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> {t('privacy_s2_box_title', language)}
            </h4>
            <p className="text-xs text-red-800 font-bold leading-relaxed mb-4">
              {t('privacy_s2_box_p', language)}
            </p>
            <ul className="space-y-3 text-xs text-red-700">
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                <span><strong>{t('privacy_s2_rule1_title', language)}</strong> {t('privacy_s2_rule1_desc', language)}</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                <span><strong>{t('privacy_s2_rule2_title', language)}</strong> {t('privacy_s2_rule2_desc', language)}</span>
              </li>
              <li className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0"></div>
                <span><strong>{t('privacy_s2_rule3_title', language)}</strong> {t('privacy_s2_rule3_desc', language)}</span>
              </li>
            </ul>
          </div>
        </Section>

        <Section id="disclaimer" title={t('privacy_s3_title', language)} icon={AlertCircle} colorClass="bg-mira-orange/10 text-mira-orange border border-mira-orange/20">
          <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-4 shadow-sm">
            <p className="font-black text-red-600 uppercase text-[10px] tracking-widest mb-1 flex items-center gap-2">
              <Shield size={14} /> {t('privacy_s3_box_title', language)}
            </p>
            <p className="text-xs text-red-800 font-bold leading-normal">
              {t('privacy_s3_box_p', language)}
            </p>
          </div>
          <div className="space-y-3 text-[13px] leading-relaxed text-slate-600">
            <p>{t('privacy_s3_p1', language)}</p>
            <p>{t('privacy_s3_p2', language)}</p>
            <p className="font-black text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200">🔒 {t('privacy_s3_p3', language)}</p>
            <p>{t('privacy_s3_p4', language)}</p>
            <p>{t('privacy_s3_p5', language)}</p>
            <p>{t('privacy_s3_p6', language)}</p>
            <p>{t('privacy_s3_p7', language)}</p>
            <p>{t('privacy_s3_p8', language)}</p>
            <p className="text-slate-800 font-bold">{t('privacy_s3_p9', language)}</p>
          </div>
        </Section>

        <Section id="privacy" title={t('privacy_s4_title', language)} icon={Lock} colorClass="bg-mira-green/10 text-mira-green-dark border border-mira-green/20">
          <p>
            {t('privacy_s4_p1', language)}
          </p>
          <ul className="space-y-3 my-4">
            <li className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-mira-green/10 text-mira-green flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </div>
              <span className="text-xs"><strong>{t('privacy_s4_rule1_title', language)}</strong><br />{t('privacy_s4_rule1_desc', language)}</span>
            </li>
            <li className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-mira-green/10 text-mira-green flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </div>
              <span className="text-xs"><strong>{t('privacy_s4_rule2_title', language)}</strong><br />{t('privacy_s4_rule2_desc', language)}</span>
            </li>
            <li className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="w-6 h-6 rounded-full bg-mira-green/10 text-mira-green flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </div>
              <span className="text-xs"><strong>{t('privacy_s4_rule3_title', language)}</strong><br />{t('privacy_s4_rule3_desc', language)}</span>
            </li>
          </ul>
        </Section>

        <Section id="ai" title={t('privacy_s5_title', language)} icon={Bot} colorClass="bg-mira-blue/10 text-mira-blue border border-mira-blue/20">
          <p>
            {t('privacy_s5_p1', language)}
          </p>
          <div className="space-y-3 mt-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-mira-blue"></div>
              <p className="text-[11px] font-black text-slate-800 mb-1 uppercase tracking-widest">{t('privacy_s5_box1_title', language)}</p>
              <p className="text-xs text-slate-500">{t('privacy_s5_box1_desc', language)} </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-mira-orange"></div>
              <p className="text-[11px] font-black text-slate-800 mb-1 uppercase tracking-widest">{t('privacy_s5_box2_title', language)}</p>
              <p className="text-xs text-slate-500">{t('privacy_s5_box2_desc', language)}</p>
            </div>
          </div>
        </Section>



        <Section id="terms" title={t('privacy_s7_title', language)} icon={FileText} colorClass="bg-slate-900 text-white border border-slate-800">
          <div className="space-y-4">
            <p>{t('privacy_s7_p1', language)}</p>
            <ul className="space-y-3 py-2">
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li1', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li2', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li3', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div> {t('privacy_s7_li4', language)}</li>
            </ul>

            {/* V105.2: ZERO TOLERANCE PROTOCOL - EXPANDED (User Request) */}
            <div className="mt-6 bg-red-50 p-6 rounded-[2rem] border-2 border-red-100 relative overflow-hidden group shadow-sm space-y-6">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield size={60} className="text-red-600" />
              </div>

              {/* Hate Speech Policy */}
              <div className="relative z-10">
                <h4 className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <ShieldAlert size={16} /> {t('privacy_s7_hate_speech_title', language)}
                </h4>
                <p className="text-xs text-red-900 font-bold leading-relaxed">
                  {t('privacy_s7_hate_speech_desc', language)}
                </p>
              </div>

              {/* Divider sutil */}
              <div className="h-px bg-red-200/50 w-full relative z-10"></div>

              {/* Fraud Policy */}
              <div className="relative z-10">
                <h4 className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Shield size={16} /> {t('privacy_s7_fraud_title', language)}
                </h4>
                <p className="text-xs text-red-900 font-bold leading-relaxed">
                  {t('privacy_s7_fraud_desc', language)}
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="cookies" title={t('privacy_s8_title', language)} icon={Database} colorClass="bg-mira-blue/10 text-mira-blue-dark border border-mira-blue/20">
          <div className="space-y-4">
            <p>{t('privacy_s8_p1', language)}</p>
            <ul className="space-y-3 py-2">
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s8_li1', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s8_li2', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s8_li3', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s8_li4', language)}</li>
              <li className="flex items-start gap-2 text-xs"><div className="w-1.5 h-1.5 rounded-full bg-mira-blue mt-1.5 shrink-0"></div> {t('privacy_s8_li5', language)}</li>
            </ul>
            <div className="pt-2">
              <button 
                onClick={() => {
                  try {
                    // Logic to navigate to Cookies page if the prop allows it, 
                    // otherwise it relies on the global state in App.tsx which handles this view
                    (window as any).miraNavigate?.('cookies');
                  } catch(e) {}
                }} 
                className="text-[10px] font-black text-mira-blue uppercase tracking-widest flex items-center gap-1 hover:text-mira-orange transition-colors"
                  title={t('cookies_full_policy_title', language)}
                >
                  {t('full_cookies_policy', language)} <ExternalLink size={12} />
              </button>
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
