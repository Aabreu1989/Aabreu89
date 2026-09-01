import { ViewType } from '../types';

export interface ResolvedChatNavigation {
  view: ViewType | null;
  params: Record<string, any>;
  isValid: boolean;
  error?: string;
}

/**
 * 🧭 MIRA CANONICAL CHAT NAVIGATION RESOLVER (V2026.GOLD)
 * 
 * Transforma deterministicamente tags semânticas do Chat [view:TARGET:TAB:LABEL]
 * no ViewType canónico e nos parâmetros contextuais exatos esperados pelos módulos de destino.
 * 
 * Regra Soberana:
 * - O destino é determinado exclusivamente por `rawTarget`, `subTabRaw` e `extraParams` (sem inferência por label de texto).
 * - Trata aliases históricos (ex: DOCUMENT_ASSISTANT -> DOCUMENTS, LOCAL_SERVICES -> SERVICES).
 * - Injeta filtros contextuais essenciais (ex: tab: 'pcd' -> quickFilter: 'pcd').
 * - Fail-safe: Rejeita destinos não reconhecidos com erro explícito, sem fallback silencioso para Home.
 */
export function resolveChatNavigation(
  rawTarget: string | undefined | null,
  subTabRaw?: string,
  extraParams?: Record<string, any>
): ResolvedChatNavigation {
  if (!rawTarget || !rawTarget.trim()) {
    return {
      view: null,
      params: {},
      isValid: false,
      error: 'Target vazio ou indefinido'
    };
  }

  const normalizedKey = rawTarget.trim().toUpperCase();
  const subTab = (subTabRaw || '').trim().toLowerCase();
  const params: Record<string, any> = { ...(extraParams || {}) };

  switch (normalizedKey) {
    case 'JOBS': {
      if (subTab === 'pcd') {
        params.tab = 'pcd';
        params.quickFilter = 'pcd';
      } else if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.JOBS,
        params,
        isValid: true
      };
    }

    case 'LEGALIZATION':
    case 'REGULARIZE':
    case 'REGULARIZATION':
    case 'JORNADA':
    case 'DOCUMENT_ASSISTANT':
    case 'DOCUMENTS': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.DOCUMENTS,
        params,
        isValid: true
      };
    }

    case 'LOCAL_SERVICES':
    case 'SERVICES':
    case 'MAP': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.MAP,
        params,
        isValid: true
      };
    }

    case 'SIMULATORS': {
      if (subTab) {
        // Normalização canónica das abas dos simuladores
        if (subTab === 'salario' || subTab === 'salary' || subTab === 'salary_outrem') {
          params.tab = 'salario';
        } else if (subTab === 'recibos' || subTab === 'salary_recibos') {
          params.tab = 'recibos';
        } else if (subTab === 'custo_vida' || subTab === 'cost') {
          params.tab = 'cost';
        } else if (subTab === 'habitacao' || subTab === 'housing' || subTab === 'housing_protection') {
          params.tab = 'habitacao';
        } else if (subTab === 'aima_ss' || subTab === 'aima' || subTab === 'aima_health') {
          params.tab = 'aima_ss';
        } else if (subTab === 'empreendedor' || subTab === 'business' || subTab === 'small_business') {
          params.tab = 'empreendedor';
        } else {
          params.tab = subTab;
        }
      }
      return {
        view: ViewType.SIMULATORS,
        params,
        isValid: true
      };
    }

    case 'COMMUNITY': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.COMMUNITY,
        params,
        isValid: true
      };
    }

    case 'LEARNING': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.LEARNING,
        params,
        isValid: true
      };
    }

    case 'HOME':
    case 'MAIN':
    case 'INICIO':
    case 'INÍCIO':
    case 'DASHBOARD': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.HOME,
        params,
        isValid: true
      };
    }

    case 'PROFILE': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.PROFILE,
        params,
        isValid: true
      };
    }

    case 'ADMIN':
    case 'ADMIN_HUB':
    case 'ADMIN_DASHBOARD': {
      if (subTab) {
        params.tab = subTab;
      }
      return {
        view: ViewType.ADMIN,
        params,
        isValid: true
      };
    }

    case 'NOTIFICATIONS': {
      return {
        view: ViewType.NOTIFICATIONS,
        params,
        isValid: true
      };
    }

    case 'MESSAGES': {
      return {
        view: ViewType.MESSAGES,
        params,
        isValid: true
      };
    }

    case 'PRIVACY': {
      return {
        view: ViewType.PRIVACY,
        params,
        isValid: true
      };
    }

    case 'COOKIES': {
      return {
        view: ViewType.COOKIES,
        params,
        isValid: true
      };
    }

    case 'PREMIOS': {
      return {
        view: ViewType.PREMIOS,
        params,
        isValid: true
      };
    }

    default: {
      console.warn(`[MIRA ChatNavigationResolver] Destino não reconhecido: "${rawTarget}"`);
      return {
        view: null,
        params: {},
        isValid: false,
        error: `Destino não mapeado: "${rawTarget}"`
      };
    }
  }
}
