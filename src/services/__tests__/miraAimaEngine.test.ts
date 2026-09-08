// src/services/__tests__/miraAimaEngine.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MiraAimaEngine,
  AimaMeansOfSubsistenceEngine,
  AimaSocialSecurityEngine,
  AimaFeeEngine,
  AimaDeadlineEngine,
  AimaLegacyManifestationEngine,
  AimaDocumentEngine,
  NORMATIVE_AIMA_2026
} from '../miraAimaEngine';

describe('🏛️ MIRA AIMA LEGAL COMPLIANCE ENGINE 2026 (AUDITORIA FORENSE E BATERIA CANÓNICA)', () => {

  // ─── T-AIMA-01: Portaria 1563/2007 e Territorialidade da RMMG 2026 ───────────
  it('T-AIMA-01: Portaria 1563/2007 — 1 Adulto isolado e Territorialidade da RMMG 2026', () => {
    // 1. Continente: 920,00 €
    const resMainland = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 920.00,
      pathwayId: 'work_d1'
    });
    assert.equal(resMainland.rmmgReferenceEur, 920.00);
    assert.equal(resMainland.requiredNetMonthlyEur, 920.00);
    assert.equal(resMainland.requiredNetAnnualEur, 11040.00);
    assert.equal(resMainland.isCompliant, true);
    assert.equal(resMainland.shortfallMonthlyEur, 0);
    assert.equal(resMainland.provenance.article, 'Artigo 2.º, n.º 1 e 2');
    assert.equal(resMainland.provenance.legalBasis, 'Portaria n.º 1563/2007');

    // 2. Região Autónoma dos Açores: 966,00 € (acréscimo regional de 5%)
    const resAzores = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'azores',
      availableNetMonthlyEur: 966.00,
      pathwayId: 'work_d1'
    });
    assert.equal(resAzores.rmmgReferenceEur, 966.00);
    assert.equal(resAzores.requiredNetMonthlyEur, 966.00);
    assert.equal(resAzores.requiredNetAnnualEur, 11592.00);
    assert.equal(resAzores.isCompliant, true);

    // 3. Região Autónoma da Madeira: 980,00 € (diploma regional próprio ALRAM)
    const resMadeira = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'madeira',
      availableNetMonthlyEur: 980.00,
      pathwayId: 'work_d1'
    });
    assert.equal(resMadeira.rmmgReferenceEur, 980.00);
    assert.equal(resMadeira.requiredNetMonthlyEur, 980.00);
    assert.equal(resMadeira.requiredNetAnnualEur, 11760.00);
    assert.equal(resMadeira.isCompliant, true);
  });

  // ─── T-AIMA-02: Portaria 1563/2007 — Casal + 1 Menor no Continente ───────────
  it('T-AIMA-02: Portaria 1563/2007 — Casal + 1 Menor no Continente (100% + 50% + 30%)', () => {
    // Escala: 920 + 460 + 276 = 1.656,00 €/mês
    const household = { applicant: true as const, otherAdultsCount: 1, minorsCount: 1 };

    // Caso A: Rendimento de €1.700,00 (Suficiente)
    const resSufficient = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household,
      territory: 'mainland',
      availableNetMonthlyEur: 1700.00,
      pathwayId: 'work_d1'
    });
    assert.equal(resSufficient.requiredNetMonthlyEur, 1656.00);
    assert.equal(resSufficient.householdBreakdown.applicantNetMonthlyEur, 920.00);
    assert.equal(resSufficient.householdBreakdown.otherAdultsNetMonthlyEur, 460.00);
    assert.equal(resSufficient.householdBreakdown.minorsNetMonthlyEur, 276.00);
    assert.equal(resSufficient.isCompliant, true);
    assert.equal(resSufficient.surplusMonthlyEur, 44.00);
    assert.equal(resSufficient.shortfallMonthlyEur, 0);

    // Caso B: Rendimento de €1.500,00 (Insuficiente — Défice de 156 €)
    const resDeficient = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household,
      territory: 'mainland',
      availableNetMonthlyEur: 1500.00,
      pathwayId: 'work_d1'
    });
    assert.equal(resDeficient.isCompliant, false);
    assert.equal(resDeficient.shortfallMonthlyEur, 156.00);
    assert.equal(resDeficient.surplusMonthlyEur, 0);
  });

  // ─── T-AIMA-03: Taxa SS TCO Condicionada (Arts. 53.º e 44.º CRCSPSS) ──────────
  it('T-AIMA-03: Segurança Social TCO — 11,0% sobre Remuneração Ilíquida (Artigos 53.º e 44.º CRCSPSS)', () => {
    // 1. Trabalhador por Conta de Outrem (TCO Geral) com remuneração ilíquida de 1.500 €
    const resTco = AimaSocialSecurityEngine.evaluateSocialSecurity({
      employmentRegime: 'tco_general',
      pathwayId: 'work_d1',
      grossIncomeEur: 1500.00
    });

    assert.equal(resTco.isTcoSecurityContributionApplicable, true);
    assert.equal(resTco.workerRateApplied, 0.11);
    assert.equal(resTco.employerRateApplied, 0.2375);
    assert.equal(resTco.taxBaseType, 'remuneracao_iliquida');
    assert.equal(resTco.calculatedDeductionEur, 165.00); // 1500 * 0.11 = 165.00 €
    assert.equal(resTco.status, 'compliant');
    assert.equal(resTco.provenance.article, 'Artigo 53.º e Artigo 44.º');
    assert.equal(resTco.provenance.legalBasis, 'Lei n.º 110/2009 (CRCSPSS)');

    // 2. Rendimento Passivo (D7): não sujeito a retenção contributiva laboral
    const resPassive = AimaSocialSecurityEngine.evaluateSocialSecurity({
      employmentRegime: 'passive_income',
      pathwayId: 'passive_income_d7'
    });
    assert.equal(resPassive.isTcoSecurityContributionApplicable, false);
    assert.equal(resPassive.status, 'not_applicable');
  });

  // ─── T-AIMA-04: Digital Nomad D8 (Artigo 90.º-A da Lei 23/2007) ────────────────
  it('T-AIMA-04: Digital Nomad D8 — 4 × RMMG de Rendimento Médio Mensal (3.680,00 €)', () => {
    const resD8 = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 3800.00,
      pathwayId: 'digital_nomad_d8'
    });

    // 4 × 920 = 3.680,00 €
    assert.equal(resD8.requiredNetMonthlyEur, 3680.00);
    assert.equal(resD8.requiredNetAnnualEur, 44160.00);
    assert.equal(resD8.isCompliant, true);
    assert.equal(resD8.provenance.article, 'Artigo 90.º-A');
    assert.equal(resD8.provenance.legalBasis, 'Lei n.º 23/2007');

    // Teste com rendimento inferior (ex: 3.500 € -> Insuficiente)
    const resD8Fail = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 3500.00,
      pathwayId: 'digital_nomad_d8'
    });
    assert.equal(resD8Fail.isCompliant, false);
    assert.equal(resD8Fail.shortfallMonthlyEur, 180.00);
  });

  // ─── T-AIMA-05: Procura de Trabalho (Artigo 57.º-A da Lei 23/2007) ─────────────
  it('T-AIMA-05: Procura de Trabalho — Reserva de Capital de 3 × RMMG (2.760,00 €) com Prova Flexível', () => {
    // 1. Prova via Depósito Bancário / Recursos Próprios de 2.760 €
    const resOwnFunds = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 0, // Não aufere salário mensal ativo ainda
      pathwayId: 'job_search',
      jobSearchProof: {
        proofType: 'bank_deposit',
        availableCapitalEur: 2760.00
      }
    });
    assert.equal(resOwnFunds.capitalReserveRequiredEur, 2760.00);
    assert.equal(resOwnFunds.jobSearchDetail?.isReserveCompliant, true);
    assert.equal(resOwnFunds.isCompliant, true);
    assert.equal(resOwnFunds.provenance.article, 'Artigo 57.º-A');

    // 2. Prova via Termo de Responsabilidade Válido de Cidadão Residente (sem exigência exclusiva de conta bancária)
    const resRespTerm = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 0,
      pathwayId: 'job_search',
      jobSearchProof: {
        proofType: 'responsibility_term_resident',
        availableCapitalEur: 0,
        hasValidResponsibilityTerm: true
      }
    });
    assert.equal(resRespTerm.jobSearchDetail?.isReserveCompliant, true);
    assert.equal(resRespTerm.isCompliant, true);

    // 3. Caso insuficiente: saldo de 1.500 € sem termo de responsabilidade
    const resFail = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 0,
      pathwayId: 'job_search',
      jobSearchProof: {
        proofType: 'own_financial_resources',
        availableCapitalEur: 1500.00,
        hasValidResponsibilityTerm: false
      }
    });
    assert.equal(resFail.jobSearchDetail?.isReserveCompliant, false);
    assert.equal(resFail.isCompliant, false);
  });

  // ─── T-AIMA-06: Visto D7 — Portaria 1563/2007 Art. 2.º n.º 2 e Art. 5.º n.º 6 ─
  it('T-AIMA-06: Visto D7 — Rendimentos Passivos Líquidos, 12 Meses e Disponibilidade em Portugal', () => {
    // Agregado: Titular (€920) + Cônjuge (€460) = €1.380 líquidos/mês (16.560 €/ano)
    const resD7 = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 1, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 1500.00,
      pathwayId: 'passive_income_d7',
      d7Detail: {
        incomeNature: 'pension_retirement',
        proofOfAvailability: true,
        availableInPortugal: true,
        availableNetMonthlyEur: 1500.00
      }
    });

    assert.equal(resD7.requiredNetMonthlyEur, 1380.00);
    assert.equal(resD7.requiredNetAnnualEur, 16560.00);
    assert.equal(resD7.d7Detail?.isNatureCompliant, true);
    assert.equal(resD7.d7Detail?.isAvailabilityInPortugalConfirmed, true);
    assert.equal(resD7.isCompliant, true);
    // Verificação estrita da proveniência oficial: Art. 5.º, n.º 6 (e não Art. 9.º)
    assert.equal(resD7.provenance.article, 'Artigo 2.º, n.º 2 e Artigo 5.º, n.º 6');
    assert.equal(resD7.provenance.legalBasis, 'Portaria n.º 1563/2007');

    // Teste de reprovação caso os fundos NÃO estejam disponíveis em Portugal
    const resD7NoPt = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: { applicant: true, otherAdultsCount: 1, minorsCount: 0 },
      territory: 'mainland',
      availableNetMonthlyEur: 1500.00,
      pathwayId: 'passive_income_d7',
      d7Detail: {
        incomeNature: 'pension_retirement',
        proofOfAvailability: true,
        availableInPortugal: false,
        availableNetMonthlyEur: 1500.00
      }
    });
    assert.equal(resD7NoPt.isCompliant, false);
  });

  // ─── T-AIMA-07: Artigo 122.º da Lei 23/2007 Plenamente em Vigor ───────────────
  it('T-AIMA-07: Artigo 122.º — Pathway Ativo e Legítimo (Sem Indicação de Revogação)', () => {
    const docs = AimaDocumentEngine.getRequiredDocuments('art122_special');
    assert.ok(docs.length > 0);
    
    const art122Doc = docs.find(d => d.code === 'doc_art122_grounds');
    assert.ok(art122Doc);
    assert.equal(art122Doc?.provenance.article, 'Artigo 122.º');
    assert.equal(art122Doc?.provenance.legalBasis, 'Lei n.º 23/2007');

    // No orquestrador, art122_special é avaliado com sucesso
    const evaluation = MiraAimaEngine.evaluateCompliance({
      pathwayId: 'art122_special',
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      availableNetMonthlyEur: 1000.00
    });
    assert.equal(evaluation.complianceStatus, 'compliant');
    assert.equal(evaluation.legalWarnings.some(w => w.includes('revogado')), false);
  });

  // ─── T-AIMA-08: Entrada Turística Irregular Rejeitada ─────────────────────────
  it('T-AIMA-08: Entrada Turística Irregular — Rejeição de Evasão e Ausência de Hacks de Hotel', () => {
    // Documentos da rota de trabalho D1
    const docsD1 = AimaDocumentEngine.getRequiredDocuments('work_d1');
    const hasHotelHack = docsD1.some(d => d.description.includes('hotel') || d.officialGuidance.includes('3 noites'));
    assert.equal(hasHotelHack, false, 'Não pode conter conselhos de pernoita em hotel para legalização!');

    // Orquestrador alerta expressamente a revogação das manifestações de interesse
    const res = MiraAimaEngine.evaluateCompliance({
      pathwayId: 'work_d1',
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      availableNetMonthlyEur: 920.00
    });
    assert.ok(res.legalWarnings.some(w => w.includes('revogou as manifestações de interesse')));
  });

  // ─── T-AIMA-09: Regime Transitório SAPA (Estrutura de Missão) ─────────────────
  it('T-AIMA-09: Regime Transitório SAPA — Verificação de Data de Corte (03/06/2024)', () => {
    // 1. Processo submetido antes de 03/06/2024 (ex: 15/05/2024) -> Elegível
    const legacyOk = AimaLegacyManifestationEngine.evaluateLegacyEligibility('2024-05-15');
    assert.equal(legacyOk.isLegacyEligible, true);
    assert.equal(legacyOk.status, 'covered_by_mission_structure');
    assert.equal(legacyOk.provenance.article, 'Artigo 2.º (DL 37-A/2024)');

    // 2. Processo com data posterior a 03/06/2024 (ex: 10/06/2024) -> Rejeitado
    const legacyFail = AimaLegacyManifestationEngine.evaluateLegacyEligibility('2024-06-10');
    assert.equal(legacyFail.isLegacyEligible, false);
    assert.equal(legacyFail.status, 'revoked_by_dl_37a_2024');
  });

  // ─── T-AIMA-10: Acordo de Mobilidade CPLP (Artigo 87.º-A) ─────────────────────
  it('T-AIMA-10: Acordo de Mobilidade CPLP — Tramitação do Artigo 87.º-A e Taxa Reduzida', () => {
    const resCplp = MiraAimaEngine.evaluateCompliance({
      pathwayId: 'cplp_mobility',
      household: { applicant: true, otherAdultsCount: 0, minorsCount: 0 },
      availableNetMonthlyEur: 920.00,
      submissionChannel: 'online'
    });

    assert.equal(resCplp.pathwayId, 'cplp_mobility');
    assert.equal(resCplp.fees.status, 'official_calculated');
    assert.equal(resCplp.fees.baseFeeEur, 15.00); // Taxa CPLP inicial
    assert.ok(resCplp.requiredDocuments.some(d => d.code === 'doc_cplp_agreement'));
  });

  // ─── T-AIMA-11: Taxas AIMA e Matriz de Reduções por Canal ─────────────────────
  it('T-AIMA-11: Taxas AIMA — Matriz Canónica de Reduções por Canal e Regra Transitória', () => {
    // 1. Procedimento digital elegível submetido online -> -25%
    const feeOnline = AimaFeeEngine.calculateFee({
      procedureCode: 'residence_grant_visa',
      channel: 'online'
    });
    assert.equal(feeOnline.baseFeeEur, 180.10);
    assert.equal(feeOnline.reductionPercentageApplied, 25);
    assert.equal(feeOnline.reductionRule, 'online_25');
    assert.equal(feeOnline.estimatedFeeEur, 135.08); // 180.10 * 0.75 = 135.075 -> 135.08 €

    // 2. Procedimento digital elegível com atendimento digital assistido -> -10%
    const feeAssisted = AimaFeeEngine.calculateFee({
      procedureCode: 'residence_grant_visa',
      channel: 'digital_assisted'
    });
    assert.equal(feeAssisted.reductionPercentageApplied, 10);
    assert.equal(feeAssisted.reductionRule, 'digital_assisted_10');
    assert.equal(feeAssisted.estimatedFeeEur, 162.09); // 180.10 * 0.90 = 162.09 €

    // 3. Procedimento digital disponível submetido presencialmente -> 0% (taxa plena)
    const feeInPersonFull = AimaFeeEngine.calculateFee({
      procedureCode: 'residence_grant_visa',
      channel: 'in_person'
    });
    assert.equal(feeInPersonFull.reductionPercentageApplied, 0);
    assert.equal(feeInPersonFull.reductionRule, 'in_person_full');
    assert.equal(feeInPersonFull.estimatedFeeEur, 180.10);

    // 4. Procedimento SEM canal digital submetido presencialmente sob regra transitória -> -25%
    const feeTransitional = AimaFeeEngine.calculateFee({
      procedureCode: 'residence_grant_art122',
      channel: 'in_person'
    });
    assert.equal(feeTransitional.isDigitalChannelEligible, false);
    assert.equal(feeTransitional.reductionPercentageApplied, 25);
    assert.equal(feeTransitional.reductionRule, 'in_person_transitional_25');
    assert.equal(feeTransitional.estimatedFeeEur, 180.00); // 240.00 * 0.75 = 180.00 €

    // 5. Procedimento desconhecido -> insufficient_official_source
    const feeUnknown = AimaFeeEngine.calculateFee({
      procedureCode: 'procedimento_inexistente',
      channel: 'online'
    });
    assert.equal(feeUnknown.status, 'insufficient_official_source');
    assert.equal(feeUnknown.estimatedFeeEur, null);
  });

  // ─── T-AIMA-12: Proteção Anti-Invenção de Taxas ────────────────────────────────
  it('T-AIMA-12: Taxas AIMA — Retorno Estrito de insufficient_official_source sem Publicação Oficial', () => {
    const fee = AimaFeeEngine.calculateFee({
      procedureCode: 'visa_d3_unverified',
      channel: 'online'
    });
    assert.equal(fee.status, 'insufficient_official_source');
    assert.equal(fee.estimatedFeeEur, null);
    assert.equal(fee.reductionRule, 'insufficient_official_source');
  });

  // ─── T-AIMA-13: Renovação de AR e Deferimento Tácito (Art. 82.º, n.º 6 e 7) ───
  it('T-AIMA-13: Prazos de Renovação — 60 Dias (Art. 82.º, n.º 6) e Deferimento Tácito (Art. 82.º, n.º 7)', () => {
    // 1. Processo de renovação com 45 dias decorridos (Dentro do prazo legal)
    const dWithin = AimaDeadlineEngine.evaluateDeadline({
      procedureType: 'residence_renewal',
      daysElapsed: 45
    });
    assert.equal(dWithin.legalDeadlineDays, 60);
    assert.equal(dWithin.isExpired, false);
    assert.equal(dWithin.tacitApprovalApplicable, false);
    assert.equal(dWithin.status, 'within_legal_deadline');

    // 2. Processo de renovação com 65 dias decorridos sem culpa do requerente (Deferimento Tácito Concedido)
    const dTacit = AimaDeadlineEngine.evaluateDeadline({
      procedureType: 'residence_renewal',
      daysElapsed: 65,
      faultAttributableToApplicant: false
    });
    assert.equal(dTacit.isExpired, true);
    assert.equal(dTacit.tacitApprovalApplicable, true);
    assert.equal(dTacit.status, 'tacit_approval_granted');
    assert.equal(dTacit.provenance.article, 'Artigo 82.º, n.º 6 e n.º 7');
    assert.equal(dTacit.provenance.legalBasis, 'Lei n.º 23/2007');
  });

  // ─── T-AIMA-14: Concessão de AR com Visto (Artigo 82.º, n.º 5) ────────────────
  it('T-AIMA-14: Prazos de Concessão de AR com Visto — 90 Dias (Artigo 82.º, n.º 5)', () => {
    const dGrant = AimaDeadlineEngine.evaluateDeadline({
      procedureType: 'residence_grant_visa',
      daysElapsed: 70
    });
    assert.equal(dGrant.legalDeadlineDays, 90);
    assert.equal(dGrant.deadlineUnit, 'calendar_days');
    assert.equal(dGrant.isExpired, false);
    assert.equal(dGrant.tacitApprovalApplicable, false);
    assert.equal(dGrant.status, 'within_legal_deadline');
    assert.equal(dGrant.provenance.article, 'Artigo 82.º, n.º 5');
  });

  // ─── T-AIMA-15: Mora na Concessão e Tutela Jurisdicional no TAC ───────────────
  it('T-AIMA-15: Mora na Concessão (>90d) — Sem Deferimento Tácito, Tutela CPTA e Audiência Prévia CPA', () => {
    // 1. Concessão com 105 dias decorridos sem decisão
    const dExpired = AimaDeadlineEngine.evaluateDeadline({
      procedureType: 'residence_grant_visa',
      daysElapsed: 105
    });
    assert.equal(dExpired.isExpired, true);
    assert.equal(dExpired.tacitApprovalApplicable, false); // NUNCA deferimento tácito na concessão
    assert.equal(dExpired.status, 'administrative_delay');
    assert.ok(dExpired.potentialLegalRecourse);
    assert.equal(dExpired.potentialLegalRecourse?.primaryRecourse, 'cpta_intimacao_ato_devido');
    assert.equal(dExpired.potentialLegalRecourse?.urgentSubsidiaryRecourse, 'cpta_direitos_liberdades');

    // 2. Audiência Prévia CPA (Artigo 122.º, n.º 1) — Prazo mínimo de 10 dias
    const dHearing = AimaDeadlineEngine.evaluateDeadline({
      procedureType: 'prior_hearing',
      daysElapsed: 8
    });
    assert.equal(dHearing.minimumLegalDays, 10);
    assert.equal(dHearing.deadlineUnit, 'days_minimum');
    assert.equal(dHearing.legalDeadlineDays, null); // Não é prazo fechado universal
    assert.equal(dHearing.isExpired, false);
    assert.equal(dHearing.provenance.article, 'Artigo 122.º, n.º 1');
  });

  // ─── T-AIMA-16: Prova de Coerência Causal Invariante (Regra ➔ Parâmetro ➔ Artigo ➔ Resultado)
  it('T-AIMA-16: Auditoria Substantiva de Proveniência e Invariância Causal Estrita', () => {
    // Executa a avaliação completa pelo orquestrador soberano
    const res = MiraAimaEngine.evaluateCompliance({
      pathwayId: 'work_d1',
      territory: 'mainland',
      household: { applicant: true, otherAdultsCount: 1, minorsCount: 1 },
      employmentRegime: 'tco_general',
      availableNetMonthlyEur: 1800.00,
      grossIncomeEur: 2000.00,
      procedureType: 'residence_grant_visa',
      daysElapsed: 95
    });

    // 1. Invariância Causal da Segurança Social (Artigo 53.º e Artigo 44.º do CRCSPSS)
    assert.equal(res.socialSecurityCheck.isTcoSecurityContributionApplicable, true);
    assert.equal(res.socialSecurityCheck.workerRateApplied, 0.11);
    assert.equal(res.socialSecurityCheck.taxBaseType, 'remuneracao_iliquida');
    // Teste de cálculo causal: 2.000,00 * 0.11 = 220,00 €
    assert.equal(res.socialSecurityCheck.calculatedDeductionEur, 220.00);
    assert.equal(res.socialSecurityCheck.provenance?.article, 'Artigo 53.º e Artigo 44.º');
    assert.equal(res.socialSecurityCheck.provenance?.legalBasis, 'Lei n.º 110/2009 (CRCSPSS)');

    // 2. Invariância Causal dos Meios de Subsistência (Portaria 1563/2007)
    assert.equal(res.subsistence.rmmgReferenceEur, 920.00);
    assert.equal(res.subsistence.requiredNetMonthlyEur, 1656.00); // 920 + 460 + 276
    assert.equal(res.subsistence.provenance.article, 'Artigo 2.º, n.º 1 e 2');

    // 3. Invariância Causal dos Prazos da Lei n.º 23/2007
    assert.equal(res.deadlines?.procedureType, 'residence_grant_visa');
    assert.equal(res.deadlines?.legalDeadlineDays, 90);
    assert.equal(res.deadlines?.tacitApprovalApplicable, false);
    assert.equal(res.deadlines?.status, 'administrative_delay');
    assert.equal(res.deadlines?.provenance.article, 'Artigo 82.º, n.º 5');

    // 4. Invariância Causal dos Documentos Obrigatórios
    assert.ok(res.requiredDocuments.length >= 4);
    for (const doc of res.requiredDocuments) {
      assert.ok(doc.provenance, `Documento ${doc.code} não contém provenance!`);
      assert.ok(doc.provenance.article.length > 0, `Documento ${doc.code} tem artigo vazio!`);
      assert.ok(doc.provenance.legalBasis.length > 0, `Documento ${doc.code} tem legalBasis vazio!`);
    }

    // 5. Cadeia de Proveniência Integral Contida no Resultado
    assert.ok(res.provenanceChain.length >= 6);
  });

});
