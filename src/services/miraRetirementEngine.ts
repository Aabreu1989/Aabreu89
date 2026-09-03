/**
 * 🏛️ MIRA RETIREMENT ENGINE (Segurança Social & Totalização Internacional)
 * ========================================================================
 * Motor canónico de cálculo de Pensão de Velhice / Reforma da Segurança Social
 * em conformidade estrita com o Decreto-Lei n.º 187/2007, Regulamentos Europeus
 * (CE 883/2004 e 987/2009), Acordos Bilaterais e a Portaria n.º 291/2024/1.
 * 
 * Regras Soberanas:
 * 1. Prazo de Garantia Unificado: Elegibilidade aberta se (N_pt + N_ext) >= 15 anos.
 * 2. Carreira Total Unificada: N_total = N_pt + N_ext.
 * 3. Taxa Teórica Global: Baseada na carreira total unificada (2% a 2,3% por ano).
 * 4. Pensão Teórica Integral: RR * Taxa Teórica Global.
 * 5. Pro Rata Temporis: Pensão Real PT = Pensão Teórica Integral * (N_pt / N_total).
 * 6. Idade Normal de Reforma 2026: 66 anos e 9 meses (Portaria n.º 291/2024/1).
 * 7. Bonificação Carreira Longa: -4 meses por cada ano civil acima dos 40 aos 65 anos.
 * 8. Fator de Sustentabilidade: 1.0 (0% de corte) na idade legal ou pessoal bonificada.
 * 9. Trava Pensão na Hora: Bloqueio absoluto se N_ext > 0 (exige instrução bilateral).
 * 10. Salvaguarda de Mínimos: Pro rata internacional não recebe mínimo nacional automático.
 */

export interface RetirementLegalAgeEntry {
  year: number;
  years: number;
  months: number;
  decimalAge: number;
  label: string;
}

/**
 * Tabela Oficial de Idades Normais de Reforma (Portarias anuais do MTSSS)
 */
export const RETIREMENT_LEGAL_AGES: Record<number, RetirementLegalAgeEntry> = {
  2024: { year: 2024, years: 66, months: 4, decimalAge: 66 + 4 / 12, label: '66 anos e 4 meses' },
  2025: { year: 2025, years: 66, months: 7, decimalAge: 66 + 7 / 12, label: '66 anos e 7 meses' },
  2026: { year: 2026, years: 66, months: 9, decimalAge: 66 + 9 / 12, label: '66 anos e 9 meses' }
};

export const DEFAULT_REFERENCE_YEAR = 2026;
export const DEFAULT_SUSTAINABILITY_CUT_2026_PCT = 15.8; // Fator de sustentabilidade para reformas antecipadas em 2026

export interface MiraRetirementInput {
  ageYears: number;
  ageMonths?: number;
  yearsContributedPT: number;
  yearsContributedForeign?: number;
  referenceMonthlyEarnings: number;
  referenceYear?: number;
  profile?: 'standard' | 'expat' | 'long_career' | 'freelance';
  yearsContributedAtAge65?: number; // Para cálculo preciso de bonificação de carreira longa aos 65 anos
  applyPostponementBonus?: boolean; // Se true, aplica bonificação de adiamento além da idade legal (Art. 38.º)
}

export type RetirementStatus = 
  | 'eligible_normal'      // Atingiu idade legal/pessoal sem penalização
  | 'eligible_long_career' // Carreira muito longa (>= 40 ou 42 anos) sem penalização
  | 'eligible_early'       // Antecipada com cortes legais
  | 'not_eligible_years'   // Menos de 15 anos no total unificado
  | 'too_young';           // Menos de 60 anos (limiar mínimo de antecipação)

export interface MiraRetirementAssessment {
  status: RetirementStatus;
  isEligible: boolean;
  totalUnifiedYears: number;
  yearsPT: number;
  yearsForeign: number;
  isInternationalMixedCareer: boolean;
  
  // Idades
  legalRetirementAgeLabel: string;
  legalRetirementAgeDecimal: number;
  personalRetirementAgeLabel: string;
  personalRetirementAgeDecimal: number;
  longCareerBonusMonths: number;
  userAgeDecimal: number;
  ageDiffMonths: number; // Meses de antecipação em relação à idade pessoal

  // Cálculos Teóricos & Pro Rata
  accrualAnnualPct: number; // ex: 2.0%
  theoreticalGlobalAccrualPct: number; // ex: 78.0% (39 * 2%)
  theoreticalFullMonthlyPension: number; // ex: € 780,00
  proRataRatio: number; // ex: 9 / 39 = 0.230769...
  proRataRatioLabel: string; // ex: "9 / 39 anos"
  realPortugueseBaseMonthlyPension: number; // ex: € 180,00 (antes de cortes/bónus de idade)
  
  // Cortes e Bónus de Idade
  anticipationPenaltyPct: number; // 0.5% por mês antecipado
  anticipationPenaltyEuros: number;
  sustainabilityFactorCutPct: number; // 0% ou 15.8%
  sustainabilityFactorCutEuros: number;
  bonusForPostponementPct: number;
  bonusForPostponementEuros: number;
  totalCutsEuros: number;

  // Pensão Final Efetiva a Pagar por Portugal
  finalRealPortugueseMonthlyPension: number; // Valor líquido de cortes a pagar por PT
  projectedAtNormalAgeMonthlyPension: number; // Se aguardar até à idade normal

  // Mínimos Nacionais e Condicionantes Legais
  nationalMinimumThreshold: number;
  isNationalMinimumApplied: boolean;
  
  // Avisos Normativos e Trava Pensão na Hora
  isInstantPensionEligible: boolean; // FALSE se yearsForeign > 0
  bilateralNoticeRequired: boolean; // TRUE se yearsForeign > 0
  bilateralNoticeText: string;
  minimumPensionNoticeText: string;
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Determina a idade normal de reforma para o ano civil especificado
 */
export function getLegalRetirementAge(year: number = DEFAULT_REFERENCE_YEAR): RetirementLegalAgeEntry {
  return RETIREMENT_LEGAL_AGES[year] || RETIREMENT_LEGAL_AGES[DEFAULT_REFERENCE_YEAR];
}

/**
 * Calcula o recuo da idade pessoal de reforma por carreira longa (Art. 20.º, n.º 3 do DL 187/2007)
 */
export function calculatePersonalRetirementAge(
  legalAgeDecimal: number,
  userAgeDecimal: number,
  totalYears: number,
  yearsAt65Input?: number
): { personalAgeDecimal: number; bonusMonths: number; label: string } {
  let yearsAt65 = yearsAt65Input;
  if (yearsAt65 === undefined) {
    if (userAgeDecimal >= 65) {
      const yearsAbove65 = Math.floor(userAgeDecimal - 65);
      yearsAt65 = Math.max(0, totalYears - yearsAbove65);
    } else {
      const yearsUntil65 = Math.floor(65 - userAgeDecimal);
      yearsAt65 = totalYears + yearsUntil65;
    }
  }

  let bonusMonths = 0;
  if (yearsAt65 > 40) {
    const excessYears = yearsAt65 - 40;
    bonusMonths = excessYears * 4;
  }

  const bonusYearsDecimal = bonusMonths / 12;
  let personalAgeDecimal = legalAgeDecimal - bonusYearsDecimal;
  if (personalAgeDecimal < 65) {
    personalAgeDecimal = 65;
  }

  const pYears = Math.floor(personalAgeDecimal);
  const pMonths = Math.round((personalAgeDecimal - pYears) * 12);
  const label = `${pYears} anos e ${pMonths} meses`;

  return { personalAgeDecimal, bonusMonths, label };
}

/**
 * Determina a taxa anual de formação da pensão (Artigo 29.º e 30.º do DL 187/2007)
 */
export function determineAnnualAccrualRatePct(totalUnifiedYears: number): number {
  if (totalUnifiedYears <= 20) return 2.3;
  if (totalUnifiedYears <= 30) return 2.25;
  if (totalUnifiedYears <= 40) return 2.0;
  return 2.0;
}

/**
 * Motor Principal Canónico de Reforma (DL 187/2007)
 */
export function calculateMiraRetirement(input: MiraRetirementInput): MiraRetirementAssessment {
  const refYear = input.referenceYear || DEFAULT_REFERENCE_YEAR;
  const legalAgeEntry = getLegalRetirementAge(refYear);
  const legalAgeDecimal = legalAgeEntry.decimalAge;
  const legalAgeLabel = legalAgeEntry.label;

  const ageYears = Math.max(0, input.ageYears || 0);
  const ageMonths = Math.max(0, input.ageMonths || 0);
  const userAgeDecimal = ageYears + ageMonths / 12;

  const ptYears = Math.max(0, input.yearsContributedPT || 0);
  const foreignYears = Math.max(0, input.yearsContributedForeign || 0);
  const totalUnifiedYears = ptYears + foreignYears;
  const isInternationalMixedCareer = foreignYears > 0;
  const salary = Math.max(0, input.referenceMonthlyEarnings || 0);

  // 1. Verificação do Prazo de Garantia (Art. 19.º DL 187/2007 e Totalização Internacional)
  const isEligibleForYears = totalUnifiedYears >= 15;
  const isTooYoung = userAgeDecimal < 60 && input.profile !== 'long_career';

  // 2. Bonificação de Idade por Carreira Longa
  const { personalAgeDecimal, bonusMonths: longCareerBonusMonths, label: personalRetirementAgeLabel } = 
    calculatePersonalRetirementAge(legalAgeDecimal, userAgeDecimal, totalUnifiedYears, input.yearsContributedAtAge65);

  // 3. Taxa Anual e Taxa Teórica Global
  const accrualAnnualPct = determineAnnualAccrualRatePct(totalUnifiedYears);
  const theoreticalGlobalAccrualPct = roundToCents(Math.min(80, totalUnifiedYears * accrualAnnualPct));

  // 4. Pensão Teórica Integral (Pensão Global Teórica sobre todos os anos)
  const theoreticalFullMonthlyPension = roundToCents(salary * (theoreticalGlobalAccrualPct / 100));

  // 5. Aplicação Estrita do Pro Rata Temporis (UMA ÚNICA VEZ sobre a Pensão Teórica Integral)
  const proRataRatio = totalUnifiedYears > 0 ? ptYears / totalUnifiedYears : 0;
  const proRataRatioLabel = `${ptYears} / ${totalUnifiedYears} anos`;
  const realPortugueseBaseMonthlyPension = roundToCents(theoreticalFullMonthlyPension * proRataRatio);

  // 6. Projeção na Idade Normal (Sem cortes de antecipação)
  const projectedAtNormalAgeMonthlyPension = realPortugueseBaseMonthlyPension;

  // Se não atingiu prazo de garantia de 15 anos
  if (!isEligibleForYears) {
    return buildNonEligibleAssessment({
      status: 'not_eligible_years',
      totalUnifiedYears,
      yearsPT: ptYears,
      yearsForeign: foreignYears,
      isInternationalMixedCareer,
      legalAgeLabel,
      legalAgeDecimal,
      personalRetirementAgeLabel,
      personalAgeDecimal,
      userAgeDecimal,
      accrualAnnualPct,
      theoreticalGlobalAccrualPct,
      theoreticalFullMonthlyPension,
      proRataRatio,
      proRataRatioLabel,
      realPortugueseBaseMonthlyPension,
      projectedAtNormalAgeMonthlyPension
    });
  }

  // Se tem menos de 60 anos
  if (isTooYoung) {
    return buildNonEligibleAssessment({
      status: 'too_young',
      totalUnifiedYears,
      yearsPT: ptYears,
      yearsForeign: foreignYears,
      isInternationalMixedCareer,
      legalAgeLabel,
      legalAgeDecimal,
      personalRetirementAgeLabel,
      personalAgeDecimal,
      userAgeDecimal,
      accrualAnnualPct,
      theoreticalGlobalAccrualPct,
      theoreticalFullMonthlyPension,
      proRataRatio,
      proRataRatioLabel,
      realPortugueseBaseMonthlyPension,
      projectedAtNormalAgeMonthlyPension
    });
  }

  // 7. Avaliação de Idade e Fatores de Penalização / Bónus
  let status: RetirementStatus;
  let anticipationPenaltyPct = 0;
  let sustainabilityFactorCutPct = 0;
  let bonusForPostponementPct = 0;

  const isLongCareerExemption = (totalUnifiedYears >= 42 && userAgeDecimal >= 60) || 
                               (totalUnifiedYears >= 40 && userAgeDecimal >= 60 && input.profile === 'long_career');

  const ageDiffMonths = Math.max(0, Math.ceil((personalAgeDecimal - userAgeDecimal) * 12));
  const monthsAfterPersonalAge = Math.max(0, Math.floor((userAgeDecimal - personalAgeDecimal) * 12));

  if (isLongCareerExemption) {
    status = 'eligible_long_career';
    anticipationPenaltyPct = 0;
    sustainabilityFactorCutPct = 0;
  } else if (userAgeDecimal >= personalAgeDecimal) {
    status = 'eligible_normal';
    anticipationPenaltyPct = 0;
    sustainabilityFactorCutPct = 0;
    if (input.applyPostponementBonus && monthsAfterPersonalAge > 0) {
      bonusForPostponementPct = Math.min(20, monthsAfterPersonalAge * (1 / 14));
    }
  } else {
    status = 'eligible_early';
    anticipationPenaltyPct = Math.min(60, ageDiffMonths * 0.5);
    sustainabilityFactorCutPct = DEFAULT_SUSTAINABILITY_CUT_2026_PCT;
  }

  // 8. Cálculo Monetário de Cortes e Bónus
  const sustainabilityMultiplier = 1 - sustainabilityFactorCutPct / 100;
  const anticipationMultiplier = 1 - anticipationPenaltyPct / 100;
  const bonusMultiplier = 1 + bonusForPostponementPct / 100;

  const afterSustainability = realPortugueseBaseMonthlyPension * sustainabilityMultiplier;
  const sustainabilityFactorCutEuros = roundToCents(realPortugueseBaseMonthlyPension - afterSustainability);
  
  const finalCalculated = afterSustainability * anticipationMultiplier * bonusMultiplier;
  const anticipationPenaltyEuros = roundToCents(afterSustainability - (afterSustainability * anticipationMultiplier));
  const bonusForPostponementEuros = roundToCents(finalCalculated - (afterSustainability * anticipationMultiplier));
  const totalCutsEuros = roundToCents(realPortugueseBaseMonthlyPension - finalCalculated);

  let finalRealPortugueseMonthlyPension = roundToCents(Math.max(0, finalCalculated));

  // 9. Pensão Mínima Nacional e Salvaguarda Pro Rata
  const minThreshold = ptYears >= 31 ? 509.26 : ptYears >= 20 ? 462.06 : 438.81;
  let isNationalMinimumApplied = false;

  if (!isInternationalMixedCareer && ptYears >= 15) {
    if (finalRealPortugueseMonthlyPension < minThreshold) {
      finalRealPortugueseMonthlyPension = minThreshold;
      isNationalMinimumApplied = true;
    }
  }

  // 10. Avisos Normativos e Trava da Pensão na Hora
  const isInstantPensionEligible = !isInternationalMixedCareer;
  const bilateralNoticeRequired = isInternationalMixedCareer;
  const bilateralNoticeText = isInternationalMixedCareer
    ? "Processos com totalização de períodos no estrangeiro exigem instrução bilateral obrigatória (ex.: Formulário I/PT 1 para o Brasil, Modelo E205 na União Europeia ou formulários dos respetivos acordos) e validação manual entre os organismos de ligação, não sendo elegíveis para atribuição automática em 24h ('Pensão na Hora')."
    : "";

  const minimumPensionNoticeText = isInternationalMixedCareer
    ? "Atenção: A garantia do valor integral das pensões mínimas nacionais não se aplica automaticamente a pensões calculadas por pro rata internacional. O complemento social depende de prova rigorosa de recursos e condição de residência em Portugal."
    : "";

  return {
    status,
    isEligible: true,
    totalUnifiedYears,
    yearsPT: ptYears,
    yearsForeign: foreignYears,
    isInternationalMixedCareer,
    legalRetirementAgeLabel: legalAgeLabel,
    legalRetirementAgeDecimal: legalAgeDecimal,
    personalRetirementAgeLabel,
    personalRetirementAgeDecimal: personalAgeDecimal,
    longCareerBonusMonths,
    userAgeDecimal,
    ageDiffMonths,
    accrualAnnualPct,
    theoreticalGlobalAccrualPct,
    theoreticalFullMonthlyPension,
    proRataRatio,
    proRataRatioLabel,
    realPortugueseBaseMonthlyPension,
    anticipationPenaltyPct,
    anticipationPenaltyEuros,
    sustainabilityFactorCutPct,
    sustainabilityFactorCutEuros,
    bonusForPostponementPct: roundToCents(bonusForPostponementPct),
    bonusForPostponementEuros,
    totalCutsEuros: Math.max(0, totalCutsEuros),
    finalRealPortugueseMonthlyPension,
    projectedAtNormalAgeMonthlyPension,
    nationalMinimumThreshold: minThreshold,
    isNationalMinimumApplied,
    isInstantPensionEligible,
    bilateralNoticeRequired,
    bilateralNoticeText,
    minimumPensionNoticeText
  };
}

function buildNonEligibleAssessment(params: {
  status: RetirementStatus;
  totalUnifiedYears: number;
  yearsPT: number;
  yearsForeign: number;
  isInternationalMixedCareer: boolean;
  legalAgeLabel: string;
  legalAgeDecimal: number;
  personalRetirementAgeLabel: string;
  personalAgeDecimal: number;
  userAgeDecimal: number;
  accrualAnnualPct: number;
  theoreticalGlobalAccrualPct: number;
  theoreticalFullMonthlyPension: number;
  proRataRatio: number;
  proRataRatioLabel: string;
  realPortugueseBaseMonthlyPension: number;
  projectedAtNormalAgeMonthlyPension: number;
}): MiraRetirementAssessment {
  const isMix = params.isInternationalMixedCareer;
  return {
    status: params.status,
    isEligible: false,
    totalUnifiedYears: params.totalUnifiedYears,
    yearsPT: params.yearsPT,
    yearsForeign: params.yearsForeign,
    isInternationalMixedCareer: isMix,
    legalRetirementAgeLabel: params.legalAgeLabel,
    legalRetirementAgeDecimal: params.legalAgeDecimal,
    personalRetirementAgeLabel: params.personalRetirementAgeLabel,
    personalRetirementAgeDecimal: params.personalAgeDecimal,
    longCareerBonusMonths: 0,
    userAgeDecimal: params.userAgeDecimal,
    ageDiffMonths: Math.max(0, Math.ceil((params.personalAgeDecimal - params.userAgeDecimal) * 12)),
    accrualAnnualPct: params.accrualAnnualPct,
    theoreticalGlobalAccrualPct: params.theoreticalGlobalAccrualPct,
    theoreticalFullMonthlyPension: params.theoreticalFullMonthlyPension,
    proRataRatio: params.proRataRatio,
    proRataRatioLabel: params.proRataRatioLabel,
    realPortugueseBaseMonthlyPension: params.realPortugueseBaseMonthlyPension,
    anticipationPenaltyPct: 0,
    anticipationPenaltyEuros: 0,
    sustainabilityFactorCutPct: 0,
    sustainabilityFactorCutEuros: 0,
    bonusForPostponementPct: 0,
    bonusForPostponementEuros: 0,
    totalCutsEuros: 0,
    finalRealPortugueseMonthlyPension: 0,
    projectedAtNormalAgeMonthlyPension: params.projectedAtNormalAgeMonthlyPension,
    nationalMinimumThreshold: 438.81,
    isNationalMinimumApplied: false,
    isInstantPensionEligible: false,
    bilateralNoticeRequired: isMix,
    bilateralNoticeText: isMix
      ? "Processos com totalização de períodos no estrangeiro exigem instrução bilateral obrigatória e validação manual entre os organismos de ligação, não sendo elegíveis para atribuição automática em 24h."
      : "",
    minimumPensionNoticeText: isMix
      ? "A garantia de pensão mínima não se aplica automaticamente a pensões calculadas por pro rata internacional."
      : ""
  };
}
