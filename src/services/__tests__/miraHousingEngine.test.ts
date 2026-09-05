/**
 * Bateria de Testes Unitários Canónicos: U-HOUSE-01 (15 Testes)
 * Executado via: npx tsx --test src/services/__tests__/miraHousingEngine.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  HousingEvidenceStore,
  verifySourceEvidence
} from '../housingSourceEvidence';

import {
  processIngestionEvidence,
  initializeCanonicalEvidenceStore,
  computeSha256
} from '../housingDataIngestion';

import {
  getTerritorialIntelligence,
  processPortalListings,
  calculateRentalAffordability,
  calculatePurchaseAffordability,
  calculateMaximumLoanTerm,
  calculateImtAndStampDuty,
  IMT_JOVEM_2026,
  PortalListing
} from '../miraHousingEngine';

describe('U-HOUSE-01: MIRA Housing Intelligence & Affordability Engine 2026', () => {

  // T-HOUSE-01
  it('T-HOUSE-01: Asking vs Contracted & Exclusão de Alojamento Local (Airbnb)', () => {
    const lisboaIntel = getTerritorialIntelligence('lisboa-concelho');
    assert.ok(lisboaIntel !== null);

    // Mediana Contratada INE (17,42 €/m²) vs Anunciada Idealista (24,50 €/m²)
    assert.strictEqual(lisboaIntel.contractedMarket.medianRentEurPerM2, 17.42);
    assert.strictEqual(lisboaIntel.askingBenchmark.estimatedRentEurPerM2, 24.50);
    assert.strictEqual(lisboaIntel.askingVsContractedSpreadPct, 40.6); // +40,6% de ágio

    // Testar que Airbnb é excluído do benchmark residencial
    const mixedListings: PortalListing[] = [
      { id: '1', portalId: 'idealista', propertyAddress: 'Rua A 1', typology: 't2', priceEur: 1200, areaM2: 75 },
      { id: '2', portalId: 'airbnb', propertyAddress: 'Rua Turistica', typology: 't2', priceEur: 3500, areaM2: 75 },
      { id: '3', portalId: 'house-13', propertyAddress: 'Rua Férias', typology: 't2', priceEur: 4000, areaM2: 75 }
    ];

    const processed = processPortalListings(mixedListings);
    assert.strictEqual(processed.rawCount, 3);
    assert.strictEqual(processed.filteredCount, 1);
    assert.strictEqual(processed.medianEur, 1200); // Airbnb eliminado!
  });

  // T-HOUSE-02
  it('T-HOUSE-02: Artigo 1076.º do Código Civil (Capital Máximo Admissível)', () => {
    const result = calculateRentalAffordability({
      territoryId: 'lisboa-concelho',
      typology: 't2',
      contractRentMonthly: 800,
      netMonthlyHouseholdIncome: 2000,
      candidateAges: [28]
    });

    const cap = result.legalInitialCapitalCC1076;
    assert.strictEqual(cap.firstMonthRent, 800);
    assert.strictEqual(cap.maxAdvanceRentMonths, 2);
    assert.strictEqual(cap.maxAdvanceRentEur, 1600);
    assert.strictEqual(cap.maxSecurityDepositMonths, 2);
    assert.strictEqual(cap.maxSecurityDepositEur, 1600);
    assert.strictEqual(cap.maxAdmissibleTotalEur, 4000); // 5 rendas exatas (800 * 5)
    assert.ok(cap.label.includes('Capital inicial máximo contratualmente admissível'));
  });

  // T-HOUSE-03
  it('T-HOUSE-03: Porta 65 Jovem — Verificação Cumulativa Tripla (RMA, RMMG e Esforço Bruto 60%)', () => {
    // Caso 1: Positivo (Cumpre 4xRMA, 4xRMMG e <=60% rendimento bruto)
    // RMA de Lisboa T1 = 750 €. 4xRMA = 3.000 €. 4xRMMG = 3.680 €.
    const posResult = calculateRentalAffordability({
      territoryId: 'lisboa-concelho',
      typology: 't1',
      contractRentMonthly: 700,
      netMonthlyHouseholdIncome: 1800,
      grossMonthlyHouseholdIncome: 2300,
      correctedMonthlyHouseholdIncome: 2100,
      candidateAges: [26]
    });

    const p65Pos = posResult.porta65JovemScreening;
    assert.strictEqual(p65Pos.isAgeEligible, true);
    assert.strictEqual(p65Pos.isRentWithinMunicipalRma, true);
    assert.strictEqual(p65Pos.incomeEligibility.passesReferenceRentLimit, true);
    assert.strictEqual(p65Pos.incomeEligibility.passesRmmgLimit, true);
    assert.strictEqual(p65Pos.incomeEligibility.passesGrossEffortLimit, true);
    assert.strictEqual(p65Pos.incomeEligibility.passesOverallIncome, true);
    assert.strictEqual(p65Pos.screeningStatus, 'preliminary_pass');

    // Caso 2: Negativo por Esforço Bruto > 60%
    // Renda 700 € com Rendimento Bruto 1.000 € => 70% > 60%
    const negGrossResult = calculateRentalAffordability({
      territoryId: 'lisboa-concelho',
      typology: 't1',
      contractRentMonthly: 700,
      netMonthlyHouseholdIncome: 900,
      grossMonthlyHouseholdIncome: 1000,
      correctedMonthlyHouseholdIncome: 1000,
      candidateAges: [26]
    });
    assert.strictEqual(negGrossResult.porta65JovemScreening.incomeEligibility.passesGrossEffortLimit, false);
    assert.strictEqual(negGrossResult.porta65JovemScreening.screeningStatus, 'gross_effort_exceeded');

    // Caso 3: Negativo por Exceder 4xRMA
    // Rendimento corrigido 3.200 € excede 4xRMA (3.000 €)
    const negRmaResult = calculateRentalAffordability({
      territoryId: 'lisboa-concelho',
      typology: 't1',
      contractRentMonthly: 700,
      netMonthlyHouseholdIncome: 2600,
      grossMonthlyHouseholdIncome: 3500,
      correctedMonthlyHouseholdIncome: 3200,
      candidateAges: [26]
    });
    assert.strictEqual(negRmaResult.porta65JovemScreening.incomeEligibility.passesReferenceRentLimit, false);
    assert.strictEqual(negRmaResult.porta65JovemScreening.screeningStatus, 'income_exceeded');
  });

  // T-HOUSE-04
  it('T-HOUSE-04: LTV sobre min(preço, avaliação)', () => {
    // Preço 200.000 €, Avaliação Bancária 180.000 €
    // Financiamento de 90% incide sobre 180.000 € = 162.000 € (NÃO sobre 200.000 € = 180.000 €)
    const result = calculatePurchaseAffordability({
      territoryId: 'lisboa-concelho',
      acquisitionPrice: 200000,
      appraisalValue: 180000,
      ownCapitalAvailable: 20000, // 200k - 20k = 180k pretendido, limitado a 162k pelo LTV
      netMonthlyIncome: 2500,
      borrowers: [{ age: 29 }],
      isFirstHpp: true,
      ownsResidentialProperty: false,
      isYouthGuaranteeRequested: false // Testa regra geral de 90%
    });

    assert.strictEqual(result.eligiblePropertyValue, 180000);
    assert.strictEqual(result.financing.maxLoanAllowed, 162000); // 180k * 90%
    assert.strictEqual(result.financing.loanAmount, 162000); // 180k * 90%
    assert.strictEqual(result.financing.minRequiredOwnCapital, 38000); // 200k - 162k
  });

  // T-HOUSE-05
  it('T-HOUSE-05: DSTI e Referência Macroprudencial do BdP', () => {
    // Casos DSTI:
    // a) Prestação ~360 € / Rendimento 1.200 € => ~30% (Within reference <=50%)
    const resA = calculatePurchaseAffordability({
      territoryId: 'lisboa-concelho',
      acquisitionPrice: 100000,
      ownCapitalAvailable: 10000,
      netMonthlyIncome: 1200,
      borrowers: [{ age: 30 }],
      isFirstHpp: true,
      ownsResidentialProperty: false
    });
    assert.strictEqual(resA.dstiMacroprudential.dstiStatus, 'within_macroprudential_reference');

    // b) Forçar prestação para enquadrar entre 50% e 60%
    // Rendimento 600 €, Prestação ~325 € => DSTI ~54,2%
    const resB = calculatePurchaseAffordability({
      territoryId: 'lisboa-concelho',
      acquisitionPrice: 90000,
      ownCapitalAvailable: 10000,
      netMonthlyIncome: 600,
      borrowers: [{ age: 30 }],
      isFirstHpp: true,
      ownsResidentialProperty: false
    });
    assert.strictEqual(resB.dstiMacroprudential.dstiStatus, 'above_reference_with_possible_exception');

    // c) Forçar prestação para > 60%
    // Rendimento 450 €, Prestação ~325 € => DSTI ~72,2%
    const resC = calculatePurchaseAffordability({
      territoryId: 'lisboa-concelho',
      acquisitionPrice: 90000,
      ownCapitalAvailable: 10000,
      netMonthlyIncome: 450,
      borrowers: [{ age: 30 }],
      isFirstHpp: true,
      ownsResidentialProperty: false
    });
    assert.strictEqual(resC.dstiMacroprudential.dstiStatus, 'above_exception_threshold');
  });

  // T-HOUSE-06
  it('T-HOUSE-06: Tabela Fiscal Versionada IMT Jovem 2026 (DL n.º 48-A/2024 & AT)', () => {
    assert.strictEqual(IMT_JOVEM_2026.fullExemptionLimitEur, 316772);
    assert.strictEqual(IMT_JOVEM_2026.partialExemptionCeilingEur, 633453);

    // Caso 1: Aquisição de 300.000 € (abaixo de 316.772 €) por jovem de 29 anos em 1.ª HPP
    const taxA = calculateImtAndStampDuty(300000, true, true, true);
    assert.strictEqual(taxA.isJovemApplied, true);
    assert.strictEqual(taxA.payableImt, 0);
    assert.strictEqual(taxA.payableStampDuty, 0);
    assert.ok(taxA.imtJovemSavings > 10000);

    // Caso 2: Aquisição de 400.000 € (entre 316.772 € e 633.453 €)
    // Parcela até 316.772 € isenta. Excedente (83.228 €) tributado marginalmente a 8%
    const taxB = calculateImtAndStampDuty(400000, true, true, true);
    assert.strictEqual(taxB.isJovemApplied, true);
    const expectedImtMarginal = Math.round((400000 - 316772) * 0.08); // ~6.658 €
    assert.strictEqual(taxB.payableImt, expectedImtMarginal);
    assert.ok(taxB.imtJovemSavings > 12000); // Poupança substancial face ao IMT normal
  });

  // T-HOUSE-07
  it('T-HOUSE-07: Garantia Pública Jovem (DL n.º 44/2024) — Ausência de Lookback', () => {
    // Jovem de 30 anos, 1.ª HPP, não é atualmente proprietário (ownsResidentialProperty: false),
    // mas alienou um imóvel há 2 anos (ownsResidentialPropertyLast3Years: true).
    // Validar: Elegível para a Garantia Pública (não há lookback de 3 anos no DL 44/2024),
    // mas NÃO elegível para isenção do IMT Jovem (Art. 8.º-A CIMT).
    const result = calculatePurchaseAffordability({
      territoryId: 'lisboa-concelho',
      acquisitionPrice: 250000,
      ownCapitalAvailable: 0, // Financiamento a 100% via Garantia Pública
      netMonthlyIncome: 3000,
      borrowers: [{ age: 30 }],
      isFirstHpp: true,
      ownsResidentialProperty: false,
      ownsResidentialPropertyLast3Years: true,
      isYouthGuaranteeRequested: true
    });

    assert.strictEqual(result.publicGuaranteeDL44.eligibleByRules, true);
    assert.strictEqual(result.financing.maxLtvAllowedPct, 100);
    assert.strictEqual(result.publicGuaranteeDL44.maxGuaranteeAmountEur, 37500); // 250k * 15%
    assert.strictEqual(result.fiscalTaxes.imtJovemApplied, false); // IMT Jovem rejeitado por causa dos 3 anos

    // Caso Inelegível por teto de transação (> 450.000 €)
    const resultOver450 = calculatePurchaseAffordability({
      territoryId: 'lisboa-concelho',
      acquisitionPrice: 480000,
      ownCapitalAvailable: 50000,
      netMonthlyIncome: 4000,
      borrowers: [{ age: 30 }],
      isFirstHpp: true,
      ownsResidentialProperty: false,
      isYouthGuaranteeRequested: true
    });
    assert.strictEqual(resultOver450.publicGuaranteeDL44.eligibleByRules, false);
    assert.ok(resultOver450.publicGuaranteeDL44.ineligibilityReasons.some((r) => r.includes('450.000')));
  });

  // T-HOUSE-08
  it('T-HOUSE-08: Tendência Temporal com "insufficient_data"', () => {
    const intel = getTerritorialIntelligence('lisboa-concelho');
    assert.ok(intel !== null);
    assert.strictEqual(intel.temporalTrends.trendStatus, 'insufficient_data');
    assert.strictEqual(intel.temporalTrends.rentTrend12mPct, null);
    assert.ok(intel.temporalTrends.trendNotice?.includes('29/09/2026'));
  });

  // T-HOUSE-09
  it('T-HOUSE-09: Integridade Epistémica de Proveniência (Official Concelho vs Derived Distrito)', () => {
    const concelhoIntel = getTerritorialIntelligence('lisboa-concelho');
    assert.ok(concelhoIntel !== null);
    assert.strictEqual(concelhoIntel.level, 'municipality');
    assert.strictEqual(concelhoIntel.contractedMarket.dataStatus, 'official'); // INE Concelho direto

    const distritoIntel = getTerritorialIntelligence('lisboa-distrito');
    assert.ok(distritoIntel !== null);
    assert.strictEqual(distritoIntel.level, 'district');
    assert.strictEqual(distritoIntel.contractedMarket.dataStatus, 'derived'); // Agregação MIRA
  });

  // T-HOUSE-10
  it('T-HOUSE-10: Porta 65 Subsídio com "not_calculable" & Deduplicação de Portais', () => {
    // 1. Porta 65 sem escalão detalhado
    const res = calculateRentalAffordability({
      territoryId: 'lisboa-concelho',
      typology: 't1',
      netMonthlyHouseholdIncome: 1500,
      candidateAges: [25]
    });
    assert.strictEqual(res.porta65JovemScreening.subsidyEvaluation.subsidyStatus, 'not_calculable');

    // 2. Deduplicação de 2 anúncios do mesmo imóvel em portais diferentes
    const duplicateListings: PortalListing[] = [
      { id: 'ad-1', portalId: 'idealista', propertyAddress: 'Av. Liberdade 100', typology: 't1', priceEur: 950, areaM2: 50 },
      { id: 'ad-2', portalId: 'imovirtual', propertyAddress: 'Av. Liberdade 100', typology: 't1', priceEur: 950, areaM2: 50 }
    ];
    const dedupResult = processPortalListings(duplicateListings);
    assert.strictEqual(dedupResult.rawCount, 2);
    assert.strictEqual(dedupResult.deduplicatedCount, 1);
  });

  // T-HOUSE-11
  it('T-HOUSE-11: INE Fetch Provenance (RULE_HOUSE_INGESTION_001)', () => {
    const store = initializeCanonicalEvidenceStore();
    const evidence = store.getEvidence('ine-lisboa-concelho-rent-m2');

    assert.ok(evidence !== undefined);
    assert.strictEqual(evidence.sourceId, 'INE');
    assert.strictEqual(evidence.sourceType, 'official');
    assert.strictEqual(evidence.httpStatus, 200);
    assert.strictEqual(evidence.contentHash.length, 64);
    assert.strictEqual(evidence.observationLocator, '$.renda_mediana_eur_m2');
    assert.strictEqual(evidence.extractedValue, 17.42);
    assert.strictEqual(verifySourceEvidence(evidence), true);
  });

  // T-HOUSE-12
  it('T-HOUSE-12: Portal Fetch Provenance', () => {
    const store = initializeCanonicalEvidenceStore();
    const evidence = store.getEvidence('idealista-lisboa-city-rent-m2');

    assert.ok(evidence !== undefined);
    assert.strictEqual(evidence.sourceId, 'IDEALISTA');
    assert.strictEqual(evidence.sourceType, 'portal');
    assert.strictEqual(evidence.httpStatus, 200);
    assert.strictEqual(evidence.contentHash.length, 64);
    assert.strictEqual(evidence.extractedValue, 24.50);
    assert.strictEqual(verifySourceEvidence(evidence), true);
  });

  // T-HOUSE-13
  it('T-HOUSE-13: Anti-Hardcode Enforcement (Rejeição de Não Autenticados e Incoerência Valor-Snippet)', () => {
    const store = HousingEvidenceStore.getInstance();
    // 1. Tentar validar um valor 'fantasma' que não existe no repositório de evidências
    const unauthenticatedCheck = store.validateDataValue('non-existent-observation-id', 15.00);
    assert.strictEqual(unauthenticatedCheck.isValid, false);
    assert.strictEqual(unauthenticatedCheck.dataStatus, 'insufficient');

    // 2. Tentar registar evidência fraudulenta onde extractedValue não consta documentalmente do rawSnippet
    const fraudulentEvidence = processIngestionEvidence({
      sourceId: 'INE',
      sourceType: 'official',
      requestedUrl: 'https://www.ine.pt/destaque',
      httpStatus: 200,
      rawPayload: '{"renda": 17.42}',
      observationId: 'ine-fraud-attempt',
      observationLocator: '$.renda',
      rawSnippet: 'Renda mediana observada no município: 17,42 €/m²',
      extractedValue: 999999, // Incoerência propositada: 999999 não consta do snippet
      referencePeriod: '1.º Trimestre de 2026',
      releaseDate: '2026-06-25',
      datasetOrPage: 'Destaque INE',
      extractionMethod: 'official_dataset',
      recordsActuallyIngested: 1
    });

    // O critério extractionVerified DEVE falhar categoricamente por falta de correspondência valor <-> snippet
    assert.strictEqual(fraudulentEvidence.verificationChecks.extractionVerified, false);
    assert.strictEqual(fraudulentEvidence.verificationStatus, 'not_verified');
    assert.strictEqual(verifySourceEvidence(fraudulentEvidence), false);
  });

  // T-HOUSE-14
  it('T-HOUSE-14: Source Changed & Revalidation', () => {
    const store = initializeCanonicalEvidenceStore();
    assert.strictEqual(store.hasValidEvidence('ine-lisboa-concelho-rent-m2'), true);

    // Simular que a evidência foi invalidada (ex: fonte alterada ou hash corrompido)
    store.invalidate('ine-lisboa-concelho-rent-m2');
    assert.strictEqual(store.hasValidEvidence('ine-lisboa-concelho-rent-m2'), false);

    // Motor passa a rejeitar a observação
    const check = store.validateDataValue('ine-lisboa-concelho-rent-m2', 17.42);
    assert.strictEqual(check.isValid, false);
    assert.strictEqual(check.dataStatus, 'insufficient');

    // Restaurar para os próximos testes
    initializeCanonicalEvidenceStore();
  });

  // T-HOUSE-15
  it('T-HOUSE-15: Fetch Failure Graceful Degradation (HTTP 403/500 Failure Handling)', () => {
    // Modelar explicitamente uma falha de rede real: HTTP 403 Forbidden (Cloudflare Bot-Shield)
    const failedEvidence = processIngestionEvidence({
      sourceId: 'IDEALISTA',
      sourceType: 'portal',
      requestedUrl: 'https://www.idealista.pt/media/relatorios-preco-habitacao/arrendamento/lisboa/',
      httpStatus: 403, // HTTP 403 Forbidden real
      rawPayload: '<html><head><title>403 Forbidden</title></head><body>Cloudflare Challenge Triggered</body></html>',
      observationId: 'idealista-blocked-obs',
      observationLocator: 'Cloudflare_Challenge_Blocked',
      rawSnippet: 'HTTP 403 Forbidden: Cloudflare challenge triggered',
      extractedValue: 0, // Falha na extração por ausência de dados válidos
      referencePeriod: '',
      releaseDate: '',
      datasetOrPage: 'Relatório de Preços Lisboa',
      extractionMethod: 'web_page',
      recordsActuallyIngested: 0
    });

    // 1. Prova que httpStatus 403 faz falhar o critério 1 (httpStatusOk)
    assert.strictEqual(failedEvidence.httpStatus, 403);
    assert.strictEqual(failedEvidence.verificationChecks.httpStatusOk, false);

    // 2. Prova que a evidência é rejeitada (not_verified)
    assert.strictEqual(verifySourceEvidence(failedEvidence), false);
    assert.strictEqual(failedEvidence.verificationStatus, 'not_verified');

    // 3. Prova que o repositório emite compulsoriamente 'insufficient'
    const store = HousingEvidenceStore.getInstance();
    store.registerEvidence(failedEvidence);
    const check = store.validateDataValue('idealista-blocked-obs', 24.50);
    assert.strictEqual(check.isValid, false);
    assert.strictEqual(check.dataStatus, 'insufficient');
  });

});
