// ============================================================================
// MIRA-GOLD 2026 — MOTOR DE IRS, SOLIDARIEDADE E RETENÇÃO (PORTÃO 3: U04)
// Implementação Consolidada da Fase 6 Homologada
// CIRS Arts. 22.º, 31.º (1, 2, 10, 11), 68.º, 68.º-A, 69.º, 70.º, 101.º e 101.º-B
// ============================================================================

import {
  IAS_2026_CENTS,
  applyRateBps
} from './miraMonetaryEngine';

import {
  CategoryBGrossIncomesBreakdown
} from './miraExpenseAndEvidenceEngine';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE I — CONSTANTES NORMATIVAS DE IRS (ANO FISCAL 2026)
 * ════════════════════════════════════════════════════════════════════════════
 */

export const CIRS_RMMG_CONTINENTE_2026_CENTS = 92000; // 920,00 €
export const CIRS_RMMG_MADEIRA_2026_CENTS = 98000;    // 980,00 €

// Valor de Referência do Mínimo de Existência (Artigo 70.º, n.º 1: max(1,5 x 14 x IAS, 14 x RMMG))
export const CIRS_MINIMUM_EXISTENCE_REF_CONTINENTE_2026_CENTS = 14 * CIRS_RMMG_CONTINENTE_2026_CENTS; // 12.880,00 €
export const CIRS_MINIMUM_EXISTENCE_REF_MADEIRA_2026_CENTS = 14 * CIRS_RMMG_MADEIRA_2026_CENTS;       // 13.720,00 €

export const CIVA_ART53_EXEMPTION_THRESHOLD_CENTS = 1500000; // 15.000,00 € (Artigo 53.º CIVA)

// Taxas Legais de Retenção na Fonte (Artigo 101.º, n.º 1 do CIRS)
export const WITHHOLDING_TAX_RATE_TABLE_151_BPS = 2300;       // 23,00% (Art. 101.º, 1, al. b)
export const WITHHOLDING_TAX_RATE_OTHER_SERVICES_BPS = 1150;   // 11,50% (Art. 101.º, 1)
export const WITHHOLDING_TAX_RATE_INTELLECTUAL_PROP_BPS = 1650;// 16,50% (Art. 101.º, 1, al. c)

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE II — ESCALÕES GERAIS CONSOLIDADOS DE IRS 2026 (ARTIGO 68.º DO CIRS)
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface IRSTaxBracketDefinition {
  bracketNumber: number;
  upperLimitCents: number;
  marginalRateBps: number;
  averageRateBps: number;
  abatementAmountCents: number;
}

export const IRS_BRACKETS_2026: IRSTaxBracketDefinition[] = [
  { bracketNumber: 1, upperLimitCents: 834200,   marginalRateBps: 1250, averageRateBps: 12500, abatementAmountCents: 0 },
  { bracketNumber: 2, upperLimitCents: 1258700,  marginalRateBps: 1570, averageRateBps: 13579, abatementAmountCents: 26694 },
  { bracketNumber: 3, upperLimitCents: 1783800,  marginalRateBps: 2120, averageRateBps: 15823, abatementAmountCents: 95923 },
  { bracketNumber: 4, upperLimitCents: 2308900,  marginalRateBps: 2410, averageRateBps: 17705, abatementAmountCents: 147653 },
  { bracketNumber: 5, upperLimitCents: 2939700,  marginalRateBps: 3110, averageRateBps: 20579, abatementAmountCents: 309276 },
  { bracketNumber: 6, upperLimitCents: 4309000,  marginalRateBps: 3490, averageRateBps: 25130, abatementAmountCents: 420985 },
  { bracketNumber: 7, upperLimitCents: 4656600,  marginalRateBps: 4310, averageRateBps: 26472, abatementAmountCents: 774323 },
  { bracketNumber: 8, upperLimitCents: 8663400,  marginalRateBps: 4460, averageRateBps: 34856, abatementAmountCents: 844172 },
  { bracketNumber: 9, upperLimitCents: Number.MAX_SAFE_INTEGER, marginalRateBps: 4800, averageRateBps: 0, abatementAmountCents: 1138717 },
];

/**
 * Aplica a regra de divisão estatutária do Artigo 68.º, n.º 2:
 * 1) Limite do maior escalão que cabe no rendimento à taxa média da Coluna B
 * 2) Excedente à taxa normal da Coluna A do escalão seguinte
 */
export function calculateArt68ColetaStatutory(taxableIncomeCents: number): number {
  if (taxableIncomeCents <= 0) return 0;

  if (taxableIncomeCents <= 834200) {
    return applyRateBps(taxableIncomeCents, 1250);
  }

  // Divisão do Artigo 68.º, n.º 2 para o 9.º escalão homologada soberanamente na R8:
  // Parte 1 (até 86.634 € à taxa média de 34,856%): 30.198,71104 €
  // Parte 2 (excedente à taxa normal de 48,00%): excedente * 0,48
  // A soma das duas partes precede o arredondamento monetário final
  if (taxableIncomeCents > 8663400) {
    const excedentCents = taxableIncomeCents - 8663400;
    const rawColetaCents = 3019871.104 + (excedentCents * 4800) / 10000;
    return Math.round(rawColetaCents);
  }

  let lowerBracket = IRS_BRACKETS_2026[0];
  let nextBracket = IRS_BRACKETS_2026[1];

  for (let i = 0; i < IRS_BRACKETS_2026.length - 1; i++) {
    if (taxableIncomeCents > IRS_BRACKETS_2026[i].upperLimitCents) {
      lowerBracket = IRS_BRACKETS_2026[i];
      nextBracket = IRS_BRACKETS_2026[i + 1];
    } else {
      break;
    }
  }

  const part1Cents = Math.round((lowerBracket.upperLimitCents * lowerBracket.averageRateBps) / 100000);
  const excedentCents = taxableIncomeCents - lowerBracket.upperLimitCents;
  const part2Cents = applyRateBps(excedentCents, nextBracket.marginalRateBps);

  return part1Cents + part2Cents;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE III — TIPOS E CONTEXTO FISCAL DO SUJEITO PASSIVO
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface ComprehensiveCategoryBGrossIncomes extends CategoryBGrossIncomesBreakdown {
  incomeArt31_1_h_LocalLodgingContainmentAreaCents?: number;
}

export type ActivityStartStatus =
  | 'NONE'
  | 'FIRST_YEAR_START'
  | 'SECOND_YEAR_START';

export interface TaxpayerPersonalTaxContext {
  taxTerritory: 'CONTINENTE' | 'MADEIRA' | 'ACORES';
  isJointFilingMarried: boolean;
  activityStartStatus: ActivityStartStatus;
  hasCategoryAOrHIncomesInPeriod: boolean;
  hasCeasedActivityInPrior5Years: boolean;
  appliesArticle31ParagraphG: boolean;
  qualifiesForArt70SubjectiveScope: boolean;
  clientWithholdingDeclarations: {
    billedWithTable151Cents: number;
    billedWithOtherServicesCents: number;
    billedWithIntellectualPropCents: number;
    hasExercisedArticle101BOption: boolean;
    priorYearTurnoverUnder15k: boolean;
    isContractIntermediationCommission: boolean;
  };
}

export interface IRSCalculationDetailedResult {
  coefficientEffectiveB_bps: number;
  coefficientEffectiveC_bps: number;
  coefficientEffectiveF_bps: number;
  activityStartBenefitApplied: boolean;
  activityStartBenefitRejectionReason?: string;

  baseTaxableCategoryBIncomeCents: number;
  expenseShortfallAcrescimentoCents: number;
  preliminaryTaxableIncomeCents: number;

  art70GrossIncomeCents: number;
  art70SpecificDeductionCents: number;
  art70AbatementAmountCents: number;
  finalTaxableIncomeColetavelCents: number;

  maritalQuotient: number;
  quotientIncomeCents: number;
  applicableBracketNumber: number;
  applicableMarginalRateBps: number;
  coletaBaseGeralArt68Cents: number;

  solidarityTaxArt68ACents: number;
  coletaTotalCents: number;

  withholdingTaxTable151Cents: number;
  withholdingTaxOtherServicesCents: number;
  withholdingTaxIntellectualPropCents: number;
  totalWithholdingTaxPaidCents: number;
  withholdingExemptionApplied: boolean;

  finalTaxBalanceCents: number;
  liquidationOutcome: 'TAX_PAYABLE' | 'TAX_REFUND' | 'ZERO_BALANCE';
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE IV — ALGORITMO DETERMINÍSTICO DE LIQUIDAÇÃO DE IRS
 * ════════════════════════════════════════════════════════════════════════════
 */

export function calculateAnnualIRSLiquidationAssessment(
  incomes: ComprehensiveCategoryBGrossIncomes,
  expenseShortfallAcrescimentoCents: number,
  mandatorySSContributionsPaidCents: number,
  context: TaxpayerPersonalTaxContext
): IRSCalculationDetailedResult {
  // 1. Determinação dos Coeficientes Efetivos (Artigo 31.º, n.ºs 1, 10 e 11)
  let coeffB_bps = 7500; // 0,75 base
  let coeffC_bps = 3500; // 0,35 base
  let coeffF_bps = 1000; // 0,10 base
  let activityStartBenefitApplied = false;
  let activityStartBenefitRejectionReason: string | undefined;

  if (context.appliesArticle31ParagraphG) {
    coeffB_bps = 10000;
    coeffC_bps = 10000;
  } else if (context.activityStartStatus !== 'NONE') {
    if (context.hasCategoryAOrHIncomesInPeriod) {
      activityStartBenefitRejectionReason = 'CATEGORY_A_OR_H_INCOMES_CONCURRENCE_DISQUALIFICATION';
    } else if (context.hasCeasedActivityInPrior5Years) {
      activityStartBenefitRejectionReason = 'CESSATION_IN_PRIOR_5_YEARS_DISQUALIFICATION';
    } else {
      activityStartBenefitApplied = true;
      if (context.activityStartStatus === 'FIRST_YEAR_START') {
        coeffB_bps = 3750; // 0,75 x 50% = 0,375
        coeffC_bps = 1750; // 0,35 x 50% = 0,175
        coeffF_bps = 500;  // 0,10 x 50% = 0,050
      } else if (context.activityStartStatus === 'SECOND_YEAR_START') {
        coeffB_bps = 5625; // 0,75 x 75% = 0,5625
        coeffC_bps = 2625; // 0,35 x 75% = 0,2625
        coeffF_bps = 750;  // 0,10 x 75% = 0,075
      }
    }
  }

  // 2. Apuramento do Rendimento Tributável Líquido da Categoria B
  const taxable_a = applyRateBps(incomes.incomeArt31_1_a_SalesCents, 1500);
  const taxable_b = applyRateBps(incomes.incomeArt31_1_b_Table151ServicesCents, coeffB_bps);
  const taxable_c = applyRateBps(incomes.incomeArt31_1_c_OtherServicesCents, coeffC_bps);
  const taxable_d = applyRateBps(incomes.incomeArt31_1_d_IntellectualPropertyCapitalCents, 9500);
  const taxable_e = applyRateBps(incomes.incomeArt31_1_e_NonOperatingSubsidiesCents, 3000);
  const taxable_f = applyRateBps(incomes.incomeArt31_1_f_OperatingSubsidiesCents, coeffF_bps);
  const taxable_h = applyRateBps(incomes.incomeArt31_1_h_LocalLodgingContainmentAreaCents || 0, 5000);

  const baseTaxableCategoryBIncomeCents =
    taxable_a + taxable_b + taxable_c + taxable_d + taxable_e + taxable_f + taxable_h;

  const preliminaryTaxableIncomeCents =
    baseTaxableCategoryBIncomeCents + expenseShortfallAcrescimentoCents;

  // 3. Mecanismo Legal de Abatimento do Mínimo de Existência (Artigo 70.º)
  let art70GrossIncomeCents = 0;
  let art70SpecificDeductionCents = 0;
  let art70AbatementAmountCents = 0;

  if (context.qualifiesForArt70SubjectiveScope) {
    art70GrossIncomeCents = incomes.incomeArt31_1_b_Table151ServicesCents;

    const ss10PctThresholdCents = applyRateBps(art70GrossIncomeCents, 1000);
    if (mandatorySSContributionsPaidCents > ss10PctThresholdCents) {
      art70SpecificDeductionCents = mandatorySSContributionsPaidCents - ss10PctThresholdCents;
    } else {
      art70SpecificDeductionCents = 0;
    }

    const referenceThresholdCents =
      context.taxTerritory === 'MADEIRA'
        ? CIRS_MINIMUM_EXISTENCE_REF_MADEIRA_2026_CENTS
        : CIRS_MINIMUM_EXISTENCE_REF_CONTINENTE_2026_CENTS;

    const netIncomeForLComparisonCents = art70GrossIncomeCents - art70SpecificDeductionCents;
    const thresholdLCents = 799722; // ~7.997,22 €

    if (netIncomeForLComparisonCents > thresholdLCents) {
      art70AbatementAmountCents = 0;
    } else {
      art70AbatementAmountCents = Math.max(0, referenceThresholdCents - netIncomeForLComparisonCents);
    }
  }

  const finalTaxableIncomeColetavelCents = Math.max(
    0,
    preliminaryTaxableIncomeCents - art70AbatementAmountCents
  );

  // 4. Quociente Familiar Conjugal (Artigo 69.º)
  const maritalQuotient = context.isJointFilingMarried ? 2 : 1;
  const quotientIncomeCents = Math.floor(finalTaxableIncomeColetavelCents / maritalQuotient);

  // 5. Coleta Geral (Artigo 68.º)
  let applicableBracket = IRS_BRACKETS_2026[0];
  for (const b of IRS_BRACKETS_2026) {
    if (quotientIncomeCents <= b.upperLimitCents) {
      applicableBracket = b;
      break;
    }
  }

  let rawColetaPerQuotientCents = 0;
  // Se for quociente 1 e ultrapassar o 8.º escalão, aplica o cálculo estatutário exato do Artigo 68.º, n.º 2
  if (maritalQuotient === 1 && quotientIncomeCents > 8663400) {
    rawColetaPerQuotientCents = calculateArt68ColetaStatutory(quotientIncomeCents);
  } else {
    rawColetaPerQuotientCents =
      applyRateBps(quotientIncomeCents, applicableBracket.marginalRateBps) -
      applicableBracket.abatementAmountCents;
  }

  const coletaBaseGeralArt68Cents = Math.max(0, rawColetaPerQuotientCents * maritalQuotient);

  // 6. Taxa Adicional de Solidariedade (Artigo 68.º-A)
  let solidarityTaxArt68ACents = 0;
  if (finalTaxableIncomeColetavelCents > 8000000) {
    const tier1Excedent = Math.min(finalTaxableIncomeColetavelCents, 25000000) - 8000000;
    solidarityTaxArt68ACents += applyRateBps(tier1Excedent, 250); // 2,5%

    if (finalTaxableIncomeColetavelCents > 25000000) {
      const tier2Excedent = finalTaxableIncomeColetavelCents - 25000000;
      solidarityTaxArt68ACents += applyRateBps(tier2Excedent, 500); // 5,0%
    }
  }

  const coletaTotalCents = coletaBaseGeralArt68Cents + solidarityTaxArt68ACents;

  // 7. Retenções na Fonte (Artigos 101.º e 101.º-B)
  let withholdingExemptionApplied = false;
  let withholdingTaxTable151Cents = 0;
  let withholdingTaxOtherServicesCents = 0;
  let withholdingTaxIntellectualPropCents = 0;

  const wDecl = context.clientWithholdingDeclarations;
  const totalBilledSubjectToWithholdingCents =
    wDecl.billedWithTable151Cents +
    wDecl.billedWithOtherServicesCents +
    wDecl.billedWithIntellectualPropCents;

  const isEligibleForArt101B =
    wDecl.hasExercisedArticle101BOption &&
    wDecl.priorYearTurnoverUnder15k &&
    totalBilledSubjectToWithholdingCents <= CIVA_ART53_EXEMPTION_THRESHOLD_CENTS &&
    !wDecl.isContractIntermediationCommission;

  if (isEligibleForArt101B) {
    withholdingExemptionApplied = true;
  } else {
    withholdingTaxTable151Cents = applyRateBps(
      wDecl.billedWithTable151Cents,
      WITHHOLDING_TAX_RATE_TABLE_151_BPS
    );
    withholdingTaxOtherServicesCents = applyRateBps(
      wDecl.billedWithOtherServicesCents,
      WITHHOLDING_TAX_RATE_OTHER_SERVICES_BPS
    );
    withholdingTaxIntellectualPropCents = applyRateBps(
      wDecl.billedWithIntellectualPropCents,
      WITHHOLDING_TAX_RATE_INTELLECTUAL_PROP_BPS
    );
  }

  const totalWithholdingTaxPaidCents =
    withholdingTaxTable151Cents +
    withholdingTaxOtherServicesCents +
    withholdingTaxIntellectualPropCents;

  // 8. Saldo Final de Liquidação
  const finalTaxBalanceCents = coletaTotalCents - totalWithholdingTaxPaidCents;

  let liquidationOutcome: IRSCalculationDetailedResult['liquidationOutcome'] = 'ZERO_BALANCE';
  if (finalTaxBalanceCents > 0) {
    liquidationOutcome = 'TAX_PAYABLE';
  } else if (finalTaxBalanceCents < 0) {
    liquidationOutcome = 'TAX_REFUND';
  }

  return {
    coefficientEffectiveB_bps: coeffB_bps,
    coefficientEffectiveC_bps: coeffC_bps,
    coefficientEffectiveF_bps: coeffF_bps,
    activityStartBenefitApplied,
    activityStartBenefitRejectionReason,
    baseTaxableCategoryBIncomeCents,
    expenseShortfallAcrescimentoCents,
    preliminaryTaxableIncomeCents,
    art70GrossIncomeCents,
    art70SpecificDeductionCents,
    art70AbatementAmountCents,
    finalTaxableIncomeColetavelCents,
    maritalQuotient,
    quotientIncomeCents,
    applicableBracketNumber: applicableBracket.bracketNumber,
    applicableMarginalRateBps: applicableBracket.marginalRateBps,
    coletaBaseGeralArt68Cents,
    solidarityTaxArt68ACents,
    coletaTotalCents,
    withholdingTaxTable151Cents,
    withholdingTaxOtherServicesCents,
    withholdingTaxIntellectualPropCents,
    totalWithholdingTaxPaidCents,
    withholdingExemptionApplied,
    finalTaxBalanceCents,
    liquidationOutcome,
  };
}
