// ============================================================================
// 🏛️ BATERIA CANÓNICA UNITÁRIA: MIRA BUSINESS ENGINE (U-BIZ-01)
// Homologação de Regras Fiscais, Societárias e Contributivas (2026)
// ============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { createHash, createHmac } from 'crypto';

import {
  CorporateIrcSubEngine,
  DividendDistributionSubEngine,
  IngestionProvenanceSubEngine,
  calculateRfaiDeduction,
  evaluateSocialSecurityMonthlyProductionOfEffects,
  evaluateEniSimplifiedExpensesRequirement,
  evaluateIvaArticle53Regime,
  evaluateCategoryBCoefficient,
  TSU_EMPLOYER_CONTRIBUTION_RATE_PCT,
  TSU_MANAGER_MOE_CONTRIBUTION_RATE_PCT,
  TSU_TOTAL_MOE_RATE_PCT,
} from '../miraBusinessEngine';

import type {
  CorporateLiquidationInput,
  DividendDistributionInput,
  RfaiInvestmentTranche,
  NormativeRuleProvenance
} from '../miraBusinessEngine';

describe('U-BIZ-01: MIRA Business & Entrepreneurship Intelligence Engine (2026)', () => {

  // ==========================================================================
  // T-BIZ-01: IRC 2026 Continente: PME 15% vs Startup 12,5% vs Geral 19%
  // ==========================================================================
  test('T-BIZ-01: IRC 2026 Continente: PME 15% vs Startup 12,5% vs Geral 19%', () => {
    const corporateEngine = new CorporateIrcSubEngine();

    // 1. PME Qualificada (Continente): 50.000€ x 15% + 30.000€ x 19% = 7.500€ + 5.700€ = 13.200,00 €
    const inputPme: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 80_000.00
    };
    const resPme = corporateEngine.calculateLiquidation(inputPme);
    assert.equal(resPme.dataStatus, 'official');
    assert.equal(resPme.layer3_taxableBaseMateriaColetavelEur, 80_000.00);
    assert.equal(resPme.layer4_firstBracketTaxEur, 7_500.00);
    assert.equal(resPme.layer4_secondBracketTaxEur, 5_700.00);
    assert.equal(resPme.layer4_baseColetaIrcEur, 13_200.00);

    // 2. Startup Qualificada (Continente): 50.000€ x 12,5% + 30.000€ x 19% = 6.250€ + 5.700€ = 11.950,00 €
    const inputStartup: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'startup_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 80_000.00
    };
    const resStartup = corporateEngine.calculateLiquidation(inputStartup);
    assert.equal(resStartup.layer4_firstBracketTaxEur, 6_250.00);
    assert.equal(resStartup.layer4_secondBracketTaxEur, 5_700.00);
    assert.equal(resStartup.layer4_baseColetaIrcEur, 11_950.00);

    // 3. Grande Empresa / Regime Geral: 80.000€ x 19% = 15.200,00 €
    const inputGeral: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'grande_empresa_geral',
      corporateLegalForm: 'sociedade_anonima',
      accountingProfitBeforeTaxEur: 80_000.00
    };
    const resGeral = corporateEngine.calculateLiquidation(inputGeral);
    assert.equal(resGeral.layer4_baseColetaIrcEur, 15_200.00);

    // 4. Safe-fail: Regiões Autónomas (Madeira / Açores)
    const inputMadeira: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'madeira',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 80_000.00
    };
    const resMadeira = corporateEngine.calculateLiquidation(inputMadeira);
    assert.equal(resMadeira.dataStatus, 'safe_fail');
    assert.equal(resMadeira.safeFailReason, 'unsupported_tax_territory');
  });

  // ==========================================================================
  // T-BIZ-02: Derrama Municipal: Sede Única vs Concelho Não Homologado vs Plurimunicipal
  // ==========================================================================
  test('T-BIZ-02: Derrama Municipal: Sede Única vs Concelho Não Homologado vs Plurimunicipal', () => {
    const corporateEngine = new CorporateIrcSubEngine();

    // 1. Lisboa (1,5% sobre 80.000€ = 1.200,00 €)
    const inputLisboa: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 80_000.00,
      municipalityCode: 'lisboa'
    };
    const resLisboa = corporateEngine.calculateLiquidation(inputLisboa);
    assert.equal(resLisboa.layer6_derramaRatePct, 1.5);
    assert.equal(resLisboa.layer6_derramaMunicipalEur, 1_200.00);

    // 2. Município inexistente no dataset 2026 -> safe-fail
    const inputUnknown: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 80_000.00,
      municipalityCode: 'municipio_desconhecido_2026'
    };
    const resUnknown = corporateEngine.calculateLiquidation(inputUnknown);
    assert.equal(resUnknown.dataStatus, 'safe_fail');
    assert.equal(resUnknown.safeFailReason, 'municipality_rate_not_found');

    // 3. Entidade Plurimunicipal -> safe-fail
    const inputMulti: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 80_000.00,
      isMultiMunicipality: true
    };
    const resMulti = corporateEngine.calculateLiquidation(inputMulti);
    assert.equal(resMulti.dataStatus, 'safe_fail');
    assert.equal(resMulti.safeFailReason, 'unsupported_multimunicipality');
  });

  // ==========================================================================
  // T-BIZ-03: Remuneração MOE Gerente: TSU 23,75% + 11,0% (Art. 69.º, n.º 2 CRC)
  // ==========================================================================
  test('T-BIZ-03: Remuneração MOE Gerente: TSU 23,75% + 11,0% (Art. 69.º, n.º 2 CRC)', () => {
    const proLaboreAnnual = 24_000.00;
    const tsuPatronal = Number(((proLaboreAnnual * TSU_EMPLOYER_CONTRIBUTION_RATE_PCT) / 100).toFixed(2));
    const tsuGerente = Number(((proLaboreAnnual * TSU_MANAGER_MOE_CONTRIBUTION_RATE_PCT) / 100).toFixed(2));
    const tsuTotal = Number(((proLaboreAnnual * TSU_TOTAL_MOE_RATE_PCT) / 100).toFixed(2));

    assert.equal(tsuPatronal, 5_700.00, 'TSU Patronal: 24.000€ x 23,75% = 5.700,00 €');
    assert.equal(tsuGerente, 2_640.00, 'TSU MOE Gerente: 24.000€ x 11,00% = 2.640,00 € (Art. 69.º/2 CRC)');
    assert.equal(tsuTotal, 8_340.00, 'TSU Total: 34,75% = 8.340,00 €');
  });

  // ==========================================================================
  // T-BIZ-04: Dividendos: Aplicação Cogente dos 50% em Quotas (Art. 217.º) e Anónimas (Art. 294.º)
  // ==========================================================================
  test('T-BIZ-04: Dividendos: Aplicação Cogente dos 50% em Quotas (Art. 217.º) e Anónimas (Art. 294.º)', () => {
    const dividendEngine = new DividendDistributionSubEngine();

    // Cenário: Lucro 20.000€, Capital 5.000€, Reserva Legal Inicial 0€, Perdas Transitadas 2.000€,
    // I&D não coberto 500€, Justo Valor 500€, Situação Líquida 23.000€.
    // 1. Quotas: Piso Reserva Legal = 2.500€ (Art. 218.º/2). Dotação = 1.000€ (5% de 20.000€).
    // Máximo Distribuível = 20.000 - 1.000 - 2.000 - 500 = 16.500,00 €.
    // Metade Obrigatória = 8.250,00 €.
    const inputQuotas: DividendDistributionInput = {
      corporateForm: 'sociedade_por_quotas',
      netProfitOfExerciseEur: 20_000.00,
      shareCapitalEur: 5_000.00,
      legalReserveBalanceInitialEur: 0.00,
      retainedEarningsBalanceEur: -2_000.00,
      unrealizedDevelopmentExpensesEur: 500.00,
      unrealizedFairValueReservesEur: 500.00,
      equitySituationTotalEur: 23_000.00,
      distributionOption: 'full_retention',
      hasStatutoryDistributionWaiver: false // Sem deliberação de 3/4
    };

    const resQuotasBlocked = dividendEngine.calculateDistribution(inputQuotas);
    assert.equal(resQuotasBlocked.dataStatus, 'safe_fail');
    assert.equal(resQuotasBlocked.safeFailReason, 'distribution_below_statutory_minimum');
    assert.equal(resQuotasBlocked.distributableProfitGlobalMaxEur, 16_500.00);
    assert.equal(resQuotasBlocked.mandatoryMinimumDistributionFiftyPctEur, 8_250.00);

    // 2. Quotas com deliberação qualificada de 3/4 (Waiver): aceita retenção
    const resQuotasWaived = dividendEngine.calculateDistribution({
      ...inputQuotas,
      hasStatutoryDistributionWaiver: true
    });
    assert.equal(resQuotasWaived.dataStatus, 'official');
    assert.equal(resQuotasWaived.finalDistributedAmountEur, 0.00);
    assert.equal(resQuotasWaived.retainedForReservesEur, 16_500.00);

    // 3. Sociedade Anónima: Aplicação do Artigo 294.º do CSC (bloqueia igualmente sem waiver)
    const inputSa: DividendDistributionInput = {
      corporateForm: 'sociedade_anonima',
      netProfitOfExerciseEur: 20_000.00,
      shareCapitalEur: 5_000.00,
      legalReserveBalanceInitialEur: 0.00,
      retainedEarningsBalanceEur: -2_000.00,
      unrealizedDevelopmentExpensesEur: 500.00,
      unrealizedFairValueReservesEur: 500.00,
      equitySituationTotalEur: 23_000.00,
      distributionOption: 'full_retention',
      hasStatutoryDistributionWaiver: false
    };

    const resSaBlocked = dividendEngine.calculateDistribution(inputSa);
    assert.equal(resSaBlocked.dataStatus, 'safe_fail');
    assert.equal(resSaBlocked.safeFailReason, 'distribution_below_statutory_minimum');
    assert.equal(resSaBlocked.distributableProfitGlobalMaxEur, 16_500.00);
    assert.equal(resSaBlocked.mandatoryMinimumDistributionFiftyPctEur, 8_250.00);

    // 4. Distribuição Normal dos 50% obrigatórios (8.250,00 €) com retenção de 28%
    const resSaFifty = dividendEngine.calculateDistribution({
      ...inputSa,
      distributionOption: 'mandatory_fifty_percent'
    });
    assert.equal(resSaFifty.dataStatus, 'official');
    assert.equal(resSaFifty.finalDistributedAmountEur, 8_250.00);
    assert.equal(resSaFifty.shareholderTaxWithholdingEur, 2_310.00, '28% de 8.250€ = 2.310,00 €');
    assert.equal(resSaFifty.shareholderEffectiveIncomeEur, 5_940.00, '8.250€ - 2.310€ = 5.940,00 €');
  });

  // ==========================================================================
  // T-BIZ-05: Tributações Autónomas: PHEV Euro 6e-bis com Recibo Autenticado vs Ordinário vs BEV
  // ==========================================================================
  test('T-BIZ-05: Tributações Autónomas: PHEV Euro 6e-bis com Recibo Autenticado vs Ordinário vs BEV', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine();
    const corporateEngine = new CorporateIrcSubEngine(provenanceEngine);

    // Registar um recibo genuíno para a viatura PHEV-001
    const phevVehicleId = 'PHEV-001';
    const phevDigest = createHash('sha256').update(Buffer.from(phevVehicleId)).digest('hex');
    const phevReceipt = provenanceEngine.createSignedReceiptFromCollectorBytes(
      'https://diariodarepublica.pt/dr/detalhe/homologacao/phev-001',
      Buffer.from(phevVehicleId),
      'HOMOLOGATION_EURO_6E_BIS_2026'
    );

    // 1. PHEV Euro 6e-bis de 40.000€ com recibo autenticado -> 7,5% = 3.000,00 € (Art. 88.º/18)
    const inputPhevAutenticado: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 50_000.00,
      autonomousTaxInput: {
        vehicles: [{
          vehicleId: phevVehicleId,
          engineType: 'plug_in_hybrid_phev',
          acquisitionCostEur: 40_000.00,
          acquisitionYear: 2026,
          electricAutonomyKm: 55,
          co2EmissionsGramsPerKm: 75,
          emissionStandard: 'EURO_6E_BIS',
          homologationIngestionReceiptId: phevReceipt.receiptId
        }]
      }
    };
    const resPhevAuth = corporateEngine.calculateLiquidation(inputPhevAutenticado);
    assert.equal(resPhevAuth.layer6_autonomousTaxesDetailed[0].statutoryRatePct, 7.5);
    assert.equal(resPhevAuth.layer6_autonomousTaxesDetailed[0].taxDueEur, 3_000.00);
    assert.equal(resPhevAuth.layer6_autonomousTaxesDetailed[0].status, 'reduced_rate_validated');

    // 2. PHEV de 40.000€ sem recibo autenticado -> Taxa ordinária do escalão (25%) = 10.000,00 €
    const inputPhevSemRecibo: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 50_000.00,
      autonomousTaxInput: {
        vehicles: [{
          vehicleId: 'PHEV-UNVERIFIED',
          engineType: 'plug_in_hybrid_phev',
          acquisitionCostEur: 40_000.00,
          acquisitionYear: 2026,
          electricAutonomyKm: 55,
          co2EmissionsGramsPerKm: 75,
          emissionStandard: 'EURO_6E_BIS'
        }]
      }
    };
    const resPhevUnverified = corporateEngine.calculateLiquidation(inputPhevSemRecibo);
    assert.equal(resPhevUnverified.layer6_autonomousTaxesDetailed[0].statutoryRatePct, 25.0);
    assert.equal(resPhevUnverified.layer6_autonomousTaxesDetailed[0].taxDueEur, 10_000.00);
    assert.equal(resPhevUnverified.layer6_autonomousTaxesDetailed[0].status, 'reduced_rate_not_validated');

    // 3. BEV Elétrico: <= 62.500€ -> 0,00 €; > 62.500€ -> 10%
    const inputBev: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      accountingProfitBeforeTaxEur: 50_000.00,
      autonomousTaxInput: {
        vehicles: [
          { vehicleId: 'BEV-1', engineType: 'battery_electric_bev', acquisitionCostEur: 60_000.00, acquisitionYear: 2026 },
          { vehicleId: 'BEV-2', engineType: 'battery_electric_bev', acquisitionCostEur: 70_000.00, acquisitionYear: 2026 }
        ]
      }
    };
    const resBev = corporateEngine.calculateLiquidation(inputBev);
    assert.equal(resBev.layer6_autonomousTaxesDetailed[0].taxDueEur, 0.00, 'BEV <= 62.5k isento');
    assert.equal(resBev.layer6_autonomousTaxesDetailed[1].taxDueEur, 7_000.00, 'BEV 70k x 10% = 7.000€');
  });

  // ==========================================================================
  // T-BIZ-06: ENI: Decomposição Estrita de Despesas do Art. 31.º/13 CIRS
  // ==========================================================================
  test('T-BIZ-06: ENI: Decomposição Estrita de Despesas do Art. 31.º/13 CIRS', () => {
    // Serviços de 60.000€ -> Exigência legal de 15% = 9.000,00 €
    // Parcela base: max(4.104€, SS 5.000€) = 5.000,00 €
    // Faturas comunicadas e-Fatura = 2.000,00 €
    // Total justificado = 7.000,00 € -> Défice = 2.000,00 €
    const res = evaluateEniSimplifiedExpensesRequirement({
      grossServicesTurnoverEur: 60_000.00,
      socialSecurityPaidInPeriodEur: 5_000.00,
      verifiedEFaturaExpensesEur: 2_000.00
    });

    assert.equal(res.requiredExpensesAmountEur, 9_000.00);
    assert.equal(res.baseParcelEur, 5_000.00);
    assert.equal(res.totalJustifiedExpensesEur, 7_000.00);
    assert.equal(res.expenseDeficitEur, 2_000.00);
    assert.equal(res.statutoryAdditionToTaxableBaseEur, 2_000.00);
  });

  // ==========================================================================
  // T-BIZ-07: ENI: Início de Atividade vs Alínea g) do Art. 31.º/1 (Partes Relacionadas)
  // ==========================================================================
  test('T-BIZ-07: ENI: Início de Atividade vs Alínea g) do Art. 31.º/1 (Partes Relacionadas)', () => {
    // 1. Serviços profissionais normais (Art. 151.º) sem outros rendimentos no 1.º ano:
    // Coeficiente reduz 50% de 0,75 para 0,375 (Art. 31.º, n.º 10 CIRS)
    const normalStart = evaluateCategoryBCoefficient('services_art151', true, false, false);
    assert.equal(normalStart.statutoryCoefficient, 0.375);
    assert.equal(normalStart.reductionApplied, true);

    // 2. Serviços prestados a entidade com dependência económica ou participação >= 5%:
    // Enquadra na alínea g) do Art. 31.º/1 -> Coeficiente 1,00 (sem redução de início)
    const relatedPartyStart = evaluateCategoryBCoefficient('services_art151', true, false, true);
    assert.equal(relatedPartyStart.statutoryCoefficient, 1.00);
    assert.equal(relatedPartyStart.reductionApplied, false);
  });

  // ==========================================================================
  // T-BIZ-08: Segurança Social: Bateria Completa de Fronteiras Mensais (Arts. 145.º e 146.º CRC)
  // ==========================================================================
  test('T-BIZ-08: Segurança Social: Bateria Completa de Fronteiras Mensais (Arts. 145.º e 146.º CRC)', () => {
    // 1. Normal: Início Jan/2026 -> Efeitos em 2027-01-01
    const s1 = evaluateSocialSecurityMonthlyProductionOfEffects({
      activityStartYear: 2026,
      activityStartMonth: 1,
      assessmentYear: 2027,
      assessmentMonth: 1,
      isFirstEnrolmentEver: true,
      hasOptedForEarlyCoverageArt146: false
    });
    assert.equal(s1.effectiveDateIso, '2027-01-01');
    assert.equal(s1.obligationInEffect, true);

    // 2. Reinício no 5.º mês: Início Jan/2026, Cessação Mar/2026, Reinício Ago/2026 -> Efeitos em 2027-06-01
    const s2 = evaluateSocialSecurityMonthlyProductionOfEffects({
      activityStartYear: 2026,
      activityStartMonth: 1,
      assessmentYear: 2027,
      assessmentMonth: 6,
      isFirstEnrolmentEver: true,
      cessationPeriods: [{ cessationYear: 2026, cessationMonth: 3, restartYear: 2026, restartMonth: 8 }],
      hasOptedForEarlyCoverageArt146: false
    });
    assert.equal(s2.effectiveDateIso, '2027-06-01');
    assert.equal(s2.suspendedMonthsTotal, 5);

    // 3. Reinício no limite exato de 12 meses: Cessação Mar/2026, Reinício Mar/2027 -> Efeitos em 2028-01-01 (Art. 145.º/3)
    const s3 = evaluateSocialSecurityMonthlyProductionOfEffects({
      activityStartYear: 2026,
      activityStartMonth: 1,
      assessmentYear: 2028,
      assessmentMonth: 1,
      isFirstEnrolmentEver: true,
      cessationPeriods: [{ cessationYear: 2026, cessationMonth: 3, restartYear: 2027, restartMonth: 3 }],
      hasOptedForEarlyCoverageArt146: false
    });
    assert.equal(s3.effectiveDateIso, '2028-01-01');
    assert.equal(s3.suspendedMonthsTotal, 12);

    // 4. Reinício no 13.º mês (Art. 145.º/4): Cessação Mar/2026, Reinício Abr/2027 -> Efeitos imediatos no mês de reinício (2027-04-01)
    const s4 = evaluateSocialSecurityMonthlyProductionOfEffects({
      activityStartYear: 2026,
      activityStartMonth: 1,
      assessmentYear: 2027,
      assessmentMonth: 4,
      isFirstEnrolmentEver: true,
      cessationPeriods: [{ cessationYear: 2026, cessationMonth: 3, restartYear: 2027, restartMonth: 4 }],
      hasOptedForEarlyCoverageArt146: false
    });
    assert.equal(s4.effectiveDateIso, '2027-04-01');
    assert.equal(s4.status, 'obligation_active_post_12m_cessation');

    // 5. Cessação em aberto sem reinício formal -> insufficient_cessation_history
    const s5 = evaluateSocialSecurityMonthlyProductionOfEffects({
      activityStartYear: 2026,
      activityStartMonth: 1,
      assessmentYear: 2026,
      assessmentMonth: 6,
      isFirstEnrolmentEver: true,
      cessationPeriods: [{ cessationYear: 2026, cessationMonth: 3 }],
      hasOptedForEarlyCoverageArt146: false
    });
    assert.equal(s5.status, 'insufficient_cessation_history');

    // 6. Antecipação voluntária do Art. 146.º do CRC: Requerimento em 17/05/2026 -> Efeitos em 2026-06-01
    const s6 = evaluateSocialSecurityMonthlyProductionOfEffects({
      activityStartYear: 2026,
      activityStartMonth: 1,
      assessmentYear: 2026,
      assessmentMonth: 6,
      isFirstEnrolmentEver: true,
      hasOptedForEarlyCoverageArt146: true,
      earlyCoverageRequestYear: 2026,
      earlyCoverageRequestMonth: 5
    });
    assert.equal(s6.effectiveDateIso, '2026-06-01');
    assert.equal(s6.status, 'early_coverage_exercised');
  });

  // ==========================================================================
  // T-BIZ-09: IVA: Limiar de 15.000 € no Início (Art. 53.º, n.º 5) e Regime Normal (n.º 1)
  // ==========================================================================
  test('T-BIZ-09: IVA: Limiar de 15.000 € no Início (Art. 53.º, n.º 5) e Regime Normal (n.º 1)', () => {
    // 1. Ano anterior de 14.500€ sem exportações -> exempt_art53
    const iva1 = evaluateIvaArticle53Regime(14_500.00, false, 0, false);
    assert.equal(iva1.regime, 'exempt_art53');

    // 2. Início de atividade com estimativa formal de 18.000€ -> normal_regime
    const iva2 = evaluateIvaArticle53Regime(0, true, 18_000.00, false);
    assert.equal(iva2.regime, 'normal_regime');

    // 3. Volume de 12.000€ com exportações -> normal_regime
    const iva3 = evaluateIvaArticle53Regime(12_000.00, false, 0, true);
    assert.equal(iva3.regime, 'normal_regime');
  });

  // ==========================================================================
  // T-BIZ-10: IRC em 6 Camadas: Dedução Agregada RFAI (Art. 23.º/2 CFI) e Liquidação Final
  // ==========================================================================
  test('T-BIZ-10: IRC em 6 Camadas: Dedução Agregada RFAI (Art. 23.º/2 CFI) e Liquidação Final', () => {
    const corporateEngine = new CorporateIrcSubEngine();

    // Premissas: PME qualificada em Lisboa (1,5%), Matéria Coletável 35.000 € (Coleta Base = 5.250 € a 15%)
    // Tranche A de 2025 (trienal): 3.000 € disponíveis
    // Tranche B de 2020 (standard): 4.000 € disponíveis
    // Viatura de combustão 30.000 € (TA = 2.400 € a 8%)
    const trancheTrienalA: RfaiInvestmentTranche = {
      trancheId: 'Tranche_Trienal_A',
      investmentTaxYear: 2025,
      activityStartTaxYear: 2024, // triénio inicial
      eligibleInvestmentExpenditureEur: 10_000.00,
      regionTier: 'regioes_fronteiricas_ou_interior',
      statutoryCreditRatePct: 30.0,
      generatedTaxCreditEur: 3_000.00,
      previouslyDeductedInPriorYearsEur: 0.00,
      currentAvailableCarryforwardEur: 3_000.00,
      statutoryFiscalDossierRefId: 'DOSSIER_CFI25_CIRC130_2025_001'
    };

    const trancheStandardB: RfaiInvestmentTranche = {
      trancheId: 'Tranche_Standard_B',
      investmentTaxYear: 2020,
      activityStartTaxYear: 2024, // fora do triénio
      eligibleInvestmentExpenditureEur: 20_000.00,
      regionTier: 'outras_regioes_elegiveis',
      statutoryCreditRatePct: 20.0,
      generatedTaxCreditEur: 4_000.00,
      previouslyDeductedInPriorYearsEur: 0.00,
      currentAvailableCarryforwardEur: 4_000.00,
      statutoryFiscalDossierRefId: 'DOSSIER_CFI25_CIRC130_2020_001'
    };

    const input: CorporateLiquidationInput = {
      taxYear: 2026,
      fiscalTerritory: 'continente',
      corporateCategory: 'pme_qualificada',
      corporateLegalForm: 'sociedade_por_quotas',
      municipalityCode: 'lisboa',
      accountingProfitBeforeTaxEur: 35_000.00,
      rfaiTranches: [trancheTrienalA, trancheStandardB],
      rfaiAllocationPolicy: 'mira_gold_optimal_preservation',
      autonomousTaxInput: {
        vehicles: [{
          vehicleId: 'CAR-01',
          engineType: 'internal_combustion',
          acquisitionCostEur: 30_000.00,
          acquisitionYear: 2026
        }]
      }
    };

    const res = corporateEngine.calculateLiquidation(input);
    assert.equal(res.dataStatus, 'official');
    assert.equal(res.layer3_taxableBaseMateriaColetavelEur, 35_000.00);
    assert.equal(res.layer4_baseColetaIrcEur, 5_250.00, '35.000€ x 15% = 5.250,00 €');

    // Sob mira_gold_optimal_preservation:
    // Tranche Standard B deduz 2.625,00 € (esgotando os 50%)
    // Tranche Trienal A deduz 2.625,00 € (restando 375,00 € preservados)
    // Total RFAI = 5.250,00 € -> IRC Líquido = 0,00 €
    assert.equal(res.layer5_rfaiDeductionDetails?.totalRfaiDeductedCurrentPeriodEur, 5_250.00);
    assert.equal(res.layer5_netIrcEur, 0.00);

    // Camada 6:
    // Derrama Municipal: 35.000€ x 1,5% = 525,00 €
    // Tributação Autónoma Viatura 30.000€ (ano de início): 30.000€ x 8% = 2.400,00 €
    // Liquidação Total Devida: 0€ + 525€ + 2.400€ = 2.925,00 €
    assert.equal(res.layer6_derramaMunicipalEur, 525.00);
    assert.equal(res.layer6_autonomousTaxesTotalEur, 2_400.00);
    assert.equal(res.layer6_totalFinalAssessmentDueEur, 2_925.00);
  });

  // ==========================================================================
  // T-BIZ-RFAI-ORDER-01: Invariância Matemática Absoluta sob Permutação de Tranches
  // ==========================================================================
  test('T-BIZ-RFAI-ORDER-01: Invariância Matemática Absoluta sob Permutação de Tranches', () => {
    const s1: RfaiInvestmentTranche = {
      trancheId: 'Standard_1',
      investmentTaxYear: 2020,
      activityStartTaxYear: 2024,
      eligibleInvestmentExpenditureEur: 10_000.00,
      regionTier: 'outras_regioes_elegiveis',
      statutoryCreditRatePct: 20.0,
      generatedTaxCreditEur: 2_000.00,
      previouslyDeductedInPriorYearsEur: 0.00,
      currentAvailableCarryforwardEur: 2_000.00,
      statutoryFiscalDossierRefId: 'DOSSIER_CFI25_CIRC130_2020_001'
    };

    const s2: RfaiInvestmentTranche = {
      trancheId: 'Standard_2',
      investmentTaxYear: 2021,
      activityStartTaxYear: 2024,
      eligibleInvestmentExpenditureEur: 10_000.00,
      regionTier: 'outras_regioes_elegiveis',
      statutoryCreditRatePct: 20.0,
      generatedTaxCreditEur: 2_000.00,
      previouslyDeductedInPriorYearsEur: 0.00,
      currentAvailableCarryforwardEur: 2_000.00,
      statutoryFiscalDossierRefId: 'DOSSIER_CFI25_CIRC130_2021_001'
    };

    const t1: RfaiInvestmentTranche = {
      trancheId: 'Trienal_1',
      investmentTaxYear: 2025,
      activityStartTaxYear: 2024,
      eligibleInvestmentExpenditureEur: 10_000.00,
      regionTier: 'regioes_fronteiricas_ou_interior',
      statutoryCreditRatePct: 30.0,
      generatedTaxCreditEur: 3_000.00,
      previouslyDeductedInPriorYearsEur: 0.00,
      currentAvailableCarryforwardEur: 3_000.00,
      statutoryFiscalDossierRefId: 'DOSSIER_CFI25_CIRC130_2025_001'
    };

    const coleta = 5_250.00;
    const year = 2026;

    const res1 = calculateRfaiDeduction([s1, s2, t1], year, coleta, 'mira_gold_optimal_preservation');
    const res2 = calculateRfaiDeduction([t1, s2, s1], year, coleta, 'mira_gold_optimal_preservation');
    const res3 = calculateRfaiDeduction([s2, t1, s1], year, coleta, 'mira_gold_optimal_preservation');

    // Asserção de invariância estrita de permutações
    assert.equal(res1.totalRfaiDeductedCurrentPeriodEur, 5_250.00);
    assert.equal(res2.totalRfaiDeductedCurrentPeriodEur, 5_250.00);
    assert.equal(res3.totalRfaiDeductedCurrentPeriodEur, 5_250.00);

    const getDeduction = (r: typeof res1, id: string) => r.detailedTrancheAllocations.find(x => x.trancheId === id)!;

    assert.equal(getDeduction(res1, 'Standard_1').deductedInPeriodEur, 2_000.00);
    assert.equal(getDeduction(res2, 'Standard_1').deductedInPeriodEur, 2_000.00);
    assert.equal(getDeduction(res3, 'Standard_1').deductedInPeriodEur, 2_000.00);

    assert.equal(getDeduction(res1, 'Standard_2').deductedInPeriodEur, 625.00);
    assert.equal(getDeduction(res2, 'Standard_2').deductedInPeriodEur, 625.00);
    assert.equal(getDeduction(res3, 'Standard_2').deductedInPeriodEur, 625.00);

    assert.equal(getDeduction(res1, 'Trienal_1').deductedInPeriodEur, 2_625.00);
    assert.equal(getDeduction(res2, 'Trienal_1').deductedInPeriodEur, 2_625.00);
    assert.equal(getDeduction(res3, 'Trienal_1').deductedInPeriodEur, 2_625.00);

    assert.equal(getDeduction(res1, 'Trienal_1').carriedForwardEur, 375.00, '375€ de crédito trienal preservado para o futuro');
  });

  // ==========================================================================
  // BATERIA FORENSE CRIPTOGRÁFICA DE INGESTÃO E ADULTERAÇÃO (T-BIZ-FOR-01 a 06)
  // ==========================================================================
  const secret = 'mira_gold_test_key_for_harness';
  const officialUrl = 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/170-2026-800184186';
  const rawBytes = Buffer.from('REPÚBLICA PORTUGUESA - DIÁRIO DA REPÚBLICA 2026', 'utf-8');
  const digest = createHash('sha256').update(rawBytes).digest('hex');
  const version = 'DL_170_2026_CANONICAL';

  test('T-BIZ-FOR-01: Digest adulterado no recibo de ingestão detectado como tampered_receipt', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine(secret);
    const genuineReceipt = provenanceEngine.createSignedReceiptFromCollectorBytes(officialUrl, rawBytes, version);
    const tamperedReceipt1 = { ...genuineReceipt, receiptId: 'RCPT_TAMPERED_1', canonicalSha256Digest: 'f'.repeat(64) };
    provenanceEngine.registerIngestionReceipt(tamperedReceipt1);

    const rule01: NormativeRuleProvenance = {
      ruleId: 'RULE_OE2026',
      legalBasis: 'Art. 22.º CFI',
      sourceDocument: 'DL 170/2026',
      sourceUrl: officialUrl,
      sourceVersion: version,
      ingestionReceiptId: tamperedReceipt1.receiptId,
      payloadDigestHex: digest,
      verificationStatus: 'verified'
    };
    assert.equal(provenanceEngine.verifyNormativeProvenance(rule01), 'tampered_receipt');
  });

  test('T-BIZ-FOR-02: Domínio de terceiros fora da whitelist institucional classificado como provisional', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine(secret);
    const receipt02 = provenanceEngine.createSignedReceiptFromCollectorBytes(
      'https://fake-dre-domain.com/lei',
      rawBytes,
      version
    );
    const rule02: NormativeRuleProvenance = {
      ruleId: 'RULE_OE2026',
      legalBasis: 'Art. 22.º CFI',
      sourceDocument: 'DL 170/2026',
      sourceUrl: 'https://fake-dre-domain.com/lei',
      sourceVersion: version,
      ingestionReceiptId: receipt02.receiptId,
      payloadDigestHex: digest,
      verificationStatus: 'verified'
    };
    assert.equal(provenanceEngine.verifyNormativeProvenance(rule02), 'provisional');
  });

  test('T-BIZ-FOR-03: Versão documental divergente no contrato detectada como digest_mismatch', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine(secret);
    const genuineReceipt = provenanceEngine.createSignedReceiptFromCollectorBytes(officialUrl, rawBytes, version);
    const rule03: NormativeRuleProvenance = {
      ruleId: 'RULE_OE2026',
      legalBasis: 'Art. 22.º CFI',
      sourceDocument: 'DL 170/2026',
      sourceUrl: officialUrl,
      sourceVersion: 'DL_170_2026_UNAUTHORIZED_REV',
      ingestionReceiptId: genuineReceipt.receiptId,
      payloadDigestHex: digest,
      verificationStatus: 'verified'
    };
    assert.equal(provenanceEngine.verifyNormativeProvenance(rule03), 'digest_mismatch');
  });

  test('T-BIZ-FOR-04: Assinatura HMAC forjada com chave arbitrária detectada como tampered_receipt', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine(secret);
    const genuineReceipt = provenanceEngine.createSignedReceiptFromCollectorBytes(officialUrl, rawBytes, version);
    const forgedHmac = createHmac('sha256', 'attacker_key').update('payload').digest('hex');
    const tamperedReceipt4 = { ...genuineReceipt, receiptId: 'RCPT_FORGED_4', hmacSignature: forgedHmac };
    provenanceEngine.registerIngestionReceipt(tamperedReceipt4);

    const rule04: NormativeRuleProvenance = {
      ruleId: 'RULE_OE2026',
      legalBasis: 'Art. 22.º CFI',
      sourceDocument: 'DL 170/2026',
      sourceUrl: officialUrl,
      sourceVersion: version,
      ingestionReceiptId: tamperedReceipt4.receiptId,
      payloadDigestHex: digest,
      verificationStatus: 'verified'
    };
    assert.equal(provenanceEngine.verifyNormativeProvenance(rule04), 'tampered_receipt');
  });

  test('T-BIZ-FOR-05: Bytes obtidos pelo coletor divergem do contrato detectado como digest_mismatch', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine(secret);
    const staleBytes = Buffer.from('BYTES DIVERGENTES DO CONTRATO', 'utf-8');
    const receipt05 = provenanceEngine.createSignedReceiptFromCollectorBytes(officialUrl, staleBytes, version);

    const rule05: NormativeRuleProvenance = {
      ruleId: 'RULE_OE2026',
      legalBasis: 'Art. 22.º CFI',
      sourceDocument: 'DL 170/2026',
      sourceUrl: officialUrl,
      sourceVersion: version,
      ingestionReceiptId: receipt05.receiptId,
      payloadDigestHex: digest,
      verificationStatus: 'verified'
    };
    assert.equal(provenanceEngine.verifyNormativeProvenance(rule05), 'digest_mismatch');
  });

  test('T-BIZ-FOR-06: Resposta HTTP 200 de URL oficial com versão desatualizada detectada como digest_mismatch', () => {
    const provenanceEngine = new IngestionProvenanceSubEngine(secret);
    const receipt06 = provenanceEngine.createSignedReceiptFromCollectorBytes(officialUrl, rawBytes, 'DL_170_2024_OBSOLETE');

    const rule06: NormativeRuleProvenance = {
      ruleId: 'RULE_OE2026',
      legalBasis: 'Art. 22.º CFI',
      sourceDocument: 'DL 170/2026',
      sourceUrl: officialUrl,
      sourceVersion: version,
      ingestionReceiptId: receipt06.receiptId,
      payloadDigestHex: digest,
      verificationStatus: 'verified'
    };
    assert.equal(provenanceEngine.verifyNormativeProvenance(rule06), 'digest_mismatch');
  });

});
