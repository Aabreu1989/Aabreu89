// src/services/taxCalculationService.ts
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MOTOR DE CÁLCULO NORMATIVO DE IRS — 2026
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Implementa a Circular n.º 1/2026 e o Despacho n.º 233-A/2026 da Autoridade Tributária.
 * Separação absoluta entre cálculo de IRS e Segurança Social.
 */

import { NORMATIVE_2026, IrsEscalaoNormativo } from '../config/normativeRules2026';

export interface SalaryOutremInputs {
  grossSalary: number;
  familyStatus: 'single' | 'married_1' | 'married_2';
  dependents: number;
  fiscalRegion?: 'continent' | 'madeira' | 'azores';
  mealAllowanceDaily?: number;
  mealType?: 'cash' | 'card';
  workDays?: number;
  isIrsJovem?: boolean;
  irsJovemYear?: number;
}

export interface SalaryOutremResult {
  grossSalary: number;
  socialSecurityDeduction: number;
  socialSecurityRate: number;
  irsWithholdingDeduction: number;
  irsWithholdingEffectiveRate: number;
  irsWithholdingMarginalRate: number;
  irsEscalaoNumero: number;
  mealAllowanceTotal: number;
  mealAllowanceExempt: number;
  mealAllowanceTaxed: number;
  netSalary: number;
  totalTaxLoad: number;
  totalTaxLoadEffectiveRate: number;
  applicableTable: 'TABELA_I' | 'TABELA_II' | 'TABELA_III';
}

export interface CategoryBInputs {
  monthlyInvoice: number;
  activityType: 'art_151' | 'other_services' | 'intellectual_property' | 'products_sales';
  hasExemption101b?: boolean;
  annualForecastInvoice?: number;
  previousYearInvoice?: number;
}

export interface CategoryBResult {
  monthlyInvoice: number;
  irsWithholdingRate: number;
  irsWithholdingAmount: number;
  isExempt101b: boolean;
  legalBasis: string;
}

export class TaxCalculationService {
  /**
   * Calcula a Retenção na Fonte de IRS sobre Trabalho Dependente (Categoria A)
   * segundo a Circular n.º 1/2026 da Autoridade Tributária.
   */
  public static calculateSalaryOutrem(inputs: SalaryOutremInputs): SalaryOutremResult {
    const grossSalary = Math.max(0, inputs.grossSalary);
    const dependents = Math.max(0, inputs.dependents);
    const region = inputs.fiscalRegion || 'continent';
    const mealAllowanceDaily = Math.max(0, inputs.mealAllowanceDaily || 0);
    const mealType = inputs.mealType || 'card';
    const workDays = Math.max(0, inputs.workDays || 22);

    // 1. Segurança Social (Trabalhador: 11%)
    const ssRate = NORMATIVE_2026.SOCIAL_SECURITY.TCO_TRABALHADOR;
    const ssDeduction = grossSalary * ssRate;

    // 2. Determinação da Tabela Oficial da AT (2026)
    let tableKey: 'TABELA_I' | 'TABELA_II' | 'TABELA_III' = 'TABELA_I';
    if (inputs.familyStatus === 'married_1') {
      tableKey = 'TABELA_III'; // Casado, único titular
    } else if (inputs.familyStatus === 'single' && dependents > 0) {
      tableKey = 'TABELA_II'; // Não casado com um ou mais dependentes
    } else {
      tableKey = 'TABELA_I'; // Não casado sem dependentes ou casado 2 titulares
    }

    const table = NORMATIVE_2026.IRS_TABLES_2026[tableKey];

    // 3. Enquadramento no Escalão Oficial
    let selectedEscalao: IrsEscalaoNormativo = table[0];
    for (const esc of table) {
      selectedEscalao = esc;
      if (grossSalary <= esc.limiteSuperior) {
        break;
      }
    }

    // 4. Apuramento da Parcela a Abater Oficial
    let parcelaAbater = 0;
    if (selectedEscalao.tipoFormulaParcela === 'dinamica_1') {
      // Escalão até €1.042: 12,50% × 2,60 × (1.273,85 − R)
      parcelaAbater = 0.125 * 2.60 * Math.max(0, 1273.85 - grossSalary);
    } else if (selectedEscalao.tipoFormulaParcela === 'dinamica_2') {
      // Escalão até €1.108: 15,70% × 1,35 × (1.554,83 − R)
      parcelaAbater = 0.157 * 1.35 * Math.max(0, 1554.83 - grossSalary);
    } else {
      parcelaAbater = selectedEscalao.parcelaFixa || 0;
    }

    // 5. Parcela adicional por dependente
    const depDeductionPerUnit = selectedEscalao.parcelaAdicionalPorDependente || 0;
    const totalDepDeduction = dependents * depDeductionPerUnit;

    // 6. Cálculo da Retenção Bruta antes de benefícios regionais/jovem
    let irsWithholding = 0;
    if (selectedEscalao.taxaMarginal > 0) {
      irsWithholding = (grossSalary * selectedEscalao.taxaMarginal) - parcelaAbater - totalDepDeduction;
    }
    irsWithholding = Math.max(0, irsWithholding);

    // 7. Ajuste para Regiões Autónomas (Madeira -20%, Açores -30%)
    if (region === 'madeira') {
      irsWithholding = irsWithholding * 0.80;
    } else if (region === 'azores') {
      irsWithholding = irsWithholding * 0.70;
    }

    // 8. Benefício do IRS Jovem (Art. 12.º-B do CIRS)
    if (inputs.isIrsJovem && inputs.irsJovemYear) {
      const year = Math.min(10, Math.max(1, inputs.irsJovemYear));
      const exemptionPct = NORMATIVE_2026.IRS_JOVEM.ISENCOES_POR_ANO[year] || 0.25;
      irsWithholding = irsWithholding * (1 - exemptionPct);
    }

    irsWithholding = Math.max(0, Math.round(irsWithholding * 100) / 100);

    // 9. Subsídio de Refeição
    const mealCap = mealType === 'card' 
      ? NORMATIVE_2026.MEAL_ALLOWANCE_CAPS.CARD 
      : NORMATIVE_2026.MEAL_ALLOWANCE_CAPS.CASH;
    const totalMealAllowance = mealAllowanceDaily * workDays;
    
    let mealExempt = 0;
    let mealTaxed = 0;
    if (mealAllowanceDaily <= mealCap) {
      mealExempt = totalMealAllowance;
      mealTaxed = 0;
    } else {
      mealExempt = mealCap * workDays;
      mealTaxed = (mealAllowanceDaily - mealCap) * workDays;
    }

    // 10. Salário Líquido Final
    const netSalary = grossSalary - ssDeduction - irsWithholding + totalMealAllowance;
    const totalTaxLoad = ssDeduction + irsWithholding;
    const irsWithholdingEffectiveRate = grossSalary > 0 ? (irsWithholding / grossSalary) * 100 : 0;
    const totalTaxLoadEffectiveRate = grossSalary > 0 ? (totalTaxLoad / grossSalary) * 100 : 0;

    return {
      grossSalary,
      socialSecurityDeduction: Math.round(ssDeduction * 100) / 100,
      socialSecurityRate: ssRate * 100,
      irsWithholdingDeduction: irsWithholding,
      irsWithholdingEffectiveRate: Math.round(irsWithholdingEffectiveRate * 100) / 100,
      irsWithholdingMarginalRate: selectedEscalao.taxaMarginal * 100,
      irsEscalaoNumero: selectedEscalao.escalao,
      mealAllowanceTotal: Math.round(totalMealAllowance * 100) / 100,
      mealAllowanceExempt: Math.round(mealExempt * 100) / 100,
      mealAllowanceTaxed: Math.round(mealTaxed * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      totalTaxLoad: Math.round(totalTaxLoad * 100) / 100,
      totalTaxLoadEffectiveRate: Math.round(totalTaxLoadEffectiveRate * 100) / 100,
      applicableTable: tableKey,
    };
  }

  /**
   * Calcula a Retenção na Fonte de Categoria B (Trabalho Independente)
   * segundo os Artigos 101.º e 101.º-B do CIRS.
   */
  public static calculateCategoryBWithholding(inputs: CategoryBInputs): CategoryBResult {
    const monthlyInvoice = Math.max(0, inputs.monthlyInvoice);

    // 1. Determinação da Taxa de Retenção (Art. 101.º CIRS)
    let rate = NORMATIVE_2026.CATEGORY_B.TAXA_ART_151; // Padrão: 23%
    let legalBasis = 'Artigo 101.º, n.º 1, alínea b) do CIRS (Atividades Art. 151.º — 23%)';

    if (inputs.activityType === 'other_services') {
      rate = NORMATIVE_2026.CATEGORY_B.TAXA_OUTROS_SERVICOS; // 11,5%
      legalBasis = 'Artigo 101.º, n.º 1, alínea a) do CIRS (Outras Prestações de Serviços — 11,5%)';
    } else if (inputs.activityType === 'intellectual_property') {
      rate = NORMATIVE_2026.CATEGORY_B.TAXA_PROPRIEDADE_INTELECTUAL; // 16,5%
      legalBasis = 'Artigo 101.º, n.º 1, alínea d) do CIRS (Propriedade Intelectual / Científica — 16,5%)';
    } else if (inputs.activityType === 'products_sales') {
      rate = 0.00; // Vendas de mercadorias não têm retenção na fonte na generalidade
      legalBasis = 'Venda de Bens e Mercadorias (Sem Retenção na Fonte na Generalidade)';
    }

    // 2. Regime de Dispensa de Retenção (Art. 101.º-B do CIRS)
    let isExempt = false;
    if (inputs.hasExemption101b) {
      const forecast = inputs.annualForecastInvoice ?? (monthlyInvoice * 12);
      const prevYear = inputs.previousYearInvoice ?? 0;
      if (forecast <= NORMATIVE_2026.CATEGORY_B.LIMITE_DISPENSA_ANUAL && prevYear <= NORMATIVE_2026.CATEGORY_B.LIMITE_DISPENSA_ANUAL) {
        isExempt = true;
        legalBasis = 'Artigo 101.º-B do CIRS (Dispensa por volume de negócios <= 15.000€ anuais)';
      }
    }

    // 3. Regra de Retenção Mínima Inferior a 25€ (Art. 101.º-B, n.º 3)
    let amount = isExempt ? 0 : monthlyInvoice * rate;
    if (!isExempt && amount > 0 && amount < NORMATIVE_2026.CATEGORY_B.LIMITE_RETENCAO_MINIMA) {
      // Fica dispensada se a retenção for inferior a 25€ por ato
      // Nota: o simulador alerta o utilizador sobre esta faculdade
    }

    return {
      monthlyInvoice,
      irsWithholdingRate: isExempt ? 0 : rate * 100,
      irsWithholdingAmount: Math.round(amount * 100) / 100,
      isExempt101b: isExempt,
      legalBasis,
    };
  }
}
