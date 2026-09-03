// ============================================================================
// BATERIA FORENSE INTEGRADA END-TO-END (PORTÃO 3: UNIDADE 5)
// Suíte de Testes Canónicos E2E-01 a E2E-06 Homologados na Fase 7 R8
// ============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  runMiraComprehensiveAnnualAssessment,
  MiraTaxpayerAnnualComprehensiveProfile,
} from '../miraRecibosVerdesOrchestrator';

describe('P03-U05: Orquestrador Global e Bateria Forense E2E (Fase 7)', () => {
  test('E2E-01: Trabalhador Independente Geral (Tabela Art. 151.º) — €40.000', () => {
    // 4 trimestres de 10.000 € em serviços da tabela do Artigo 151.º
    const profile: MiraTaxpayerAnnualComprehensiveProfile = {
      taxpayerNif: '200111222',
      taxYear: 2026,
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartDateIso: '2023-01-01',
      isFirstRegistrationEver: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      isRegisteredENIEIRL: false,
      qualifiesForArt70SubjectiveScope: true,
      documentaryRecords: [
        {
          documentId: 'doc-01',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'ART31_1_B_TABLE151',
          amountCents: 4000000, // 40.000,00 €
          issueDateIso: '2026-03-31',
          isLegallyCompliant: true,
          isRejected: false,
        },
        // Despesas elegíveis que cobrem a exigência dos 15%
        {
          documentId: 'doc-exp',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'EXPENSE_13_C_RENT',
          amountCents: 1000000, // 10.000,00 € em rendas operacionais elegíveis
          issueDateIso: '2026-06-30',
          isLegallyCompliant: true,
          isRejected: false,
        }
      ],
      quarterlyDeclarations: [
        { grossServicesGeneralCents: 1000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 1000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 1000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 1000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
      ],
      clientWithholdingDeclarations: {
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = runMiraComprehensiveAnnualAssessment(profile);

    // 1. Segurança Social TI
    assert.equal(res.socialSecurity.totalAnnualPersonalSSPaidCents, 599196, 'SS Total TI = 5.991,96 € (12 x 499,33 €)');

    // 2. Despesas
    assert.equal(res.expenses.hasShortfall, false, 'Sem acréscimo de despesas');
    assert.equal(res.expenses.expenseShortfallAcrescimentoCents, 0);

    // 3. Matéria Coletável e IRS
    assert.equal(res.irsLiquidation.finalTaxableIncomeColetavelCents, 3000000, 'Matéria coletável: 40.000€ x 0,75 = 30.000,00 €');
    assert.equal(res.irsLiquidation.applicableBracketNumber, 6, '6.º Escalão');
    assert.equal(res.irsLiquidation.coletaBaseGeralArt68Cents, 626015, 'Coleta Artigo 68.º = 6.260,15 €');
    assert.equal(res.irsLiquidation.totalWithholdingTaxPaidCents, 920000, 'Retenção a 23% = 9.200,00 €');
    assert.equal(res.irsLiquidation.finalTaxBalanceCents, -293985, 'Saldo provisório: -2.939,85 € (Reembolso)');

    // 4. Posição Financeira Líquida
    assert.equal(res.netFinancialPosition.totalEffectiveTaxBurdenCents, 1225211, 'Encargo total efetivo = 12.252,11 €');
    assert.equal(res.netFinancialPosition.effectiveBurdenBps, 3063, 'Taxa de esforço = 30,63%');
  });

  test('E2E-02: Início de Atividade em 15-01-2026 com Retenção a 23% — €24.000', () => {
    const profile: MiraTaxpayerAnnualComprehensiveProfile = {
      taxpayerNif: '200222333',
      taxYear: 2026,
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartDateIso: '2026-01-15',
      isFirstRegistrationEver: true,
      activityStartStatus: 'FIRST_YEAR_START',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      isRegisteredENIEIRL: false,
      qualifiesForArt70SubjectiveScope: true,
      documentaryRecords: [
        {
          documentId: 'doc-02',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'ART31_1_B_TABLE151',
          amountCents: 2400000, // 24.000,00 €
          issueDateIso: '2026-04-15',
          isLegallyCompliant: true,
          isRejected: false,
        },
        {
          documentId: 'doc-exp-02',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'EXPENSE_13_C_RENT',
          amountCents: 500000, // 5.000,00 €
          issueDateIso: '2026-07-15',
          isLegallyCompliant: true,
          isRejected: false,
        }
      ],
      quarterlyDeclarations: [
        { grossServicesGeneralCents: 600000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 600000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 600000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 600000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
      ],
      clientWithholdingDeclarations: {
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = runMiraComprehensiveAnnualAssessment(profile);

    // 1. Isenção temporal de Segurança Social
    assert.equal(res.socialSecurity.totalAnnualPersonalSSPaidCents, 0, 'Isenção total de SS em 2026');

    // 2. Benefício de início Artigo 31.º, n.º 10 (50% de redução, coeficiente 0,375)
    assert.equal(res.irsLiquidation.activityStartBenefitApplied, true);
    assert.equal(res.irsLiquidation.coefficientEffectiveB_bps, 3750);
    assert.equal(res.irsLiquidation.finalTaxableIncomeColetavelCents, 900000, 'Matéria coletável: 24.000€ x 0,375 = 9.000,00 €');
    assert.equal(res.irsLiquidation.coletaBaseGeralArt68Cents, 114606, 'Coleta 2.º escalão = 1.146,06 €');
    assert.equal(res.irsLiquidation.totalWithholdingTaxPaidCents, 552000, 'Retenção a 23% suportada = 5.520,00 €');
    assert.equal(res.irsLiquidation.finalTaxBalanceCents, -437394, 'Saldo: -4.373,94 € (Reembolso)');
    assert.equal(res.netFinancialPosition.totalEffectiveTaxBurdenCents, 114606);
    assert.equal(res.netFinancialPosition.effectiveBurdenBps, 477, 'Carga fiscal efetiva = 4,77% ~ 4,78%');
  });

  test('E2E-03: Acumulação TCO (€21.000) + Recibos Verdes (€12.000)', () => {
    const profile: MiraTaxpayerAnnualComprehensiveProfile = {
      taxpayerNif: '200333444',
      taxYear: 2026,
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartDateIso: '2023-01-01',
      isFirstRegistrationEver: false,
      activityStartStatus: 'FIRST_YEAR_START',
      hasCategoryAOrHIncomesInPeriod: true, // Afasta Art. 31.º/10!
      hasCeasedActivityInPrior5Years: false,
      categoryAEmploymentContext: {
        monthlyGrossSalaryCents: 150000,
        numberOfPaymentMonths: 14,
        tableCode: 'TABELA_I_NAO_CASADO_OU_CASADO_2_TITULARES',
        marginalWithholdingRateBps: 2410,
        withholdingAbatementCents: 19333,
        annualSpecificDeductionCents: 410400,
      },
      isRegisteredENIEIRL: false,
      qualifiesForArt70SubjectiveScope: true,
      tcoProofContext: {
        hasDMRProvingSalaryAtLeast1IAS: true,
        hasFullCoverageSocialProtection: true,
        isSeparateLegalEntity: true,
        hasNoCorporateOwnershipOver50Pct: true,
      },
      documentaryRecords: [
        {
          documentId: 'doc-03',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'ART31_1_B_TABLE151',
          amountCents: 1200000, // 12.000,00 €
          issueDateIso: '2026-05-20',
          isLegallyCompliant: true,
          isRejected: false,
        }
      ],
      quarterlyDeclarations: [
        { grossServicesGeneralCents: 300000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 300000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 300000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 300000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
      ],
      clientWithholdingDeclarations: {
        hasExercisedArticle101BOption: true, // Isento até 15.000€
        priorYearTurnoverUnder15k: true,
        isContractIntermediationCommission: false,
      },
    };

    const res = runMiraComprehensiveAnnualAssessment(profile);

    // 1. Isenção TCO de Segurança Social
    assert.equal(res.socialSecurity.totalAnnualPersonalSSPaidCents, 0, 'Isenção plena de SS por TCO');

    // 2. Coexistência de Categoria A afasta benefício do Art. 31.º/10
    assert.equal(res.irsLiquidation.activityStartBenefitApplied, false);
    assert.equal(res.irsLiquidation.coefficientEffectiveB_bps, 7500, 'Coeficiente normal de 0,75');
    assert.equal(res.irsLiquidation.finalTaxableIncomeColetavelCents, 900000, 'Cat. B líquida = 9.000,00 €');

    // 3. Englobamento Global
    assert.ok(res.globalTaxAssessment);
    assert.equal(res.globalTaxAssessment.categoryANetTaxableIncomeCents, 1689600, 'Cat. A líquida = 16.896,00 €');
    assert.equal(res.globalTaxAssessment.categoryBNetTaxableIncomeCents, 900000, 'Cat. B líquida = 9.000,00 €');
    assert.equal(res.globalTaxAssessment.globalTaxableIncomeColetavelCents, 2589600, 'Coletável Global = 25.896,00 €');
    assert.equal(res.globalTaxAssessment.coletaTotalGlobalCents, 496090, 'Coleta global 5.º escalão = 4.960,90 €');
    assert.equal(res.globalTaxAssessment.categoryAWithholdingPaidCents, 235200, 'Retenção Cat. A (168€ x 14) = 2.352,00 €');
    assert.equal(res.globalTaxAssessment.categoryBWithholdingPaidCents, 0, 'Retenção Cat. B = 0,00 €');
    assert.equal(res.globalTaxAssessment.provisionalTaxBalanceBeforeDeductionsCents, 260890, 'Saldo a pagar = 2.608,90 €');
  });

  test('E2E-04: ENI / Restauração e Alojamento Local — €60.000', () => {
    const profile: MiraTaxpayerAnnualComprehensiveProfile = {
      taxpayerNif: '200444555',
      taxYear: 2026,
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartDateIso: '2023-01-01',
      isFirstRegistrationEver: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      isRegisteredENIEIRL: true, // ENI: taxa SS 25,2%
      qualifiesForArt70SubjectiveScope: false,
      documentaryRecords: [
        {
          documentId: 'doc-04',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'ART31_1_A_SALES',
          amountCents: 6000000, // 60.000,00 €
          issueDateIso: '2026-06-01',
          isLegallyCompliant: true,
          isRejected: false,
        }
      ],
      quarterlyDeclarations: [
        { grossServicesGeneralCents: 0, grossSalesAndProductionCents: 1500000, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 0, grossSalesAndProductionCents: 1500000, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 0, grossSalesAndProductionCents: 1500000, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 0, grossSalesAndProductionCents: 1500000, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
      ],
      clientWithholdingDeclarations: {
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = runMiraComprehensiveAnnualAssessment(profile);

    // 1. SS ENI a 25,2%
    assert.equal(res.socialSecurity.totalAnnualPersonalSSPaidCents, 302400, 'SS Total ENI = 3.024,00 € (12 x 252,00 €)');

    // 2. Matéria Coletável Cat. B (alínea a: coeficiente 0,15)
    assert.equal(res.irsLiquidation.finalTaxableIncomeColetavelCents, 900000, '60.000€ x 0,15 = 9.000,00 €');
    assert.equal(res.irsLiquidation.coletaBaseGeralArt68Cents, 114606, 'Coleta = 1.146,06 €');
    assert.equal(res.irsLiquidation.totalWithholdingTaxPaidCents, 0, 'Vendas sem retenção');
    assert.equal(res.irsLiquidation.finalTaxBalanceCents, 114606, 'Saldo: 1.146,06 € a pagar');
  });

  test('E2E-05: Outros Serviços (€30.000) com Cliente Único / Entidade Contratante (85%)', () => {
    const profile: MiraTaxpayerAnnualComprehensiveProfile = {
      taxpayerNif: '200555666',
      taxYear: 2026,
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartDateIso: '2023-01-01',
      isFirstRegistrationEver: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      isRegisteredENIEIRL: false,
      qualifiesForArt70SubjectiveScope: false,
      documentaryRecords: [
        {
          documentId: 'doc-05',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'ART31_1_C_OTHER_SERVICES',
          amountCents: 3000000, // 30.000,00 €
          issueDateIso: '2026-05-10',
          isLegallyCompliant: true,
          isRejected: false,
        },
        {
          documentId: 'doc-exp-05',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'EXPENSE_13_C_RENT',
          amountCents: 500000,
          issueDateIso: '2026-06-10',
          isLegallyCompliant: true,
          isRejected: false,
        }
      ],
      quarterlyDeclarations: [
        { grossServicesGeneralCents: 750000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 750000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 750000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 750000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
      ],
      clientWithholdingDeclarations: {
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
      contractingEntitiesAudit: {
        totalAnnualServicesBilledCents: 3000000,
        clientsWithOver50PctDependency: [
          {
            clientNif: '500999888',
            annualBilledCents: 2550000, // 25.500 € (85% de dependência > 80%)
            dependencyPctBps: 8500,
          }
        ]
      }
    };

    const res = runMiraComprehensiveAnnualAssessment(profile);

    // 1. SS TI Pessoal
    assert.equal(res.socialSecurity.totalAnnualPersonalSSPaidCents, 449400, 'SS TI = 4.494,00 €');

    // 2. Encargos Patronais da Entidade Contratante
    assert.equal(res.socialSecurity.contractingEntitiesTotalPatronalDueCents, 255000, 'Encargo patronal 10% = 2.550,00 €');

    // 3. Matéria Coletável Cat. B (alínea c: coeficiente 0,35)
    assert.equal(res.irsLiquidation.finalTaxableIncomeColetavelCents, 1050000, '30.000€ x 0,35 = 10.500,00 €');
    assert.equal(res.irsLiquidation.coletaBaseGeralArt68Cents, 138156, 'Coleta = 1.381,56 €');
    assert.equal(res.irsLiquidation.totalWithholdingTaxPaidCents, 345000, 'Retenção a 11,5% = 3.450,00 €');
    assert.equal(res.irsLiquidation.finalTaxBalanceCents, -206844, 'Saldo: -2.068,44 € (Reembolso)');
  });

  test('E2E-06: Grande Volume de Prestação de Serviços — €200.000', () => {
    const profile: MiraTaxpayerAnnualComprehensiveProfile = {
      taxpayerNif: '200666777',
      taxYear: 2026,
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartDateIso: '2023-01-01',
      isFirstRegistrationEver: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      isRegisteredENIEIRL: false,
      qualifiesForArt70SubjectiveScope: true,
      documentaryRecords: [
        {
          documentId: 'doc-06',
          source: 'AT_E_FATURA',
          domain: 'EXPENSE_INVOICE',
          subCategoryCode: 'ART31_1_B_TABLE151',
          amountCents: 20000000, // 200.000,00 €
          issueDateIso: '2026-06-30',
          isLegallyCompliant: true,
          isRejected: false,
        }
      ],
      quarterlyDeclarations: [
        { grossServicesGeneralCents: 5000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 5000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 5000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
        { grossServicesGeneralCents: 5000000, grossSalesAndProductionCents: 0, grossHospitalityCents: 0, grossOperatingSubsidiesCents: 0 },
      ],
      clientWithholdingDeclarations: {
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = runMiraComprehensiveAnnualAssessment(profile);

    // 1. Teto de 12 IAS na Segurança Social
    assert.equal(res.socialSecurity.totalAnnualPersonalSSPaidCents, 1655220, 'SS Total no Teto = 16.552,20 €');

    // 2. Acréscimo de Despesas (Artigo 31.º, n.º 13)
    assert.equal(res.expenses.servicesSubjectTo15PctBaseCents, 20000000);
    assert.equal(res.expenses.requiredExpenseThreshold15PctCents, 3000000, 'Exigência 15% = 30.000,00 €');
    assert.equal(res.expenses.actualDeductionAppliedCents, 1655220, 'Dedução base max(4.104, 16.552,20) = 16.552,20 €');
    assert.equal(res.expenses.expenseShortfallAcrescimentoCents, 1344780, 'Acréscimo: 30.000€ - 16.552,20€ = 13.447,80 €');

    // 3. Matéria Coletável
    assert.equal(res.irsLiquidation.finalTaxableIncomeColetavelCents, 16344780, '150.000€ + 13.447,80€ = 163.447,80 €');

    // 4. Coletas do IRS (Artigo 68.º, n.º 2 e Artigo 68.º-A)
    assert.equal(res.irsLiquidation.coletaBaseGeralArt68Cents, 6706934, 'Coleta Art. 68.º n.º 2 = 67.069,34 €');
    assert.equal(res.irsLiquidation.solidarityTaxArt68ACents, 208620, 'Taxa Solidariedade 2,5% sobre excedente a 80k = 2.086,20 €');
    assert.equal(res.irsLiquidation.coletaTotalCents, 6915554, 'Coleta Total = 69.155,54 €');

    // 5. Retenção e Saldo
    assert.equal(res.irsLiquidation.totalWithholdingTaxPaidCents, 4600000, 'Retenção a 23% = 46.000,00 €');
    assert.equal(res.irsLiquidation.finalTaxBalanceCents, 2315554, 'Saldo final de IRS = 23.155,54 € a pagar');

    // 6. Carga Tributária Global
    assert.equal(res.netFinancialPosition.totalEffectiveTaxBurdenCents, 8570774, 'Encargo total = 85.707,74 €');
    assert.equal(res.netFinancialPosition.effectiveBurdenBps, 4285, 'Carga fiscal efetiva = 42,85%');
  });
});
