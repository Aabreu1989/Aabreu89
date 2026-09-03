// ============================================================================
// BATERIA FORENSE UNITÁRIA — MOTOR MONETÁRIO E TEMPORAL (PORTÃO 3: UNIDADE 1)
// Testes Canónicos Homologados das Fases 1 e 2
// ============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

import {
  IAS_2026_CENTS,
  RMMG_2026_CENTS,
  SS_MONTHLY_CEILING_12_IAS_CENTS,
  SS_MIN_ORGANIZED_BASE_2026_CENTS,
  SS_TI_LIMIT_4_IAS_2026_CENTS,
  SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS,
  WITHHOLDING_OBJECTIVE_THRESHOLD_CENTS,
  ANNUAL_DISPENSE_LIMIT_CENTS,
  RATE_WITHHOLDING_LIBERAL_PROFESSION_BPS,
  RATE_SS_INDEPENDENT_WORKER_BPS,
  RATE_SS_ENI_BPS,
  applyRateBps,
  formatCentsToEurosCurrency,
  applyWithholdingThresholdRule,
  calculate12MonthsCivilDeadline,
  isCivilDateOnOrBefore,
  addCivilMonths,
  evaluateEnrolmentTimeline,
  evaluateSocialSecurityTemporalStatus,
} from '../miraMonetaryEngine';
import type { ActivityDatedEvent } from '../miraMonetaryEngine';

describe('P03-U01: Motor Monetário Inteiro Puro (Fase 2)', () => {
  test('T-MON-CONST: Constantes canónicas oficiais de 2026', () => {
    assert.equal(IAS_2026_CENTS, 53713, 'IAS 2026 deve ser 53.713 cêntimos (€537,13)');
    assert.equal(RMMG_2026_CENTS, 92000, 'RMMG 2026 deve ser 92.000 cêntimos (€920,00)');
    assert.equal(SS_MINIMUM_CONTRIBUTION_FLOOR_CENTS, 2000, 'Piso SS deve ser 2.000 cêntimos (€20,00)');
    assert.equal(SS_MONTHLY_CEILING_12_IAS_CENTS, 644556, 'Teto 12 IAS deve ser 644.556 cêntimos (€6.445,56)');
    assert.equal(SS_MIN_ORGANIZED_BASE_2026_CENTS, 80570, 'Base contab. org. 1,5 IAS deve ser 80.570 cêntimos');
    assert.equal(SS_TI_LIMIT_4_IAS_2026_CENTS, 214852, 'Limiar TCO 4 IAS deve ser 214.852 cêntimos');
    assert.equal(WITHHOLDING_OBJECTIVE_THRESHOLD_CENTS, 2500, 'Limiar dispensa retenção deve ser 2.500 cêntimos (€25,00)');
    assert.equal(ANNUAL_DISPENSE_LIMIT_CENTS, 1500000, 'Limite anual Art. 101-B deve ser 1.500.000 cêntimos (€15.000)');
  });

  test('T-MON-01: Retenção Liberal 23% sobre €1.000,00', () => {
    const grossCents = 100000; // 1.000,00 €
    const result = applyRateBps(grossCents, RATE_WITHHOLDING_LIBERAL_PROFESSION_BPS);
    assert.equal(result, 23000, 'Retenção de 23% sobre 1000€ deve ser 23.000 cêntimos (€230,00)');
  });

  test('T-MON-02A: Retenção sobre €108,65 a 23% e limiar de dispensa < 25,00 €', () => {
    const grossCents = 10865; // 108,65 €
    const calculatedTax = applyRateBps(grossCents, 2300);
    assert.equal(calculatedTax, 2499, 'Cálculo aritmético puro deve ser 2.499 cêntimos (€24,99)');
    
    const evaluation = applyWithholdingThresholdRule(calculatedTax);
    assert.equal(evaluation.isDispensedByThreshold, true, 'Deve ser dispensado por ser < 25,00 €');
    assert.equal(evaluation.finalWithholdingCents, 0, 'Retenção final após dispensa deve ser 0 cêntimos');
  });

  test('T-MON-02B: Retenção sobre €108,70 a 23% atinge limiar de 25,00 €', () => {
    const grossCents = 10870; // 108,70 €
    const calculatedTax = applyRateBps(grossCents, 2300);
    assert.equal(calculatedTax, 2500, 'Cálculo aritmético puro deve ser 2.500 cêntimos (€25,00)');
    
    const evaluation = applyWithholdingThresholdRule(calculatedTax);
    assert.equal(evaluation.isDispensedByThreshold, false, 'Não deve ser dispensado pois é exatamente 25,00 €');
    assert.equal(evaluation.finalWithholdingCents, 2500, 'Retenção final deve ser 2.500 cêntimos');
  });

  test('T-MON-02C: Retenção sobre €108,74 a 23% excede limiar de 25,00 €', () => {
    const grossCents = 10874; // 108,74 €
    const calculatedTax = applyRateBps(grossCents, 2300);
    assert.equal(calculatedTax, 2501, 'Cálculo aritmético puro deve ser 2.501 cêntimos (€25,01)');
    
    const evaluation = applyWithholdingThresholdRule(calculatedTax);
    assert.equal(evaluation.isDispensedByThreshold, false, 'Não deve ser dispensado');
    assert.equal(evaluation.finalWithholdingCents, 2501, 'Retenção final deve ser 2.501 cêntimos');
  });

  test('T-MON-03: Taxa SS Trabalhador Independente 21,4% sobre €1.234,56', () => {
    const baseCents = 123456; // 1.234,56 €
    const ss = applyRateBps(baseCents, RATE_SS_INDEPENDENT_WORKER_BPS);
    assert.equal(ss, 26420, '21,4% sobre 123.456 c. deve ser 26.420 cêntimos (€264,20)');
  });

  test('T-MON-04: Taxa SS ENI/EIRL 25,2% sobre €1.234,56', () => {
    const baseCents = 123456; // 1.234,56 €
    const ss = applyRateBps(baseCents, RATE_SS_ENI_BPS);
    assert.equal(ss, 31111, '25,2% sobre 123.456 c. deve ser 31.111 cêntimos (€311,11)');
  });

  test('T-MON-10: Taxa SS 21,4% sobre €6.444,63', () => {
    const baseCents = 644463; // 6.444,63 €
    const ss = applyRateBps(baseCents, 2140);
    assert.equal(ss, 137915, '21,4% sobre 644.463 c. deve ser rigorosamente 137.915 cêntimos (€1.379,15)');
  });

  test('T-MON-11: Formatação monetária pt-PT segura', () => {
    assert.equal(formatCentsToEurosCurrency(14980), '149,80 €');
    assert.equal(formatCentsToEurosCurrency(2000), '20,00 €');
    assert.equal(formatCentsToEurosCurrency(599196), '5.991,96 €');
    assert.equal(formatCentsToEurosCurrency(-293985), '-2.939,85 €');
    assert.equal(formatCentsToEurosCurrency(0), '0,00 €');
  });
});

describe('P03-U01: Motor Temporal da Segurança Social (Fase 1)', () => {
  test('T-TEMP-01: Primeiro Enquadramento normal (Artigo 145.º, n.º 1)', () => {
    const events: ActivityDatedEvent[] = [
      { eventType: 'ACTIVITY_START', date: { year: 2026, month: 1, day: 15 } }
    ];
    
    // Avaliação a 15/06/2026: dentro dos 12 meses
    const assessMidYear = evaluateEnrolmentTimeline(events, { year: 2026, month: 6, day: 15 });
    assert.equal(assessMidYear.isExemptUnderInitial12Months, true);
    assert.equal(assessMidYear.juridicalStatus, 'FIRST_ENROLMENT_PENDING');
    assert.deepEqual(assessMidYear.enrolmentEffectiveDate, { year: 2027, month: 1, day: 1 });
    assert.equal(assessMidYear.legalBasis, 'ART_145_1_NORMAL_FIRST_ENROLMENT');

    // Avaliação a 01/01/2027: termo da isenção atingido
    const assessAfter = evaluateEnrolmentTimeline(events, { year: 2027, month: 1, day: 1 });
    assert.equal(assessAfter.isExemptUnderInitial12Months, false);
    assert.equal(assessAfter.juridicalStatus, 'FIRST_ENROLMENT_PRODUCED');
  });

  test('T-TEMP-02: Antecipação de enquadramento requerida (Artigo 146.º)', () => {
    const events: ActivityDatedEvent[] = [
      { eventType: 'ACTIVITY_START', date: { year: 2026, month: 1, day: 15 } },
      { eventType: 'EARLY_ENROLMENT_REQUEST', date: { year: 2026, month: 3, day: 10 } }
    ];
    
    const assess = evaluateEnrolmentTimeline(events, { year: 2026, month: 3, day: 15 });
    // Efeitos produzem-se no 1.º dia do mês seguinte ao requerimento: 01/04/2026
    assert.deepEqual(assess.enrolmentEffectiveDate, { year: 2026, month: 4, day: 1 });
    assert.equal(assess.legalBasis, 'ART_146_EARLY_REQUEST');
  });

  test('T-TEMP-03: Suspensão por cessação e retoma tempestiva (Artigo 145.º, n.º 4)', () => {
    const events: ActivityDatedEvent[] = [
      { eventType: 'ACTIVITY_START', date: { year: 2025, month: 1, day: 1 } },
      { eventType: 'ACTIVITY_CESSATION', date: { year: 2025, month: 5, day: 1 } }, // 4 meses consumidos
      { eventType: 'ACTIVITY_RESTART', date: { year: 2025, month: 10, day: 15 } } // Reinício < 12 meses
    ];

    const assess = evaluateEnrolmentTimeline(events, { year: 2025, month: 11, day: 1 });
    // Restavam 8 meses: Outubro + 8 meses = Junho de 2026
    assert.deepEqual(assess.enrolmentEffectiveDate, { year: 2026, month: 6, day: 1 });
    assert.equal(assess.legalBasis, 'ART_145_4_SUSPENSION_RESUMED');
    assert.equal(assess.isExemptUnderInitial12Months, true);
  });

  test('T-TEMP-04: Cessação e reinício intempestivo após 12 meses (Artigo 145.º, n.º 3)', () => {
    const events: ActivityDatedEvent[] = [
      { eventType: 'ACTIVITY_START', date: { year: 2024, month: 1, day: 1 } },
      { eventType: 'ACTIVITY_CESSATION', date: { year: 2025, month: 8, day: 31 } }, // Cessação a 31/08/2025
      { eventType: 'ACTIVITY_RESTART', date: { year: 2026, month: 9, day: 1 } }   // Reinício a 01/09/2026 (> 12 meses sob Art. 279.º CC)
    ];

    const assess = evaluateEnrolmentTimeline(events, { year: 2026, month: 9, day: 1 });
    assert.equal(assess.isExemptUnderInitial12Months, false);
    assert.equal(assess.juridicalStatus, 'RESTART_AFTER_PRODUCED_ENROLMENT');
    assert.deepEqual(assess.enrolmentEffectiveDate, { year: 2026, month: 9, day: 1 });
    assert.equal(assess.legalBasis, 'ART_145_3_RESTART_AFTER_CESSATION_EXPIRY');
  });

  test('T-TEMP-SIMPLIFIED: Avaliação rápida para o orquestrador global', () => {
    const evalStatus = evaluateSocialSecurityTemporalStatus('2026-01-15', true);
    assert.equal(evalStatus.effectiveCoverageDateIso, '2027-01-01');
    assert.equal(evalStatus.isFirstRegistrationEver, true);
    
    // Todos os meses de 2026 devem estar isentos
    for (let m = 1; m <= 12; m++) {
      assert.equal(evalStatus.isMonthExemptFromContributions(2026, m), true);
    }
    // Mês de janeiro de 2027 já não está isento
    assert.equal(evalStatus.isMonthExemptFromContributions(2027, 1), false);
  });
});
