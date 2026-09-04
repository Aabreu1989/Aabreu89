import { test, describe } from 'node:test';
import assert from 'node:assert';
import { 
  calculateNetSalary, 
  RMMG_2026, 
  IAS_2026, 
  IRS_JOVEM_ANNUAL_CAP,
  MEAL_CAP_CASH_2026,
  MEAL_CAP_CARD_2026,
  SalaryInput 
} from '../miraSalaryEngine';

describe('🏛️ MIRA SALARY ENGINE (U-SALARY-01 — ESPECIFICAÇÃO CANÓNICA 2026)', () => {

  test('TESTE 1: RMMG 2026 (€ 920,00) — Isenção Total de Retenção de IRS', () => {
    const input: SalaryInput = {
      grossSalary: 920.00,
      maritalStatus: 'single',
      dependentsCount: 0,
      taxRegion: 'continente',
      mealAllowanceDaily: 0,
      mealAllowanceType: 'card',
      workingDays: 22,
      duodecimosMode: 'none',
    };

    const res = calculateNetSalary(input);

    // 1. Segurança Social (11% sobre 920€ = 101,20€)
    assert.strictEqual(res.socialSecurityEmployee, 101.20, 'SS do trabalhador deve ser rigorosamente €101,20');
    assert.strictEqual(res.socialSecurityCompany, 218.50, 'TSU patronal (23,75%) deve ser €218,50');

    // 2. Retenção na Fonte de IRS (0,00% até ao Salário Mínimo 2026)
    assert.strictEqual(res.irsWithholdingTax, 0.00, 'Retenção de IRS para Salário Mínimo deve ser €0,00');
    assert.strictEqual(res.irsEffectiveRate, 0.00, 'Taxa efetiva deve ser 0%');

    // 3. Salário Líquido Mensal
    assert.strictEqual(res.netMonthlyIncome, 818.80, 'Salário líquido deve ser €818,80 (920 - 101,20)');
  });

  test('TESTE 2: Salário Médio Padrão 2026 (€ 1.500,00) — Despacho n.º 233-A/2026 e Refeição Isenta', () => {
    const input: SalaryInput = {
      grossSalary: 1500.00,
      maritalStatus: 'single',
      dependentsCount: 0,
      taxRegion: 'continente',
      mealAllowanceDaily: 9.60,
      mealAllowanceType: 'card',
      workingDays: 22,
      duodecimosMode: 'none',
    };

    const res = calculateNetSalary(input);

    // Como 9,60€ <= 10,46€ (Portaria 51-B/2026 + 70%), todo o subsídio é isento
    assert.strictEqual(res.mealAllowanceTotal, 211.20, 'Total de refeição deve ser €211,20');
    assert.strictEqual(res.mealAllowanceExempt, 211.20, 'Subsídio isento deve ser €211,20');
    assert.strictEqual(res.mealAllowanceTaxable, 0.00, 'Subsídio tributável deve ser €0,00');

    // SS: 11% sobre 1.500€
    assert.strictEqual(res.socialSecurityEmployee, 165.00, 'SS do trabalhador deve ser €165,00');
    assert.strictEqual(res.socialSecurityCompany, 356.25, 'TSU patronal deve ser €356,25');

    // IRS: Escalão até € 1.819,00 da Tabela I: Taxa 24,10%, Parcela a abater € 193,33
    // Retenção = (1.500 * 24,10%) - 193,33 = 361,50 - 193,33 = 168,17€
    assert.strictEqual(res.irsWithholdingTax, 168.17, 'Retenção de IRS deve ser €168,17');
    assert.strictEqual(res.breakdown.marginalTaxRate, 24.10, 'Taxa marginal máxima do escalão deve ser 24,10%');
    assert.strictEqual(res.breakdown.parcelaAbater, 193.33, 'Parcela a abater oficial deve ser €193,33');

    // Salário Líquido: 1.500 - 165,00 - 168,17 + 211,20 = 1.378,03€
    assert.strictEqual(res.netMonthlyIncome, 1378.03, 'Salário líquido mensal deve ser €1.378,03');
  });

  test('TESTE 3: Excedente de Refeição Tributado 2026 (Portaria n.º 51-B/2026)', () => {
    const input: SalaryInput = {
      grossSalary: 1200.00,
      maritalStatus: 'single',
      dependentsCount: 0,
      taxRegion: 'continente',
      mealAllowanceDaily: 12.00,
      mealAllowanceType: 'cash', // Teto em dinheiro: € 6,15
      workingDays: 20,
      duodecimosMode: 'none',
    };

    const res = calculateNetSalary(input);

    // Excedente diário: 12,00 - 6,15 = 5,85€
    // Excedente mensal tributado: 5,85 * 20 = 117,00€
    // Isento mensal: 6,15 * 20 = 123,00€
    // Total refeição: 240,00€
    assert.strictEqual(res.mealAllowanceTotal, 240.00, 'Total de refeição deve ser €240,00');
    assert.strictEqual(res.mealAllowanceExempt, 123.00, 'Subsídio isento deve ser €123,00');
    assert.strictEqual(res.mealAllowanceTaxable, 117.00, 'Subsídio tributável deve ser €117,00');

    // Base de SS e IRS: 1.200 + 117 = 1.317,00€
    assert.strictEqual(res.grossTotal, 1317.00, 'Base de incidência total deve ser €1.317,00');

    // SS: 1.317 * 11% = 144,87€
    assert.strictEqual(res.socialSecurityEmployee, 144.87, 'SS do trabalhador deve ser €144,87');

    // IRS: Escalão até € 1.819,00 (Taxa 24,10%, Parcela € 193,33)
    // Retenção = (1.317 * 24,10%) - 193,33 = 317,397 - 193,33 = 124,07€
    assert.strictEqual(res.irsWithholdingTax, 124.07, 'Retenção de IRS deve ser €124,07');

    // Salário Líquido: 1.200 - 144,87 - 124,07 + 240,00 = 1.171,06€
    assert.strictEqual(res.netMonthlyIncome, 1171.06, 'Salário líquido mensal deve ser €1.171,06');
  });

  test('TESTE 4: IRS Jovem 2026 (Art. 12.º-B do CIRS & Ofício-Circulado n.º 20274 da AT)', () => {
    // Parâmetros oficiais 2026: IAS = € 537,13 | Teto Anual = 55 * IAS = € 29.542,15
    assert.strictEqual(IAS_2026, 537.13, 'IAS 2026 deve ser €537,13');
    assert.strictEqual(IRS_JOVEM_ANNUAL_CAP, 29542.15, 'Teto anual de IRS Jovem deve ser €29.542,15');

    const baseInput: SalaryInput = {
      grossSalary: 1500.00,
      maritalStatus: 'single',
      dependentsCount: 0,
      taxRegion: 'continente',
      mealAllowanceDaily: 0,
      mealAllowanceType: 'card',
      workingDays: 22,
      duodecimosMode: 'none',
    };

    // Ano 1 (100% de isenção): Retenção de IRS = € 0,00, Desconto = € 168,17
    const resYear1 = calculateNetSalary({ ...baseInput, irsJovemYear: 1 });
    assert.strictEqual(resYear1.irsWithholdingTax, 0.00, '1.º ano (100%) deve ter retenção de €0,00');
    assert.strictEqual(resYear1.breakdown.irsJovemDiscount, 168.17, 'Desconto do IRS Jovem deve ser €168,17');

    // Ano 2 (75% de isenção):
    // Parcela isenta = 1.500 * 0.75 = 1.125,00€ | Não isento = 375,00€
    // Taxa efetiva = 168,17 / 1500 = 0.1121133...
    // Retenção = 375 * 0.1121133 = 42,04€
    // Desconto = 168,17 - 42,04 = 126,13€
    const resYear2 = calculateNetSalary({ ...baseInput, irsJovemYear: 2 });
    assert.strictEqual(resYear2.irsWithholdingTax, 42.04, '2.º ano (75%) deve ter retenção de €42,04');
    assert.strictEqual(resYear2.breakdown.irsJovemDiscount, 126.13, 'Desconto deve ser €126,13');

    // Ano 5 (50% de isenção):
    // Parcela isenta = 750,00€ | Não isento = 750,00€
    // Retenção = 750 * 0.1121133 = 84,08€
    // Desconto = 168,17 - 84,08 = 84,09€
    const resYear5 = calculateNetSalary({ ...baseInput, irsJovemYear: 5 });
    assert.strictEqual(resYear5.irsWithholdingTax, 84.09, '5.º ano (50%) deve ter retenção de €84,09');
    assert.strictEqual(resYear5.breakdown.irsJovemDiscount, 84.08, 'Desconto deve ser €84,08');

    // Ano 8 (25% de isenção):
    // Parcela isenta = 375,00€ | Não isento = 1.125,00€
    // Retenção = 1.125 * 0.1121133 = 126,13€
    // Desconto = 168,17 - 126,13 = 42,04€
    const resYear8 = calculateNetSalary({ ...baseInput, irsJovemYear: 8 });
    assert.strictEqual(resYear8.irsWithholdingTax, 126.13, '8.º ano (25%) deve ter retenção de €126,13');
    assert.strictEqual(resYear8.breakdown.irsJovemDiscount, 42.04, 'Desconto deve ser €42,04');
  });

  test('TESTE 5: Comparação Territorial Oficial 2026 (Continente vs Açores vs Madeira)', () => {
    const input: SalaryInput = {
      grossSalary: 1500.00,
      maritalStatus: 'single',
      dependentsCount: 0,
      taxRegion: 'continente',
      mealAllowanceDaily: 0,
      mealAllowanceType: 'card',
      workingDays: 22,
      duodecimosMode: 'none',
    };

    const resContinente = calculateNetSalary({ ...input, taxRegion: 'continente' });
    const resAcores = calculateNetSalary({ ...input, taxRegion: 'acores' });
    const resMadeira = calculateNetSalary({ ...input, taxRegion: 'madeira' });

    // Continente: € 168,17
    assert.strictEqual(resContinente.irsWithholdingTax, 168.17);

    // Açores (Despacho n.º 1179/2026): (1.500 * 16,87%) - 135,33 = 117,72€
    assert.strictEqual(resAcores.irsWithholdingTax, 117.72, 'Açores deve ter retenção de €117,72');

    // Madeira: (1.500 * 18,08%) - 145,00 = 126,20€
    assert.strictEqual(resMadeira.irsWithholdingTax, 126.20, 'Madeira deve ter retenção de €126,20');

    // Validação de hierarquia fiscal regional
    assert.ok(resAcores.irsWithholdingTax < resMadeira.irsWithholdingTax, 'Açores tem retenção inferior à Madeira');
    assert.ok(resMadeira.irsWithholdingTax < resContinente.irsWithholdingTax, 'Madeira tem retenção inferior ao Continente');
  });

  test('TESTE 6: Modelação Inequívoca e Auditável de Duodécimos', () => {
    const baseInput: SalaryInput = {
      grossSalary: 1200.00,
      maritalStatus: 'single',
      dependentsCount: 0,
      taxRegion: 'continente',
      mealAllowanceDaily: 0,
      mealAllowanceType: 'card',
      workingDays: 22,
      duodecimosMode: 'none',
    };

    // 1. None
    const resNone = calculateNetSalary({ ...baseInput, duodecimosMode: 'none' });
    assert.strictEqual(resNone.vacationDuodecimoAmount, 0.00);
    assert.strictEqual(resNone.christmasDuodecimoAmount, 0.00);
    assert.strictEqual(resNone.duodecimosAmount, 0.00);
    assert.strictEqual(resNone.grossTotal, 1200.00);

    // 2. 50% Férias (1.200 / 24 = 50,00€)
    const resVac = calculateNetSalary({ ...baseInput, duodecimosMode: 'half_vacation' });
    assert.strictEqual(resVac.vacationDuodecimoAmount, 50.00);
    assert.strictEqual(resVac.christmasDuodecimoAmount, 0.00);
    assert.strictEqual(resVac.duodecimosAmount, 50.00);
    assert.strictEqual(resVac.grossTotal, 1250.00);

    // 3. 50% Natal (1.200 / 24 = 50,00€)
    const resXmas = calculateNetSalary({ ...baseInput, duodecimosMode: 'half_christmas' });
    assert.strictEqual(resXmas.vacationDuodecimoAmount, 0.00);
    assert.strictEqual(resXmas.christmasDuodecimoAmount, 50.00);
    assert.strictEqual(resXmas.duodecimosAmount, 50.00);
    assert.strictEqual(resXmas.grossTotal, 1250.00);

    // 4. 50% Ambos (1.200 / 12 = 100,00€)
    const resBoth = calculateNetSalary({ ...baseInput, duodecimosMode: 'half_both' });
    assert.strictEqual(resBoth.vacationDuodecimoAmount, 50.00);
    assert.strictEqual(resBoth.christmasDuodecimoAmount, 50.00);
    assert.strictEqual(resBoth.duodecimosAmount, 100.00);
    assert.strictEqual(resBoth.grossTotal, 1300.00);

    // 5. 100% Ambos (1.200 / 6 = 200,00€)
    const resFull = calculateNetSalary({ ...baseInput, duodecimosMode: 'full_both' });
    assert.strictEqual(resFull.vacationDuodecimoAmount, 100.00);
    assert.strictEqual(resFull.christmasDuodecimoAmount, 100.00);
    assert.strictEqual(resFull.duodecimosAmount, 200.00);
    assert.strictEqual(resFull.grossTotal, 1400.00);
  });

});
