/**
 * 🛡️ MIRA IDENTITY MANAGER - V26.33
 * OPERAÇÃO "GHOST BUSTER": Limpeza nuclear de Service Workers e Caches.
 */

export const initPageSDKs = async () => {
    
    const PROJECT_REF = "ychwhxkxsxmuvabxlyjn";
    
    if (typeof window !== 'undefined') {
        const win = window as any;
        win._mira_identity = PROJECT_REF;
        
        // 1. Register Service Worker for Push Notifications (V2026)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then((registration) => {
                console.log('MIRA Service Worker registered with scope:', registration.scope);
            }).catch((error) => {
                console.error('MIRA Service Worker registration failed:', error);
            });
        }

        // 2. Limpar Caches do Browser
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // 3. NUCLEAR VERSION SYNC (Force Refresh on old deployments)
        const MIRA_VERSION = "18.1.0-GOLD-NUCLEAR";
        const currentVersion = localStorage.getItem('mira_app_version');
        
        if (currentVersion !== MIRA_VERSION) {
            console.warn("🛸 MIRA VERSION DRIFT DETECTED. Cleaning Storage...");
            
            // 🛑 NUCLEAR PRESERVATION: Set version first
            localStorage.setItem('mira_app_version', MIRA_VERSION);
            
            // Clean everything EXCEPT the version
            Object.keys(localStorage).forEach(key => {
                if (key !== 'mira_app_version') {
                    localStorage.removeItem(key);
                }
            });
            sessionStorage.clear();
            
            // 🛸 FLIGHT CONTROL: Force Hard Reload
            // window.location.reload(); 
            return;
        }

        // 4. Matar OneSignal
        if (win.OneSignal) {
           win.OneSignal = undefined;
           delete win.OneSignal;
        }

    }
};
