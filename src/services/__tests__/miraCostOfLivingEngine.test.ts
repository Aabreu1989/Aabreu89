import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateCostOfLiving,
  calculateDistrictCost,
  calculateFinancialSufficiency,
  calculateLegalSubsistenceReference,
  normalizeDemographics,
  DISTRICT_COST_DATA,
  RMMG_2026,
  OWN_CAR_MONTHLY_BENCHMARK,
  RAIL_PASS_COST_2026,
} from '../miraCostOfLivingEngine';

describe('🏛️ MIRA COST OF LIVING ENGINE (U-COST-01 — ESPECIFICAÇÃO CANÓNICA 2026)', () => {

  it('TESTE 1: Escala Familiar OCDE Modificada aplicada cirurgicamente por rubrica', () => {
    // 1 adulto solteiro em Lisboa (T1, balanced, passe público)
    const singleRes = calculateDistrictCost(
      'Lisboa',
      't1',
      'balanced',
      'public_pass',
      { adultsCount: 1, youth14To17Count: 0, childrenUnder14Count: 0 }
    );

    assert.strictEqual(singleRes.housing, 1150);
    assert.strictEqual(singleRes.food, 230);
    assert.strictEqual(singleRes.utilities, 110);
    assert.strictEqual(singleRes.transport, 40);
    assert.strictEqual(singleRes.telecom, 30);
    assert.strictEqual(singleRes.healthAndPersonal, 35); // 1 adulto × 35€
    assert.strictEqual(singleRes.totalMonthlyCost, 1150 + 230 + 110 + 40 + 30 + 35); // 1595€

    // Família de 2 adultos + 2 crianças < 14 anos (T3, balanced, passe público)
    // Fator OCDE = 1.0 + 0.5*(2-1) + 0.3*2 = 2.1
    const familyRes = calculateDistrictCost(
      'Lisboa',
      't3',
      'balanced',
      'public_pass',
      { adultsCount: 2, youth14To17Count: 0, childrenUnder14Count: 2 }
    );

    // Habitação: Renda nominal de T3, NÃO multiplicada por 2.1!
    assert.strictEqual(familyRes.housing, 1950);
    // Alimentação: 230€ × 2.1 = 483€
    assert.strictEqual(familyRes.food, 483);
    // Utilidades: 110€ × 2.1 = 231€
    assert.strictEqual(familyRes.utilities, 231);
    // Transportes: 2 passes adultos × 40€ = 80€ (crianças têm passe gratuito sub-23)
    assert.strictEqual(familyRes.transport, 80);
    // Telecomunicações: 30€ fixo
    assert.strictEqual(familyRes.telecom, 30);
    // Saúde/Pessoal: 2 adultos × 35€ + 2 crianças × 20€ = 110€
    assert.strictEqual(familyRes.healthAndPersonal, 110);
    // Total mensal
    assert.strictEqual(familyRes.totalMonthlyCost, 1950 + 483 + 231 + 80 + 30 + 110); // 2884€
  });

  it('TESTE 2: Retificação 1 — Segregação etária estrita: OCDE (<14) vs Jurídico (<18)', () => {
    // 1 adulto + 1 jovem de 16 anos (youth14To17Count = 1)
    const demographics = {
      adultsCount: 1,
      youth14To17Count: 1,
      childrenUnder14Count: 0
    };

    const norm = normalizeDemographics(demographics);

    // Na OCDE: jovem de 16 anos conta como 0.5 (adulto adicional >= 14 anos)
    // Fator OCDE = 1.0 + 0.5 = 1.5
    assert.strictEqual(norm.ocdeScaleFactor, 1.5);

    // Na Portaria 1563/2007: jovem < 18 anos conta como menor a 30%
    assert.strictEqual(norm.legalDependentsCount, 1);

    const legalRef = calculateLegalSubsistenceReference(demographics);
    // 100% RMMG (€ 920) + 30% RMMG (€ 276) = € 1.196,00
    assert.strictEqual(legalRef.calculatedReference, 1196.00);
    assert.strictEqual(legalRef.totalHouseholdMembers, 2);
  });

  it('TESTE 3: Matriz Habitacional 2026, 5 tipologias e reclassificação do Funchal', () => {
    // Lisboa (Tier High)
    const lisboa = DISTRICT_COST_DATA['Lisboa'];
    assert.strictEqual(lisboa.tier, 'High');
    assert.strictEqual(lisboa.rentRoom, 480);
    assert.strictEqual(lisboa.rentT0, 850);
    assert.strictEqual(lisboa.rentT1, 1150);
    assert.strictEqual(lisboa.rentT2, 1500);
    assert.strictEqual(lisboa.rentT3, 1950);

    // Funchal (Madeira): Reclassificado para High Tier
    const funchal = DISTRICT_COST_DATA['Funchal (Madeira)'];
    assert.strictEqual(funchal.tier, 'High');
    assert.strictEqual(funchal.rentT1, 880);
    assert.strictEqual(funchal.rentT2, 1150);
    assert.strictEqual(funchal.rentT3, 1500);

    // Bragança (Tier Low): Polo de acessibilidade
    const braganca = DISTRICT_COST_DATA['Bragança'];
    assert.strictEqual(braganca.tier, 'Low');
    assert.strictEqual(braganca.rentT0, 310);
    assert.strictEqual(braganca.rentT1, 400);
    assert.strictEqual(braganca.rentT2, 530);
    assert.strictEqual(braganca.rentT3, 710);
  });

  it('TESTE 4: Modalidades de Mobilidade (Passe Metropolitano, Ferroviário Verde e Viatura Própria)', () => {
    const demo = { adultsCount: 2, youth14To17Count: 0, childrenUnder14Count: 0 };

    // 1. Passe Público (Lisboa): 2 adultos × 40€ = 80€
    const pub = calculateDistrictCost('Lisboa', 't1', 'balanced', 'public_pass', demo);
    assert.strictEqual(pub.transport, 80);

    // 2. Passe Ferroviário Verde: 2 adultos × 20€ = 40€
    const rail = calculateDistrictCost('Lisboa', 't1', 'balanced', 'rail_pass', demo);
    assert.strictEqual(rail.transport, 40);

    // 3. Viatura Própria: Benchmark fixo estrutural MIRA = 240€
    const car = calculateDistrictCost('Lisboa', 't1', 'balanced', 'own_car', demo);
    assert.strictEqual(car.transport, OWN_CAR_MONTHLY_BENCHMARK);
  });

  it('TESTE 5: Métricas de Prudência Financeira MIRA e Taxa de Esforço Habitacional', () => {
    const netIncome = 2000;

    // Caso A: Renda 600€ / 2.000€ = 30.0% -> Sustainable (<= 35%)
    const caseA = calculateFinancialSufficiency(netIncome, 600, 1400);
    assert.strictEqual(caseA.effortRateHousingPct, 30.0);
    assert.strictEqual(caseA.effortRateStatus, 'sustainable');
    assert.strictEqual(caseA.netMonthlySavings, 600);
    assert.strictEqual(caseA.isDeficit, false);

    // Caso B: Renda 880€ / 2.000€ = 44.0% -> Moderate Risk (36% a 50%)
    const caseB = calculateFinancialSufficiency(netIncome, 880, 1680);
    assert.strictEqual(caseB.effortRateHousingPct, 44.0);
    assert.strictEqual(caseB.effortRateStatus, 'moderate_risk');

    // Caso C: Renda 1.150€ / 2.000€ = 57.5% -> Critical (> 50%)
    const caseC = calculateFinancialSufficiency(netIncome, 1150, 1950);
    assert.strictEqual(caseC.effortRateHousingPct, 57.5);
    assert.strictEqual(caseC.effortRateStatus, 'critical');

    // Caso D: Défice
    const caseD = calculateFinancialSufficiency(1500, 1150, 1700);
    assert.strictEqual(caseD.netMonthlySavings, -200);
    assert.strictEqual(caseD.isDeficit, true);
    assert.strictEqual(caseD.emergencyFund6Months, 1700 * 6);
  });

  it('TESTE 6: Retificações 2 e 3 — Referência Geral Portaria 1563/2007 sem hardcode de vistos', () => {
    // Casal com 1 criança
    const demo = { adultsCount: 2, youth14To17Count: 0, childrenUnder14Count: 1 };
    const legalRef = calculateLegalSubsistenceReference(demo);

    // 1.º Adulto: € 920,00
    // 2.º Adulto: € 460,00 (50%)
    // Criança: € 276,00 (30%)
    // Total = € 1.656,00
    assert.strictEqual(legalRef.rmmg2026, 920.00);
    assert.strictEqual(legalRef.calculatedReference, 1656.00);

    // Garantir que a propriedade isEligibleForVisa NÃO existe no objeto retornado
    assert.strictEqual((legalRef as any).isEligibleForVisa, undefined);

    // Garantir que o disclaimer enfatiza que a referência é meramente orçamental indicativa
    assert.ok(legalRef.disclaimer.includes('Referência normativa calculada com base na RMMG'));
    assert.ok(legalRef.disclaimer.includes('Visto D8'));
    assert.ok(legalRef.disclaimer.includes('Procura de Trabalho'));
  });

  it('TESTE 7: Orquestrador Global calculateCostOfLiving com comparação inter-distrital', () => {
    const assessment = calculateCostOfLiving({
      destinationDistrict: 'Lisboa',
      comparisonDistrict: 'Bragança',
      housingType: 't1',
      foodStyle: 'cook_home',
      transportOption: 'public_pass',
      demographics: { adultsCount: 1 },
      netMonthlyIncome: 1800
    });

    assert.strictEqual(assessment.destination.district, 'Lisboa');
    assert.strictEqual(assessment.comparison?.district, 'Bragança');
    assert.ok(assessment.differenceBetweenDistricts);
    assert.strictEqual(assessment.differenceBetweenDistricts?.cheaperDistrict, 'Bragança');
    assert.strictEqual(assessment.differenceBetweenDistricts?.expensiveDistrict, 'Lisboa');

    // Lisboa T1 = 1150; Bragança T1 = 400 -> Diferença habitacional = 750€
    assert.strictEqual(assessment.destination.housing - assessment.comparison!.housing, 750);

    // Métricas financeiras presentes
    assert.ok(assessment.financialSufficiency);
    assert.strictEqual(assessment.financialSufficiency?.netMonthlyIncome, 1800);
    assert.ok(assessment.legalSubsistenceReference);
    assert.strictEqual(assessment.legalSubsistenceReference?.calculatedReference, 920.00);
  });
});
