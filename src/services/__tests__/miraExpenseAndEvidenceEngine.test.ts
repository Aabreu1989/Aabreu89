// ============================================================================
// BATERIA FORENSE UNITÁRIA — PROVA DOCUMENTAL E DESPESAS (PORTÃO 3: UNIDADE 2)
// Testes Canónicos Homologados das Fases 3 e 4
// ============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  EXPENSE_JUSTIFICATION_RATE_BPS,
  PARTIAL_HABITATION_EXPENSE_RATE_BPS,
  SUBSIDY_AMORTIZATION_YEARS_STANDARD,
  isEvidenceSourceCompatible,
  evaluateTCOExemptionArt157,
  evaluatePublicSubsidyRegime,
  calculateSimplifiedRegimeExpenseRequirementAssessment,
} from '../miraExpenseAndEvidenceEngine';

import type {
  TCOSubstantiveRequirements,
  CategoryBGrossIncomesBreakdown,
  CategoryBEligibleExpensesBreakdown,
} from '../miraExpenseAndEvidenceEngine';

describe('P03-U02: Prova Jurídica e Documental (Fase 3)', () => {
  test('T-PROV-SOURCES: Compatibilidade de fontes institucionais', () => {
    assert.equal(isEvidenceSourceCompatible('EXPENSE_INVOICE', 'AT_E_FATURA'), true);
    assert.equal(isEvidenceSourceCompatible('TCO_REMUNERATION', 'DMR_SEGURANCA_SOCIAL_AT'), true);
    assert.equal(isEvidenceSourceCompatible('PROPERTY_RENT', 'AT_E_ARRENDAMENTO'), true);
    assert.equal(isEvidenceSourceCompatible('IMPORT_DECLARATION', 'AT_SISTEMA_ADUANEIRO_IMPORTACOES'), true);
    assert.equal(isEvidenceSourceCompatible('PUBLIC_SUBSIDY', 'TERMO_CONCESSAO_SUBSIDIO_OFICIAL'), true);

    // Teste negativo: fonte incompatível
    assert.equal(isEvidenceSourceCompatible('EXPENSE_INVOICE', 'MINISTERIO_SAUDE_JUNTA_MEDICA'), false);
  });

  test('T-PROV-TCO: 4 Requisitos cumulativos de TCO (Artigo 157.º do CRCSPSS)', () => {
    const validTCO: TCOSubstantiveRequirements = {
      hasDMRProvingSalaryAtLeast1IAS: true,
      hasFullCoverageSocialProtection: true,
      isSeparateLegalEntity: true,
      hasNoCorporateOwnershipOver50Pct: true,
    };

    // Cenário 1: Todos os 4 requisitos cumpridos e rendimento TI < 4 IAS (2.148,52 €)
    const resultExempt = evaluateTCOExemptionArt157(validTCO, 150000); // 1.500,00 €
    assert.equal(resultExempt.qualifiesForExemption, true);
    assert.equal(resultExempt.isExemptByThreshold, true);
    assert.equal(resultExempt.legalGround, 'ISENCAO_PLENA_ART157_1_A_TCO_E_LIMIAR_4_IAS');

    // Cenário 2: Todos cumpridos mas TI >= 4 IAS (2.500,00 €)
    const resultOver4IAS = evaluateTCOExemptionArt157(validTCO, 250000);
    assert.equal(resultOver4IAS.qualifiesForExemption, false);
    assert.equal(resultOver4IAS.legalGround, 'SUJEITO_CONTRIBUICAO_EXCEDENTE_4_IAS_ART157_2');

    // Cenário 3: Falha no Requisito 4 (participação societária > 50%)
    const invalidTCO: TCOSubstantiveRequirements = {
      ...validTCO,
      hasNoCorporateOwnershipOver50Pct: false,
    };
    const resultFailed = evaluateTCOExemptionArt157(invalidTCO, 150000);
    assert.equal(resultFailed.qualifiesForExemption, false);
    assert.ok(resultFailed.failedRequirements.includes('PARTICIPACAO_SOCIETARIA_SUPERIOR_A_50_POR_CENTO'));
  });

  test('T-PROV-SUBSIDY: Fracionamento de subsídios a 5 anos (Artigo 31.º, n.º 5 CIRS)', () => {
    const totalSubsidyCents = 1000000; // 10.000,00 €

    // Cenário A: Sem opção expressa para SS (excluído por defeito sob Art. 62.º/3(c) DR 1-A/2011)
    const resNoOption = evaluatePublicSubsidyRegime(totalSubsidyCents, 'NON_OPERATING_INVESTMENT', 'SERVICES', false);
    assert.equal(resNoOption.annualImputedFractionCents, 200000, 'Fração anual deve ser 2.000,00 € (1/5)');
    assert.equal(resNoOption.irsTaxableIncomeAnnualCents, 60000, 'IRS: 30% de 2.000€ = 600,00 € (60.000 c.)');
    assert.equal(resNoOption.ssRelevantIncomeAnnualCents, 0, 'SS sem opção deve ser 0 cêntimos');

    // Cenário B: Com opção expressa para SS em atividade de serviços (70%)
    const resWithOption = evaluatePublicSubsidyRegime(totalSubsidyCents, 'NON_OPERATING_INVESTMENT', 'SERVICES', true);
    assert.equal(resWithOption.annualImputedFractionCents, 200000);
    assert.equal(resWithOption.irsTaxableIncomeAnnualCents, 60000);
    assert.equal(resWithOption.ssRelevantIncomeAnnualCents, 140000, 'SS com opção: 70% de 2.000€ = 1.400,00 €');
  });
});

describe('P03-U02: Motor de Despesas do Regime Simplificado (Fase 4)', () => {
  test('T-EXP-01: Base dos 15% estrita a Prestações de Serviços (b + c)', () => {
    const incomes: CategoryBGrossIncomesBreakdown = {
      incomeArt31_1_a_SalesCents: 5000000,           // 50.000 € (Vendas - fora)
      incomeArt31_1_b_Table151ServicesCents: 2000000,// 20.000 € (Tab. 151 - DENTRO)
      incomeArt31_1_c_OtherServicesCents: 1000000,   // 10.000 € (Outros Serv. - DENTRO)
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 500000, // 5.000 € (PI - fora)
      incomeArt31_1_e_NonOperatingSubsidiesCents: 200000,       // 2.000 € (Subsídio - fora)
      incomeArt31_1_f_OperatingSubsidiesCents: 100000,          // 1.000 € (Subsídio - fora)
    };

    const emptyExpenses: CategoryBEligibleExpensesBreakdown = {
      mandatorySocialSecurityContributionsCents: 0,
      staffSalariesAndWagesCents: 0,
      operatingPropertyRentsCents: 0,
      partiallyAllocatedAssetsAllocatedShareCents: 0,
      specificallyAllocatedAssetDepreciationCents: 0,
      otherGoodsAndServicesPurchasesCents: 0,
      importsAndIntraCommunityAcquisitionsCents: 0,
      otherActivityExpensesCents: 0,
    };

    const res = calculateSimplifiedRegimeExpenseRequirementAssessment(incomes, emptyExpenses);
    assert.equal(res.servicesSubjectTo15PctBaseCents, 3000000, 'Base de 15% deve ser exatamente 30.000,00 € (b + c)');
    assert.equal(res.requiredExpenseThreshold15PctCents, 450000, 'Exigência de 15% sobre 30.000€ = 4.500,00 €');
    assert.equal(res.statutoryBaseDeductionCents, 410400, 'Dedução base padrão = 4.104,00 €');
    assert.equal(res.expenseShortfallAcrescimentoCents, 39600, 'Acréscimo = 4.500€ - 4.104€ = 396,00 €');
  });

  test('T-EXP-DISJUNCTIVE: Regra disjuntiva da alínea a) do Art. 31.º, n.º 13', () => {
    const incomes: CategoryBGrossIncomesBreakdown = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 20000000, // 200.000,00 € (Cenário E2E-06)
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    // SS Conexa de 12 IAS = 16.552,20 € (1.655.220 c.)
    const expensesWithSS: CategoryBEligibleExpensesBreakdown = {
      mandatorySocialSecurityContributionsCents: 1655220,
      staffSalariesAndWagesCents: 0,
      operatingPropertyRentsCents: 0,
      partiallyAllocatedAssetsAllocatedShareCents: 0,
      specificallyAllocatedAssetDepreciationCents: 0,
      otherGoodsAndServicesPurchasesCents: 0,
      importsAndIntraCommunityAcquisitionsCents: 0,
      otherActivityExpensesCents: 0,
    };

    const res = calculateSimplifiedRegimeExpenseRequirementAssessment(incomes, expensesWithSS);
    assert.equal(res.requiredExpenseThreshold15PctCents, 3000000, '15% de 200.000€ = 30.000,00 €');
    assert.equal(
      res.statutoryBaseDeductionCents,
      1655220,
      'A dedução da alínea a) deve ser max(4.104€, 16.552,20€) = 16.552,20 € (sem cumulação com 4.104€)'
    );
    assert.equal(res.baseDeductionSource, 'QUALIFIED_MANDATORY_CONNECTED_SS_CONTRIBUTIONS');
    assert.equal(
      res.expenseShortfallAcrescimentoCents,
      1344780,
      'Acréscimo em E2E-06 deve ser rigorosamente 13.447,80 € (30.000€ - 16.552,20€)'
    );
  });

  test('T-EXP-PARTIAL-14: Redutor do n.º 14 (25%) aplicado estritamente a afetação mista', () => {
    const incomes: CategoryBGrossIncomesBreakdown = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 5000000, // 50.000 € -> 15% = 7.500 €
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const mixedExpenses: CategoryBEligibleExpensesBreakdown = {
      mandatorySocialSecurityContributionsCents: 0, // Assume padrão 4.104€
      staffSalariesAndWagesCents: 200000,            // 2.000 € pessoal (100% elegível sob al. b)
      operatingPropertyRentsCents: 0,
      partiallyAllocatedAssetsAllocatedShareCents: 400000, // 4.000 € habitação mista (25% = 1.000 €)
      specificallyAllocatedAssetDepreciationCents: 0,
      otherGoodsAndServicesPurchasesCents: 0,
      importsAndIntraCommunityAcquisitionsCents: 100000,   // 1.000 € importações (100% elegível sob al. f)
      otherActivityExpensesCents: 0,
    };

    const res = calculateSimplifiedRegimeExpenseRequirementAssessment(incomes, mixedExpenses);
    assert.equal(res.statutoryBaseDeductionCents, 410400, 'Base: 4.104,00 €');
    // Outras despesas: 2.000€ (pessoal) + 1.000€ (25% de 4.000€) + 1.000€ (importações) = 4.000,00 €
    assert.equal(res.otherExpensesJustifiedCents, 400000, 'Outras despesas = 4.000,00 €');
    assert.equal(res.totalJustifiedExpensesCents, 810400, 'Total justificado: 4.104€ + 4.000€ = 8.104,00 €');
    assert.equal(res.expenseShortfallAcrescimentoCents, 0, 'Exigência de 7.500€ coberta por 8.104€ -> Acréscimo = 0');
    assert.equal(res.isFullyJustified, true);
  });
});
