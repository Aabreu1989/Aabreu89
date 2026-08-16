// src/config/normativeRules2026.ts
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * REGRAS NORMATIVAS E PARÂMETROS LEGAIS OFICIAIS — EXERCÍCIO FISCAL DE 2026
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * FONTES PRIMÁRIAS OFICIAIS:
 * 1. IRS / Retenção na Fonte:
 *    - Autoridade Tributária e Aduaneira (AT) — Circular n.º 1/2026
 *    - Despacho n.º 233-A/2026 (Diário da República)
 *    - Código do IRS (CIRS), Artigos 12.º-B, 99.º-C, 101.º, 101.º-B e 151.º
 * 
 * 2. Segurança Social / IAS:
 *    - Portaria de Fixação do IAS 2026 (IAS = €537,13)
 *    - Código dos Regimes Contributivos do Sistema Previdencial de Segurança Social
 *      (CRCSPSS — Lei n.º 110/2009 / Decreto-Lei n.º 2/2018), Artigos 139.º a 165.º
 * 
 * 3. Procedimento Administrativo & Judicial:
 *    - Código do Procedimento Administrativo (CPA — Decreto-Lei n.º 4/2015)
 *    - Código de Processo nos Tribunais Administrativos (CPTA — Lei n.º 15/2002)
 *    - Lei de Estrangeiros (Lei n.º 23/2007) e Lei de Asilo (Lei n.º 27/2008)
 */

export interface IrsEscalaoNormativo {
  escalao: number;
  limiteSuperior: number;
  taxaMarginal: number;
  parcelaFixa?: number;
  tipoFormulaParcela?: 'dinamica_1' | 'dinamica_2' | 'fixa';
  parcelaAdicionalPorDependente?: number;
}

export const NORMATIVE_2026 = {
  // ─── SALÁRIO MÍNIMO & INDICADORES BÁSICOS ────────────────────────────────
  RMMG_2026: 920.00, // Salário Mínimo Nacional (Acordo Tripartido 2025-2028)
  IAS_2026: 537.13,  // Indexante dos Apoios Sociais Oficial 2026
  
  // Múltiplos legais do IAS
  ONE_IAS: 537.13,
  FOUR_IAS: 2148.52,   // Limite de Isenção em Acumulação TCO + TI (Art. 157.º-A CRCSPSS)
  TWELVE_IAS: 6445.56, // Teto Máximo Mensal de Incidência de Segurança Social

  // ─── SUBSÍDIO DE REFEIÇÃO (LIMITES DE ISENÇÃO FISCAL 2026) ───────────────
  MEAL_ALLOWANCE_CAPS: {
    CASH: 6.00,  // Dinheiro / Transferência Bancária
    CARD: 9.60,  // Cartão / Vales de Refeição
  },

  // ─── IRS JOVEM (ART. 12.º-B DO CIRS) ──────────────────────────────────────
  IRS_JOVEM: {
    IDADE_MAXIMA: 35,
    ANOS_BENEFICIO: 10,
    TETO_ISENCAO_IAS: 55, // 55 × IAS anuais
    ISENCOES_POR_ANO: {
      1: 1.00, // 1.º Ano: 100% de isenção
      2: 0.75, // 2.º Ano: 75% de isenção
      3: 0.50, // 3.º Ano: 50% de isenção
      4: 0.50, // 4.º Ano: 50% de isenção
      5: 0.25, // 5.º a 10.º Ano: 25% de isenção
      6: 0.25,
      7: 0.25,
      8: 0.25,
      9: 0.25,
      10: 0.25,
    } as Record<number, number>,
  },

  // ─── TAXAS DE SEGURANÇA SOCIAL ───────────────────────────────────────────
  SOCIAL_SECURITY: {
    TCO_TRABALHADOR: 0.11, // 11% Trabalho por Conta de Outrem
    TCO_ENTIDADE_EMPREGADORA: 0.2375, // 23,75% TSU
    TI_GERAL: 0.214, // 21,4% Trabalhador Independente
    TI_ENI: 0.252,   // 25,2% Empresário em Nome Individual / EIRL
    
    // Coeficientes do Rendimento Relevante Trimestral (Art. 162.º CRCSPSS)
    COEFICIENTE_SERVICOS: 0.70,
    COEFICIENTE_PRODUTOS_VENDAS: 0.20,
    
    // Contribuição mínima obrigatória (Art. 163.º, n.º 2)
    CONTRIBUICAO_MINIMA_MENSAL: 20.00,
    
    // Período de isenção de primeiro enquadramento
    MESES_PRIMEIRO_ENQUADRAMENTO: 12,
  },

  // ─── IRS CATEGORIA B (TRABALHO INDEPENDENTE) ──────────────────────────────
  CATEGORY_B: {
    TAXA_ART_151: 0.23, // 23% para atividades da tabela do Art. 151.º (Art. 101.º, n.º 1, al. b)
    TAXA_OUTROS_SERVICOS: 0.115, // 11,5% para outros serviços indiferenciados (Art. 101.º, n.º 1, al. a)
    TAXA_PROPRIEDADE_INTELECTUAL: 0.165, // 16,5% propriedade intelectual (Art. 101.º, n.º 1, al. d)
    
    // Dispensa de Retenção (Art. 101.º-B CIRS e Art. 53.º CIVA)
    LIMITE_DISPENSA_ANUAL: 15000.00,
    LIMITE_RETENCAO_MINIMA: 25.00, // Dispensa de retenção inferior a 25 € por ato
  },

  // ─── TABELAS DE RETENÇÃO NA FONTE (CONTINENTE — CIRCULAR N.º 1/2026) ─────
  IRS_TABLES_2026: {
    // TABELA I: Não casado sem dependentes ou Casado, dois titulares
    TABELA_I: [
      { escalao: 1, limiteSuperior: 920.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 2, limiteSuperior: 1042.00, taxaMarginal: 0.125, tipoFormulaParcela: 'dinamica_1', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 3, limiteSuperior: 1108.00, taxaMarginal: 0.157, tipoFormulaParcela: 'dinamica_2', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 4, limiteSuperior: 1154.00, taxaMarginal: 0.157, parcelaFixa: 94.71, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 5, limiteSuperior: 1212.00, taxaMarginal: 0.212, parcelaFixa: 158.18, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 6, limiteSuperior: 1819.00, taxaMarginal: 0.241, parcelaFixa: 193.33, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 7, limiteSuperior: 2119.00, taxaMarginal: 0.311, parcelaFixa: 320.66, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 8, limiteSuperior: 2499.00, taxaMarginal: 0.349, parcelaFixa: 401.19, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 9, limiteSuperior: 3305.00, taxaMarginal: 0.3836, parcelaFixa: 487.66, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 10, limiteSuperior: 5547.00, taxaMarginal: 0.3969, parcelaFixa: 531.62, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 11, limiteSuperior: 20221.00, taxaMarginal: 0.4495, parcelaFixa: 823.40, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
      { escalao: 12, limiteSuperior: Infinity, taxaMarginal: 0.4717, parcelaFixa: 1272.31, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 21.43 },
    ] as IrsEscalaoNormativo[],

    // TABELA II: Não casado com um ou mais dependentes
    TABELA_II: [
      { escalao: 1, limiteSuperior: 920.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 2, limiteSuperior: 1042.00, taxaMarginal: 0.125, tipoFormulaParcela: 'dinamica_1', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 3, limiteSuperior: 1108.00, taxaMarginal: 0.157, tipoFormulaParcela: 'dinamica_2', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 4, limiteSuperior: 1154.00, taxaMarginal: 0.157, parcelaFixa: 94.71, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 5, limiteSuperior: 1212.00, taxaMarginal: 0.212, parcelaFixa: 158.18, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 6, limiteSuperior: 1819.00, taxaMarginal: 0.241, parcelaFixa: 193.33, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 7, limiteSuperior: 2119.00, taxaMarginal: 0.311, parcelaFixa: 320.66, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 8, limiteSuperior: 2499.00, taxaMarginal: 0.349, parcelaFixa: 401.19, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 9, limiteSuperior: 3305.00, taxaMarginal: 0.3836, parcelaFixa: 487.66, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 10, limiteSuperior: 5547.00, taxaMarginal: 0.3969, parcelaFixa: 531.62, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 11, limiteSuperior: 20221.00, taxaMarginal: 0.4495, parcelaFixa: 823.40, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
      { escalao: 12, limiteSuperior: Infinity, taxaMarginal: 0.4717, parcelaFixa: 1272.31, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 34.29 },
    ] as IrsEscalaoNormativo[],

    // TABELA III: Casado, único titular
    TABELA_III: [
      { escalao: 1, limiteSuperior: 1694.00, taxaMarginal: 0.00, parcelaFixa: 0.00, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 2, limiteSuperior: 2063.00, taxaMarginal: 0.212, parcelaFixa: 359.13, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 3, limiteSuperior: 2492.00, taxaMarginal: 0.311, parcelaFixa: 563.37, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 4, limiteSuperior: 4487.00, taxaMarginal: 0.349, parcelaFixa: 658.07, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 5, limiteSuperior: 4753.00, taxaMarginal: 0.3836, parcelaFixa: 813.33, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 6, limiteSuperior: 6687.00, taxaMarginal: 0.3969, parcelaFixa: 876.55, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 7, limiteSuperior: 20468.00, taxaMarginal: 0.4495, parcelaFixa: 1228.29, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
      { escalao: 8, limiteSuperior: Infinity, taxaMarginal: 0.4717, parcelaFixa: 1682.68, tipoFormulaParcela: 'fixa', parcelaAdicionalPorDependente: 0.00 },
    ] as IrsEscalaoNormativo[],
  },

  // ─── FERIADOS NACIONAIS OBRIGATÓRIOS (PORTUGAL 2026) ─────────────────────
  NATIONAL_HOLIDAYS_2026: [
    '2026-01-01', // Ano Novo
    '2026-04-03', // Sexta-Feira Santa
    '2026-04-05', // Páscoa
    '2026-04-25', // Dia da Liberdade
    '2026-05-01', // Dia do Trabalhador
    '2026-06-04', // Corpo de Deus
    '2026-06-10', // Dia de Portugal
    '2026-08-15', // Assunção de Nossa Senhora
    '2026-10-05', // Implantação da República
    '2026-11-01', // Todos os Santos
    '2026-12-01', // Restauração da Independência
    '2026-12-08', // Imaculada Conceição
    '2026-12-25', // Natal
  ],

  // ─── FÉRIAS JUDICIAIS OFICIAIS (ART. 28.º DA LEI DA ORGANIZAÇÃO JUDICIÁRIA)
  JUDICIAL_VACATIONS_2026: [
    { nome: 'Páscoa', inicio: '2026-03-29', fim: '2026-04-06' },
    { nome: 'Verão', inicio: '2026-07-16', fim: '2026-08-31' },
    { nome: 'Natal', inicio: '2026-12-22', fim: '2027-01-03' },
  ],
};
