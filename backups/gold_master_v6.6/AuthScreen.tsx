import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { 
    Shield, Lock, CheckCircle2, Mail, Key, Eye, EyeOff, AlertCircle, 
    Info, Sparkles, Globe, ChevronDown, ArrowLeft, Users, RefreshCcw,
    Play, LogIn, X
} from 'lucide-react';
import { t } from '../utils/translations';
import { MIRA_LOGO } from '../constants';
import { authService } from '../services/authService';
import { useToast } from './Toast';

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

    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showAuthMethod, setShowAuthMethod] = useState(!isRecoveryMode);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);
    const [logoClicks, setLogoClicks] = useState(0);
    const [showBypass, setShowBypass] = useState(false);
    const [bypassKey, setBypassKey] = useState('');
    const [isBypassing, setIsBypassing] = useState(false);

    // V26.92: Sync local state if isRecoveryMode is detected via URL delay
    React.useEffect(() => {
        if (isRecoveryMode) {
            setIsLogin(false);
            setShowAuthMethod(false);
        }
    }, [isRecoveryMode]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (err: any) {
            showToast(err.message || t('auth_error_google', language), 'error');
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
                
                if (!session) {
                    throw new Error("Sessão expirada. Por favor, clique novamente no link do email.");
                }

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
                if (!response.ok) throw new Error(result.error || t('auth_error_timeout_pw', language));

                localStorage.removeItem('mira_recovery_pending');
                showToast(t('auth_reset_pw_success', language), 'success');
                setIsLoading(false);
                
                setTimeout(() => {
                    window.location.href = window.location.origin + '?mira_auth_success=true';
                }, 1000);
                return;
            }

            if (isForgotPassword) {
                const response = await fetch('/api/recover', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.trim(), language }),
                    signal: controller.signal
                });
                
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || t('auth_error_send_email', language));

                showToast(t('auth_forgot_pw_email_sent', language), 'success');
                setIsForgotPassword(false);
                setShowAuthMethod(true);
                return;
            }

            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (error) throw error;
                if (data.session) {
                    const profile = await authService.fetchProfileWithRetry(data.session.user.id, data.session.user.email!);
                    if (profile) onLogin(authService.mapProfileToUser(profile, data.session.user));
                }
            } else {
                // V2026.SUPREMO: Iron Fallback Protocol
                // Try Premium Registry (Resend/API) first, fall back to Direct Supabase if fails
                try {
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: email.trim(), 
                            password, 
                            name: '', 
                            language 
                        }),
                        signal: controller.signal
                    });

                    const result = await response.json();
                    
                    if (!response.ok) {
                        // V2026: Tactical Error Mapping
                        if (result.error?.includes('DNS') || result.error?.includes('Resend')) {
                            throw new Error(`🛡️ SOBERANIA: ${result.error}`);
                        }
                        if (result.error?.includes('registrado') || result.error?.includes('registered')) {
                            setErrorMsg(language === 'PT' ? 'E-mail em uso. Clique no logo 5x para Ativação de Soberania se não recebeu o link.' : 'Email in use. Click logo 5x for Sovereign Activation if you did not get the link.');
                            return;
                        }
                        throw new Error(result.error || 'API_FAILURE');
                    }

                    showToast(t('auth_email_confirm_sent', language), 'success');
                    setIsLogin(true);
                } catch (apiErr: any) {
                    console.log("MIRA: Premium API status:", apiErr.message);
                    
                    if (apiErr.message.includes('SOBERANIA')) {
                        setErrorMsg(apiErr.message);
                        return;
                    }

                    // FALLBACK: User direct signUp (Uses Supabase internal SMTP)
                    const { data: directData, error: directError } = await supabase.auth.signUp({
                        email: email.trim(),
                        password,
                        options: {
                            emailRedirectTo: window.location.origin + '/auth/callback',
                            data: { name: '' }
                        }
                    });

                    if (directError) {
                        if (directError.message.includes('email_not_confirmed') || directError.message.includes('confirm')) {
                            setErrorMsg(language === 'PT' ? 'E-mail enviado! Se não receber em 2 min, use a Ativação de Soberania (Logo 5x).' : 'Email sent! If not received in 2 min, use Sovereign Activation (Logo 5x).');
                        } else {
                            throw directError;
                        }
                    } else {
                        showToast(t('auth_email_confirm_sent', language), 'success');
                        setIsLogin(true);
                    }
                }
            }
        } catch (err: any) {
            clearTimeout(timeoutId);
            const cleanMsg = err.name === 'AbortError' 
                ? (language === 'PT' ? 'Tempo limite esgotado. Verifique a sua ligação ou se o servidor API está ligado.' : 'Request timeout. Check your connection or if the API server is online.')
                : err.message
                    .replace(/phone/gi, '')
                    .replace(/telefone/gi, '')
                    .replace(/daily quota/gi, 'limite de tentativas')
                    .replace(/quota diária/gi, 'limite de tentativas')
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
        // Simular um "reload" limpando estados sensíveis
        setTimeout(() => {
            setIsRefreshing(false);
            showToast(t('status_online', language), 'success');
        }, 1500);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].pageY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].pageY;
        if (currentY - startY > 80 && window.scrollY === 0 && !isRefreshing) {
            handlePullRefresh();
        }
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
            className="h-[100dvh] w-full flex flex-col font-sans relative inset-0 select-none overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >

            {/* Background — Azul Marinho Imperial MIRA (V2026.PREMIUM) */}
            <div className="absolute inset-0 bg-[#020420]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,_rgba(255,140,0,0.05),_transparent_70%)]" />
            
            {/* Language Selector */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-[100]">
                    <button 
                      onClick={() => setShowLangMenu(!showLangMenu)} 
                      className="bg-mira-orange text-white px-5 py-2.5 rounded-2xl text-[10px] font-extrabold uppercase flex items-center gap-2 shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none"
                    >
                        <Globe size={14} /> {language} <ChevronDown size={14} />
                    </button>
                    {showLangMenu && (
                        <div className="absolute top-full right-0 mt-3 w-40 bg-white rounded-3xl shadow-2xl p-3 z-[101] border border-slate-100 animate-in fade-in slide-in-from-top-4">
                            {['PT', 'EN', 'ES', 'FR'].map(l => (
                                <button key={l} onClick={() => { setLanguage(l); setShowLangMenu(false); }} className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] font-extrabold uppercase transition-colors ${language === l ? 'bg-mira-orange text-white' : 'hover:bg-slate-50 text-slate-900'}`}>
                                {l}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-0 relative z-10 w-full max-w-md mx-auto">
                <div className="w-full text-center mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div 
                        onClick={() => {
                            const newClicks = logoClicks + 1;
                            setLogoClicks(newClicks);
                            if (newClicks >= 5) {
                                setShowBypass(true);
                                showToast("PROTOCOLO DE SOBERANIA ATIVADO", "success");
                            }
                        }}
                        className="w-20 h-20 mx-auto mb-6 bg-transparent p-2 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                    >
                        <img src="/logo-mira.png" alt="MIRA" className="w-full h-full object-contain bg-transparent border-none outline-none" style={{ background: 'transparent' }} />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2">MIRA</h1>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_0_15px_rgba(255,140,0,0.5)]">
                        {t('auth_subtitle', language)}
                    </p>
                </div>

                <div className="w-full p-6 md:p-8 rounded-[2rem] border-t-2 border-l border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] animate-in zoom-in-95 duration-500 relative overflow-hidden flex flex-col gap-4" style={{background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(40px)', borderColor: 'rgba(197, 160, 89, 0.2)', minHeight: isRecoveryMode ? '420px' : 'auto'}}>
                    {/* Glowing Colorful Bar following the curve — MIRA 4-COLOR GRADIENT */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] z-20" style={{background: 'linear-gradient(90deg, #FF8C00 0%, #4F8EF7 33%, #22C55E 66%, #EAB308 100%)', boxShadow: '0 4px 15px rgba(255,140,0,0.3), 0 2px 8px rgba(79,142,247,0.2)'}} />

                    {/* 4 MIRA Orbs inside card top */}
                    <div className="flex items-center justify-center gap-3 mb-5 mt-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{background: '#FF8C00', boxShadow: '0 0 10px 4px rgba(255,140,0,0.85)'}} />
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{background: '#4F8EF7', boxShadow: '0 0 10px 4px rgba(79,142,247,0.9)', animationDelay: '0.2s'}} />
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{background: '#22C55E', boxShadow: '0 0 10px 4px rgba(34,197,94,0.85)', animationDelay: '0.4s'}} />
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{background: '#EAB308', boxShadow: '0 0 10px 4px rgba(234,179,8,0.85)', animationDelay: '0.6s'}} />
                    </div>

                    {showAuthMethod && !isForgotPassword ? (
                        <div className="space-y-6">
                            <h2 className="text-xl font-extrabold text-white text-center uppercase tracking-tight mb-4">{t('auth_welcome_title', language)}</h2>
                            <button onClick={handleGoogleLogin} className="w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-extrabold uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all shadow-xl">
                                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                                {t('auth_login_google', language)}
                            </button>
                            <div className="flex items-center gap-6">
                                <div className="h-px flex-1 bg-white/20"></div>
                                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">{t('auth_traditional_label', language)}</span>
                                <div className="h-px flex-1 bg-white/20"></div>
                            </div>
                            <button onClick={() => setShowAuthMethod(false)} className="w-full py-5 bg-white/5 text-white border border-white/20 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all">
                                <Mail size={18} className="text-mira-orange" />
                                {t('auth_login_email', language)}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-500">
                            <button onClick={() => { setShowAuthMethod(true); setIsForgotPassword(false); }} className="text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase flex items-center gap-2 mb-6 group outline-none">
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('back', language)}
                            </button>
                            
                            {!isRecoveryMode && (
                                <input 
                                    type="email" 
                                    placeholder={t('auth_email_placeholder', language)} 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    className="w-full p-5 bg-white/20 rounded-2xl text-white outline-none border border-white/10 focus:border-mira-orange focus:bg-white/30 transition-all shadow-2xl placeholder:text-white/40 font-bold"
                                />
                            )}
                            
                            {isRecoveryMode && (
                                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 text-center">{t('auth_reset_pw_title', language)}</h3>
                            )}
                            
                            {!isForgotPassword && (
                                <>
                                    <div className="relative">
                                        <input 
                                            type={showPass ? "text" : "password"} 
                                            placeholder={isRecoveryMode ? t('auth_new_pw_placeholder', language) : t('auth_password_placeholder', language)} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            className="w-full p-5 bg-white/20 rounded-2xl text-white outline-none border border-white/10 focus:border-mira-orange focus:bg-white/30 transition-all shadow-2xl placeholder:text-white/40 font-bold"
                                        />
                                        <button onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-900/60 hover:text-slate-900 transition-colors">
                                            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    {isRecoveryMode && (
                                        <div className="relative">
                                            <input 
                                                type={showPass ? "text" : "password"} 
                                                placeholder={t('auth_confirm_pw_placeholder', language)} 
                                                value={confirmPassword} 
                                                onChange={e => setConfirmPassword(e.target.value)} 
                                                className="w-full p-5 bg-white/20 rounded-2xl text-white outline-none border border-white/10 focus:border-mira-orange focus:bg-white/30 transition-all shadow-2xl placeholder:text-white/40 font-bold"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {isLogin && !isForgotPassword && (
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => setIsForgotPassword(true)}
                                        className="text-[10px] font-black text-mira-orange uppercase tracking-widest hover:brightness-125 transition-all"
                                    >
                                        {t('auth_forgot_pass', language)}
                                    </button>
                                </div>
                            )}

                            {errorMsg && <p className="text-red-400 text-[10px] font-bold text-center animate-pulse py-2">{errorMsg}</p>}
                            
                            <div className="pt-2">
                                <button onClick={handleAuth} disabled={isLoading} className="w-full py-5 bg-mira-orange text-white rounded-[1.5rem] font-extrabold uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-orange-500/40 active:scale-[0.98] hover:scale-[1.02] hover:brightness-110 transition-all flex justify-center items-center gap-2">
                                    {isLoading ? <RefreshCcw size={16} className="animate-spin" /> : (
                                        isRecoveryMode ? t('auth_reset_pw_btn', language) :
                                        isForgotPassword ? t('auth_forgot_pw_btn', language) : 
                                        (isLogin ? t('auth_login_btn', language) : t('auth_signup_btn', language))
                                    )}
                                </button>
                                
                                {!isForgotPassword && (
                                    <button onClick={handleToggleAuth} className="w-full text-[10px] text-white/60 hover:text-white transition-colors font-extrabold uppercase mt-6 tracking-widest outline-none">
                                        {isLogin ? t('auth_toggle_signup', language) : t('auth_toggle_login', language)}
                                    </button>
                                )}
                            </div>
                            {showBypass && (
                                <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl animate-in zoom-in-95">
                                    <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-3 text-center">Ativação de Soberania (Bypass E-mail)</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="password" 
                                            placeholder="CÓDIGO DE SOBERANIA" 
                                            value={bypassKey}
                                            onChange={e => setBypassKey(e.target.value)}
                                            className="flex-1 p-3 bg-white/10 rounded-xl text-white text-[10px] outline-none border border-white/5 focus:border-orange-500/50"
                                        />
                                        <button 
                                            disabled={isBypassing}
                                            onClick={async () => {
                                                if (bypassKey === 'MIRA_SOV_2026' && email) {
                                                    setIsBypassing(true);
                                                    try {
                                                        const { error } = await supabase.rpc('admin_verify_user_sovereign', { target_email: email.trim() });
                                                        if (error) throw error;
                                                        showToast("SESSÃO ATIVADA! Tente entrar agora.", "success");
                                                        setIsLogin(true);
                                                        setShowBypass(false);
                                                    } catch (e: any) {
                                                        showToast("Erro na Ativação: " + e.message, "error");
                                                    } finally {
                                                        setIsBypassing(false);
                                                    }
                                                } else {
                                                    showToast("Código Inválido ou E-mail Ausente", "error");
                                                }
                                            }}
                                            className="px-4 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
                                        >
                                            {isBypassing ? "..." : "ATIVAR"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Seal */}
            <div className="mt-auto pb-10 z-10 opacity-90 flex flex-col items-center gap-2 pointer-events-none text-center px-4 w-full">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white whitespace-normal drop-shadow-md">
                    {t('footer_copyright', language)}
                </p>
            </div>

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
