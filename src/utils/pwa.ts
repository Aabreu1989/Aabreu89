export interface PWAState {
  isInstallable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
}

let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('mira-pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('mira-pwa-installed'));
    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const platform = isMobile ? 'mobile' : 'desktop';
      let userId = 'anonymous';
      const savedUser = localStorage.getItem('mira_user');
      if (savedUser) {
        userId = JSON.parse(savedUser).id;
      }
      import('../services/analyticsService').then(({ analytics }) => {
        analytics.track('pwa_install', userId, 'pwa', { platform, source: 'appinstalled_event' });
      });
    } catch (e) {
      console.error('Failed to track PWA appinstalled event', e);
    }
  });
}

export const pwaService = {
  getDeferredPrompt: () => deferredPrompt,
  
  isInstallable: () => {
    return !!deferredPrompt;
  },

  isStandalone: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
  },

  isIOS: () => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  },

  isSafari: () => {
    if (typeof window === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  triggerInstall: async (): Promise<'accepted' | 'dismissed' | 'not-supported'> => {
    if (!deferredPrompt) {
      return 'not-supported';
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const platform = isMobile ? 'mobile' : 'desktop';
        let userId = 'anonymous';
        const savedUser = localStorage.getItem('mira_user');
        if (savedUser) {
          userId = JSON.parse(savedUser).id;
        }
        import('../services/analyticsService').then(({ analytics }) => {
          analytics.track('pwa_install', userId, 'pwa', { platform, source: 'button_prompt' });
        });
      } catch (e) {
        console.error('Failed to track PWA install accepted', e);
      }
      return 'accepted';
    } else {
      return 'dismissed';
    }
  }
};
