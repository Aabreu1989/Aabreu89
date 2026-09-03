// ============================================================================
// MIRA-GOLD 2026 — MOTOR DE BASE CONTRIBUTIVA E SEGURANÇA SOCIAL (PORTÃO 3: U03)
// Implementação Consolidada da Fase 5 Homologada
// CRCSPSS Arts. 140.º, 140.º-A, 143.º, 157.º, 162.º, 163.º, 164.º, 167.º e 168.º
// e Decreto Regulamentar n.º 1-A/2011, Art. 62.º (red. DR n.º 6/2018)
// ============================================================================

import {
  IAS_2026_CENTS,
  SS_TI_LIMIT_4_IAS_2026_CENTS,
  SS_MONTHLY_CEILING_12_IAS_CENTS,
  SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS,
  COEFF_SS_SERVICES_BPS,
  COEFF_SS_GOODS_SALES_BPS,
  RATE_SS_INDEPENDENT_WORKER_BPS,
  RATE_SS_ENI_BPS,
  applyRateBps
} from './miraMonetaryEngine';

import {
  TCOSubstantiveRequirements,
  evaluateTCOExemptionArt157
} from './miraExpenseAndEvidenceEngine';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE I — CONSTANTES NORMATIVAS DA SEGURANÇA SOCIAL (2026)
 * ════════════════════════════════════════════════════════════════════════════
 */

// Limiar Mínimo Anual de Serviços para Qualificação de Entidades Contratantes: 6 IAS (Art. 140.º, n.º 2)
export const SS_CONTRACTING_ENTITY_MIN_ANNUAL_SERVICES_6_IAS_CENTS = 6 * IAS_2026_CENTS; // 322.278 cêntimos (3.222,78 €)

// Taxas das Entidades Contratantes (Artigo 168.º, n.º 7)
export const RATE_SS_CONTRACTING_ENTITY_50_80_BPS = 700;   // 7,00% (dependência > 50% e <= 80%)
export const RATE_SS_CONTRACTING_ENTITY_OVER_80_BPS = 1000; // 10,00% (dependência > 80%)

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE II — TIPOS DE ENTRADA E SAÍDA DA SEGURANÇA SOCIAL
 * ════════════════════════════════════════════════════════════════════════════
 */

export type QuarterlyVariationStepBps =
  | -2500 | -2000 | -1500 | -1000 | -500
  | 0
  | 500 | 1000 | 1500 | 2000 | 2500;

export type IndependentWorkerRegimeType =
  | 'TI_GENERAL'          // Trabalhador Independente em Geral (Art. 168.º, 1, a) -> 21,4%
  | 'TI_ENI_EIRL';        // Empresário em Nome Individual ou EIRL (Art. 168.º, 1, b) -> 25,2%

export interface QuarterlyDeclaredIncomesInput {
  servicesGeneralAmountCents: number;
  goodsSalesAmountCents: number;
  hospitalityAndCateringServicesAmountCents: number;
  operatingSubsidiesAmountCents: number;
  investmentSubsidiesWithOption?: {
    hasExercisedOption: boolean;
    fiscalConsideredFractionAmountCents: number;
    associatedActivityNature: 'SERVICES' | 'GOODS_PRODUCTION';
  };
}

export interface AnnualClientBillingRecord {
  clientNIF: string;
  corporateGroupId?: string;
  annualServicesBilledAmountCents: number;
}

export interface ContractingEntityDependenceAssessment {
  clientNIF: string;
  corporateGroupId?: string;
  annualServicesBilledAmountCents: number;
  totalAnnualServicesBilledCents: number;
  dependencePercentageBps: number;
  meets6IASAnnualServicesThreshold: boolean;
  isContractingEntity: boolean;
  applicableRateBps: number;
  annualEstimatedContributionChargeCents: number;
  statutoryBasis: string;
}

export interface MonthlySSContributionResult {
  quarterlyTotalDeclaredCents: number;
  quarterlyRelevantIncomeCents: number;
  statutoryMonthlyAverageIncomeCents: number;

  art157ExemptionApplies: boolean;
  art157LegalBasis: string;
  isOver4IASTCOExcedentRegime: boolean;
  excedentAbove4IASCents: number;

  selectedVariationBps: QuarterlyVariationStepBps;
  monthlyBaseSubjectToContributionCents: number;

  monthlyCappedContributionBaseCents: number;
  isCappedBy12IASCeiling: boolean;
  rawCalculatedContributionCents: number;
  isFlooredBy20EurMinimum: boolean;

  regimeType: IndependentWorkerRegimeType;
  contributionRateBps: number;
  monthlyContributionDueCents: number;

  contractingEntities: ContractingEntityDependenceAssessment[];
  totalAnnualContractingEntitiesChargeCents: number;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE III — MOTOR DETERMINÍSTICO DA BASE CONTRIBUTIVA
 * ════════════════════════════════════════════════════════════════════════════
 */

export function calculateMonthlySSContributionAssessment(
  incomes: QuarterlyDeclaredIncomesInput,
  variationBps: QuarterlyVariationStepBps = 0,
  regimeType: IndependentWorkerRegimeType = 'TI_GENERAL',
  tcoProof: TCOSubstantiveRequirements | null = null,
  annualClientBillings: AnnualClientBillingRecord[] = []
): MonthlySSContributionResult {
  // 1. Apuramento do Rendimento Relevante Trimestral (Artigo 162.º)
  const relevantServices = applyRateBps(incomes.servicesGeneralAmountCents, COEFF_SS_SERVICES_BPS);
  const relevantGoods = applyRateBps(incomes.goodsSalesAmountCents, COEFF_SS_GOODS_SALES_BPS);
  const relevantHospitality = applyRateBps(incomes.hospitalityAndCateringServicesAmountCents, COEFF_SS_GOODS_SALES_BPS);
  const relevantOperatingSubsidies = applyRateBps(incomes.operatingSubsidiesAmountCents, COEFF_SS_GOODS_SALES_BPS);

  let relevantInvestmentSubsidies = 0;
  if (incomes.investmentSubsidiesWithOption && incomes.investmentSubsidiesWithOption.hasExercisedOption) {
    const coeff = incomes.investmentSubsidiesWithOption.associatedActivityNature === 'SERVICES'
      ? COEFF_SS_SERVICES_BPS
      : COEFF_SS_GOODS_SALES_BPS;
    relevantInvestmentSubsidies = applyRateBps(
      incomes.investmentSubsidiesWithOption.fiscalConsideredFractionAmountCents,
      coeff
    );
  }

  const quarterlyTotalDeclaredCents =
    incomes.servicesGeneralAmountCents +
    incomes.goodsSalesAmountCents +
    incomes.hospitalityAndCateringServicesAmountCents +
    incomes.operatingSubsidiesAmountCents +
    (incomes.investmentSubsidiesWithOption?.hasExercisedOption
      ? incomes.investmentSubsidiesWithOption.fiscalConsideredFractionAmountCents
      : 0);

  const quarterlyRelevantIncomeCents =
    relevantServices +
    relevantGoods +
    relevantHospitality +
    relevantOperatingSubsidies +
    relevantInvestmentSubsidies;

  // 2. Rendimento Relevante Mensal Médio Apurado (Artigo 163.º, n.º 1)
  const statutoryMonthlyAverageIncomeCents = Math.floor(quarterlyRelevantIncomeCents / 3);

  // 3. Taxa do Trabalhador Independente (Artigo 168.º, n.º 1)
  const contributionRateBps = regimeType === 'TI_ENI_EIRL'
    ? RATE_SS_ENI_BPS
    : RATE_SS_INDEPENDENT_WORKER_BPS;

  let art157ExemptionApplies = false;
  let art157LegalBasis = 'NONE';
  let isOver4IASTCOExcedentRegime = false;
  let excedentAbove4IASCents = 0;

  let monthlyBaseSubjectToContributionCents = statutoryMonthlyAverageIncomeCents;
  let monthlyCappedContributionBaseCents = 0;
  let rawCalculatedContributionCents = 0;
  let monthlyContributionDueCents = 0;
  let isCappedBy12IASCeiling = false;
  let isFlooredBy20EurMinimum = false;

  // 4. Aferição do Regime TCO (Artigo 157.º e Artigo 163.º, n.º 4)
  if (tcoProof) {
    const tcoEval = evaluateTCOExemptionArt157(tcoProof, statutoryMonthlyAverageIncomeCents);
    if (tcoEval.qualifiesForExemption && tcoEval.isExemptByThreshold) {
      art157ExemptionApplies = true;
      art157LegalBasis = tcoEval.legalGround;
      monthlyBaseSubjectToContributionCents = 0;
      monthlyCappedContributionBaseCents = 0;
      rawCalculatedContributionCents = 0;
      monthlyContributionDueCents = 0;
    } else if (statutoryMonthlyAverageIncomeCents >= SS_TI_LIMIT_4_IAS_2026_CENTS && tcoEval.legalGround.includes('EXCEDENTE')) {
      isOver4IASTCOExcedentRegime = true;
      art157LegalBasis = 'ART_163_4_TCO_EXCEDENT_OVER_4_IAS';
      excedentAbove4IASCents = statutoryMonthlyAverageIncomeCents - SS_TI_LIMIT_4_IAS_2026_CENTS;

      // Opção trimestral incide sobre o excedente
      const variationAdjustment = applyRateBps(excedentAbove4IASCents, variationBps);
      monthlyBaseSubjectToContributionCents = excedentAbove4IASCents + variationAdjustment;

      // Teto de 12 IAS
      if (monthlyBaseSubjectToContributionCents > SS_MONTHLY_CEILING_12_IAS_CENTS) {
        monthlyCappedContributionBaseCents = SS_MONTHLY_CEILING_12_IAS_CENTS;
        isCappedBy12IASCeiling = true;
      } else {
        monthlyCappedContributionBaseCents = monthlyBaseSubjectToContributionCents;
      }

      rawCalculatedContributionCents = applyRateBps(monthlyCappedContributionBaseCents, contributionRateBps);
      monthlyContributionDueCents = rawCalculatedContributionCents;
    }
  }

  // 5. Regime Geral sem Isenção
  if (!art157ExemptionApplies && !isOver4IASTCOExcedentRegime) {
    // Opção trimestral do Artigo 164.º
    const variationAdjustment = applyRateBps(statutoryMonthlyAverageIncomeCents, variationBps);
    monthlyBaseSubjectToContributionCents = statutoryMonthlyAverageIncomeCents + variationAdjustment;

    // Teto de 12 IAS (Artigo 163.º, n.º 5)
    if (monthlyBaseSubjectToContributionCents > SS_MONTHLY_CEILING_12_IAS_CENTS) {
      monthlyCappedContributionBaseCents = SS_MONTHLY_CEILING_12_IAS_CENTS;
      isCappedBy12IASCeiling = true;
    } else {
      monthlyCappedContributionBaseCents = monthlyBaseSubjectToContributionCents;
    }

    rawCalculatedContributionCents = applyRateBps(monthlyCappedContributionBaseCents, contributionRateBps);

    // Piso legal imperativo de 20,00 € (Artigo 163.º, n.º 2)
    if (rawCalculatedContributionCents < SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS) {
      monthlyContributionDueCents = SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS;
      isFlooredBy20EurMinimum = true;
    } else {
      monthlyContributionDueCents = rawCalculatedContributionCents;
    }
  }

  // 6. Apuramento da Responsabilidade das Entidades Contratantes (Arts. 140.º, 140.º-A, 167.º e 168.º, 7)
  const totalAnnualServicesBilledCents = annualClientBillings.reduce(
    (acc, c) => acc + c.annualServicesBilledAmountCents,
    0
  );

  const meets6IASAnnualServicesThreshold =
    totalAnnualServicesBilledCents >= SS_CONTRACTING_ENTITY_MIN_ANNUAL_SERVICES_6_IAS_CENTS;

  const contractingEntities: ContractingEntityDependenceAssessment[] = [];
  let totalAnnualContractingEntitiesChargeCents = 0;

  if (totalAnnualServicesBilledCents > 0) {
    for (const client of annualClientBillings) {
      const dependencePercentageBps = Math.floor(
        (client.annualServicesBilledAmountCents * 10000) / totalAnnualServicesBilledCents
      );

      let isContractingEntity = false;
      let applicableRateBps = 0;
      let statutoryBasis = 'NOT_CONTRACTING_ENTITY';

      if (meets6IASAnnualServicesThreshold) {
        if (dependencePercentageBps > 8000) {
          isContractingEntity = true;
          applicableRateBps = RATE_SS_CONTRACTING_ENTITY_OVER_80_BPS; // 10%
          statutoryBasis = 'ART_140_AND_ART_168_7_A_OVER_80PCT';
        } else if (dependencePercentageBps > 5000) {
          isContractingEntity = true;
          applicableRateBps = RATE_SS_CONTRACTING_ENTITY_50_80_BPS; // 7%
          statutoryBasis = 'ART_140_AND_ART_168_7_B_50_TO_80PCT';
        }
      } else {
        statutoryBasis = 'EXCLUDED_SERVICES_UNDER_6_IAS_THRESHOLD';
      }

      const charge = isContractingEntity
        ? applyRateBps(client.annualServicesBilledAmountCents, applicableRateBps)
        : 0;

      contractingEntities.push({
        clientNIF: client.clientNIF,
        corporateGroupId: client.corporateGroupId,
        annualServicesBilledAmountCents: client.annualServicesBilledAmountCents,
        totalAnnualServicesBilledCents,
        dependencePercentageBps,
        meets6IASAnnualServicesThreshold,
        isContractingEntity,
        applicableRateBps,
        annualEstimatedContributionChargeCents: charge,
        statutoryBasis,
      });

      totalAnnualContractingEntitiesChargeCents += charge;
    }
  }

  return {
    quarterlyTotalDeclaredCents,
    quarterlyRelevantIncomeCents,
    statutoryMonthlyAverageIncomeCents,
    art157ExemptionApplies,
    art157LegalBasis,
    isOver4IASTCOExcedentRegime,
    excedentAbove4IASCents,
    selectedVariationBps: variationBps,
    monthlyBaseSubjectToContributionCents,
    monthlyCappedContributionBaseCents,
    isCappedBy12IASCeiling,
    rawCalculatedContributionCents,
    isFlooredBy20EurMinimum,
    regimeType,
    contributionRateBps,
    monthlyContributionDueCents,
    contractingEntities,
    totalAnnualContractingEntitiesChargeCents,
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE IV — CONTRATO DE INTERFACE PARA INTEGRAÇÃO GLOBAL (FASE 7)
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface QuarterlySocialSecurityDeclarationInput {
  grossServicesGeneralCents: number;
  grossSalesAndProductionCents: number;
  grossHospitalityCents: number;
  grossOperatingSubsidiesCents: number;
  taxpayerRateBps?: number;
  baseVariationBps?: number;
}

export interface MonthlySocialSecurityAssessmentResult {
  quarterlyDeclaredGrossCents: number;
  quarterlyRelevantIncomeCents: number;
  monthlyAverageRelevantIncomeCents: number;
  monthlyContributoryBaseCents: number;
  monthlyContributionDueCents: number;
  isFlooredAt20Euros: boolean;
  isCappedAt12IAS: boolean;
  appliedRateBps: number;
  notes?: string;
}

export function calculateMonthlySocialSecurityAssessment(
  input: QuarterlySocialSecurityDeclarationInput
): MonthlySocialSecurityAssessmentResult {
  const incomes: QuarterlyDeclaredIncomesInput = {
    servicesGeneralAmountCents: input.grossServicesGeneralCents,
    goodsSalesAmountCents: input.grossSalesAndProductionCents,
    hospitalityAndCateringServicesAmountCents: input.grossHospitalityCents,
    operatingSubsidiesAmountCents: input.grossOperatingSubsidiesCents,
  };

  const variation = (input.baseVariationBps || 0) as QuarterlyVariationStepBps;
  const regime: IndependentWorkerRegimeType =
    input.taxpayerRateBps === 2520 ? 'TI_ENI_EIRL' : 'TI_GENERAL';

  const fullResult = calculateMonthlySSContributionAssessment(incomes, variation, regime);

  return {
    quarterlyDeclaredGrossCents: fullResult.quarterlyTotalDeclaredCents,
    quarterlyRelevantIncomeCents: fullResult.quarterlyRelevantIncomeCents,
    monthlyAverageRelevantIncomeCents: fullResult.statutoryMonthlyAverageIncomeCents,
    monthlyContributoryBaseCents: fullResult.monthlyCappedContributionBaseCents,
    monthlyContributionDueCents: fullResult.monthlyContributionDueCents,
    isFlooredAt20Euros: fullResult.isFlooredBy20EurMinimum,
    isCappedAt12IAS: fullResult.isCappedBy12IASCeiling,
    appliedRateBps: fullResult.contributionRateBps,
    notes: fullResult.art157ExemptionApplies ? fullResult.art157LegalBasis : undefined,
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE V — MOTOR CANÓNICO DE CÁLCULO DE SEGURANÇA SOCIAL (DL 110/2009 - CRC)
 * Interface Pública Direta para o Simulador (NissWizard & Integrações)
 * ════════════════════════════════════════════════════════════════════════════
 */

export const IAS_2026_EUROS = 537.13;
export const SS_CEILING_12_IAS_EUROS = 6445.56; // 12 * 537.13 = 6445.56
export const SS_FLOOR_MINIMUM_EUROS = 20.00;
export const SS_TCO_LIMIT_4_IAS_EUROS = 2148.52; // 4 * 537.13 = 2148.52
export const SS_TCO_MIN_SALARY_1_IAS_EUROS = 537.13;

export const SS_VARIATION_STEPS = [
  -0.25, -0.20, -0.15, -0.10, -0.05,
   0.00,
   0.05,  0.10,  0.15,  0.20,  0.25
] as const;

export type SSVariationStep = typeof SS_VARIATION_STEPS[number];

export interface MiraSSAssessmentInput {
  quarterlyRevenue: number; // Rendimento Bruto Total do Trimestre (€)
  activityType: 'services' | 'sales_hospitality'; // 70% ou 20%
  variationPct?: number; // Entre -0.25 e +0.25 em patamares de 0.05 (default: 0)
  taxRate?: number; // 0.214 (TI geral) ou 0.252 (ENI/produtor agrícola)
  isFirstYear?: boolean; // Isenção de início de atividade (primeiros 12 meses)
  isTCO?: boolean; // Acumulação com trabalho por conta de outrem
  tcoMonthlySalary?: number; // Salário bruto mensal do trabalho por conta de outrem
  referenceYear?: number; // 2026
}

export interface MiraSSAssessment {
  quarterlyRevenue: number;
  activityType: 'services' | 'sales_hospitality';
  activityCoefficient: number; // 0.70 ou 0.20
  quarterlyRelevantIncome: number;
  monthlyAverageRelevantIncome: number;
  variationPct: number;
  adjustedMonthlyBase: number;
  finalContributoryBase: number;
  isCappedAt12IAS: boolean;
  applicableTaxRate: number;
  rawMonthlyContribution: number;
  monthlyContribution: number;
  quarterlyTotalContribution: number;
  isExempt: boolean;
  exemptionReason?: string;
  isMinimumPayment: boolean;
  iasValue: number;
  maxMonthlyCeiling: number;
  minMonthlyFloor: number;
  tcoLimit4IAS: number;
}

export function calculateMiraSocialSecurity(input: MiraSSAssessmentInput): MiraSSAssessment {
  const iasValue = IAS_2026_EUROS;
  const maxMonthlyCeiling = SS_CEILING_12_IAS_EUROS;
  const minMonthlyFloor = SS_FLOOR_MINIMUM_EUROS;
  const tcoLimit4IAS = SS_TCO_LIMIT_4_IAS_EUROS;
  const tcoMinSalary1IAS = SS_TCO_MIN_SALARY_1_IAS_EUROS;

  const quarterlyRevenue = Math.max(0, Number(input.quarterlyRevenue) || 0);
  const activityType = input.activityType === 'sales_hospitality' ? 'sales_hospitality' : 'services';
  const activityCoefficient = activityType === 'sales_hospitality' ? 0.20 : 0.70;
  const variationPct = input.variationPct !== undefined ? Number(input.variationPct) : 0;
  const applicableTaxRate = input.taxRate !== undefined ? Number(input.taxRate) : 0.214;

  // 1. Apuramento do Rendimento Relevante (Art. 151.º e 162.º do CRC)
  const quarterlyRelevantIncome = Math.round(quarterlyRevenue * activityCoefficient * 100) / 100;
  const monthlyAverageRelevantIncome = Math.round((quarterlyRelevantIncome / 3) * 100) / 100;

  // 2. Aferição de Isenções Legais
  // 2.1 Início de Atividade: Isenção facultativa nos primeiros 12 meses
  if (input.isFirstYear) {
    return {
      quarterlyRevenue,
      activityType,
      activityCoefficient,
      quarterlyRelevantIncome,
      monthlyAverageRelevantIncome,
      variationPct,
      adjustedMonthlyBase: 0,
      finalContributoryBase: 0,
      isCappedAt12IAS: false,
      applicableTaxRate,
      rawMonthlyContribution: 0,
      monthlyContribution: 0,
      quarterlyTotalContribution: 0,
      isExempt: true,
      exemptionReason: 'Isenção facultativa nos primeiros 12 meses de início de atividade',
      isMinimumPayment: false,
      iasValue,
      maxMonthlyCeiling,
      minMonthlyFloor,
      tcoLimit4IAS,
    };
  }

  // 2.2 Acumulação com Trabalho por Conta de Outrem (TCO) - Art. 157.º do CRC
  if (input.isTCO) {
    const tcoSalary = Number(input.tcoMonthlySalary) || 0;
    const qualifiesSalary = tcoSalary >= tcoMinSalary1IAS;
    const qualifiesRelevantIncome = monthlyAverageRelevantIncome < tcoLimit4IAS;

    if (qualifiesSalary && qualifiesRelevantIncome) {
      return {
        quarterlyRevenue,
        activityType,
        activityCoefficient,
        quarterlyRelevantIncome,
        monthlyAverageRelevantIncome,
        variationPct,
        adjustedMonthlyBase: 0,
        finalContributoryBase: 0,
        isCappedAt12IAS: false,
        applicableTaxRate,
        rawMonthlyContribution: 0,
        monthlyContribution: 0,
        quarterlyTotalContribution: 0,
        isExempt: true,
        exemptionReason: 'Isenção por acumulação com trabalho por conta de outrem',
        isMinimumPayment: false,
        iasValue,
        maxMonthlyCeiling,
        minMonthlyFloor,
        tcoLimit4IAS,
      };
    }
  }

  // 3. Aplicação do Coeficiente de Ajuste de Variação (Art. 164.º do CRC: -25% a +25%)
  const adjustedMonthlyBase = Math.round(monthlyAverageRelevantIncome * (1 + variationPct) * 100) / 100;

  // 4. Aplicação do Teto Máximo Mensal de Incidência (Art. 163.º, n.º 5: 12 x IAS = 6.445,56 €)
  let finalContributoryBase = adjustedMonthlyBase;
  let isCappedAt12IAS = false;
  if (finalContributoryBase > maxMonthlyCeiling) {
    finalContributoryBase = maxMonthlyCeiling;
    isCappedAt12IAS = true;
  }

  // 5. Cálculo da Quota Mensal e Piso Mínimo Obrigatório (€ 20,00 - Art. 163.º, n.º 2)
  const rawMonthlyContribution = Math.round(finalContributoryBase * applicableTaxRate * 100) / 100;
  let monthlyContribution = rawMonthlyContribution;
  let isMinimumPayment = false;

  if (monthlyContribution < minMonthlyFloor) {
    monthlyContribution = minMonthlyFloor;
    isMinimumPayment = true;
  }

  const quarterlyTotalContribution = Math.round(monthlyContribution * 3 * 100) / 100;

  return {
    quarterlyRevenue,
    activityType,
    activityCoefficient,
    quarterlyRelevantIncome,
    monthlyAverageRelevantIncome,
    variationPct,
    adjustedMonthlyBase,
    finalContributoryBase,
    isCappedAt12IAS,
    applicableTaxRate,
    rawMonthlyContribution,
    monthlyContribution,
    quarterlyTotalContribution,
    isExempt: false,
    isMinimumPayment,
    iasValue,
    maxMonthlyCeiling,
    minMonthlyFloor,
    tcoLimit4IAS,
  };
}
