export interface PWAState {
  isInstallable: boolean;
  isStandalone: boolean;
  isIOS: boolean;
}

export type PWAInstallResult =
  | 'already_installed'
  | 'prompt_accepted'
  | 'prompt_dismissed'
  | 'ios_instructions'
  | 'manual_instructions';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

type MiraPwaWindowState = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  listenerAttached: boolean;
};

const WINDOW_STATE_KEY = '__MIRA_PWA_STATE__';

const getWindowState = (): MiraPwaWindowState | null => {
  if (typeof window === 'undefined') return null;

  const existing = (window as Window & {
    [WINDOW_STATE_KEY]?: MiraPwaWindowState;
  })[WINDOW_STATE_KEY];

  if (existing) {
    return existing;
  }

  const state: MiraPwaWindowState = {
    deferredPrompt: null,
    listenerAttached: false,
  };

  (window as Window & {
    [WINDOW_STATE_KEY]?: MiraPwaWindowState;
  })[WINDOW_STATE_KEY] = state;

  return state;
};

/**
 * Inicializa o listener do beforeinstallprompt.
 *
 * O estado é guardado em window para sobreviver a recriações
 * do módulo pelo Vite/HMR e impedir que diferentes instâncias
 * do módulo percam o deferredPrompt.
 */
const initializePwaListener = (): void => {
  if (typeof window === 'undefined') return;

  const state = getWindowState();

  if (!state || state.listenerAttached) {
    return;
  }

  state.listenerAttached = true;

  window.addEventListener('beforeinstallprompt', (event: Event) => {
    const installEvent = event as BeforeInstallPromptEvent;

    event.preventDefault();

    state.deferredPrompt = installEvent;

    window.dispatchEvent(new CustomEvent('mira-pwa-installable'));

    console.info('[MIRA PWA] beforeinstallprompt capturado.');
  });

  window.addEventListener('appinstalled', () => {
    state.deferredPrompt = null;

    try {
      localStorage.setItem('mira_pwa_installed', 'true');
    } catch {
      // localStorage indisponível
    }

    window.dispatchEvent(new CustomEvent('mira-pwa-installed'));

    try {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      const platform = isMobile ? 'mobile' : 'desktop';

      let userId = 'anonymous';

      const savedUser = localStorage.getItem('mira_user');

      if (savedUser) {
        try {
          userId = JSON.parse(savedUser).id;
        } catch {
          // Mantém anonymous se o objeto estiver inválido
        }
      }

      import('../services/analyticsService')
        .then(({ analytics }) => {
          analytics.track('pwa_install', userId, 'pwa', {
            platform,
            source: 'appinstalled_event',
          });
        })
        .catch(() => {
          // Analytics não pode impedir a instalação
        });
    } catch (error) {
      console.error(
        '[MIRA PWA] Falha ao registar evento appinstalled:',
        error
      );
    }

    console.info('[MIRA PWA] Aplicação instalada.');
  });
};

/**
 * Inicialização imediata.
 */
initializePwaListener();

export const pwaService = {
  /**
   * Devolve o deferredPrompt atualmente capturado.
   */
  getDeferredPrompt: (): BeforeInstallPromptEvent | null => {
    const state = getWindowState();

    return state?.deferredPrompt ?? null;
  },

  /**
   * Indica se o Chrome/Edge/etc. disponibilizou o prompt nativo.
   */
  isInstallable: (): boolean => {
    const state = getWindowState();

    return !!state?.deferredPrompt;
  },

  /**
   * Verifica se a aplicação já está em modo standalone.
   */
  isStandalone: (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  },

  /**
   * Deteta iOS.
   */
  isIOS: (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    );
  },

  /**
   * Deteta Safari.
   */
  isSafari: (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  /**
   * Decide se o modal diário deve ser mostrado.
   *
   * Toda a regra fica centralizada aqui.
   */
  shouldShowDailyModal: (): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }

    if (pwaService.isStandalone()) {
      return false;
    }

    const todayStr = new Date().toDateString();

    const lastInstallModalDate = localStorage.getItem(
      'mira_pwa_install_modal_shown_date'
    );

    const isAppInstalled =
      localStorage.getItem('mira_pwa_installed') === 'true';

    if (isAppInstalled || lastInstallModalDate === todayStr) {
      return false;
    }

    return true;
  },

  /**
   * Marca o modal diário como mostrado.
   */
  markDailyModalShown: (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    const todayStr = new Date().toDateString();

    localStorage.setItem(
      'mira_pwa_install_modal_shown_date',
      todayStr
    );
  },

  /**
   * Download explícito do atalho .url para desktop.
   *
   * IMPORTANTE:
   * Esta função NÃO faz parte do processo normal de instalação PWA.
   */
  downloadShortcut: (): void => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const appUrl = window.location.origin;
      const iconUrl = `${appUrl}/logo-mira.png`;

      const urlContent =
        `[InternetShortcut]\r\n` +
        `URL=${appUrl}\r\n` +
        `IconIndex=0\r\n` +
        `IconFile=${iconUrl}\r\n` +
        `Title=MIRA IMIGRANTE\r\n`;

      const blob = new Blob([urlContent], {
        type: 'application/x-mswinurl;charset=utf-8',
      });

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = 'MIRA IMIGRANTE.url';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);

      console.info('[MIRA PWA] Atalho .url descarregado.');
    } catch (error) {
      console.error(
        '[MIRA PWA] Falha ao descarregar o atalho:',
        error
      );
    }
  },

  /**
   * PONTO ÚNICO E SOBERANO DE INSTALAÇÃO.
   *
   * Fluxo:
   *
   * 1. Já instalado
   * 2. Prompt nativo disponível
   * 3. iOS
   * 4. Instruções manuais
   */
  install: async (): Promise<PWAInstallResult> => {
    if (typeof window === 'undefined') {
      return 'manual_instructions';
    }

    if (pwaService.isStandalone()) {
      console.info('[MIRA PWA] Já está instalada.');

      return 'already_installed';
    }

    const state = getWindowState();
    const deferredPrompt = state?.deferredPrompt ?? null;

    console.info('[MIRA PWA] Pedido de instalação:', {
      hasDeferredPrompt: !!deferredPrompt,
      isStandalone: pwaService.isStandalone(),
      isIOS: pwaService.isIOS(),
    });

    /**
     * PRIORIDADE 1:
     * Prompt nativo do Chrome/Edge/etc.
     */
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          state!.deferredPrompt = null;

          try {
            localStorage.setItem('mira_pwa_installed', 'true');
          } catch {
            // localStorage indisponível
          }

          try {
            const isMobile =
              /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
              );

            const platform = isMobile ? 'mobile' : 'desktop';

            let userId = 'anonymous';

            const savedUser = localStorage.getItem('mira_user');

            if (savedUser) {
              try {
                userId = JSON.parse(savedUser).id;
              } catch {
                // Mantém anonymous
              }
            }

            import('../services/analyticsService')
              .then(({ analytics }) => {
                analytics.track('pwa_install', userId, 'pwa', {
                  platform,
                  source: 'button_prompt',
                });
              })
              .catch(() => {
                // Analytics não pode impedir a instalação
              });
          } catch {
            // Analytics não pode impedir a instalação
          }

          console.info('[MIRA PWA] Prompt aceite.');

          return 'prompt_accepted';
        }

        console.info('[MIRA PWA] Prompt recusado.');

        return 'prompt_dismissed';
      } catch (error) {
        console.warn(
          '[MIRA PWA] Falha na execução do prompt nativo:',
          error
        );

        /**
         * O prompt pode tornar-se inválido depois de uma tentativa.
         * Limpamos apenas o estado atual.
         */
        state!.deferredPrompt = null;
      }
    }

    /**
     * PRIORIDADE 2:
     * iOS/Safari não disponibiliza beforeinstallprompt.
     */
    if (pwaService.isIOS()) {
      console.info('[MIRA PWA] iOS: apresentar instruções.');

      return 'ios_instructions';
    }

    /**
     * PRIORIDADE 3:
     * Browser sem prompt nativo disponível.
     */
    console.info(
      '[MIRA PWA] Nenhum prompt nativo disponível. Instruções manuais.'
    );

    return 'manual_instructions';
  },

  /**
   * Wrapper de compatibilidade para código legado.
   */
  triggerInstall: async (): Promise<
    'accepted' | 'dismissed' | 'ios-safari' | 'downloaded'
  > => {
    const result = await pwaService.install();

    if (result === 'prompt_accepted') {
      return 'accepted';
    }

    if (result === 'ios_instructions') {
      return 'ios-safari';
    }

    if (result === 'prompt_dismissed') {
      return 'dismissed';
    }

    return 'downloaded';
  },
};
