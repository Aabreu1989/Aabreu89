// ============================================================================
// BATERIA FORENSE UNITÁRIA — MOTOR DE IRS E SOLIDARIEDADE (PORTÃO 3: UNIDADE 4)
// Testes Canónicos Homologados da Fase 6
// ============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  CIRS_MINIMUM_EXISTENCE_REF_CONTINENTE_2026_CENTS,
  WITHHOLDING_TAX_RATE_TABLE_151_BPS,
  calculateArt68ColetaStatutory,
  calculateAnnualIRSLiquidationAssessment,
} from '../miraTaxEngine';

import type {
  ComprehensiveCategoryBGrossIncomes,
  TaxpayerPersonalTaxContext,
} from '../miraTaxEngine';

describe('P03-U04: Motor de IRS, Mínimo de Existência e Solidariedade (Fase 6)', () => {
  test('T-IRS-01: Faturação de €10.000 com dispensa Art. 101.º-B válida', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 1000000, // 10.000,00 €
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true,
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 1000000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: true,
        priorYearTurnoverUnder15k: true,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 0, ctx);
    assert.equal(res.finalTaxableIncomeColetavelCents, 750000, 'Matéria coletável: 75% de 10.000€ = 7.500,00 €');
    assert.equal(res.applicableBracketNumber, 1, '1.º Escalão (até 8.342€)');
    assert.equal(res.coletaBaseGeralArt68Cents, 93750, '12,50% de 7.500€ = 937,50 € (93.750 c.)');
    assert.equal(res.withholdingExemptionApplied, true, 'Dispensa do Art. 101-B aplicada');
    assert.equal(res.totalWithholdingTaxPaidCents, 0);
    assert.equal(res.finalTaxBalanceCents, 93750, 'Saldo: 937,50 € a pagar');
  });

  test('T-IRS-02: Faturação de €20.000 com retenção a 23%', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 2000000, // 20.000,00 €
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true,
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 2000000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 0, ctx);
    assert.equal(res.finalTaxableIncomeColetavelCents, 1500000, 'Matéria coletável = 15.000,00 €');
    assert.equal(res.applicableBracketNumber, 3, '3.º Escalão (21,20%)');
    assert.equal(res.coletaBaseGeralArt68Cents, 222077, 'Coleta = 2.220,77 €');
    assert.equal(res.totalWithholdingTaxPaidCents, 460000, '23% de 20.000€ = 4.600,00 €');
    assert.equal(res.finalTaxBalanceCents, -237923, 'Saldo: -2.379,23 € (Reembolso)');
  });

  test('T-IRS-03: Benefício fiscal de início 1.º Ano (Artigo 31.º, n.º 10 - 50% de redução)', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 2000000,
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'FIRST_YEAR_START', // Benefício ativo (coeficiente 0,375)
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true,
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 2000000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 0, ctx);
    assert.equal(res.activityStartBenefitApplied, true);
    assert.equal(res.coefficientEffectiveB_bps, 3750, 'Coeficiente reduzido em 50% para 0,375');
    assert.equal(res.finalTaxableIncomeColetavelCents, 750000, 'Matéria coletável: 20.000€ x 0,375 = 7.500,00 €');
    assert.equal(res.coletaBaseGeralArt68Cents, 93750, '12,5% de 7.500€ = 937,50 €');
    assert.equal(res.totalWithholdingTaxPaidCents, 460000, 'Retenção a 23% mantém-se inalterada em 4.600,00 €');
    assert.equal(res.finalTaxBalanceCents, -366250, 'Saldo: -3.662,50 € (Reembolso)');
  });

  test('T-IRS-05: Afastamento do benefício de início por auferição de Categoria A', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 2000000,
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'FIRST_YEAR_START',
      hasCategoryAOrHIncomesInPeriod: true, // Afasta Art. 31.º/10!
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true,
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 2000000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 0, ctx);
    assert.equal(res.activityStartBenefitApplied, false, 'Benefício deve ser rejeitado');
    assert.equal(res.coefficientEffectiveB_bps, 7500, 'Aplica coeficiente normal 0,75');
    assert.equal(res.finalTaxableIncomeColetavelCents, 1500000, 'Matéria coletável = 15.000,00 €');
  });

  test('T-IRS-10: 8.º Escalão (44,60%) sobre €75.000 de matéria coletável', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 10000000, // 100.000,00 € -> 75.000,00 €
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true,
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 10000000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 0, ctx);
    assert.equal(res.finalTaxableIncomeColetavelCents, 7500000);
    assert.equal(res.applicableBracketNumber, 8, '8.º Escalão');
    assert.equal(res.coletaBaseGeralArt68Cents, 2500828, '75.000€ x 44,6% - 8.441,72€ = 25.008,28 €');
    assert.equal(res.solidarityTaxArt68ACents, 0, 'Abaixo de 80.000€ não há solidariedade');
    assert.equal(res.totalWithholdingTaxPaidCents, 2300000);
    assert.equal(res.finalTaxBalanceCents, 200828, 'Saldo: 2.008,28 € a pagar');
  });

  test('T-IRS-11: Taxa Adicional de Solidariedade do Artigo 68.º-A (limiar €80.000)', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 15000000, // 150.000,00 € -> 112.500,00 €
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true,
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 15000000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: false,
        priorYearTurnoverUnder15k: false,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 0, ctx);
    assert.equal(res.finalTaxableIncomeColetavelCents, 11250000, 'Matéria coletável: 112.500,00 €');
    // Solidariedade: (112.500€ - 80.000€) x 2,5% = 32.500€ x 2,5% = 812,50 € (81.250 c.)
    assert.equal(res.solidarityTaxArt68ACents, 81250, 'Taxa de solidariedade deve ser exatamente 812,50 €');
    assert.equal(res.totalWithholdingTaxPaidCents, 3450000, '23% de 150.000€ = 34.500,00 €');
  });

  test('T-IRS-12: Mínimo de Existência do Artigo 70.º (RB > L -> Abatimento = 0)', () => {
    const incomes: ComprehensiveCategoryBGrossIncomes = {
      incomeArt31_1_a_SalesCents: 0,
      incomeArt31_1_b_Table151ServicesCents: 1200000, // 12.000,00 €
      incomeArt31_1_c_OtherServicesCents: 0,
      incomeArt31_1_d_IntellectualPropertyCapitalCents: 0,
      incomeArt31_1_e_NonOperatingSubsidiesCents: 0,
      incomeArt31_1_f_OperatingSubsidiesCents: 0,
    };

    const ctx: TaxpayerPersonalTaxContext = {
      taxTerritory: 'CONTINENTE',
      isJointFilingMarried: false,
      activityStartStatus: 'NONE',
      hasCategoryAOrHIncomesInPeriod: false,
      hasCeasedActivityInPrior5Years: false,
      appliesArticle31ParagraphG: false,
      qualifiesForArt70SubjectiveScope: true, // Atividade Tab. 151
      clientWithholdingDeclarations: {
        billedWithTable151Cents: 1200000,
        billedWithOtherServicesCents: 0,
        billedWithIntellectualPropCents: 0,
        hasExercisedArticle101BOption: true, // Isento até 15k
        priorYearTurnoverUnder15k: true,
        isContractIntermediationCommission: false,
      },
    };

    const res = calculateAnnualIRSLiquidationAssessment(incomes, 0, 120000, ctx); // 1.200€ SS paga
    assert.equal(res.art70GrossIncomeCents, 1200000);
    assert.equal(res.art70SpecificDeductionCents, 0, 'Dedução específica SS é 0 pois não excede 10% de 12.000€');
    assert.equal(res.art70AbatementAmountCents, 0, 'RB > L -> Abatimento Artigo 70.º é 0,00 €');
    assert.equal(res.finalTaxableIncomeColetavelCents, 900000, 'Matéria coletável = 9.000,00 €');
    assert.equal(res.coletaBaseGeralArt68Cents, 114606, 'Coleta 2.º escalão = 1.146,06 €');
    assert.equal(res.totalWithholdingTaxPaidCents, 0);
    assert.equal(res.finalTaxBalanceCents, 114606, 'Saldo: 1.146,06 € a pagar');
  });
});
