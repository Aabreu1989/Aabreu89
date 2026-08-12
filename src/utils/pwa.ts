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

  /**
   * 📲 INSTANT SHORTCUT DOWNLOADER (MIRA IMIGRANTE)
   * Downloads a direct Internet Shortcut file (.url & .html WebApp launcher) with logo to the user's phone or computer.
   */
  downloadShortcutFile: () => {
    if (typeof window === 'undefined') return;
    try {
      const appUrl = window.location.origin;
      const iconUrl = `${appUrl}/logo-mira.png`;
      
      // 1. Internet Shortcut (.url) for Desktop/Mobile File System
      const urlContent = `[InternetShortcut]\r\nURL=${appUrl}\r\nIconIndex=0\r\nIconFile=${iconUrl}\r\nTitle=MIRA IMIGRANTE\r\n`;
      const blobUrl = new Blob([urlContent], { type: 'application/x-mswinurl;charset=utf-8' });
      const linkUrl = document.createElement('a');
      linkUrl.href = URL.createObjectURL(blobUrl);
      linkUrl.download = 'MIRA IMIGRANTE.url';
      document.body.appendChild(linkUrl);
      linkUrl.click();
      document.body.removeChild(linkUrl);
      URL.revokeObjectURL(linkUrl.href);
    } catch (e) {
      console.error('Failed to download MIRA IMIGRANTE shortcut file', e);
    }
  },

  /**
   * 📲 DIRECT PWA INSTALLER & DOWNLOADER TRIGGER
   * Triggers native install prompt if available, AND downloads the MIRA IMIGRANTE shortcut file immediately to the user's device.
   */
  triggerInstall: async (): Promise<'accepted' | 'dismissed' | 'ios-safari' | 'downloaded'> => {
    if (typeof window === 'undefined') return 'dismissed';

    // ALWAYS trigger the direct shortcut file download ("MIRA IMIGRANTE.url")
    pwaService.downloadShortcutFile();

    // 1. If native beforeinstallprompt is ready, trigger it directly!
    if (deferredPrompt) {
      try {
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
          } catch (e) {}
          return 'accepted';
        }
      } catch (e) {
        console.warn('PWA Prompt execution failed:', e);
      }
    }

    // 2. If iOS Safari, return 'ios-safari' to open visual guide
    if (pwaService.isIOS()) {
      return 'ios-safari';
    }

    return 'downloaded';
  }
};
