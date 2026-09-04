/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MIRA SALARY ENGINE — MOTOR CANÓNICO DE SALÁRIO LÍQUIDO (2026)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * FONTES NORMATIVAS PRIMÁRIAS DE 2026:
 * 1. Retenção na Fonte de IRS — Continente:
 *    - Despacho n.º 233-A/2026 e Circular n.º 1/2026 da Autoridade Tributária.
 *    - Fórmulas marginais oficiais com parcelas dinâmicas em R nos primeiros escalões.
 * 2. Retenção na Fonte de IRS — Açores:
 *    - Despacho n.º 1179/2026 e Circular n.º 3/2026 da AT (Diferencial estatutário até 30%).
 * 3. Retenção na Fonte de IRS — Madeira:
 *    - Tabelas Regionais Oficiais da Região Autónoma da Madeira de 2026.
 * 4. Remuneração Mínima Mensal Garantida (RMMG):
 *    - € 920,00 (Mínimo de Existência de € 12.880,00 anual — Retenção a 0,00% até € 920,00).
 * 5. Subsídio de Alimentação (Portaria n.º 51-B/2026 & CIRS/CRCSPSS):
 *    - Dinheiro: Isento até € 6,15/dia.
 *    - Cartão/Vales (+70%): Isento até € 10,46/dia.
 *    - Excedente tributável acresce à base de Segurança Social e base de retenção de IRS.
 * 6. IRS Jovem (Artigo 12.º-B do CIRS & Ofício-Circulado n.º 20274 da AT):
 *    - Teto anual: 55 × IAS 2026 (€ 537,13) = € 29.542,15.
 *    - Aplicação da taxa efetiva da remuneração total ao rendimento não isento.
 * 7. Duodécimos Auditáveis:
 *    - 'none' | 'half_vacation' | 'half_christmas' | 'half_both' | 'full_both'.
 */

import { NORMATIVE_2026, IrsEscalaoNormativo } from '../config/normativeRules2026';

export type MaritalStatus = 'single' | 'married_2_holders' | 'married_1_holder';
export type TaxRegion = 'continente' | 'madeira' | 'acores';
export type MealAllowanceType = 'card' | 'cash';
export type DuodecimosMode = 'none' | 'half_vacation' | 'half_christmas' | 'half_both' | 'full_both';

export interface SalaryInput {
  grossSalary: number;
  maritalStatus: MaritalStatus;
  dependentsCount: number;
  taxRegion: TaxRegion;
  mealAllowanceDaily: number;
  mealAllowanceType: MealAllowanceType;
  workingDays: number;
  irsJovemYear?: number; // 0 para inativo, 1 a 10 para o ano do ciclo
  duodecimosMode: DuodecimosMode;
}

export interface SalaryAssessment {
  grossTotal: number;
  mealAllowanceTotal: number;
  mealAllowanceExempt: number;
  mealAllowanceTaxable: number;
  socialSecurityEmployee: number; // 11%
  socialSecurityCompany: number;  // 23.75%
  irsWithholdingTax: number;
  irsEffectiveRate: number;       // Percentagem líquida de imposto retido
  vacationDuodecimoAmount: number;
  christmasDuodecimoAmount: number;
  duodecimosAmount: number;       // Soma dos duodécimos mensais
  netMonthlyIncome: number;
  breakdown: {
    baseTaxableSalary: number;
    marginalTaxRate: number;
    deductionPerDependent: number;
    irsJovemDiscount: number;
    parcelaAbater: number;
  };
}

// ─── CONSTANTES CANÓNICAS 2026 ─────────────────────────────────────────────
export const RMMG_2026 = 920.00;
export const IAS_2026 = 537.13;
export const IRS_JOVEM_ANNUAL_CAP = 55 * IAS_2026; // € 29.542,15
export const MEAL_CAP_CASH_2026 = 6.15;
export const MEAL_CAP_CARD_2026 = 10.46;
export const RATE_SS_EMPLOYEE = 0.11;     // 11%
export const RATE_SS_COMPANY = 0.2375;   // 23.75%

// ─── TABELAS DE RETENÇÃO NA FONTE 2026: AÇORES (DESPACHO 1179/2026) ────────
const IRS_TABLES_ACORES_2026 = {
  TABELA_I: [
    { escalao: 1, limiteSuperior: 920.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 2, limiteSuperior: 1042.00, taxaMarginal: 0.0875, tipoFormulaParcela: 'dinamica_1', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 3, limiteSuperior: 1108.00, taxaMarginal: 0.1099, tipoFormulaParcela: 'dinamica_2', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 4, limiteSuperior: 1154.00, taxaMarginal: 0.1099, parcelaFixa: 66.30, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 5, limiteSuperior: 1212.00, taxaMarginal: 0.1484, parcelaFixa: 110.73, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 6, limiteSuperior: 1819.00, taxaMarginal: 0.1687, parcelaFixa: 135.33, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 7, limiteSuperior: 2119.00, taxaMarginal: 0.2177, parcelaFixa: 224.46, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 8, limiteSuperior: 2499.00, taxaMarginal: 0.2443, parcelaFixa: 280.83, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 9, limiteSuperior: 3305.00, taxaMarginal: 0.2685, parcelaFixa: 341.36, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 10, limiteSuperior: 5547.00, taxaMarginal: 0.2778, parcelaFixa: 372.13, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 11, limiteSuperior: 20221.00, taxaMarginal: 0.3147, parcelaFixa: 576.38, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
    { escalao: 12, limiteSuperior: Infinity, taxaMarginal: 0.3302, parcelaFixa: 890.62, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 15.00 },
  ] as IrsEscalaoNormativo[],

  TABELA_II: [
    { escalao: 1, limiteSuperior: 920.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 2, limiteSuperior: 1042.00, taxaMarginal: 0.0875, tipoFormulaParcela: 'dinamica_1', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 3, limiteSuperior: 1108.00, taxaMarginal: 0.1099, tipoFormulaParcela: 'dinamica_2', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 4, limiteSuperior: 1154.00, taxaMarginal: 0.1099, parcelaFixa: 66.30, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 5, limiteSuperior: 1212.00, taxaMarginal: 0.1484, parcelaFixa: 110.73, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 6, limiteSuperior: 1819.00, taxaMarginal: 0.1687, parcelaFixa: 135.33, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 7, limiteSuperior: 2119.00, taxaMarginal: 0.2177, parcelaFixa: 224.46, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 8, limiteSuperior: 2499.00, taxaMarginal: 0.2443, parcelaFixa: 280.83, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 9, limiteSuperior: 3305.00, taxaMarginal: 0.2685, parcelaFixa: 341.36, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 10, limiteSuperior: 5547.00, taxaMarginal: 0.2778, parcelaFixa: 372.13, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 11, limiteSuperior: 20221.00, taxaMarginal: 0.3147, parcelaFixa: 576.38, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
    { escalao: 12, limiteSuperior: Infinity, taxaMarginal: 0.3302, parcelaFixa: 890.62, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 24.00 },
  ] as IrsEscalaoNormativo[],

  TABELA_III: [
    { escalao: 1, limiteSuperior: 1694.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 2, limiteSuperior: 2063.00, taxaMarginal: 0.1484, parcelaFixa: 251.39, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 3, limiteSuperior: 2492.00, taxaMarginal: 0.2177, parcelaFixa: 394.36, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 4, limiteSuperior: 4487.00, taxaMarginal: 0.2443, parcelaFixa: 460.65, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 5, limiteSuperior: 4753.00, taxaMarginal: 0.2685, parcelaFixa: 569.33, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 6, limiteSuperior: 6687.00, taxaMarginal: 0.2778, parcelaFixa: 613.59, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 7, limiteSuperior: 20468.00, taxaMarginal: 0.3147, parcelaFixa: 859.80, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 8, limiteSuperior: Infinity, taxaMarginal: 0.3302, parcelaFixa: 1177.88, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
  ] as IrsEscalaoNormativo[],
};

// ─── TABELAS DE RETENÇÃO NA FONTE 2026: MADEIRA (DECRETO REGIONAL) ────────
const IRS_TABLES_MADEIRA_2026 = {
  TABELA_I: [
    { escalao: 1, limiteSuperior: 920.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 2, limiteSuperior: 1042.00, taxaMarginal: 0.0938, tipoFormulaParcela: 'dinamica_1', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 3, limiteSuperior: 1108.00, taxaMarginal: 0.1178, tipoFormulaParcela: 'dinamica_2', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 4, limiteSuperior: 1154.00, taxaMarginal: 0.1178, parcelaFixa: 71.03, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 5, limiteSuperior: 1212.00, taxaMarginal: 0.1590, parcelaFixa: 118.64, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 6, limiteSuperior: 1819.00, taxaMarginal: 0.1808, parcelaFixa: 145.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 7, limiteSuperior: 2119.00, taxaMarginal: 0.2333, parcelaFixa: 240.50, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 8, limiteSuperior: 2499.00, taxaMarginal: 0.2618, parcelaFixa: 300.89, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 9, limiteSuperior: 3305.00, taxaMarginal: 0.2877, parcelaFixa: 365.75, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 10, limiteSuperior: 5547.00, taxaMarginal: 0.2977, parcelaFixa: 398.72, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 11, limiteSuperior: 20221.00, taxaMarginal: 0.3371, parcelaFixa: 617.55, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
    { escalao: 12, limiteSuperior: Infinity, taxaMarginal: 0.3538, parcelaFixa: 954.23, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 16.07 },
  ] as IrsEscalaoNormativo[],

  TABELA_II: [
    { escalao: 1, limiteSuperior: 920.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 2, limiteSuperior: 1042.00, taxaMarginal: 0.0938, tipoFormulaParcela: 'dinamica_1', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 3, limiteSuperior: 1108.00, taxaMarginal: 0.1178, tipoFormulaParcela: 'dinamica_2', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 4, limiteSuperior: 1154.00, taxaMarginal: 0.1178, parcelaFixa: 71.03, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 5, limiteSuperior: 1212.00, taxaMarginal: 0.1590, parcelaFixa: 118.64, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 6, limiteSuperior: 1819.00, taxaMarginal: 0.1808, parcelaFixa: 145.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 7, limiteSuperior: 2119.00, taxaMarginal: 0.2333, parcelaFixa: 240.50, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 8, limiteSuperior: 2499.00, taxaMarginal: 0.2618, parcelaFixa: 300.89, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 9, limiteSuperior: 3305.00, taxaMarginal: 0.2877, parcelaFixa: 365.75, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 10, limiteSuperior: 5547.00, taxaMarginal: 0.2977, parcelaFixa: 398.72, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 11, limiteSuperior: 20221.00, taxaMarginal: 0.3371, parcelaFixa: 617.55, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
    { escalao: 12, limiteSuperior: Infinity, taxaMarginal: 0.3538, parcelaFixa: 954.23, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 25.72 },
  ] as IrsEscalaoNormativo[],

  TABELA_III: [
    { escalao: 1, limiteSuperior: 1694.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 2, limiteSuperior: 2063.00, taxaMarginal: 0.1590, parcelaFixa: 269.35, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 3, limiteSuperior: 2492.00, taxaMarginal: 0.2333, parcelaFixa: 422.53, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 4, limiteSuperior: 4487.00, taxaMarginal: 0.2618, parcelaFixa: 493.55, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 5, limiteSuperior: 4753.00, taxaMarginal: 0.2877, parcelaFixa: 610.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 6, limiteSuperior: 6687.00, taxaMarginal: 0.2977, parcelaFixa: 657.41, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 7, limiteSuperior: 20468.00, taxaMarginal: 0.3371, parcelaFixa: 921.22, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    { escalao: 8, limiteSuperior: Infinity, taxaMarginal: 0.3538, parcelaFixa: 1262.01, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
  ] as IrsEscalaoNormativo[],
};

// ─── RESOLUÇÃO DA TABELA OFICIAL ───────────────────────────────────────────
function resolveTableKey(maritalStatus: MaritalStatus, dependentsCount: number): 'TABELA_I' | 'TABELA_II' | 'TABELA_III' {
  if (maritalStatus === 'married_1_holder') {
    return 'TABELA_III';
  }
  if (maritalStatus === 'single' && dependentsCount > 0) {
    return 'TABELA_II';
  }
  return 'TABELA_I';
}

function resolveRegionTable(taxRegion: TaxRegion, tableKey: 'TABELA_I' | 'TABELA_II' | 'TABELA_III'): IrsEscalaoNormativo[] {
  if (taxRegion === 'acores') {
    return IRS_TABLES_ACORES_2026[tableKey];
  }
  if (taxRegion === 'madeira') {
    return IRS_TABLES_MADEIRA_2026[tableKey];
  }
  return NORMATIVE_2026.IRS_TABLES_2026[tableKey];
}

// ─── CÁLCULO DA PARCELA A ABATER CONFORME FÓRMULA OFICIAL DO ESCALÃO ───────
function calculateParcelaAbater(escalao: IrsEscalaoNormativo, R: number): number {
  if (escalao.tipoFormulaParcela === 'dinamica_1') {
    // Escalão até € 1.042: 12,50% × 2,60 × (1.273,85 − R)
    return Math.max(0, 0.125 * 2.60 * Math.max(0, 1273.85 - R));
  }
  if (escalao.tipoFormulaParcela === 'dinamica_2') {
    // Escalão até € 1.108: 15,70% × 1,35 × (1.554,83 − R)
    return Math.max(0, 0.157 * 1.35 * Math.max(0, 1554.83 - R));
  }
  return escalao.parcelaFixa || 0;
}

// ─── RETENÇÃO TABELADA PADRÃO DA AUTORIDADE TRIBUTÁRIA ─────────────────────
function calculateStandardIrsWithholding(
  R: number,
  maritalStatus: MaritalStatus,
  dependentsCount: number,
  taxRegion: TaxRegion
): {
  withholdingTax: number;
  marginalRate: number;
  parcelaAbater: number;
  deductionPerDependent: number;
} {
  const tableKey = resolveTableKey(maritalStatus, dependentsCount);
  const table = resolveRegionTable(taxRegion, tableKey);

  let selectedEscalao: IrsEscalaoNormativo = table[0];
  for (const esc of table) {
    selectedEscalao = esc;
    if (R <= esc.limiteSuperior) {
      break;
    }
  }

  if (selectedEscalao.taxaMarginal === 0) {
    return { withholdingTax: 0, marginalRate: 0, parcelaAbater: 0, deductionPerDependent: 0 };
  }

  const parcelaAbater = calculateParcelaAbater(selectedEscalao, R);
  const depDeductionUnit = selectedEscalao.parcelaAdicionalPorDependente || 0;
  const totalDepDeduction = dependentsCount * depDeductionUnit;

  // Fórmula da AT: (R × Taxa) − Parcela a abater − (Dependentes × Parcela adicional)
  const rawWithholding = (R * selectedEscalao.taxaMarginal) - parcelaAbater - totalDepDeduction;
  const withholdingTax = Math.max(0, Math.round(rawWithholding * 100) / 100);

  return {
    withholdingTax,
    marginalRate: Math.round(selectedEscalao.taxaMarginal * 10000) / 100,
    parcelaAbater: Math.round(parcelaAbater * 100) / 100,
    deductionPerDependent: depDeductionUnit,
  };
}

/**
 * Função Pura Soberana: calculateNetSalary
 * Executa o cálculo completo e auditável do Salário Líquido Mensal de acordo com o regime TCO 2026.
 */
export function calculateNetSalary(input: SalaryInput): SalaryAssessment {
  const grossSalary = Math.max(0, input.grossSalary || 0);
  const dependentsCount = Math.max(0, input.dependentsCount || 0);
  const maritalStatus = input.maritalStatus || 'single';
  const taxRegion = input.taxRegion || 'continente';
  const workingDays = Math.max(0, input.workingDays || 0);
  const mealDaily = Math.max(0, input.mealAllowanceDaily || 0);
  const mealType = input.mealAllowanceType || 'card';
  const duodecimosMode = input.duodecimosMode || 'none';

  // 1. Duodécimos Auditáveis (Férias e Natal)
  let vacationDuodecimoAmount = 0;
  let christmasDuodecimoAmount = 0;

  if (duodecimosMode === 'half_vacation') {
    vacationDuodecimoAmount = (0.5 * grossSalary) / 12; // grossSalary / 24
  } else if (duodecimosMode === 'half_christmas') {
    christmasDuodecimoAmount = (0.5 * grossSalary) / 12; // grossSalary / 24
  } else if (duodecimosMode === 'half_both') {
    vacationDuodecimoAmount = (0.5 * grossSalary) / 12;
    christmasDuodecimoAmount = (0.5 * grossSalary) / 12;
  } else if (duodecimosMode === 'full_both') {
    vacationDuodecimoAmount = grossSalary / 12;
    christmasDuodecimoAmount = grossSalary / 12;
  }

  vacationDuodecimoAmount = Math.round(vacationDuodecimoAmount * 100) / 100;
  christmasDuodecimoAmount = Math.round(christmasDuodecimoAmount * 100) / 100;
  const duodecimosAmount = Math.round((vacationDuodecimoAmount + christmasDuodecimoAmount) * 100) / 100;

  // 2. Subsídio de Alimentação (Portaria n.º 51-B/2026 & CIRS/CRCSPSS)
  const mealCap = mealType === 'card' ? MEAL_CAP_CARD_2026 : MEAL_CAP_CASH_2026;
  const mealAllowanceTotal = Math.round(mealDaily * workingDays * 100) / 100;

  const mealExemptDaily = Math.min(mealDaily, mealCap);
  const mealTaxableDaily = Math.max(0, mealDaily - mealCap);

  const mealAllowanceExempt = Math.round(mealExemptDaily * workingDays * 100) / 100;
  const mealAllowanceTaxable = Math.round(mealTaxableDaily * workingDays * 100) / 100;

  // 3. Remuneração Bruta Sujeita / Base de Segurança Social & IRS
  const grossTotal = Math.round((grossSalary + duodecimosAmount + mealAllowanceTaxable) * 100) / 100;
  const baseTaxableSalary = grossTotal;

  // 4. Segurança Social (11% Trabalhador + 23,75% Entidade Empregadora)
  const socialSecurityEmployee = Math.round(baseTaxableSalary * RATE_SS_EMPLOYEE * 100) / 100;
  const socialSecurityCompany = Math.round(baseTaxableSalary * RATE_SS_COMPANY * 100) / 100;

  // 5. Retenção na Fonte de IRS
  const standardIrsResult = calculateStandardIrsWithholding(
    baseTaxableSalary,
    maritalStatus,
    dependentsCount,
    taxRegion
  );

  let irsWithholdingTax = standardIrsResult.withholdingTax;
  let irsJovemDiscount = 0;

  // 6. Benefício do IRS Jovem (Artigo 12.º-B do CIRS & Ofício-Circulado n.º 20274 da AT)
  const irsJovemYear = input.irsJovemYear || 0;
  if (irsJovemYear >= 1 && irsJovemYear <= 10 && baseTaxableSalary > 0 && standardIrsResult.withholdingTax > 0) {
    const isencoes: Record<number, number> = {
      1: 1.00,
      2: 0.75, 3: 0.75, 4: 0.75,
      5: 0.50, 6: 0.50, 7: 0.50,
      8: 0.25, 9: 0.25, 10: 0.25,
    };
    const exemptionPct = isencoes[irsJovemYear] || 0.25;

    // Mensalização do teto legal do IAS (55 × IAS anual = € 29.542,15)
    // Em regime de duodécimos completos divide-se por 12; em regime normal divide-se por 14 meses
    const monthlyDivisor = duodecimosMode === 'full_both' ? 12 : 14;
    const monthlyIasCap = IRS_JOVEM_ANNUAL_CAP / monthlyDivisor;

    // Determinação da Parcela Isenta e do Rendimento Não Isento
    const parcelaIsenta = Math.min(baseTaxableSalary, monthlyIasCap) * exemptionPct;
    const rendimentoNaoIsento = Math.max(0, baseTaxableSalary - parcelaIsenta);

    // Instrução da AT (Ofício-Circulado 20274): Aplica-se ao montante não isento a taxa efetiva resultante da tabela
    const taxaEfetivaStandard = standardIrsResult.withholdingTax / baseTaxableSalary;
    const irsJovemWithholding = Math.round(rendimentoNaoIsento * taxaEfetivaStandard * 100) / 100;

    irsJovemDiscount = Math.round(Math.max(0, standardIrsResult.withholdingTax - irsJovemWithholding) * 100) / 100;
    irsWithholdingTax = irsJovemWithholding;
  }

  // Taxa Efetiva Final de IRS
  const irsEffectiveRate = grossTotal > 0 ? Math.round((irsWithholdingTax / grossTotal) * 10000) / 100 : 0;

  // 7. Salário Líquido Mensal Disponível
  // Líquido = Salário Base + Duodécimos − SS (11%) − Retenção IRS + Subsídio de Alimentação Total
  const netMonthlyIncome = Math.round((grossSalary + duodecimosAmount - socialSecurityEmployee - irsWithholdingTax + mealAllowanceTotal) * 100) / 100;

  return {
    grossTotal,
    mealAllowanceTotal,
    mealAllowanceExempt,
    mealAllowanceTaxable,
    socialSecurityEmployee,
    socialSecurityCompany,
    irsWithholdingTax,
    irsEffectiveRate,
    vacationDuodecimoAmount,
    christmasDuodecimoAmount,
    duodecimosAmount,
    netMonthlyIncome,
    breakdown: {
      baseTaxableSalary,
      marginalTaxRate: standardIrsResult.marginalRate,
      deductionPerDependent: standardIrsResult.deductionPerDependent,
      irsJovemDiscount,
      parcelaAbater: standardIrsResult.parcelaAbater,
    },
  };
}
