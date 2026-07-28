import React from 'react';
import { Shield, Lock, CheckCircle2, Globe, Scale } from 'lucide-react';
import { t } from '../utils/translations';
import { audioService } from '../services/audioService';

interface ConsentModalProps {
    onAccept: () => void;
    language: string;
    onSetLanguage: (lang: string) => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onAccept, language, onSetLanguage }) => {
    const handleLangSelect = (lang: string) => {
        audioService.playClick();
        onSetLanguage(lang);
    };

    const handleAcceptClick = () => {
        audioService.playClick();
        onAccept();
    };

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-[310px] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100/50 animate-in zoom-in-95 duration-500 flex flex-col">
                <div className="p-5 space-y-3.5 text-center flex-1 overflow-hidden">
                    {/* Header Icon */}
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center mx-auto shadow-xl">
                        <Shield className="text-amber-500" size={20} />
                    </div>

                    {/* Language Switcher inside Modal */}
                    <div className="flex items-center justify-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <Globe size={10} className="text-slate-400 ml-1.5" />
                        {['PT', 'EN', 'ES', 'FR'].map((lang) => (
                            <button
                                key={lang}
                                onClick={() => handleLangSelect(lang)}
                                className={`flex-1 py-1 text-[8px] font-black rounded-lg transition-all uppercase tracking-wider ${
                                    language.toUpperCase() === lang
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>

                    {/* Titles */}
                    <div className="space-y-0.5">
                        <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-tighter leading-tight">
                            {t('consent_title', language)}
                        </h2>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                            {t('consent_subtitle', language)}
                        </p>
                    </div>

                    {/* GDPR and Disclaimer Bullet Cards */}
                    <div className="space-y-2">
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3 text-left">
                            <Lock size={12} className="text-amber-600 shrink-0" />
                            <div className="space-y-0.5">
                                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wider leading-none">
                                    {language === 'EN' ? 'GDPR Compliance' : language === 'ES' ? 'Conformidad RGPD' : language === 'FR' ? 'Conformité RGPD' : 'Conformidade RGPD'}
                                </h4>
                                <p className="text-[8px] font-bold text-slate-500 leading-tight">
                                    {t('consent_gdpr_p1', language)}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3 text-left">
                            <CheckCircle2 size={12} className="text-blue-600 shrink-0" />
                            <div className="space-y-0.5">
                                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wider leading-none">
                                    {language === 'EN' ? 'Local Processing' : language === 'ES' ? 'Procesamiento Local' : language === 'FR' ? 'Traitement Local' : 'Processamento Local'}
                                </h4>
                                <p className="text-[8px] font-bold text-slate-500 leading-tight">
                                    {t('consent_gdpr_p2', language)}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3 text-left">
                            <Scale size={12} className="text-emerald-600 shrink-0" />
                            <div className="space-y-0.5">
                                <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-wider leading-none">
                                    {language === 'EN' ? 'Educational Tool' : language === 'ES' ? 'Herramienta Educativa' : language === 'FR' ? 'Outil Éducatif' : 'Fins Educativos'}
                                </h4>
                                <p className="text-[8px] font-bold text-slate-500 leading-tight">
                                    {t('consent_gdpr_p3', language)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Primary Button */}
                    <div className="pt-1">
                        <button
                            onClick={handleAcceptClick}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black uppercase text-[8px] tracking-widest hover:bg-slate-850 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={12} className="text-amber-500" />
                            {t('consent_accept', language)}
                        </button>
                    </div>

                    {/* Seal */}
                    <div className="flex items-center justify-center gap-2 pt-0.5 opacity-45 text-slate-500">
                        <span className="text-[6px] font-black uppercase tracking-[0.2em]">{t('consent_compliance', language)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
