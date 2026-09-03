// ============================================================================
// MIRA-GOLD 2026 — ORQUESTRADOR CANÓNICO DE RECIBOS VERDES (PORTÃO 3: U05)
// Implementação Consolidada da Fase 7 Homologada (Revisão 8)
// Pipeline End-to-End integrando Fases 1, 2, 3, 4, 5 e 6
// ============================================================================

import {
  IAS_2026_CENTS,
  applyRateBps,
  formatCentsToEurosCurrency,
  evaluateSocialSecurityTemporalStatus,
  SocialSecurityTemporalCoverageEvaluation
} from './miraMonetaryEngine';

import {
  TaxDocumentaryEvidenceRecord,
  CategoryBEligibleExpensesBreakdown,
  calculateSimplifiedRegimeExpenseRequirementAssessment,
  SimplifiedRegimeExpensesResult
} from './miraExpenseAndEvidenceEngine';

import {
  QuarterlySocialSecurityDeclarationInput,
  MonthlySocialSecurityAssessmentResult,
  calculateMonthlySocialSecurityAssessment
} from './miraSocialSecurityEngine';

import {
  ComprehensiveCategoryBGrossIncomes,
  TaxpayerPersonalTaxContext,
  IRSCalculationDetailedResult,
  IRS_BRACKETS_2026,
  calculateArt68ColetaStatutory,
  calculateAnnualIRSLiquidationAssessment
} from './miraTaxEngine';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE I — MODELOS E CONTRATOS DO ORQUESTRADOR GLOBAL
 * ════════════════════════════════════════════════════════════════════════════
 */

export interface CategoryAEmploymentTaxContext {
  monthlyGrossSalaryCents: number;      // 1.500,00 € (150.000 c.)
  numberOfPaymentMonths: number;        // 14 pagamentos anuais (Art. 99.º-C/5)
  tableCode: 'TABELA_I_NAO_CASADO_OU_CASADO_2_TITULARES';
  marginalWithholdingRateBps: number;   // 24,10% (2.410 bps)
  withholdingAbatementCents: number;    // 193,33 € (19.333 c.)
  annualSpecificDeductionCents: number; // 4.104,00 € (410.400 c. - Art. 25.º)
}

export interface MiraTaxpayerAnnualComprehensiveProfile {
  taxpayerNif: string;
  taxYear: number;
  taxTerritory: 'CONTINENTE' | 'MADEIRA' | 'ACORES';
  isJointFilingMarried: boolean;

  // Fase 1: Cronologia e Primeiro Enquadramento
  activityStartDateIso: string;
  isFirstRegistrationEver: boolean;
  art146EarlyCoverageRequestDateIso?: string;

  // Estatuto de Início para Efeitos de IRS (Artigo 31.º, n.ºs 10 e 11)
  activityStartStatus: 'NONE' | 'FIRST_YEAR_START' | 'SECOND_YEAR_START';
  hasCategoryAOrHIncomesInPeriod: boolean;
  hasCeasedActivityInPrior5Years: boolean;

  // Categoria A Concorrente (Artigo 22.º do CIRS e Despacho 233-A/2026)
  categoryAEmploymentContext?: CategoryAEmploymentTaxContext;

  // Regime de Segurança Social (Artigo 168.º, n.º 1)
  isRegisteredENIEIRL: boolean; // Taxa 25,2% vs 21,4%
  qualifiesForArt70SubjectiveScope: boolean; // Tabela do Art. 151.º

  // Fase 3: Provas TCO (Artigo 157.º, n.º 1, al. a)
  tcoProofContext?: {
    hasDMRProvingSalaryAtLeast1IAS: boolean;
    hasFullCoverageSocialProtection: boolean;
    isSeparateLegalEntity: boolean;
    hasNoCorporateOwnershipOver50Pct: boolean;
  };

  // Fase 3: Registos Probatórios Documentais
  documentaryRecords: TaxDocumentaryEvidenceRecord[];

  // Declarações Trimestrais de Faturação
  quarterlyDeclarations: [
    QuarterlySocialSecurityDeclarationInput,
    QuarterlySocialSecurityDeclarationInput,
    QuarterlySocialSecurityDeclarationInput,
    QuarterlySocialSecurityDeclarationInput
  ];

  // Contexto de Retenção na Fonte Cat. B (Artigos 101.º e 101.º-B)
  clientWithholdingDeclarations: {
    hasExercisedArticle101BOption: boolean;
    priorYearTurnoverUnder15k: boolean;
    isContractIntermediationCommission: boolean;
  };

  // Clientes com Dependência Económica (Artigos 140.º e 168.º, n.º 7)
  contractingEntitiesAudit?: {
    totalAnnualServicesBilledCents: number;
    clientsWithOver50PctDependency: Array<{
      clientNif: string;
      corporateGroupId?: string;
      annualBilledCents: number;
      dependencyPctBps: number;
    }>;
  };
}

export interface MiraAnnualTaxAndSocialSecurityConsolidatedReport {
  taxpayerNif: string;
  taxYear: number;
  temporalCoverageStatus: SocialSecurityTemporalCoverageEvaluation;
  socialSecurity: {
    totalAnnualQuarterlyDeclaredGrossCents: number;
    totalAnnualRelevantIncomeCents: number;
    quarterlyAssessments: MonthlySocialSecurityAssessmentResult[];
    totalAnnualPersonalSSPaidCents: number;
    contractingEntitiesTotalPatronalDueCents: number;
  };
  expenses: {
    servicesSubjectTo15PctBaseCents: number;
    requiredExpenseThreshold15PctCents: number;
    automaticSpecificDeductionAppliedCents: number;
    actualDeductionAppliedCents: number;
    expenseShortfallAcrescimentoCents: number;
    justificationRatioBps: number;
    hasShortfall: boolean;
  };
  irsLiquidation: IRSCalculationDetailedResult;
  globalTaxAssessment?: {
    categoryANetTaxableIncomeCents: number;
    categoryBNetTaxableIncomeCents: number;
    globalTaxableIncomeColetavelCents: number;
    coletaTotalGlobalCents: number;
    categoryAWithholdingPaidCents: number;
    categoryBWithholdingPaidCents: number;
    totalGlobalWithholdingPaidCents: number;
    provisionalTaxBalanceBeforeDeductionsCents: number;
  };
  netFinancialPosition: {
    totalGrossIncomesCents: number;
    totalMandatorySSPaidCents: number;
    totalWithholdingTaxPaidCents: number;
    finalIRSBalanceDueOrRefundCents: number;
    totalEffectiveTaxBurdenCents: number;
    effectiveBurdenBps: number;
    netTakeHomeIncomeCents: number;
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE II — AGREGADOR DE PROVA DOCUMENTAL (FASE 3)
 * ════════════════════════════════════════════════════════════════════════════
 */

export function aggregateDocumentaryEvidenceToTaxIncomesAndExpenses(
  records: TaxDocumentaryEvidenceRecord[]
): {
  incomes: ComprehensiveCategoryBGrossIncomes;
  expenses: CategoryBEligibleExpensesBreakdown;
  billedWithTable151Cents: number;
  billedWithOtherServicesCents: number;
  billedWithIntellectualPropCents: number;
} {
  let a_Sales = 0;
  let b_Table151 = 0;
  let c_OtherServices = 0;
  let d_Intellectual = 0;
  let e_NonOperating = 0;
  let f_Operating = 0;
  let g_Transparent = 0;
  let h_ContainmentAL = 0;

  let staffSalaries = 0;
  let rentExpenses = 0;
  let partialAssets = 0;
  let specificAssets = 0;
  let otherAcquisitions = 0;
  let importsAIC = 0;

  for (const doc of records) {
    if (!doc.isLegallyCompliant || doc.isRejected) continue;

    const amt = doc.amountCents;
    switch (doc.subCategoryCode) {
      case 'ART31_1_A_SALES': a_Sales += amt; break;
      case 'ART31_1_B_TABLE151': b_Table151 += amt; break;
      case 'ART31_1_C_OTHER_SERVICES': c_OtherServices += amt; break;
      case 'ART31_1_D_INTELLECTUAL': d_Intellectual += amt; break;
      case 'ART31_1_E_NON_OPERATING_SUBSIDY': e_NonOperating += amt; break;
      case 'ART31_1_F_OPERATING_SUBSIDY': f_Operating += amt; break;
      case 'ART31_1_G_TRANSPARENCY_CONTROL': g_Transparent += amt; break;
      case 'ART31_1_H_CONTAINMENT_AL': h_ContainmentAL += amt; break;

      case 'EXPENSE_13_B_STAFF': staffSalaries += amt; break;
      case 'EXPENSE_13_C_RENT': rentExpenses += amt; break;
      case 'EXPENSE_13_C_PARTIAL_RENT': partialAssets += amt; break;
      case 'EXPENSE_13_D_DEPRECIATION': specificAssets += amt; break;
      case 'EXPENSE_13_E_ACQUISITIONS': otherAcquisitions += amt; break;
      case 'EXPENSE_13_F_IMPORTS_AIC': importsAIC += amt; break;
    }
  }

  return {
    incomes: {
      incomeArt31_1_a_SalesCents: a_Sales,
      incomeArt31_1_b_Table151ServicesCents: b_Table151,
      incomeArt31_1_c_OtherServicesCents: c_OtherServices,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: d_Intellectual,
      incomeArt31_1_e_NonOperatingSubsidiesCents: e_NonOperating,
      incomeArt31_1_f_OperatingSubsidiesCents: f_Operating,
      incomeArt31_1_h_LocalLodgingContainmentAreaCents: h_ContainmentAL,
    },
    expenses: {
      mandatorySocialSecurityContributionsCents: 0,
      staffSalariesAndWagesCents: staffSalaries,
      operatingPropertyRentsCents: rentExpenses,
      partiallyAllocatedAssetsAllocatedShareCents: partialAssets,
      specificallyAllocatedAssetDepreciationCents: specificAssets,
      otherGoodsAndServicesPurchasesCents: otherAcquisitions,
      importsAndIntraCommunityAcquisitionsCents: importsAIC,
      otherActivityExpensesCents: 0,
    },
    billedWithTable151Cents: b_Table151 + g_Transparent,
    billedWithOtherServicesCents: c_OtherServices,
    billedWithIntellectualPropCents: d_Intellectual,
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PARTE III — PIPELINE DO ORQUESTRADOR CANÓNICO GLOBAL
 * ════════════════════════════════════════════════════════════════════════════
 */

export function runMiraComprehensiveAnnualAssessment(
  profile: MiraTaxpayerAnnualComprehensiveProfile
): MiraAnnualTaxAndSocialSecurityConsolidatedReport {
  // 1. Agregação documental da Fase 3
  const evidence = aggregateDocumentaryEvidenceToTaxIncomesAndExpenses(profile.documentaryRecords);

  const totalEvidenceIncomesCents =
    evidence.incomes.incomeArt31_1_a_SalesCents +
    evidence.incomes.incomeArt31_1_b_Table151ServicesCents +
    evidence.incomes.incomeArt31_1_c_OtherServicesCents +
    evidence.incomes.incomeArt31_1_d_IntellectualPropertyCapitalCents +
    evidence.incomes.incomeArt31_1_e_NonOperatingSubsidiesCents +
    evidence.incomes.incomeArt31_1_f_OperatingSubsidiesCents +
    (evidence.incomes.incomeArt31_1_h_LocalLodgingContainmentAreaCents || 0);

  let annualIncomes = evidence.incomes;
  if (totalEvidenceIncomesCents === 0) {
    let qSales = 0;
    let qOperatingSubsidies = 0;
    for (const q of profile.quarterlyDeclarations) {
      qSales += q.grossSalesAndProductionCents + q.grossHospitalityCents;
      qOperatingSubsidies += q.grossOperatingSubsidiesCents;
    }
    annualIncomes = {
      incomeArt31_1_a_SalesCents: qSales,
      incomeArt31_1_b_Table151ServicesCents: profile.quarterlyDeclarations.reduce((acc, q) => acc + q.grossServicesGeneralCents, 0),
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: qOperatingSubsidies,
      incomeArt31_1_h_LocalLodgingContainmentAreaCents: 0,
    };
  }

  // 2. Avaliação Temporal da Segurança Social (Fase 1: Arts. 145.º e 146.º)
  const temporalStatus = evaluateSocialSecurityTemporalStatus(
    profile.activityStartDateIso,
    profile.isFirstRegistrationEver,
    profile.art146EarlyCoverageRequestDateIso
  );

  // 3. Verificação de Isenção TCO (Fase 3: Artigo 157.º)
  let qualifiesForTCOExemption = false;
  if (profile.tcoProofContext) {
    const tco = profile.tcoProofContext;
    qualifiesForTCOExemption =
      tco.hasDMRProvingSalaryAtLeast1IAS &&
      tco.hasFullCoverageSocialProtection &&
      tco.isSeparateLegalEntity &&
      tco.hasNoCorporateOwnershipOver50Pct;
  }

  // 4. Execução do Motor de Segurança Social Trimestral (Fase 5)
  const ssAssessments: MonthlySocialSecurityAssessmentResult[] = [];
  let totalAnnualSSGrossCents = 0;
  let totalAnnualRelevantIncomeCents = 0;
  let totalAnnualPersonalSSPaidCents = 0;

  const quarterPaymentMonths = [
    [5, 6, 7],   // Q1
    [8, 9, 10],  // Q2
    [11, 12, 1], // Q3
    [2, 3, 4],   // Q4
  ];

  for (let qIdx = 0; qIdx < profile.quarterlyDeclarations.length; qIdx++) {
    const qDecl = profile.quarterlyDeclarations[qIdx];
    qDecl.taxpayerRateBps = profile.isRegisteredENIEIRL ? 2520 : 2140;

    let qResult = calculateMonthlySocialSecurityAssessment(qDecl);

    const pMonths = quarterPaymentMonths[qIdx];
    let payableMonthsCount = 0;
    for (const m of pMonths) {
      if (!temporalStatus.isMonthExemptFromContributions(profile.taxYear, m)) {
        payableMonthsCount++;
      }
    }

    if (payableMonthsCount === 0) {
      qResult = {
        ...qResult,
        monthlyContributionDueCents: 0,
        notes: `ISENCAO_TEMPORAL_PRIMEIRO_ENQUADRAMENTO_${temporalStatus.legalGround}`,
      };
    } else if (qualifiesForTCOExemption && qResult.monthlyAverageRelevantIncomeCents < 4 * IAS_2026_CENTS) {
      qResult = {
        ...qResult,
        monthlyContributionDueCents: 0,
        notes: 'ISENCAO_PLENA_TCO_ART157_1_A',
      };
    }

    ssAssessments.push(qResult);

    totalAnnualSSGrossCents +=
      qDecl.grossServicesGeneralCents +
      qDecl.grossSalesAndProductionCents +
      qDecl.grossHospitalityCents +
      qDecl.grossOperatingSubsidiesCents;

    totalAnnualRelevantIncomeCents += qResult.quarterlyRelevantIncomeCents;
    totalAnnualPersonalSSPaidCents += qResult.monthlyContributionDueCents * payableMonthsCount;
  }

  // 5. Responsabilidade Patronal das Entidades Contratantes (Arts. 140.º e 168.º, 7)
  let contractingEntitiesTotalPatronalDueCents = 0;
  if (
    profile.contractingEntitiesAudit &&
    profile.contractingEntitiesAudit.totalAnnualServicesBilledCents >= 6 * IAS_2026_CENTS
  ) {
    for (const client of profile.contractingEntitiesAudit.clientsWithOver50PctDependency) {
      if (client.dependencyPctBps > 8000) {
        contractingEntitiesTotalPatronalDueCents += applyRateBps(client.annualBilledCents, 1000);
      } else if (client.dependencyPctBps >= 5000) {
        contractingEntitiesTotalPatronalDueCents += applyRateBps(client.annualBilledCents, 700);
      }
    }
  }

  // 6. Motor de Despesas do Regime Simplificado (Fase 4: Artigo 31.º, n.ºs 13 a 16)
  const expensesWithSS: CategoryBEligibleExpensesBreakdown = {
    ...evidence.expenses,
    mandatorySocialSecurityContributionsCents: totalAnnualPersonalSSPaidCents,
  };

  const expenseAssessment = calculateSimplifiedRegimeExpenseRequirementAssessment(
    annualIncomes,
    expensesWithSS
  );

  // 7. Contexto de IRS da Categoria B e Benefício de Início (Fase 6: Art. 31.º/10)
  const effectiveStartStatus = profile.hasCategoryAOrHIncomesInPeriod
    ? 'NONE'
    : profile.activityStartStatus;

  const personalContext: TaxpayerPersonalTaxContext = {
    taxTerritory: profile.taxTerritory,
    isJointFilingMarried: profile.isJointFilingMarried,
    activityStartStatus: effectiveStartStatus,
    hasCategoryAOrHIncomesInPeriod: profile.hasCategoryAOrHIncomesInPeriod,
    hasCeasedActivityInPrior5Years: profile.hasCeasedActivityInPrior5Years,
    appliesArticle31ParagraphG: false,
    qualifiesForArt70SubjectiveScope: profile.qualifiesForArt70SubjectiveScope,
    clientWithholdingDeclarations: {
      billedWithTable151Cents: evidence.billedWithTable151Cents,
      billedWithOtherServicesCents: evidence.billedWithOtherServicesCents,
      billedWithIntellectualPropCents: evidence.billedWithIntellectualPropCents,
      hasExercisedArticle101BOption: profile.clientWithholdingDeclarations.hasExercisedArticle101BOption,
      priorYearTurnoverUnder15k: profile.clientWithholdingDeclarations.priorYearTurnoverUnder15k,
      isContractIntermediationCommission: profile.clientWithholdingDeclarations.isContractIntermediationCommission,
    },
  };

  // 8. Execução do Motor de Liquidação de IRS (Fase 6)
  let irsLiquidation = calculateAnnualIRSLiquidationAssessment(
    annualIncomes,
    expenseAssessment.expenseShortfallAcrescimentoCents,
    totalAnnualPersonalSSPaidCents,
    personalContext
  );

  // Recálculo da Coleta do Artigo 68.º pela regra estatutária estrita do n.º 2 se estiver no 9.º escalão
  if (irsLiquidation.finalTaxableIncomeColetavelCents > 8663400) {
    const statutoryColetaArt68 = calculateArt68ColetaStatutory(irsLiquidation.finalTaxableIncomeColetavelCents);
    const statutoryColetaTotal = statutoryColetaArt68 + irsLiquidation.solidarityTaxArt68ACents;
    const statutoryBalance = statutoryColetaTotal - irsLiquidation.totalWithholdingTaxPaidCents;
    irsLiquidation = {
      ...irsLiquidation,
      coletaBaseGeralArt68Cents: statutoryColetaArt68,
      coletaTotalCents: statutoryColetaTotal,
      finalTaxBalanceCents: statutoryBalance,
    };
  }

  // 9. Englobamento com Categoria A Concorrente (Artigo 22.º e Despacho 233-A/2026)
  let globalTaxAssessment: MiraAnnualTaxAndSocialSecurityConsolidatedReport['globalTaxAssessment'];
  let totalWithholdingTaxPaidCents = irsLiquidation.totalWithholdingTaxPaidCents;

  if (profile.categoryAEmploymentContext) {
    const catA = profile.categoryAEmploymentContext;
    const catAGrossAnnualCents = catA.monthlyGrossSalaryCents * catA.numberOfPaymentMonths;
    const catANet = Math.max(0, catAGrossAnnualCents - catA.annualSpecificDeductionCents);
    const catBNet = irsLiquidation.finalTaxableIncomeColetavelCents;
    const globalColetavel = catANet + catBNet;

    // Retenção na fonte da Categoria A sob Artigo 99.º-E, n.º 1 (arredondada para euros inferiores)
    const rawMonthlyWithholdingCents = Math.max(
      0,
      applyRateBps(catA.monthlyGrossSalaryCents, catA.marginalWithholdingRateBps) - catA.withholdingAbatementCents
    );
    const roundedMonthlyWithholdingCents = Math.floor(rawMonthlyWithholdingCents / 100) * 100;
    const categoryAWithholdingPaidCents = roundedMonthlyWithholdingCents * catA.numberOfPaymentMonths;

    let bracket = IRS_BRACKETS_2026[0];
    for (const b of IRS_BRACKETS_2026) {
      if (globalColetavel <= b.upperLimitCents) {
        bracket = b;
        break;
      }
    }
    const coletaTotalGlobalCents =
      applyRateBps(globalColetavel, bracket.marginalRateBps) - bracket.abatementAmountCents;

    const totalGlobalWithholdingPaidCents =
      categoryAWithholdingPaidCents + irsLiquidation.totalWithholdingTaxPaidCents;

    const provisionalTaxBalanceBeforeDeductionsCents =
      coletaTotalGlobalCents - totalGlobalWithholdingPaidCents;

    globalTaxAssessment = {
      categoryANetTaxableIncomeCents: catANet,
      categoryBNetTaxableIncomeCents: catBNet,
      globalTaxableIncomeColetavelCents: globalColetavel,
      coletaTotalGlobalCents,
      categoryAWithholdingPaidCents,
      categoryBWithholdingPaidCents: irsLiquidation.totalWithholdingTaxPaidCents,
      totalGlobalWithholdingPaidCents,
      provisionalTaxBalanceBeforeDeductionsCents,
    };

    totalWithholdingTaxPaidCents = totalGlobalWithholdingPaidCents;
  }

  // 10. Apuramento da Posição Financeira Líquida e Carga Tributária Global
  const totalGrossIncomesCents =
    annualIncomes.incomeArt31_1_a_SalesCents +
    annualIncomes.incomeArt31_1_b_Table151ServicesCents +
    annualIncomes.incomeArt31_1_c_OtherServicesCents +
    annualIncomes.incomeArt31_1_d_IntellectualPropertyCapitalCents +
    annualIncomes.incomeArt31_1_e_NonOperatingSubsidiesCents +
    annualIncomes.incomeArt31_1_f_OperatingSubsidiesCents +
    (annualIncomes.incomeArt31_1_h_LocalLodgingContainmentAreaCents || 0) +
    (profile.categoryAEmploymentContext
      ? profile.categoryAEmploymentContext.monthlyGrossSalaryCents * profile.categoryAEmploymentContext.numberOfPaymentMonths
      : 0);

  const effectiveIRSDue = globalTaxAssessment
    ? globalTaxAssessment.coletaTotalGlobalCents
    : irsLiquidation.coletaTotalCents;

  const totalEffectiveTaxBurdenCents = totalAnnualPersonalSSPaidCents + effectiveIRSDue;

  const effectiveBurdenBps =
    totalGrossIncomesCents > 0
      ? Math.floor((totalEffectiveTaxBurdenCents * 10000) / totalGrossIncomesCents)
      : 0;

  const netTakeHomeIncomeCents = totalGrossIncomesCents - totalEffectiveTaxBurdenCents;

  return {
    taxpayerNif: profile.taxpayerNif,
    taxYear: profile.taxYear,
    temporalCoverageStatus: temporalStatus,
    socialSecurity: {
      totalAnnualQuarterlyDeclaredGrossCents: totalAnnualSSGrossCents,
      totalAnnualRelevantIncomeCents,
      quarterlyAssessments: ssAssessments,
      totalAnnualPersonalSSPaidCents,
      contractingEntitiesTotalPatronalDueCents,
    },
    expenses: {
      servicesSubjectTo15PctBaseCents: expenseAssessment.servicesSubjectTo15PctBaseCents,
      requiredExpenseThreshold15PctCents: expenseAssessment.requiredExpenseThreshold15PctCents,
      automaticSpecificDeductionAppliedCents: expenseAssessment.automaticSpecificDeductionAppliedCents,
      actualDeductionAppliedCents: expenseAssessment.actualDeductionAppliedCents,
      expenseShortfallAcrescimentoCents: expenseAssessment.expenseShortfallAcrescimentoCents,
      justificationRatioBps: expenseAssessment.justificationRatioBps,
      hasShortfall: expenseAssessment.hasShortfall,
    },
    irsLiquidation,
    globalTaxAssessment,
    netFinancialPosition: {
      totalGrossIncomesCents,
      totalMandatorySSPaidCents: totalAnnualPersonalSSPaidCents,
      totalWithholdingTaxPaidCents,
      finalIRSBalanceDueOrRefundCents: globalTaxAssessment
        ? globalTaxAssessment.provisionalTaxBalanceBeforeDeductionsCents
        : irsLiquidation.finalTaxBalanceCents,
      totalEffectiveTaxBurdenCents,
      effectiveBurdenBps,
      netTakeHomeIncomeCents,
    },
  };
}
