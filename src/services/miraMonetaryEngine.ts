// ============================================================================
// MIRA-GOLD 2026 — MOTOR MONETÁRIO E TEMPORAL CANÓNICO (PORTÃO 3: UNIDADE 1)
// Implementação Consolidada das Fases 1 e 2 Homologadas
// ============================================================================

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE I — CONSTANTES NORMATIVAS CANÓNICAS INTEIRAS (ANO FISCAL 2026)
 * Todos os valores monetários em cêntimos inteiros e taxas em pontos base (bps).
 * ════════════════════════════════════════════════════════════════════════════
 */

// Indexante dos Apoios Sociais (IAS) 2026 (Portaria n.º 421/2025 / AT)
export const IAS_2026_CENTS = 53713; // 537,13 €

// Retribuição Mínima Mensal Garantida (RMMG) 2026
export const RMMG_2026_CENTS = 92000; // 920,00 €

// Dedução Específica Padrão do CIRS (Art. 25.º, n.º 1, al. a)
export const ART_25_SPECIFIC_DEDUCTION_2026_CENTS = 410400; // 4.104,00 €
export const ART_25_STATUTORY_MAX_IAS_MULTIPLIER_CENTS = 458709; // 8,54 × IAS = 4.587,09 €

// Teto Anual de Isenção do IRS Jovem (Artigo 12.º-B do CIRS — 55 × IAS)
export const IRS_JOVEM_ANNUAL_CAP_2026_CENTS = 2954215; // 29.542,15 €

// Segurança Social: Teto Mensal de Incidência (Artigo 163.º, n.º 5 do CRCSPSS — 12 × IAS)
export const SS_MONTHLY_CEILING_12_IAS_CENTS = 644556; // 6.445,56 €
export const SS_MAX_CAP_MONTHLY_2026_CENTS = SS_MONTHLY_CEILING_12_IAS_CENTS;

// Segurança Social: Base Mínima Contabilidade Organizada (Artigo 163.º, n.º 3 — 1,5 × IAS)
export const SS_MIN_ORGANIZED_BASE_2026_CENTS = 80570; // 805,70 €

// Segurança Social: Limiar de Isenção TCO (Artigo 157.º, n.º 1, al. a) do CRCSPSS — 4 × IAS)
export const SS_TI_LIMIT_4_IAS_2026_CENTS = 214852; // 2.148,52 €

// Segurança Social: Piso Mínimo de Contribuição Efetiva (Artigo 163.º, n.º 2 do CRCSPSS)
export const SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS = 2000; // 20,00 €
export const SS_CONTRIBUTION_FLOOR_CENTS = SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS;

// Limiar Objetivo de Dispensa de Retenção na Fonte (Artigo 101.º-B, n.º 1, al. d) do CIRS)
export const WITHHOLDING_OBJECTIVE_THRESHOLD_CENTS = 2500; // 25,00 €

// Limite Anual de Dispensa de Retenção de Início / Pequeno Volume (Art. 101.º-B, n.º 1, al. a)
export const ANNUAL_DISPENSE_LIMIT_CENTS = 1500000; // 15.000,00 €

// Taxas de Retenção na Fonte em Pontos Base (1% = 100 bps)
export const RATE_WITHHOLDING_LIBERAL_PROFESSION_BPS = 2300; // 23,00% (Art. 101.º, 1, b)
export const RATE_WITHHOLDING_OTHER_SERVICES_BPS = 1150;     // 11,50% (Art. 101.º, 1, b)
export const RATE_WITHHOLDING_IP_RIGHTS_BPS = 1650;          // 16,50% (Art. 101.º, 1, c)
export const RATE_WITHHOLDING_EBF_58A_BPS = 2000;            // 20,00%

// Taxas Contributivas de Segurança Social (Artigo 168.º, n.º 1 do CRCSPSS)
export const RATE_SS_INDEPENDENT_WORKER_BPS = 2140;          // 21,40% (Trabalhador Independente Geral)
export const RATE_SS_ENI_BPS = 2520;                         // 25,20% (ENI / Titular EIRL)

// Coeficientes de Rendimento Relevante da Segurança Social (Artigo 162.º do CRCSPSS)
export const COEFF_SS_SERVICES_BPS = 7000;                   // 70,00% (Art. 162.º, 1, a)
export const COEFF_SS_GOODS_SALES_BPS = 2000;                // 20,00% (Art. 162.º, 1, b)
export const COEFF_SS_CATERING_HOTEL_BPS = 2000;             // 20,00% (Art. 162.º, 2)
export const COEFF_SS_SUBSIDIES_GOODS_BPS = 2000;            // 20,00%
export const COEFF_SS_SUBSIDIES_SERVICES_BPS = 7000;         // 70,00%

// Limiares de Participação Social em Pontos Base (Artigo 31.º, n.º 1, al. g) do CIRS)
export const THRESHOLD_INDIVIDUAL_SHAREHOLDING_BPS = 500;     // 5,00%
export const THRESHOLD_FAMILY_SHAREHOLDING_BPS = 2500;        // 25,00%

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE II — FUNÇÕES ARITMÉTICAS MONETÁRIAS PURAS (FASE 2)
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Aplica uma taxa expressa em pontos base (bps) sobre um montante em cêntimos,
 * utilizando estritamente a fórmula canónica HALF_UP inteira:
 * floor((amountCents * rateBps + 5000) / 10000)
 */
export function applyRateBps(amountCents: number, rateBps: number): number {
  if (amountCents === 0 || rateBps === 0) return 0;
  return Math.floor((amountCents * rateBps + 5000) / 10000);
}

/**
 * Formata um valor monetário inteiro em cêntimos para a representação monetária
 * oficial em Euros (pt-PT) com 2 casas decimais e separador de milhares em ponto (.).
 */
export function formatCentsToEurosCurrency(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const euros = Math.floor(absCents / 100);
  const remainderCents = absCents % 100;
  const formattedRemainder = remainderCents.toString().padStart(2, '0');
  const formattedEuros = euros.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}${formattedEuros},${formattedRemainder} €`;
}

/**
 * Interface para resultado da avaliação de dispensa por limiar objetivo (< 25,00 €).
 */
export interface WithholdingThresholdEvaluation {
  calculatedAmountCents: number;
  isDispensedByThreshold: boolean;
  finalWithholdingCents: number;
  epistemicStatus: 'OPERATIONAL_PRACTICE_OBSERVED';
}

/**
 * Aplica a regra jurídica do limiar objetivo de dispensa (Artigo 101.º-B, n.º 1, al. d) do CIRS):
 * Se o imposto calculado for inferior a 25,00 € (2.500 cêntimos), opera dispensa de retenção.
 */
export function applyWithholdingThresholdRule(
  calculatedAmountCents: number
): WithholdingThresholdEvaluation {
  if (calculatedAmountCents < WITHHOLDING_OBJECTIVE_THRESHOLD_CENTS) {
    return {
      calculatedAmountCents,
      isDispensedByThreshold: true,
      finalWithholdingCents: 0,
      epistemicStatus: 'OPERATIONAL_PRACTICE_OBSERVED',
    };
  }

  return {
    calculatedAmountCents,
    isDispensedByThreshold: false,
    finalWithholdingCents: calculatedAmountCents,
    epistemicStatus: 'OPERATIONAL_PRACTICE_OBSERVED',
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE III — MOTOR TEMPORAL DA SEGURANÇA SOCIAL (FASE 1)
 * Artigos 145.º e 146.º do CRCSPSS e Artigo 279.º, al. c) do Código Civil.
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface CivilDate {
  year: number;
  month: number; // 1 = Janeiro, ..., 12 = Dezembro
  day: number;   // 1 a 31
}

export type ActivityEventType =
  | 'ACTIVITY_START'
  | 'ACTIVITY_CESSATION'
  | 'ACTIVITY_RESTART'
  | 'EARLY_ENROLMENT_REQUEST';

export interface ActivityDatedEvent {
  eventType: ActivityEventType;
  date: CivilDate;
}

export type EnrolmentJuridicalStatus =
  | 'FIRST_ENROLMENT_PENDING'           // Isenção inicial em curso (Art. 145.º, n.º 1 ou n.º 4)
  | 'FIRST_ENROLMENT_PRODUCED'          // Primeiro enquadramento já completou os 12 meses ou antecipou
  | 'RESTART_AFTER_PRODUCED_ENROLMENT'; // Reinício após enquadramento histórico prévio (Art. 145.º, n.º 3)

export interface EnrolmentTemporalAssessment {
  isExemptUnderInitial12Months: boolean;
  juridicalStatus: EnrolmentJuridicalStatus;
  enrolmentEffectiveDate: CivilDate;
  consumedActivityMonths: number;
  legalBasis:
    | 'ART_145_1_NORMAL_FIRST_ENROLMENT'
    | 'ART_145_4_SUSPENSION_RESUMED'
    | 'ART_145_3_RESTART_AFTER_CESSATION_EXPIRY'
    | 'ART_145_3_RESTART_SUBSEQUENT'
    | 'ART_146_EARLY_REQUEST';
}

/**
 * Retorna o número de dias de um determinado mês civil (incluindo anos bissextos).
 */
export function getDaysInCivilMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calcula o termo do prazo de 12 meses civis a contar de uma data de cessação,
 * em estrita conformidade com o Artigo 279.º, alínea c) do Código Civil.
 */
export function calculate12MonthsCivilDeadline(cessationDate: CivilDate): CivilDate {
  const targetYear = cessationDate.year + 1;
  const targetMonth = cessationDate.month;
  const maxDays = getDaysInCivilMonth(targetYear, targetMonth);
  const targetDay = Math.min(cessationDate.day, maxDays);
  return { year: targetYear, month: targetMonth, day: targetDay };
}

/**
 * Compara duas datas civis: retorna true se d1 for cronologicamente anterior ou igual a d2.
 */
export function isCivilDateOnOrBefore(d1: CivilDate, d2: CivilDate): boolean {
  if (d1.year !== d2.year) return d1.year < d2.year;
  if (d1.month !== d2.month) return d1.month < d2.month;
  return d1.day <= d2.day;
}

/**
 * Adiciona meses civis a um mês de referência e devolve o 1.º dia do mês resultante.
 */
export function addCivilMonths(year: number, month: number, monthsToAdd: number): CivilDate {
  const totalMonths = year * 12 + (month - 1) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  return { year: targetYear, month: targetMonth, day: 1 };
}

/**
 * Avalia a cronologia completa de eventos de um trabalhador independente
 * determinando o seu estatuto jurídico temporal e data de produção de efeitos.
 */
export function evaluateEnrolmentTimeline(
  events: ActivityDatedEvent[],
  assessmentDate: CivilDate
): EnrolmentTemporalAssessment {
  if (events.length === 0) {
    throw new Error('A lista de eventos de atividade não pode estar vazia.');
  }

  const sortedEvents = [...events].sort((a, b) => {
    if (a.date.year !== b.date.year) return a.date.year - b.date.year;
    if (a.date.month !== b.date.month) return a.date.month - b.date.month;
    return a.date.day - b.date.day;
  });

  const firstEvent = sortedEvents[0];
  if (firstEvent.eventType !== 'ACTIVITY_START') {
    throw new Error('O primeiro evento cronológico deve ser ACTIVITY_START.');
  }

  let consumedMonths = 0;
  let currentStartMonth: CivilDate = { ...firstEvent.date };
  let isSuspended = false;
  let cessationDate: CivilDate | null = null;
  let earlyRequestEffectiveDate: CivilDate | null = null;

  for (let i = 1; i < sortedEvents.length; i++) {
    const ev = sortedEvents[i];

    if (ev.eventType === 'EARLY_ENROLMENT_REQUEST') {
      earlyRequestEffectiveDate = addCivilMonths(ev.date.year, ev.date.month, 1);
      continue;
    }

    if (ev.eventType === 'ACTIVITY_CESSATION') {
      if (!isSuspended) {
        const startTotal = currentStartMonth.year * 12 + currentStartMonth.month;
        const endTotal = ev.date.year * 12 + ev.date.month;
        const monthsInPeriod = Math.max(0, endTotal - startTotal);
        consumedMonths += monthsInPeriod;
        isSuspended = true;
        cessationDate = { ...ev.date };
      }
    } else if (ev.eventType === 'ACTIVITY_RESTART') {
      if (isSuspended && cessationDate) {
        const deadline = calculate12MonthsCivilDeadline(cessationDate);
        const restartedWithin12Months = isCivilDateOnOrBefore(ev.date, deadline);

        if (restartedWithin12Months) {
          isSuspended = false;
          currentStartMonth = { ...ev.date };
        } else {
          return {
            isExemptUnderInitial12Months: false,
            juridicalStatus: 'RESTART_AFTER_PRODUCED_ENROLMENT',
            enrolmentEffectiveDate: { year: ev.date.year, month: ev.date.month, day: 1 },
            consumedActivityMonths: 12,
            legalBasis: 'ART_145_3_RESTART_AFTER_CESSATION_EXPIRY',
          };
        }
      }
    }
  }

  let effectiveDate: CivilDate;
  let basis: EnrolmentTemporalAssessment['legalBasis'];

  if (earlyRequestEffectiveDate) {
    effectiveDate = earlyRequestEffectiveDate;
    basis = 'ART_146_EARLY_REQUEST';
  } else if (!isSuspended) {
    const remainingMonths = Math.max(0, 12 - consumedMonths);
    effectiveDate = addCivilMonths(currentStartMonth.year, currentStartMonth.month, remainingMonths);
    basis = consumedMonths > 0 ? 'ART_145_4_SUSPENSION_RESUMED' : 'ART_145_1_NORMAL_FIRST_ENROLMENT';
  } else {
    effectiveDate = { year: 9999, month: 12, day: 31 };
    basis = 'ART_145_4_SUSPENSION_RESUMED';
  }

  const isExempt = isCivilDateOnOrBefore(assessmentDate, {
    year: effectiveDate.year,
    month: effectiveDate.month,
    day: 0,
  });

  return {
    isExemptUnderInitial12Months: isExempt,
    juridicalStatus: isExempt ? 'FIRST_ENROLMENT_PENDING' : 'FIRST_ENROLMENT_PRODUCED',
    enrolmentEffectiveDate: effectiveDate,
    consumedActivityMonths: Math.min(12, consumedMonths),
    legalBasis: basis,
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE IV — AVALIAÇÃO RÁPIDA SIMPLIFICADA PARA INTEGRAÇÃO GLOBAL
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface SocialSecurityTemporalCoverageEvaluation {
  effectiveCoverageDateIso: string;
  isFirstRegistrationEver: boolean;
  legalGround: string;
  isMonthExemptFromContributions: (year: number, month1To12: number) => boolean;
}

export function evaluateSocialSecurityTemporalStatus(
  activityStartDateIso: string,
  isFirstRegistrationEver: boolean,
  art146EarlyCoverageRequestDateIso?: string
): SocialSecurityTemporalCoverageEvaluation {
  if (!isFirstRegistrationEver) {
    return {
      effectiveCoverageDateIso: activityStartDateIso,
      isFirstRegistrationEver: false,
      legalGround: 'ENQUADRAMENTO_REGULAR_SEM_ISENCAO_TEMPORAL',
      isMonthExemptFromContributions: () => false,
    };
  }

  const [startY, startM] = activityStartDateIso.split('-').map(Number);
  let defaultEffectiveY = startY + Math.floor((startM + 12 - 1) / 12);
  let defaultEffectiveM = ((startM + 12 - 1) % 12) + 1;
  const defaultEffectiveDateIso = `${defaultEffectiveY}-${String(defaultEffectiveM).padStart(2, '0')}-01`;

  if (art146EarlyCoverageRequestDateIso) {
    const [reqY, reqM] = art146EarlyCoverageRequestDateIso.split('-').map(Number);
    let earlyY = reqY + Math.floor(reqM / 12);
    let earlyM = (reqM % 12) + 1;
    const earlyEffectiveDateIso = `${earlyY}-${String(earlyM).padStart(2, '0')}-01`;

    if (earlyEffectiveDateIso < defaultEffectiveDateIso) {
      return {
        effectiveCoverageDateIso: earlyEffectiveDateIso,
        isFirstRegistrationEver: true,
        legalGround: 'ANTECIPACAO_ART146_PRIMEIRO_DIA_MES_SEGUINTE_AO_REQUERIMENTO',
        isMonthExemptFromContributions: (y, m) => {
          const monthIso = `${y}-${String(m).padStart(2, '0')}-01`;
          return monthIso < earlyEffectiveDateIso;
        },
      };
    }
  }

  return {
    effectiveCoverageDateIso: defaultEffectiveDateIso,
    isFirstRegistrationEver: true,
    legalGround: 'PRIMEIRO_ENQUADRAMENTO_ART145_PRIMEIRO_DIA_12_MES_POSTERIOR',
    isMonthExemptFromContributions: (y, m) => {
      const monthIso = `${y}-${String(m).padStart(2, '0')}-01`;
      return monthIso < defaultEffectiveDateIso;
    },
  };
}
