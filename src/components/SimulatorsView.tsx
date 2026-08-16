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

interface SimulatorsViewProps {
  language: string;
  onViewChange: (view: ViewType, params?: any) => void;
  initialTab?: string;
  initialParams?: Record<string, any>;
}

// ─── TRANSLATIONS DICTIONARY ────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  PT: {
    title: 'Simuladores MIRA Económicos',
    subtitle: 'Métricas e Indicadores Financeiros Oficiais (2026)',
    tab_1_salary: '💰 1. Salário Líquido',
    tab_2_recibos: '💼 2. Recibos Verdes',
    tab_3_cost: '🗺️ 3. Custo de Vida',
    tab_4_housing: '🏠 4. Proteção à Habitação',
    tab_5_aima: '🩺 5. Requisitos AIMA',
    tab_6_business: '🏢 6. Pequeno Empreendedor',
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
    madeira: 'Região Aut. da Madeira (-20% IRS)',
    azores: 'Região Aut. dos Açores (-30% IRS)',
    irs_jovem: 'Regime IRS Jovem (Art. 12.º-B CIRS)',
    irs_jovem_active: 'Aplicar Benefício IRS Jovem (18-35 Anos)',
    irs_jovem_year: 'Ano do Benefício',
    year_1: '1.º Ano (100% Isenção)',
    year_2: '2.º Ano (75% Isenção)',
    years_3_4: '3.º ao 4.º Ano (50% Isenção)',
    years_5_10: '5.º ao 10.º Ano (25% Isenção)',
    meal_allowance: 'Subsídio de Alimentação (Diário)',
    meal_type: 'Método de Pagamento',
    cash: 'Dinheiro / Transferência (Teto Isento 6,00€)',
    card: 'Cartão de Refeição (Teto Isento 9,60€)',
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
    emergency_fund_sub: '3 Meses de despesas de sobrevivência segundo o Banco de Portugal'
  },
  EN: {
    title: 'MIRA Economic Simulators',
    subtitle: 'Official Financial Metrics & Indicators (2026)',
    tab_1_salary: '💰 1. Net Salary',
    tab_2_recibos: '💼 2. Freelancer (Recibos Verdes)',
    tab_3_cost: '🗺️ 3. Cost of Living',
    tab_4_housing: '🏠 4. Housing Protection',
    tab_5_aima: '🩺 5. AIMA Requirements',
    tab_6_business: '🏢 6. Small Business',
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
    madeira: 'Madeira Aut. Region (-20% IRS)',
    azores: 'Azores Aut. Region (-30% IRS)',
    irs_jovem: 'IRS Jovem Regime (Art. 12-B CIRS)',
    irs_jovem_active: 'Apply IRS Jovem Benefit (Ages 18-35)',
    irs_jovem_year: 'Benefit Year',
    year_1: '1st Year (100% Exemption)',
    year_2: '2nd Year (75% Exemption)',
    years_3_4: '3rd to 4th Year (50% Exemption)',
    years_5_10: '5th to 10th Year (25% Exemption)',
    meal_allowance: 'Meal Allowance (Daily)',
    meal_type: 'Payment Method',
    cash: 'Cash / Transfer (€6.00 Tax-Free Cap)',
    card: 'Meal Card (€9.60 Tax-Free Cap)',
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
    emergency_fund_sub: '3 Months survival costs according to Banco de Portugal'
  },
  ES: {
    title: 'Simuladores Económicos MIRA',
    subtitle: 'Métricas e Indicadores Financieros Oficiales (2026)',
    tab_1_salary: '💰 1. Salario Neto',
    tab_2_recibos: '💼 2. Recibos Verdes (Autónomo)',
    tab_3_cost: '🗺️ 3. Coste de Vida',
    tab_4_housing: '🏠 4. Protección de Vivienda',
    tab_5_aima: '🩺 5. Requisitos AIMA',
    tab_6_business: '🏢 6. Pequeño Emprendedor y PME',
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
    madeira: 'Región Autónoma de Madeira (-20% IRS)',
    azores: 'Región Autónoma de Azores (-30% IRS)',
    irs_jovem: 'Régimen IRS Jovem (Art. 12-B CIRS)',
    irs_jovem_active: 'Aplicar Beneficio IRS Jovem (18-35 Años)',
    irs_jovem_year: 'Año del Beneficio',
    year_1: '1.er Año (100% Exención)',
    year_2: '2.º Año (75% Exención)',
    years_3_4: '3.er a 4.º Año (50% Exención)',
    years_5_10: '5.º a 10.º Año (25% Exención)',
    meal_allowance: 'Subsidio de Alimentación (Diario)',
    meal_type: 'Método de Pago',
    cash: 'Efectivo / Transferencia (Tope Exento 6,00€)',
    card: 'Tarjeta de Comida (Tope Exento 9,60€)',
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
    emergency_fund_sub: '3 Meses de gastos de supervivencia según la recomendación del Banco de Portugal'
  },
  FR: {
    title: 'Simulateurs Économiques MIRA',
    subtitle: 'Indicateurs Financiers Officiels (2026)',
    tab_1_salary: '💰 1. Salaire Net',
    tab_2_recibos: '💼 2. Recibos Verdes (Indépendant)',
    tab_3_cost: '🗺️ 3. Coût de la Vie',
    tab_4_housing: '🏠 4. Protection Logement',
    tab_5_aima: '🩺 5. Exigences AIMA',
    tab_6_business: '🏢 6. Petit Entrepreneur & PME',
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
    madeira: 'Région Autonome de Madère (-20% IRS)',
    azores: 'Région Autonome des Açores (-30% IRS)',
    irs_jovem: 'Régime IRS Jovem (Art. 12-B CIRS)',
    irs_jovem_active: 'Appliquer le Bénéfice IRS Jovem (18-35 Ans)',
    irs_jovem_year: 'Année du Bénéfice',
    year_1: '1ère Année (100% Exonération)',
    year_2: '2ème Année (75% Exonération)',
    years_3_4: '3ème à 4ème Année (50% Exonération)',
    years_5_10: '5ème à 10ème Année (25% Exonération)',
    meal_allowance: 'Indemnité Repas (Journalière)',
    meal_type: 'Mode de Paiement',
    cash: 'Espèces / Virement (Plafond Exonéré 6,00€)',
    card: 'Carte Repas (Plafond Exonéré 9,60€)',
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
    emergency_fund_sub: '3 Mois de frais de subsistance selon la Banque du Portugal'
  }
};

interface CostProfile {
  rentRoom: number;
  rentT1: number;
  rentT2: number;
  transportPass: number;
  foodBase: number;
  utilitiesBase: number;
  tier: 'High' | 'Medium' | 'Low';
}

const DISTRICT_COST_DATA: Record<string, CostProfile> = {
  Lisboa: { rentRoom: 450, rentT1: 950, rentT2: 1350, transportPass: 40, foodBase: 220, utilitiesBase: 100, tier: 'High' },
  Porto: { rentRoom: 380, rentT1: 780, rentT2: 1100, transportPass: 40, foodBase: 210, utilitiesBase: 95, tier: 'High' },
  Faro: { rentRoom: 370, rentT1: 750, rentT2: 1050, transportPass: 35, foodBase: 215, utilitiesBase: 95, tier: 'High' },
  Setúbal: { rentRoom: 340, rentT1: 700, rentT2: 980, transportPass: 40, foodBase: 210, utilitiesBase: 90, tier: 'High' },
  Braga: { rentRoom: 290, rentT1: 600, rentT2: 820, transportPass: 30, foodBase: 190, utilitiesBase: 85, tier: 'Medium' },
  Coimbra: { rentRoom: 270, rentT1: 550, rentT2: 780, transportPass: 30, foodBase: 185, utilitiesBase: 85, tier: 'Medium' },
  Aveiro: { rentRoom: 300, rentT1: 620, rentT2: 850, transportPass: 30, foodBase: 195, utilitiesBase: 85, tier: 'Medium' },
  Leiria: { rentRoom: 260, rentT1: 520, rentT2: 750, transportPass: 30, foodBase: 185, utilitiesBase: 80, tier: 'Medium' },
  Santarém: { rentRoom: 240, rentT1: 480, rentT2: 680, transportPass: 30, foodBase: 180, utilitiesBase: 80, tier: 'Medium' },
  'Funchal (Madeira)': { rentRoom: 350, rentT1: 720, rentT2: 980, transportPass: 30, foodBase: 220, utilitiesBase: 90, tier: 'Medium' },
  'Ponta Delgada (Açores)': { rentRoom: 280, rentT1: 560, rentT2: 780, transportPass: 30, foodBase: 205, utilitiesBase: 85, tier: 'Medium' },
  Évora: { rentRoom: 240, rentT1: 480, rentT2: 680, transportPass: 28, foodBase: 180, utilitiesBase: 80, tier: 'Low' },
  Viseu: { rentRoom: 220, rentT1: 450, rentT2: 620, transportPass: 28, foodBase: 175, utilitiesBase: 78, tier: 'Low' },
  'Viana do Castelo': { rentRoom: 230, rentT1: 470, rentT2: 650, transportPass: 28, foodBase: 180, utilitiesBase: 78, tier: 'Low' },
  'Vila Real': { rentRoom: 200, rentT1: 400, rentT2: 550, transportPass: 25, foodBase: 170, utilitiesBase: 75, tier: 'Low' },
  'Castelo Branco': { rentRoom: 190, rentT1: 390, rentT2: 520, transportPass: 25, foodBase: 168, utilitiesBase: 75, tier: 'Low' },
  Beja: { rentRoom: 210, rentT1: 410, rentT2: 580, transportPass: 25, foodBase: 170, utilitiesBase: 75, tier: 'Low' },
  Guarda: { rentRoom: 180, rentT1: 360, rentT2: 480, transportPass: 22, foodBase: 165, utilitiesBase: 70, tier: 'Low' },
  Bragança: { rentRoom: 185, rentT1: 370, rentT2: 500, transportPass: 24, foodBase: 165, utilitiesBase: 70, tier: 'Low' },
  Portalegre: { rentRoom: 175, rentT1: 350, rentT2: 470, transportPass: 20, foodBase: 160, utilitiesBase: 70, tier: 'Low' }
};

export const SimulatorsView: React.FC<SimulatorsViewProps> = ({ language, onViewChange, initialTab, initialParams }) => {
  const [activeTab, setActiveTab] = useState<'salary_outrem' | 'salary_recibos' | 'cost' | 'housing_protection' | 'aima_health' | 'small_business'>('salary_outrem');
  const [salaryRegime, setSalaryRegime] = useState<'outrem' | 'recibos'>('outrem');

  const lang = ['PT', 'EN', 'ES', 'FR'].includes(language) ? language : 'PT';
  const tLocal = (key: string) => translations[lang]?.[key] || key;

  useEffect(() => {
    const tabKey = initialTab || initialParams?.tab;
    if (tabKey) {
      if (tabKey === 'salario' || tabKey === 'salary' || tabKey === 'salary_outrem') {
        setActiveTab('salary_outrem');
        setSalaryRegime('outrem');
      } else if (tabKey === 'recibos' || tabKey === 'salary_recibos') {
        setActiveTab('salary_recibos');
        setSalaryRegime('recibos');
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
  const [grossSalary, setGrossSalary] = useState<number>(1050);
  const [familyStatus, setFamilyStatus] = useState<string>('single');
  const [dependents, setDependents] = useState<number>(0);
  const [fiscalRegion, setFiscalRegion] = useState<string>('continent');
  const [mealAllowance, setMealAllowance] = useState<number>(7.63);
  const [mealType, setMealType] = useState<string>('card');
  const [workDays, setWorkDays] = useState<number>(22);
  const [isIrsJovem, setIsIrsJovem] = useState<boolean>(false);
  const [irsJovemYear, setIrsJovemYear] = useState<number>(1);

  // ─── RECIBOS VERDES SIMULATOR STATE (INDEPENDENT) ─────────────────────────
  const [monthlyInvoice, setMonthlyInvoice] = useState<number>(1500);
  const [activityType, setActivityType] = useState<'services' | 'products' | 'scientific'>('services');
  const [irsWithholdingMode, setIrsWithholdingMode] = useState<'normal' | 'exempt_101b'>('normal');
  const [ssRegimeMode, setSsRegimeMode] = useState<'normal' | 'eni' | 'exempt_year1'>('normal');
  const [ssVariation, setSsVariation] = useState<number>(0);
  const [rvFiscalRegion, setRvFiscalRegion] = useState<string>('continent');
  const [rvIsIrsJovem, setRvIsIrsJovem] = useState<boolean>(false);
  const [rvIrsJovemYear, setRvIrsJovemYear] = useState<number>(1);

  // ─── COST OF LIVING STATE ──────────────────────────────────────────────────
  const [district1, setDistrict1] = useState<string>('Lisboa');
  const [district2, setDistrict2] = useState<string>('Bragança');
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [housingType, setHousingType] = useState<string>('t1_apartment');
  const [foodStyle, setFoodStyle] = useState<string>('mixed');
  const [transportOption, setTransportOption] = useState<string>('public_pass');
  const [utilitiesTier, setUtilitiesTier] = useState<string>('utilities_basic');
  const [householdSize, setHouseholdSize] = useState<number>(1);

  // ─── HOUSING PROTECTION STATE (INDEPENDENT) ────────────────────────────────
  const [hpNetIncome, setHpNetIncome] = useState<number>(1050);
  const [hpMonthlyRent, setHpMonthlyRent] = useState<number>(600);
  const [hpTotalExpenses, setHpTotalExpenses] = useState<number>(900);

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

  // Telemetria em tempo real para o contador Navegações & Interações
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
    }, 2000);
    return () => clearTimeout(timer);
  }, [grossSalary, monthlyInvoice, district1, district2, hpMonthlyRent, aimaNetIncome, bizRevenue]);

  // ─── CONTA DE OUTREM CALCULATION LOGIC ────────────────────────────────────
  const calculateSalaryOutrem = () => {
    const res = TaxCalculationService.calculateSalaryOutrem({
      grossSalary,
      familyStatus: familyStatus as 'single' | 'married_1' | 'married_2',
      dependents,
      fiscalRegion: fiscalRegion as 'continent' | 'madeira' | 'azores',
      mealAllowanceDaily: mealAllowance,
      mealType: mealType as 'cash' | 'card',
      workDays,
      isIrsJovem,
      irsJovemYear,
    });

    return {
      netSalary: res.netSalary,
      ssDeduction: res.socialSecurityDeduction,
      irsDeduction: res.irsWithholdingDeduction,
      mealExempt: res.mealAllowanceExempt,
      mealTaxed: res.mealAllowanceTaxed,
      totalMeal: res.mealAllowanceTotal,
      totalDeductions: res.totalTaxLoad,
      effectiveRate: res.totalTaxLoadEffectiveRate,
      marginalRate: res.irsWithholdingMarginalRate,
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

  // ─── COST OF LIVING CALCULATION LOGIC ──────────────────────────────────────
  const calculateCostOfLiving = (districtName: string) => {
    const profile = DISTRICT_COST_DATA[districtName] || DISTRICT_COST_DATA['Lisboa'];
    
    let housingCost = profile.rentT1;
    if (housingType === 'shared_room') housingCost = profile.rentRoom;
    else if (housingType === 't2_apartment') housingCost = profile.rentT2;

    let foodCost = profile.foodBase;
    if (foodStyle === 'cook_home') foodCost = profile.foodBase * 0.85;
    else if (foodStyle === 'eat_out') foodCost = profile.foodBase * 1.8;

    let transportCost = profile.transportPass;
    if (transportOption === 'own_car') transportCost = 155;

    let utilitiesCost = profile.utilitiesBase;
    
    let utilitiesMultiplier = 1.0;
    if (householdSize === 2) utilitiesMultiplier = 1.4;
    else if (householdSize === 3) utilitiesMultiplier = 1.7;
    else if (householdSize === 4) utilitiesMultiplier = 1.9;
    else if (householdSize >= 5) utilitiesMultiplier = 2.15;
    
    utilitiesCost = utilitiesCost * utilitiesMultiplier;
    
    if (utilitiesTier === 'utilities_active') utilitiesCost = utilitiesCost * 1.6;

    const totalCost = housingCost + foodCost + transportCost + utilitiesCost;

    return {
      housing: Math.round(housingCost),
      food: Math.round(foodCost),
      transport: Math.round(transportCost),
      utilities: Math.round(utilitiesCost),
      utilitiesPerPerson: Math.round(utilitiesCost / householdSize),
      total: Math.round(totalCost)
    };
  };

  const col1 = calculateCostOfLiving(district1);
  const col2 = calculateCostOfLiving(district2);
  const costDifference = Math.abs(col1.total - col2.total);
  const cheaperDistrict = col1.total < col2.total ? district1 : district2;
  const expensiveDistrict = col1.total > col2.total ? district1 : district2;

  // ─── FINANCIAL HEALTH & EFFORT RATE (BANCO DE PORTUGAL & AIMA GUIDELINES) ──
  const calculateFinancialHealth = () => {
    const net = salaryResults.netSalary;
    const rent = col1.housing;
    const totalExp = col1.total;

    const effortRate = net > 0 ? Math.round((rent / net) * 100) : 0;
    const netSavings = Math.round(net - totalExp);
    const savingsRate = net > 0 ? Math.round((netSavings / net) * 100) : 0;
    
    const setupCapital = Math.round((rent * 3) + (totalExp * 3));
    const emergencyFund = Math.round(totalExp * 3);

    // Requisito Legal AIMA 2026 (Subsistência): RMMG 920€ titular + 276€ por dependente (30%)
    const baseSubsistence = NORMATIVE_2026.RMMG_2026;
    const extraDependents = Math.max(0, householdSize - 1) * Math.round(NORMATIVE_2026.RMMG_2026 * 0.30);
    const totalAimaRequirement = Math.round(baseSubsistence + extraDependents);
    const meetsAimaReq = net >= totalAimaRequirement;

    // Pontuação de Saúde Financeira MIRA (0 a 100)
    let score = 100;
    if (effortRate > 35) score -= Math.min(45, Math.round((effortRate - 35) * 2.2));
    if (netSavings < 0) score -= 35;
    else if (savingsRate < 10) score -= 15;
    else if (savingsRate >= 20) score += 5;

    score = Math.max(10, Math.min(100, Math.round(score)));

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (effortRate > 50 || score < 50) status = 'critical';
    else if (effortRate > 35 || score < 75) status = 'warning';

    return {
      effortRate,
      netSavings,
      savingsRate,
      setupCapital,
      emergencyFund,
      totalAimaRequirement,
      meetsAimaReq,
      score,
      status
    };
  };

  const finHealth = calculateFinancialHealth();

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

      {/* ── TAB BAR FOR ALL 6 CORE SIMULATORS ───────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-white relative z-10 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => { setActiveTab('salary_outrem'); setSalaryRegime('outrem'); }}
          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center shrink-0 transition-all whitespace-nowrap ${
            activeTab === 'salary_outrem' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tLocal('tab_1_salary')}
        </button>

        <button
          onClick={() => { setActiveTab('salary_recibos'); setSalaryRegime('recibos'); }}
          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center shrink-0 transition-all whitespace-nowrap ${
            activeTab === 'salary_recibos' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tLocal('tab_2_recibos')}
        </button>

        <button
          onClick={() => setActiveTab('cost')}
          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center shrink-0 transition-all whitespace-nowrap ${
            activeTab === 'cost' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tLocal('tab_3_cost')}
        </button>

        <button
          onClick={() => setActiveTab('housing_protection')}
          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center shrink-0 transition-all whitespace-nowrap ${
            activeTab === 'housing_protection' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tLocal('tab_4_housing')}
        </button>

        <button
          onClick={() => setActiveTab('aima_health')}
          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center shrink-0 transition-all whitespace-nowrap ${
            activeTab === 'aima_health' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tLocal('tab_5_aima')}
        </button>

        <button
          onClick={() => setActiveTab('small_business')}
          className={`px-3 sm:px-4 py-3 sm:py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center shrink-0 transition-all whitespace-nowrap ${
            activeTab === 'small_business' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {tLocal('tab_6_business')}
        </button>
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
                      Simulador de Salário Líquido (Trabalhador por Conta de Outrem / Contrato)
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Cálculo com tabelas oficiais de retenção na fonte de IRS (2026) & Segurança Social (11%)
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

                {/* IRS Jovem Section */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500 shrink-0" />
                      <div>
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          Regime IRS Jovem (Art. 12.º-B CIRS)
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          Isenção parcial de IRS nos primeiros 10 anos de trabalho (até 35 anos).
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
                        <div className="p-2 bg-white/70 rounded-xl">
                          <span className="block text-sm font-black text-amber-600">100%</span>
                          <span>1.º Ano</span>
                        </div>
                        <div className="p-2 bg-white/70 rounded-xl">
                          <span className="block text-sm font-black text-amber-600">75%</span>
                          <span>2.º Ano</span>
                        </div>
                        <div className="p-2 bg-white/70 rounded-xl">
                          <span className="block text-sm font-black text-amber-600">50%</span>
                          <span>3.º–4.º Anos</span>
                        </div>
                        <div className="p-2 bg-white/70 rounded-xl">
                          <span className="block text-sm font-black text-amber-600">25%</span>
                          <span>5.º–10.º Anos</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">
                          {tLocal('irs_jovem_year')}
                        </label>
                        <select
                          value={irsJovemYear}
                          onChange={(e) => setIrsJovemYear(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value={1}>{tLocal('year_1')} — 100% Isenção</option>
                          <option value={2}>{tLocal('year_2')} — 75% Isenção</option>
                          <option value={3}>{tLocal('years_3_4')} — 50% Isenção</option>
                          <option value={5}>{tLocal('years_5_10')} — 25% Isenção</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Results Display for Outrem */}
              {(() => {
                const res = calculateSalaryOutrem();
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">
                        Resultado do Cálculo
                      </h3>
                      <span className="text-[9px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        Taxa Efetiva de Imposto: {res.effectiveRate}%
                      </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Rendimento Líquido Mensal Disponível
                      </p>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        {res.netSalary.toLocaleString('pt', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                      </h1>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Descontos Oficiais & Retenções
                        </h4>
                      </div>

                      <div className="space-y-3 bg-white/5 border border-white/5 rounded-3xl p-5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">Segurança Social (11%)</span>
                          <span className="font-extrabold text-red-400">-{res.ssDeduction}€</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">Retenção de IRS (Tabela AT)</span>
                          <span className="font-extrabold text-red-400">-{res.irsDeduction}€</span>
                        </div>

                        <div className="border-t border-white/5 pt-3 space-y-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-slate-400">Subsídio Alimentação Isento</span>
                            <span className="font-bold text-emerald-400">+{res.mealExempt}€</span>
                          </div>
                          {res.mealTaxed > 0 && (
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-slate-400">Subsídio Alimentação Tributado</span>
                              <span className="font-bold text-red-400">+{res.mealTaxed}€</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed">
                        Cálculo efetuado com base na Segurança Social dos trabalhadores dependentes (11%) e nas Tabelas de Retenção na Fonte da Autoridade Tributária. O subsídio de alimentação é isento até 9,60€/dia em cartão ou 6,00€ em dinheiro.
                      </span>
                    </div>
                  </div>
                );
              })()}
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
                      Simulador de Recibos Verdes (Trabalhador Independente / Freelancer)
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Cálculo de Segurança Social (21,4% sobre 70% base) & Retenção na fonte de IRS por Categoria B
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
                          IRS Jovem (Art. 12.º-B CIRS) para Categoria B
                        </label>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          Aplicável a trabalhadores independentes até 35 anos com grau de ensino superior.
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
                        <option value={1}>{tLocal('year_1')} — 100% Isenção</option>
                        <option value={2}>{tLocal('year_2')} — 75% Isenção</option>
                        <option value={3}>{tLocal('years_3_4')} — 50% Isenção</option>
                        <option value={5}>{tLocal('years_5_10')} — 25% Isenção</option>
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
                        Resultado do Cálculo
                      </h3>
                      <span className="text-[9px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        Taxa Efetiva de Imposto: {res.effectiveRate}%
                      </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Rendimento Líquido Mensal Disponível (Recibos Verdes)
                      </p>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        {res.netSalary.toLocaleString('pt', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                      </h1>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Contribuições & Impostos Retidos
                        </h4>
                      </div>

                      <div className="space-y-3 bg-white/5 border border-white/5 rounded-3xl p-5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">Segurança Social (21,4% sobre 70% Base)</span>
                          <span className="font-extrabold text-red-400">-{res.ssDeduction}€</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-300">Retenção na Fonte de IRS</span>
                          <span className="font-extrabold text-red-400">-{res.irsDeduction}€</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed">
                        Os Recibos Verdes calculam a Segurança Social incidente sobre 70% da faturação bruta em serviços (ou 20% em vendas de produtos) com taxa de 21,4% (Trabalhador Independente) ou 25,2% (ENI).
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ════ TAB 2: COST OF LIVING ══════════════════════════════════ */}
          {activeTab === 'cost' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Controls Card */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <TrendingUp className="text-[#FF8C00] shrink-0" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {tLocal('tab_cost')}
                  </h3>
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
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                      >
                        {Object.keys(DISTRICT_COST_DATA).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                          {tLocal('compare_with')}
                        </label>
                        <button 
                          onClick={() => setIsComparing(!isComparing)}
                          className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-colors ${
                            isComparing 
                              ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' 
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                        >
                          {isComparing ? tLocal('active_comparison') : 'Off'}
                        </button>
                      </div>
                      <select
                        value={district2}
                        disabled={!isComparing}
                        onChange={(e) => setDistrict2(e.target.value)}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00] disabled:opacity-50"
                      >
                        {Object.keys(DISTRICT_COST_DATA).map(d => (
                          <option key={d} value={d} disabled={d === district1}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Selectors: Housing, Food, Transport */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('housing')}
                    </label>
                    <select
                      value={housingType}
                      onChange={(e) => setHousingType(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-755 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="shared_room">{tLocal('shared_room')}</option>
                      <option value="t1_apartment">{tLocal('t1_apartment')}</option>
                      <option value="t2_apartment">{tLocal('t2_apartment')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('food_style')}
                    </label>
                    <select
                      value={foodStyle}
                      onChange={(e) => setFoodStyle(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-755 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="cook_home">{tLocal('cook_home')}</option>
                      <option value="mixed">{tLocal('mixed')}</option>
                      <option value="eat_out">{tLocal('eat_out')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('transport')}
                    </label>
                    <select
                      value={transportOption}
                      onChange={(e) => setTransportOption(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-755 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="public_pass">{tLocal('public_pass')}</option>
                      <option value="own_car">{tLocal('own_car')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('utilities_leisure')}
                    </label>
                    <select
                      value={utilitiesTier}
                      onChange={(e) => setUtilitiesTier(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-755 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="utilities_basic">{tLocal('utilities_basic')}</option>
                      <option value="utilities_active">{tLocal('utilities_active')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('household_size')}
                    </label>
                    <select
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-755 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="1">1 {tLocal('person')}</option>
                      <option value="2">2 {tLocal('people')}</option>
                      <option value="3">3 {tLocal('people')}</option>
                      <option value="4">4 {tLocal('people')}</option>
                      <option value="5">5+ {tLocal('people')}</option>
                    </select>
                  </div>
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
                      Tier: {DISTRICT_COST_DATA[district1]?.tier}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
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
                    <div className="flex justify-between items-start text-slate-300">
                      <div className="flex flex-col">
                        <span>{tLocal('cost_utilities')}</span>
                        {householdSize > 1 && (
                          <span className="text-[9px] text-slate-400 font-bold">
                            {tLocal('utilities_per_person').replace('{val}', col1.utilitiesPerPerson.toString())}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-white">{col1.utilities}€</span>
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
                        Tier: {DISTRICT_COST_DATA[district2]?.tier}
                      </span>
                    </div>

                    <div className="space-y-3 pt-2 text-xs">
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
                      <div className="flex justify-between items-start text-slate-300">
                        <div className="flex flex-col">
                          <span>{tLocal('cost_utilities')}</span>
                          {householdSize > 1 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              {tLocal('utilities_per_person').replace('{val}', col2.utilitiesPerPerson.toString())}
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-white">{col2.utilities}€</span>
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
            </div>
          )}

          {/* ════ TAB 4: PROTEÇÃO À HABITAÇÃO (INDEPENDENTE) ═══════════════ */}
          {activeTab === 'housing_protection' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Form Card */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Home className="text-[#FF8C00] shrink-0" size={18} />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Indicadores de Proteção à Habitação (Banco de Portugal)
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Insira os seus dados de rendimento e custos de habitação para avaliar a taxa de esforço e liquidez
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      💰 Rendimento Líquido Mensal (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">O valor que recebe na conta após descontos de SS e IRS.</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={hpNetIncome}
                        onChange={(e) => setHpNetIncome(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      🏠 Renda / Prestação Mensal (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Valor pago mensalmente por habitação (arrendamento ou crédito).</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={hpMonthlyRent}
                        onChange={(e) => setHpMonthlyRent(Number(e.target.value))}
                        className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    🛒 Total de Despesas Mensais (€)
                  </label>
                  <p className="text-[8px] text-slate-400 font-medium">Renda + alimentação + transportes + serviços + outros gastos.</p>
                  <div className="relative">
                    <input
                      type="number"
                      value={hpTotalExpenses}
                      onChange={(e) => setHpTotalExpenses(Number(e.target.value))}
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">€</span>
                  </div>
                </div>
              </div>

              {/* Results Panel */}
              {(() => {
                const effortRate = hpNetIncome > 0 ? Math.round((hpMonthlyRent / hpNetIncome) * 100) : 0;
                const netSavings = Math.round(hpNetIncome - hpTotalExpenses);
                const emergencyFund = Math.round(hpTotalExpenses * 3);
                const setupCapital = Math.round(hpMonthlyRent * 3);
                const status = effortRate > 50 ? 'critical' : effortRate > 35 ? 'warning' : 'healthy';

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">Resultados do Diagnóstico</h3>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        status === 'healthy' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
                        status === 'warning' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
                        'border-red-500/40 bg-red-500/10 text-red-300'
                      }`}>
                        {status === 'healthy' ? '✓ Taxa de Esforço OK' : status === 'warning' ? '⚠️ Esforço Elevado' : '🔴 Risco Crítico'}
                      </span>
                    </div>

                    {/* Effort Rate Meter */}
                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-tight">Taxa de Esforço na Habitação</h4>
                          <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">
                            Rácio: Renda ÷ Rendimento Líquido &middot; Banco de Portugal recomenda máx. 35%
                          </p>
                        </div>
                        <span className={`text-3xl font-black ${
                          status === 'healthy' ? 'text-emerald-400' :
                          status === 'warning' ? 'text-amber-400' : 'text-red-400'
                        }`}>{effortRate}%</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            status === 'healthy' ? 'bg-emerald-500' :
                            status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, effortRate)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black text-slate-500">
                        <span>0%</span>
                        <span className="text-emerald-400">35% (Limite Máximo)</span>
                        <span className="text-red-400">50% (Crítico)</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Wallet size={14} className="text-emerald-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Mensal</span>
                        </div>
                        <h2 className={`text-2xl font-black tracking-tight ${netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {netSavings >= 0 ? `+${netSavings}€` : `${netSavings}€`}
                        </h2>
                        <p className="text-[8px] text-slate-400 font-medium">Rendimento − Total Despesas</p>
                      </div>

                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                        <div className="flex items-center gap-1.5">
                          <PiggyBank size={14} className="text-amber-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fundo Emergência</span>
                        </div>
                        <h2 className="text-2xl font-black text-amber-400 tracking-tight">{emergencyFund}€</h2>
                        <p className="text-[8px] text-slate-400 font-medium">3 meses de despesas totais</p>
                      </div>

                      <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-indigo-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Capital Entrada</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{setupCapital}€</h2>
                        <p className="text-[8px] text-indigo-300 font-medium">2 Cauções + 1 Renda Adiantada</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-[9px] text-slate-400 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed font-medium">
                        O Banco de Portugal recomenda que a taxa de esforço não ultrapasse <strong className="text-white">35% do rendimento líquido</strong> do agregado. O capital de entrada reflete a exigência legal standard em Portugal: <strong className="text-white">2 meses de caução + 1 mês adiantado</strong>.
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ════ TAB 5: DIAGNÓSTICO AIMA & SAÚDE FINANCEIRA (INDEPENDENTE) ══ */}
          {activeTab === 'aima_health' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* LEGAL SOURCE BANNER — Clean App Theme */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <HeartPulse size={18} className="text-[#FF8C00] shrink-0" />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Diagnóstico AIMA & Saúde Financeira 2026</h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Verifica se o seu rendimento cumpre os limiares mínimos exigidos para a Autorização de Residência em Portugal</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">📋</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">Portaria 1563/2007 de 11/12</span>
                  </div>
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">⚖️</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">Lei 23/2007 — Lei Estrangeiros</span>
                  </div>
                  <div className="px-3 py-2.5 bg-[#FF8C00]/10 border border-[#FF8C00]/20 rounded-xl text-[#FF8C00] flex items-center gap-2">
                    <span className="text-base shrink-0">💶</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">RMMG 2026: 920€ / mês</span>
                  </div>
                </div>
              </div>

              {/* Independent Inputs Form */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <UserCheck className="text-[#FF8C00] shrink-0" size={18} />
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Os Seus Dados de Rendimento</h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Preencha os campos com os seus valores reais para verificar o cumprimento AIMA</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      💰 Rendimento Líquido Mensal (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">O valor que recebe na conta após todos os descontos de SS e IRS.</p>
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
                      👨‍👩‍👧 Nº de Dependentes no Agregado
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Cônjuge sem rendimentos, filhos menores ou ascendentes a cargo.</p>
                    <select
                      value={aimaDependents}
                      onChange={(e) => setAimaDependents(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 0 ? '(Sem dependentes)' : n === 1 ? 'dependente' : 'dependentes'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      🏠 Renda Mensal (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Valor pago por mês pela habitação.</p>
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
                      🛒 Total de Despesas Mensais (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Inclui renda + alimentação + transportes + utilidades.</p>
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
                    🛡️ Nível de Contribuição Registado na Segurança Social (ISS)
                  </label>
                  <p className="text-[8px] text-slate-400 font-medium">O regime e valor que declara mensalmente no seu extrato da Segurança Social.</p>
                  <select
                    value={aimaSsMode}
                    onChange={(e) => setAimaSsMode(e.target.value as any)}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                  >
                    <option value="normal_outrem">Trabalhador por Conta de Outrem (Desconto integral 11% sobre Salário Bruto)</option>
                    <option value="normal_recibos">Recibos Verdes Geral (21,4% SS sobre 70% Faturação Real)</option>
                    <option value="reduced_25">Recibos Verdes com Opção de Redução de Base (-25%)</option>
                    <option value="min_20">⚠️ Contribuição Mínima Simbólica (20€ / mês)</option>
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
                      <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">Resultados do Diagnóstico AIMA</h3>
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
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Índice de Viabilidade AIMA</span>
                        <h4 className="text-base font-black uppercase text-white">
                          {score >= 80 ? '🟢 Excelente & Sustentável' : score >= 50 ? '🟡 Estável com Atenção' : '🔴 Risco de Notificação / Indeferimento'}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">
                          Retenção SS Estimada: <strong className="text-amber-300">{estimatedSsDeduction}€ / mês</strong> &middot; Taxa Esforço: <strong className="text-white">{effortRate}%</strong>
                        </p>
                      </div>
                    </div>

                    {/* ⚠️ PROMINENT AIMA SS RISK ALERT CARD */}
                    {isSsRisk && (
                      <div className="p-5 bg-red-500/15 border border-red-500/40 rounded-3xl space-y-2 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle size={18} className="shrink-0" />
                          <h4 className="text-xs font-black uppercase tracking-wider">
                            ⚠️ Alerta de Risco Grave AIMA: Discrepância na Segurança Social
                          </h4>
                        </div>
                        <p className="text-[10px] text-red-200 font-medium leading-relaxed">
                          <strong>Fundamento de Indeferimento (Art. 52.º da Lei 23/2007):</strong> A AIMA cruza os extratos de remuneração da Segurança Social (ISS) em tempo real. Declarar um rendimento de {aimaNetIncome}€ para cumprir o limiar de subsistência, mas contribuir apenas o mínimo simbólico (20€/mês) ou forçar a redução de -25%, gera uma <strong>incoerência fiscal grave</strong>. A AIMA presume ausência de rendimentos reais e emite <strong>Intenção de Indeferimento (Audiência Prévia)</strong>.
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
                              Verificação de Subsistência Legal AIMA
                            </h4>
                            <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                              Portaria 1563/2007 &middot; Art. 52.º Lei 23/2007 &middot; RMMG 2026 (920€)
                            </p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border shrink-0 ${
                          meetsReq && !isSsRisk ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}>
                          {meetsReq && !isSsRisk ? '✓ Cumpre Limiar Mínimo' : '⚠️ Atenção / Risco de Incoerência'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">Rendimento Líquido</span>
                          <span className="text-xl font-black text-white">{aimaNetIncome.toLocaleString('pt')}€</span>
                          <span className="text-[8px] text-slate-400 block">por mês</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">Limiar Mínimo AIMA</span>
                          <span className="text-xl font-black text-amber-300">{totalReq.toLocaleString('pt')}€</span>
                          <span className="text-[8px] text-slate-400 block">920€ + {aimaDependents}×276€</span>
                        </div>
                        <div className={`p-4 border rounded-2xl ${
                          meetsReq ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                        }`}>
                          <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">Diferença</span>
                          <span className={`text-xl font-black ${meetsReq ? 'text-emerald-400' : 'text-red-400'}`}>
                            {diff >= 0 ? '+' : ''}{diff}€
                          </span>
                          <span className="text-[8px] text-slate-400 block">{meetsReq ? 'acima do limiar' : 'abaixo do limiar'}</span>
                        </div>
                      </div>

                      <p className="text-[9px] text-slate-300 font-medium leading-relaxed pt-1">
                        📋 <strong className="text-white">Base Legal AIMA:</strong> Segundo a Portaria n.º 1563/2007 de 11 de Dezembro, os meios de subsistência exigidos para concessão e renovação de Autorização de Residência são calculados com base no Retribuição Mínima Mensal Garantida (RMMG 2026 = 920€): <strong className="text-amber-300">100% RMMG (920€) para o primeiro adulto</strong> + <strong className="text-amber-300">30% RMMG (276€) por cada dependente adicional</strong> (cônjuge sem rendimentos, filhos menores ou ascendentes a cargo).
                      </p>
                    </div>

                    {/* Breakdown Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Saldo Mensal Disponível</span>
                        <h2 className={`text-2xl font-black tracking-tight ${netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {netSavings >= 0 ? `+${netSavings}€` : `${netSavings}€`}
                        </h2>
                        <p className="text-[8px] text-slate-400 font-medium">Rendimento − Total Despesas</p>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Fundo Emergência (3 Meses)</span>
                        <h2 className="text-2xl font-black text-amber-400 tracking-tight">{emergencyFund}€</h2>
                        <p className="text-[8px] text-slate-400 font-medium">Recomendado para estabilidade</p>
                      </div>
                      <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">Capital Entrada Arrendamento</span>
                        <h2 className="text-2xl font-black text-white tracking-tight">{setupCapital}€</h2>
                        <p className="text-[8px] text-indigo-300 font-medium">2 Cauções + 1 Renda Adiantada</p>
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
                      Simulador para Pequenos Empreendedores & Microempresas
                    </h3>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Estimativa de rentabilidade, impostos (IRC 12,5% PME / IRS Simplificado) e liquidez para ENI e Sociedade Unipessoal Lda (2026)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">🏛️</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">IRC Reduzido PME: 12.5%</span>
                  </div>
                  <div className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-2">
                    <span className="text-base shrink-0">💼</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">Gerente MOE: TSU 33.05%</span>
                  </div>
                  <div className="px-3 py-2.5 bg-[#FF8C00]/10 border border-[#FF8C00]/20 rounded-xl text-[#FF8C00] flex items-center gap-2">
                    <span className="text-base shrink-0">📊</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">Break-Even Automático</span>
                  </div>
                </div>
              </div>

              {/* Inputs Form */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Coins className="text-[#FF8C00] shrink-0" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Dados Financeiros da Empresa / Negócio
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      💰 Faturação Mensal Bruta (Volume de Negócios) (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Total cobrado a clientes por mês (sem IVA).</p>
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
                      📦 Despesas Operacionais Mensais (€)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Renda de espaço, fornecedores, contabilista, licenças, utilidades.</p>
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
                      🏷️ Setor de Atividade
                    </label>
                    <select
                      value={bizSector}
                      onChange={(e) => setBizSector(e.target.value as any)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="services">Prestação de Serviços / Tecnologia (Coef. 0.75)</option>
                      <option value="commerce">Comércio / Lojas / Restauração (Coef. 0.15)</option>
                      <option value="hospitality">Alojamento Local / Turismo (Coef. 0.35)</option>
                      <option value="industry">Indústria / Oficina / Artesanato (Coef. 0.35)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      🏛️ Estrutura Jurídica da Empresa
                    </label>
                    <select
                      value={bizLegalStructure}
                      onChange={(e) => setBizLegalStructure(e.target.value as any)}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      <option value="unipessoal_lda">Sociedade Unipessoal Lda / Microempresa PME (IRC 12,5%)</option>
                      <option value="eni">Empresário em Nome Individual — ENI (IRS Simplificado)</option>
                    </select>
                  </div>
                </div>

                {bizLegalStructure === 'unipessoal_lda' && (
                  <div className="space-y-2 border-t border-slate-100 pt-4 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      👔 Pró-Labore / Salário do Gerente (€/mês)
                    </label>
                    <p className="text-[8px] text-slate-400 font-medium">Remuneração mensal fixa atribuída ao sócio-gerente (sujeita a TSU de 33,05%).</p>
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
                        Resultado Financeiro do Negócio
                      </h3>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                        Margem Líquida: {res.profitMargin}%
                      </span>
                    </div>

                    <div className="text-center space-y-2 py-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Lucro Líquido Mensal Disponível da Empresa
                      </p>
                      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        +{res.netProfit.toLocaleString('pt')}€
                      </h1>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        Faturação Mensal ({bizRevenue}€) − Despesas ({bizExpenses}€) − Impostos/SS ({res.totalTaxes}€)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black block">Lucro Bruto Operacional</span>
                        <span className="text-xl font-black text-white">+{res.grossProfit}€ / mês</span>
                        <span className="text-[8px] text-slate-400 block">Antes de impostos e SS</span>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black block">Impostos Estimados</span>
                        <span className="text-xl font-black text-red-400">-{res.taxAmount}€ / mês</span>
                        <span className="text-[8px] text-slate-400 block">{bizLegalStructure === 'unipessoal_lda' ? 'IRC 12,5% PME' : 'IRS Simplificado'}</span>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 uppercase font-black block">Segurança Social / TSU</span>
                        <span className="text-xl font-black text-amber-400">-{res.ssAmount}€ / mês</span>
                        <span className="text-[8px] text-slate-400 block">{bizLegalStructure === 'unipessoal_lda' ? 'TSU MOE (33,05%)' : 'SS ENI (25,2%)'}</span>
                      </div>
                    </div>

                    {/* Break-Even Indicator */}
                    <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                          Ponto de Equilíbrio (Break-Even Mensal)
                        </h4>
                        <p className="text-[9px] text-indigo-200 font-bold">
                          Faturação mínima necessária por mês para cobrir todas as despesas e impostos sem prejuízo
                        </p>
                      </div>
                      <span className="text-2xl font-black text-white shrink-0 ml-4">
                        {res.breakEven}€
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                      <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                      <span className="leading-relaxed">
                        Em Portugal, as PMEs qualificadas beneficiam de uma taxa reduzida de IRC de <strong className="text-white">12,5% sobre os primeiros 50.000€ de matéria coletável</strong> (Art. 87.º CIRC). Os gerentes de Sociedades Unipessoais descontam TSU de 33,05% (23,75% empresa + 9,3% gerente) sobre a remuneração fixada.
                      </span>
                    </div>
                  </div>
                );
              })()}
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
                <span>AT (IRS 2026)</span>
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <BarChart3 size={12} className="text-emerald-500 shrink-0" />
                <span>INE (Preços Rendas)</span>
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-sky-500 shrink-0" />
                <span>ISS (Seg. Social TI)</span>
              </div>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5">
                <Coins size={12} className="text-amber-500 shrink-0" />
                <span>Banco de Portugal</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
