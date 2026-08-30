/**
 * 🛡️ MIRA IDENTITY MANAGER - V2026.GOLD.SOVEREIGN
 * Sincronização segura de versão e Service Workers com PRESERVAÇÃO INTEGRAL DE SESSÃO.
 */

export const initPageSDKs = async () => {
    if (typeof window !== 'undefined') {
        const win = window as any;
        win._mira_identity = 'zqoxqkyfzaywsgngiydx';
        
        // 1. Registar Service Worker para notificações em produção
        if ('serviceWorker' in navigator && !import.meta.env.DEV) {
            navigator.serviceWorker.register('/sw.js').then((registration) => {
                console.log('MIRA Service Worker registered with scope:', registration.scope);
            }).catch((error) => {
                console.error('MIRA Service Worker registration failed:', error);
            });
        }

        // 2. Limpar Caches antigos do CacheStorage do Browser
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => {
                if (!name.includes('v2026')) {
                    return caches.delete(name);
                }
                return Promise.resolve(false);
            }));
        }

        // 3. SECURE VERSION SYNC (Regra Canónica: Deploy não equivale a Logout)
        const MIRA_VERSION = "2026.GOLD.SOVEREIGN.V3";
        const currentVersion = localStorage.getItem('mira_app_version');
        
        if (currentVersion !== MIRA_VERSION) {
            console.info("🛸 MIRA VERSION UPDATE DETECTED. Sincronizando versão sem afetar credenciais de autenticação...");
            
            localStorage.setItem('mira_app_version', MIRA_VERSION);
            
            // 🛡️ CHAVES PROTEGIDAS DE AUTENTICAÇÃO E PREFERÊNCIAS CRÍTICAS
            const AUTH_KEYS_PRESERVED = new Set([
                'mira-token-v4',
                'mira_user',
                'mira_app_version',
                'mira_consent_accepted',
                'mira_language'
            ]);
            
            // Limpar apenas chaves temporárias obsoletas, preservando sessões e tokens Supabase
            Object.keys(localStorage).forEach(key => {
                if (!AUTH_KEYS_PRESERVED.has(key) && !key.startsWith('sb-') && !key.startsWith('mira-token')) {
                    localStorage.removeItem(key);
                }
            });
        }

        // 4. Limpeza de scripts legados
        if (win.OneSignal) {
           win.OneSignal = undefined;
           delete win.OneSignal;
        }
    }
};
