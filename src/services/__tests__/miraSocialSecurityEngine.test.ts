// ============================================================================
// BATERIA FORENSE UNITÁRIA — BASE CONTRIBUTIVA E SEGURANÇA SOCIAL (PORTÃO 3: U03)
// Testes Canónicos Homologados da Fase 5
// ============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  SS_CONTRACTING_ENTITY_MIN_ANNUAL_SERVICES_6_IAS_CENTS,
  RATE_SS_CONTRACTING_ENTITY_50_80_BPS,
  RATE_SS_CONTRACTING_ENTITY_OVER_80_BPS,
  calculateMonthlySSContributionAssessment,
  calculateMonthlySocialSecurityAssessment,
  calculateMiraSocialSecurity,
} from '../miraSocialSecurityEngine';

import type {
  QuarterlyDeclaredIncomesInput,
  AnnualClientBillingRecord,
  QuarterlySocialSecurityDeclarationInput,
} from '../miraSocialSecurityEngine';

describe('P03-U03: Motor de Base Contributiva e Segurança Social (Fase 5)', () => {
  test('T-SS-01: TI Geral 21,4% sobre prestação de serviços', () => {
    const incomes: QuarterlyDeclaredIncomesInput = {
      servicesGeneralAmountCents: 300000, // 3.000,00 € no trimestre
      goodsSalesAmountCents: 0,
      hospitalityAndCateringServicesAmountCents: 0,
      operatingSubsidiesAmountCents: 0,
    };

    const res = calculateMonthlySSContributionAssessment(incomes, 0, 'TI_GENERAL');
    assert.equal(res.quarterlyRelevantIncomeCents, 210000, '70% de 3.000€ = 2.100,00 € (210.000 c.)');
    assert.equal(res.statutoryMonthlyAverageIncomeCents, 70000, 'Média mensal = 700,00 € (70.000 c.)');
    assert.equal(res.monthlyContributionDueCents, 14980, '21,4% sobre 700€ = 149,80 € (14.980 c.)');
    assert.equal(res.isFlooredBy20EurMinimum, false);
    assert.equal(res.isCappedBy12IASCeiling, false);
  });

  test('T-SS-02: Direito de Opção Trimestral do Artigo 164.º (+-25%)', () => {
    const incomes: QuarterlyDeclaredIncomesInput = {
      servicesGeneralAmountCents: 300000, // 700,00 € de base padrão
      goodsSalesAmountCents: 0,
      hospitalityAndCateringServicesAmountCents: 0,
      operatingSubsidiesAmountCents: 0,
    };

    // Opção de redução -25% (-2.500 bps): 700€ - 175€ = 525,00 €
    const resMinus25 = calculateMonthlySSContributionAssessment(incomes, -2500, 'TI_GENERAL');
    assert.equal(resMinus25.monthlyBaseSubjectToContributionCents, 52500, 'Base reduzida a 525,00 €');
    assert.equal(resMinus25.monthlyContributionDueCents, 11235, '21,4% de 525€ = 112,35 € (11.235 c.)');

    // Opção de acréscimo +25% (+2.500 bps): 700€ + 175€ = 875,00 €
    const resPlus25 = calculateMonthlySSContributionAssessment(incomes, 2500, 'TI_GENERAL');
    assert.equal(resPlus25.monthlyBaseSubjectToContributionCents, 87500, 'Base aumentada para 875,00 €');
    assert.equal(resPlus25.monthlyContributionDueCents, 18725, '21,4% de 875€ = 187,25 € (18.725 c.)');
  });

  test('T-SS-03: Taxa de 25,2% para ENI/EIRL (Artigo 168.º, 1, b)', () => {
    const incomes: QuarterlyDeclaredIncomesInput = {
      servicesGeneralAmountCents: 0,
      goodsSalesAmountCents: 1500000, // 15.000,00 € vendas (20% relevância)
      hospitalityAndCateringServicesAmountCents: 0,
      operatingSubsidiesAmountCents: 0,
    };

    const res = calculateMonthlySSContributionAssessment(incomes, 0, 'TI_ENI_EIRL');
    assert.equal(res.quarterlyRelevantIncomeCents, 300000, '20% de 15.000€ = 3.000,00 €');
    assert.equal(res.statutoryMonthlyAverageIncomeCents, 100000, 'Média mensal = 1.000,00 €');
    assert.equal(res.contributionRateBps, 2520, 'Taxa ENI = 25,2% (2.520 bps)');
    assert.equal(res.monthlyContributionDueCents, 25200, '25,2% de 1.000€ = 252,00 € (25.200 c.)');
  });

  test('T-SS-04 e 05: Piso Mínimo Imperativo de 20,00 € (Artigo 163.º, n.º 2)', () => {
    // Rendimento muito baixo: 100,00 € no trimestre -> RR = 70,00 € -> Média = 23,33 €
    const lowIncomes: QuarterlyDeclaredIncomesInput = {
      servicesGeneralAmountCents: 10000,
      goodsSalesAmountCents: 0,
      hospitalityAndCateringServicesAmountCents: 0,
      operatingSubsidiesAmountCents: 0,
    };

    const res = calculateMonthlySSContributionAssessment(lowIncomes, 0, 'TI_GENERAL');
    assert.equal(res.isFlooredBy20EurMinimum, true, 'Deve acionar o piso de 20€');
    assert.equal(res.monthlyContributionDueCents, 2000, 'Contribuição devida fixa-se imperativamente em 20,00 € (2.000 c.)');
  });

  test('T-SS-06: Teto de 12 IAS (Artigo 163.º, n.º 5 — 6.445,56 €)', () => {
    // Elevado rendimento trimestral: 50.000,00 € em serviços -> RR = 35.000,00 € -> Média = 11.666,66 €
    const highIncomes: QuarterlyDeclaredIncomesInput = {
      servicesGeneralAmountCents: 5000000,
      goodsSalesAmountCents: 0,
      hospitalityAndCateringServicesAmountCents: 0,
      operatingSubsidiesAmountCents: 0,
    };

    const res = calculateMonthlySSContributionAssessment(highIncomes, 0, 'TI_GENERAL');
    assert.equal(res.isCappedBy12IASCeiling, true, 'Deve acionar o teto de 12 IAS');
    assert.equal(res.monthlyCappedContributionBaseCents, 644556, 'Base fixada em 6.445,56 € (644.556 c.)');
    assert.equal(res.monthlyContributionDueCents, 137935, '21,4% de 6.445,56€ = 1.379,35 € (137.935 c.)');
  });

  test('T-SS-CONTRACTING: Entidades Contratantes com segregação formal (E2E-05)', () => {
    const clients: AnnualClientBillingRecord[] = [
      { clientNIF: '500111222', annualServicesBilledAmountCents: 2550000 }, // 25.500 € (85% de dependência)
      { clientNIF: '500333444', annualServicesBilledAmountCents: 450000 },  // 4.500 € (15% de dependência)
    ];

    const incomes: QuarterlyDeclaredIncomesInput = {
      servicesGeneralAmountCents: 750000, // 30.000€ anuais / 4 trimestres
      goodsSalesAmountCents: 0,
      hospitalityAndCateringServicesAmountCents: 0,
      operatingSubsidiesAmountCents: 0,
    };

    const res = calculateMonthlySSContributionAssessment(incomes, 0, 'TI_GENERAL', null, clients);
    assert.equal(res.contractingEntities.length, 2);
    
    // Cliente 1 tem 85% de dependência (> 80%) -> Taxa patronal de 10%
    const client1 = res.contractingEntities.find(c => c.clientNIF === '500111222')!;
    assert.equal(client1.isContractingEntity, true);
    assert.equal(client1.applicableRateBps, 1000, 'Taxa patronal deve ser 10%');
    assert.equal(client1.annualEstimatedContributionChargeCents, 255000, '10% de 25.500€ = 2.550,00 €');

    // Cliente 2 tem 15% de dependência (<= 50%) -> Não é entidade contratante
    const client2 = res.contractingEntities.find(c => c.clientNIF === '500333444')!;
    assert.equal(client2.isContractingEntity, false);
    assert.equal(client2.annualEstimatedContributionChargeCents, 0);

    // Total anual de encargos patronais suportados pelos clientes
    assert.equal(res.totalAnnualContractingEntitiesChargeCents, 255000, 'Encargo patronal total = 2.550,00 €');
  });

  test('T-SS-INTERFACE-GLOBAL: Compatibilidade com a interface do orquestrador global', () => {
    const input: QuarterlySocialSecurityDeclarationInput = {
      grossServicesGeneralCents: 1000000, // 10.000,00 € no trimestre (E2E-01)
      grossSalesAndProductionCents: 0,
      grossHospitalityCents: 0,
      grossOperatingSubsidiesCents: 0,
      taxpayerRateBps: 2140,
      baseVariationBps: 0,
    };

    const res = calculateMonthlySocialSecurityAssessment(input);
    assert.equal(res.quarterlyRelevantIncomeCents, 700000, '70% de 10.000€ = 7.000,00 €');
    assert.equal(res.monthlyAverageRelevantIncomeCents, 233333, 'Média mensal: floor(7.000 / 3) = 2.333,33 €');
    assert.equal(res.monthlyContributionDueCents, 49933, '21,4% de 2.333,33€ = 499,33 €');
  });
});
describe('🏛️ MIRA SOCIAL SECURITY ENGINE (DL 110/2009 & CRC Canónico 2026)', () => {
  test('T-SS-CANON-01: Caso Padrão (Prestação de Serviços a 70%)', () => {
    const res = calculateMiraSocialSecurity({
      quarterlyRevenue: 3000,
      activityType: 'services',
      variationPct: 0,
      taxRate: 0.214,
    });

    assert.equal(res.quarterlyRelevantIncome, 2100.00, 'RR Trimestral = 2.100,00 €');
    assert.equal(res.monthlyAverageRelevantIncome, 700.00, 'RR Mensal = 700,00 €');
    assert.equal(res.finalContributoryBase, 700.00, 'Base = 700,00 €');
    assert.equal(res.monthlyContribution, 149.80, 'Mensal = 149,80 €');
    assert.equal(res.quarterlyTotalContribution, 449.40, 'Total Trimestre = 449,40 €');
    assert.equal(res.isExempt, false);
    assert.equal(res.isMinimumPayment, false);
    assert.equal(res.isCappedAt12IAS, false);
  });

  test('T-SS-CANON-02: Caso Vendas / Restauração (20%)', () => {
    const res = calculateMiraSocialSecurity({
      quarterlyRevenue: 15000,
      activityType: 'sales_hospitality',
      variationPct: 0,
      taxRate: 0.214,
    });

    assert.equal(res.quarterlyRelevantIncome, 3000.00, '20% de 15.000€ = 3.000,00 €');
    assert.equal(res.monthlyAverageRelevantIncome, 1000.00, 'RR Mensal = 1.000,00 €');
    assert.equal(res.monthlyContribution, 214.00, '21,4% de 1.000€ = 214,00 €');
    assert.equal(res.quarterlyTotalContribution, 642.00, 'Total Trimestre = 642,00 €');
  });

  test('T-SS-CANON-03: Piso Mínimo Obrigatório (€ 0 de faturação)', () => {
    const res = calculateMiraSocialSecurity({
      quarterlyRevenue: 0,
      activityType: 'services',
      variationPct: 0,
      taxRate: 0.214,
    });

    assert.equal(res.quarterlyRelevantIncome, 0.00);
    assert.equal(res.monthlyAverageRelevantIncome, 0.00);
    assert.equal(res.isMinimumPayment, true, 'isMinimumPayment deve ser true');
    assert.equal(res.monthlyContribution, 20.00, 'Mensal = 20,00 €');
    assert.equal(res.quarterlyTotalContribution, 60.00, 'Total Trimestre = 60,00 €');
  });

  test('T-SS-CANON-04: Teto Máximo Legal (12 × IAS = 6.445,56 €)', () => {
    const res = calculateMiraSocialSecurity({
      quarterlyRevenue: 50000,
      activityType: 'services',
      variationPct: 0,
      taxRate: 0.214,
    });

    assert.equal(res.quarterlyRelevantIncome, 35000.00);
    assert.equal(res.monthlyAverageRelevantIncome, 11666.67);
    assert.equal(res.isCappedAt12IAS, true, 'isCappedAt12IAS deve ser true');
    assert.equal(res.finalContributoryBase, 6445.56, 'Base limitada a 6.445,56 €');
    assert.equal(res.monthlyContribution, 1379.35, '21,4% de 6.445,56€ = 1.379,35 €');
    assert.equal(res.quarterlyTotalContribution, 4138.05, 'Total Trimestre = 4.138,05 €');
  });

  test('T-SS-CANON-05: Isenção TCO (Salário >= 1 IAS e RR < 4 IAS)', () => {
    const res = calculateMiraSocialSecurity({
      quarterlyRevenue: 6000,
      activityType: 'services',
      variationPct: 0,
      taxRate: 0.214,
      isTCO: true,
      tcoMonthlySalary: 1200.00,
    });

    assert.equal(res.monthlyAverageRelevantIncome, 1400.00, 'RR Mensal = 1.400,00 € (< 2.148,52 €)');
    assert.equal(res.isExempt, true, 'isExempt deve ser true');
    assert.equal(res.monthlyContribution, 0.00);
    assert.equal(res.quarterlyTotalContribution, 0.00);
    assert.ok(res.exemptionReason?.includes('trabalho por conta de outrem'));
  });

  test('T-SS-CANON-06: Variações de Escala (+15% e -20%)', () => {
    // Variação +15%
    const resPlus15 = calculateMiraSocialSecurity({
      quarterlyRevenue: 3000,
      activityType: 'services',
      variationPct: 0.15,
      taxRate: 0.214,
    });
    assert.equal(resPlus15.adjustedMonthlyBase, 805.00, 'Base +15% = 805,00 €');
    assert.equal(resPlus15.monthlyContribution, 172.27, '21,4% de 805€ = 172,27 €');

    // Variação -20%
    const resMinus20 = calculateMiraSocialSecurity({
      quarterlyRevenue: 3000,
      activityType: 'services',
      variationPct: -0.20,
      taxRate: 0.214,
    });
    assert.equal(resMinus20.adjustedMonthlyBase, 560.00, 'Base -20% = 560,00 €');
    assert.equal(resMinus20.monthlyContribution, 119.84, '21,4% de 560€ = 119,84 €');
  });

  test('T-SS-CANON-07: Isenção de Início de Atividade (Primeiros 12 Meses)', () => {
    const res = calculateMiraSocialSecurity({
      quarterlyRevenue: 10000,
      activityType: 'services',
      isFirstYear: true,
    });

    assert.equal(res.isExempt, true);
    assert.equal(res.monthlyContribution, 0.00);
    assert.ok(res.exemptionReason?.includes('primeiros 12 meses'));
  });
});
