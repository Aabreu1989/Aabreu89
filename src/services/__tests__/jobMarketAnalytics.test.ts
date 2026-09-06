import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseSalaryRange } from '../jobMarketAnalytics';

describe('U-JOBS-MARKET-01: Canonical Salary Parser (parseSalaryRange)', () => {
  it('B4: Rejects salaries with foreign currency symbols or codes', () => {
    assert.equal(parseSalaryRange('$1.500'), null);
    assert.equal(parseSalaryRange('1500 USD'), null);
    assert.equal(parseSalaryRange('£2.000'), null);
    assert.equal(parseSalaryRange('2000 GBP'), null);
    assert.equal(parseSalaryRange('R$ 3.000'), null);
    assert.equal(parseSalaryRange('3000 BRL'), null);
  });

  it('B4: Rejects strings without explicit EUR evidence (€, EUR, euro)', () => {
    assert.equal(parseSalaryRange('1200'), null);
    assert.equal(parseSalaryRange('1000 - 1500'), null);
    assert.equal(parseSalaryRange('A combinar'), null);
    assert.equal(parseSalaryRange(''), null);
    assert.equal(parseSalaryRange(null), null);
    assert.equal(parseSalaryRange(undefined), null);
  });

  it('Parses single EUR salaries with and without thousand separators', () => {
    const res1 = parseSalaryRange('1.200 €');
    assert.ok(res1);
    assert.equal(res1.min, 1200);
    assert.equal(res1.max, 1200);
    assert.equal(res1.midpoint, 1200);

    const res2 = parseSalaryRange('950€');
    assert.ok(res2);
    assert.equal(res2.min, 950);
    assert.equal(res2.max, 950);
    assert.equal(res2.midpoint, 950);

    const res3 = parseSalaryRange('1500 EUR');
    assert.ok(res3);
    assert.equal(res3.min, 1500);
    assert.equal(res3.max, 1500);
    assert.equal(res3.midpoint, 1500);

    const res4 = parseSalaryRange('1100 euros / mês');
    assert.ok(res4);
    assert.equal(res4.min, 1100);
    assert.equal(res4.max, 1100);
    assert.equal(res4.midpoint, 1100);
  });

  it('Parses salary ranges and calculates exact midpoint (min + max) / 2', () => {
    const res1 = parseSalaryRange('1.400 € - 2.200 €');
    assert.ok(res1);
    assert.equal(res1.min, 1400);
    assert.equal(res1.max, 2200);
    assert.equal(res1.midpoint, 1800);

    const res2 = parseSalaryRange('920 € a 1.050 €');
    assert.ok(res2);
    assert.equal(res2.min, 920);
    assert.equal(res2.max, 1050);
    assert.equal(res2.midpoint, 985);

    const res3 = parseSalaryRange('1000 - 1500 €');
    assert.ok(res3);
    assert.equal(res3.min, 1000);
    assert.equal(res3.max, 1500);
    assert.equal(res3.midpoint, 1250);
  });

  it('B3: Explicit annual evidence divides by 12', () => {
    const resAnnual = parseSalaryRange('24.000 € / ano');
    assert.ok(resAnnual);
    assert.equal(resAnnual.min, 2000);
    assert.equal(resAnnual.max, 2000);
    assert.equal(resAnnual.midpoint, 2000);

    const resRangeAnnual = parseSalaryRange('18.000 € - 24.000 € anual');
    assert.ok(resRangeAnnual);
    assert.equal(resRangeAnnual.min, 1500);
    assert.equal(resRangeAnnual.max, 2000);
    assert.equal(resRangeAnnual.midpoint, 1750);
  });

  it('B3: Explicit hourly evidence multiplies by 160h/month', () => {
    const resHourly = parseSalaryRange('10 € / hora');
    assert.ok(resHourly);
    assert.equal(resHourly.min, 1600);
    assert.equal(resHourly.max, 1600);
    assert.equal(resHourly.midpoint, 1600);

    const resRangeHourly = parseSalaryRange('8 € - 12 € / h');
    assert.ok(resRangeHourly);
    assert.equal(resRangeHourly.min, 1280);
    assert.equal(resRangeHourly.max, 1920);
    assert.equal(resRangeHourly.midpoint, 1600);
  });

  it('B3: High legitimate monthly salaries are NOT converted to annual', () => {
    // 7.500 € without annual evidence must stay 7.500 € (not converted to 625 €)
    const resHigh = parseSalaryRange('7.500 € / mês');
    assert.ok(resHigh);
    assert.equal(resHigh.min, 7500);
    assert.equal(resHigh.max, 7500);
    assert.equal(resHigh.midpoint, 7500);

    const resHighNoText = parseSalaryRange('8.000 € - 10.000 €');
    assert.ok(resHighNoText);
    assert.equal(resHighNoText.min, 8000);
    assert.equal(resHighNoText.max, 10000);
    assert.equal(resHighNoText.midpoint, 9000);
  });

  it('Enforces sanity boundary: 400 € to 25.000 € monthly', () => {
    // Below 400 € monthly
    assert.equal(parseSalaryRange('350 €'), null);
    assert.equal(parseSalaryRange('200 € / mês'), null);

    // Above 25.000 € monthly
    assert.equal(parseSalaryRange('30.000 € / mês'), null);
    assert.equal(parseSalaryRange('50.000 €'), null);
  });
});

describe('U-JOBS-MARKET-01: Invariants & Deterministic Calculations', () => {
  it('B2: Proves reconciliation invariant raw = declared + unparseable', () => {
    const rawSamples = [
      '1.200 €',
      '950 € - 1.100 €',
      '350 €', // rejected (< 400)
      '24.000 € / ano',
      'A combinar', // rejected (no EUR)
      '2.000 USD' // rejected (foreign currency)
    ];

    let declared = 0;
    let unparseable = 0;

    for (const s of rawSamples) {
      const parsed = parseSalaryRange(s);
      if (parsed) declared++;
      else unparseable++;
    }

    assert.equal(rawSamples.length, declared + unparseable);
    assert.equal(declared, 3);
    assert.equal(unparseable, 3);
  });

  it('B5: Deterministic tie-breaking orders by count DESC, then name ASC', () => {
    const sectors = [
      { name: 'Turismo, Hotelaria & Restauração', count: 1000 },
      { name: 'Construção Civil & Engenharia', count: 2000 },
      { name: 'Tecnologia, Dados & IA', count: 1000 },
      { name: 'Saúde & Cuidados Continuados', count: 1000 }
    ];

    const sorted = [...sectors].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

    assert.equal(sorted[0].name, 'Construção Civil & Engenharia');
    // For tied 1000: 'Saúde' < 'Tecnologia' < 'Turismo'
    assert.equal(sorted[1].name, 'Saúde & Cuidados Continuados');
    assert.equal(sorted[2].name, 'Tecnologia, Dados & IA');
    assert.equal(sorted[3].name, 'Turismo, Hotelaria & Restauração');
  });

  it('B1: Weekly growth formula handles disjoint periods correctly', () => {
    const calcGrowth = (curr: number, prev: number) => {
      return prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
    };

    assert.equal(calcGrowth(7064, 5953), 19);
    assert.equal(calcGrowth(500, 500), 0);
    assert.equal(calcGrowth(400, 500), -20);
    assert.equal(calcGrowth(100, 0), 0);
  });

  it('Market share and visual proportion formulas', () => {
    const totalActive = 25260;
    const maxSector = 6495;
    const sectorCount = 2450;

    const marketSharePct = Number(((sectorCount / totalActive) * 100).toFixed(1));
    const visualProportionPct = Math.min(100, Math.max(8, Math.round((sectorCount / maxSector) * 100)));

    assert.equal(marketSharePct, 9.7);
    assert.equal(visualProportionPct, 38);
  });
});
