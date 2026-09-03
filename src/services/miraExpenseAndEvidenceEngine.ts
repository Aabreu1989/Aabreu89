// ============================================================================
// MIRA-GOLD 2026 — MOTOR DE PROVA JURÍDICA E DESPESAS (PORTÃO 3: UNIDADE 2)
// Implementação Consolidada das Fases 3 e 4 Homologadas
// CIRS Arts. 31.º (1, 5, 13–16), CRCSPSS Arts. 157.º e 162.º, DR 1-A/2011 Art. 62.º
// ============================================================================

import {
  IAS_2026_CENTS,
  ART_25_SPECIFIC_DEDUCTION_2026_CENTS,
  SS_TI_LIMIT_4_IAS_2026_CENTS,
  COEFF_SS_SERVICES_BPS,
  COEFF_SS_GOODS_SALES_BPS,
  THRESHOLD_INDIVIDUAL_SHAREHOLDING_BPS,
  THRESHOLD_FAMILY_SHAREHOLDING_BPS,
  applyRateBps
} from './miraMonetaryEngine';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE I — CONSTANTES NORMATIVAS DE PROVA E DESPESAS (2026)
 * ════════════════════════════════════════════════════════════════════════════
 */

export const EXPENSE_JUSTIFICATION_RATE_BPS = 1500; // 15,00% (Artigo 31.º, n.º 13)
export const PARTIAL_HABITATION_EXPENSE_RATE_BPS = 2500; // 25,00% (Artigo 31.º, n.º 14)
export const SUBSIDY_AMORTIZATION_YEARS_STANDARD = 5; // 5 Exercícios (Artigo 31.º, n.º 5)

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE II — MATRIZ DE FONTES INSTITUCIONAIS E PROVA JURÍDICA (FASE 3)
 * ════════════════════════════════════════════════════════════════════════════
 */

export type OfficialDocumentSource =
  | 'AT_E_FATURA'
  | 'AT_E_ARRENDAMENTO'
  | 'AT_PATRIMONIO_IMI'
  | 'AT_SISTEMA_ADUANEIRO_IMPORTACOES'
  | 'AT_DMR_SISTEMA_DECLARACOES'
  | 'AT_MODELO_3_ANNEX_B'
  | 'DMR_SEGURANCA_SOCIAL_AT'
  | 'DECLARACAO_ENTIDADE_PATRONAL'
  | 'INSTITUTO_SEGURANCA_SOCIAL_CNP'
  | 'CAIXA_GERAL_DE_APOSENTACOES'
  | 'REGIME_ESTRANGEIRO_OFICIAL'
  | 'CNPRP_TRIBUNAL_SEGURADORA_RISCO_PROF'
  | 'MINISTERIO_SAUDE_JUNTA_MEDICA'
  | 'INSTITUTO_SEGURANCA_SOCIAL_DIRETA'
  | 'CONSERVATORIA_REGISTO_COMERCIAL'
  | 'TERMO_CONCESSAO_SUBSIDIO_OFICIAL';

export type StatutoryProofDomain =
  | 'EXPENSE_INVOICE'
  | 'EXPENSE_PERSONNEL_DMR'
  | 'PROPERTY_RENT'
  | 'PROPERTY_VPT'
  | 'IMPORT_DECLARATION'
  | 'TCO_REMUNERATION'
  | 'TCO_COVERAGE_REGIME'
  | 'TCO_EMPLOYER_DECLARATION'
  | 'PENSION_STATUS'
  | 'PENSION_CUMULABILITY'
  | 'OCCUPATIONAL_RISK_PENSION'
  | 'OCCUPATIONAL_INCAPACITY'
  | 'SS_MINIMUM_BASE_HISTORY'
  | 'COMMERCIAL_SHAREHOLDING'
  | 'PUBLIC_SUBSIDY';

export function isEvidenceSourceCompatible(
  domain: StatutoryProofDomain,
  source: OfficialDocumentSource
): boolean {
  switch (domain) {
    case 'EXPENSE_INVOICE':
      return source === 'AT_E_FATURA' || source === 'AT_MODELO_3_ANNEX_B';
    case 'EXPENSE_PERSONNEL_DMR':
      return source === 'AT_DMR_SISTEMA_DECLARACOES' || source === 'AT_MODELO_3_ANNEX_B';
    case 'PROPERTY_RENT':
      return source === 'AT_E_ARRENDAMENTO' || source === 'AT_MODELO_3_ANNEX_B';
    case 'PROPERTY_VPT':
      return source === 'AT_PATRIMONIO_IMI' || source === 'AT_MODELO_3_ANNEX_B';
    case 'IMPORT_DECLARATION':
      return source === 'AT_SISTEMA_ADUANEIRO_IMPORTACOES' || source === 'AT_MODELO_3_ANNEX_B';
    case 'TCO_REMUNERATION':
      return source === 'DMR_SEGURANCA_SOCIAL_AT';
    case 'TCO_COVERAGE_REGIME':
      return source === 'INSTITUTO_SEGURANCA_SOCIAL_DIRETA' || source === 'CAIXA_GERAL_DE_APOSENTACOES';
    case 'TCO_EMPLOYER_DECLARATION':
      return source === 'DECLARACAO_ENTIDADE_PATRONAL';
    case 'PENSION_STATUS':
    case 'PENSION_CUMULABILITY':
      return (
        source === 'INSTITUTO_SEGURANCA_SOCIAL_CNP' ||
        source === 'CAIXA_GERAL_DE_APOSENTACOES' ||
        source === 'REGIME_ESTRANGEIRO_OFICIAL'
      );
    case 'OCCUPATIONAL_RISK_PENSION':
    case 'OCCUPATIONAL_INCAPACITY':
      return (
        source === 'CNPRP_TRIBUNAL_SEGURADORA_RISCO_PROF' ||
        source === 'MINISTERIO_SAUDE_JUNTA_MEDICA'
      );
    case 'SS_MINIMUM_BASE_HISTORY':
      return source === 'INSTITUTO_SEGURANCA_SOCIAL_DIRETA';
    case 'COMMERCIAL_SHAREHOLDING':
      return source === 'CONSERVATORIA_REGISTO_COMERCIAL';
    case 'PUBLIC_SUBSIDY':
      return source === 'TERMO_CONCESSAO_SUBSIDIO_OFICIAL';
    default:
      return false;
  }
}

export type TaxDocumentSubcategoryCode =
  | 'ART31_1_A_SALES'
  | 'ART31_1_B_TABLE151'
  | 'ART31_1_C_OTHER_SERVICES'
  | 'ART31_1_D_INTELLECTUAL'
  | 'ART31_1_E_NON_OPERATING_SUBSIDY'
  | 'ART31_1_F_OPERATING_SUBSIDY'
  | 'ART31_1_G_TRANSPARENCY_CONTROL'
  | 'ART31_1_H_CONTAINMENT_AL'
  | 'EXPENSE_13_B_STAFF'
  | 'EXPENSE_13_C_RENT'
  | 'EXPENSE_13_C_PARTIAL_RENT'
  | 'EXPENSE_13_D_DEPRECIATION'
  | 'EXPENSE_13_E_ACQUISITIONS'
  | 'EXPENSE_13_F_IMPORTS_AIC';

export interface TaxDocumentaryEvidenceRecord {
  documentId: string;
  source: OfficialDocumentSource;
  domain: StatutoryProofDomain;
  subCategoryCode: TaxDocumentSubcategoryCode;
  amountCents: number;
  issueDateIso: string;
  isLegallyCompliant: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

// ----------------------------------------------------------------------------
// Validação dos 4 Requisitos Cumulativos de TCO (Artigo 157.º do CRCSPSS)
// ----------------------------------------------------------------------------
export interface TCOSubstantiveRequirements {
  hasDMRProvingSalaryAtLeast1IAS: boolean;     // Requisito 1: Salário TCO >= 1 IAS
  hasFullCoverageSocialProtection: boolean;    // Requisito 2: Cobertura integral das eventualidades
  isSeparateLegalEntity: boolean;              // Requisito 3: Entidade empregadora distinta do TI
  hasNoCorporateOwnershipOver50Pct: boolean;   // Requisito 4: Participação societária <= 50%
}

export interface TCOExemptionEvaluationResult {
  qualifiesForExemption: boolean;
  isExemptByThreshold: boolean;
  legalGround: string;
  failedRequirements: string[];
}

export function evaluateTCOExemptionArt157(
  reqs: TCOSubstantiveRequirements,
  monthlyAverageRelevantIncomeCents: number
): TCOExemptionEvaluationResult {
  const failedRequirements: string[] = [];

  if (!reqs.hasDMRProvingSalaryAtLeast1IAS) {
    failedRequirements.push('REMUNERACAO_TCO_INFERIOR_A_1_IAS');
  }
  if (!reqs.hasFullCoverageSocialProtection) {
    failedRequirements.push('REGIME_PROTECAO_SOCIAL_SEM_COBERTURA_INTEGRAL');
  }
  if (!reqs.isSeparateLegalEntity) {
    failedRequirements.push('ENTIDADE_PATRONAL_IDENTICA_AO_TI');
  }
  if (!reqs.hasNoCorporateOwnershipOver50Pct) {
    failedRequirements.push('PARTICIPACAO_SOCIETARIA_SUPERIOR_A_50_POR_CENTO');
  }

  const qualifiesSubstantively = failedRequirements.length === 0;
  const isBelow4IAS = monthlyAverageRelevantIncomeCents < SS_TI_LIMIT_4_IAS_2026_CENTS;

  if (qualifiesSubstantively && isBelow4IAS) {
    return {
      qualifiesForExemption: true,
      isExemptByThreshold: true,
      legalGround: 'ISENCAO_PLENA_ART157_1_A_TCO_E_LIMIAR_4_IAS',
      failedRequirements: [],
    };
  }

  if (qualifiesSubstantively && !isBelow4IAS) {
    return {
      qualifiesForExemption: false,
      isExemptByThreshold: false,
      legalGround: 'SUJEITO_CONTRIBUICAO_EXCEDENTE_4_IAS_ART157_2',
      failedRequirements: ['RENDIMENTO_RELEVANTE_IGUAL_OU_SUPERIOR_4_IAS'],
    };
  }

  return {
    qualifiesForExemption: false,
    isExemptByThreshold: false,
    legalGround: 'NAO_QUALIFICA_FALTA_REQUISITOS_CUMULATIVOS_TCO',
    failedRequirements,
  };
}

// ----------------------------------------------------------------------------
// Regime de Subsídios Públicos (Artigo 31.º, n.ºs 1(e) e 5 vs DR 1-A/2011 Art. 62.º)
// ----------------------------------------------------------------------------
export interface PublicSubsidyEvaluation {
  totalGrantedAmountCents: number;
  annualImputedFractionCents: number;
  irsTaxableIncomeAnnualCents: number;
  ssRelevantIncomeAnnualCents: number;
  isIncludedInSSByWorkerOption: boolean;
  legalGroundIRS: string;
  legalGroundSS: string;
}

export function evaluatePublicSubsidyRegime(
  totalGrantedAmountCents: number,
  subsidyType: 'OPERATING' | 'NON_OPERATING_INVESTMENT',
  activityDomain: 'SERVICES' | 'GOODS_SALES',
  hasExercisedOptionToIncludeInSS: boolean = false
): PublicSubsidyEvaluation {
  if (subsidyType === 'OPERATING') {
    // Subsídios à exploração (Art. 31.º, 1, f CIRS / Rubrica própria da Declaração Trimestral SS)
    const irsTaxable = applyRateBps(totalGrantedAmountCents, 1000); // Coeficiente 0,10
    const ssCoeff = activityDomain === 'SERVICES' ? COEFF_SS_SERVICES_BPS : COEFF_SS_GOODS_SALES_BPS;
    const ssRelevant = applyRateBps(totalGrantedAmountCents, ssCoeff);

    return {
      totalGrantedAmountCents,
      annualImputedFractionCents: totalGrantedAmountCents,
      irsTaxableIncomeAnnualCents: irsTaxable,
      ssRelevantIncomeAnnualCents: ssRelevant,
      isIncludedInSSByWorkerOption: true,
      legalGroundIRS: 'ART31_1_F_CIRS_COEF_0_10',
      legalGroundSS: 'ART162_CRCSPSS_SUBSIDIO_EXPLORACAO',
    };
  }

  // Subsídio não destinado à exploração / investimento (Art. 31.º, n.º 1, al. e e n.º 5 do CIRS)
  // Fracionamento em 5 exercícios iguais nos termos do Art. 31.º, n.º 5
  const annualFractionCents = Math.floor(totalGrantedAmountCents / SUBSIDY_AMORTIZATION_YEARS_STANDARD);
  const irsTaxable = applyRateBps(annualFractionCents, 3000); // Coeficiente 0,30

  // Segurança Social: Artigo 62.º, n.º 3, al. c) do DR 1-A/2011 (excluído por defeito)
  let ssRelevant = 0;
  let groundSS = 'ART62_3_C_DR1A_2011_EXCLUIDO_POR_DEFEITO';

  if (hasExercisedOptionToIncludeInSS) {
    const ssCoeff = activityDomain === 'SERVICES' ? COEFF_SS_SERVICES_BPS : COEFF_SS_GOODS_SALES_BPS;
    ssRelevant = applyRateBps(annualFractionCents, ssCoeff);
    groundSS = 'ART62_4_5_DR1A_2011_INCLUIDO_POR_OPCAO_DECLARADA';
  }

  return {
    totalGrantedAmountCents,
    annualImputedFractionCents: annualFractionCents,
    irsTaxableIncomeAnnualCents: irsTaxable,
    ssRelevantIncomeAnnualCents: ssRelevant,
    isIncludedInSSByWorkerOption: hasExercisedOptionToIncludeInSS,
    legalGroundIRS: 'ART31_1_E_E_ART31_5_CIRS_FRACIONAMENTO_5_ANOS_COEF_0_30',
    legalGroundSS: groundSS,
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE III — MOTOR DE DESPESAS DO REGIME SIMPLIFICADO (FASE 4)
 * Artigo 31.º, n.ºs 2, 13 a 16 do CIRS
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface CategoryBGrossIncomesBreakdown {
  incomeArt31_1_a_SalesCents: number;            // Vendas mercadorias/produtos (al. a) -> Coef. 0,15 (Fora dos 15%)
  incomeArt31_1_b_Table151ServicesCents: number; // Atividades profissionais tab. 151.º (al. b) -> Coef. 0,75 (BASE 15%)
  incomeArt31_1_c_OtherServicesCents: number;    // Restantes serviços (al. c) -> Coef. 0,35 (BASE 15%)
  incomeArt31_1_d_IntellectualPropertyCapitalCents: number; // Prop. intelectual/capitais (al. d) -> Coef. 0,95 (Fora)
  incomeArt31_1_e_NonOperatingSubsidiesCents: number;       // Subsídios não exploração (al. e) -> Coef. 0,30 (Fora)
  incomeArt31_1_f_OperatingSubsidiesCents: number;          // Subsídios exploração (al. f) -> Coef. 0,10 (Fora)
  incomeArt31_1_h_LocalLodgingContainmentAreaCents?: number;// AL contenção (al. h) -> Coef. 0,50 (Fora)
}

export interface CategoryBEligibleExpensesBreakdown {
  mandatorySocialSecurityContributionsCents: number; // Art. 31.º, 13, al. a)
  staffSalariesAndWagesCents: number;                // Art. 31.º, 13, al. b) (100% elegível)
  operatingPropertyRentsCents: number;               // Art. 31.º, 13, al. c) (100% se exclusivo)
  partiallyAllocatedAssetsAllocatedShareCents: number; // Art. 31.º, 13, al. c/e + Art. 31.º, 14 (25%)
  specificallyAllocatedAssetDepreciationCents: number;// Art. 31.º, 13, al. d)
  otherGoodsAndServicesPurchasesCents: number;       // Art. 31.º, 13, al. e) (100% se exclusivo)
  importsAndIntraCommunityAcquisitionsCents: number; // Art. 31.º, 13, al. f) (100% elegível)
  otherActivityExpensesCents: number;
}

export type CIRSExpenseCategory =
  | 'ART31_13_B_PERSONNEL_CHARGES'
  | 'ART31_13_C_PROPERTY_RENTS'
  | 'ART31_13_D_PROPERTY_VPT_ALLOWANCE'
  | 'ART31_13_E_ACQUISITION_GOODS_SERVICES'
  | 'ART31_13_F_IMPORTS_AND_INTRACOMMUNITY';

export interface EvaluatedExpenseLineItem {
  expenseId: string;
  category: CIRSExpenseCategory;
  grossAmountConsideredCents: number;
  eligiblePercentageBps: number;
  netJustifiedAmountCents: number;
  statutoryGround: string;
}

export interface SimplifiedRegimeExpensesResult {
  servicesSubjectTo15PctBaseCents: number;
  excludedFrom15PctBaseCents: number;
  requiredExpenseThreshold15PctCents: number;

  statutoryBaseDeductionCents: number;
  baseDeductionSource: 'STANDARD_ART25_4104_EUR' | 'QUALIFIED_MANDATORY_CONNECTED_SS_CONTRIBUTIONS';

  automaticSpecificDeductionAppliedCents: number;
  actualDeductionAppliedCents: number;
  otherExpensesJustifiedCents: number;
  totalJustifiedExpensesCents: number;

  expenseShortfallAcrescimentoCents: number;
  justificationRatioBps: number;
  hasShortfall: boolean;
  isFullyJustified: boolean;
}

/**
 * Motor determinístico de cálculo de despesas do Artigo 31.º, n.ºs 13 a 16 do CIRS.
 * Implementa formalmente a disjunção legal da alínea a): max(Dedução Específica Padrão, SS Conexa).
 */
export function calculateSimplifiedRegimeExpenseRequirementAssessment(
  incomes: CategoryBGrossIncomesBreakdown,
  expenses: CategoryBEligibleExpensesBreakdown
): SimplifiedRegimeExpensesResult {
  // 1. Base Sujeita aos 15%: Exclusivamente alíneas b) e c) do Artigo 31.º, n.º 1
  const servicesBase =
    incomes.incomeArt31_1_b_Table151ServicesCents +
    incomes.incomeArt31_1_c_OtherServicesCents;

  const excludedBase =
    incomes.incomeArt31_1_a_SalesCents +
    incomes.incomeArt31_1_d_IntellectualPropertyCapitalCents +
    incomes.incomeArt31_1_e_NonOperatingSubsidiesCents +
    incomes.incomeArt31_1_f_OperatingSubsidiesCents +
    (incomes.incomeArt31_1_h_LocalLodgingContainmentAreaCents || 0);

  // 2. Exigência Imperativa de 15%
  const required15Pct = applyRateBps(servicesBase, EXPENSE_JUSTIFICATION_RATE_BPS);

  // 3. Regra Disjuntiva da Alínea a) do n.º 13:
  // max(Dedução Específica Art. 25.º de €4.104, Contribuições Obrigatórias de SS Conexas)
  const standardDeduction = ART_25_SPECIFIC_DEDUCTION_2026_CENTS; // 410.400 cêntimos
  const ssPaid = expenses.mandatorySocialSecurityContributionsCents || 0;

  let statutoryBaseDeduction = standardDeduction;
  let baseSource: SimplifiedRegimeExpensesResult['baseDeductionSource'] = 'STANDARD_ART25_4104_EUR';

  if (ssPaid > standardDeduction) {
    statutoryBaseDeduction = ssPaid;
    baseSource = 'QUALIFIED_MANDATORY_CONNECTED_SS_CONTRIBUTIONS';
  }

  // 4. Despesas Adicionais Efetivas das Alíneas b) a f)
  // Alínea b: Pessoal comunicadas por DMR -> 100%
  const staff = expenses.staffSalariesAndWagesCents || 0;

  // Alínea c: Rendas -> 100% exclusivo
  const rent = expenses.operatingPropertyRentsCents || 0;

  // Alínea c / e: Afetação parcial mista sob Art. 31.º, n.º 14 -> 25%
  const partial = expenses.partiallyAllocatedAssetsAllocatedShareCents
    ? applyRateBps(expenses.partiallyAllocatedAssetsAllocatedShareCents, PARTIAL_HABITATION_EXPENSE_RATE_BPS)
    : 0;

  // Alínea d: Amortizações / VPT afetos
  const depr = expenses.specificallyAllocatedAssetDepreciationCents || 0;

  // Alínea e: Aquisições gerais exclusivas -> 100%
  const generalPurchases = expenses.otherGoodsAndServicesPurchasesCents || 0;

  // Alínea f: Importações e AIC afetas à atividade -> 100%
  const importsAIC = expenses.importsAndIntraCommunityAcquisitionsCents || 0;

  const totalOtherExpenses = staff + rent + partial + depr + generalPurchases + importsAIC;

  // 5. Total de Despesas Justificadas
  const totalJustified = statutoryBaseDeduction + totalOtherExpenses;

  // 6. Apuramento do Acréscimo (Shortfall)
  const shortfall = Math.max(0, required15Pct - totalJustified);
  const isFullyJustified = shortfall === 0;

  const ratioBps =
    required15Pct > 0
      ? Math.min(10000, Math.floor((totalJustified * 10000) / required15Pct))
      : 10000;

  return {
    servicesSubjectTo15PctBaseCents: servicesBase,
    excludedFrom15PctBaseCents: excludedBase,
    requiredExpenseThreshold15PctCents: required15Pct,
    statutoryBaseDeductionCents: statutoryBaseDeduction,
    baseDeductionSource: baseSource,
    automaticSpecificDeductionAppliedCents: standardDeduction,
    actualDeductionAppliedCents: statutoryBaseDeduction,
    otherExpensesJustifiedCents: totalOtherExpenses,
    totalJustifiedExpensesCents: totalJustified,
    expenseShortfallAcrescimentoCents: shortfall,
    justificationRatioBps: ratioBps,
    hasShortfall: shortfall > 0,
    isFullyJustified,
  };
}
