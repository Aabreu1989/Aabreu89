import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateMiraRetirement,
  getLegalRetirementAge,
  calculatePersonalRetirementAge,
  determineAnnualAccrualRatePct,
  RETIREMENT_LEGAL_AGES
} from '../miraRetirementEngine';

describe('🏛️ MIRA RETIREMENT ENGINE (DL 187/2007 & Totalização Internacional)', () => {

  describe('T-RET-MANDATORY: Caso de Teste Mandatório Pro Rata (9 anos PT + 30 anos Ext)', () => {
    it('deve calcular rigorosamente pensão teórica de 780,00 € e pensão real PT de 180,00 €/mês', () => {
      const assessment = calculateMiraRetirement({
        ageYears: 67,
        ageMonths: 0,
        yearsContributedPT: 9,
        yearsContributedForeign: 30,
        referenceMonthlyEarnings: 1000.0,
        referenceYear: 2026
      });

      // 1. Totalização unificada
      assert.strictEqual(assessment.totalUnifiedYears, 39, 'Carreira unificada deve ser 39 anos (9 + 30)');
      assert.strictEqual(assessment.isEligible, true, 'Deve ser elegível pois 39 >= 15 anos');
      assert.strictEqual(assessment.isInternationalMixedCareer, true, 'Deve identificar carreira mista internacional');

      // 2. Taxa de formação e pensão teórica global
      assert.strictEqual(assessment.accrualAnnualPct, 2.0, 'Taxa anual linear deve ser 2.0%');
      assert.strictEqual(assessment.theoreticalGlobalAccrualPct, 78.0, 'Taxa teórica global deve ser 78% (39 * 2%)');
      assert.strictEqual(assessment.theoreticalFullMonthlyPension, 780.0, 'Pensão teórica integral deve ser 780,00 € (1000 * 78%)');

      // 3. Pro Rata Temporis rigoroso (N_pt / N_total)
      const expectedRatio = 9 / 39;
      assert.strictEqual(assessment.proRataRatio, expectedRatio, 'Pro rata ratio deve ser 9/39');
      assert.strictEqual(assessment.proRataRatioLabel, '9 / 39 anos');
      assert.strictEqual(assessment.realPortugueseBaseMonthlyPension, 180.0, 'Pensão base PT deve ser exatamente 180,00 €');
      assert.strictEqual(assessment.finalRealPortugueseMonthlyPension, 180.0, 'Pensão final PT deve ser 180,00 €/mês');

      // 4. Sanidade contra os bugs anteriores (€ 41,54 e rotulagem incorreta)
      assert.notStrictEqual(assessment.finalRealPortugueseMonthlyPension, 41.54, 'Não pode resultar no erro de 41,54 €');
      assert.strictEqual(assessment.status, 'eligible_normal');
      assert.strictEqual(assessment.anticipationPenaltyPct, 0, 'Sem corte por idade se idade >= idade legal');
      assert.strictEqual(assessment.sustainabilityFactorCutPct, 0, 'Sem corte de sustentabilidade na idade legal');

      // 5. Travas e Condicionais de Segurança
      assert.strictEqual(assessment.isInstantPensionEligible, false, 'Pensão na Hora deve ser PROIBIDA para carreira internacional');
      assert.strictEqual(assessment.bilateralNoticeRequired, true, 'Instrução bilateral deve ser OBRIGATÓRIA');
      assert.match(assessment.bilateralNoticeText, /Formulário I\/PT 1.*União Europeia.*não sendo elegíveis para atribuição automática em 24h/);
      assert.match(assessment.minimumPensionNoticeText, /não se aplica automaticamente a pensões calculadas por pro rata internacional/);
    });
  });

  describe('T-RET-AGES: Idades Normais de Reforma Oficiais (2024 a 2026)', () => {
    it('deve respeitar a tabela de idades legais do MTSSS', () => {
      const age2024 = getLegalRetirementAge(2024);
      assert.strictEqual(age2024.years, 66);
      assert.strictEqual(age2024.months, 4);
      assert.strictEqual(age2024.label, '66 anos e 4 meses');

      const age2025 = getLegalRetirementAge(2025);
      assert.strictEqual(age2025.years, 66);
      assert.strictEqual(age2025.months, 7);
      assert.strictEqual(age2025.label, '66 anos e 7 meses');

      const age2026 = getLegalRetirementAge(2026);
      assert.strictEqual(age2026.years, 66);
      assert.strictEqual(age2026.months, 9);
      assert.strictEqual(age2026.label, '66 anos e 9 meses');
    });
  });

  describe('T-RET-BONUS: Bonificação de Carreira Longa (Art. 20.º, n.º 3 do DL 187/2007)', () => {
    it('deve recuar 4 meses na idade pessoal por cada ano civil que exceda 40 anos aos 65 anos', () => {
      // 43 anos aos 65 anos -> 3 anos de excesso -> recuo de 12 meses (1 ano)
      const result = calculatePersonalRetirementAge(66 + 9 / 12, 66, 44, 43);
      assert.strictEqual(result.bonusMonths, 12, 'Deve ter 12 meses de bonificação (3 * 4)');
      assert.strictEqual(result.personalAgeDecimal, 65 + 9 / 12, 'Idade pessoal deve recuar para 65 anos e 9 meses');
      assert.strictEqual(result.label, '65 anos e 9 meses');
    });

    it('não pode permitir que a idade pessoal seja reduzida para menos de 65 anos', () => {
      // 46 anos aos 65 anos -> 6 anos de excesso -> 24 meses de recuo -> 66a 9m - 2a = 64a 9m, mas teto é 65 anos
      const result = calculatePersonalRetirementAge(66 + 9 / 12, 67, 46, 46);
      assert.strictEqual(result.bonusMonths, 24);
      assert.strictEqual(result.personalAgeDecimal, 65.0, 'Piso legal mínimo da idade pessoal é 65 anos');
      assert.strictEqual(result.label, '65 anos e 0 meses');
    });
  });

  describe('T-RET-NATIONAL: Carreira 100% Nacional vs. Garantia de Mínimo', () => {
    it('deve atribuir Pensão na Hora e garantia de mínimo para carreira 100% nacional', () => {
      const assessment = calculateMiraRetirement({
        ageYears: 67,
        ageMonths: 0,
        yearsContributedPT: 40,
        yearsContributedForeign: 0,
        referenceMonthlyEarnings: 1500.0,
        referenceYear: 2026
      });

      assert.strictEqual(assessment.isInternationalMixedCareer, false);
      assert.strictEqual(assessment.isInstantPensionEligible, true, 'Pensão na Hora permitida para 100% PT');
      assert.strictEqual(assessment.bilateralNoticeRequired, false);
      assert.strictEqual(assessment.theoreticalGlobalAccrualPct, 80.0, '40 anos * 2% = 80%');
      assert.strictEqual(assessment.finalRealPortugueseMonthlyPension, 1200.0, '1500 * 80% = 1200,00 €');
    });

    it('deve aplicar o piso de pensão mínima nacional se a pensão calculada for inferior ao limite (carreira nacional)', () => {
      const assessment = calculateMiraRetirement({
        ageYears: 67,
        ageMonths: 0,
        yearsContributedPT: 15,
        yearsContributedForeign: 0,
        referenceMonthlyEarnings: 300.0, // Salário baixo
        referenceYear: 2026
      });

      // 15 anos * 2.3% = 34.5% de 300 = 103.50 € -> abaixo do piso de 438.81 €
      assert.strictEqual(assessment.isNationalMinimumApplied, true);
      assert.strictEqual(assessment.finalRealPortugueseMonthlyPension, 438.81);
    });
  });

  describe('T-RET-EARLY: Reforma Antecipada com Cortes Legais', () => {
    it('deve aplicar corte de 0.5%/mês de antecipação e fator de sustentabilidade para reforma antecipada', () => {
      const assessment = calculateMiraRetirement({
        ageYears: 62,
        ageMonths: 0,
        yearsContributedPT: 30,
        yearsContributedForeign: 0,
        referenceMonthlyEarnings: 1000.0,
        referenceYear: 2026
      });

      assert.strictEqual(assessment.status, 'eligible_early');
      // Idade legal 2026: 66a 9m (66.75). Idade: 62.0 -> 4 anos e 9 meses = 57 meses
      assert.strictEqual(assessment.ageDiffMonths, 57);
      assert.strictEqual(assessment.anticipationPenaltyPct, 28.5, '57 meses * 0.5% = 28.5%');
      assert.strictEqual(assessment.sustainabilityFactorCutPct, 15.8, 'Fator de sustentabilidade oficial 2026');
      assert.ok(assessment.finalRealPortugueseMonthlyPension < assessment.realPortugueseBaseMonthlyPension);
    });
  });

  describe('T-RET-GUARANTEE: Prazo de Garantia Unificado de 15 Anos', () => {
    it('deve rejeitar se a soma dos anos for inferior a 15', () => {
      const assessment = calculateMiraRetirement({
        ageYears: 67,
        yearsContributedPT: 8,
        yearsContributedForeign: 6, // Total = 14 < 15
        referenceMonthlyEarnings: 1000.0
      });
      assert.strictEqual(assessment.status, 'not_eligible_years');
      assert.strictEqual(assessment.isEligible, false);
      assert.strictEqual(assessment.finalRealPortugueseMonthlyPension, 0);
    });

    it('deve aprovar se a soma dos anos for exatamente 15', () => {
      const assessment = calculateMiraRetirement({
        ageYears: 67,
        yearsContributedPT: 8,
        yearsContributedForeign: 7, // Total = 15
        referenceMonthlyEarnings: 1000.0
      });
      assert.strictEqual(assessment.status, 'eligible_normal');
      assert.strictEqual(assessment.isEligible, true);
      assert.ok(assessment.finalRealPortugueseMonthlyPension > 0);
    });
  });

});
