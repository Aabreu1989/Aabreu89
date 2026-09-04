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
import { calculateNetSalary, MaritalStatus, TaxRegion } from './miraSalaryEngine';

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
    const maritalStatusMap: Record<string, MaritalStatus> = {
      married_1: 'married_1_holder',
      married_2: 'married_2_holders',
      single: 'single'
    };
    const regionMap: Record<string, TaxRegion> = {
      continent: 'continente',
      madeira: 'madeira',
      azores: 'acores'
    };

    const res = calculateNetSalary({
      grossSalary: inputs.grossSalary,
      maritalStatus: maritalStatusMap[inputs.familyStatus] || 'single',
      dependentsCount: inputs.dependents || 0,
      taxRegion: regionMap[inputs.fiscalRegion || 'continent'] || 'continente',
      mealAllowanceDaily: inputs.mealAllowanceDaily || 0,
      mealAllowanceType: inputs.mealType || 'card',
      workingDays: inputs.workDays || 22,
      irsJovemYear: inputs.isIrsJovem ? inputs.irsJovemYear : 0,
      duodecimosMode: 'none',
    });

    let tableKey: 'TABELA_I' | 'TABELA_II' | 'TABELA_III' = 'TABELA_I';
    if (inputs.familyStatus === 'married_1') {
      tableKey = 'TABELA_III';
    } else if (inputs.familyStatus === 'single' && (inputs.dependents || 0) > 0) {
      tableKey = 'TABELA_II';
    }

    const totalTaxLoad = res.socialSecurityEmployee + res.irsWithholdingTax;
    const totalTaxLoadEffectiveRate = res.grossTotal > 0 
      ? Math.round((totalTaxLoad / res.grossTotal) * 10000) / 100 
      : 0;

    return {
      grossSalary: inputs.grossSalary,
      socialSecurityDeduction: res.socialSecurityEmployee,
      socialSecurityRate: 11.0,
      irsWithholdingDeduction: res.irsWithholdingTax,
      irsWithholdingEffectiveRate: res.irsEffectiveRate,
      irsWithholdingMarginalRate: res.breakdown.marginalTaxRate,
      irsEscalaoNumero: 0,
      mealAllowanceTotal: res.mealAllowanceTotal,
      mealAllowanceExempt: res.mealAllowanceExempt,
      mealAllowanceTaxed: res.mealAllowanceTaxable,
      netSalary: res.netMonthlyIncome,
      totalTaxLoad,
      totalTaxLoadEffectiveRate,
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
