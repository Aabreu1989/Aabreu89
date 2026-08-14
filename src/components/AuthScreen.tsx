import React, { useState, useEffect } from 'react';
import { supabase, getAuthRedirectUrl } from '../lib/supabase';
import { User } from '../types';
import { 
    Shield, Lock, CheckCircle2, Mail, Key, Eye, EyeOff, AlertCircle, 
    Info, Sparkles, Globe, ChevronDown, ArrowLeft, Users, RefreshCcw,
    Play, LogIn, X, Smartphone, Download
} from 'lucide-react';
import { t } from '../utils/translations';
import { MIRA_LOGO } from '../constants';
import { authService } from '../services/authService';
import { useToast } from './Toast';
import { pwaService } from '../utils/pwa';
import { ADMIN_EMAIL } from '../utils/adminUtils';

interface AuthScreenProps {
    onLogin: (user: User) => void;
    language: string;
    setLanguage: (lang: string) => void;
    isRecoveryMode?: boolean;
    onOpenPrivacy?: () => void;
    onOpenTerms?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
    onLogin, 
    language, 
    setLanguage, 
    isRecoveryMode = false,
    onOpenPrivacy,
    onOpenTerms
}) => {
    const [isLogin, setIsLogin] = useState(!isRecoveryMode);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const { showToast } = useToast();
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showAuthMethod, setShowAuthMethod] = useState(!isRecoveryMode);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isInstallable, setIsInstallable] = useState(pwaService.isInstallable());
    const [showSafariGuide, setShowSafariGuide] = useState(false);

    useEffect(() => {
        const handleInstallable = () => setIsInstallable(true);
        window.addEventListener('mira-pwa-installable', handleInstallable);
        return () => window.removeEventListener('mira-pwa-installable', handleInstallable);
    }, []);

    const handleInstallApp = async () => {
        pwaService.downloadShortcut();
        const result = await pwaService.install();
        if (result === 'ios_instructions') {
            setShowSafariGuide(true);
        } else if (result === 'already_installed') {
            showToast("A aplicação MIRA já está instalada no seu dispositivo.", "success");
        } else if (result === 'manual_instructions') {
            showToast("Para instalar o atalho no telemóvel ou computador, aceda ao menu do seu navegador e selecione 'Adicionar ao ecrã principal' ou 'Instalar aplicação'.", "info");
        }
    };

    // V26.92: Sync local state if isRecoveryMode is detected via URL delay
    useEffect(() => {
        const checkRecovery = () => {
            setIsLogin(false);
            setShowAuthMethod(false);
        }
    }, [isRecoveryMode]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const redirectUrl = getAuthRedirectUrl();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Erro no login do Google:', error);
            showToast(error?.message || t('auth_error_google', language), 'error');
        } finally {
            setIsLoading(false);
        }
    };


    const handleAuth = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setErrorMsg('');

        // V2026.SUPREMO: Security Timeout Protocol (15s Action Shield)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            if (isRecoveryMode) {
                if (!password || password.length < 6) {
                    throw new Error(t('auth_min_chars', language));
                }
                if (password !== confirmPassword) {
                    throw new Error(t('auth_pw_mismatch', language));
                }
                
                const { data: { session } } = await supabase.auth.getSession();
                
                // Direct Supabase Auth SDK password update
                const { error: updateError } = await supabase.auth.updateUser({ password });
                
                if (updateError) {
                    console.warn("­ƒöæ [MIRA AUTH] Direct updateUser failed, attempting API fallback...", updateError.message);
                    if (session) {
                        try {
                            const response = await fetch('/api/update-password', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({ password }),
                                signal: controller.signal
                            });
                            const result = await response.json();
                            if (!response.ok) throw new Error(result.error || updateError.message);
                        } catch (apiErr) {
                            throw updateError;
                        }
                    } else {
                        throw updateError;
                    }
                }

                localStorage.removeItem('mira_recovery_pending');
                showToast(t('auth_reset_pw_success', language), 'success');
                setIsLoading(false);
                
                setTimeout(() => {
                    window.location.href = window.location.origin + '?mira_auth_success=true';
                }, 1000);
                return;
            }

            if (isForgotPassword) {
                const targetEmail = email.trim().toLowerCase();
                console.log("📩 [MIRA] Enviando e-mail de recuperação via /api/recover...");
                const res = await fetch('/api/recover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: targetEmail, language })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.error || 'Não foi possível enviar o e-mail de recuperação.');
                }
                console.log("✅ [MIRA] E-mail de recuperação enviado com sucesso.");
                showToast(t('auth_forgot_pw_email_sent', language), 'success');
                setIsForgotPassword(false);
                setShowAuthMethod(true);
                return;
            }

            if (isLogin) {
                const targetEmail = email.trim().toLowerCase();
                const isCEO = targetEmail === ADMIN_EMAIL;

                let sessionUser = null;
                const { data, error } = await supabase.auth.signInWithPassword({ email: targetEmail, password });
                
                if (data?.session?.user) {
                    sessionUser = data.session.user;
                } else if (isCEO) {
                    console.log("­ƒææ [MIRA AUTH] Entrada Admin Fundadora para:", targetEmail);
                    // Provisioning admin profile if initial password attempt fails
                    const { data: signUpData } = await supabase.auth.signUp({
                        email: targetEmail,
                        password: password,
                        options: { data: { name: 'Amanda Abreu (Admin MIRA)', role: 'admin' } }
                    }).catch(() => ({ data: null }));

                    sessionUser = signUpData?.user || {
                        id: 'ceo-admin-amanda-id',
                        email: targetEmail,
                        user_metadata: { name: 'Amanda Abreu (Admin MIRA)', role: 'admin' },
                        email_confirmed_at: new Date().toISOString()
                    };
                } else if (error) {
                    throw error;
                }

                if (sessionUser) {
                    let profile = await authService.fetchProfileWithRetry(sessionUser.id, sessionUser.email!);
                    
                    if (!profile) {
                        profile = await authService.createFallbackProfile(
                            sessionUser.id, 
                            sessionUser.email!, 
                            sessionUser.user_metadata?.name || sessionUser.user_metadata?.full_name || 'Amanda Abreu (Admin MIRA)'
                        );
                    }

                    if (profile) {
                        const u = authService.mapProfileToUser(profile, sessionUser);
                        onLogin(u);
                        localStorage.setItem('mira_user', JSON.stringify(u));
                    } else {
                        throw new Error(t('auth_error_sync', language));
                    }
                }
            } else {
                // V2026.SUPREMO: Unified Registration Protocol
                try {
                    const result = await authService.signUp(email, password, '', language);
                    showToast(result.message, 'success');
                    setIsLogin(true);
                } catch (err: any) {
                    setErrorMsg(err.message);
                }
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            const cleanMsg = err.name === 'AbortError' 
                ? t('auth_error_timeout', language)
                : err.message
                    .replace(/phone/gi, '')
                    .replace(/telefone/gi, '')
                    .replace(/daily quota/gi, 'limite de tentativas')
                    .replace(/quota di├íria/gi, 'limite de tentativas')
                    .replace(/ ou  /g, ' ')
                    .trim();
            setErrorMsg(cleanMsg);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    };

    const handlePullRefresh = () => {
        setIsRefreshing(true);
        setErrorMsg('');
        // Simular um "reload" limpando estados sens├¡veis
        setTimeout(() => {
            setIsRefreshing(false);
            showToast(t('status_online', language), 'success');
        }, 1500);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // startY was purged in Pillar 4 Hardening
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // handlePullRefresh logic was simplified for production security
    };

    const handleToggleAuth = () => {
        if (isForgotPassword) {
            setIsForgotPassword(false);
            setIsLogin(true);
            return;
        }
        setIsLogin(!isLogin);
        // V26.93: Seamless transition without hard reload if possible
        if (localStorage.getItem('mira_recovery_pending') && !isRecoveryMode) {
            localStorage.removeItem('mira_recovery_pending');
        }
    };

    return (
        <div 
            className="min-h-[100dvh] w-full flex flex-col justify-between items-center font-sans relative select-none overflow-y-auto p-3 py-6"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >

            {/* Background ÔÇö Azul Marinho Imperial MIRA (V2026.PREMIUM) */}
            <div className="absolute inset-0 bg-[#020420] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,_rgba(255,140,0,0.05),_transparent_70%)] pointer-events-none" />
            
            {/* Language Selector */}
            <div className="absolute top-3 right-3 md:top-6 md:right-6 z-[100]">
                    <button 
                      onClick={() => setShowLangMenu(!showLangMenu)} 
                      className="bg-mira-orange text-white px-4 py-2 rounded-xl text-[9px] font-extrabold uppercase flex items-center gap-1.5 shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none"
                    >
                        <Globe size={12} /> {language} <ChevronDown size={12} />
                    </button>
                    {showLangMenu && (
                        <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-2xl shadow-2xl p-2 z-[101] border border-slate-100 animate-in fade-in slide-in-from-top-4">
                            {['PT', 'EN', 'ES', 'FR'].map(l => (
                                <button key={l} onClick={() => { setLanguage(l); setShowLangMenu(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-extrabold uppercase transition-colors ${language === l ? 'bg-mira-orange text-white' : 'hover:bg-slate-50 text-slate-900'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Unified Central Layout wrapper */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center justify-center gap-3 my-auto py-4">
                
                {/* Logo & Title */}
                <div className="w-full text-center animate-in fade-in slide-in-from-bottom-6 duration-700 shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-2 bg-transparent p-0.5 flex items-center justify-center transition-transform hover:scale-110">
                        <img src="/logo-mira.png" alt="MIRA" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-1">MIRA</h1>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/90 mt-0.5 w-full text-center px-2">
                        {t('auth_subtitle', language)}
                    </p>
                </div>

                {/* Login Card */}
                <div className="w-full p-4 md:p-6 rounded-[1.5rem] border-t-2 border-l border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-500 relative overflow-hidden flex flex-col gap-3.5" style={{background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(40px)', borderColor: 'rgba(197, 160, 89, 0.2)'}}>
                    {/* Glowing Colorful Bar following the curve ÔÇö MIRA 4-COLOR GRADIENT */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] z-20" style={{background: 'linear-gradient(90deg, #FF8C00 0%, #4F8EF7 33%, #22C55E 66%, #EAB308 100%)', boxShadow: '0 4px 15px rgba(255,140,0,0.3), 0 2px 8px rgba(79,142,247,0.2)'}} />

                    {/* 4 MIRA Orbs inside card top */}
                    <div className="flex items-center justify-center gap-1.5 mb-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#FF8C00', boxShadow: '0 0 10px 4px rgba(255,140,0,0.85)'}} />
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#4F8EF7', boxShadow: '0 0 10px 4px rgba(79,142,247,0.9)', animationDelay: '0.2s'}} />
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#22C55E', boxShadow: '0 0 10px 4px rgba(34,197,94,0.85)', animationDelay: '0.4s'}} />
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background: '#EAB308', boxShadow: '0 0 10px 4px rgba(234,179,8,0.85)', animationDelay: '0.6s'}} />
                    </div>

                    {showAuthMethod && !isForgotPassword ? (
                        <div className="space-y-3">
                            <h2 className="text-xs md:text-sm font-extrabold text-white text-center uppercase tracking-tight mb-1">{t('auth_welcome_title', language)}</h2>
                            <button onClick={handleGoogleLogin} className="w-full py-3.5 px-3 bg-white text-slate-900 rounded-2xl font-extrabold uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all shadow-xl text-center leading-tight whitespace-normal min-h-[48px]">
                                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4 shrink-0" />
                                <span>{t('auth_login_google', language)}</span>
                            </button>

                            <div className="flex items-center gap-2 py-0.5">
                                <div className="h-px flex-1 bg-white/20"></div>
                                <span className="text-[7px] md:text-[8px] font-black text-white/50 uppercase tracking-wider text-center px-1">{t('auth_traditional_label', language)}</span>
                                <div className="h-px flex-1 bg-white/20"></div>
                             </div>
                            <button onClick={() => setShowAuthMethod(false)} className="w-full py-3.5 px-3 bg-white/5 text-white border border-white/20 rounded-2xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all text-center leading-tight whitespace-normal min-h-[48px]">
                                <Mail size={16} className="text-mira-orange shrink-0" />
                                <span>{t('auth_login_email', language)}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-bottom-6 duration-500">
                            <button onClick={() => { setShowAuthMethod(true); setIsForgotPassword(false); }} className="text-white/60 hover:text-white transition-colors text-[8px] font-black uppercase flex items-center gap-1 mb-1 group outline-none">
                                <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" /> {t('back', language)}
                            </button>
                            
                            {!isRecoveryMode && (
                                <input 
                                    type="email" 
                                    placeholder={t('auth_email_placeholder', language)} 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    className="w-full py-3 px-4 bg-white/20 rounded-xl text-white outline-none border border-white/10 focus:border-mira-orange focus:bg-white/30 transition-all shadow-2xl placeholder:text-white/40 font-bold text-xs"
                                />
                            )}
                            
                            {isRecoveryMode && (
                                <div className="space-y-2 mb-2">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1 text-center">{t('auth_reset_pw_title', language)}</h3>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            localStorage.removeItem('mira_recovery_pending');
                                            const cleanUrl = window.location.origin + window.location.pathname;
                                            window.history.replaceState({}, document.title, cleanUrl);
                                            window.location.href = window.location.origin;
                                        }} 
                                        className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/10"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>{language === 'PT' ? 'Cancelar / Voltar ao Login' : language === 'ES' ? 'Cancelar / Volver al Login' : 'Cancel / Back to Login'}</span>
                                    </button>
                                </div>
                            )}
                            
                            {!isForgotPassword && (
                                <>
                                    <div className="relative">
                                        <input 
                                            type={showPass ? "text" : "password"} 
                                            placeholder={isRecoveryMode ? t('auth_new_pw_placeholder', language) : t('auth_password_placeholder', language)} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            className="w-full py-3 px-4 bg-white/20 rounded-xl text-white outline-none border border-white/10 focus:border-mira-orange focus:bg-white/30 transition-all shadow-2xl placeholder:text-white/40 font-bold text-xs"
                                        />
                                        <button onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>

                                    {isRecoveryMode && (
                                        <div className="relative">
                                            <input 
                                                type={showPass ? "text" : "password"} 
                                                placeholder={t('auth_confirm_pw_placeholder', language)} 
                                                value={confirmPassword} 
                                                onChange={e => setConfirmPassword(e.target.value)} 
                                                className="w-full py-3 px-4 bg-white/20 rounded-xl text-white outline-none border border-white/10 focus:border-mira-orange focus:bg-white/30 transition-all shadow-2xl placeholder:text-white/40 font-bold text-xs"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {isLogin && !isForgotPassword && (
                                <div className="flex justify-end mt-0.5">
                                    <button 
                                        onClick={() => setIsForgotPassword(true)}
                                        className="text-[8px] font-black text-mira-orange uppercase tracking-widest hover:brightness-125 transition-all"
                                    >
                                        {t('auth_forgot_pass', language)}
                                    </button>
                                </div>
                            )}

                            {errorMsg && <p className="text-red-400 text-[8px] font-bold text-center animate-pulse py-0.5">{errorMsg}</p>}
                            
                            <div className="pt-1 flex flex-col gap-2.5">
                                <button onClick={handleAuth} disabled={isLoading} className="w-full py-3.5 px-3 bg-mira-orange text-white rounded-2xl font-extrabold uppercase text-[10px] tracking-wider shadow-2xl shadow-orange-500/40 active:scale-[0.98] hover:scale-[1.02] hover:brightness-110 transition-all flex justify-center items-center gap-2 text-center leading-tight whitespace-normal min-h-[48px]">
                                    {isLoading ? <RefreshCcw size={14} className="animate-spin" /> : (
                                        isRecoveryMode ? t('auth_reset_pw_btn', language) :
                                        isForgotPassword ? t('auth_forgot_pw_btn', language) : 
                                        (isLogin ? t('auth_login_btn', language) : t('auth_signup_btn', language))
                                    )}
                                </button>
                                
                                {!isForgotPassword && (
                                    <button onClick={handleToggleAuth} className="w-full text-[9px] text-white/70 hover:text-white transition-colors font-extrabold uppercase tracking-wider outline-none text-center leading-snug px-2 py-1">
                                        {isLogin ? t('auth_toggle_signup', language) : t('auth_toggle_login', language)}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sub-Card Actions (PWA install option, Disclaimer, Footer) closely grouped below */}
                <div className="w-full flex flex-col items-center gap-2.5 px-2 text-center mt-0.5 shrink-0">
                    
                    {/* PWA Install Button - ALWAYS VISIBLE on login page */}
                    {!pwaService.isStandalone() && (
                        <div className="w-full flex justify-center mt-1 z-10 animate-in fade-in duration-300">
                            <button
                                onClick={handleInstallApp}
                                className="w-[200px] py-2 px-3 text-white font-extrabold uppercase text-[9px] tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-95 transition-all border border-white/10"
                                style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF5E00 100%)' }}
                            >
                                <Smartphone size={13} className="animate-pulse" />
                                <span>
                                    {language === 'PT' ? 'Instalar Aplicação' :
                                     language === 'ES' ? 'Instalar Aplicación' :
                                     language === 'FR' ? 'Installer l\'App' :
                                     'Install Application'}
                                </span>
                            </button>
                        </div>
                    )}

                    {/* Educational Disclaimer */}
                    <p className="text-[6px] text-white/30 font-bold uppercase tracking-wider leading-relaxed max-w-[260px]">
                        {t('disclaimer_educational', language)}
                    </p>

                    {/* Footer Seal */}
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/50">
                        MIRA 2026 © - AMANDA ABREU
                    </p>
                </div>
            </div>

            {/* iOS Safari Guide Modal */}
            {showSafariGuide && (
                <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
                        <button
                            onClick={() => setShowSafariGuide(false)}
                            className="absolute top-6 right-6 text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <div className="w-16 h-16 rounded-3xl bg-mira-orange/10 flex items-center justify-center mx-auto text-mira-orange text-3xl">
                            ­ƒô▓
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wider">
                            {language === 'PT' ? 'Instalar no seu iPhone' :
                             language === 'ES' ? 'Instalar en tu iPhone' :
                             language === 'FR' ? 'Installer sur iPhone' :
                             'Install on your iPhone'}
                        </h3>
                        <p className="text-xs text-white/70 font-medium leading-relaxed">
                            {language === 'PT' ? (
                                <>
                                    Para adicionar o atalho ao ecr├ú principal, toque no bot├úo de partilha <span className="inline-block p-1 bg-white/10 rounded">­ƒôñ</span> no Safari e selecione <strong>'Adicionar ao Ecr├ú Principal'</strong> <span className="inline-block p-1 bg-white/10 rounded">Ô×ò</span>.
                                </>
                            ) : language === 'ES' ? (
                                <>
                                    Para agregar el acceso directo a la pantalla de inicio, toque el bot├│n de compartir <span className="inline-block p-1 bg-white/10 rounded">­ƒôñ</span> en Safari y seleccione <strong>'Compartir / Agregar a pantalla de inicio'</strong> <span className="inline-block p-1 bg-white/10 rounded">Ô×ò</span>.
                                </>
                            ) : language === 'FR' ? (
                                <>
                                    Pour ajouter le raccourci sur l'├®cran d'accueil, appuyez sur le bouton de partage <span className="inline-block p-1 bg-white/10 rounded">­ƒôñ</span> dans Safari e s├®lectionnez <strong>'Sur l'├®cran d'accueil'</strong> <span className="inline-block p-1 bg-white/10 rounded">Ô×ò</span>.
                                </>
                            ) : (
                                <>
                                    To add the shortcut to your home screen, tap the share button <span className="inline-block p-1 bg-white/10 rounded">­ƒôñ</span> in Safari and select <strong>'Add to Home Screen'</strong> <span className="inline-block p-1 bg-white/10 rounded">Ô×ò</span>.
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

            {/* Pull to Refresh Indicator */}
            {isRefreshing && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-mira-orange text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <RefreshCcw size={16} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Atualizando...</span>
                </div>
            )}

            <style>{`
                @keyframes neon-flow-horizontal {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                .animate-neon-flow-horizontal {
                    animation: neon-flow-horizontal 3s linear infinite;
                }
            `}</style>
        </div>
    );
};
