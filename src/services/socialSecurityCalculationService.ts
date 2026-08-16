// src/services/socialSecurityCalculationService.ts
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MOTOR DE CÁLCULO NORMATIVO DE SEGURANÇA SOCIAL — TRABALHADORES INDEPENDENTES
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Implementa os Artigos 139.º a 165.º do CRCSPSS (Lei n.º 110/2009 / DL n.º 2/2018).
 * Totalmente estanque e independente dos coeficientes de IRS.
 */

import { NORMATIVE_2026 } from '../config/normativeRules2026';

export interface IndependentSocialSecurityInputs {
  monthlyInvoice: number;
  activityType: 'services' | 'products_sales';
  regimeType: 'general' | 'eni'; // 21,4% ou 25,2%
  baseVariationPct?: number; // Ex: -25, -20, ..., 0, ..., +25
  
  // Enquadramento Temporal
  dataInicioAtividade?: string; // YYYY-MM-DD
  houveAntecipacaoEnquadramento?: boolean;
  
  // Acumulação com Trabalho por Conta de Outrem (Art. 157.º-A)
  isAcumulacaoTCO?: boolean;
  salarioBrutoTCO?: number;
  entidadesDistintasTCO?: boolean;
}

export interface IndependentSocialSecurityResult {
  monthlyInvoice: number;
  quarterlyInvoice: number;
  quarterlyRelevantIncome: number;
  monthlyRelevantIncome: number;
  monthlyContributoryBase: number;
  appliedRate: number;
  monthlyContribution: number;
  statusContributivo: 'isento_inicio_atividade' | 'isento_acumulacao_tco' | 'contribuinte_ativo' | 'contribuinte_excedente_tco';
  dataEfeitosEnquadramento?: string;
  legalBasis: string;
  isMinimumApplied: boolean;
  isCapApplied: boolean;
}

export class SocialSecurityCalculationService {
  /**
   * Determina a data em que o enquadramento produz efeitos (Art. 157.º CRCSPSS).
   * Produz efeitos no 1.º dia do 12.º mês posterior ao início de atividade.
   */
  public static calculateEnquadramentoDate(startDateStr: string): string {
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime())) {
      return '';
    }
    // Adiciona 12 meses e fixa no 1.º dia do mês
    const enqYear = startDate.getFullYear() + Math.floor((startDate.getMonth() + 12) / 12);
    const enqMonth = (startDate.getMonth() + 12) % 12;
    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    return `${enqYear}-${pad(enqMonth + 1)}-01`;
  }

  /**
   * Verifica se o trabalhador ainda está dentro do período de isenção de primeiro enquadramento.
   */
  public static isWithinFirstYearExemption(startDateStr?: string, referenceDateStr?: string): boolean {
    if (!startDateStr) return false;
    const start = new Date(startDateStr);
    const ref = referenceDateStr ? new Date(referenceDateStr) : new Date('2026-08-15');
    if (isNaN(start.getTime()) || isNaN(ref.getTime())) return false;

    const diffMonths = (ref.getFullYear() - start.getFullYear()) * 12 + (ref.getMonth() - start.getMonth());
    return diffMonths < NORMATIVE_2026.SOCIAL_SECURITY.MESES_PRIMEIRO_ENQUADRAMENTO;
  }

  /**
   * Executa o cálculo integral de Segurança Social para o Trabalhador Independente.
   */
  public static calculateIndependentSocialSecurity(inputs: IndependentSocialSecurityInputs): IndependentSocialSecurityResult {
    const monthlyInvoice = Math.max(0, inputs.monthlyInvoice);
    const quarterlyInvoice = monthlyInvoice * 3;

    // 1. Coeficiente do Rendimento Relevante (Art. 162.º CRCSPSS)
    const coef = inputs.activityType === 'products_sales'
      ? NORMATIVE_2026.SOCIAL_SECURITY.COEFICIENTE_PRODUTOS_VENDAS // 20%
      : NORMATIVE_2026.SOCIAL_SECURITY.COEFICIENTE_SERVICOS;        // 70%
    
    const quarterlyRelevantIncome = quarterlyInvoice * coef;
    const monthlyRelevantIncome = quarterlyRelevantIncome / 3;

    // 2. Taxa Contributiva (Art. 168.º)
    const rate = inputs.regimeType === 'eni'
      ? NORMATIVE_2026.SOCIAL_SECURITY.TI_ENI   // 25,2%
      : NORMATIVE_2026.SOCIAL_SECURITY.TI_GERAL; // 21,4%

    // 3. Verificação de Primeiro Enquadramento (Art. 157.º)
    const enquadramentoDate = inputs.dataInicioAtividade ? this.calculateEnquadramentoDate(inputs.dataInicioAtividade) : undefined;
    const isFirstYear = this.isWithinFirstYearExemption(inputs.dataInicioAtividade);

    if (isFirstYear && !inputs.houveAntecipacaoEnquadramento) {
      return {
        monthlyInvoice,
        quarterlyInvoice,
        quarterlyRelevantIncome,
        monthlyRelevantIncome,
        monthlyContributoryBase: 0,
        appliedRate: 0,
        monthlyContribution: 0,
        statusContributivo: 'isento_inicio_atividade',
        dataEfeitosEnquadramento: enquadramentoDate,
        legalBasis: 'Artigo 157.º do CRCSPSS (Isenção nos primeiros 12 meses de início de atividade)',
        isMinimumApplied: false,
        isCapApplied: false,
      };
    }

    // 4. Verificação de Acumulação com TCO (Art. 157.º-A)
    if (inputs.isAcumulacaoTCO && inputs.entidadesDistintasTCO !== false) {
      const salarioTCO = inputs.salarioBrutoTCO || 0;
      const isSalarioSuficiente = salarioTCO >= NORMATIVE_2026.ONE_IAS; // Salário TCO >= €537,13

      if (isSalarioSuficiente) {
        if (monthlyRelevantIncome < NORMATIVE_2026.FOUR_IAS) {
          // Rendimento Relevante < 4 IAS (€2.148,52) -> Isenção Total em TI
          return {
            monthlyInvoice,
            quarterlyInvoice,
            quarterlyRelevantIncome,
            monthlyRelevantIncome,
            monthlyContributoryBase: 0,
            appliedRate: 0,
            monthlyContribution: 0,
            statusContributivo: 'isento_acumulacao_tco',
            dataEfeitosEnquadramento: enquadramentoDate,
            legalBasis: 'Artigo 157.º-A do CRCSPSS (Isenção por acumulação: TCO >= 1 IAS e Rendimento TI < 4 IAS)',
            isMinimumApplied: false,
            isCapApplied: false,
          };
        } else {
          // Rendimento Relevante >= 4 IAS -> Incide estritamente sobre o excedente
          const excedenteBase = monthlyRelevantIncome - NORMATIVE_2026.FOUR_IAS;
          const monthlyContribution = excedenteBase * rate;

          return {
            monthlyInvoice,
            quarterlyInvoice,
            quarterlyRelevantIncome,
            monthlyRelevantIncome,
            monthlyContributoryBase: Math.round(excedenteBase * 100) / 100,
            appliedRate: rate * 100,
            monthlyContribution: Math.round(monthlyContribution * 100) / 100,
            statusContributivo: 'contribuinte_excedente_tco',
            dataEfeitosEnquadramento: enquadramentoDate,
            legalBasis: 'Artigo 157.º-A, n.º 2 do CRCSPSS (Incidência em TI apenas sobre a fração que excede 4 IAS)',
            isMinimumApplied: false,
            isCapApplied: false,
          };
        }
      }
    }

    // 5. Ajuste de Base por Opção do Trabalhador (-25% a +25%, Art. 160.º)
    const variationPct = Math.max(-0.25, Math.min(0.25, (inputs.baseVariationPct || 0) / 100));
    let baseAjustada = monthlyRelevantIncome * (1 + variationPct);

    // 6. Aplicação do Teto Máximo de 12 IAS (€6.445,56)
    let isCapApplied = false;
    if (baseAjustada > NORMATIVE_2026.TWELVE_IAS) {
      baseAjustada = NORMATIVE_2026.TWELVE_IAS;
      isCapApplied = true;
    }

    // 7. Cálculo da Contribuição e Piso Mínimo (€20,00/mês, Art. 163.º, n.º 2)
    let rawContribution = baseAjustada * rate;
    let isMinimumApplied = false;

    if (rawContribution < NORMATIVE_2026.SOCIAL_SECURITY.CONTRIBUICAO_MINIMA_MENSAL) {
      rawContribution = NORMATIVE_2026.SOCIAL_SECURITY.CONTRIBUICAO_MINIMA_MENSAL;
      isMinimumApplied = true;
    }

    return {
      monthlyInvoice,
      quarterlyInvoice,
      quarterlyRelevantIncome: Math.round(quarterlyRelevantIncome * 100) / 100,
      monthlyRelevantIncome: Math.round(monthlyRelevantIncome * 100) / 100,
      monthlyContributoryBase: Math.round(baseAjustada * 100) / 100,
      appliedRate: rate * 100,
      monthlyContribution: Math.round(rawContribution * 100) / 100,
      statusContributivo: 'contribuinte_ativo',
      dataEfeitosEnquadramento: enquadramentoDate,
      legalBasis: 'Artigos 162.º e 163.º do CRCSPSS (Regime Geral de Trabalhadores Independentes)',
      isMinimumApplied,
      isCapApplied,
    };
  }
}
