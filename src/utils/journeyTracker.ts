// src/utils/journeyTracker.ts
import { User } from '../types';

export const CANONICAL_STATIONS = [
  'chegada',
  'nif',
  'niss',
  'sns',
  'emprego',
  'residencia'
] as const;

export type CanonicalStation = typeof CANONICAL_STATIONS[number];

export interface StationDetail {
  id: CanonicalStation;
  name: string;
  shortDesc: string;
  nextTip: string;
}

export const STATION_DETAILS: Record<CanonicalStation, StationDetail> = {
  chegada: {
    id: 'chegada',
    name: 'Chegada & Visto',
    shortDesc: 'Entrada legal e início da jornada MIRA em Portugal',
    nextTip: 'obtenção do NIF nas Finanças com passaporte e representante (se aplicável)'
  },
  nif: {
    id: 'nif',
    name: 'NIF (Número de Identificação Fiscal)',
    shortDesc: 'Documento fiscal indispensável para contratos e contas bancárias',
    nextTip: 'obtenção do NISS na Segurança Social'
  },
  niss: {
    id: 'niss',
    name: 'NISS (Segurança Social)',
    shortDesc: 'Inscrição para descontos e proteção de direitos laborais',
    nextTip: 'inscrição no Centro de Saúde (SNS) para obter Número de Utente'
  },
  sns: {
    id: 'sns',
    name: 'SNS (Saúde & Número de Utente)',
    shortDesc: 'Acesso pleno aos cuidados de saúde públicos no Centro de Saúde',
    nextTip: 'procura ativa de emprego e celebração de contrato de trabalho'
  },
  emprego: {
    id: 'emprego',
    name: 'Emprego & Contrato',
    shortDesc: 'Procura de emprego, celebração de contrato e direitos de trabalho',
    nextTip: 'regularização e agendamento de Autorização de Residência na AIMA'
  },
  residencia: {
    id: 'residencia',
    name: 'Residência Legal (AIMA / CPLP)',
    shortDesc: 'Título de Residência oficial ou renovação concluída',
    nextTip: 'integração plena, cidadania e consolidação de direitos em Portugal'
  }
};

/**
 * Obtém a lista de estações concluídas a partir da fonte de verdade persistida da aplicação.
 * Zero dados sensíveis: apenas chaves canónicas em minúsculas.
 */
export const getCompletedStations = (user?: User | null): CanonicalStation[] => {
  try {
    const userKey = user?.id ? `mira_completed_stations_${user.id}` : 'mira_completed_stations';
    let stored = localStorage.getItem(userKey);
    
    // Fallback para chave genérica se a do utilizador estiver vazia
    if (!stored && user?.id) {
      stored = localStorage.getItem('mira_completed_stations');
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed
          .map(s => String(s).toLowerCase().trim() as CanonicalStation)
          .filter(s => (CANONICAL_STATIONS as readonly string[]).includes(s));
      }
    }
  } catch (e) {
    console.warn('Erro ao ler completedStations do storage:', e);
  }

  return [];
};

/**
 * Atualiza o estado de conclusão de uma estação de forma atómica e notifica ouvintes locais.
 */
export const setStationCompleted = (
  station: CanonicalStation, 
  completed: boolean, 
  user?: User | null
): CanonicalStation[] => {
  const current = getCompletedStations(user);
  let updated: CanonicalStation[];

  if (completed) {
    if (!current.includes(station)) {
      updated = [...current, station];
    } else {
      updated = current;
    }
  } else {
    updated = current.filter(s => s !== station);
  }

  try {
    const userKey = user?.id ? `mira_completed_stations_${user.id}` : 'mira_completed_stations';
    localStorage.setItem(userKey, JSON.stringify(updated));
    localStorage.setItem('mira_completed_stations', JSON.stringify(updated));
    
    // Notifica outros componentes React da mesma sessão
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mira_journey_updated', { detail: { completedStations: updated } }));
    }
  } catch (e) {
    console.error('Erro ao guardar completedStations:', e);
  }

  return updated;
};

/**
 * Calcula a progressão estruturada da Linha de Metro.
 */
export const calculateJourneyProgress = (completed: string[]) => {
  const validCompleted = (completed || [])
    .map(s => String(s).toLowerCase().trim())
    .filter(s => (CANONICAL_STATIONS as readonly string[]).includes(s)) as CanonicalStation[];

  const pending = CANONICAL_STATIONS.filter(s => !validCompleted.includes(s));
  const nextFocus = pending.length > 0 ? STATION_DETAILS[pending[0]] : null;

  return {
    completed: validCompleted,
    pending,
    nextFocus,
    progressPercentage: Math.round((validCompleted.length / CANONICAL_STATIONS.length) * 100)
  };
};
