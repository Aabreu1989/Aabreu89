// src/components/SimulatorsView.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calculator, Coins, TrendingUp, Landmark, ShieldCheck, 
  MapPin, AlertTriangle, BarChart3, Info, CheckCircle2, 
  Wallet, HeartPulse, PiggyBank, Sparkles, Building2, UserCheck, Briefcase, Home
} from 'lucide-react';
import { ViewType } from '../types';
import { analytics } from '../services/analyticsService';
import { NORMATIVE_2026 } from '../config/normativeRules2026';
import { TaxCalculationService } from '../services/taxCalculationService';
import { SocialSecurityCalculationService } from '../services/socialSecurityCalculationService';
import { LegalDeadlineService, PROCEDIMENTOS_CATALOGO, ProcedimentoTipo } from '../services/legalDeadlineService';
import { RetirementWizard } from './RetirementWizard';
import { SocialSecuritySimulator } from './SocialSecuritySimulator';
import { 
  calculateNetSalary, 
  DuodecimosMode, 
  MaritalStatus, 
  TaxRegion,
  MEAL_CAP_CASH_2026,
  MEAL_CAP_CARD_2026
} from '../services/miraSalaryEngine';
import {
  DISTRICT_COST_DATA,
  HousingType,
  FoodStyle,
  TransportOption,
  calculateCostOfLiving as calculateCostOfLivingEngine,
  calculateFinancialSufficiency,
  calculateLegalSubsistenceReference,
  normalizeDemographics,
  CostOfLivingAssessment,
  OWN_CAR_MONTHLY_BENCHMARK,
  RAIL_PASS_COST_2026,
  TELECOM_FIXED_HOUSEHOLD,
  RMMG_2026 as COST_RMMG_2026
} from '../services/miraCostOfLivingEngine';
import {
  HousingTypology,
  getTerritorialIntelligence,
  calculateRentalAffordability,
  calculatePurchaseAffordability,
  TERRITORIAL_SEEDS,
  IMT_JOVEM_2026
} from '../services/miraHousingEngine';

interface SimulatorsViewProps {
  language: string;
  onViewChange: (view: ViewType, params?: any) => void;
  initialTab?: string;
  initialParams?: Record<string, any>;
  onEarnPoints?: (amount: number, reason: string, actionKey?: string, entityId?: string) => void;
}

// ─── TRANSLATIONS DICTIONARY ────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  PT: {
    adults_label: "Adultos (≥ 18 anos)",
    youth_label: "Jovens (14 a 17 anos)",
    children_label: "Crianças (< 14 anos)",
    telecom: "Telecomunicações (Fibra + Móvel)",
    health_personal: "Saúde, Higiene e Cuidados Pessoais",
    provenance_badge: "Benchmark de Mercado MIRA 2026 (INE m² + Portais Oficiais)",
    mira_financial_health: "Suficiência Financeira & Prudência MIRA",
    legal_subsistence_title: "Referência Geral Portaria n.º 1563/2007",
    reference_label: "Referência:",
    use_net_salary: "Usar Salário Líquido Calculado",
    rail_pass: "Passe Ferroviário Verde (CP - 20€)",
    t0_apartment: "Estúdio / Apartamento T0",
    t3_apartment: "Apartamento T3 (Família)",
    room_single: "Quarto Individual (Room)",
    t4_apartment: "Apartamento T4 ou Superior (T4+)",
    ocde_scale_label: "Escala OCDE:",
    ocde_scale_sub: "Fator de equivalência familiar",
    applied_food_utilities: "aplicado à alimentação e utilidades.",
    portaria_formula_label: "Fórmula Teórica da Portaria:",
    governance_note_title: "Nota de Governança e Blindagem Jurídica:",
    household_net_income: "Rendimento Líquido Mensal do Agregado (€)",
    effort_sustainable_tag: "Sustentável (≤ 35%)",
    effort_moderate_tag: "Risco Moderado (36-50%)",
    effort_critical_tag: "Sobre-esforço Crítico (> 50%)",
    effort_rate_housing: "Taxa de Esforço Habitacional",
    rent_vs_income_label: "Renda ({rent}€) face ao Rendimento ({income}€)",
    estimated_monthly_balance: "Saldo Mensal Estimado",
    deficit_estimated_desc: "Défice mensal estimado no distrito",
    savings_margin_desc: "Margem de poupança mensal",
    mira_recommended_reserve: "Reserva MIRA Recomendada",
    reserve_target_desc: "Alvo de 6 meses de segurança (3 meses: {val3}€)",
    compare_off: "Desligado",
    placeholder_ex_from_tab1: "Ex: {val}€ (da Tab 1)",
    placeholder_ex_1500: "Ex: 1500",
    so_sim_title: "Simulador de Salário Líquido (Trabalhador por Conta de Outrem / Contrato)",
    so_sim_subtitle: "Cálculo com tabelas oficiais de retenção na fonte de IRS (2026) & Segurança Social (11%)",
    duodecimos_badge_13_14: "13.º e 14.º Mês",
    irs_jovem_desc_field: "Isenção parcial nos primeiros 10 anos de atividade (até 35 anos). Teto anual: 55 × IAS (€ 29.542,15).",
    irs_jovem_y1: "1.º Ano",
    irs_jovem_y2_4: "2.º–4.º Anos",
    irs_jovem_y5_7: "5.º–7.º Anos",
    irs_jovem_y8_10: "8.º–10.º Anos",
    irs_jovem_opt_1: "1.º Ano (100% Isenção)",
    irs_jovem_opt_2: "2.º Ano (75% Isenção)",
    irs_jovem_opt_3: "3.º Ano (75% Isenção)",
    irs_jovem_opt_4: "4.º Ano (75% Isenção)",
    irs_jovem_opt_5: "5.º Ano (50% Isenção)",
    irs_jovem_opt_6: "6.º Ano (50% Isenção)",
    irs_jovem_opt_7: "7.º Ano (50% Isenção)",
    irs_jovem_opt_8: "8.º Ano (25% Isenção)",
    irs_jovem_opt_9: "9.º Ano (25% Isenção)",
    irs_jovem_opt_10: "10.º Ano (25% Isenção)",
    meal_taxable_alert: "Atenção: Subsídio de Refeição Tributável",
    meal_taxable_sub: "O excedente diário de {excess}€/dia (acima do teto isento de {cap}) sofrerá retenção de 11% de Segurança Social e IRS.",
    calc_result_2026: "Resultado do Cálculo (2026)",
    calc_result_title: "Resultado do Cálculo",
    effective_irs_rate: "Taxa Efetiva de IRS",
    effective_tax_rate: "Taxa Efetiva de Imposto",
    net_income_available: "Rendimento Líquido Mensal Disponível",
    payslip_breakdown: "Discriminação do Recibo de Vencimento",
    remun_bruta_sujeita: "Remuneração Bruta Sujeita",
    duodecimo_vac_line: "• Duodécimo Subsídio de Férias:",
    duodecimo_xmas_line: "• Duodécimo Subsídio de Natal:",
    ss_worker_11: "Segurança Social Trabalhador (11%)",
    irs_withholding_line: "Retenção na Fonte de IRS",
    meal_exempt_line: "Subsídio Alimentação Isento",
    meal_taxed_line: "Subsídio Alimentação Tributado (no bruto)",
    salary_legal_basis_note: "Cálculo efetuado com base no Modelo Marginal Oficial da Autoridade Tributária (2026), Segurança Social TCO (11%) e limites de refeição da Portaria n.º 51-B/2026 (isento até 10,46€/dia em cartão ou 6,15€ em dinheiro).",
    rv_sim_title: "Simulador de Recibos Verdes (Trabalhador Independente / Freelancer)",
    rv_sim_subtitle: "Cálculo de Segurança Social (21,4% sobre 70% base) & Retenção na fonte de IRS por Categoria B",
    rv_irs_jovem_title: "IRS Jovem (Art. 12.º-B CIRS) para Categoria B",
    rv_irs_jovem_desc: "Aplicável a trabalhadores independentes até 35 anos com grau de ensino superior.",
    rv_deductions_title: "Contribuições & Impostos Retidos",
    ss_ti_line: "Segurança Social (21,4% sobre 70% Base)",
    ss_var_0_short: "0% Padrão",
    rv_legal_note: "Os Recibos Verdes calculam a Segurança Social incidente sobre 70% da faturação bruta em serviços (ou 20% em vendas de produtos) com taxa de 21,4% (Trabalhador Independente) ou 25,2% (ENI).",
    hp_title: "MIRA Housing Intelligence & Affordability 2026",
    hp_subtitle: "Observatório Territorial (INE vs Portais) e Simuladores Regulatórios de Arrendamento e Aquisição",
    hp_mode_rent: "🏠 Arrendamento & Porta 65",
    hp_mode_buy: "🏦 Compra & Crédito à Habitação",
    hp_territory_label: "📍 Unidade Territorial / Concelho",
    hp_municipality_tag: "(Concelho / INE Oficial)",
    hp_district_tag: "(Distrito / Agregação MIRA)",
    hp_typology_label: "📐 Tipologia Habitacional",
    hp_age_label: "🎂 Idade do Candidato (Anos)",
    hp_buyer_age_label: "🎂 Idade do Mutuário mais Velho",
    hp_youth_guarantee_toggle: "Garantia Pública Jovem (DL 44/2024)",
    hp_rent_inputs_title: "Dados de Rendimento & Contrato",
    hp_net_income_label: "💰 Rendimento Líquido Mensal (€)",
    hp_net_income_help: "Usado na taxa de esforço e prudência MIRA.",
    hp_gross_income_label: "💼 Rendimento Bruto Mensal (€)",
    hp_gross_income_help: "Obrigatório para aferir a regra de esforço bruto ≤ 60% do Porta 65.",
    hp_rent_label: "🏠 Renda Mensal Pretendida (€)",
    hp_rent_help: "Deixe 0 ou vazio para usar o benchmark apurado de mercado.",
    hp_expenses_label: "🛒 Total de Outras Despesas Mensais (€)",
    hp_territorial_obs_title: "Observatório Territorial MIRA",
    hp_ine_contracted: "INE Contratado",
    hp_portals_asking: "Portais Anunciado",
    hp_asking_spread: "Ágio de Oferta",
    hp_spread_help: "Pressão de proprietários face aos novos contratos AT",
    hp_initial_capital_title: "Capital Inicial (Art. 1076.º CC)",
    hp_first_month_rent: "1.ª Renda de Entrada:",
    hp_advance_rent: "Adiantamento (até 2 meses):",
    hp_security_deposit: "Caução (até 2 meses):",
    hp_cc1076_legal_note: "teto legal máximo admissível (5 rendas), não sendo compulsório caso o senhorio acorde montante inferior.",
    hp_porta65_title: "Triagem Porta 65 Jovem",
    hp_porta65_pre_pass: "✓ Pré-Aprovado",
    hp_porta65_rejected: "Rejeitado na Triagem",
    hp_porta65_rma_label: "RMA Concelhia",
    hp_porta65_cap_rma: "Teto 4× RMA Concelho:",
    hp_porta65_cap_rmmg: "Teto 4× RMMG 2026:",
    hp_porta65_gross_effort: "Esforço Bruto (máx. 60%):",
    hp_effort_rate_title: "Taxa de Esforço Habitacional MIRA",
    hp_effort_mira_guide: "≤35% Diretriz Prudencial MIRA",
    hp_effort_critical_risk: ">50% Risco Crítico",
    hp_buy_inputs_title: "Dados do Imóvel & Financiamento",
    hp_buy_price_label: "🏷️ Preço de Aquisição do Imóvel (€)",
    hp_appraisal_label: "🔍 Valor de Avaliação Bancária (€)",
    hp_appraisal_help: "O Banco de Portugal exige o cálculo sobre min(preço, avaliação).",
    hp_own_capital_label: "💰 Capitais Próprios Disponíveis (€)",
    hp_buyer_net_income_label: "💳 Rendimento Líquido do Agregado (€)",
    hp_other_debts_label: "🧾 Outras Prestações / Créditos Atuais (€)",
    hp_first_hpp_toggle: "1.ª Habitação Própria Permanente (HPP)",
    hp_owns_prop_toggle: "É atualmente proprietário de habitação?",
    hp_owns_last3y_toggle: "Foi proprietário nos últimos 3 anos? (IMT Jovem)",
    hp_financing_title: "Enquadramento de Financiamento",
    hp_financing_sub: "LTV, Financiamento & Prestação Mensal",
    hp_max_ltv: "LTV Máx:",
    hp_eligible_base: "Base Elegível min(P,A)",
    hp_price_vs_appraisal: "Preço vs Avaliação",
    hp_loan_amount: "Montante Financiado",
    hp_effective_ltv: "LTV Efetivo:",
    hp_monthly_mortgage: "Prestação Estimada",
    hp_bdp_regulated_years: "anos (Regulado BdP)",
    hp_imt_jovem_title: "IMT Jovem (DL 48-A/2024)",
    hp_imt_jovem_applied: "✓ Isenção Aplicada",
    hp_imt_jovem_normal: "Tributação Normal",
    hp_imt_tax_suffix: "de IMT",
    hp_imt_jovem_savings: "Poupança de IMT:",
    hp_stamp_duty_savings: "Poupança Imposto de Selo:",
    hp_imt_jovem_legal_basis: "Regime fiscal de 2026 ancorado no Ofício-Circulado n.º 40019/2024 da AT. Isenção total até 316.772 € e parcial até 633.453 €.",
    hp_guarantee_title: "Garantia Pública (DL 44/2024)",
    hp_guarantee_eligible: "✓ Elegível",
    hp_guarantee_ineligible: "Inelegível",
    hp_guarantee_explanation: "Garantia pessoal do Estado até 15% de min(preço, avaliação), permitindo financiamento bancário até 100% em transações até 450.000 €.",
    hp_total_initial_capital: "Capital Inicial Total Estimado",
    hp_downpayment_taxes_notary: "Entrada + Impostos + Notário",
    aima_diag_title: "Diagnóstico AIMA & Saúde Financeira 2026",
    aima_diag_subtitle: "Verifica se o seu rendimento cumpre os limiares mínimos exigidos para a Autorização de Residência em Portugal",
    aima_portaria_badge: "Portaria 1563/2007 de 11/12",
    aima_lei_badge: "Lei 23/2007 — Lei Estrangeiros",
    aima_rmmg_badge: "RMMG 2026: 920€ / mês",
    aima_data_title: "Os Seus Dados de Rendimento",
    aima_data_sub: "Preencha os campos com os seus valores reais para verificar o cumprimento AIMA",
    aima_net_label: "💰 Rendimento Líquido Mensal (€)",
    aima_net_help: "O valor que recebe na conta após todos os descontos de SS e IRS.",
    aima_dep_label: "👨‍👩‍👧 Nº de Dependentes no Agregado",
    aima_dep_help: "Cônjuge sem rendimentos, filhos menores ou ascendentes a cargo.",
    aima_no_dep: "(Sem dependentes)",
    aima_one_dep: "dependente",
    aima_multi_dep: "dependentes",
    aima_rent_label: "🏠 Renda Mensal (€)",
    aima_rent_help: "Valor pago por mês pela habitação.",
    aima_exp_label: "🛒 Total de Despesas Mensais (€)",
    aima_exp_help: "Inclui renda + alimentação + transportes + utilidades.",
    aima_ss_label: "🛡️ Nível de Contribuição Registado na Segurança Social (ISS)",
    aima_ss_help: "O regime e valor que declara mensalmente no seu extrato da Segurança Social.",
    aima_ss_outrem: "Trabalhador por Conta de Outrem (Desconto integral 11% sobre Salário Bruto)",
    aima_ss_recibos: "Recibos Verdes Geral (21,4% SS sobre 70% Faturação Real)",
    aima_ss_reduced: "Recibos Verdes com Opção de Redução de Base (-25%)",
    aima_ss_min: "⚠️ Contribuição Mínima Simbólica (20€ / mês)",
    aima_res_title: "Resultados do Diagnóstico AIMA",
    aima_viability_index: "Índice de Viabilidade AIMA",
    aima_score_high: "🟢 Excelente & Sustentável",
    aima_score_med: "🟡 Estável com Atenção",
    aima_score_low: "🔴 Risco de Notificação / Indeferimento",
    aima_est_ss: "Retenção SS Estimada",
    aima_ss_alert_title: "⚠️ Alerta de Risco Grave AIMA: Discrepância na Segurança Social",
    aima_ss_alert_desc: "A AIMA cruza os extratos de remuneração da Segurança Social (ISS) em tempo real. Declarar um rendimento para cumprir o limiar de subsistência, mas contribuir apenas o mínimo simbólico (20€/mês) ou forçar a redução de -25%, gera uma incoerência fiscal grave. A AIMA presume ausência de rendimentos reais e emite Intenção de Indeferimento (Audiência Prévia).",
    aima_legal_subsistence_check: "Verificação de Subsistência Legal AIMA",
    aima_meets_threshold: "✓ Cumpre Limiar Mínimo",
    aima_threshold_warn: "⚠️ Atenção / Risco de Incoerência",
    aima_net_income: "Rendimento Líquido",
    per_month: "por mês",
    aima_min_threshold: "Limiar Mínimo AIMA",
    difference: "Diferença",
    above_threshold: "acima do limiar",
    below_threshold: "abaixo do limiar",
    aima_legal_basis_note: "Segundo a Portaria n.º 1563/2007 de 11 de Dezembro, os meios de subsistência exigidos para concessão e renovação de Autorização de Residência são calculados com base no Retribuição Mínima Mensal Garantida (RMMG 2026 = 920€): 100% RMMG (920€) para o primeiro adulto + 30% RMMG (276€) por cada dependente adicional (cônjuge sem rendimentos, filhos menores ou ascendentes a cargo).",
    aima_net_balance: "Saldo Mensal Disponível",
    aima_income_minus_expenses: "Rendimento − Total Despesas",
    aima_recommended_stability: "Recomendado para estabilidade",
    aima_setup_capital_title: "Capital Entrada Arrendamento",
    aima_setup_capital_desc: "2 Cauções + 1 Renda Adiantada",
    pe_sim_title: "Simulador para Pequenos Empreendedores & Microempresas",
    pe_sim_subtitle: "Estimativa de rentabilidade, impostos (IRC 15% PME / IRS Simplificado) e liquidez para ENI e Sociedade Unipessoal Lda (2026)",
    pe_badge_irc: "IRC Reduzido PME: 15.0% (1.ºs 50k€)",
    pe_badge_tsu: "Gerente MOE: TSU 34.75%",
    pe_badge_breakeven: "Break-Even Automático",
    pe_form_title: "Dados Financeiros da Empresa / Negócio",
    pe_revenue_label: "💰 Faturação Mensal Bruta (Volume de Negócios) (€)",
    pe_revenue_help: "Total cobrado a clientes por mês (sem IVA).",
    pe_expenses_label: "📦 Despesas Operacionais Mensais (€)",
    pe_expenses_help: "Renda de espaço, fornecedores, contabilista, licenças, utilidades.",
    pe_sector_label: "🏷️ Setor de Atividade",
    pe_opt_services: "Prestação de Serviços / Tecnologia (Coef. 0.75)",
    pe_opt_commerce: "Comércio / Lojas / Restauração (Coef. 0.15)",
    pe_opt_hospitality: "Alojamento Local / Turismo (Coef. 0.35)",
    pe_opt_industry: "Indústria / Oficina / Artesanato (Coef. 0.35)",
    pe_structure_label: "🏛️ Estrutura Jurídica da Empresa",
    pe_opt_lda: "Sociedade Unipessoal Lda / Microempresa PME (IRC 15%)",
    pe_opt_eni: "Empresário em Nome Individual — ENI (IRS Simplificado)",
    pe_prolabore_label: "👔 Pró-Labore / Salário do Gerente (€/mês)",
    pe_prolabore_help: "Remuneração mensal fixa atribuída ao sócio-gerente (sujeita a TSU de 34,75% — Art. 69.º CRC).",
    pe_res_title: "Resultado Financeiro do Negócio",
    pe_margin_label: "Margem Líquida",
    pe_net_profit_title: "Lucro Líquido Mensal Disponível da Empresa",
    pe_net_profit_calc: "Faturação Mensal ({bizRevenue}€) − Despesas ({bizExpenses}€) − Impostos/SS ({res.totalTaxes}€)",
    pe_gross_op_profit: "Lucro Bruto Operacional",
    pe_before_taxes: "Antes de impostos e SS",
    pe_estimated_taxes: "Impostos Estimados",
    pe_tax_label_irc: "IRC 15% PME",
    pe_tax_label_irs: "IRS Simplificado",
    pe_ss_tsu_label: "Segurança Social / TSU",
    pe_ss_label_tsu: "TSU MOE (34,75%)",
    pe_ss_label_eni: "SS ENI (25,2%)",
    pe_breakeven_title: "Ponto de Equilíbrio (Break-Even Mensal)",
    pe_breakeven_sub: "Faturação mínima necessária por mês para cobrir todas as despesas e impostos sem prejuízo",
    pe_edu_note: "Em Portugal, as PMEs qualificadas no continente beneficiam de uma taxa reduzida de IRC de 15,0% sobre os primeiros 50.000€ de matéria coletável e 19,0% no excedente (Art. 87.º CIRC / OE 2026). Os gerentes de Sociedades Unipessoais descontam TSU estatutária de 34,75% (23,75% empresa + 11,0% gerente — Art. 69.º, n.º 2 CRC) sobre a remuneração fixada.",
    badge_at: "AT (IRS 2026)",
    badge_ine: "INE (Preços Rendas)",
    badge_iss: "ISS (Seg. Social TI)",
    badge_bdp: "Banco de Portugal",
    title: 'Simuladores MIRA Económicos',
    subtitle: 'Métricas e Indicadores Financeiros Oficiais (2026)',
    tab_1_salary: '💰 1. Salário Líquido',
    tab_2_recibos: '💼 2. Recibos Verdes',
    tab_3_ss: '🛡️ 3. Seg. Social (TI)',
    tab_4_reforma: '🏛️ 4. Reforma & CSI',
    tab_5_cost: '🗺️ 5. Custo de Vida',
    tab_6_housing: '🏠 6. Habitação',
    tab_7_aima: '🩺 7. Requisitos AIMA',
    tab_8_business: '🏢 8. Empreendedor',
    tab_salary: 'Salário Líquido',
    tab_cost: 'Custo de Vida',
    tab_health: 'Saúde Financeira',
    work_regime: 'Regime de Trabalho',
    conta_outrem: 'Trabalhador por Conta de Outrem (Contrato)',
    recibos_verdes: 'Recibos Verdes (Trabalhador Independente)',
    gross_salary: 'Salário Bruto Mensal',
    invoice_monthly: 'Faturação Mensal Ilíquida (Bruta)',
    activity_type: 'Tipo de Atividade',
    service_provision: 'Prestação de Serviços (70% Base SS / 23% IRS Art. 151.º)',
    product_sales: 'Venda de Produtos / Restauração (20% Base SS / Sem Retenção IRS)',
    scientific_activity: 'Atividades Científicas/Artísticas (70% Base SS / 16.5% IRS)',
    irs_withholding: 'Retenção na Fonte de IRS',
    irs_normal: 'Retenção Normal de IRS (Art. 101.º CIRS)',
    irs_exempt_101b: 'Isenção de Retenção (Art. 101.º-B CIRS até 15.000€/ano)',
    ss_regime: 'Regime de Segurança Social',
    ss_normal: 'Trabalhador Independente Geral (21,4%)',
    ss_eni: 'Empresário em Nome Individual - ENI (25,2%)',
    ss_exempt_year1: 'Isenção no 1.º Ano de Atividade (0%)',
    ss_variation: 'Ajuste Trimestral de Base (SS)',
    ss_var_0: 'Manter Base Padrão (0%)',
    ss_var_minus25: 'Opção de Reduzir Base (-25%)',
    ss_var_plus25: 'Opção de Aumentar Base (+25%)',
    family_status: 'Situação Familiar',
    single: 'Não Casado / Solteiro / Divorciado',
    married_1: 'Casado (1 Titular)',
    married_2: 'Casado (2 Titulares)',
    dependents: 'Número de Dependentes',
    region: 'Região Fiscal',
    continent: 'Portugal Continental',
    madeira: 'Região Aut. da Madeira (Tabelas Regionais 2026)',
    azores: 'Região Aut. dos Açores (Despacho n.º 1179/2026)',
    irs_jovem: 'Regime IRS Jovem (Art. 12.º-B CIRS)',
    irs_jovem_active: 'Aplicar Benefício IRS Jovem (18-35 Anos)',
    irs_jovem_year: 'Ano do Benefício',
    year_1: '1.º Ano (100% Isenção)',
    years_2_4: '2.º ao 4.º Ano (75% Isenção)',
    years_5_7: '5.º ao 7.º Ano (50% Isenção)',
    years_8_10: '8.º ao 10.º Ano (25% Isenção)',
    meal_allowance: 'Subsídio de Alimentação (Diário)',
    meal_type: 'Método de Pagamento',
    cash: 'Dinheiro / Transferência (Teto Isento 6,15€)',
    card: 'Cartão de Refeição (Teto Isento 10,46€)',
    duodecimos_title: 'Regime de Duodécimos (Subsídios de Férias e Natal)',
    duodecimos_none: 'Sem Duodécimos (Padrão 14 Meses)',
    duodecimos_half_vac: '50% Subsídio de Férias em 12 Meses',
    duodecimos_half_xmas: '50% Subsídio de Natal em 12 Meses',
    duodecimos_half_both: '50% de Férias e Natal em 12 Meses',
    duodecimos_full_both: '100% de Ambos os Subsídios (12 Meses)',
    employer_cost_title: 'Custo Total para a Entidade Empregadora',
    tsu_company: 'TSU Patronal (23,75%)',
    irs_jovem_badge_saved: 'Desconto IRS Jovem (Poupado)',
    meal_taxable_warning: 'Atenção: O excedente diário de subsídio de refeição sofrerá retenção de 11% de Segurança Social e IRS.',
    work_days: 'Dias de Trabalho (Mês)',
    results: 'Resultados da Simulação',
    net_salary_total: 'Salário Líquido Mensal Estimado',
    net_income_recibos: 'Rendimento Líquido Mensal Disponível',
    deductions: 'Retenções e Contribuições Oficiais',
    social_security: 'Segurança Social (TI 21.4% / 70% Base)',
    irs: 'Retenção na Fonte (IRS 2026)',
    meal_taxed: 'Alimentação Tributado',
    meal_exempt: 'Alimentação Isento',
    total_tax_load: 'Carga Fiscal Total Efetiva',
    effective_rate: 'Taxa Efetiva de Imposto',
    district: 'Distrito de Destino',
    housing: 'Tipo de Alojamento',
    shared_room: 'Quarto Partilhado',
    t1_apartment: 'Apartamento T1',
    t2_apartment: 'Apartamento T2',
    food_style: 'Estilo de Alimentação',
    cook_home: 'Cozinhar em Casa (Económico)',
    mixed: 'Estilo Misto (Equilibrado)',
    eat_out: 'Comer Fora (Frequente)',
    transport: 'Transporte e Mobilidade',
    public_pass: 'Passe de Transportes Públicos',
    own_car: 'Carro Próprio (Combustível + Manut.)',
    utilities_leisure: 'Utilidades e Lazer',
    utilities_basic: 'Básico (Água, Luz, Net, Gás)',
    utilities_active: 'Ativo (Utilidades + Lazer/Restaurantes)',
    monthly_budget: 'Orçamento Mensal Estimado',
    comparison: 'Comparador de Distritos',
    compare_with: 'Comparar com outro Distrito',
    no_compare: 'Nenhum (Visualização Única)',
    cost_housing: 'Alojamento (Renda Média INE)',
    cost_food: 'Alimentação',
    cost_transport: 'Transportes',
    cost_utilities: 'Utilidades e Extras',
    cost_total: 'Custo Total Estimado',
    savings_calc: 'Diferença Mensal Estimada',
    savings_text: 'Ao escolher {d1} em vez de {d2}, pode poupar cerca de {val}€ por mês!',
    note_title: 'Fontes Oficiais Verificadas',
    note_text: 'Cálculos atualizados de acordo com as Tabelas Oficiais da AT (IRS 2026), Código dos Regimes Contributivos da SS (11% Outrem / TI 21.4% / 70% Incidência), Estatísticas do INE e Recomendações do Banco de Portugal.',
    cap_notice: 'A isenção fiscal do subsídio de refeição em 2026 é de até 6,00€/dia em dinheiro ou 9,60€/dia em cartão.',
    active_comparison: 'Comparação Ativa',
    housing_search_title: 'Pesquisar Imóveis nos Portais Oficiais',
    housing_search_sub: 'Verifique ofertas em tempo real nos portais de habitação verificados:',
    household_size: 'Agregado Familiar',
    person: 'Pessoa',
    people: 'Pessoas',
    utilities_per_person: 'Por pessoa: {val}€',
    
    effort_rate_title: 'Taxa de Esforço com Habitação',
    effort_rate_sub: 'Proporção da renda face ao salário líquido (Recomendação Banco de Portugal)',
    effort_healthy: 'Saudável (<= 35%)',
    effort_warning: 'Alerta / Esforço Moderado (36% - 50%)',
    effort_critical: 'Risco Elevado (> 50%)',
    net_surplus: 'Folga Financeira Mensal',
    net_deficit: 'Défice Mensal Estimado',
    setup_budget_title: 'Capital de Instalação Recomendado',
    setup_budget_sub: '2 Meses de Renda + 1 Mês Caução (Art. 1076.º C. Civil) + 3 Meses de Custos',
    emergency_fund_title: 'Fundo de Emergência Recomendado',
    emergency_fund_sub: '3 Meses de despesas de sobrevivência segundo o Banco de Portugal',
    rv_guide_badge: "Manual Prático & Legislação 2026",
    rv_guide_title: "Como Escolher o Seu Regime Contributivo & Segurança Social",
    rv_guide_subtitle: "Guia oficial detalhado para saber exatamente qual opção selecionar para a sua atividade independente em Portugal.",
    rv_sec_ss_title: "1. Regimes de Segurança Social: Qual deve escolher?",
    rv_ss_ti_name: "Trabalhador Independente Geral (21,4%)",
    rv_ss_ti_who: "Para quem é:",
    rv_ss_ti_who_desc: "A grande maioria dos freelancers, prestadores de serviços, consultores, designers, programadores e trabalhadores por conta própria.",
    rv_ss_ti_how: "Como funciona o cálculo:",
    rv_ss_ti_how_desc: "A taxa de 21,4% incide sobre 70% da média de faturação do trimestre anterior declarada na Segurança Social Direta. Por exemplo: faturando 1.000€/mês, a base de incidência é 700€, pagando 149,80€ de contribuição mensal.",
    rv_ss_eni_name: "Empresário em Nome Individual - ENI (25,2%)",
    rv_ss_eni_who: "Para quem é:",
    rv_ss_eni_who_desc: "Pessoas com negócio próprio comercial ou industrial com estabelecimento aberto em nome individual (não em sociedade).",
    rv_ss_eni_how: "Como funciona o cálculo:",
    rv_ss_eni_how_desc: "A taxa é de 25,2% sobre a base de incidência contributiva regulamentar.",
    rv_ss_exempt_name: "Isenção no 1.º Ano de Atividade (Art. 157.º do CRC)",
    rv_ss_exempt_who: "Para quem é:",
    rv_ss_exempt_who_desc: "Cidadãos que abrem atividade independente pela primeira vez na vida em Portugal.",
    rv_ss_exempt_how: "Como funciona:",
    rv_ss_exempt_how_desc: "Fica 100% isento do pagamento de Segurança Social durante os primeiros 12 meses de atividade (paga 0€/mês). Se já teve atividade aberta anteriormente, este benefício não é renovado.",
    rv_sec_var_title: "2. Ajuste Trimestral da Base da SS (-25% / 0% / +25%)",
    rv_var_sub: "Na entrega da Declaração Trimestral na Segurança Social Direta, pode optar por ajustar a base:",
    rv_var_0_name: "Manter Base Padrão (0% Variação)",
    rv_var_0_desc: "Paga a contribuição exata calculada a partir da faturação real dos 3 meses anteriores.",
    rv_var_minus_name: "Opção de Redução de Base (-25%)",
    rv_var_minus_desc: "Reduz em 25% a sua contribuição mensal para aliviar a liquidez em meses com menor faturação. ⚠️ Atenção: reduz proporcionalmente o valor de subsídios de doença, licença parental e pensão de reforma futura.",
    rv_var_plus_name: "Opção de Aumento de Base (+25%)",
    rv_var_plus_desc: "Aumenta em 25% a sua contribuição mensal. Ideal para quem planeia ter filhos (aumenta o subsídio parental) ou deseja acumular maior proteção para a reforma e baixas médicas.",
    rv_sec_act_title: "3. Tipo de Atividade e Coeficientes Fiscais",
    rv_act_services_name: "Prestação de Serviços em Geral (Art. 151.º CIRS)",
    rv_act_services_desc: "No regime simplificado, o fisco considera que 75% da faturação é rendimento tributável e 25% são despesas assumidas. Na Segurança Social, a base é de 70%. A retenção na fonte padrão em fatura é de 25% (ou 16,5%).",
    rv_act_scientific_name: "Atividades Científicas, Técnicas e Artísticas",
    rv_act_scientific_desc: "Engenheiros, arquitetos, médicos, artistas e técnicos especializados. Aplica-se retenção na fonte entre 20% e 25% sobre o rendimento de Categoria B.",
    rv_act_products_name: "Venda de Mercadorias e Produtos / Restauração",
    rv_act_products_desc: "Para quem comercializa produtos físicos. A incidência na Segurança Social é de apenas 20% e no IRS simplificado é de 15%, sem obrigação de retenção na fonte em fatura.",
    rv_sec_wh_title: "4. Retenção na Fonte de IRS: Normal vs Isenção",
    rv_wh_normal_name: "Retenção na Fonte Normal de IRS",
    rv_wh_normal_desc: "Obrigatória ao emitir recibos verdes para empresas ou entidades com contabilidade organizada. O cliente desconta o imposto na fatura e entrega diretamente à Autoridade Tributária.",
    rv_wh_exempt_name: "Dispensa de Retenção (Art. 101.º-B até 15.000€/ano)",
    rv_wh_exempt_desc: "Se estima faturar menos de 15.000€ em 2026 e não tem outros rendimentos de Cat. B, pode emitir faturas sem retenção. ⚠️ O imposto não é perdoado: será apurado e liquidado no acerto anual de IRS (Modelo 3).",
    rv_sec_jovem_title: "5. IRS Jovem para Recibos Verdes (Art. 12.º-B CIRS)",
    rv_sec_jovem_desc: "Jovens até 35 anos com ensino secundário ou superior concluído têm isenção progressiva de IRS: 100% no 1.º ano, 75% nos anos 2-4, 50% nos anos 5-7 e 25% nos anos 8-10.",
    so_guide_badge: "Guia Laboral & Fiscal 2026",
    so_guide_title: "Como Funciona o Seu Salário Líquido (Trabalho por Conta de Outrem)",
    so_guide_subtitle: "Entenda detalhadamente cada desconto de Segurança Social, retenção de IRS e benefícios do seu contrato de trabalho em Portugal.",
    so_sec_ss_title: "1. Segurança Social do Trabalhador (11% + 23,75% Empresa)",
    so_ss_worker_name: "Desconto do Trabalhador (11%)",
    so_ss_worker_desc: "É descontado automaticamente do seu salário bruto. Garante o seu direito a subsídio de desemprego, baixa por doença, licença de maternidade/paternidade e pensão de reforma.",
    so_ss_company_name: "TSU da Entidade Empregadora (23,75%)",
    so_ss_company_desc: "É paga diretamente pela empresa à Segurança Social (não sai do seu salário líquido). Representa o custo global de proteção social suportado pela entidade patronal.",
    so_sec_irs_title: "2. Retenção na Fonte de IRS & Acerto Anual",
    so_irs_desc: "As tabelas de IRS da Autoridade Tributária definem a percentagem retida a cada mês. Em abril/junho do ano seguinte, na entrega do Modelo 3 de IRS, o Estado faz o acerto final: se descontou a mais, recebe reembolso; se descontou a menos, paga a diferença.",
    so_sec_meal_title: "3. Subsídio de Alimentação (Cartão vs Dinheiro)",
    so_meal_card_name: "Cartão de Refeição (Teto Isento: 9,60€/dia)",
    so_meal_card_desc: "Até 9,60€ por dia útil pago em cartão de refeição está 100% livre de IRS e Segurança Social. É a forma mais vantajosa para aumentar o salário líquido.",
    so_meal_cash_name: "Dinheiro / Transferência (Teto Isento: 6,00€/dia)",
    so_meal_cash_desc: "Se o subsídio for pago em dinheiro na conta, o limite livre de impostos é de apenas 6,00€/dia. Qualquer valor acima é tributado como salário normal.",
    so_sec_jovem_title: "4. Benefício IRS Jovem (Art. 12.º-B CIRS)",
    so_sec_jovem_desc: "Trabalhadores até 35 anos com ensino secundário ou superior usufruem de isenção de IRS durante 10 anos: 100% no 1.º ano, 75% nos anos 2-4, 50% nos anos 5-7 e 25% nos anos 8-10.",
    so_sec_family_title: "5. Família, Dependentes & Regiões Autónomas",
    so_family_desc: "O número de dependentes e a situação de casado com 1 ou 2 titulares reduzem a taxa de retenção na fonte. Residentes fiscais na Madeira têm -20% de IRS e nos Açores -30%.",
    pe_guide_badge: "Manual Empresarial & Fiscal 2026",
    pe_guide_title: "Guia Estratégico para Pequenos Empreendedores & Microempresas",
    pe_guide_subtitle: "Como escolher entre Empresa Individual (ENI) e Sociedade Lda, otimizar impostos e calcular a rentabilidade real do seu negócio.",
    pe_sec_legal_title: "1. Estrutura Jurídica: ENI vs Sociedade Unipessoal Lda",
    pe_legal_lda_name: "Sociedade Unipessoal Lda / PME (Recomendado)",
    pe_legal_lda_desc: "Responsabilidade limitada ao capital social (mínimo 1€). O seu património pessoal (casa, carro, poupanças) fica 100% protegido contra dívidas da empresa. Paga IRC com taxa reduzida de 12,5% até 50.000€ de matéria coletável.",
    pe_legal_eni_name: "Empresário em Nome Individual - ENI",
    pe_legal_eni_desc: "Abertura simples e sem capital obrigatório, mas a responsabilidade é ilimitada: os seus bens pessoais respondem por todas as dívidas do negócio. Tributado em IRS simplificado.",
    pe_sec_remun_title: "2. Remuneração do Gerente (Pró-Labore) vs Lucros",
    pe_remun_moe_name: "Salário de Gerente (MOE - TSU 33,05%)",
    pe_remun_moe_desc: "O gerente fixa um salário mensal sobre o qual incide TSU de 33,05% (23,75% empresa + 9,3% gerente), garantindo proteção social oficial.",
    pe_remun_profit_name: "Distribuição de Dividendos / Lucros",
    pe_remun_profit_desc: "O lucro líquido após pagamento de IRC pode ser distribuído ao sócio com taxa autónoma de 28% no IRS (ou englobamento favorável).",
    pe_sec_sector_title: "3. Setores & Coeficientes de Tributação Simplificada",
    pe_sector_services_name: "Serviços e Tecnologia (Coeficiente 0.75)",
    pe_sector_services_desc: "O fisco tributa 75% da faturação e assume 25% em despesas de atividade.",
    pe_sector_commerce_name: "Comércio e Restauração (Coeficiente 0.15)",
    pe_sector_commerce_desc: "Tributação sobre apenas 15% do volume de negócios, refletindo margens comerciais.",
    pe_sector_tourism_name: "Alojamento Local e Indústria (Coeficiente 0.35)",
    pe_sector_tourism_desc: "Tributação sobre 35% da faturação em alojamento turístico e oficinas.",
    pe_sec_iva_title: "4. IVA e Regime de Isenção (Artigo 53.º do CIVA)",
    pe_iva_desc: "Empresas com faturação anual inferior a 15.000€ (em 2026) podem optar pelo regime de isenção do Artigo 53.º, sem cobrar nem deduzir IVA nas faturas.",
    pe_sec_breakeven_title: "5. Ponto de Equilíbrio (Break-Even Point)",
    pe_breakeven_desc: "Representa o valor mensal mínimo que a sua empresa tem de faturar para cobrir exatamente todas as despesas operacionais, salários e impostos sem entrar em prejuízo financeiro.",
  },
  EN: {
    adults_label: "Adults (≥ 18 years)",
    youth_label: "Youth (14 to 17 years)",
    children_label: "Children (< 14 years)",
    telecom: "Telecommunications (Fiber + Mobile)",
    health_personal: "Health, Hygiene & Personal Care",
    provenance_badge: "MIRA Market Benchmark 2026 (INE m² + Official Portals)",
    mira_financial_health: "Financial Sufficiency & MIRA Prudence Indicators",
    legal_subsistence_title: "General Legal Reference Ordinance 1563/2007",
    reference_label: "Reference:",
    use_net_salary: "Use Calculated Net Salary",
    rail_pass: "Green Rail Pass (CP - €20)",
    t0_apartment: "Studio / T0 Apartment",
    t3_apartment: "T3 Apartment (Family)",
    room_single: "Single Room (Private Room)",
    t4_apartment: "T4 Apartment or Larger (T4+)",
    ocde_scale_label: "OECD Scale:",
    ocde_scale_sub: "Family equivalence factor",
    applied_food_utilities: "applied to food and utility costs.",
    portaria_formula_label: "Theoretical Formula of Ordinance:",
    governance_note_title: "Governance & Legal Shielding Note:",
    household_net_income: "Household Monthly Net Available Income (€)",
    effort_sustainable_tag: "Sustainable (≤ 35%)",
    effort_moderate_tag: "Moderate Risk (36-50%)",
    effort_critical_tag: "Critical Overburden (> 50%)",
    effort_rate_housing: "Housing Effort Rate",
    rent_vs_income_label: "Rent ({rent}€) vs Net Income ({income}€)",
    estimated_monthly_balance: "Estimated Monthly Balance",
    deficit_estimated_desc: "Estimated monthly deficit in district",
    savings_margin_desc: "Monthly savings margin",
    mira_recommended_reserve: "Recommended MIRA Reserve",
    reserve_target_desc: "6-month security target (3 months: {val3}€)",
    compare_off: "Off",
    placeholder_ex_from_tab1: "Ex: {val}€ (from Tab 1)",
    placeholder_ex_1500: "Ex: 1500",
    so_sim_title: "Net Salary Simulator (Employed / Standard Contract)",
    so_sim_subtitle: "Calculations based on 2026 official AT withholding tables & Social Security (11%)",
    duodecimos_badge_13_14: "13th & 14th Month",
    irs_jovem_desc_field: "Partial exemption for first 10 years of activity (up to 35 years). Annual cap: 55 × IAS (€29,542.15).",
    irs_jovem_y1: "1st Year",
    irs_jovem_y2_4: "2nd–4th Years",
    irs_jovem_y5_7: "5th–7th Years",
    irs_jovem_y8_10: "8th–10th Years",
    irs_jovem_opt_1: "1st Year (100% Exemption)",
    irs_jovem_opt_2: "2nd Year (75% Exemption)",
    irs_jovem_opt_3: "3rd Year (75% Exemption)",
    irs_jovem_opt_4: "4th Year (75% Exemption)",
    irs_jovem_opt_5: "5th Year (50% Exemption)",
    irs_jovem_opt_6: "6th Year (50% Exemption)",
    irs_jovem_opt_7: "7th Year (50% Exemption)",
    irs_jovem_opt_8: "8th Year (25% Exemption)",
    irs_jovem_opt_9: "9th Year (25% Exemption)",
    irs_jovem_opt_10: "10th Year (25% Exemption)",
    meal_taxable_alert: "Warning: Taxable Meal Allowance",
    meal_taxable_sub: "The daily excess of {excess}€/day (above the tax-exempt cap of {cap}) will be subject to 11% Social Security and IRS withholding.",
    calc_result_2026: "Calculation Result (2026)",
    calc_result_title: "Calculation Result",
    effective_irs_rate: "Effective IRS Rate",
    effective_tax_rate: "Effective Tax Rate",
    net_income_available: "Monthly Available Net Income",
    payslip_breakdown: "Monthly Payslip Breakdown",
    remun_bruta_sujeita: "Gross Taxable Remuneration",
    duodecimo_vac_line: "• Holiday Allowance Duodecimo:",
    duodecimo_xmas_line: "• Christmas Allowance Duodecimo:",
    ss_worker_11: "Worker Social Security (11%)",
    irs_withholding_line: "IRS Withholding Tax",
    meal_exempt_line: "Tax-Exempt Meal Allowance",
    meal_taxed_line: "Taxable Meal Allowance (in gross)",
    salary_legal_basis_note: "Calculated under the Official Marginal Model of the Portuguese Tax Authority (2026), Social Security TCO (11%) and meal allowance thresholds (Ordinance 51-B/2026: exempt up to €10.46/day on card or €6.15 in cash).",
    rv_sim_title: "Green Receipts Simulator (Sole Proprietor / Freelancer)",
    rv_sim_subtitle: "Social Security (21.4% on 70% base) & Category B IRS withholding calculation",
    rv_irs_jovem_title: "Youth IRS (Art. 12-B CIRS) for Category B",
    rv_irs_jovem_desc: "Applicable to self-employed workers under 35 with higher education degree.",
    rv_deductions_title: "Deductions & Withholdings",
    ss_ti_line: "Social Security (21.4% on 70% Base)",
    ss_var_0_short: "0% Standard",
    rv_legal_note: "Green Receipts calculate Social Security on 70% of gross services revenue (or 20% on product sales) at 21.4% (General Self-Employed) or 25.2% (ENI).",
    hp_title: "MIRA Housing Intelligence & Affordability 2026",
    hp_subtitle: "Territorial Observatory (INE vs Portals) and Regulatory Rental & Purchase Simulators",
    hp_mode_rent: "🏠 Rental & Porta 65",
    hp_mode_buy: "🏦 Purchase & Mortgage Loan",
    hp_territory_label: "📍 Territorial Unit / Municipality",
    hp_municipality_tag: "(Municipality / Official INE)",
    hp_district_tag: "(District / MIRA Aggregate)",
    hp_typology_label: "📐 Housing Typology",
    hp_age_label: "🎂 Candidate Age (Years)",
    hp_buyer_age_label: "🎂 Oldest Borrower Age (Years)",
    hp_youth_guarantee_toggle: "Public Guarantee for Youth (DL 44/2024)",
    hp_rent_inputs_title: "Income & Lease Contract Details",
    hp_net_income_label: "💰 Net Monthly Available Income (€)",
    hp_net_income_help: "Used for effort rate and MIRA financial prudence.",
    hp_gross_income_label: "💼 Household Monthly Gross Income (€)",
    hp_gross_income_help: "Mandatory to verify gross effort rate ≤ 60% rule under Porta 65.",
    hp_rent_label: "🏠 Target Monthly Rent (€)",
    hp_rent_help: "Leave 0 or blank to use the official market benchmark.",
    hp_expenses_label: "🛒 Other Monthly Living Expenses (€)",
    hp_territorial_obs_title: "MIRA Territorial Observatory",
    hp_ine_contracted: "INE Contracted",
    hp_portals_asking: "Portals Asking",
    hp_asking_spread: "Asking Spread",
    hp_spread_help: "Landlord premium over new AT registered contracts",
    hp_initial_capital_title: "Initial Capital (Art. 1076 Civil Code)",
    hp_first_month_rent: "1st Month Rent Advance:",
    hp_advance_rent: "Rent Advance (up to 2 months):",
    hp_security_deposit: "Security Deposit (up to 2 months):",
    hp_cc1076_legal_note: "maximum statutory ceiling (5 rents total); not mandatory if landlord agrees to lower amount.",
    hp_porta65_title: "Porta 65 Youth Rental Screening",
    hp_porta65_pre_pass: "✓ Pre-Approved",
    hp_porta65_rejected: "Rejected in Screening",
    hp_porta65_rma_label: "Municipal RMA",
    hp_porta65_cap_rma: "Cap 4× Municipal RMA:",
    hp_porta65_cap_rmmg: "Cap 4× 2026 RMMG:",
    hp_porta65_gross_effort: "Gross Effort Rate (max 60%):",
    hp_effort_rate_title: "MIRA Housing Effort Rate",
    hp_effort_mira_guide: "≤35% MIRA Prudential Guideline",
    hp_effort_critical_risk: ">50% Critical Risk",
    hp_buy_inputs_title: "Property & Financing Data",
    hp_buy_price_label: "🏷️ Property Acquisition Price (€)",
    hp_appraisal_label: "🔍 Bank Appraisal Value (€)",
    hp_appraisal_help: "Banco de Portugal regulations mandate loan base as min(price, appraisal).",
    hp_own_capital_label: "💰 Available Down Payment Capital (€)",
    hp_buyer_net_income_label: "💳 Household Net Monthly Income (€)",
    hp_other_debts_label: "🧾 Other Current Loan Payments (€)",
    hp_first_hpp_toggle: "1st Permanent Own Residence (HPP)",
    hp_owns_prop_toggle: "Do you currently own a residential property?",
    hp_owns_last3y_toggle: "Have you owned property in the last 3 years? (Youth IMT)",
    hp_financing_title: "Mortgage Financing Framework",
    hp_financing_sub: "LTV, Loan Amount & Monthly Payment",
    hp_max_ltv: "Max LTV:",
    hp_eligible_base: "Eligible Base min(P,A)",
    hp_price_vs_appraisal: "Price vs Appraisal",
    hp_loan_amount: "Loan Amount",
    hp_effective_ltv: "Effective LTV:",
    hp_monthly_mortgage: "Estimated Monthly Payment",
    hp_bdp_regulated_years: "years (BdP Regulated)",
    hp_imt_jovem_title: "Youth IMT (DL 48-A/2024)",
    hp_imt_jovem_applied: "✓ Exemption Applied",
    hp_imt_jovem_normal: "Standard Taxation",
    hp_imt_tax_suffix: "IMT Tax",
    hp_imt_jovem_savings: "IMT Tax Savings:",
    hp_stamp_duty_savings: "Stamp Duty Savings:",
    hp_imt_jovem_legal_basis: "2026 tax framework anchored in AT Circular 40019/2024. Full exemption up to €316,772 and partial up to €633,453.",
    hp_guarantee_title: "State Public Guarantee (DL 44/2024)",
    hp_guarantee_eligible: "✓ Eligible",
    hp_guarantee_ineligible: "Ineligible",
    hp_guarantee_explanation: "State personal guarantee up to 15% of min(price, appraisal), enabling up to 100% bank financing on purchases up to €450,000.",
    hp_total_initial_capital: "Total Estimated Initial Capital",
    hp_downpayment_taxes_notary: "Down Payment + Taxes + Notary Fees",
    aima_diag_title: "AIMA Subsistence & Financial Health Diagnostics 2026",
    aima_diag_subtitle: "Verifies whether your income meets the statutory thresholds required for Portuguese Residence Permits",
    aima_portaria_badge: "Ordinance 1563/2007 of 11/12",
    aima_lei_badge: "Law 23/2007 — Foreigners Act",
    aima_rmmg_badge: "RMMG 2026: €920 / month",
    aima_data_title: "Your Income & Household Data",
    aima_data_sub: "Enter your actual figures to verify legal compliance with AIMA guidelines",
    aima_net_label: "💰 Net Monthly Income (€)",
    aima_net_help: "The actual net amount deposited in your account after all SS and IRS deductions.",
    aima_dep_label: "👨‍👩‍👧 Number of Dependents in Household",
    aima_dep_help: "Non-earning spouse, minor children, or dependent parents.",
    aima_no_dep: "(No dependents)",
    aima_one_dep: "dependent",
    aima_multi_dep: "dependents",
    aima_rent_label: "🏠 Monthly Rent (€)",
    aima_rent_help: "Monthly amount paid for housing lease.",
    aima_exp_label: "🛒 Total Monthly Living Expenses (€)",
    aima_exp_help: "Includes rent + food + transportation + utilities.",
    aima_ss_label: "🛡️ Social Security Contribution Level (ISS)",
    aima_ss_help: "The regime and amount reported monthly on your Social Security statement.",
    aima_ss_outrem: "Employed Contract (Full 11% deduction on Gross Salary)",
    aima_ss_recibos: "General Green Receipts (21.4% SS on 70% Real Billing)",
    aima_ss_reduced: "Green Receipts with Reduced Base Option (-25%)",
    aima_ss_min: "⚠️ Minimal Symbolic Contribution (€20 / month)",
    aima_res_title: "AIMA Diagnostic Results",
    aima_viability_index: "AIMA Viability Index",
    aima_score_high: "🟢 Excellent & Sustainable",
    aima_score_med: "🟡 Stable with Caution",
    aima_score_low: "🔴 Risk of Notice / Refusal",
    aima_est_ss: "Estimated SS Withholding",
    aima_ss_alert_title: "⚠️ Severe AIMA Risk Alert: Social Security Discrepancy",
    aima_ss_alert_desc: "AIMA crosses Social Security (ISS) remuneration statements in real-time. Declaring sufficient income for subsistence but only paying the minimum €20/month contribution or forcing -25% creates a severe fiscal inconsistency. AIMA presumes lack of genuine income and issues an Intention of Rejection.",
    aima_legal_subsistence_check: "AIMA Statutory Subsistence Verification",
    aima_meets_threshold: "✓ Meets Minimum Threshold",
    aima_threshold_warn: "⚠️ Warning / Inconsistency Risk",
    aima_net_income: "Net Income",
    per_month: "per month",
    aima_min_threshold: "AIMA Minimum Threshold",
    difference: "Difference",
    above_threshold: "above threshold",
    below_threshold: "below threshold",
    aima_legal_basis_note: "Under Ordinance no. 1563/2007 of December 11, the means of subsistence required for granting and renewing Residence Permits are computed from the Guaranteed Minimum Monthly Wage (RMMG 2026 = €920): 100% RMMG (€920) for the primary adult + 30% RMMG (€276) per additional dependent.",
    aima_net_balance: "Available Monthly Balance",
    aima_income_minus_expenses: "Income − Total Expenses",
    aima_recommended_stability: "Recommended for financial stability",
    aima_setup_capital_title: "Rental Move-In Capital",
    aima_setup_capital_desc: "2 Security Deposits + 1 Advance Rent",
    pe_sim_title: "Small Business & Entrepreneur Simulator",
    pe_sim_subtitle: "Profitability estimate, taxes (15% SME CIT / Simplified IRS), and cashflow for Sole Proprietors and Single-Member LLCs (2026)",
    pe_badge_irc: "Reduced SME CIT: 15.0% (1st €50k)",
    pe_badge_tsu: "MOE Manager: TSU 34.75%",
    pe_badge_breakeven: "Automatic Break-Even",
    pe_form_title: "Business Financial Figures",
    pe_revenue_label: "💰 Gross Monthly Turnover / Revenue (€)",
    pe_revenue_help: "Total billed to clients per month (excluding VAT).",
    pe_expenses_label: "📦 Monthly Operating Expenses (€)",
    pe_expenses_help: "Premises rent, suppliers, accountant, licenses, utilities.",
    pe_sector_label: "🏷️ Activity Sector",
    pe_opt_services: "Services Provision & Tech (Coeff. 0.75)",
    pe_opt_commerce: "Retail / Stores & Dining (Coeff. 0.15)",
    pe_opt_hospitality: "Short-Term Rentals & Tourism (Coeff. 0.35)",
    pe_opt_industry: "Manufacturing / Workshop / Crafts (Coeff. 0.35)",
    pe_structure_label: "🏛️ Legal Business Structure",
    pe_opt_lda: "Single-Member LLC / SME Company (15% CIT)",
    pe_opt_eni: "Sole Proprietor — ENI (Simplified IRS)",
    pe_prolabore_label: "👔 Manager Salary / Compensation (€/mo)",
    pe_prolabore_help: "Fixed monthly salary paid to managing partner (subject to 34.75% TSU — CRC Art. 69).",
    pe_res_title: "Business Financial Performance",
    pe_margin_label: "Net Margin",
    pe_net_profit_title: "Monthly Net Available Business Profit",
    pe_net_profit_calc: "Monthly Revenue ({bizRevenue}€) − Expenses ({bizExpenses}€) − Taxes/SS ({res.totalTaxes}€)",
    pe_gross_op_profit: "Gross Operating Profit",
    pe_before_taxes: "Before taxes and Social Security",
    pe_estimated_taxes: "Estimated Taxes",
    pe_tax_label_irc: "SME 15% CIT",
    pe_tax_label_irs: "Simplified IRS",
    pe_ss_tsu_label: "Social Security / TSU",
    pe_ss_label_tsu: "MOE TSU (34.75%)",
    pe_ss_label_eni: "Sole Proprietor SS (25.2%)",
    pe_breakeven_title: "Monthly Break-Even Point",
    pe_breakeven_sub: "Minimum monthly revenue required to cover all operating costs, salaries, and taxes without loss",
    pe_edu_note: "In Portugal, qualified mainland SMEs benefit from a reduced Corporate Income Tax (IRC) rate of 15.0% on the first €50,000 of taxable profit and 19.0% on the excess (CIRC Art. 87 / 2026 State Budget). Managing partners of single-member LLCs pay statutory 34.75% TSU (23.75% employer + 11.0% manager — CRC Art. 69(2)) on fixed remuneration.",
    badge_at: "AT (IRS 2026)",
    badge_ine: "INE (Rental Prices)",
    badge_iss: "ISS (Social Security TI)",
    badge_bdp: "Banco de Portugal",
    title: 'MIRA Economic Simulators',
    subtitle: 'Official Financial Metrics & Indicators (2026)',
    tab_1_salary: '💰 1. Net Salary',
    tab_2_recibos: '💼 2. Green Receipts',
    tab_3_ss: '🛡️ 3. Social Security',
    tab_4_reforma: '🏛️ 4. Pension & CSI',
    tab_5_cost: '🗺️ 5. Cost of Living',
    tab_6_housing: '🏠 6. Housing',
    tab_7_aima: '🩺 7. AIMA Health',
    tab_8_business: '🏢 8. Business',
    tab_salary: 'Net Income',
    tab_cost: 'Cost of Living',
    tab_health: 'Financial Health',
    work_regime: 'Work Regime',
    conta_outrem: 'Employed Staff (Contract)',
    recibos_verdes: 'Recibos Verdes (Freelancer / Independent)',
    gross_salary: 'Monthly Gross Salary',
    invoice_monthly: 'Monthly Gross Invoice Amount',
    activity_type: 'Activity Type',
    service_provision: 'Services Provision (70% SS Base / 23% Tax Art. 151)',
    product_sales: 'Product Sales / Dining (20% SS Base / Exempt Tax)',
    scientific_activity: 'Scientific/Artistic Activities (70% SS Base / 16.5% Tax)',
    irs_withholding: 'Income Tax Withholding (IRS)',
    irs_normal: 'Standard IRS Withholding (Art. 101 CIRS)',
    irs_exempt_101b: 'Tax Exemption (Art. 101-B CIRS up to €15,000/yr)',
    ss_regime: 'Social Security Regime',
    ss_normal: 'Standard Independent Worker (21.4%)',
    ss_eni: 'Sole Proprietorship - ENI (25.2%)',
    ss_exempt_year1: '1st Year Activity Exemption (0%)',
    ss_variation: 'Quarterly Base Adjustment (SS)',
    ss_var_0: 'Keep Standard Base (0%)',
    ss_var_minus25: 'Reduce Base Option (-25%)',
    ss_var_plus25: 'Increase Base Option (+25%)',
    family_status: 'Family Status',
    single: 'Single / Unmarried / Divorced',
    married_1: 'Married (1 Earner)',
    married_2: 'Married (2 Earners)',
    dependents: 'Number of Dependents',
    region: 'Tax Region',
    continent: 'Mainland Portugal',
    madeira: 'Madeira Aut. Region (Official Tables 2026)',
    azores: 'Azores Aut. Region (Order 1179/2026)',
    irs_jovem: 'IRS Jovem Regime (Art. 12-B CIRS)',
    irs_jovem_active: 'Apply IRS Jovem Benefit (Ages 18-35)',
    irs_jovem_year: 'Benefit Year',
    year_1: '1st Year (100% Exemption)',
    years_2_4: '2nd to 4th Year (75% Exemption)',
    years_5_7: '5th to 7th Year (50% Exemption)',
    years_8_10: '8th to 10th Year (25% Exemption)',
    meal_allowance: 'Meal Allowance (Daily)',
    meal_type: 'Payment Method',
    cash: 'Cash / Transfer (€6.15 Tax-Free Cap)',
    card: 'Meal Card (€10.46 Tax-Free Cap)',
    duodecimos_title: 'Holiday & Christmas Bonus Installments (Duodécimos)',
    duodecimos_none: 'Standard 14 Months (No Duodécimos)',
    duodecimos_half_vac: '50% Vacation Bonus across 12 Months',
    duodecimos_half_xmas: '50% Christmas Bonus across 12 Months',
    duodecimos_half_both: '50% of Both Bonuses across 12 Months',
    duodecimos_full_both: '100% of Both Bonuses across 12 Months',
    employer_cost_title: 'Total Cost to Employer',
    tsu_company: 'Employer Social Security (23.75%)',
    irs_jovem_badge_saved: 'IRS Jovem Benefit Saved',
    meal_taxable_warning: 'Warning: The daily meal allowance excess is subject to 11% Social Security and IRS tax.',
    work_days: 'Working Days (Month)',
    results: 'Simulation Results',
    net_salary_total: 'Estimated Monthly Net Salary',
    net_income_recibos: 'Estimated Net Monthly Income',
    deductions: 'Official Taxes & Contributions',
    social_security: 'Social Security (TI 21.4% / 70% Base)',
    irs: 'Withholding Tax (IRS 2026)',
    meal_taxed: 'Taxed Meal Allowance',
    meal_exempt: 'Tax-Free Meal Allowance',
    total_tax_load: 'Total Effective Tax Load',
    effective_rate: 'Effective Tax Rate',
    district: 'Target District',
    housing: 'Housing Type',
    shared_room: 'Shared Room',
    t1_apartment: 'T1 Apartment',
    t2_apartment: 'T2 Apartment',
    food_style: 'Food Style',
    cook_home: 'Cook at Home (Economy)',
    mixed: 'Mixed Style (Balanced)',
    eat_out: 'Eat Out (Frequent)',
    transport: 'Transport & Mobility',
    public_pass: 'Public Transport Pass',
    own_car: 'Own Car (Fuel + Maintenance)',
    utilities_leisure: 'Utilities & Leisure',
    utilities_basic: 'Basic (Water, Power, Net, Gas)',
    utilities_active: 'Active (Utilities + Dining/Leisure)',
    monthly_budget: 'Estimated Monthly Budget',
    comparison: 'District Comparison',
    compare_with: 'Compare with another District',
    no_compare: 'None (Single View)',
    cost_housing: 'Housing (INE Median Rent)',
    cost_food: 'Food',
    cost_transport: 'Transport',
    cost_utilities: 'Utilities & Extras',
    cost_total: 'Estimated Total Cost',
    savings_calc: 'Estimated Monthly Savings',
    savings_text: 'By choosing {d1} instead of {d2}, you could save about {val}€ per month!',
    note_title: 'Verified Official Sources',
    note_text: 'Calculations updated according to Tax Authority Official Tables (AT 2026), Social Security Code (11% employee / TI 21.4% / 70% base), INE Rent Statistics, and Banco de Portugal Effort Rate Recommendations.',
    cap_notice: 'The meal allowance tax exemption in 2026 is up to €6.00/day in cash or €9.60/day via meal card.',
    active_comparison: 'Active Comparison',
    housing_search_title: 'Search Real Estate on Official Portals',
    housing_search_sub: 'Check real-time offers on verified housing portals:',
    household_size: 'Household Size',
    person: 'Person',
    people: 'People',
    utilities_per_person: 'Per person: {val}€',

    effort_rate_title: 'Housing Effort Rate',
    effort_rate_sub: 'Rent ratio relative to net salary (Banco de Portugal Recommendation)',
    effort_healthy: 'Healthy (<= 35%)',
    effort_warning: 'Warning / Moderate Effort (36% - 50%)',
    effort_critical: 'High Risk (> 50%)',
    net_surplus: 'Monthly Financial Surplus',
    net_deficit: 'Estimated Monthly Deficit',
    setup_budget_title: 'Recommended Setup Capital',
    setup_budget_sub: '2 Months Rent + 1 Month Deposit (Art. 1076 Civil Code) + 3 Months Costs',
    emergency_fund_title: 'Recommended Emergency Fund',
    emergency_fund_sub: '3 Months survival costs according to Banco de Portugal',
    rv_guide_badge: "Practical Guide & 2026 Legislation",
    rv_guide_title: "How to Choose Your Contributory Regime & Social Security",
    rv_guide_subtitle: "Official detailed guide to help you choose the exact options for your independent freelance activity in Portugal.",
    rv_sec_ss_title: "1. Social Security Regimes: Which one applies to you?",
    rv_ss_ti_name: "General Independent Worker (21.4%)",
    rv_ss_ti_who: "Who it is for:",
    rv_ss_ti_who_desc: "The vast majority of freelancers, service providers, consultants, designers, developers, and self-employed professionals.",
    rv_ss_ti_how: "How calculation works:",
    rv_ss_ti_how_desc: "The 21.4% rate applies to 70% of average quarterly invoices declared on SS Direta. For example: invoicing €1,000/month, the contributory base is €700, resulting in €149.80/month contribution.",
    rv_ss_eni_name: "Sole Proprietorship - ENI (25.2%)",
    rv_ss_eni_who: "Who it is for:",
    rv_ss_eni_who_desc: "Individuals operating a commercial or industrial business in their own individual name with open establishment.",
    rv_ss_eni_how: "How calculation works:",
    rv_ss_eni_how_desc: "The rate is 25.2% applied to the regulatory contributory base.",
    rv_ss_exempt_name: "1st Year Activity Exemption (Art. 157 CRC)",
    rv_ss_exempt_who: "Who it is for:",
    rv_ss_exempt_who_desc: "Citizens registering independent activity for the very first time in Portugal.",
    rv_ss_exempt_how: "How it works:",
    rv_ss_exempt_how_desc: "100% exempt from Social Security contributions during your first 12 months (€0/month). If you previously opened activity, this exemption is not renewable.",
    rv_sec_var_title: "2. Quarterly Social Security Base Adjustment (-25% / 0% / +25%)",
    rv_var_sub: "When submitting your Quarterly Declaration on SS Direta, you can adjust your base:",
    rv_var_0_name: "Keep Standard Base (0% Adjustment)",
    rv_var_0_desc: "You pay the exact standard contribution calculated from your previous 3 months of invoices.",
    rv_var_minus_name: "Option to Reduce Base (-25%)",
    rv_var_minus_desc: "Reduces your monthly contribution by 25% to ease cashflow during lower-income months. ⚠️ Caution: proportionally reduces future sickness, parental leave, and pension benefits.",
    rv_var_plus_name: "Option to Increase Base (+25%)",
    rv_var_plus_desc: "Increases your contribution by 25%. Ideal if planning parental leave (increases maternity/paternity payout) or building higher retirement credits.",
    rv_sec_act_title: "3. Activity Types and Tax Coefficients",
    rv_act_services_name: "General Service Provision (Art. 151 CIRS)",
    rv_act_services_desc: "Under simplified IRS, 75% of income is taxable and 25% is assumed as business expense. In Social Security, the base is 70%. Standard invoice withholding tax is 25% (or 16.5%).",
    rv_act_scientific_name: "Scientific, Technical & Artistic Activities",
    rv_act_scientific_desc: "Engineers, doctors, architects, artists, and specialized consultants under Art. 151 CIRS. Standard withholding is 20% to 25% on Category B income.",
    rv_act_products_name: "Product & Merchandise Sales / Dining",
    rv_act_products_desc: "For physical goods trading. Social Security base is only 20% and simplified IRS taxable income is 15%, with zero withholding tax on invoices.",
    rv_sec_wh_title: "4. IRS Withholding Tax: Normal vs Exemption",
    rv_wh_normal_name: "Standard IRS Withholding",
    rv_wh_normal_desc: "Mandatory when issuing invoices to companies with organized accounting. The client deducts tax and forwards it to the Tax Authority.",
    rv_wh_exempt_name: "Tax Withholding Exemption (Art. 101-B up to €15,000/yr)",
    rv_wh_exempt_desc: "If you expect to invoice under €15,000 in 2026, you can issue invoices without withholding. ⚠️ Tax is not forgiven; it will be settled in your annual IRS return (Modelo 3).",
    rv_sec_jovem_title: "5. IRS Jovem for Freelancers (Art. 12-B CIRS)",
    rv_sec_jovem_desc: "Young adults up to 35 with completed higher/secondary education enjoy progressive tax exemption: 100% in year 1, 75% in years 2-4, 50% in years 5-7, and 25% in years 8-10.",
    so_guide_badge: "Labor & Tax Guide 2026",
    so_guide_title: "Understanding Your Net Salary (Contract Employment)",
    so_guide_subtitle: "Detailed official breakdown of Social Security deductions, IRS withholding tax, and employment benefits in Portugal.",
    so_sec_ss_title: "1. Worker Social Security (11% + 23.75% Employer TSU)",
    so_ss_worker_name: "Worker Contribution (11%)",
    so_ss_worker_desc: "Deducted automatically from your gross salary. Entitles you to unemployment benefits, sick leave, maternity/paternity leave, and public pension.",
    so_ss_company_name: "Employer TSU (23.75%)",
    so_ss_company_desc: "Paid directly by your company to Social Security (not deducted from your net pay). Represents the company's contribution to national social protection.",
    so_sec_irs_title: "2. IRS Monthly Withholding & Annual Tax Return",
    so_irs_desc: "Official monthly withholding tables set your monthly deduction. In April/June of the following year (Modelo 3 return), the Tax Authority calculates the exact final balance: you get a refund if overpaid or settle the difference if underpaid.",
    so_sec_meal_title: "3. Meal Allowance (Card vs Cash)",
    so_meal_card_name: "Meal Card (Tax-Free Cap: €9.60/day)",
    so_meal_card_desc: "Up to €9.60 per working day paid via meal card is 100% exempt from IRS and Social Security. The most tax-efficient way to increase net pay.",
    so_meal_cash_name: "Cash / Direct Bank Transfer (Tax-Free Cap: €6.00/day)",
    so_meal_cash_desc: "If paid in cash, the tax-free threshold is only €6.00/day. Any excess amount is fully taxed as regular salary.",
    so_sec_jovem_title: "4. Youth IRS Benefit (Art. 12-B CIRS)",
    so_sec_jovem_desc: "Workers up to 35 with completed secondary or higher education enjoy 10-year progressive IRS exemptions: 100% year 1, 75% years 2-4, 50% years 5-7, and 25% years 8-10.",
    so_sec_family_title: "5. Family Status, Dependents & Autonomous Regions",
    so_family_desc: "Dependents and marital status (1 vs 2 earners) reduce your monthly withholding rate. Tax residents in Madeira benefit from -20% IRS and in Azores -30%.",
    pe_guide_badge: "Business & Tax Manual 2026",
    pe_guide_title: "Strategic Guide for Small Businesses & Entrepreneurs",
    pe_guide_subtitle: "How to choose between Sole Proprietorship (ENI) and Limited Company (Lda), optimize taxes, and calculate true business profitability.",
    pe_sec_legal_title: "1. Legal Structure: ENI vs Single-Member Lda",
    pe_legal_lda_name: "Single-Member Lda / SME Company (Recommended)",
    pe_legal_lda_desc: "Liability limited to share capital (min €1). Your personal assets (home, car, savings) are 100% protected against company debts. Corporate tax (IRC) reduced to 12.5% on the first €50,000 of taxable profit.",
    pe_legal_eni_name: "Sole Proprietorship - ENI",
    pe_legal_eni_desc: "Quick registration without mandatory capital, but unlimited liability: personal assets can be seized for business debts. Taxed under simplified individual IRS.",
    pe_sec_remun_title: "2. Manager Remuneration (Salary) vs Profit Distribution",
    pe_remun_moe_name: "Manager Salary (MOE - TSU 33.05%)",
    pe_remun_moe_desc: "The manager sets a monthly salary subject to 33.05% TSU (23.75% company + 9.3% manager), securing full statutory social protection.",
    pe_remun_profit_name: "Dividend / Profit Distribution",
    pe_remun_profit_desc: "Net profit after IRC corporate tax can be distributed to shareholders at a flat 28% IRS withholding rate.",
    pe_sec_sector_title: "3. Sectors & Simplified Tax Coefficients",
    pe_sector_services_name: "Services & Technology (Coefficient 0.75)",
    pe_sector_services_desc: "The tax authority taxes 75% of revenue, automatically treating 25% as operating expense.",
    pe_sector_commerce_name: "Commerce & Dining (Coefficient 0.15)",
    pe_sector_commerce_desc: "Tax applies to only 15% of gross turnover, reflecting commercial retail margins.",
    pe_sector_tourism_name: "Short-Term Rentals & Industry (Coefficient 0.35)",
    pe_sector_tourism_desc: "Tax applies to 35% of gross revenue for tourism lodging and manufacturing workshops.",
    pe_sec_iva_title: "4. VAT & Small Business Exemption (Art. 53 CIVA)",
    pe_iva_desc: "Companies with annual revenue below €15,000 in 2026 can register under Article 53 exemption without charging or reclaiming VAT.",
    pe_sec_breakeven_title: "5. Monthly Break-Even Point",
    pe_breakeven_desc: "The exact monthly revenue required to cover 100% of operating expenses, salaries, and corporate taxes without incurring financial loss.",
  },
  ES: {
    adults_label: "Adultos (≥ 18 años)",
    youth_label: "Jóvenes (14 a 17 años)",
    children_label: "Niños (< 14 años)",
    telecom: "Telecomunicaciones (Fibra + Móvil)",
    health_personal: "Salud, Higiene y Cuidados",
    provenance_badge: "Benchmark de Mercado MIRA 2026 (INE m² + Portales)",
    mira_financial_health: "Suficiencia Financiera y Prudencia MIRA",
    legal_subsistence_title: "Referencia General Orden 1563/2007",
    reference_label: "Referencia:",
    use_net_salary: "Usar Salario Neto Calculado",
    rail_pass: "Abono Ferroviario Verde (CP - 20€)",
    t0_apartment: "Estudio / Apartamento T0",
    t3_apartment: "Apartamento T3 (Familia)",
    room_single: "Habitación Individual (Room)",
    t4_apartment: "Apartamento T4 o Superior (T4+)",
    ocde_scale_label: "Escala OCDE:",
    ocde_scale_sub: "Factor de equivalencia familiar",
    applied_food_utilities: "aplicado a alimentación y suministros.",
    portaria_formula_label: "Fórmula Teórica de la Orden:",
    governance_note_title: "Nota de Gobernanza y Blindaje Jurídico:",
    household_net_income: "Ingreso Neto Mensual Familiar (€)",
    effort_sustainable_tag: "Sostenible (≤ 35%)",
    effort_moderate_tag: "Riesgo Moderado (36-50%)",
    effort_critical_tag: "Sobreesfuerzo Crítico (> 50%)",
    effort_rate_housing: "Tasa de Esfuerzo en Vivienda",
    rent_vs_income_label: "Alquiler ({rent}€) frente a Ingreso ({income}€)",
    estimated_monthly_balance: "Saldo Mensual Estimado",
    deficit_estimated_desc: "Déficit mensual estimado en el distrito",
    savings_margin_desc: "Margen de ahorro mensual",
    mira_recommended_reserve: "Reserva MIRA Recomendada",
    reserve_target_desc: "Objetivo de 6 meses de seguridad (3 meses: {val3}€)",
    compare_off: "Desactivado",
    placeholder_ex_from_tab1: "Ej: {val}€ (de Tab 1)",
    placeholder_ex_1500: "Ej: 1500",
    so_sim_title: "Simulador de Salario Neto (Empleado por Cuenta Ajena / Contrato)",
    so_sim_subtitle: "Cálculo según tablas oficiales de retención de IRS (2026) y Seguridad Social (11%)",
    duodecimos_badge_13_14: "Pagas 13.ª y 14.ª",
    irs_jovem_desc_field: "Exención parcial durante los primeros 10 años de actividad (hasta 35 años). Límite anual: 55 × IAS (29.542,15 €).",
    irs_jovem_y1: "1.er Año",
    irs_jovem_y2_4: "2.º–4.º Años",
    irs_jovem_y5_7: "5.º–7.º Años",
    irs_jovem_y8_10: "8.º–10.º Años",
    irs_jovem_opt_1: "1.er Año (100% Exención)",
    irs_jovem_opt_2: "2.º Año (75% Exención)",
    irs_jovem_opt_3: "3.er Año (75% Exención)",
    irs_jovem_opt_4: "4.º Año (75% Exención)",
    irs_jovem_opt_5: "5.º Año (50% Exención)",
    irs_jovem_opt_6: "6.º Año (50% Exención)",
    irs_jovem_opt_7: "7.º Año (50% Exención)",
    irs_jovem_opt_8: "8.º Año (25% Exención)",
    irs_jovem_opt_9: "9.º Año (25% Exención)",
    irs_jovem_opt_10: "10.º Año (25% Exención)",
    meal_taxable_alert: "Atención: Subsidio de Comida Gravado",
    meal_taxable_sub: "El excedente diario de {excess}€/día (por encima del límite exento de {cap}) tributará el 11% de Seguridad Social e IRS.",
    calc_result_2026: "Resultado del Cálculo (2026)",
    calc_result_title: "Resultado del Cálculo",
    effective_irs_rate: "Tasa Efectiva de IRS",
    effective_tax_rate: "Tasa Efectiva de Impuesto",
    net_income_available: "Ingreso Neto Mensual Disponible",
    payslip_breakdown: "Desglose de Nómina Mensual",
    remun_bruta_sujeita: "Retribución Bruta Sujeta",
    duodecimo_vac_line: "• Duodécima Paga Vacaciones:",
    duodecimo_xmas_line: "• Duodécima Paga Navidad:",
    ss_worker_11: "Seguridad Social Trabajador (11%)",
    irs_withholding_line: "Retención en la Fuente de IRS",
    meal_exempt_line: "Subsidio Comida Exento",
    meal_taxed_line: "Subsidio Comida Gravado (en bruto)",
    salary_legal_basis_note: "Cálculo realizado según el Modelo Marginal Oficial de Hacienda de Portugal (AT 2026), Seguridad Social (11%) y límites exentos de manutención (Orden 51-B/2026: hasta 10,46 €/día en tarjeta o 6,15 € en efectivo).",
    rv_sim_title: "Simulador de Autónomos / Recibos Verdes",
    rv_sim_subtitle: "Cálculo de Seguridad Social (21,4% sobre 70% base) y retención en factura de IRS (Cat. B)",
    rv_irs_jovem_title: "IRS Jovem (Art. 12-B CIRS) para Categoría B",
    rv_irs_jovem_desc: "Aplicable a trabajadores autónomos hasta 35 años con título universitario o superior.",
    rv_deductions_title: "Retenciones y Cotizaciones",
    ss_ti_line: "Seguridad Social (21,4% sobre 70% Base)",
    ss_var_0_short: "0% Estándar",
    rv_legal_note: "Los Recibos Verdes cotizan a la Seguridad Social sobre el 70% de la facturación en servicios (o 20% en venta de productos) al tipo del 21,4% (Autónomo) o 25,2% (ENI).",
    hp_title: "MIRA Housing Intelligence & Affordability 2026",
    hp_subtitle: "Observatorio Territorial (INE vs Portales) y Simuladores Regulatorios de Alquiler y Compra",
    hp_mode_rent: "🏠 Alquiler y Porta 65",
    hp_mode_buy: "🏦 Compra e Hipoteca",
    hp_territory_label: "📍 Unidad Territorial / Municipio",
    hp_municipality_tag: "(Municipio / INE Oficial)",
    hp_district_tag: "(Distrito / Agregación MIRA)",
    hp_typology_label: "📐 Tipología de Vivienda",
    hp_age_label: "🎂 Edad del Candidato (Años)",
    hp_buyer_age_label: "🎂 Edad del Titular Mayor",
    hp_youth_guarantee_toggle: "Garantía Pública Joven (DL 44/2024)",
    hp_rent_inputs_title: "Datos de Ingresos y Contrato de Alquiler",
    hp_net_income_label: "💰 Ingresos Netos Mensuales Disponibles (€)",
    hp_net_income_help: "Utilizado para la tasa de esfuerzo y prudencia MIRA.",
    hp_gross_income_label: "💼 Ingreso Bruto Mensual Familiar (€)",
    hp_gross_income_help: "Obligatorio para verificar la regla de esfuerzo bruto ≤ 60% en Porta 65.",
    hp_rent_label: "🏠 Renta Mensual Deseada (€)",
    hp_rent_help: "Deje 0 o vacío para utilizar el benchmark de mercado.",
    hp_expenses_label: "🛒 Total de Otros Gastos Mensuales (€)",
    hp_territorial_obs_title: "Observatorio Territorial MIRA",
    hp_ine_contracted: "INE Contratado",
    hp_portals_asking: "Portales Anunciado",
    hp_asking_spread: "Sobreprecio de Oferta",
    hp_spread_help: "Presión de propietarios respecto a los nuevos contratos de Hacienda",
    hp_initial_capital_title: "Capital Inicial (Art. 1076 Código Civil)",
    hp_first_month_rent: "1.ª Renta de Entrada:",
    hp_advance_rent: "Adelanto (hasta 2 meses):",
    hp_security_deposit: "Fianza (hasta 2 meses):",
    hp_cc1076_legal_note: "tope legal máximo admisible (5 mensualidades en total); no vinculante si el arrendador pacta un importe menor.",
    hp_porta65_title: "Cribado Porta 65 Joven",
    hp_porta65_pre_pass: "✓ Pre-Aprobado",
    hp_porta65_rejected: "Rechazado en Cribado",
    hp_porta65_rma_label: "RMA Municipal",
    hp_porta65_cap_rma: "Tope 4× RMA Municipal:",
    hp_porta65_cap_rmmg: "Tope 4× SMI 2026:",
    hp_porta65_gross_effort: "Esfuerzo Bruto (máx. 60%):",
    hp_effort_rate_title: "Tasa de Esfuerzo Habitacional MIRA",
    hp_effort_mira_guide: "≤35% Directriz Prudencial MIRA",
    hp_effort_critical_risk: ">50% Riesgo Crítico",
    hp_buy_inputs_title: "Datos del Inmueble y Financiación",
    hp_buy_price_label: "🏷️ Precio de Compra del Inmueble (€)",
    hp_appraisal_label: "🔍 Valor de Tasación Bancaria (€)",
    hp_appraisal_help: "El Banco de Portugal exige el cálculo sobre min(precio, tasación).",
    hp_own_capital_label: "💰 Capital Propio para Entrada (€)",
    hp_buyer_net_income_label: "💳 Ingreso Neto Mensual Familiar (€)",
    hp_other_debts_label: "🧾 Otras Cuotas de Créditos Actuales (€)",
    hp_first_hpp_toggle: "1.ª Vivienda Propia y Permanente (HPP)",
    hp_owns_prop_toggle: "¿Es actualmente propietario de una vivienda?",
    hp_owns_last3y_toggle: "¿Fue propietario en los últimos 3 años? (IMT Jovem)",
    hp_financing_title: "Marco de Financiación Hipotecaria",
    hp_financing_sub: "LTV, Financiación y Cuota Mensual",
    hp_max_ltv: "LTV Máx:",
    hp_eligible_base: "Base Elegible min(P,T)",
    hp_price_vs_appraisal: "Precio vs Tasación",
    hp_loan_amount: "Importe Financiado",
    hp_effective_ltv: "LTV Efectivo:",
    hp_monthly_mortgage: "Cuota Estimada",
    hp_bdp_regulated_years: "años (Regulado BdP)",
    hp_imt_jovem_title: "IMT Jovem (DL 48-A/2024)",
    hp_imt_jovem_applied: "✓ Exención Aplicada",
    hp_imt_jovem_normal: "Tributación Ordinaria",
    hp_imt_tax_suffix: "de IMT",
    hp_imt_jovem_savings: "Ahorro de IMT:",
    hp_stamp_duty_savings: "Ahorro Impuesto de Actos Jurídicos:",
    hp_imt_jovem_legal_basis: "Régimen fiscal de 2026 según Circular 40019/2024 de Hacienda. Exención total hasta 316.772 € y parcial hasta 633.453 €.",
    hp_guarantee_title: "Garantía Pública (DL 44/2024)",
    hp_guarantee_eligible: "✓ Elegible",
    hp_guarantee_ineligible: "No Elegible",
    hp_guarantee_explanation: "Garantía personal del Estado hasta el 15% de min(precio, tasación), posibilitando financiación hipotecaria de hasta el 100% en compras de hasta 450.000 €.",
    hp_total_initial_capital: "Capital Inicial Total Estimado",
    hp_downpayment_taxes_notary: "Entrada + Impuestos + Gastos de Notaría",
    aima_diag_title: "Diagnóstico AIMA y Salud Financiera 2026",
    aima_diag_subtitle: "Verifica si sus ingresos cumplen los umbrales mínimos legales exigidos para el Permiso de Residencia en Portugal",
    aima_portaria_badge: "Orden 1563/2007 de 11/12",
    aima_lei_badge: "Ley 23/2007 — Ley de Extranjería",
    aima_rmmg_badge: "SMI 2026: 920€ / mes",
    aima_data_title: "Sus Datos de Ingresos y Hogar",
    aima_data_sub: "Rellene los campos con sus importes reales para verificar el cumplimiento legal ante AIMA",
    aima_net_label: "💰 Ingreso Neto Mensual (€)",
    aima_net_help: "El importe neto percibido tras deducciones de Seguridad Social e IRPF.",
    aima_dep_label: "👨‍👩‍👧 N.º de Familiares a Cargo",
    aima_dep_help: "Cónyuge sin ingresos, hijos menores o ascendientes a cargo.",
    aima_no_dep: "(Sin dependientes)",
    aima_one_dep: "dependiente",
    aima_multi_dep: "dependientes",
    aima_rent_label: "🏠 Alquiler Mensual (€)",
    aima_rent_help: "Importe pagado mensualmente por el alquiler de la vivienda.",
    aima_exp_label: "🛒 Total de Gastos Mensuales (€)",
    aima_exp_help: "Incluye alquiler + comida + transporte + suministros.",
    aima_ss_label: "🛡️ Nivel de Cotización en Seguridad Social (ISS)",
    aima_ss_help: "El régimen e importe que declara en su informe oficial de Seguridad Social.",
    aima_ss_outrem: "Cuenta Ajena (Descuento íntegro del 11% sobre Salario Bruto)",
    aima_ss_recibos: "Autónomos General (21,4% SS sobre 70% Facturación Real)",
    aima_ss_reduced: "Autónomos con Opción de Reducción de Base (-25%)",
    aima_ss_min: "⚠️ Cotización Mínima Simbólica (20€ / mes)",
    aima_res_title: "Resultados del Diagnóstico AIMA",
    aima_viability_index: "Índice de Viabilidade AIMA",
    aima_score_high: "🟢 Excelente y Sostenible",
    aima_score_med: "🟡 Estable con Precaución",
    aima_score_low: "🔴 Riesgo de Notificación / Denegación",
    aima_est_ss: "Retención SS Estimada",
    aima_ss_alert_title: "⚠️ Alerta de Riesgo Grave AIMA: Discrepancia en Seguridad Social",
    aima_ss_alert_desc: "La AIMA cruza los extractos de cotización de la Seguridad Social en tiempo real. Declarar ingresos suficientes pero cotizar solo el mínimo simbólico (20€/mes) o reducir un -25% genera una incoherencia fiscal grave. La AIMA presume ausencia de ingresos reales y emite Audiencia Previa de Denegación.",
    aima_legal_subsistence_check: "Verificación de Subsistencia Legal AIMA",
    aima_meets_threshold: "✓ Cumple Umbral Mínimo",
    aima_threshold_warn: "⚠️ Atención / Riesgo de Incoerencia",
    aima_net_income: "Ingreso Neto",
    per_month: "al mes",
    aima_min_threshold: "Umbral Mínimo AIMA",
    difference: "Diferencia",
    above_threshold: "por encima del umbral",
    below_threshold: "por debajo del umbral",
    aima_legal_basis_note: "Según la Orden n.º 1563/2007 de 11 de diciembre, los medios de subsistencia para la concesión y renovación de Residencia se calculan sobre el SMI de Portugal (RMMG 2026 = 920€): 100% SMI (920€) para el primer adulto + 30% SMI (276€) por cada familiar adicional.",
    aima_net_balance: "Saldo Mensual Disponible",
    aima_income_minus_expenses: "Ingresos − Total Gastos",
    aima_recommended_stability: "Recomendado para estabilidad financiera",
    aima_setup_capital_title: "Capital de Entrada al Alquiler",
    aima_setup_capital_desc: "2 Fianzas + 1 Mensualidad por Adelantado",
    pe_sim_title: "Simulador para Emprendedores y Microempresas",
    pe_sim_subtitle: "Estimación de rentabilidad, impuestos (IRC 15% Pyme / IRPF Simplificado) y liquidez para Autónomo y Sociedad Unipersonal (2026)",
    pe_badge_irc: "IRC Reduzido Pyme: 15,0% (1.ºs 50k€)",
    pe_badge_tsu: "Administrador: TSU 34,75%",
    pe_badge_breakeven: "Punto de Equilibrio Automático",
    pe_form_title: "Datos Financieros del Negocio",
    pe_revenue_label: "💰 Facturación Mensual Bruta (Volumen de Negocio) (€)",
    pe_revenue_help: "Total cobrado a clientes al mes (sin IVA).",
    pe_expenses_label: "📦 Gastos Operativos Mensuales (€)",
    pe_expenses_help: "Alquiler, proveedores, contable, licencias, suministros.",
    pe_sector_label: "🏷️ Sector de Actividad",
    pe_opt_services: "Prestación de Servicios y Tecnología (Coef. 0.75)",
    pe_opt_commerce: "Comercio / Tiendas / Restauración (Coef. 0.15)",
    pe_opt_hospitality: "Alquiler Vacacional y Turismo (Coef. 0.35)",
    pe_opt_industry: "Industria / Taller / Artesanía (Coef. 0.35)",
    pe_structure_label: "🏛️ Estructura Jurídica",
    pe_opt_lda: "Sociedad Unipersonal Lda / Pyme (IRC 15%)",
    pe_opt_eni: "Empresario Individual — ENI (IRPF Simplificado)",
    pe_prolabore_label: "👔 Sueldo del Administrador (€/mes)",
    pe_prolabore_help: "Remuneración mensual asignada al administrador (sujeta a TSU del 34,75% — Art. 69 CRC).",
    pe_res_title: "Rendimiento Financiero del Negocio",
    pe_margin_label: "Margen Neto",
    pe_net_profit_title: "Beneficio Neto Mensual Disponible",
    pe_net_profit_calc: "Facturación Mensual ({bizRevenue}€) − Gastos ({bizExpenses}€) − Impuestos/SS ({res.totalTaxes}€)",
    pe_gross_op_profit: "Beneficio Bruto Operativo",
    pe_before_taxes: "Antes de impuestos y SS",
    pe_estimated_taxes: "Impuestos Estimados",
    pe_tax_label_irc: "IRC 15% Pyme",
    pe_tax_label_irs: "IRPF Simplificado",
    pe_ss_tsu_label: "Seguridad Social / TSU",
    pe_ss_label_tsu: "TSU Administrador (34,75%)",
    pe_ss_label_eni: "SS Autónomo (25,2%)",
    pe_breakeven_title: "Punto de Equilibrio (Break-Even Mensual)",
    pe_breakeven_sub: "Facturación mensual mínima para cubrir todos los gastos fijos e impuestos sin pérdidas",
    pe_edu_note: "En Portugal, las pymes cualificadas en el continente disfrutan de un tipo reducido de Impuesto sobre Sociedades (IRC) del 15,0% sobre los primeros 50.000€ de base imponible y del 19,0% en el excedente (Art. 87 CIRC / Presupuestos 2026). Los administradores cotizan una TSU estatutaria del 34,75% (23,75% empresa + 11,0% administrador — Art. 69.º/2 CRC).",
    badge_at: "AT (IRS 2026)",
    badge_ine: "INE (Precios Alquiler)",
    badge_iss: "ISS (Seg. Social Autónomos)",
    badge_bdp: "Banco de Portugal",
    title: 'Simuladores Económicos MIRA',
    subtitle: 'Métricas e Indicadores Financieros Oficiales (2026)',
    tab_1_salary: '💰 1. Salario Neto',
    tab_2_recibos: '💼 2. Autónomos',
    tab_3_ss: '🛡️ 3. Seg. Social',
    tab_4_reforma: '🏛️ 4. Jubilación & CSI',
    tab_5_cost: '🗺️ 5. Coste de Vida',
    tab_6_housing: '🏠 6. Vivienda',
    tab_7_aima: '🩺 7. Requisitos AIMA',
    tab_8_business: '🏢 8. Emprendedor',
    tab_salary: 'Salario Neto',
    tab_cost: 'Coste de Vida',
    tab_health: 'Salud Financiera',
    work_regime: 'Régimen de Trabajo',
    conta_outrem: 'Empleado por Cuenta Ajena (Contrato de Trabajo / Cat. A)',
    recibos_verdes: 'Recibos Verdes (Trabajador Autónomo / Cat. B)',
    gross_salary: 'Salario Bruto Mensual',
    invoice_monthly: 'Facturación Mensual Bruta',
    activity_type: 'Tipo de Actividad',
    service_provision: 'Prestación de Servicios (70% Base SS / 23% Retención IRS Art. 151)',
    product_sales: 'Venta de Productos / Hostelería (20% Base SS / Exento Retención IRS)',
    scientific_activity: 'Actividades Científicas/Artísticas (70% Base SS / 16,5% Retención IRS)',
    irs_withholding: 'Retención a la Fuente (IRS)',
    irs_normal: 'Retención Normal IRS (Art. 101 CIRS)',
    irs_exempt_101b: 'Exención de Retención (Art. 101-B CIRS hasta 15.000€/año)',
    ss_regime: 'Régimen de Seguridad Social',
    ss_normal: 'Trabajador Autónomo General (21,4%)',
    ss_eni: 'Empresario Individual - ENI (25,2%)',
    ss_exempt_year1: 'Exención 1.er Año de Actividad (0%)',
    ss_variation: 'Ajuste Trimestral de la Base (SS)',
    ss_var_0: 'Mantener la Base Estándar (0%)',
    ss_var_minus25: 'Opción de Reducir la Base (-25%)',
    ss_var_plus25: 'Opción de Aumentar la Base (+25%)',
    family_status: 'Situación Familiar',
    single: 'Soltero / Divorciado',
    married_1: 'Casado (1 solo Titular de Ingresos)',
    married_2: 'Casado (2 Titulares de Ingresos)',
    dependents: 'Número de Dependientes',
    region: 'Región Fiscal',
    continent: 'Portugal Continental',
    madeira: 'Región Autónoma de Madeira (Tablas Regionales 2026)',
    azores: 'Región Autónoma de Azores (Orden 1179/2026)',
    irs_jovem: 'Régimen IRS Jovem (Art. 12-B CIRS)',
    irs_jovem_active: 'Aplicar Beneficio IRS Jovem (18-35 Años)',
    irs_jovem_year: 'Año del Beneficio',
    year_1: '1.er Año (100% Exención)',
    years_2_4: '2.º a 4.º Año (75% Exención)',
    years_5_7: '5.º a 7.º Año (50% Exención)',
    years_8_10: '8.º a 10.º Año (25% Exención)',
    meal_allowance: 'Subsidio de Alimentación (Diario)',
    meal_type: 'Método de Pago',
    cash: 'Efectivo / Transferencia (Tope Exento 6,15€)',
    card: 'Tarjeta de Comida (Tope Exento 10,46€)',
    duodecimos_title: 'Régimen de Duodécimas (Pagas Extraordinarias)',
    duodecimos_none: 'Sin Duodécimas (Estándar 14 Meses)',
    duodecimos_half_vac: '50% Paga de Vacaciones en 12 Meses',
    duodecimos_half_xmas: '50% Paga de Navidad en 12 Meses',
    duodecimos_half_both: '50% de Ambas Pagas en 12 Meses',
    duodecimos_full_both: '100% de Ambas Pagas (12 Meses)',
    employer_cost_title: 'Coste Total para la Empresa',
    tsu_company: 'Seguridad Social Empresa (23,75%)',
    irs_jovem_badge_saved: 'Ahorro IRS Jovem',
    meal_taxable_warning: 'Atención: El exceso diario de subsidio de comida tributará el 11% de Seguridad Social e IRS.',
    work_days: 'Días de Trabajo (Mes)',
    results: 'Resultados de la Simulación',
    net_salary_total: 'Salario Neto Mensual Estimado',
    net_income_recibos: 'Ingreso Neto Mensual Disponible',
    deductions: 'Retenciones y Contribuciones Oficiales',
    social_security: 'Seguridad Social (Autónomo 21,4% / 70% Base)',
    irs: 'Retención a la Fuente (IRS 2026)',
    meal_taxed: 'Subsidio Comida Gravado',
    meal_exempt: 'Subsidio Comida Exento',
    total_tax_load: 'Carga Fiscal Efectiva Total',
    effective_rate: 'Tasa Efectiva de Impuesto',
    district: 'Distrito de Destino',
    housing: 'Tipo de Alojamiento',
    shared_room: 'Habitación Compartida',
    t1_apartment: 'Apartamento T1',
    t2_apartment: 'Apartamento T2',
    food_style: 'Estilo de Alimentación',
    cook_home: 'Cocinar en Casa (Económico)',
    mixed: 'Estilo Mixto (Equilibrado)',
    eat_out: 'Comer Fuera (Frecuente)',
    transport: 'Transporte y Movilidad',
    public_pass: 'Abono de Transporte Público',
    own_car: 'Coche Propio (Combustible + Mantenimiento)',
    utilities_leisure: 'Servicios y Ocio',
    utilities_basic: 'Básico (Agua, Luz, Internet, Gas)',
    utilities_active: 'Activo (Servicios + Ocio/Restaurantes)',
    monthly_budget: 'Presupuesto Mensual Estimado',
    comparison: 'Comparador de Distritos',
    compare_with: 'Comparar con otro Distrito',
    no_compare: 'Ninguno (Vista Única)',
    cost_housing: 'Alojamiento (Alquiler Medio INE)',
    cost_food: 'Alimentación',
    cost_transport: 'Transportes',
    cost_utilities: 'Servicios y Extras',
    cost_total: 'Coste Total Estimado',
    savings_calc: 'Ahorro Mensual Estimado',
    savings_text: '¡Al elegir {d1} en lugar de {d2}, puede ahorrar cerca de {val}€ al mes!',
    note_title: 'Fuentes Oficiales Verificadas',
    note_text: 'Cálculos actualizados según las Tablas Oficiales de Retención de la Autoridad Tributaria (AT 2026), Código de la Seguridad Social (11% asalariados / TI 21,4%), Estadísticas del INE y Recomendaciones del Banco de Portugal.',
    cap_notice: 'La exención fiscal del subsidio de alimentación en 2026 es de hasta 6,00€/día en efectivo o 9,60€/día en tarjeta de comida.',
    active_comparison: 'Comparación Activa',
    housing_search_title: 'Buscar Inmuebles en Portales Oficiales',
    housing_search_sub: 'Verifique ofertas en tiempo real en portales verificados:',
    household_size: 'Miembros del Hogar',
    person: 'Persona',
    people: 'Personas',
    utilities_per_person: 'Por persona: {val}€',
    effort_rate_title: 'Tasa de Esfuerzo en Vivienda',
    effort_rate_sub: 'Proporción del alquiler respecto al salario neto (Recomendación del Banco de Portugal)',
    effort_healthy: 'Saludable (<= 35%)',
    effort_warning: 'Alerta / Esfuerzo Moderado (36% - 50%)',
    effort_critical: 'Riesgo Elevado (> 50%)',
    net_surplus: 'Margen Financiero Mensual',
    net_deficit: 'Déficit Mensual Estimado',
    setup_budget_title: 'Capital de Instalación Recomendado',
    setup_budget_sub: '2 Meses de Alquiler + 1 Mes de Fianza (Art. 1076 C. Civil) + 3 Meses de Gastos',
    emergency_fund_title: 'Fondo de Emergencia Recomendado',
    emergency_fund_sub: '3 Meses de gastos de supervivencia según la recomendación del Banco de Portugal',
    rv_guide_badge: "Manual Práctico y Legislación 2026",
    rv_guide_title: "Cómo Elegir su Régimen de Cotización y Seguridad Social",
    rv_guide_subtitle: "Guía oficial detallada para saber exactamente qué opción seleccionar para su actividad autónoma en Portugal.",
    rv_sec_ss_title: "1. Regímenes de Seguridad Social: ¿Cuál debe elegir?",
    rv_ss_ti_name: "Trabajador Autónomo General (21,4%)",
    rv_ss_ti_who: "Para quién es:",
    rv_ss_ti_who_desc: "La gran mayoría de freelancers, consultores, diseñadores, programadores y trabajadores por cuenta propia.",
    rv_ss_ti_how: "Cómo funciona el cálculo:",
    rv_ss_ti_how_desc: "El 21,4% se aplica sobre el 70% de la facturación media del trimestre anterior declarada en la SS Direta. Por ejemplo: facturando 1.000€/mes, la base es 700€, pagando 149,80€/mes.",
    rv_ss_eni_name: "Empresario Individual - ENI (25,2%)",
    rv_ss_eni_who: "Para quién es:",
    rv_ss_eni_who_desc: "Personas con negocio propio comercial o industrial con establecimiento a nombre individual.",
    rv_ss_eni_how: "Cómo funciona el cálculo:",
    rv_ss_eni_how_desc: "La tasa es del 25,2% sobre la base de cotización reglamentaria.",
    rv_ss_exempt_name: "Exención del 1.er Año de Actividad (Art. 157 CRC)",
    rv_ss_exempt_who: "Para quién es:",
    rv_ss_exempt_who_desc: "Ciudadanos que inician actividad por primera vez en Portugal.",
    rv_ss_exempt_how: "Cómo funciona:",
    rv_ss_exempt_how_desc: "100% de exención de cuotas de Seguridad Social durante los primeros 12 meses (0€/mes). Si ya tuvo actividad previa, esta exención no se renueva.",
    rv_sec_var_title: "2. Ajuste Trimestral de Base de SS (-25% / 0% / +25%)",
    rv_var_sub: "Al presentar la Declaración Trimestral en la SS Direta, puede optar por ajustar su base:",
    rv_var_0_name: "Mantener Base Estándar (0%)",
    rv_var_0_desc: "Paga la cotización exacta calculada a partir de los 3 meses anteriores.",
    rv_var_minus_name: "Opción de Reducir Base (-25%)",
    rv_var_minus_desc: "Reduce un 25% su cuota mensual para aliviar liquidez. ⚠️ Atención: reduce proporcionalmente subsidios de enfermedad, paternidad y pensión futura.",
    rv_var_plus_name: "Opción de Aumentar Base (+25%)",
    rv_var_plus_desc: "Aumenta un 25% su cuota. Ideal para quienes planean baja por maternidad/paternidad o desean acumular mayor jubilación.",
    rv_sec_act_title: "3. Tipo de Actividad y Coeficientes Fiscales",
    rv_act_services_name: "Prestación de Servicios General (Art. 151 CIRS)",
    rv_act_services_desc: "En IRPF simplificado, el 75% es base imponible y el 25% se asume como gasto. En Seguridad Social, la base es del 70%. La retención estándar en factura es del 25% (o 16,5%).",
    rv_act_scientific_name: "Actividades Científicas, Técnicas y Artísticas",
    rv_act_scientific_desc: "Ingenieros, médicos, artistas y consultores especializados. Retención en factura del 20% al 25% sobre rendimientos de Categoría B.",
    rv_act_products_name: "Venta de Productos y Mercancías / Hostelería",
    rv_act_products_desc: "Para venta de bienes físicos. Base de SS del 20% y en IRPF del 15%, sin retención en factura.",
    rv_sec_wh_title: "4. Retención de IRPF en Factura: Normal vs Exención",
    rv_wh_normal_name: "Retención Estándar de IRPF",
    rv_wh_normal_desc: "Obligatoria al facturar a empresas con contabilidad organizada. El cliente retiene el impuesto y lo entrega a Hacienda.",
    rv_wh_exempt_name: "Exención de Retención (Art. 101-B hasta 15.000€/año)",
    rv_wh_exempt_desc: "Si prevé facturar menos de 15.000€ en 2026, puede emitir sin retención. ⚠️ El impuesto no se perdona; se liquidará en la declaración anual de la Renta.",
    rv_sec_jovem_title: "5. IRS Jovem para Autónomos (Art. 12-B CIRS)",
    rv_sec_jovem_desc: "Jóvenes hasta 35 anos con estudios concluidos tienen exención progresiva de IRPF: 100% en año 1, 75% en años 2-4, 50% en años 5-7 y 25% en años 8-10.",
    so_guide_badge: "Guía Laboral y Fiscal 2026",
    so_guide_title: "Cómo Funciona su Salario Neto (Trabajo por Cuenta Ajena)",
    so_guide_subtitle: "Conozca al detalle las deducciones de Seguridad Social, retenciones de IRPF y ventajas de su contrato de trabajo en Portugal.",
    so_sec_ss_title: "1. Seguridad Social del Trabajador (11% + 23,75% Empresa)",
    so_ss_worker_name: "Descuento del Trabajador (11%)",
    so_ss_worker_desc: "Se descuenta automáticamente del salario bruto. Da derecho a desempleo, baja por enfermedad, maternidad/paternidad y jubilación.",
    so_ss_company_name: "Aportación de la Empresa (23,75%)",
    so_ss_company_desc: "Pagada directamente por la empresa a la Seguridad Social (no sale de su sueldo neto). Representa el coste patronal de protección social.",
    so_sec_irs_title: "2. Retención Mensual de IRPF (IRS) y Declaración Anual",
    so_irs_desc: "Las tablas oficiales fijan la retención mensual. En abril/junio del año siguiente (Modelo 3), Hacienda liquida el saldo real: devolución si retuvo de más o pago si retuvo de menos.",
    so_sec_meal_title: "3. Subsidio de Comida (Tarjeta vs Efectivo)",
    so_meal_card_name: "Tarjeta Restaurante (Tope Exento: 9,60€/día)",
    so_meal_card_desc: "Hasta 9,60€ por día laboral pagados con tarjeta de comida están 100% exentos de IRPF y Seguridad Social.",
    so_meal_cash_name: "Efectivo / Transferencia (Tope Exento: 6,00€/día)",
    so_meal_cash_desc: "En efectivo, el límite exento es de solo 6,00€/día. Cualquier importe superior tributa como salario ordinario.",
    so_sec_jovem_title: "4. Beneficio IRS Jovem (Art. 12-B CIRS)",
    so_sec_jovem_desc: "Trabajadores hasta 35 años con estudios concluidos disfrutan de 10 años de exenciones progresivas: 100% año 1, 75% años 2-4, 50% años 5-7 y 25% años 8-10.",
    so_sec_family_title: "5. Situación Familiar, Hijos y Regiones Autónomas",
    so_family_desc: "Los dependientes y el estado civil reducen la retención mensual. Residentes en Madeira tienen -20% de IRPF y en Azores -30%.",
    pe_guide_badge: "Manual Empresarial y Fiscal 2026",
    pe_guide_title: "Guía Estratégica para Emprendedores y Microempresas",
    pe_guide_subtitle: "Cómo elegir entre Autónomo (ENI) y Sociedad Unipersonal Lda, optimizar impuestos y calcular la rentabilidad real de su negocio.",
    pe_sec_legal_title: "1. Estructura Jurídica: ENI vs Sociedad Unipersonal Lda",
    pe_legal_lda_name: "Sociedad Unipersonal Lda / Pyme (Recomendada)",
    pe_legal_lda_desc: "Responsabilidad limitada al capital social (mínimo 1€). Su patrimonio personal queda 100% protegido. Impuesto de Sociedades (IRC) reducido al 12,5% sobre los primeros 50.000€ de beneficio.",
    pe_legal_eni_name: "Empresario Individual - ENI",
    pe_legal_eni_desc: "Alta rápida sin capital mínimo, pero responsabilidad ilimitada: los bienes personales responden por deudas comerciales. Tributa en IRPF simplificado.",
    pe_sec_remun_title: "2. Salario del Administrador (Pró-Labore) vs Beneficios",
    pe_remun_moe_name: "Sueldo de Administrador (TSU 33,05%)",
    pe_remun_moe_desc: "El administrador fija un salario mensual con cotización de Seguridad Social del 33,05%, garantizando cobertura oficial completa.",
    pe_remun_profit_name: "Distribución de Dividendos / Beneficios",
    pe_remun_profit_desc: "El beneficio neto tras el impuesto de sociedades puede repartirse al socio con una retención fija del 28% en IRPF.",
    pe_sec_sector_title: "3. Sectores y Coeficientes en Régimen Simplificado",
    pe_sector_services_name: "Servicios y Tecnología (Coeficiente 0.75)",
    pe_sector_services_desc: "Hacienda tributa el 75% de la facturación y asume el 25% en gastos operativos.",
    pe_sector_commerce_name: "Comercio y Hostelería (Coeficiente 0.15)",
    pe_sector_commerce_desc: "Tributación sobre solo el 15% de ingresos brutos, reflejando márgenes comerciales.",
    pe_sector_tourism_name: "Alojamiento Turístico e Industria (Coeficiente 0.35)",
    pe_sector_tourism_desc: "Tributación sobre el 35% de ingresos en alquiler vacacional y talleres.",
    pe_sec_iva_title: "4. IVA y Régimen de Exención (Art. 53 CIVA)",
    pe_iva_desc: "Empresas con facturación anual inferior a 15.000€ en 2026 pueden acogerse a la exención del Art. 53 sin repercutir ni deducir IVA.",
    pe_sec_breakeven_title: "5. Punto de Equilibrio (Break-Even Mensual)",
    pe_breakeven_desc: "La facturación mínima necesaria cada mes para cubrir exactamente todos los costes fijos, sueldos e impuestos sin entrar en pérdidas.",
  },
  FR: {
    adults_label: "Adultes (≥ 18 ans)",
    youth_label: "Jeunes (14 à 17 ans)",
    children_label: "Enfants (< 14 ans)",
    telecom: "Télécoms (Fibre + Mobile)",
    health_personal: "Santé, Hygiène et Soins",
    provenance_badge: "Benchmark Marché MIRA 2026 (INE m² + Portails)",
    mira_financial_health: "Suffisance Financière & Prudence MIRA",
    legal_subsistence_title: "Référence Générale Arrêté 1563/2007",
    reference_label: "Référence :",
    use_net_salary: "Utiliser Salaire Net Calculé",
    rail_pass: "Pass Ferroviaire Vert (CP - 20€)",
    t0_apartment: "Studio / Appartement T0",
    t3_apartment: "Appartement T3 (Famille)",
    room_single: "Chambre Individuelle (Room)",
    t4_apartment: "Appartement T4 ou Supérieur (T4+)",
    ocde_scale_label: "Échelle OCDE :",
    ocde_scale_sub: "Facteur d'équivalence familiale",
    applied_food_utilities: "appliqué à l'alimentation et aux charges.",
    portaria_formula_label: "Formule Théorique de l'Arrêté :",
    governance_note_title: "Note de Gouvernance et Sécurisation Juridique :",
    household_net_income: "Revenu Net Mensuel du Foyer (€)",
    effort_sustainable_tag: "Durable (≤ 35%)",
    effort_moderate_tag: "Risque Modéré (36-50%)",
    effort_critical_tag: "Effort Excessif Critique (> 50%)",
    effort_rate_housing: "Taux d'Effort pour le Logement",
    rent_vs_income_label: "Loyer ({rent}€) par rapport au Revenu ({income}€)",
    estimated_monthly_balance: "Solde Mensuel Estimé",
    deficit_estimated_desc: "Déficit mensuel estimé dans le district",
    savings_margin_desc: "Marge d'épargne mensuelle",
    mira_recommended_reserve: "Réserve MIRA Recommandée",
    reserve_target_desc: "Objectif de 6 mois de sécurité (3 mois: {val3}€)",
    compare_off: "Désactivé",
    placeholder_ex_from_tab1: "Ex: {val}€ (de Tab 1)",
    placeholder_ex_1500: "Ex: 1500",
    so_sim_title: "Simulateur de Salaire Net (Salarié / Contrat Standard)",
    so_sim_subtitle: "Calcul selon les barèmes officiels de retenue IRS (2026) & Sécurité Sociale (11%)",
    duodecimos_badge_13_14: "13e et 14e Mois",
    irs_jovem_desc_field: "Exonération partielle pendant les 10 premières années d'activité (jusqu'à 35 ans). Plafond annuel: 55 × IAS (29.542,15 €).",
    irs_jovem_y1: "1ère Année",
    irs_jovem_y2_4: "2e–4e Années",
    irs_jovem_y5_7: "5e–7e Années",
    irs_jovem_y8_10: "8e–10e Années",
    irs_jovem_opt_1: "1ère Année (100% Exonération)",
    irs_jovem_opt_2: "2ème Année (75% Exonération)",
    irs_jovem_opt_3: "3ème Année (75% Exonération)",
    irs_jovem_opt_4: "4ème Année (75% Exonération)",
    irs_jovem_opt_5: "5ème Année (50% Exonération)",
    irs_jovem_opt_6: "6ème Année (50% Exonération)",
    irs_jovem_opt_7: "7ème Année (50% Exonération)",
    irs_jovem_opt_8: "8ème Année (25% Exonération)",
    irs_jovem_opt_9: "9ème Année (25% Exonération)",
    irs_jovem_opt_10: "10ème Année (25% Exonération)",
    meal_taxable_alert: "Attention : Indemnité Repas Imposable",
    meal_taxable_sub: "L'excédent quotidien de {excess}€/jour (au-dessus du plafond exonéré de {cap}) sera soumis à 11% de Sécurité Sociale et IRS.",
    calc_result_2026: "Résultat du Calcul (2026)",
    calc_result_title: "Résultat du Calcul",
    effective_irs_rate: "Taux Effectif IRS",
    effective_tax_rate: "Taux Effectif d'Imposition",
    net_income_available: "Revenu Net Mensuel Disponible",
    payslip_breakdown: "Ventilation de la Fiche de Paie",
    remun_bruta_sujeita: "Rémunération Brute Imposable",
    duodecimo_vac_line: "• Douzième Prime Vacances :",
    duodecimo_xmas_line: "• Douzième Prime Noël :",
    ss_worker_11: "Sécurité Sociale Salarié (11%)",
    irs_withholding_line: "Retenue à la Source IRS",
    meal_exempt_line: "Prime de Repas Exonérée",
    meal_taxed_line: "Prime de Repas Imposée (au brut)",
    salary_legal_basis_note: "Calcul basé sur le Modèle Marginal Officiel du Fisc portugais (AT 2026), Sécurité Sociale (11%) et plafonds légaux de panier-repas (Arrêté 51-B/2026 : exonéré jusqu'à 10,46 €/jour sur carte ou 6,15 € en espèces).",
    rv_sim_title: "Simulateur Reçus Verts (Indépendant / Freelance)",
    rv_sim_subtitle: "Cotisations Sécurité Sociale (21,4% sur 70% de base) & retenue d'impôt Catégorie B",
    rv_irs_jovem_title: "IRS Jovem (Art. 12-B CIRS) pour Catégorie B",
    rv_irs_jovem_desc: "Applicable aux travailleurs indépendants jusqu'à 35 ans titulaires d'un diplôme d'études supérieures.",
    rv_deductions_title: "Retenues et Cotisations",
    ss_ti_line: "Sécurité Sociale (21,4% sur 70% Base)",
    ss_var_0_short: "0% Standard",
    rv_legal_note: "Les Recibos Verdes calculent la Sécurité Sociale sur 70% de la facturation brute en services (ou 20% en ventes) au taux de 21,4% (Indépendant Général) ou 25,2% (ENI).",
    hp_title: "MIRA Housing Intelligence & Affordability 2026",
    hp_subtitle: "Observatoire Territorial (INE vs Portais) et Simulateurs Réglementaires de Location et d'Acquisition",
    hp_mode_rent: "🏠 Location & Porta 65",
    hp_mode_buy: "🏦 Achat & Prêt Immobilier",
    hp_territory_label: "📍 Unité Territoriale / Municipalité",
    hp_municipality_tag: "(Municipalité / INE Officiel)",
    hp_district_tag: "(District / Agrégation MIRA)",
    hp_typology_label: "📐 Typologie de Logement",
    hp_age_label: "🎂 Âge du Candidat (Ans)",
    hp_buyer_age_label: "🎂 Âge de l'Emprunteur le Plus Âgé",
    hp_youth_guarantee_toggle: "Garantie Publique Jeunes (DL 44/2024)",
    hp_rent_inputs_title: "Données de Revenus & Bail",
    hp_net_income_label: "💰 Revenu Net Mensuel Disponible (€)",
    hp_net_income_help: "Utilisé pour le taux d'effort et la prudence MIRA.",
    hp_gross_income_label: "💼 Revenu Brut Mensuel du Foyer (€)",
    hp_gross_income_help: "Obligatoire pour vérifier la règle du taux d'effort brut ≤ 60% pour Porta 65.",
    hp_rent_label: "🏠 Loyer Mensuel Visé (€)",
    hp_rent_help: "Laissez 0 ou vide pour utiliser la référence officielle du marché.",
    hp_expenses_label: "🛒 Total des Autres Dépenses Mensuelles (€)",
    hp_territorial_obs_title: "Observatoire Territorial MIRA",
    hp_ine_contracted: "INE Enregistré",
    hp_portals_asking: "Portails Affiché",
    hp_asking_spread: "Écart d'Offre",
    hp_spread_help: "Pression des bailleurs face aux nouveaux baux déclarés au fisc",
    hp_initial_capital_title: "Capital Initial (Art. 1076 Code Civil)",
    hp_first_month_rent: "1er Loyer d'Entrée :",
    hp_advance_rent: "Avance de Loyer (jusqu'à 2 mois) :",
    hp_security_deposit: "Caution (jusqu'à 2 mois) :",
    hp_cc1076_legal_note: "plafond légal maximal autorisé (5 loyers au total) ; non obligatoire si le propriétaire accepte un montant inférieur.",
    hp_porta65_title: "Sélection Porta 65 Jeunes",
    hp_porta65_pre_pass: "✓ Pré-Approuvé",
    hp_porta65_rejected: "Refusé à la Sélection",
    hp_porta65_rma_label: "RMA Municipale",
    hp_porta65_cap_rma: "Plafond 4× RMA Municipale :",
    hp_porta65_cap_rmmg: "Plafond 4× SMIC 2026 :",
    hp_porta65_gross_effort: "Effort Brut (max 60%) :",
    hp_effort_rate_title: "Taux d'Effort pour le Logement MIRA",
    hp_effort_mira_guide: "≤35% Directive Prudentielle MIRA",
    hp_effort_critical_risk: ">50% Risque Critique",
    hp_buy_inputs_title: "Données du Bien & Financement",
    hp_buy_price_label: "🏷️ Prix d'Acquisition du Bien (€)",
    hp_appraisal_label: "🔍 Valeur d'Évaluation Bancaire (€)",
    hp_appraisal_help: "La Banque du Portugal impose le calcul sur min(prix, évaluation).",
    hp_own_capital_label: "💰 Apport Personnel Disponible (€)",
    hp_buyer_net_income_label: "💳 Revenu Net Mensuel du Foyer (€)",
    hp_other_debts_label: "🧾 Autres Mensualités de Crédits Actuels (€)",
    hp_first_hpp_toggle: "1ère Résidence Principale Permanente (HPP)",
    hp_owns_prop_toggle: "Êtes-vous actuellement propriétaire d'un logement ?",
    hp_owns_last3y_toggle: "Étiez-vous propriétaire au cours des 3 dernières années ? (IMT Jeune)",
    hp_financing_title: "Cadre de Financement Immobilier",
    hp_financing_sub: "LTV, Montant Financé & Mensualité",
    hp_max_ltv: "LTV Max :",
    hp_eligible_base: "Base Éligible min(Prix,Éval)",
    hp_price_vs_appraisal: "Prix vs Évaluation",
    hp_loan_amount: "Montant Financé",
    hp_effective_ltv: "LTV Effectif :",
    hp_monthly_mortgage: "Mensualité Estimée",
    hp_bdp_regulated_years: "ans (Réglementation BdP)",
    hp_imt_jovem_title: "IMT Jeune (DL 48-A/2024)",
    hp_imt_jovem_applied: "✓ Exonération Appliquée",
    hp_imt_jovem_normal: "Imposition Ordinaire",
    hp_imt_tax_suffix: "d'IMT",
    hp_imt_jovem_savings: "Économie d'IMT :",
    hp_stamp_duty_savings: "Économie Droit de Timbre :",
    hp_imt_jovem_legal_basis: "Régime fiscal 2026 fondé sur l'Instruction 40019/2024 du fisc. Exonération intégrale jusqu'à 316.772 € et partielle jusqu'à 633.453 €.",
    hp_guarantee_title: "Garantie Publique de l'État (DL 44/2024)",
    hp_guarantee_eligible: "✓ Éligible",
    hp_guarantee_ineligible: "Inéligible",
    hp_guarantee_explanation: "Garantie de l'État jusqu'à 15% de min(prix, évaluation), autorisant un crédit bancaire jusqu'à 100% pour les transactions jusqu'à 450.000 €.",
    hp_total_initial_capital: "Capital Initial Total Estimé",
    hp_downpayment_taxes_notary: "Apport + Impôts + Frais Notariés",
    aima_diag_title: "Diagnostic AIMA & Santé Financière 2026",
    aima_diag_subtitle: "Vérifie si vos revenus respectent les seuils légaux minimaux exigés pour le Titre de Séjour au Portugal",
    aima_portaria_badge: "Arrêté 1563/2007 du 11/12",
    aima_lei_badge: "Loi 23/2007 — Loi sur les Étrangers",
    aima_rmmg_badge: "SMIC 2026: 920€ / mois",
    aima_data_title: "Vos Données de Revenus et Ménage",
    aima_data_sub: "Remplissez les champs avec vos chiffres réels pour vérifier la conformité AIMA",
    aima_net_label: "💰 Revenu Net Mensuel (€)",
    aima_net_help: "Le montant net perçu après toutes cotisations sociales et retenues IRS.",
    aima_dep_label: "👨‍👩‍👧 Nbre de Personnes à Charge dans le Foyer",
    aima_dep_help: "Conjoint sans revenus, enfants mineurs ou ascendants à charge.",
    aima_no_dep: "(Sans dépendants)",
    aima_one_dep: "dépendant",
    aima_multi_dep: "dépendants",
    aima_rent_label: "🏠 Loyer Mensuel (€)",
    aima_rent_help: "Montant mensuel payé pour le logement.",
    aima_exp_label: "🛒 Total des Dépenses Mensuelles (€)",
    aima_exp_help: "Comprend loyer + nourriture + transports + factures.",
    aima_ss_label: "🛡️ Niveau de Cotisation à la Sécurité Sociale (ISS)",
    aima_ss_help: "Le régime et montant déclarés sur votre relevé de Sécurité Sociale.",
    aima_ss_outrem: "Salarié (Déduction intégrale de 11% sur Salaire Brut)",
    aima_ss_recibos: "Indépendant Général (21,4% SS sur 70% Facturation Réelle)",
    aima_ss_reduced: "Indépendant avec Option d'Assiette Réduite (-25%)",
    aima_ss_min: "⚠️ Cotisation Minimale Symbolique (20€ / mois)",
    aima_res_title: "Résultats du Diagnostic AIMA",
    aima_viability_index: "Indice de Viabilité AIMA",
    aima_score_high: "🟢 Excellent & Durable",
    aima_score_med: "🟡 Stable avec Vigilance",
    aima_score_low: "🔴 Risque de Notification / Refus",
    aima_est_ss: "Retenue SS Estimée",
    aima_ss_alert_title: "⚠️ Alerte Risque Grave AIMA : Incohérence Sécurité Sociale",
    aima_ss_alert_desc: "L'AIMA croise les relevés de rémunération de la Sécurité Sociale en temps réel. Déclarer des revenus suffisants pour les seuils de subsistance mais ne verser que le plancher de 20€/mois ou forcer une réduction de -25% génère une grave incohérence fiscale. L'AIMA présume l'absence de revenus réels et émet une Intention de Rejet.",
    aima_legal_subsistence_check: "Vérification de Subsistance Légale AIMA",
    aima_meets_threshold: "✓ Respecte le Seuil Minimal",
    aima_threshold_warn: "⚠️ Attention / Risque d'Incohérence",
    aima_net_income: "Revenu Net",
    per_month: "par mois",
    aima_min_threshold: "Seuil Légal Minimal AIMA",
    difference: "Différence",
    above_threshold: "au-dessus du seuil",
    below_threshold: "en dessous du seuil",
    aima_legal_basis_note: "Selon l'Arrêté n° 1563/2007 du 11 décembre, les moyens de subsistance requis pour la délivrance et le renouvellement du Titre de Séjour sont calculés sur le SMIC portugais (RMMG 2026 = 920€) : 100% SMIC (920€) pour le premier adulte + 30% SMIC (276€) par dépendant supplémentaire.",
    aima_net_balance: "Solde Mensuel Disponible",
    aima_income_minus_expenses: "Revenus − Total Dépenses",
    aima_recommended_stability: "Recommandé pour la stabilité financière",
    aima_setup_capital_title: "Capital d'Installation Logement",
    aima_setup_capital_desc: "2 Cautions + 1 Loyer d'Avance",
    pe_sim_title: "Simulateur pour Entrepreneurs & Micro-entreprises",
    pe_sim_subtitle: "Estimation de rentabilité, fiscalité (IS 15% PME / IRS Simplifié) et trésorerie pour ENI et SARL Unipersonnelle (2026)",
    pe_badge_irc: "IS Réduit PME : 15,0% (1ers 50k€)",
    pe_badge_tsu: "Gérant : TSU 34,75%",
    pe_badge_breakeven: "Seuil de Rentabilité Automatique",
    pe_form_title: "Données Financières de l'Entreprise",
    pe_revenue_label: "💰 Chiffre d'Affaires Mensuel Brut (€)",
    pe_revenue_help: "Total facturé aux clients par mois (hors TVA).",
    pe_expenses_label: "📦 Dépenses Opérationnelles Mensuelles (€)",
    pe_expenses_help: "Loyer des locaux, fournisseurs, comptable, licences, charges.",
    pe_sector_label: "🏷️ Secteur d'Activité",
    pe_opt_services: "Prestations de Services & Tech (Coeff. 0.75)",
    pe_opt_commerce: "Commerce / Boutiques / Restauration (Coeff. 0.15)",
    pe_opt_hospitality: "Meublés Touristiques & Tourisme (Coeff. 0.35)",
    pe_opt_industry: "Industrie / Atelier / Artisanat (Coeff. 0.35)",
    pe_structure_label: "🏛️ Forme Juridique",
    pe_opt_lda: "Société Unipersonnelle Lda / PME (IS 15%)",
    pe_opt_eni: "Entrepreneur Individuel — ENI (IRS Simplifié)",
    pe_prolabore_label: "👔 Rémunération du Gérant (€/mois)",
    pe_prolabore_help: "Rémunération mensuelle fixe du gérant (soumise à 34,75% TSU — Art. 69 CRC).",
    pe_res_title: "Performance Financière de l'Activité",
    pe_margin_label: "Marge Nette",
    pe_net_profit_title: "Bénéfice Net Mensuel Disponible",
    pe_net_profit_calc: "Chiffre d'Affaires ({bizRevenue}€) − Dépenses ({bizExpenses}€) − Impôts/SS ({res.totalTaxes}€)",
    pe_gross_op_profit: "Bénéfice Brut d'Exploitation",
    pe_before_taxes: "Avant impôts et cotisations",
    pe_estimated_taxes: "Impôts Estimés",
    pe_tax_label_irc: "IS 15% PME",
    pe_tax_label_irs: "IRS Simplifié",
    pe_ss_tsu_label: "Sécurité Sociale / TSU",
    pe_ss_label_tsu: "TSU Gérant (34,75%)",
    pe_ss_label_eni: "Sécurité Sociale ENI (25,2%)",
    pe_breakeven_title: "Seuil de Rentabilité (Break-Even Mensuel)",
    pe_breakeven_sub: "Chiffre d'affaires mensuel minimal pour couvrir toutes les charges et impôts sans perte",
    pe_edu_note: "Au Portugal, les PME éligibles sur le continent bénéficient d'un taux réduit d'impôt sur les sociétés (IRC) de 15,0% sur les premiers 50.000€ de bénéfice imposable et de 19,0% au-delà (Art. 87 CIRC / Loi de Finances 2026). Les gérants de sociétés unipersonnelles s'acquittent d'une TSU statutaire de 34,75% (23,75% employeur + 11,0% gérant — Art. 69/2 CRC).",
    badge_at: "AT (IRS 2026)",
    badge_ine: "INE (Prix Loyers)",
    badge_iss: "ISS (Sécurité Sociale TI)",
    badge_bdp: "Banque du Portugal",
    title: 'Simulateurs Économiques MIRA',
    subtitle: 'Indicateurs Financiers Officiels (2026)',
    tab_1_salary: '💰 1. Salaire Net',
    tab_2_recibos: '💼 2. Reçus Verts',
    tab_3_ss: '🛡️ 3. Sécurité Sociale',
    tab_4_reforma: '🏛️ 4. Retraite & CSI',
    tab_5_cost: '🗺️ 5. Coût de la Vie',
    tab_6_housing: '🏠 6. Logement',
    tab_7_aima: '🩺 7. Exigences AIMA',
    tab_8_business: '🏢 8. Entreprise',
    tab_salary: 'Salaire Net',
    tab_cost: 'Coût de la Vie',
    tab_health: 'Santé Financière',
    work_regime: 'Régime de Travail',
    conta_outrem: 'Salarié (Contrat de Travail / Catégorie A)',
    recibos_verdes: 'Recibos Verdes (Travailleur Indépendant / Catégorie B)',
    gross_salary: 'Salaire Brut Mensuel',
    invoice_monthly: 'Facturation Mensuelle Brute',
    activity_type: 'Type d\'Activité',
    service_provision: 'Prestation de Services (70% Base SS / 25% Impôt)',
    product_sales: 'Vente de Produits / Restauration (20% Base SS / 11,5% Impôt)',
    scientific_activity: 'Activités Scientifiques/Artistiques (70% Base SS / 16,5% Impôt)',
    irs_withholding: 'Retenue à la Source (IRS)',
    irs_normal: 'Retenue Standard IRS (Art. 101 CIRS)',
    irs_exempt_101b: 'Exonération de Retenue (Art. 101-B CIRS jusqu\'à 15.000€/an)',
    ss_regime: 'Régime de Sécurité Sociale',
    ss_normal: 'Travailleur Indépendant Général (21,4%)',
    ss_eni: 'Entrepreneur Individuel - ENI (25,2%)',
    ss_exempt_year1: 'Exonération 1ère Année d\'Activité (0%)',
    ss_variation: 'Ajustement Trimestriel de la Base (SS)',
    ss_var_0: 'Conserver la Base Standard (0%)',
    ss_var_minus25: 'Option de Réduction de la Base (-25%)',
    ss_var_plus25: 'Option d\'Augmentation de la Base (+25%)',
    family_status: 'Situation Familiale',
    single: 'Célibataire / Divorcé',
    married_1: 'Marié (1 seul Titulaire de Revenus)',
    married_2: 'Marié (2 Titulaires de Revenus)',
    dependents: 'Nombre de Dépendants',
    region: 'Région Fiscale',
    continent: 'Portugal Continental',
    madeira: 'Région Autonome de Madère (Barèmes Régionaux 2026)',
    azores: 'Région Autonome des Açores (Arrêté 1179/2026)',
    irs_jovem: 'Régime IRS Jovem (Art. 12-B CIRS)',
    irs_jovem_active: 'Appliquer le Bénéfice IRS Jovem (18-35 Ans)',
    irs_jovem_year: 'Année du Bénéfice',
    year_1: '1ère Année (100% Exonération)',
    years_2_4: '2ème à 4ème Année (75% Exonération)',
    years_5_7: '5ème à 7ème Année (50% Exonération)',
    years_8_10: '8ème à 10ème Année (25% Exonération)',
    meal_allowance: 'Indemnité Repas (Journalière)',
    meal_type: 'Mode de Paiement',
    cash: 'Espèces / Virement (Plafond Exonéré 6,15€)',
    card: 'Carte Repas (Plafond Exonéré 10,46€)',
    duodecimos_title: 'Régime de Douzièmes (Primes Vacances & Noël)',
    duodecimos_none: 'Sans Douzièmes (Standard 14 Mois)',
    duodecimos_half_vac: '50% Prime Vacances sur 12 Mois',
    duodecimos_half_xmas: '50% Prime Noël sur 12 Mois',
    duodecimos_half_both: '50% des Deux Primes sur 12 Mois',
    duodecimos_full_both: '100% des Deux Primes (12 Mois)',
    employer_cost_title: 'Coût Total pour l\'Employeur',
    tsu_company: 'Sécurité Sociale Patronale (23,75%)',
    irs_jovem_badge_saved: 'Économie IRS Jovem',
    meal_taxable_warning: 'Attention: L\'excédent quotidien d\'indemnité repas est soumis à 11% de Sécurité Sociale et IRS.',
    work_days: 'Jours de Travail (Mois)',
    results: 'Résultats de la Simulation',
    net_salary_total: 'Salaire Net Mensuel Estimé',
    net_income_recibos: 'Revenu Net Mensuel Disponible',
    deductions: 'Retenues et Cotisations Officielles',
    social_security: 'Sécurité Sociale (TI 21,4% / 70% Base)',
    irs: 'Retenue à la Source (IRS 2026)',
    meal_taxed: 'Indemnité Repas Imposée',
    meal_exempt: 'Indemnité Repas Exonérée',
    total_tax_load: 'Charge Fiscale Effective Totale',
    effective_rate: 'Taux Effectif d\'Imposition',
    district: 'District de Destination',
    housing: 'Type de Logement',
    shared_room: 'Chambre Partagée',
    t1_apartment: 'Appartement T1',
    t2_apartment: 'Appartement T2',
    food_style: 'Style d\'Alimentation',
    cook_home: 'Cuisiner à la Maison (Économique)',
    mixed: 'Style Mixte (Équilibré)',
    eat_out: 'Manger Dehors (Fréquent)',
    transport: 'Transport & Mobilité',
    public_pass: 'Abonnement de Transports en Commun',
    own_car: 'Voiture Personnelle (Carburant + Entretien)',
    utilities_leisure: 'Charges et Loisirs',
    utilities_basic: 'Basique (Eau, Électricité, Internet, Gaz)',
    utilities_active: 'Actif (Charges + Loisirs/Restaurants)',
    monthly_budget: 'Budget Mensuel Estimé',
    comparison: 'Comparateur de Districts',
    compare_with: 'Comparer avec un autre District',
    no_compare: 'Aucun (Vue Unique)',
    cost_housing: 'Logement (Loyer Moyen INE)',
    cost_food: 'Alimentation',
    cost_transport: 'Transports',
    cost_utilities: 'Charges & Extras',
    cost_total: 'Coût Total Estimé',
    savings_calc: 'Économie Mensuelle Estimée',
    savings_text: 'En choisissant {d1} au lieu de {d2}, vous pouvez économiser environ {val}€ par mois !',
    note_title: 'Sources Officielles Vérifiées',
    note_text: 'Calculs mis à jour selon les Barèmes Officiels de l\'Autorité Fiscale (AT 2026), le Code de la Sécurité Sociale (11% salariés / TI 21,4%), les Statistiques de l\'INE et les Recommandations de la Banque du Portugal.',
    cap_notice: 'En 2026, l\'exonération fiscale de la prime de repas s\'élève à 6,00€/jour en espèces ou 9,60€/jour par carte-repas.',
    active_comparison: 'Comparaison Active',
    housing_search_title: 'Rechercher des Logements sur les Portails Officiels',
    housing_search_sub: 'Consultez les offres en temps réel sur les portails immobiliers vérifiés :',
    household_size: 'Taille du Ménage',
    person: 'Personne',
    people: 'Personnes',
    utilities_per_person: 'Par personne : {val}€',
    effort_rate_title: 'Taux d\'Effort pour le Logement',
    effort_rate_sub: 'Ratio du loyer par rapport au salaire net (Recommandation Banque du Portugal)',
    effort_healthy: 'Sain (<= 35%)',
    effort_warning: 'Avertissement / Effort Modéré (36% - 50%)',
    effort_critical: 'Risque Élevé (> 50%)',
    net_surplus: 'Marge Financière Mensuelle',
    net_deficit: 'Déficit Mensuel Estimé',
    setup_budget_title: 'Capital d\'Installation Recommandé',
    setup_budget_sub: '2 Mois de Loyer + 1 Mois de Caution (Art. 1076 C. Civil) + 3 Mois de Charges',
    emergency_fund_title: 'Fonds d\'Urgence Recommandé',
    emergency_fund_sub: '3 Mois de frais de subsistance selon la Banque du Portugal',
    rv_guide_badge: "Manuel Pratique & Législation 2026",
    rv_guide_title: "Comment Choisir Votre Régime de Cotisation & Sécurité Sociale",
    rv_guide_subtitle: "Guide officiel détaillé pour savoir exactement quelles options choisir pour votre activité indépendante au Portugal.",
    rv_sec_ss_title: "1. Régimes de Sécurité Sociale : Lequel choisir ?",
    rv_ss_ti_name: "Travailleur Indépendant Général (21,4%)",
    rv_ss_ti_who: "Pour qui :",
    rv_ss_ti_who_desc: "La grande majorité des freelances, prestataires de services, consultants, développeurs et indépendants.",
    rv_ss_ti_how: "Comment fonctionne le calcul :",
    rv_ss_ti_how_desc: "Le taux de 21,4% s'applique sur 70% de la facturation trimestrielle moyenne déclarée sur SS Direta. Ex. : facturation de 1.000€/mois, base de 700€, cotisation de 149,80€/mois.",
    rv_ss_eni_name: "Entrepreneur Individuel - ENI (25,2%)",
    rv_ss_eni_who: "Pour qui :",
    rv_ss_eni_who_desc: "Personnes exerçant une activité commerciale ou industrielle en nom propre avec établissement.",
    rv_ss_eni_how: "Comment fonctionne le calcul :",
    rv_ss_eni_how_desc: "Le taux est de 25,2% appliqué à la base de cotisation réglementaire.",
    rv_ss_exempt_name: "Exonération 1ère Année d'Activité (Art. 157 CRC)",
    rv_ss_exempt_who: "Pour qui :",
    rv_ss_exempt_who_desc: "Citoyens débutant une activité indépendante pour la toute première fois au Portugal.",
    rv_ss_exempt_how: "Comment ça marche :",
    rv_ss_exempt_how_desc: "Exonération totale des cotisations de Sécurité Sociale pendant les 12 premiers mois (0€/mois). Si vous avez déjà eu une activité, cette exonération ne se renouvelle pas.",
    rv_sec_var_title: "2. Ajustement Trimestriel de la Base SS (-25% / 0% / +25%)",
    rv_var_sub: "Lors de votre Déclaration Trimestrielle sur SS Direta, vous pouvez ajuster votre base :",
    rv_var_0_name: "Conserver la Base Standard (0%)",
    rv_var_0_desc: "Vous payez la cotisation standard calculée sur les 3 derniers mois.",
    rv_var_minus_name: "Option de Réduction de Base (-25%)",
    rv_var_minus_desc: "Réduit de 25% votre cotisation mensuelle pour soulager la trésorerie. ⚠️ Attention : réduit proportionnellement les indemnités maladie, maternité/paternité et retraite.",
    rv_var_plus_name: "Option d'Augmentation de Base (+25%)",
    rv_var_plus_desc: "Augmente de 25% votre cotisation. Idéal pour ceux qui planifient un congé parental ou souhaitent cumuler plus de droits à la retraite.",
    rv_sec_act_title: "3. Type d'Activité et Coefficients Fiscaux",
    rv_act_services_name: "Prestation de Services Générale (Art. 151 CIRS)",
    rv_act_services_desc: "En régime simplifié, 75% des revenus sont imposables et 25% considérés comme charges. À la Sécurité Sociale, la base est de 70%. La retenue standard sur facture est de 25% (ou 16,5%).",
    rv_act_scientific_name: "Activités Scientifiques, Techniques et Artistiques",
    rv_act_scientific_desc: "Ingénieurs, médecins, artistes et consultants spécialisés. Retenue à la source de 20% à 25% sur les revenus de Catégorie B.",
    rv_act_products_name: "Vente de Marchandises & Produits / Restauration",
    rv_act_products_desc: "Pour la vente de biens physiques. Base SS de 20% et assiette fiscale de 15% en IRS simplifié, sans retenue à la source.",
    rv_sec_wh_title: "4. Retenue à la Source IRS : Normale vs Exonération",
    rv_wh_normal_name: "Retenue Standard IRS",
    rv_wh_normal_desc: "Obligatoire lors de la facturation d'entreprises. Le client retient l'impôt et le verse à l'administration fiscale.",
    rv_wh_exempt_name: "Exonération de Retenue (Art. 101-B jusqu'à 15.000€/an)",
    rv_wh_exempt_desc: "Si vous prévoyez facturer moins de 15.000€ en 2026, vous pouvez émettre sans retenue. ⚠️ L'impôt sera régularisé lors de la déclaration annuelle (Modelo 3).",
    rv_sec_jovem_title: "5. IRS Jovem pour Indépendants (Art. 12-B CIRS)",
    rv_sec_jovem_desc: "Jeunes jusqu'à 35 ans diplômés bénéficient d'une exonération progressive : 100% an 1, 75% ans 2-4, 50% ans 5-7 et 25% ans 8-10.",
    so_guide_badge: "Guide Social & Fiscal 2026",
    so_guide_title: "Comment Fonctionne Votre Salaire Net (Salarié)",
    so_guide_subtitle: "Comprendre en détail les cotisations de Sécurité Sociale, retenues d'impôt IRS et avantages de votre contrat au Portugal.",
    so_sec_ss_title: "1. Sécurité Sociale du Salarié (11% + 23,75% Employeur)",
    so_ss_worker_name: "Cotisation Salariale (11%)",
    so_ss_worker_desc: "Déduite automatiquement du salaire brut. Ouvre droit au chômage, indemnités maladie, congé maternité/paternité et retraite.",
    so_ss_company_name: "Cotisation Patronale TSU (23,75%)",
    so_ss_company_desc: "Payée directement par l'employeur à la Sécurité Sociale (non déduite du net). Représente la contribution patronale à la protection sociale.",
    so_sec_irs_title: "2. Retenue à la Source IRS & Déclaration Annuelle",
    so_irs_desc: "Les barèmes mensuels fixent la retenue à la source. En avril/juin de l'année suivante (déclaration Modelo 3), le solde réel est calculé : remboursement ou régularisation.",
    so_sec_meal_title: "3. Prime de Repas (Carte vs Espèces)",
    so_meal_card_name: "Carte Déjeuner (Plafond Exonéré : 9,60€/jour)",
    so_meal_card_desc: "Jusqu'à 9,60€ par jour ouvré payés par carte déjeuner sont 100% exonérés d'impôt IRS et de Sécurité Sociale.",
    so_meal_cash_name: "Espèces / Virement (Plafond Exonéré : 6,00€/jour)",
    so_meal_cash_desc: "En espèces, le plafond exonéré est de seulement 6,00€/jour. Tout montant supérieur est imposé comme salaire normal.",
    so_sec_jovem_title: "4. Avantage IRS Jovem (Art. 12-B CIRS)",
    so_sec_jovem_desc: "Les salariés jusqu'à 35 ans diplômés bénéficient de 10 ans d'exonérations progressives : 100% an 1, 75% ans 2-4, 50% ans 5-7 et 25% ans 8-10.",
    so_sec_family_title: "5. Situation Familiale, Enfants & Régions Autonomes",
    so_family_desc: "Les personnes à charge et le statut marital réduisent le taux de retenue. Les résidents fiscaux à Madère ont -20% d'IRS et aux Açores -30%.",
    pe_guide_badge: "Manuel Entreprise & Fiscalité 2026",
    pe_guide_title: "Guide Stratégique pour Entrepreneurs & PME",
    pe_guide_subtitle: "Comment choisir entre Entreprise Individuelle (ENI) et Société Lda, optimiser la fiscalité et calculer la rentabilité de votre activité.",
    pe_sec_legal_title: "1. Forme Juridique : ENI vs Société Unipersonnelle Lda",
    pe_legal_lda_name: "Société Unipersonnelle Lda / PME (Recommandé)",
    pe_legal_lda_desc: "Responsabilité limitée au capital social (min 1€). Votre patrimoine personnel est 100% protégé des dettes de l'entreprise. Impôt sur les sociétés (IRC) réduit à 12,5% sur les premiers 50.000€ de bénéfice.",
    pe_legal_eni_name: "Entrepreneur Individuel - ENI",
    pe_legal_eni_desc: "Création rapide sans capital minimum, mais responsabilité illimitée sur les biens personnels. Imposé en IRS individuel simplifié.",
    pe_sec_remun_title: "2. Rémunération du Gérant (Salaire) vs Dividendes",
    pe_remun_moe_name: "Salaire du Gérant (TSU 33,05%)",
    pe_remun_moe_desc: "Le gérant fixe un salaire mensuel soumis à 33,05% de cotisations Sécurité Sociale, garantissant une couverture sociale complète.",
    pe_remun_profit_name: "Distribution de Dividendes / Bénéfices",
    pe_remun_profit_desc: "Le bénéfice net après impôt sur les sociétés peut être versé aux associés avec une retenue forfaitaire libératoire de 28% en IRS.",
    pe_sec_sector_title: "3. Secteurs & Coefficients en Régime Simplifié",
    pe_sector_services_name: "Services & Technologies (Coefficient 0.75)",
    pe_sector_services_desc: "L'administration impose 75% du chiffre d'affaires et déduit forfaitairement 25% de frais d'activité.",
    pe_sector_commerce_name: "Commerce & Restauration (Coefficient 0.15)",
    pe_sector_commerce_desc: "Imposition sur seulement 15% du chiffre d'affaires brut, reflétant les marges commerciales.",
    pe_sector_tourism_name: "Hébergement Touristique & Industrie (Coefficient 0.35)",
    pe_sector_tourism_desc: "Imposition sur 35% du chiffre d'affaires pour les meublés touristiques et ateliers.",
    pe_sec_iva_title: "4. TVA et Régime de Franchise (Art. 53 CIVA)",
    pe_iva_desc: "Les entreprises réalisant moins de 15.000€ de chiffre d'affaires en 2026 peuvent opter pour la franchise de TVA (Art. 53) sans facturer ni déduire de TVA.",
    pe_sec_breakeven_title: "5. Seuil de Rentabilité (Break-Even Mensuel)",
    pe_breakeven_desc: "Le montant mensuel minimum de chiffre d'affaires nécessaire pour couvrir 100% des frais fixes, salaires et impôts sans perte financière.",
  }
};


export const SimulatorsView: React.FC<SimulatorsViewProps> = ({ language, onViewChange, initialTab, initialParams, onEarnPoints }) => {
  type SimulatorTab = 
    | 'salary_outrem' 
    | 'salary_recibos' 
    | 'ss_contributions' 
    | 'reforma' 
    | 'cost' 
    | 'housing_protection' 
    | 'aima_health' 
    | 'small_business';

  const [activeTab, setActiveTab] = useState<SimulatorTab>('salary_outrem');
  const [salaryRegime, setSalaryRegime] = useState<'outrem' | 'recibos'>('outrem');

  const normLang = (language || 'PT').toUpperCase().split('-')[0];
  const lang = ['PT', 'EN', 'ES', 'FR'].includes(normLang) ? normLang : 'PT';
  const tLocal = (key: string) => translations[lang]?.[key] || translations['PT']?.[key] || key;

  useEffect(() => {
    const tabKey = initialTab || initialParams?.tab;
    if (tabKey) {
      if (tabKey === 'salario' || tabKey === 'salary' || tabKey === 'salary_outrem') {
        setActiveTab('salary_outrem');
        setSalaryRegime('outrem');
      } else if (tabKey === 'recibos' || tabKey === 'salary_recibos') {
        setActiveTab('salary_recibos');
        setSalaryRegime('recibos');
      } else if (tabKey === 'ss' || tabKey === 'ss_contributions' || tabKey === 'seguranca_social' || tabKey === 'niss_sim') {
        setActiveTab('ss_contributions');
      } else if (tabKey === 'reforma' || tabKey === 'retirement' || tabKey === 'aposentadoria' || tabKey === 'csi') {
        setActiveTab('reforma');
      } else if (tabKey === 'custo_vida' || tabKey === 'cost') {
        setActiveTab('cost');
      } else if (tabKey === 'habitacao' || tabKey === 'housing' || tabKey === 'housing_protection') {
        setActiveTab('housing_protection');
      } else if (tabKey === 'aima_ss' || tabKey === 'aima' || tabKey === 'aima_health') {
        setActiveTab('aima_health');
      } else if (tabKey === 'empreendedor' || tabKey === 'business' || tabKey === 'small_business') {
        setActiveTab('small_business');
      }
    }

    if (initialParams) {
      const bruto = initialParams.bruto || initialParams.salary || initialParams.gross;
      if (bruto && !isNaN(Number(bruto))) {
        setGrossSalary(Number(bruto));
      }
      const fatura = initialParams.faturacao || initialParams.invoice;
      if (fatura && !isNaN(Number(fatura))) {
        setMonthlyInvoice(Number(fatura));
      }
      const renda = initialParams.renda || initialParams.rent;
      if (renda && !isNaN(Number(renda))) {
        setHpMonthlyRent(Number(renda));
      }
      const rendimento = initialParams.rendimento || initialParams.income;
      if (rendimento && !isNaN(Number(rendimento))) {
        setHpNetIncome(Number(rendimento));
      }
      const dist = initialParams.distrito || initialParams.district;
      if (dist && DISTRICT_COST_DATA[dist]) {
        setDistrict1(dist);
      }
    }
  }, [initialTab, initialParams]);

  useEffect(() => {
    let userId = 'guest';
    try {
      const currentUserStr = localStorage.getItem('mira_user');
      if (currentUserStr) {
        const u = JSON.parse(currentUserStr);
        if (u && u.id) userId = u.id;
      }
    } catch (e) {}
    analytics.track('use_simulator', userId, 'Finanças & Impostos', { simulatorId: activeTab });
    analytics.track('view_changed', userId, 'Navegação & Interações', { view: `simulator_${activeTab}` });
  }, [activeTab, salaryRegime]);

  // ─── CONTA DE OUTREM SIMULATOR STATE ──────────────────────────────────────
  const [grossSalary, setGrossSalary] = useState<number>(1500);
  const [familyStatus, setFamilyStatus] = useState<string>('single');
  const [dependents, setDependents] = useState<number>(0);
  const [fiscalRegion, setFiscalRegion] = useState<string>('continent');
  const [mealAllowance, setMealAllowance] = useState<number>(10.46);
  const [mealType, setMealType] = useState<string>('card');
  const [workDays, setWorkDays] = useState<number>(22);
  const [isIrsJovem, setIsIrsJovem] = useState<boolean>(false);
  const [irsJovemYear, setIrsJovemYear] = useState<number>(1);
  const [duodecimosMode, setDuodecimosMode] = useState<DuodecimosMode>('none');

  // ─── RECIBOS VERDES SIMULATOR STATE (INDEPENDENT) ─────────────────────────
  const [monthlyInvoice, setMonthlyInvoice] = useState<number>(1500);
  const [activityType, setActivityType] = useState<'services' | 'products' | 'scientific'>('services');
  const [irsWithholdingMode, setIrsWithholdingMode] = useState<'normal' | 'exempt_101b'>('normal');
  const [ssRegimeMode, setSsRegimeMode] = useState<'normal' | 'eni' | 'exempt_year1'>('normal');
  const [ssVariation, setSsVariation] = useState<number>(0);
  const [rvFiscalRegion, setRvFiscalRegion] = useState<string>('continent');
  const [rvIsIrsJovem, setRvIsIrsJovem] = useState<boolean>(false);
  const [rvIrsJovemYear, setRvIrsJovemYear] = useState<number>(1);

  // ─── COST OF LIVING STATE (U-COST-01 CANONICAL 2026) ────────────────────────
  const [district1, setDistrict1] = useState<string>('Lisboa');
  const [district2, setDistrict2] = useState<string>('Bragança');
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [housingType, setHousingType] = useState<HousingType>('t1');
  const [foodStyle, setFoodStyle] = useState<FoodStyle>('balanced');
  const [transportOption, setTransportOption] = useState<TransportOption>('public_pass');
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [youthCount, setYouthCount] = useState<number>(0);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [colNetSalaryCustom, setColNetSalaryCustom] = useState<number>(0);
  const householdSize = adultsCount + youthCount + childrenCount;

  // ─── HOUSING PROTECTION STATE (INDEPENDENT) ────────────────────────────────
  const [hpHousingMode, setHpHousingMode] = useState<'rent' | 'buy'>('rent');
  const [hpTerritoryId, setHpTerritoryId] = useState<string>('lisboa-concelho');
  const [hpTypology, setHpTypology] = useState<HousingTypology>('t2');
  const [hpNetIncome, setHpNetIncome] = useState<number>(1800);
  const [hpGrossIncome, setHpGrossIncome] = useState<number>(2300);
  const [hpMonthlyRent, setHpMonthlyRent] = useState<number>(0); // 0 = usa benchmark
  const [hpTotalExpenses, setHpTotalExpenses] = useState<number>(1100);
  const [hpCandidateAge, setHpCandidateAge] = useState<number>(29);

  // Compra state
  const [hpAcquisitionPrice, setHpAcquisitionPrice] = useState<number>(250000);
  const [hpAppraisalValue, setHpAppraisalValue] = useState<number>(250000);
  const [hpOwnCapital, setHpOwnCapital] = useState<number>(25000);
  const [hpOtherDebts, setHpOtherDebts] = useState<number>(0);
  const [hpIsFirstHpp, setHpIsFirstHpp] = useState<boolean>(true);
  const [hpOwnsProperty, setHpOwnsProperty] = useState<boolean>(false);
  const [hpOwnsPropertyLast3Years, setHpOwnsPropertyLast3Years] = useState<boolean>(false);
  const [hpYouthGuarantee, setHpYouthGuarantee] = useState<boolean>(true);

  // ─── AIMA REQUISITES STATE (INDEPENDENT) ───────────────────────────────────
  const [aimaNetIncome, setAimaNetIncome] = useState<number>(1000);
  const [aimaDependents, setAimaDependents] = useState<number>(0);
  const [aimaMonthlyRent, setAimaMonthlyRent] = useState<number>(500);
  const [aimaTotalExpenses, setAimaTotalExpenses] = useState<number>(800);
  const [aimaSsMode, setAimaSsMode] = useState<'normal_outrem' | 'normal_recibos' | 'min_20' | 'reduced_25'>('normal_outrem');

  // ─── PEQUENO EMPREENDEDOR / MICROEMPRESA STATE ─────────────────────────────
  const [bizRevenue, setBizRevenue] = useState<number>(3500);
  const [bizExpenses, setBizExpenses] = useState<number>(1200);
  const [bizSector, setBizSector] = useState<'services' | 'commerce' | 'hospitality' | 'industry'>('services');
  const [bizLegalStructure, setBizLegalStructure] = useState<'eni' | 'unipessoal_lda'>('unipessoal_lda');
  const [bizProLabore, setBizProLabore] = useState<number>(1000);

  // Telemetria em tempo real para o contador Navegações & Interações e Gamificação
  useEffect(() => {
    const timer = setTimeout(() => {
      let userId = 'guest';
      try {
        const currentUserStr = localStorage.getItem('mira_user');
        if (currentUserStr) {
          const u = JSON.parse(currentUserStr);
          if (u && u.id) userId = u.id;
        }
      } catch (e) {}
      analytics.track('use_simulator', userId, 'Interação Simulador', { tab: activeTab });

      // 🎮 Gamificação Cross-Module: Conclusão de Simulação (10 XP, 1x/tipo/dia em Europe/Lisbon)
      if (userId !== 'guest' && onEarnPoints) {
        let simCanonical = 'salary';
        if (activeTab === 'salary_recibos') simCanonical = 'recibos';
        else if (activeTab === 'cost') simCanonical = 'cost';
        else if (activeTab === 'housing_protection') simCanonical = 'housing';
        else if (activeTab === 'aima_health') simCanonical = 'aima';
        else if (activeTab === 'small_business') simCanonical = 'business';

        try {
          onEarnPoints(10, `Simulação Concluída: ${simCanonical}`, 'simulator_completed', simCanonical);
        } catch (_) {}
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [grossSalary, monthlyInvoice, district1, district2, hpMonthlyRent, aimaNetIncome, bizRevenue, activeTab]);

  // ─── CONTA DE OUTREM CALCULATION LOGIC ────────────────────────────────────
  const calculateSalaryOutrem = () => {
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
      grossSalary,
      maritalStatus: maritalStatusMap[familyStatus] || 'single',
      dependentsCount: dependents,
      taxRegion: regionMap[fiscalRegion] || 'continente',
      mealAllowanceDaily: mealAllowance,
      mealAllowanceType: mealType as 'cash' | 'card',
      workingDays: workDays,
      irsJovemYear: isIrsJovem ? irsJovemYear : 0,
      duodecimosMode,
    });

    return {
      netSalary: res.netMonthlyIncome,
      grossTotal: res.grossTotal,
      ssDeduction: res.socialSecurityEmployee,
      ssCompany: res.socialSecurityCompany,
      irsDeduction: res.irsWithholdingTax,
      irsJovemDiscount: res.breakdown.irsJovemDiscount,
      mealExempt: res.mealAllowanceExempt,
      mealTaxed: res.mealAllowanceTaxable,
      totalMeal: res.mealAllowanceTotal,
      vacationDuodecimo: res.vacationDuodecimoAmount,
      christmasDuodecimo: res.christmasDuodecimoAmount,
      duodecimosAmount: res.duodecimosAmount,
      totalDeductions: Math.round((res.socialSecurityEmployee + res.irsWithholdingTax) * 100) / 100,
      effectiveRate: res.irsEffectiveRate,
      marginalRate: res.breakdown.marginalTaxRate,
      employerTotalCost: Math.round((res.grossTotal + res.socialSecurityCompany + res.mealAllowanceExempt) * 100) / 100,
    };
  };

  // ─── RECIBOS VERDES CALCULATION LOGIC ────────────────────────────────────
  const calculateSalaryRecibos = () => {
    // 1. Segurança Social Normativa
    const ssRes = SocialSecurityCalculationService.calculateIndependentSocialSecurity({
      monthlyInvoice,
      activityType: activityType === 'products' ? 'products_sales' : 'services',
      regimeType: ssRegimeMode === 'eni' ? 'eni' : 'general',
      baseVariationPct: ssVariation * 100,
      dataInicioAtividade: ssRegimeMode === 'exempt_year1' ? '2026-06-01' : '2024-01-01',
    });

    // 2. Retenção na Fonte de Categoria B
    let catBActivity: 'art_151' | 'other_services' | 'intellectual_property' | 'products_sales' = 'art_151';
    if (activityType === 'products') catBActivity = 'products_sales';
    else if (activityType === 'scientific') catBActivity = 'intellectual_property';

    const irsRes = TaxCalculationService.calculateCategoryBWithholding({
      monthlyInvoice,
      activityType: catBActivity,
      hasExemption101b: irsWithholdingMode === 'exempt_101b',
    });

    let irsDeduction = irsRes.irsWithholdingAmount;
    if (rvFiscalRegion === 'azores') irsDeduction *= 0.7;
    else if (rvFiscalRegion === 'madeira') irsDeduction *= 0.8;

    if (rvIsIrsJovem && rvIrsJovemYear >= 1 && rvIrsJovemYear <= 10) {
      const exemptionPct = NORMATIVE_2026.IRS_JOVEM.ISENCOES_POR_ANO[rvIrsJovemYear] || 0.25;
      irsDeduction = irsDeduction * (1 - exemptionPct);
    }
    irsDeduction = Math.max(0, Math.round(irsDeduction * 100) / 100);

    const ssContribution = ssRes.monthlyContribution;
    const totalDeductions = ssContribution + irsDeduction;
    const netIncome = monthlyInvoice - totalDeductions;
    const effectiveRate = monthlyInvoice > 0 ? (totalDeductions / monthlyInvoice) * 100 : 0;

    return {
      netSalary: Math.round(netIncome * 100) / 100,
      ssDeduction: ssContribution,
      irsDeduction,
      mealExempt: 0,
      mealTaxed: 0,
      totalMeal: 0,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 10) / 10,
      marginalRate: irsRes.irsWithholdingRate,
    };
  };

  const salaryResults = salaryRegime === 'outrem' ? calculateSalaryOutrem() : calculateSalaryRecibos();

  // ─── COST OF LIVING CALCULATION LOGIC (U-COST-01 DELEGATED TO ENGINE) ───────
  const activeNetIncome = colNetSalaryCustom > 0 ? colNetSalaryCustom : salaryResults.netSalary;

  const colAssessment: CostOfLivingAssessment = calculateCostOfLivingEngine({
    destinationDistrict: district1,
    comparisonDistrict: isComparing ? district2 : undefined,
    housingType,
    foodStyle,
    transportOption,
    demographics: {
      adultsCount,
      youth14To17Count: youthCount,
      childrenUnder14Count: childrenCount
    },
    netMonthlyIncome: activeNetIncome
  });

  const col1 = {
    housing: colAssessment.destination.housing,
    food: colAssessment.destination.food,
    transport: colAssessment.destination.transport,
    utilities: colAssessment.destination.utilities,
    telecom: colAssessment.destination.telecom,
    healthAndPersonal: colAssessment.destination.healthAndPersonal,
    utilitiesPerPerson: Math.round(colAssessment.destination.utilities / Math.max(1, householdSize)),
    total: colAssessment.destination.totalMonthlyCost,
    tier: colAssessment.destination.tier
  };

  const col2 = colAssessment.comparison ? {
    housing: colAssessment.comparison.housing,
    food: colAssessment.comparison.food,
    transport: colAssessment.comparison.transport,
    utilities: colAssessment.comparison.utilities,
    telecom: colAssessment.comparison.telecom,
    healthAndPersonal: colAssessment.comparison.healthAndPersonal,
    utilitiesPerPerson: Math.round(colAssessment.comparison.utilities / Math.max(1, householdSize)),
    total: colAssessment.comparison.totalMonthlyCost,
    tier: colAssessment.comparison.tier
  } : col1;

  const costDifference = colAssessment.differenceBetweenDistricts?.monthlySavingsDiff || 0;
  const cheaperDistrict = colAssessment.differenceBetweenDistricts?.cheaperDistrict || district1;
  const expensiveDistrict = colAssessment.differenceBetweenDistricts?.expensiveDistrict || district2;

  // Retrocompatibilidade para finHealth se referenciado
  const finHealth = {
    effortRate: colAssessment.financialSufficiency?.effortRateHousingPct || 0,
    netSavings: colAssessment.financialSufficiency?.netMonthlySavings || 0,
    savingsRate: activeNetIncome > 0 ? Math.round(((colAssessment.financialSufficiency?.netMonthlySavings || 0) / activeNetIncome) * 100) : 0,
    setupCapital: Math.round((col1.housing * 3) + (col1.total * 3)),
    emergencyFund: colAssessment.financialSufficiency?.emergencyFund3Months || Math.round(col1.total * 3),
    totalAimaRequirement: colAssessment.legalSubsistenceReference?.calculatedReference || 920,
    meetsAimaReq: activeNetIncome >= (colAssessment.legalSubsistenceReference?.calculatedReference || 920),
    score: colAssessment.financialSufficiency?.effortRateStatus === 'sustainable' ? 90 : colAssessment.financialSufficiency?.effortRateStatus === 'moderate_risk' ? 65 : 40,
    status: colAssessment.financialSufficiency?.effortRateStatus === 'sustainable' ? ('healthy' as const) : colAssessment.financialSufficiency?.effortRateStatus === 'moderate_risk' ? ('warning' as const) : ('critical' as const)
  };

  // ─── PEQUENO EMPREENDEDOR / MICROEMPRESA CALCULATION LOGIC ───────────────
  const calculateSmallBusiness = () => {
    const annualRevenue = bizRevenue * 12;
    const annualExpenses = bizExpenses * 12;
    const grossProfit = Math.max(0, bizRevenue - bizExpenses);

    let coefficient = 0.75; // Serviços
    if (bizSector === 'commerce') coefficient = 0.15;
    else if (bizSector === 'hospitality') coefficient = 0.35;
    else if (bizSector === 'industry') coefficient = 0.35;

    let taxAmount = 0;
    let ssAmount = 0;

    if (bizLegalStructure === 'eni') {
      // ENI Regime Simplificado (IRS + SS 25.2%)
      const taxableBase = bizRevenue * coefficient;
      ssAmount = Math.round(taxableBase * 0.252);
      taxAmount = Math.round(Math.max(0, (taxableBase - 700) * 0.18));
    } else {
      // Sociedade Unipessoal Lda / PME (IRC 12,5% reduzido PME até 50.000€ lucro tributável)
      const taxableProfit = Math.max(0, bizRevenue - bizExpenses - bizProLabore);
      taxAmount = Math.round(taxableProfit * 0.125);
      // TSU / SS Gerente MOE (9.3% gerente + 23.75% empresa sobre Pró-Labore)
      ssAmount = Math.round(bizProLabore * (0.093 + 0.2375));
    }

    const totalTaxes = taxAmount + ssAmount;
    const netProfit = Math.max(0, bizRevenue - bizExpenses - totalTaxes);
    const profitMargin = bizRevenue > 0 ? Math.round((netProfit / bizRevenue) * 100) : 0;
    const breakEven = Math.round(bizExpenses / (1 - Math.min(0.8, (totalTaxes / (bizRevenue || 1)))));

    return {
      annualRevenue: Math.round(annualRevenue),
      annualExpenses: Math.round(annualExpenses),
      grossProfit: Math.round(grossProfit),
      taxAmount,
      ssAmount,
      totalTaxes,
      netProfit,
      profitMargin,
      breakEven
    };
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden font-sans">
      
      {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 px-6 pt-5 pb-6 border-b border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-4">
          <button
            onClick={() => onViewChange(ViewType.HOME)}
            className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
            <Calculator size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">
              {tLocal('title')}
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <h2 className="mira-module-title !text-white">
            {tLocal('title')}
          </h2>
          <p className="mira-module-subtitle !text-slate-400">
            {tLocal('subtitle')}
          </p>
        </div>
      </div>

{/* ── TAB BAR FOR ALL 8 CORE SIMULATORS (RESPONSIVE GRID — ZERO HORIZONTAL SCROLL) ───────────────────────────── */}
      <div className="p-2.5 sm:p-3 bg-white border-b border-slate-200/80 relative z-10 shrink-0 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2">
          {/* Tab 1 */}
          <button
            type="button"
            onClick={() => { setActiveTab('salary_outrem'); setSalaryRegime('outrem'); }}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'salary_outrem' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_1_salary')}</span>
          </button>

          {/* Tab 2 */}
          <button
            type="button"
            onClick={() => { setActiveTab('salary_recibos'); setSalaryRegime('recibos'); }}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'salary_recibos' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_2_recibos')}</span>
          </button>

          {/* Tab 3: Segurança Social */}
          <button
            type="button"
            onClick={() => setActiveTab('ss_contributions')}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'ss_contributions' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_3_ss')}</span>
          </button>

          {/* Tab 4: Reforma & CSI */}
          <button
            type="button"
            onClick={() => setActiveTab('reforma')}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'reforma' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_4_reforma')}</span>
          </button>

          {/* Tab 5: Custo de Vida */}
          <button
            type="button"
            onClick={() => setActiveTab('cost')}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'cost' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_5_cost')}</span>
          </button>

          {/* Tab 6: Habitação */}
          <button
            type="button"
            onClick={() => setActiveTab('housing_protection')}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'housing_protection' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_6_housing')}</span>
          </button>

          {/* Tab 7: Requisitos AIMA */}
          <button
            type="button"
            onClick={() => setActiveTab('aima_health')}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'aima_health' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_7_aima')}</span>
          </button>

          {/* Tab 8: Pequeno Empreendedor */}
          <button
            type="button"
            onClick={() => setActiveTab('small_business')}
            className={`w-full py-2.5 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-center transition-all duration-200 flex items-center justify-center gap-1 shadow-xs active:scale-95 cursor-pointer touch-manipulation border ${
              activeTab === 'small_business' 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-900/20 ring-2 ring-[#FF8C00]/40' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/70 hover:border-slate-300'
            }`}
          >
            <span className="truncate">{tLocal('tab_8_business')}</span>
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
        <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 pb-32">

          {/* ════ TAB 1: SALÁRIO LÍQUIDO (CONTA DE OUTREM) ═══════════════════ */}
          {activeTab === 'salary_outrem' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Form Card for CONTA DE OUTREM */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Coins className="text-[#FF8C00] shrink-0" size={18} />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {tLocal('so_sim_title')}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                    {tLocal('so_sim_subtitle')}
                  </p>
                  </div>
                </div>

                {/* Input: Gross Salary */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {tLocal('gross_salary')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={grossSalary}
                      onChange={(e) => setGrossSalary(Number(e.target.value))}
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('family_status')}
                    </label>
                    <select
                      value={familyStatus}
                      onChange={(e) => setFamilyStatus(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="single">{tLocal('single')}</option>
                      <option value="married_1">{tLocal('married_1')}</option>
                      <option value="married_2">{tLocal('married_2')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('dependents')}
                    </label>
                    <select
                      value={dependents}
                      onChange={(e) => setDependents(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('region')}
                    </label>
                    <select
                      value={fiscalRegion}
                      onChange={(e) => setFiscalRegion(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="continent">{tLocal('continent')}</option>
                      <option value="madeira">{tLocal('madeira')}</option>
                      <option value="azores">{tLocal('azores')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('work_days')}
                    </label>
                    <input
                      type="number"
                      value={workDays}
                      onChange={(e) => setWorkDays(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    />
                  </div>
                </div>

                {/* Duodécimos Selector */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('duodecimos_title')}
                    </label>
                    <span className="text-[9px] font-bold text-slate-400">{tLocal('duodecimos_badge_13_14')}</span>
                  </div>
                  <select
                    value={duodecimosMode}
                    onChange={(e) => setDuodecimosMode(e.target.value as DuodecimosMode)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                  >
                    <option value="none">{tLocal('duodecimos_none')}</option>
                    <option value="half_vacation">{tLocal('duodecimos_half_vac')}</option>
                    <option value="half_christmas">{tLocal('duodecimos_half_xmas')}</option>
                    <option value="half_both">{tLocal('duodecimos_half_both')}</option>
                    <option value="full_both">{tLocal('duodecimos_full_both')}</option>
                  </select>
                </div>

                {/* IRS Jovem Section */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500 shrink-0" />
                      <div>
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          {tLocal('irs_jovem')}
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          {tLocal('irs_jovem_desc_field')}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isIrsJovem}
                      onChange={(e) => setIsIrsJovem(e.target.checked)}
                      className="w-5 h-5 accent-[#FF8C00] rounded cursor-pointer shrink-0 ml-2"
                    />
                  </div>

                  {isIrsJovem && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-black uppercase text-amber-900 text-center">
                        <div className={`p-2 rounded-xl transition-all ${irsJovemYear === 1 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white/70'}`}>
                          <span className={`block text-sm font-black ${irsJovemYear === 1 ? 'text-white' : 'text-amber-600'}`}>100%</span>
                          <span>{tLocal('irs_jovem_y1')}</span>
                        </div>
                        <div className={`p-2 rounded-xl transition-all ${irsJovemYear >= 2 && irsJovemYear <= 4 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white/70'}`}>
                          <span className={`block text-sm font-black ${irsJovemYear >= 2 && irsJovemYear <= 4 ? 'text-white' : 'text-amber-600'}`}>75%</span>
                          <span>{tLocal('irs_jovem_y2_4')}</span>
                        </div>
                        <div className={`p-2 rounded-xl transition-all ${irsJovemYear >= 5 && irsJovemYear <= 7 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white/70'}`}>
                          <span className={`block text-sm font-black ${irsJovemYear >= 5 && irsJovemYear <= 7 ? 'text-white' : 'text-amber-600'}`}>50%</span>
                          <span>{tLocal('irs_jovem_y5_7')}</span>
                        </div>
                        <div className={`p-2 rounded-xl transition-all ${irsJovemYear >= 8 && irsJovemYear <= 10 ? 'bg-amber-500 text-white shadow-xs' : 'bg-white/70'}`}>
                          <span className={`block text-sm font-black ${irsJovemYear >= 8 && irsJovemYear <= 10 ? 'text-white' : 'text-amber-600'}`}>25%</span>
                          <span>{tLocal('irs_jovem_y8_10')}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">
                          {tLocal('irs_jovem_year')} (1 a 10)
                        </label>
                        <select
                          value={irsJovemYear}
                          onChange={(e) => setIrsJovemYear(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value={1}>{tLocal('irs_jovem_opt_1')}</option>
                          <option value={2}>{tLocal('irs_jovem_opt_2')}</option>
                          <option value={3}>{tLocal('irs_jovem_opt_3')}</option>
                          <option value={4}>{tLocal('irs_jovem_opt_4')}</option>
                          <option value={5}>{tLocal('irs_jovem_opt_5')}</option>
                          <option value={6}>{tLocal('irs_jovem_opt_6')}</option>
                          <option value={7}>{tLocal('irs_jovem_opt_7')}</option>
                          <option value={8}>{tLocal('irs_jovem_opt_8')}</option>
                          <option value={9}>{tLocal('irs_jovem_opt_9')}</option>
                          <option value={10}>{tLocal('irs_jovem_opt_10')}</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        {tLocal('meal_allowance')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={mealAllowance}
                          onChange={(e) => setMealAllowance(Number(e.target.value))}
                          className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">€</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                        {tLocal('meal_type')}
                      </label>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        <option value="cash">{tLocal('cash')}</option>
                        <option value="card">{tLocal('card')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Alerta Visual de Subsídio Tributável */}
                  {mealAllowance > (mealType === 'card' ? MEAL_CAP_CARD_2026 : MEAL_CAP_CASH_2026) && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-amber-900 text-xs animate-in fade-in duration-200">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">{tLocal('meal_taxable_alert')}</span>
                        <span className="text-amber-800 text-[11px] leading-relaxed">
                          {tLocal('meal_taxable_sub').replace('{excess}', (mealAllowance - (mealType === 'card' ? MEAL_CAP_CARD_2026 : MEAL_CAP_CASH_2026)).toFixed(2)).replace('{cap}', mealType === 'card' ? '10,46€' : '6,15€')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Display for Outrem */}
              {(() => {
                const res = calculateSalaryOutrem();
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">
                      {tLocal('calc_result_2026')}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {tLocal('effective_irs_rate')}: {res.effectiveRate}%
                    </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {tLocal('net_income_available')}
                    </p>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        {res.netSalary.toLocaleString('pt', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                      </h1>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {tLocal('payslip_breakdown')}
                        </h4>
                      </div>

                      <div className="space-y-3 bg-white/5 border border-white/5 rounded-3xl p-5">
                        <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                          <span className="font-bold text-slate-300">{tLocal('remun_bruta_sujeita')}</span>
                          <span className="font-extrabold text-white">{res.grossTotal.toFixed(2)}€</span>
                        </div>

                        {res.duodecimosAmount > 0 && (
                          <div className="space-y-1 pl-2 text-[11px] text-slate-400 pb-2 border-b border-white/5">
                            {res.vacationDuodecimo > 0 && (
                              <div className="flex justify-between">
                                <span>{tLocal('duodecimo_vac_line')}</span>
                                <span className="text-slate-200">+{res.vacationDuodecimo.toFixed(2)}€</span>
                              </div>
                            )}
                            {res.christmasDuodecimo > 0 && (
                              <div className="flex justify-between">
                                <span>{tLocal('duodecimo_xmas_line')}</span>
                                <span className="text-slate-200">+{res.christmasDuodecimo.toFixed(2)}€</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">{tLocal('ss_worker_11')}</span>
                          <span className="font-extrabold text-red-400">-{res.ssDeduction.toFixed(2)}€</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-300">{tLocal('irs_withholding_line')}</span>
                            {res.irsJovemDiscount > 0 && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30">
                                IRS Jovem: -{res.irsJovemDiscount.toFixed(2)}€
                              </span>
                            )}
                          </div>
                          <span className="font-extrabold text-red-400">-{res.irsDeduction.toFixed(2)}€</span>
                        </div>

                        <div className="border-t border-white/5 pt-3 space-y-1.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-slate-400">{tLocal('meal_exempt_line')}</span>
                            <span className="font-bold text-emerald-400">+{res.mealExempt.toFixed(2)}€</span>
                          </div>
                          {res.mealTaxed > 0 && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-amber-400">{tLocal('meal_taxed_line')}</span>
                              <span className="font-bold text-amber-300">+{res.mealTaxed.toFixed(2)}€</span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                          <span>{tLocal('employer_cost_title')} ({tLocal('tsu_company')})</span>
                          <span className="font-black text-slate-200">{res.employerTotalCost.toFixed(2)}€</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed">
                        {tLocal('salary_legal_basis_note')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ════ GUIA EXPLICATIVO DE SALÁRIO LÍQUIDO & CONTRATOS ════ */}
              <div className="bg-white border border-slate-200/80 rounded-[2.25rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-2">
                    <Sparkles size={12} className="text-emerald-600" />
                    {tLocal('so_guide_badge')}
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                    {tLocal('so_guide_title')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    {tLocal('so_guide_subtitle')}
                  </p>
                </div>

                {/* 1. Segurança Social */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#FF8C00]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {tLocal('so_sec_ss_title')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase">{tLocal('so_ss_worker_name')}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-[#FF8C00]/10 text-[#FF8C00] rounded-full border border-[#FF8C00]/20">11%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{tLocal('so_ss_worker_desc')}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase">{tLocal('so_ss_company_name')}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20">23,75%</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{tLocal('so_ss_company_desc')}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Retenção IRS & Subsídio Refeição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Landmark size={15} className="text-slate-700" />
                      <h5 className="text-[10px] font-black text-slate-900 uppercase">{tLocal('so_sec_irs_title')}</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{tLocal('so_irs_desc')}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Coins size={15} className="text-emerald-700" />
                      <h5 className="text-[10px] font-black text-emerald-900 uppercase">{tLocal('so_sec_meal_title')}</h5>
                    </div>
                    <p className="text-[10px] text-emerald-950 leading-relaxed">
                      <strong className="font-bold">{tLocal('so_meal_card_name')}:</strong> {tLocal('so_meal_card_desc')}
                    </p>
                    <p className="text-[10px] text-emerald-950 leading-relaxed pt-1">
                      <strong className="font-bold">{tLocal('so_meal_cash_name')}:</strong> {tLocal('so_meal_cash_desc')}
                    </p>
                  </div>
                </div>

                {/* 3. IRS Jovem & Família */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" />
                      <h5 className="text-[10px] font-black text-indigo-900 uppercase">{tLocal('so_sec_jovem_title')}</h5>
                    </div>
                    <p className="text-[10px] text-indigo-950 leading-relaxed">{tLocal('so_sec_jovem_desc')}</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={15} className="text-slate-700" />
                      <h5 className="text-[10px] font-black text-slate-900 uppercase">{tLocal('so_sec_family_title')}</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{tLocal('so_family_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 2: RECIBOS VERDES (TRABALHADOR INDEPENDENTE) ═══════════ */}
          {activeTab === 'salary_recibos' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Form Card for RECIBOS VERDES */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Briefcase className="text-[#FF8C00] shrink-0" size={18} />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {tLocal('rv_sim_title')}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                    {tLocal('rv_sim_subtitle')}
                  </p>
                  </div>
                </div>

                {/* Input: Monthly Invoice */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {tLocal('invoice_monthly')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyInvoice}
                      onChange={(e) => setMonthlyInvoice(Number(e.target.value))}
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                  </div>
                </div>

                {/* Select: Activity Type */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {tLocal('activity_type')}
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                  >
                    <option value="services">{tLocal('service_provision')}</option>
                    <option value="scientific">{tLocal('scientific_activity')}</option>
                    <option value="products">{tLocal('product_sales')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('irs_withholding')}
                    </label>
                    <select
                      value={irsWithholdingMode}
                      onChange={(e) => setIrsWithholdingMode(e.target.value as any)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="normal">{tLocal('irs_normal')}</option>
                      <option value="exempt_101b">{tLocal('irs_exempt_101b')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('region')}
                    </label>
                    <select
                      value={rvFiscalRegion}
                      onChange={(e) => setRvFiscalRegion(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="continent">{tLocal('continent')}</option>
                      <option value="madeira">{tLocal('madeira')}</option>
                      <option value="azores">{tLocal('azores')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('ss_regime')}
                    </label>
                    <select
                      value={ssRegimeMode}
                      onChange={(e) => setSsRegimeMode(e.target.value as any)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="normal">{tLocal('ss_normal')}</option>
                      <option value="eni">{tLocal('ss_eni')}</option>
                      <option value="exempt_year1">{tLocal('ss_exempt_year1')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('ss_variation')}
                    </label>
                    <select
                      value={ssVariation}
                      disabled={ssRegimeMode === 'exempt_year1'}
                      onChange={(e) => setSsVariation(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00] disabled:opacity-50"
                    >
                      <option value={0}>{tLocal('ss_var_0')}</option>
                      <option value={-0.25}>{tLocal('ss_var_minus25')}</option>
                      <option value={0.25}>{tLocal('ss_var_plus25')}</option>
                    </select>
                  </div>
                </div>

                {/* IRS Jovem Section for Freelancers */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500 shrink-0" />
                      <div>
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          {tLocal('rv_irs_jovem_title')}
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          {tLocal('rv_irs_jovem_desc')}
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={rvIsIrsJovem}
                      onChange={(e) => setRvIsIrsJovem(e.target.checked)}
                      className="w-5 h-5 accent-[#FF8C00] rounded cursor-pointer shrink-0 ml-2"
                    />
                  </div>

                  {rvIsIrsJovem && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 animate-in fade-in duration-300">
                      <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">
                        {tLocal('irs_jovem_year')}
                      </label>
                      <select
                        value={rvIrsJovemYear}
                        onChange={(e) => setRvIrsJovemYear(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                      >
                        <option value={1}>{tLocal('year_1')}</option>
                        <option value={2}>{tLocal('years_2_4')}</option>
                        <option value={3}>{tLocal('years_5_7')}</option>
                        <option value={5}>{tLocal('years_8_10')}</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Results Display for Recibos Verdes */}
              {(() => {
                const res = calculateSalaryRecibos();
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">
                      {tLocal('calc_result_title')}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      {tLocal('effective_tax_rate')}: {res.effectiveRate}%
                    </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {tLocal('net_income_recibos')}
                    </p>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        {res.netSalary.toLocaleString('pt', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                      </h1>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {tLocal('rv_deductions_title')}
                        </h4>
                      </div>

                      <div className="space-y-3 bg-white/5 border border-white/5 rounded-3xl p-5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">{tLocal('ss_ti_line')}</span>
                          <span className="font-extrabold text-red-400">-{res.ssDeduction}€</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">{tLocal('irs_withholding_line')}</span>
                          <span className="font-extrabold text-red-400">-{res.irsDeduction}€</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed">
                        {tLocal('rv_legal_note')}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* ════ GUIA EXPLICATIVO DE ENQUADRAMENTO (RECIBOS VERDES & SS) ════ */}
              <div className="bg-white border border-slate-200/80 rounded-[2.25rem] p-6 md:p-8 shadow-sm space-y-6">
                
                {/* Header */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-700 text-[10px] font-black uppercase tracking-wider mb-2">
                    <Sparkles size={12} className="text-amber-600" />
                    {tLocal('rv_guide_badge')}
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                    {tLocal('rv_guide_title')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    {tLocal('rv_guide_subtitle')}
                  </p>
                </div>

                {/* 1. Regimes de Segurança Social */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#FF8C00]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {tLocal('rv_sec_ss_title')}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* TI Geral */}
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase">
                          {tLocal('rv_ss_ti_name')}
                        </span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-[#FF8C00]/10 text-[#FF8C00] rounded-full border border-[#FF8C00]/20">
                          21,4%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-700 font-bold">{tLocal('rv_ss_ti_who')}</strong> {tLocal('rv_ss_ti_who_desc')}
                      </p>
                      <div className="text-[10px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-150 leading-relaxed">
                        <strong className="text-slate-600 font-bold">{tLocal('rv_ss_ti_how')}</strong> {tLocal('rv_ss_ti_how_desc')}
                      </div>
                    </div>

                    {/* ENI */}
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase">
                          {tLocal('rv_ss_eni_name')}
                        </span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20">
                          25,2%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-700 font-bold">{tLocal('rv_ss_eni_who')}</strong> {tLocal('rv_ss_eni_who_desc')}
                      </p>
                      <div className="text-[10px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-150 leading-relaxed">
                        <strong className="text-slate-600 font-bold">{tLocal('rv_ss_eni_how')}</strong> {tLocal('rv_ss_eni_how_desc')}
                      </div>
                    </div>

                    {/* Isenção 1º Ano */}
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-900 uppercase">
                          {tLocal('rv_ss_exempt_name')}
                        </span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-emerald-500 text-white rounded-full">
                          0€ / 1.º Ano
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        <strong className="font-bold">{tLocal('rv_ss_exempt_who')}</strong> {tLocal('rv_ss_exempt_who_desc')}
                      </p>
                      <div className="text-[10px] text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-200/60 leading-relaxed">
                        <strong className="font-bold">{tLocal('rv_ss_exempt_how')}</strong> {tLocal('rv_ss_exempt_how_desc')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Ajuste Trimestral da Base SS */}
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-[#FF8C00]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {tLocal('rv_sec_var_title')}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {tLocal('rv_var_sub')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* -25% */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-700">{tLocal('rv_var_minus_name')}</span>
                        <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">-25%</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        {tLocal('rv_var_minus_desc')}
                      </p>
                    </div>

                    {/* 0% */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-700">{tLocal('rv_var_0_name')}</span>
                        <span className="text-[9px] font-extrabold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-full">{tLocal('ss_var_0_short')}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        {tLocal('rv_var_0_desc')}
                      </p>
                    </div>

                    {/* +25% */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-700">{tLocal('rv_var_plus_name')}</span>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+25%</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        {tLocal('rv_var_plus_desc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Tipo de Atividade e Coeficientes */}
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-[#FF8C00]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {tLocal('rv_sec_act_title')}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <h5 className="text-[10px] font-black text-slate-800 uppercase">{tLocal('rv_act_services_name')}</h5>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{tLocal('rv_act_services_desc')}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <h5 className="text-[10px] font-black text-slate-800 uppercase">{tLocal('rv_act_scientific_name')}</h5>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{tLocal('rv_act_scientific_desc')}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <h5 className="text-[10px] font-black text-slate-800 uppercase">{tLocal('rv_act_products_name')}</h5>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{tLocal('rv_act_products_desc')}</p>
                    </div>
                  </div>
                </div>

                {/* 4. Retenção na Fonte & IRS Jovem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Landmark size={15} className="text-amber-700" />
                      <h5 className="text-[10px] font-black text-amber-900 uppercase">{tLocal('rv_sec_wh_title')}</h5>
                    </div>
                    <p className="text-[10px] text-amber-950 leading-relaxed">
                      <strong className="font-bold">{tLocal('rv_wh_normal_name')}:</strong> {tLocal('rv_wh_normal_desc')}
                    </p>
                    <p className="text-[10px] text-amber-950 leading-relaxed pt-1">
                      <strong className="font-bold">{tLocal('rv_wh_exempt_name')}:</strong> {tLocal('rv_wh_exempt_desc')}
                    </p>
                  </div>

                  <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" />
                      <h5 className="text-[10px] font-black text-indigo-900 uppercase">{tLocal('rv_sec_jovem_title')}</h5>
                    </div>
                    <p className="text-[10px] text-indigo-950 leading-relaxed">
                      {tLocal('rv_sec_jovem_desc')}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ════ TAB 3: SEGURANÇA SOCIAL (TRABALHADOR INDEPENDENTE) ═════════ */}
          {activeTab === 'ss_contributions' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SocialSecuritySimulator
                language={language}
                onViewChange={onViewChange}
              />
            </div>
          )}

          {/* ════ TAB 4: REFORMA & CSI (DL 187/2007) ═════════════════════════ */}
          {activeTab === 'reforma' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <RetirementWizard
                language={language}
                onBack={() => setActiveTab('salary_outrem')}
                onSelectTemplate={(templateId) => {
                  onViewChange(ViewType.DOCUMENTS, { templateId });
                }}
              />
            </div>
          )}

          {/* ════ TAB 5: COST OF LIVING (U-COST-01 CANONICAL 2026) ═══════════ */}
          {activeTab === 'cost' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Controls Card */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-[#FF8C00] shrink-0" size={18} />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {tLocal('tab_cost')}
                    </h3>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    {tLocal('provenance_badge')}
                  </span>
                </div>

                {/* District Selectors */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        {tLocal('district')}
                      </label>
                      <select
                        value={district1}
                        onChange={(e) => setDistrict1(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        {Object.keys(DISTRICT_COST_DATA).map(d => (
                          <option key={d} value={d}>{d} (Tier {DISTRICT_COST_DATA[d].tier})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                          {tLocal('compare_with')}
                        </label>
                        <button 
                          type="button"
                          onClick={() => setIsComparing(!isComparing)}
                          className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            isComparing 
                              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {isComparing ? tLocal('active_comparison') : tLocal('compare_off')}
                        </button>
                      </div>
                      <select
                        value={district2}
                        disabled={!isComparing}
                        onChange={(e) => setDistrict2(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00] disabled:opacity-50"
                      >
                        {Object.keys(DISTRICT_COST_DATA).map(d => (
                          <option key={d} value={d} disabled={d === district1}>{d} (Tier {DISTRICT_COST_DATA[d].tier})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tipologia Habitacional (5 opções canónicas) & Estilo Alimentar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('housing')}
                    </label>
                    <select
                      value={housingType}
                      onChange={(e) => setHousingType(e.target.value as HousingType)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="room">{tLocal('shared_room')}</option>
                      <option value="t0">{tLocal('t0_apartment')}</option>
                      <option value="t1">{tLocal('t1_apartment')}</option>
                      <option value="t2">{tLocal('t2_apartment')}</option>
                      <option value="t3">{tLocal('t3_apartment')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('food_style')}
                    </label>
                    <select
                      value={foodStyle}
                      onChange={(e) => setFoodStyle(e.target.value as FoodStyle)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="cook_home">{tLocal('cook_home')}</option>
                      <option value="balanced">{tLocal('mixed')}</option>
                      <option value="eat_out">{tLocal('eat_out')}</option>
                    </select>
                  </div>
                </div>

                {/* Modalidade de Transporte & Demografia Familiar com Escala OCDE */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        {tLocal('transport')}
                      </label>
                      <select
                        value={transportOption}
                        onChange={(e) => setTransportOption(e.target.value as TransportOption)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        <option value="public_pass">{tLocal('public_pass')}</option>
                        <option value="rail_pass">{tLocal('rail_pass')}</option>
                        <option value="own_car">{tLocal('own_car')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        {tLocal('adults_label')}
                      </label>
                      <select
                        value={adultsCount}
                        onChange={(e) => setAdultsCount(Number(e.target.value))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        <option value="1">1 {tLocal('person')}</option>
                        <option value="2">2 {tLocal('people')}</option>
                        <option value="3">3 {tLocal('people')}</option>
                        <option value="4">4 {tLocal('people')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        {tLocal('youth_label')}
                      </label>
                      <select
                        value={youthCount}
                        onChange={(e) => setYouthCount(Number(e.target.value))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                        {tLocal('children_label')}
                      </label>
                      <select
                        value={childrenCount}
                        onChange={(e) => setChildrenCount(Number(e.target.value))}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  </div>

                  {/* Badge Explicativo do Fator OCDE */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-xl px-4 py-2 text-[10px] text-slate-600 font-medium">
                    <span>
                      <strong>{tLocal('ocde_scale_label')}</strong> {tLocal('ocde_scale_sub')} <strong>{colAssessment.familyScaleFactors.ocdeScaleFactor}×</strong> {tLocal('applied_food_utilities')}
                    </span>
                    <span className="text-slate-400 font-bold">
                      Agregado: {householdSize} {householdSize === 1 ? tLocal('person') : tLocal('people')}
                    </span>
                  </div>
                </div>

                {/* Input de Rendimento Líquido do Agregado para Cálculo de Esforço */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-550 uppercase tracking-widest block">
                      {tLocal('household_net_income')}
                    </label>
                    {salaryResults.netSalary > 0 && (
                      <button
                        type="button"
                        onClick={() => setColNetSalaryCustom(salaryResults.netSalary)}
                        className="text-[9px] font-black uppercase tracking-wider text-[#FF8C00] hover:underline cursor-pointer"
                      >
                        {tLocal('use_net_salary')} ({salaryResults.netSalary}€)
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={colNetSalaryCustom || ''}
                    placeholder={salaryResults.netSalary > 0 ? tLocal('placeholder_ex_from_tab1').replace('{val}', salaryResults.netSalary.toString()) : tLocal('placeholder_ex_1500')}
                    onChange={(e) => setColNetSalaryCustom(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                  />
                </div>
              </div>

              {/* Side by Side Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* District 1 Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#FF8C00]" />
                      <h4 className="text-sm font-black uppercase text-white">{district1}</h4>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-300 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                      Tier: {col1.tier}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{tLocal('cost_housing')}</span>
                      <span className="font-extrabold text-white">{col1.housing}€</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{tLocal('cost_food')}</span>
                      <span className="font-extrabold text-white">{col1.food}€</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{tLocal('cost_transport')}</span>
                      <span className="font-extrabold text-white">{col1.transport}€</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{tLocal('cost_utilities')}</span>
                      <span className="font-extrabold text-white">{col1.utilities}€</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{tLocal('telecom')}</span>
                      <span className="font-extrabold text-white">{col1.telecom}€</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>{tLocal('health_personal')}</span>
                      <span className="font-extrabold text-white">{col1.healthAndPersonal}€</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 flex justify-between items-center font-black text-sm text-[#FF8C00]">
                      <span>{tLocal('cost_total')}</span>
                      <span className="text-lg">{col1.total}€</span>
                    </div>
                  </div>
                </div>

                {/* District 2 Card (Only if comparing) */}
                {isComparing && (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-400" />
                        <h4 className="text-sm font-black uppercase text-white">{district2}</h4>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-300 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
                        Tier: {col2.tier}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{tLocal('cost_housing')}</span>
                        <span className="font-extrabold text-white">{col2.housing}€</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{tLocal('cost_food')}</span>
                        <span className="font-extrabold text-white">{col2.food}€</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{tLocal('cost_transport')}</span>
                        <span className="font-extrabold text-white">{col2.transport}€</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{tLocal('cost_utilities')}</span>
                        <span className="font-extrabold text-white">{col2.utilities}€</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{tLocal('telecom')}</span>
                        <span className="font-extrabold text-white">{col2.telecom}€</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>{tLocal('health_personal')}</span>
                        <span className="font-extrabold text-white">{col2.healthAndPersonal}€</span>
                      </div>
                      <div className="border-t border-white/10 pt-3 flex justify-between items-center font-black text-sm text-indigo-400">
                        <span>{tLocal('cost_total')}</span>
                        <span className="text-lg">{col2.total}€</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comparison Savings Box */}
              {isComparing && costDifference > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.25rem] p-5 flex items-start gap-3.5 shadow-sm animate-in zoom-in-95 duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                      {tLocal('savings_calc')}
                    </h4>
                    <p className="text-xs text-emerald-800 font-bold leading-relaxed">
                      {tLocal('savings_text')
                        .replace('{d1}', cheaperDistrict)
                        .replace('{d2}', expensiveDistrict)
                        .replace('{val}', costDifference.toString())}
                    </p>
                  </div>
                </div>
              )}

              {/* ── PAINEL DE SUFICIÊNCIA FINANCEIRA & PRUDÊNCIA MIRA ────────────────── */}
              {colAssessment.financialSufficiency && (
                <div className="bg-white border border-slate-200/80 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-[#FF8C00]" size={18} />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {tLocal('mira_financial_health')}
                      </h4>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      colAssessment.financialSufficiency.effortRateStatus === 'sustainable'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : colAssessment.financialSufficiency.effortRateStatus === 'moderate_risk'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {colAssessment.financialSufficiency.effortRateStatus === 'sustainable' ? tLocal('effort_sustainable_tag') :
                       colAssessment.financialSufficiency.effortRateStatus === 'moderate_risk' ? tLocal('effort_moderate_tag') :
                       tLocal('effort_critical_tag')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Taxa de Esforço */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        {tLocal('effort_rate_housing')}
                      </span>
                      <div className="text-xl font-black text-slate-900">
                        {colAssessment.financialSufficiency.effortRateHousingPct}%
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {tLocal('rent_vs_income_label').replace('{rent}', col1.housing.toString()).replace('{income}', colAssessment.financialSufficiency.netMonthlyIncome.toString())}
                      </p>
                    </div>

                    {/* Saldo Mensal Estimado */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        {tLocal('estimated_monthly_balance')}
                      </span>
                      <div className={`text-xl font-black ${colAssessment.financialSufficiency.isDeficit ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {colAssessment.financialSufficiency.netMonthlySavings > 0 ? `+${colAssessment.financialSufficiency.netMonthlySavings}€` : `${colAssessment.financialSufficiency.netMonthlySavings}€`}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {colAssessment.financialSufficiency.isDeficit ? tLocal('deficit_estimated_desc') : tLocal('savings_margin_desc')}
                      </p>
                    </div>

                    {/* Alvo de Reserva de Emergência */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        {tLocal('mira_recommended_reserve')}
                      </span>
                      <div className="text-xl font-black text-indigo-600">
                        {colAssessment.financialSufficiency.emergencyFund6Months}€
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {tLocal('reserve_target_desc').replace('{val3}', colAssessment.financialSufficiency.emergencyFund3Months.toString())}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAINEL DE REFERÊNCIA GERAL DA PORTARIA N.º 1563/2007 ─────────────────── */}
              {colAssessment.legalSubsistenceReference && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2.25rem] p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark size={16} className="text-amber-700" />
                      <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                        {tLocal('legal_subsistence_title')}
                      </h4>
                    </div>
                    <span className="text-[9px] font-extrabold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-300">
                      {tLocal('reference_label')} {colAssessment.legalSubsistenceReference.calculatedReference}€ / {tLocal('per_month')}
                    </span>
                  </div>

                  <p className="text-[10px] text-amber-900/80 font-medium leading-relaxed">
                    <strong>{tLocal('portaria_formula_label')}</strong> {colAssessment.legalSubsistenceReference.formulaDescription}.
                  </p>

                  <div className="bg-white/70 border border-amber-200 rounded-xl p-3 text-[9px] text-amber-950 font-medium leading-normal">
                    ⚠️ <strong>{tLocal('governance_note_title')}</strong> {colAssessment.legalSubsistenceReference.disclaimer}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ════ TAB 4: MIRA HOUSING INTELLIGENCE & AFFORDABILITY 2026 ═══════════════ */}
          {activeTab === 'housing_protection' && (() => {
            const territoryIntel = getTerritorialIntelligence(hpTerritoryId);
            const rentalAffordability = calculateRentalAffordability({
              territoryId: hpTerritoryId,
              typology: hpTypology,
              contractRentMonthly: hpMonthlyRent > 0 ? hpMonthlyRent : undefined,
              netMonthlyHouseholdIncome: hpNetIncome,
              grossMonthlyHouseholdIncome: hpGrossIncome,
              candidateAges: [hpCandidateAge],
              otherMonthlyDebtPayments: 0
            });

            const purchaseAffordability = calculatePurchaseAffordability({
              territoryId: hpTerritoryId,
              acquisitionPrice: hpAcquisitionPrice,
              appraisalValue: hpAppraisalValue > 0 ? hpAppraisalValue : hpAcquisitionPrice,
              ownCapitalAvailable: hpOwnCapital,
              netMonthlyIncome: hpNetIncome,
              otherMonthlyDebtPayments: hpOtherDebts,
              borrowers: [{ age: hpCandidateAge }],
              isFirstHpp: hpIsFirstHpp,
              ownsResidentialProperty: hpOwnsProperty,
              ownsResidentialPropertyLast3Years: hpOwnsPropertyLast3Years,
              isYouthGuaranteeRequested: hpYouthGuarantee
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Header Card with Mode Toggle */}
                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FF8C00]/10 flex items-center justify-center text-[#FF8C00]">
                        <Home size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                          {tLocal('hp_title')}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {tLocal('hp_subtitle')}
                        </p>
                      </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setHpHousingMode('rent')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                          hpHousingMode === 'rent'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tLocal('hp_mode_rent')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setHpHousingMode('buy')}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                          hpHousingMode === 'buy'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {tLocal('hp_mode_buy')}
                      </button>
                    </div>
                  </div>

                  {/* Territory & Core Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        {tLocal('hp_territory_label')}
                      </label>
                      <select
                        value={hpTerritoryId}
                        onChange={(e) => setHpTerritoryId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                      >
                        {TERRITORIAL_SEEDS.map((seed) => (
                          <option key={seed.id} value={seed.id}>
                            {seed.name} {seed.level === 'municipality' ? tLocal('hp_municipality_tag') : tLocal('hp_district_tag')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {hpHousingMode === 'rent' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            {tLocal('hp_typology_label')}
                          </label>
                          <select
                            value={hpTypology}
                            onChange={(e) => setHpTypology(e.target.value as HousingTypology)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                          >
                            <option value="room">{tLocal('room_single')}</option>
                            <option value="t0">{tLocal('t0_apartment')}</option>
                            <option value="t1">{tLocal('t1_apartment')}</option>
                            <option value="t2">{tLocal('t2_apartment')}</option>
                            <option value="t3">{tLocal('t3_apartment')}</option>
                            <option value="t4_plus">{tLocal('t4_apartment')}</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            {tLocal('hp_age_label')}
                          </label>
                          <input
                            type="number"
                            value={hpCandidateAge}
                            onChange={(e) => setHpCandidateAge(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            {tLocal('hp_buyer_age_label')}
                          </label>
                          <input
                            type="number"
                            value={hpCandidateAge}
                            onChange={(e) => setHpCandidateAge(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            id="youthGuaranteeToggle"
                            checked={hpYouthGuarantee}
                            onChange={(e) => setHpYouthGuarantee(e.target.checked)}
                            className="w-4 h-4 text-[#FF8C00] rounded focus:ring-[#FF8C00]"
                          />
                          <label htmlFor="youthGuaranteeToggle" className="text-xs font-bold text-slate-700">
                            {tLocal('hp_youth_guarantee_toggle')}
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* ══ MODO ARRENDAMENTO ══ */}
                {hpHousingMode === 'rent' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Inputs Card */}
                    <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                        {tLocal('hp_rent_inputs_title')}
                      </h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_net_income_label')}
                        </label>
                        <input
                          type="number"
                          value={hpNetIncome}
                          onChange={(e) => setHpNetIncome(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                        <p className="text-[9px] text-slate-400 font-medium">{tLocal('hp_net_income_help')}</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_gross_income_label')}
                        </label>
                        <input
                          type="number"
                          value={hpGrossIncome}
                          onChange={(e) => setHpGrossIncome(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                        <p className="text-[9px] text-slate-400 font-medium">{tLocal('hp_gross_income_help')}</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_rent_label')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={hpMonthlyRent || ''}
                            placeholder={`Benchmark MIRA: ${territoryIntel?.askingBenchmark.medianRentEurMonthly ?? 850} €`}
                            onChange={(e) => setHpMonthlyRent(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium">{tLocal('hp_rent_help')}</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_expenses_label')}
                        </label>
                        <input
                          type="number"
                          value={hpTotalExpenses}
                          onChange={(e) => setHpTotalExpenses(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                      </div>
                    </div>

                    {/* Results & Intelligence Cards */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Asking vs Contracted Observatory Banner */}
                      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white space-y-4 shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#FF8C00]">{tLocal('hp_territorial_obs_title')}</span>
                            <h4 className="text-sm font-black text-white">Asking vs. Contracted — {territoryIntel?.territoryName}</h4>
                          </div>
                          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
                            Spread: +{territoryIntel?.askingVsContractedSpreadPct}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_ine_contracted')}</span>
                            <div className="text-xl font-black text-emerald-400">
                              {territoryIntel?.contractedMarket.medianRentEurPerM2} €/m²
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              territoryIntel?.contractedMarket.dataStatus === 'official' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {territoryIntel?.contractedMarket.dataStatus}
                            </span>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_portals_asking')}</span>
                            <div className="text-xl font-black text-amber-400">
                              {rentalAffordability.monthlyRentUsed} € / {tLocal('per_month')}
                            </div>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              MIRA Benchmark (DERIVED)
                            </span>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_asking_spread')}</span>
                            <div className="text-xl font-black text-red-400">
                              +{territoryIntel?.askingVsContractedSpreadPct}%
                            </div>
                            <span className="text-[8px] text-slate-400 font-medium leading-none block">
                              {tLocal('hp_spread_help')}
                            </span>
                          </div>
                        </div>

                        <div className="text-[9px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                          <Info size={14} className="text-[#FF8C00] shrink-0" />
                          <span>{territoryIntel?.temporalTrends.trendNotice}</span>
                        </div>
                      </div>

                      {/* Diagnostic & CC 1076 & Porta 65 Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Capital Inicial Art. 1076.º CC */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-600" />
                            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('hp_initial_capital_title')}</h5>
                          </div>
                          
                          <div className="text-3xl font-black text-slate-900">
                            {rentalAffordability.legalInitialCapitalCC1076.maxAdmissibleTotalEur} €
                          </div>

                          <div className="text-[9px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex justify-between font-bold">
                              <span>{tLocal('hp_first_month_rent')}</span>
                              <span>{rentalAffordability.legalInitialCapitalCC1076.firstMonthRent} €</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>{tLocal('hp_advance_rent')}</span>
                              <span>{rentalAffordability.legalInitialCapitalCC1076.maxAdvanceRentEur} €</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>{tLocal('hp_security_deposit')}</span>
                              <span>{rentalAffordability.legalInitialCapitalCC1076.maxSecurityDepositEur} €</span>
                            </div>
                          </div>

                          <p className="text-[8px] text-slate-400 font-medium leading-tight">
                            {rentalAffordability.legalInitialCapitalCC1076.label}: {tLocal('hp_cc1076_legal_note')}
                          </p>
                        </div>

                        {/* Triagem Porta 65 Jovem */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={16} className="text-emerald-600" />
                              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('hp_porta65_title')}</h5>
                            </div>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              rentalAffordability.porta65JovemScreening.screeningStatus === 'preliminary_pass'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {rentalAffordability.porta65JovemScreening.screeningStatus === 'preliminary_pass' ? tLocal('hp_porta65_pre_pass') : tLocal('hp_porta65_rejected')}
                            </span>
                          </div>

                          <div className="text-[9px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex justify-between">
                              <span>{tLocal('hp_porta65_rma_label')} ({hpTypology.toUpperCase()}):</span>
                              <span className="font-bold">{rentalAffordability.porta65JovemScreening.municipalRmaEur} €</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{tLocal('hp_porta65_cap_rma')}</span>
                              <span className="font-bold">{rentalAffordability.porta65JovemScreening.incomeEligibility.maxByReferenceRent} €</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{tLocal('hp_porta65_cap_rmmg')}</span>
                              <span className="font-bold">{rentalAffordability.porta65JovemScreening.incomeEligibility.maxByRMMG} €</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{tLocal('hp_porta65_gross_effort')}</span>
                              <span className="font-bold">{rentalAffordability.porta65JovemScreening.incomeEligibility.grossEffortRatePct}%</span>
                            </div>
                          </div>

                          <p className="text-[8px] text-slate-400 font-medium leading-tight">
                            {rentalAffordability.porta65JovemScreening.contractStatusNotice}
                          </p>
                        </div>
                      </div>

                      {/* Effort Rate Status Bar */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('hp_effort_rate_title')}</h5>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            rentalAffordability.miraPrudenceStatus === 'sustainable' ? 'bg-emerald-100 text-emerald-800' :
                            rentalAffordability.miraPrudenceStatus === 'moderate_risk' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {rentalAffordability.effortRateHousingPct}% — {rentalAffordability.miraPrudenceStatus.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              rentalAffordability.miraPrudenceStatus === 'sustainable' ? 'bg-emerald-500' :
                              rentalAffordability.miraPrudenceStatus === 'moderate_risk' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, rentalAffordability.effortRateHousingPct)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>0%</span>
                          <span>{tLocal('hp_effort_mira_guide')}</span>
                          <span>{tLocal('hp_effort_critical_risk')}</span>
                          <span>100%</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ══ MODO COMPRA DE HABITAÇÃO ══ */}
                {hpHousingMode === 'buy' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Inputs Card */}
                    <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                        {tLocal('hp_buy_inputs_title')}
                      </h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_buy_price_label')}
                        </label>
                        <input
                          type="number"
                          value={hpAcquisitionPrice}
                          onChange={(e) => setHpAcquisitionPrice(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_appraisal_label')}
                        </label>
                        <input
                          type="number"
                          value={hpAppraisalValue}
                          onChange={(e) => setHpAppraisalValue(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                        <p className="text-[9px] text-slate-400 font-medium">{tLocal('hp_appraisal_help')}</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_own_capital_label')}
                        </label>
                        <input
                          type="number"
                          value={hpOwnCapital}
                          onChange={(e) => setHpOwnCapital(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_buyer_net_income_label')}
                        </label>
                        <input
                          type="number"
                          value={hpNetIncome}
                          onChange={(e) => setHpNetIncome(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          {tLocal('hp_other_debts_label')}
                        </label>
                        <input
                          type="number"
                          value={hpOtherDebts}
                          onChange={(e) => setHpOtherDebts(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00]"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="firstHppToggle"
                            checked={hpIsFirstHpp}
                            onChange={(e) => setHpIsFirstHpp(e.target.checked)}
                            className="w-4 h-4 text-[#FF8C00] rounded"
                          />
                          <label htmlFor="firstHppToggle" className="text-[10px] font-bold text-slate-700">
                            {tLocal('hp_first_hpp_toggle')}
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ownsPropertyToggle"
                            checked={hpOwnsProperty}
                            onChange={(e) => setHpOwnsProperty(e.target.checked)}
                            className="w-4 h-4 text-[#FF8C00] rounded"
                          />
                          <label htmlFor="ownsPropertyToggle" className="text-[10px] font-bold text-slate-700">
                            {tLocal('hp_owns_prop_toggle')}
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="ownsLast3YearsToggle"
                            checked={hpOwnsPropertyLast3Years}
                            onChange={(e) => setHpOwnsPropertyLast3Years(e.target.checked)}
                            className="w-4 h-4 text-[#FF8C00] rounded"
                          />
                          <label htmlFor="ownsLast3YearsToggle" className="text-[10px] font-bold text-slate-700">
                            {tLocal('hp_owns_last3y_toggle')}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Results & Regulatory Cards */}
                    <div className="lg:col-span-2 space-y-6">

                      {/* Main Financing Metrics Card */}
                      <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white space-y-5 shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#FF8C00]">{tLocal('hp_financing_title')}</span>
                            <h4 className="text-sm font-black text-white">{tLocal('hp_financing_sub')}</h4>
                          </div>
                          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {tLocal('hp_max_ltv')} {purchaseAffordability.financing.maxLtvAllowedPct}%
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_eligible_base')}</span>
                            <div className="text-xl font-black text-white">
                              {purchaseAffordability.eligiblePropertyValue.toLocaleString('pt-PT')} €
                            </div>
                            <span className="text-[8px] text-slate-400 font-medium">{tLocal('hp_price_vs_appraisal')}</span>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_loan_amount')}</span>
                            <div className="text-xl font-black text-emerald-400">
                              {purchaseAffordability.financing.loanAmount.toLocaleString('pt-PT')} €
                            </div>
                            <span className="text-[8px] text-slate-400 font-medium">{tLocal('hp_effective_ltv')} {purchaseAffordability.financing.effectiveLtvPct}%</span>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_monthly_mortgage')}</span>
                            <div className="text-xl font-black text-amber-400">
                              {purchaseAffordability.financing.estimatedMonthlyMortgageEur.toLocaleString('pt-PT')} € / {tLocal('per_month')}
                            </div>
                            <span className="text-[8px] text-slate-400 font-medium">{purchaseAffordability.financing.maxMaturityYears} {tLocal('hp_bdp_regulated_years')}</span>
                          </div>
                        </div>

                        {/* DSTI Macroprudential Meter */}
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-slate-200">
                              {purchaseAffordability.dstiMacroprudential.statusLabel}
                            </span>
                            <span className={`text-sm font-black ${
                              purchaseAffordability.dstiMacroprudential.dstiStatus === 'within_macroprudential_reference'
                                ? 'text-emerald-400'
                                : purchaseAffordability.dstiMacroprudential.dstiStatus === 'above_reference_with_possible_exception'
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}>
                              DSTI: {purchaseAffordability.dstiMacroprudential.dstiTotalPct}%
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                            {purchaseAffordability.dstiMacroprudential.explanation}
                          </p>
                        </div>
                      </div>

                      {/* IMT Jovem & Garantia Pública Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* IMT Jovem DL 48-A/2024 */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('hp_imt_jovem_title')}</h5>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              purchaseAffordability.fiscalTaxes.imtJovemApplied ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {purchaseAffordability.fiscalTaxes.imtJovemApplied ? tLocal('hp_imt_jovem_applied') : tLocal('hp_imt_jovem_normal')}
                            </span>
                          </div>

                          <div className="text-2xl font-black text-slate-900">
                            {purchaseAffordability.fiscalTaxes.payableImtEur.toLocaleString('pt-PT')} € <span className="text-xs text-slate-400 font-bold">{tLocal('hp_imt_tax_suffix')}</span>
                          </div>

                          <div className="text-[9px] text-emerald-950 bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-0.5 font-medium">
                            <div><strong>{tLocal('hp_imt_jovem_savings')}</strong> {purchaseAffordability.fiscalTaxes.imtJovemSavingsEur.toLocaleString('pt-PT')} €</div>
                            <div><strong>{tLocal('hp_stamp_duty_savings')}</strong> {purchaseAffordability.fiscalTaxes.stampDutySavingsEur.toLocaleString('pt-PT')} €</div>
                          </div>

                          <p className="text-[8px] text-slate-400 font-medium leading-tight">
                            {tLocal('hp_imt_jovem_legal_basis')}
                          </p>
                        </div>

                        {/* Garantia Pública Jovem DL 44/2024 */}
                        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('hp_guarantee_title')}</h5>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                              purchaseAffordability.publicGuaranteeDL44.eligibleByRules ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {purchaseAffordability.publicGuaranteeDL44.eligibleByRules ? tLocal('hp_guarantee_eligible') : tLocal('hp_guarantee_ineligible')}
                            </span>
                          </div>

                          <div className="text-2xl font-black text-indigo-600">
                            {purchaseAffordability.publicGuaranteeDL44.maxGuaranteeAmountEur.toLocaleString('pt-PT')} €
                          </div>

                          <p className="text-[9px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                            {tLocal('hp_guarantee_explanation')}
                          </p>

                          <p className="text-[8px] text-slate-400 font-medium leading-tight">
                            {purchaseAffordability.publicGuaranteeDL44.bankApprovalNotice}
                          </p>
                        </div>
                      </div>

                      {/* Total Disbursement Required */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{tLocal('hp_total_initial_capital')}</span>
                          <h4 className="text-sm font-black text-slate-800">{tLocal('hp_downpayment_taxes_notary')}</h4>
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                          {purchaseAffordability.totalInitialDisbursementRequiredEur.toLocaleString('pt-PT')} €
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ════ TAB 5: DIAGNÓSTICO AIMA & SAÚDE FINANCEIRA (INDEPENDENTE) ══ */}
          {activeTab === 'aima_health' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* LEGAL SOURCE BANNER — Clean App Theme */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <HeartPulse size={18} className="text-[#FF8C00] shrink-0" />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('aima_diag_title')}</h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{tLocal('aima_diag_subtitle')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">📋</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{tLocal('aima_portaria_badge')}</span>
                  </div>
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">⚖️</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{tLocal('aima_lei_badge')}</span>
                  </div>
                  <div className="px-3 py-2.5 bg-[#FF8C00]/10 border border-[#FF8C00]/20 rounded-xl text-[#FF8C00] flex items-center gap-2">
                    <span className="text-base shrink-0">💶</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{tLocal('aima_rmmg_badge')}</span>
                  </div>
                </div>
              </div>

              {/* Independent Inputs Form */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <UserCheck className="text-[#FF8C00] shrink-0" size={18} />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{tLocal('aima_data_title')}</h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">{tLocal('aima_data_sub')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('aima_net_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_net_help')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={aimaNetIncome}
                        onChange={(e) => setAimaNetIncome(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('aima_dep_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_dep_help')}</p>
                    <select
                      value={aimaDependents}
                      onChange={(e) => setAimaDependents(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 0 ? tLocal('aima_no_dep') : n === 1 ? tLocal('aima_one_dep') : tLocal('aima_multi_dep')}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('aima_rent_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_rent_help')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={aimaMonthlyRent}
                        onChange={(e) => setAimaMonthlyRent(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">€</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('aima_exp_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_exp_help')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={aimaTotalExpenses}
                        onChange={(e) => setAimaTotalExpenses(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {tLocal('aima_ss_label')}
                  </label>
                  <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_ss_help')}</p>
                  <select
                    value={aimaSsMode}
                    onChange={(e) => setAimaSsMode(e.target.value as any)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                  >
                    <option value="normal_outrem">{tLocal('aima_ss_outrem')}</option>
                    <option value="normal_recibos">{tLocal('aima_ss_recibos')}</option>
                    <option value="reduced_25">{tLocal('aima_ss_reduced')}</option>
                    <option value="min_20">{tLocal('aima_ss_min')}</option>
                  </select>
                </div>
              </div>

              {/* Results Panel */}
              {(() => {
                const baseReq = NORMATIVE_2026.RMMG_2026;
                const depReq = aimaDependents * Math.round(NORMATIVE_2026.RMMG_2026 * 0.30);
                const totalReq = baseReq + depReq;
                const meetsReq = aimaNetIncome >= totalReq;
                const diff = aimaNetIncome - totalReq;
                const effortRate = aimaNetIncome > 0 ? Math.round((aimaMonthlyRent / aimaNetIncome) * 100) : 0;
                const netSavings = Math.round(aimaNetIncome - aimaTotalExpenses);
                const emergencyFund = Math.round(aimaTotalExpenses * 3);
                const setupCapital = Math.round(aimaMonthlyRent * 3);

                // Cálculo SS estimado no Diagnóstico AIMA
                let estimatedSsDeduction = 0;
                if (aimaSsMode === 'normal_outrem') estimatedSsDeduction = Math.round(aimaNetIncome * 0.123);
                else if (aimaSsMode === 'normal_recibos') estimatedSsDeduction = Math.round(aimaNetIncome * 0.7 * 0.214);
                else if (aimaSsMode === 'reduced_25') estimatedSsDeduction = Math.round(aimaNetIncome * 0.7 * 0.75 * 0.214);
                else estimatedSsDeduction = 20;

                const isSsRisk = aimaSsMode === 'min_20' || aimaSsMode === 'reduced_25';

                let score = 100;
                if (effortRate > 35) score -= Math.min(45, Math.round((effortRate - 35) * 2.2));
                if (!meetsReq) score -= 30;
                if (isSsRisk) score -= 25;
                if (netSavings < 0) score -= 20;
                score = Math.max(10, Math.min(100, Math.round(score)));

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">{tLocal('aima_res_title')}</h3>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        score >= 80 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
                        score >= 50 ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
                        'border-red-500/40 bg-red-500/10 text-red-300'
                      }`}>
                        Score MIRA: {score}/100
                      </span>
                    </div>

                    {/* Score & Status Banner */}
                    <div className="flex items-center gap-5 p-5 bg-white/5 border border-white/10 rounded-3xl">
                      <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center font-black shadow-2xl shrink-0 ${
                        score >= 80 ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10' :
                        score >= 50 ? 'border-amber-400 text-amber-400 bg-amber-500/10' :
                        'border-red-400 text-red-400 bg-red-500/10'
                      }`}>
                        <span className="text-2xl leading-none">{score}</span>
                        <span className="text-[9px] text-slate-400 font-bold">/100</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">{tLocal('aima_viability_index')}</span>
                        <h4 className="text-base font-black uppercase text-white">
                          {score >= 80 ? tLocal('aima_score_high') : score >= 50 ? tLocal('aima_score_med') : tLocal('aima_score_low')}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">
                          {tLocal('aima_est_ss')}: <strong className="text-amber-300">{estimatedSsDeduction}€ / {tLocal('per_month')}</strong> &middot; {tLocal('effort_rate_housing')}: <strong className="text-white">{effortRate}%</strong>
                        </p>
                      </div>
                    </div>

                    {/* ⚠️ PROMINENT AIMA SS RISK ALERT CARD */}
                    {isSsRisk && (
                      <div className="p-5 bg-red-500/15 border border-red-500/40 rounded-3xl space-y-2 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle size={18} className="shrink-0" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            {tLocal('aima_ss_alert_title')}
                          </h4>
                        </div>
                        <p className="text-[10px] text-red-200 font-medium leading-relaxed">
                          {tLocal('aima_ss_alert_desc')}
                        </p>
                      </div>
                    )}

                    {/* Compliance Card */}
                    <div className={`p-5 rounded-3xl border space-y-4 ${
                      meetsReq && !isSsRisk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck size={18} className={meetsReq && !isSsRisk ? 'text-emerald-400' : 'text-amber-400'} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">
                              {tLocal('aima_legal_subsistence_check')}
                            </h4>
                            <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                              Portaria 1563/2007 &middot; Art. 52.º Lei 23/2007 &middot; RMMG 2026 (920€)
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border shrink-0 ${
                          meetsReq && !isSsRisk ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}>
                          {meetsReq && !isSsRisk ? tLocal('aima_meets_threshold') : tLocal('aima_threshold_warn')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">{tLocal('aima_net_income')}</span>
                          <span className="text-xl font-black text-white">{aimaNetIncome.toLocaleString('pt')}€</span>
                          <span className="text-[8px] text-slate-400 block">{tLocal('per_month')}</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">{tLocal('aima_min_threshold')}</span>
                          <span className="text-xl font-black text-amber-300">{totalReq.toLocaleString('pt')}€</span>
                          <span className="text-[8px] text-slate-400 block">920€ + {aimaDependents}×276€</span>
                        </div>
                        <div className={`p-4 border rounded-2xl ${
                          meetsReq ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                        }`}>
                          <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">{tLocal('difference')}</span>
                          <span className={`text-xl font-black ${meetsReq ? 'text-emerald-400' : 'text-red-400'}`}>
                            {diff >= 0 ? '+' : ''}{diff}€
                          </span>
                          <span className="text-[8px] text-slate-400 block">{meetsReq ? tLocal('above_threshold') : tLocal('below_threshold')}</span>
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-300 font-medium leading-relaxed pt-1">
                        {tLocal('aima_legal_basis_note')}
                      </p>
                    </div>

                    {/* Breakdown Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{tLocal('aima_net_balance')}</span>
                        <h2 className={`text-2xl font-black tracking-tight ${netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {netSavings >= 0 ? `+${netSavings}€` : `${netSavings}€`}
                        </h2>
                        <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_income_minus_expenses')}</p>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{tLocal('emergency_fund_title')}</span>
                        <h2 className="text-2xl font-black text-amber-400 tracking-tight">{emergencyFund}€</h2>
                        <p className="text-[8px] text-slate-400 font-medium">{tLocal('aima_recommended_stability')}</p>
                      </div>
                      <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">{tLocal('aima_setup_capital_title')}</span>
                        <h2 className="text-2xl font-black text-white tracking-tight">{setupCapital}€</h2>
                        <p className="text-[8px] text-indigo-300 font-medium">{tLocal('aima_setup_capital_desc')}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ════ TAB 6: PEQUENO EMPREENDEDOR / MICROEMPRESA ═════════════════ */}
          {activeTab === 'small_business' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Educational Header Banner */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building2 size={18} className="text-[#FF8C00] shrink-0" />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {tLocal('pe_sim_title')}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      {tLocal('pe_sim_subtitle')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">🏛️</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{tLocal('pe_badge_irc')}</span>
                  </div>
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">💼</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{tLocal('pe_badge_tsu')}</span>
                  </div>
                  <div className="px-3 py-2.5 bg-[#FF8C00]/10 border border-[#FF8C00]/20 rounded-xl text-[#FF8C00] flex items-center gap-2">
                    <span className="text-base shrink-0">📊</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{tLocal('pe_badge_breakeven')}</span>
                  </div>
                </div>
              </div>

              {/* Inputs Form */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Coins className="text-[#FF8C00] shrink-0" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {tLocal('pe_form_title')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('pe_revenue_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('pe_revenue_help')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={bizRevenue}
                        onChange={(e) => setBizRevenue(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('pe_expenses_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('pe_expenses_help')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={bizExpenses}
                        onChange={(e) => setBizExpenses(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('pe_sector_label')}
                    </label>
                    <select
                      value={bizSector}
                      onChange={(e) => setBizSector(e.target.value as any)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="services">{tLocal('pe_opt_services')}</option>
                      <option value="commerce">{tLocal('pe_opt_commerce')}</option>
                      <option value="hospitality">{tLocal('pe_opt_hospitality')}</option>
                      <option value="industry">{tLocal('pe_opt_industry')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('pe_structure_label')}
                    </label>
                    <select
                      value={bizLegalStructure}
                      onChange={(e) => setBizLegalStructure(e.target.value as any)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="unipessoal_lda">{tLocal('pe_opt_lda')}</option>
                      <option value="eni">{tLocal('pe_opt_eni')}</option>
                    </select>
                  </div>
                </div>

                {bizLegalStructure === 'unipessoal_lda' && (
                  <div className="space-y-2 border-t border-slate-100 pt-4 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {tLocal('pe_prolabore_label')}
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">{tLocal('pe_prolabore_help')}</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={bizProLabore}
                        onChange={(e) => setBizProLabore(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">€</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Display */}
              {(() => {
                const res = calculateSmallBusiness();
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">
                        {tLocal('pe_res_title')}
                      </h3>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                        {tLocal('pe_margin_label')}: {res.profitMargin}%
                      </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {tLocal('pe_net_profit_title')}
                      </p>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        +{res.netProfit.toLocaleString('pt')}€
                      </h1>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        {tLocal('pe_net_profit_calc').replace('{bizRevenue}', bizRevenue.toString()).replace('{bizExpenses}', bizExpenses.toString()).replace('{res.totalTaxes}', res.totalTaxes.toString())}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black block">{tLocal('pe_gross_op_profit')}</span>
                        <span className="text-xl font-black text-white">+{res.grossProfit}€ / {tLocal('per_month')}</span>
                        <span className="text-[8px] text-slate-400 block">{tLocal('pe_before_taxes')}</span>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black block">{tLocal('pe_estimated_taxes')}</span>
                        <span className="text-xl font-black text-red-400">-{res.taxAmount}€ / {tLocal('per_month')}</span>
                        <span className="text-[8px] text-slate-400 block">{bizLegalStructure === 'unipessoal_lda' ? tLocal('pe_tax_label_irc') : tLocal('pe_tax_label_irs')}</span>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black block">{tLocal('pe_ss_tsu_label')}</span>
                        <span className="text-xl font-black text-amber-400">-{res.ssAmount}€ / {tLocal('per_month')}</span>
                        <span className="text-[8px] text-slate-400 block">{bizLegalStructure === 'unipessoal_lda' ? tLocal('pe_ss_label_tsu') : tLocal('pe_ss_label_eni')}</span>
                      </div>
                    </div>

                    {/* Break-Even Indicator */}
                    <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                          {tLocal('pe_breakeven_title')}
                        </h4>
                        <p className="text-[9px] text-indigo-200 font-bold">
                          {tLocal('pe_breakeven_sub')}
                        </p>
                      </div>
                      <span className="text-2xl font-black text-white shrink-0 ml-4">
                        {res.breakEven}€
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed">
                      {tLocal('pe_edu_note')}
                    </span>
                    </div>
                  </div>
                );
              })()}

              {/* ════ GUIA ESTRATÉGICO PEQUENO EMPREENDEDOR & MICROEMPRESA ════ */}
              <div className="bg-white border border-slate-200/80 rounded-[2.25rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-wider mb-2">
                    <Building2 size={12} className="text-blue-600" />
                    {tLocal('pe_guide_badge')}
                  </div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                    {tLocal('pe_guide_title')}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    {tLocal('pe_guide_subtitle')}
                  </p>
                </div>

                {/* 1. Estrutura Jurídica ENI vs Lda */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#FF8C00]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {tLocal('pe_sec_legal_title')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="p-4 bg-blue-50/40 border border-blue-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-900 uppercase">{tLocal('pe_legal_lda_name')}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-blue-600 text-white rounded-full">{tLocal('pe_tax_label_irc')}</span>
                      </div>
                      <p className="text-[11px] text-blue-950 leading-relaxed">{tLocal('pe_legal_lda_desc')}</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase">{tLocal('pe_legal_eni_name')}</span>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-amber-500/10 text-amber-700 rounded-full border border-amber-300">{tLocal('pe_tax_label_irs')}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{tLocal('pe_legal_eni_desc')}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Remuneração Gerente & Dividendos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={15} className="text-slate-700" />
                      <h5 className="text-[10px] font-black text-slate-900 uppercase">{tLocal('pe_remun_moe_name')}</h5>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{tLocal('pe_remun_moe_desc')}</p>
                  </div>

                  <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Coins size={15} className="text-emerald-700" />
                      <h5 className="text-[10px] font-black text-emerald-900 uppercase">{tLocal('pe_remun_profit_name')}</h5>
                    </div>
                    <p className="text-[11px] text-emerald-950 leading-relaxed">{tLocal('pe_remun_profit_desc')}</p>
                  </div>
                </div>

                {/* 3. Setores & Coeficientes */}
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-[#FF8C00]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {tLocal('pe_sec_sector_title')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-800 block">{tLocal('pe_sector_services_name')}</span>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{tLocal('pe_sector_services_desc')}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-800 block">{tLocal('pe_sector_commerce_name')}</span>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{tLocal('pe_sector_commerce_desc')}</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-1">
                      <span className="text-[10px] font-black text-slate-800 block">{tLocal('pe_sector_tourism_name')}</span>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{tLocal('pe_sector_tourism_desc')}</p>
                    </div>
                  </div>
                </div>

                {/* 4. IVA & Break-Even */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                  <div className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Landmark size={15} className="text-amber-700" />
                      <h5 className="text-[10px] font-black text-amber-900 uppercase">{tLocal('pe_sec_iva_title')}</h5>
                    </div>
                    <p className="text-[11px] text-amber-950 leading-relaxed">{tLocal('pe_iva_desc')}</p>
                  </div>

                  <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={15} className="text-indigo-600" />
                      <h5 className="text-[10px] font-black text-indigo-900 uppercase">{tLocal('pe_sec_breakeven_title')}</h5>
                    </div>
                    <p className="text-[11px] text-indigo-950 leading-relaxed">{tLocal('pe_breakeven_desc')}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Official Verification Sources Card */}
          <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                {tLocal('note_title')}
              </h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {tLocal('note_text')}
            </p>

            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-black uppercase">
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <Landmark size={12} className="text-indigo-500 shrink-0" />
                <span>{tLocal('badge_at')}</span>
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <BarChart3 size={12} className="text-emerald-500 shrink-0" />
                <span>{tLocal('badge_ine')}</span>
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-sky-500 shrink-0" />
                <span>{tLocal('badge_iss')}</span>
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <Coins size={12} className="text-amber-500 shrink-0" />
                <span>{tLocal('badge_bdp')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
