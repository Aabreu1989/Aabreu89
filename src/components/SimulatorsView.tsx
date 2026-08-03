// src/components/SimulatorsView.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calculator, Coins, TrendingUp, Landmark, ShieldCheck, 
  MapPin, AlertTriangle, BarChart3, Info, CheckCircle2, 
  Wallet, HeartPulse, PiggyBank, Sparkles, Building2, UserCheck, Briefcase
} from 'lucide-react';
import { ViewType } from '../types';
import { analytics } from '../services/analyticsService';

interface SimulatorsViewProps {
  language: string;
  onViewChange: (view: ViewType) => void;
}

// ─── TRANSLATIONS DICTIONARY ────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  PT: {
    title: 'Simuladores MIRA Económicos',
    subtitle: 'Métricas e Indicadores Financeiros Oficiais (2026)',
    tab_salary: 'Salário Líquido',
    tab_cost: 'Custo de Vida',
    tab_health: 'Saúde Financeira',
    work_regime: 'Regime de Trabalho',
    conta_outrem: 'Trabalhador por Conta de Outrem (Contrato)',
    recibos_verdes: 'Recibos Verdes (Trabalhador Independente)',
    gross_salary: 'Salário Bruto Mensal',
    invoice_monthly: 'Faturação Mensal Ilíquida (Bruta)',
    activity_type: 'Tipo de Atividade',
    service_provision: 'Prestação de Serviços (70% Base SS / 25% IRS)',
    product_sales: 'Venda de Produtos / Restauração (20% Base SS / 11,5% IRS)',
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
    tab_salary: 'Net Income',
    tab_cost: 'Cost of Living',
    tab_health: 'Financial Health',
    work_regime: 'Work Regime',
    conta_outrem: 'Employed Staff (Contract)',
    recibos_verdes: 'Recibos Verdes (Freelancer / Independent)',
    gross_salary: 'Monthly Gross Salary',
    invoice_monthly: 'Monthly Gross Invoice Amount',
    activity_type: 'Activity Type',
    service_provision: 'Services Provision (70% SS Base / 25% Tax)',
    product_sales: 'Product Sales / Dining (20% SS Base / 11.5% Tax)',
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
    tab_salary: 'Salario Neto',
    tab_cost: 'Costo de Vida',
    tab_health: 'Salud Financiera',
    work_regime: 'Régimen de Trabajo',
    conta_outrem: 'Empleado por Cuenta Ajena (Contrato)',
    recibos_verdes: 'Recibos Verdes (Trabajador Autónomo)',
    gross_salary: 'Salario Bruto Mensual',
    invoice_monthly: 'Facturación Mensual Bruta',
    activity_type: 'Tipo de Actividad',
    service_provision: 'Prestación de Servicios (70% Base SS / 25% IRS)',
    product_sales: 'Venta de Productos / Hostelería (20% Base SS / 11,5% IRS)',
    scientific_activity: 'Actividades Científicas/Artísticas (70% Base SS / 16.5% IRS)',
    irs_withholding: 'Retención de Impuesto de la Renta (IRS)',
    irs_normal: 'Retención Normal IRS (Art. 101 CIRS)',
    irs_exempt_101b: 'Exención de Retención (Art. 101-B CIRS hasta 15.000€/año)',
    ss_regime: 'Régimen de Seguridad Social',
    ss_normal: 'Trabajador Autónomo General (21,4%)',
    ss_eni: 'Empresario Individual - ENI (25,2%)',
    ss_exempt_year1: 'Exención 1.er Año de Actividad (0%)',
    ss_variation: 'Ajuste Trimestral de Base (SS)',
    ss_var_0: 'Mantener Base Estándar (0%)',
    ss_var_minus25: 'Opción Reducir Base (-25%)',
    ss_var_plus25: 'Opción Aumentar Base (+25%)',
    family_status: 'Situación Familiar',
    single: 'Soltero / Divorciado',
    married_1: 'Casado (1 Titular)',
    married_2: 'Casado (2 Titulares)',
    dependents: 'Número de Dependientes',
    region: 'Región Fiscal',
    continent: 'Portugal Continental',
    madeira: 'Región Aut. de Madeira (-20% IRS)',
    azores: 'Región Aut. de Azores (-30% IRS)',
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
    social_security: 'Seguridad Social (TI 21.4% / 70% Base)',
    irs: 'Retención de Impuestos (IRS 2026)',
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
    own_car: 'Coche Propio (Gasolina + Mant.)',
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
    cost_total: 'Costo Total Estimado',
    savings_calc: 'Ahorro Mensual Estimado',
    savings_text: '¡Al elegir {d1} en lugar de {d2}, puede ahorrar cerca de {val}€ al mes!',
    note_title: 'Fuentes Oficiales Verificadas',
    note_text: 'Cálculos actualizados según las Tablas Oficiales de Retención de la Autoridad Tributaria (AT 2026), Código de la Seguridad Social (11%), Estadísticas del INE y Recomendaciones del Banco de Portugal.',
    cap_notice: 'La exención fiscal del subsidio de alimentación en 2026 es de hasta 6,00€/día en efectivo o 9,60€/día en tarjeta.',
    active_comparison: 'Comparación Activa',
    housing_search_title: 'Buscar Inmuebles en Portales Oficiales',
    housing_search_sub: 'Verifique ofertas en tiempo real en portales verificados:',
    household_size: 'Miembros del Hogar',
    person: 'Persona',
    people: 'Personas',
    utilities_per_person: 'Por persona: {val}€',

    effort_rate_title: 'Tasa de Esfuerzo en Vivienda',
    effort_rate_sub: 'Proporción del alquiler respecto al salario neto (Recomendación Banco de Portugal)',
    effort_healthy: 'Saludable (<= 35%)',
    effort_warning: 'Alerta / Esfuerzo Moderado (36% - 50%)',
    effort_critical: 'Riesgo Elevado (> 50%)',
    net_surplus: 'Margen Financiero Mensual',
    net_deficit: 'Déficit Mensual Estimado',
    setup_budget_title: 'Capital de Instalación Recomendado',
    setup_budget_sub: '2 Meses Alquiler + 1 Mes Fianza (Art. 1076 C. Civil) + 3 Meses Costos',
    emergency_fund_title: 'Fondo de Emergencia Recomendado',
    emergency_fund_sub: '3 Meses de costos de supervivencia según Banco de Portugal'
  },
  FR: {
    title: 'Simulateurs Économiques MIRA',
    subtitle: 'Indicateurs Financiers Officiels (2026)',
    tab_salary: 'Salaire Net',
    tab_cost: 'Coût de la Vie',
    tab_health: 'Santé Financière',
    work_regime: 'Régime de Travail',
    conta_outrem: 'Salarié (Contrat de Travail)',
    recibos_verdes: 'Recibos Verdes (Indépendant / Freelance)',
    gross_salary: 'Salaire Brut Mensuel',
    invoice_monthly: 'Facturation Mensuelle Brute',
    activity_type: 'Type d\'Activité',
    service_provision: 'Prestation de Services (70% Base SS / 25% Impôt)',
    product_sales: 'Vente de Produits / Restauration (20% Base SS / 11,5% Impôt)',
    scientific_activity: 'Activités Scientifiques/Artistiques (70% Base SS / 16.5% Impôt)',
    irs_withholding: 'Retenue à la Source (IRS)',
    irs_normal: 'Retenue Standard (Art. 101 CIRS)',
    irs_exempt_101b: 'Exonération (Art. 101-B CIRS jusqu\'à 15.000€/an)',
    ss_regime: 'Régime de Sécurité Sociale',
    ss_normal: 'Indépendant Général (21,4%)',
    ss_eni: 'Entreprise Individuelle - ENI (25,2%)',
    ss_exempt_year1: 'Exonération 1ère Année (0%)',
    ss_variation: 'Ajustement Trimestriel (SS)',
    ss_var_0: 'Conserver Base Standard (0%)',
    ss_var_minus25: 'Réduire la Base (-25%)',
    ss_var_plus25: 'Augmenter la Base (+25%)',
    family_status: 'Situation Familiale',
    single: 'Célibataire / Divorcé',
    married_1: 'Marié (1 Titulaire)',
    married_2: 'Marié (2 Titulaires)',
    dependents: 'Nombre de Dépendants',
    region: 'Région Fiscale',
    continent: 'Portugal Continental',
    madeira: 'Région Aut. de Madère (-20% IRS)',
    azores: 'Région Aut. des Açores (-30% IRS)',
    irs_jovem: 'Régime IRS Jovem (Art. 12-B CIRS)',
    irs_jovem_active: 'Appliquer Bénéfice IRS Jovem (18-35 Ans)',
    irs_jovem_year: 'Année du Bénéfice',
    year_1: '1ère Année (100% Exonération)',
    year_2: '2ème Année (75% Exonération)',
    years_3_4: '3ème à 4ème Année (50% Exonération)',
    years_5_10: '5ème à 10ème Année (25% Exonération)',
    meal_allowance: 'Indemnité Repas (Journalière)',
    meal_type: 'Mode de Paiement',
    cash: 'Espèces / Virement (Plafond 6,00€)',
    card: 'Carte Repas (Plafond 9,60€)',
    work_days: 'Jours de Travail (Mois)',
    results: 'Résultats de la Simulation',
    net_salary_total: 'Salaire Net Mensuel Estimé',
    net_income_recibos: 'Revenu Net Mensuel Disponible',
    deductions: 'Retenues et Cotisations Officielles',
    social_security: 'Sécurité Sociale (TI 21.4% / 70% Base)',
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
    public_pass: 'Abonnement Transport Commun',
    own_car: 'Voiture Propre (Carburant + Entretien)',
    utilities_leisure: 'Charges et Loisirs',
    utilities_basic: 'Basique (Eau, Électricité, Net, Gaz)',
    utilities_active: 'Actif (Charges + Loisirs/Restaurants)',
    monthly_budget: 'Budget Mensuel Estimé',
    comparison: 'Comparateur de Districts',
    compare_with: 'Comparer avec un autre District',
    no_compare: 'Aucun (Vue Simple)',
    cost_housing: 'Logement (Loyer Moyen INE)',
    cost_food: 'Alimentation',
    cost_transport: 'Transports',
    cost_utilities: 'Charges & Extras',
    cost_total: 'Coût Total Estimé',
    savings_calc: 'Économie Mensuelle Estimée',
    savings_text: 'En choisissant {d1} au lieu de {d2}, vous pouvez économiser environ {val}€ par mois !',
    note_title: 'Sources Officielles Vérifiées',
    note_text: 'Calculs mis à jour selon les Barèmes Officiels de l\'Autorité Fiscale (AT 2026), le Code de la Sécurité Sociale (11%), les Statistiques du INE et les Recommandations de la Banque du Portugal.',
    cap_notice: 'L\'exonération d\'impôt sur la prime de repas en 2026 va jusqu\'à 6,00€/jour en espèces ou 9,60€/jour par carte-repas.',
    active_comparison: 'Comparaison Active',
    housing_search_title: 'Rechercher des Logements sur les Portails Officiels',
    housing_search_sub: 'Consultez les offres en temps réel sur les portails immobiliers vérifiés :',
    household_size: 'Taille du Ménage',
    person: 'Personne',
    people: 'Personnes',
    utilities_per_person: 'Par personne : {val}€',

    effort_rate_title: 'Taux d\'Effort Logement',
    effort_rate_sub: 'Ratio loyer / salaire net (Recommandation Banque du Portugal)',
    effort_healthy: 'Sain (<= 35%)',
    effort_warning: 'Alerte / Effort Modéré (36% - 50%)',
    effort_critical: 'Risque Élevé (> 50%)',
    net_surplus: 'Marge Financière Mensuelle',
    net_deficit: 'Déficit Mensuel Estimé',
    setup_budget_title: 'Capital d\'Installation Recommandé',
    setup_budget_sub: '2 Mois Loyer + 1 Mois Caution (Art. 1076 C. Civil) + 3 Mois Coûts',
    emergency_fund_title: 'Fonds d\'Urgence Recommandé',
    emergency_fund_sub: '3 Mois de coûts de survie selon la Banque du Portugal'
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

export const SimulatorsView: React.FC<SimulatorsViewProps> = ({ language, onViewChange }) => {
  const [activeTab, setActiveTab] = useState<'salary' | 'cost' | 'health'>('salary');
  const lang = ['PT', 'EN', 'ES', 'FR'].includes(language) ? language : 'PT';
  const tLocal = (key: string) => translations[lang][key] || key;

  // ─── REGIME SELECTOR: CONTA OUTREM VS RECIBOS VERDES ─────────────────────
  const [salaryRegime, setSalaryRegime] = useState<'outrem' | 'recibos'>('outrem');

  useEffect(() => {
    let userId = 'guest';
    try {
      const currentUserStr = localStorage.getItem('mira_user');
      if (currentUserStr) {
        const u = JSON.parse(currentUserStr);
        if (u && u.id) userId = u.id;
      }
    } catch (e) {}
    const simName = activeTab === 'salary' 
      ? (salaryRegime === 'outrem' ? 'Simulador Salário Líquido (Recibos Verdes vs TI)' : 'Simulador IRS Jovem & Escalões')
      : activeTab === 'cost' ? 'Simulador Custo de Vida em Portugal' : 'Saúde Financeira & Taxa de Esforço';
    analytics.track('use_simulator', userId, 'Finanças & Impostos', { simulatorId: simName });
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

  // ─── RECIBOS VERDES SIMULATOR STATE ───────────────────────────────────────
  const [monthlyInvoice, setMonthlyInvoice] = useState<number>(1500);
  const [activityType, setActivityType] = useState<'services' | 'products' | 'scientific'>('services');
  const [irsWithholdingMode, setIrsWithholdingMode] = useState<'normal' | 'exempt_101b'>('normal');
  const [ssRegimeMode, setSsRegimeMode] = useState<'normal' | 'eni' | 'exempt_year1'>('normal');
  const [ssVariation, setSsVariation] = useState<number>(0);

  // ─── COST OF LIVING STATE ──────────────────────────────────────────────────
  const [district1, setDistrict1] = useState<string>('Lisboa');
  const [district2, setDistrict2] = useState<string>('Bragança');
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [housingType, setHousingType] = useState<string>('t1_apartment');
  const [foodStyle, setFoodStyle] = useState<string>('mixed');
  const [transportOption, setTransportOption] = useState<string>('public_pass');
  const [utilitiesTier, setUtilitiesTier] = useState<string>('utilities_basic');
  const [householdSize, setHouseholdSize] = useState<number>(1);

  // ─── CONTA DE OUTREM CALCULATION LOGIC ────────────────────────────────────
  const calculateSalaryOutrem = () => {
    const ssRate = 0.11;
    const ssDeduction = grossSalary * ssRate;

    let irsDeduction = 0;
    let baseIrsRate = 0;

    if (grossSalary > 870) {
      if (familyStatus === 'married_1') {
        let marginalRate = 0.09;
        let parcelaAbater = 78.30;
        let depDeduction = 34.29;

        if (grossSalary > 3200) { marginalRate = 0.34; parcelaAbater = 528.55; }
        else if (grossSalary > 2200) { marginalRate = 0.30; parcelaAbater = 400.55; }
        else if (grossSalary > 1600) { marginalRate = 0.25; parcelaAbater = 290.55; }
        else if (grossSalary > 1300) { marginalRate = 0.19; parcelaAbater = 194.55; }
        else if (grossSalary > 1050) { marginalRate = 0.145; parcelaAbater = 136.05; }
        
        irsDeduction = (grossSalary * marginalRate) - parcelaAbater - (dependents * depDeduction);
        baseIrsRate = marginalRate;
      } else {
        let marginalRate = 0.13;
        let parcelaAbater = 113.10;
        let depDeduction = 21.43;

        if (grossSalary > 11000) { marginalRate = 0.45; parcelaAbater = 1084.00; }
        else if (grossSalary > 5500) { marginalRate = 0.42; parcelaAbater = 754.00; }
        else if (grossSalary > 3500) { marginalRate = 0.355; parcelaAbater = 466.50; }
        else if (grossSalary > 2500) { marginalRate = 0.32; parcelaAbater = 379.00; }
        else if (grossSalary > 1800) { marginalRate = 0.25; parcelaAbater = 253.00; }
        else if (grossSalary > 1400) { marginalRate = 0.22; parcelaAbater = 211.00; }
        else if (grossSalary > 1150) { marginalRate = 0.165; parcelaAbater = 147.75; }
        else if (grossSalary > 990) { marginalRate = 0.165; parcelaAbater = 147.75; }
        
        irsDeduction = (grossSalary * marginalRate) - parcelaAbater - (dependents * depDeduction);
        baseIrsRate = marginalRate;
      }
    }

    if (fiscalRegion === 'azores') {
      irsDeduction = irsDeduction * 0.7;
    } else if (fiscalRegion === 'madeira') {
      irsDeduction = irsDeduction * 0.8;
    }

    if (isIrsJovem && irsJovemYear >= 1 && irsJovemYear <= 10) {
      let exemptionPct = 0.25;
      if (irsJovemYear === 1) exemptionPct = 1.0;
      else if (irsJovemYear === 2) exemptionPct = 0.75;
      else if (irsJovemYear <= 4) exemptionPct = 0.50;

      irsDeduction = irsDeduction * (1 - exemptionPct);
    }

    irsDeduction = Math.max(0, irsDeduction);

    const capExempt = mealType === 'card' ? 9.60 : 6.00;
    const totalMealAllowance = mealAllowance * workDays;
    
    let mealExempt = 0;
    let mealTaxed = 0;

    if (mealAllowance <= capExempt) {
      mealExempt = totalMealAllowance;
    } else {
      mealExempt = capExempt * workDays;
      mealTaxed = (mealAllowance - capExempt) * workDays;
    }

    const mealSsDeduction = mealTaxed * ssRate;
    const mealIrsDeduction = mealTaxed * (grossSalary > 0 ? (irsDeduction / grossSalary) : 0);

    const totalDeductions = ssDeduction + irsDeduction + mealSsDeduction + mealIrsDeduction;
    const netSalary = (grossSalary + totalMealAllowance) - totalDeductions;
    const effectiveRate = grossSalary > 0 ? ((irsDeduction + ssDeduction) / grossSalary) * 100 : 0;

    return {
      netSalary: Math.round(netSalary * 100) / 100,
      ssDeduction: Math.round((ssDeduction + mealSsDeduction) * 100) / 100,
      irsDeduction: Math.round((irsDeduction + mealIrsDeduction) * 100) / 100,
      mealExempt: Math.round(mealExempt * 100) / 100,
      mealTaxed: Math.round(mealTaxed * 100) / 100,
      totalMeal: Math.round(totalMealAllowance * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 10) / 10,
      marginalRate: Math.round(baseIrsRate * 100)
    };
  };

  // ─── RECIBOS VERDES CALCULATION LOGIC ────────────────────────────────────
  const calculateSalaryRecibos = () => {
    const ssIncidenceRate = activityType === 'products' ? 0.20 : 0.70;
    const rawSsBase = monthlyInvoice * ssIncidenceRate;
    
    const adjustedSsBase = rawSsBase * (1 + ssVariation);
    let ssTaxRate = ssRegimeMode === 'eni' ? 0.252 : 0.214;
    
    let ssContribution = 0;
    if (ssRegimeMode !== 'exempt_year1') {
      ssContribution = adjustedSsBase * ssTaxRate;
      if (monthlyInvoice > 0) {
        ssContribution = Math.max(20.0, ssContribution);
      }
    }

    let irsRate = 0.25;
    if (activityType === 'products') irsRate = 0.115;
    else if (activityType === 'scientific') irsRate = 0.165;

    let irsDeduction = 0;
    if (irsWithholdingMode === 'normal') {
      irsDeduction = monthlyInvoice * irsRate;
      
      if (fiscalRegion === 'azores') irsDeduction *= 0.7;
      else if (fiscalRegion === 'madeira') irsDeduction *= 0.8;

      if (isIrsJovem && irsJovemYear >= 1 && irsJovemYear <= 10) {
        let exemptionPct = 0.25;
        if (irsJovemYear === 1) exemptionPct = 1.0;
        else if (irsJovemYear === 2) exemptionPct = 0.75;
        else if (irsJovemYear <= 4) exemptionPct = 0.50;
        
        irsDeduction = irsDeduction * (1 - exemptionPct);
      }
    }

    irsDeduction = Math.max(0, irsDeduction);
    const totalDeductions = ssContribution + irsDeduction;
    const netIncome = monthlyInvoice - totalDeductions;
    const effectiveRate = monthlyInvoice > 0 ? (totalDeductions / monthlyInvoice) * 100 : 0;

    return {
      netSalary: Math.round(netIncome * 100) / 100,
      ssDeduction: Math.round(ssContribution * 100) / 100,
      irsDeduction: Math.round(irsDeduction * 100) / 100,
      mealExempt: 0,
      mealTaxed: 0,
      totalMeal: 0,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 10) / 10,
      marginalRate: Math.round(irsRate * 100)
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

    // Requisito Legal AIMA 2026 (Subsistência): 870€ titular + 261€ por dependente (30%)
    const baseSubsistence = 870;
    const extraDependents = Math.max(0, householdSize - 1) * 261;
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

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden font-['Plus_Jakarta_Sans']">
      
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
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight">
            {tLocal('title')}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {tLocal('subtitle')}
          </p>
        </div>
      </div>

      {/* ── TAB BAR ────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-white relative z-10">
        <button
          onClick={() => setActiveTab('salary')}
          className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider text-center transition-all ${
            activeTab === 'salary' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
          }`}
        >
          {tLocal('tab_salary')}
        </button>
        <button
          onClick={() => setActiveTab('cost')}
          className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider text-center transition-all ${
            activeTab === 'cost' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
          }`}
        >
          {tLocal('tab_cost')}
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-wider text-center transition-all ${
            activeTab === 'health' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
          }`}
        >
          {tLocal('tab_health')}
        </button>
      </div>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
        <div className="p-4 md:p-6 space-y-6 pb-32">

          {/* ════ TAB 1: SALARY SIMULATOR ════════════════════════════════ */}
          {activeTab === 'salary' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Regime Selector: Conta de Outrem vs Recibos Verdes */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-2 shadow-sm flex items-center gap-2">
                <button
                  onClick={() => setSalaryRegime('outrem')}
                  className={`flex-1 py-3 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    salaryRegime === 'outrem'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck size={16} className={salaryRegime === 'outrem' ? 'text-[#FF8C00]' : 'text-slate-400'} />
                  <span>{tLocal('conta_outrem')}</span>
                </button>

                <button
                  onClick={() => setSalaryRegime('recibos')}
                  className={`flex-1 py-3 px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    salaryRegime === 'recibos'
                      ? 'bg-[#FF8C00] text-white shadow-md'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Briefcase size={16} className="text-white" />
                  <span>{tLocal('recibos_verdes')}</span>
                </button>
              </div>

              {/* Form Card for CONTA DE OUTREM */}
              {salaryRegime === 'outrem' && (
                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Coins className="text-[#FF8C00] shrink-0" size={18} />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {tLocal('conta_outrem')}
                    </h3>
                  </div>

                  {/* Input: Gross Salary */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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

                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500 shrink-0" />
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          {tLocal('irs_jovem')}
                        </label>
                      </div>
                      <input
                        type="checkbox"
                        checked={isIrsJovem}
                        onChange={(e) => setIsIrsJovem(e.target.checked)}
                        className="w-5 h-5 accent-[#FF8C00] rounded cursor-pointer"
                      />
                    </div>

                    {isIrsJovem && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 animate-in fade-in duration-300">
                        <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">
                          {tLocal('irs_jovem_year')}
                        </label>
                        <select
                          value={irsJovemYear}
                          onChange={(e) => setIrsJovemYear(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value={1}>{tLocal('year_1')}</option>
                          <option value={2}>{tLocal('year_2')}</option>
                          <option value={3}>{tLocal('years_3_4')}</option>
                          <option value={5}>{tLocal('years_5_10')}</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
              )}

              {/* Form Card for RECIBOS VERDES */}
              {salaryRegime === 'recibos' && (
                <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Briefcase className="text-[#FF8C00] shrink-0" size={18} />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {tLocal('recibos_verdes')}
                    </h3>
                  </div>

                  {/* Input: Monthly Invoice */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                    {/* Select: IRS Withholding Mode */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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

                    {/* Select: Fiscal Region */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    {/* Select: SS Regime */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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

                    {/* Select: SS Base Adjustment */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
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
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                          {tLocal('irs_jovem')}
                        </label>
                      </div>
                      <input
                        type="checkbox"
                        checked={isIrsJovem}
                        onChange={(e) => setIsIrsJovem(e.target.checked)}
                        className="w-5 h-5 accent-[#FF8C00] rounded cursor-pointer"
                      />
                    </div>

                    {isIrsJovem && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 animate-in fade-in duration-300">
                        <label className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">
                          {tLocal('irs_jovem_year')}
                        </label>
                        <select
                          value={irsJovemYear}
                          onChange={(e) => setIrsJovemYear(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                        >
                          <option value={1}>{tLocal('year_1')}</option>
                          <option value={2}>{tLocal('year_2')}</option>
                          <option value={3}>{tLocal('years_3_4')}</option>
                          <option value={5}>{tLocal('years_5_10')}</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Display */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">
                    {tLocal('results')}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                    {tLocal('effective_rate')}: {salaryResults.effectiveRate}%
                  </span>
                </div>

                <div className="text-center space-y-2 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {salaryRegime === 'outrem' ? tLocal('net_salary_total') : tLocal('net_income_recibos')}
                  </p>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                    {salaryResults.netSalary.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                  </h1>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF8C00]" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {tLocal('deductions')}
                    </h4>
                  </div>

                  <div className="space-y-3 bg-white/5 border border-white/5 rounded-3xl p-5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{tLocal('social_security')}</span>
                      <span className="font-extrabold text-red-400">-{salaryResults.ssDeduction}€</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{tLocal('irs')}</span>
                      <span className="font-extrabold text-red-400">-{salaryResults.irsDeduction}€</span>
                    </div>

                    {salaryRegime === 'outrem' && (
                      <div className="border-t border-white/5 pt-3 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-400">{tLocal('meal_exempt')}</span>
                          <span className="font-bold text-emerald-400">+{salaryResults.mealExempt}€</span>
                        </div>
                        {salaryResults.mealTaxed > 0 && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-slate-400">{tLocal('meal_taxed')}</span>
                            <span className="font-bold text-red-400">+{salaryResults.mealTaxed}€</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-slate-300 bg-white/5 border border-white/5 rounded-2xl p-4">
                  <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                  <span className="leading-relaxed">
                    {salaryRegime === 'outrem' ? tLocal('cap_notice') : 'Os Recibos Verdes calculam a Segurança Social sobre 70% da faturação de serviços (ou 20% vendas) com taxa de 21,4% (TI) ou 25,2% (ENI).'}
                  </span>
                </div>
              </div>
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

          {/* ════ TAB 3: FINANCIAL HEALTH & INSIGHTS ════════════════════ */}
          {activeTab === 'health' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Financial Health Score Hero */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={18} className="text-[#FF8C00]" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                      Diagnóstico de Saúde Financeira (Portugal 2026)
                    </h3>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-[#FF8C00]">
                    Distrito: {district1}
                  </span>
                </div>

                {/* Score Circular Gauge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-gradient-to-br from-white/5 via-slate-800/40 to-white/5 border border-white/10 rounded-3xl">
                  <div className="flex items-center gap-5">
                    <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center font-black text-3xl shadow-2xl shrink-0 ${
                      finHealth.score >= 80 ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 shadow-emerald-500/20' :
                      finHealth.score >= 50 ? 'border-amber-400 text-amber-400 bg-amber-500/10 shadow-amber-500/20' :
                      'border-red-400 text-red-400 bg-red-500/10 shadow-red-500/20'
                    }`}>
                      {finHealth.score}
                      <span className="text-xs text-slate-400 font-bold ml-0.5">/100</span>
                    </div>

                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                        ÍNDICE GLOBAL DE SAÚDE FINANCIAL
                      </span>
                      <h4 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
                        {finHealth.score >= 80 ? '🟢 Excelente & Sustentável' :
                         finHealth.score >= 50 ? '🟡 Estável com Atenção' :
                         '🔴 Risco Financeiro Elevado'}
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium mt-1 leading-snug max-w-sm">
                        {finHealth.score >= 80 ? 'O seu rendimento cobre perfeitamente as despesas locais e garante margem para poupança.' :
                         finHealth.score >= 50 ? 'A sua taxa de esforço com habitação exige prudência. Considere alternativas de custo no distrito.' :
                         'A renda compromete mais de 50% do seu rendimento. Risco elevado de défice mensal.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 🔍 TRANSPARENCY CARD: DE ONDE VÊM OS NOSSOS DADOS? */}
                <div className="p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-indigo-400 shrink-0" />
                    <h4 className="text-xs font-black text-indigo-200 uppercase tracking-wider">
                      De onde vêm estas informações? (Transparência Oficial)
                    </h4>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                    Todos os cálculos e simulações do MIRA baseiam-se estritamente em indicadores oficiais das instituições portuguesas para 2026:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-2.5">
                      <Wallet size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Rendimento Líquido ({salaryResults.netSalary}€)</span>
                        <p className="text-[9px] text-slate-300 leading-tight">Tabelas Oficiais da AT (IRS 2026) & Código Contributivo SS (11% Outrem / TI 21.4%).</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-2.5">
                      <Building2 size={15} className="text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest block">Habitação ({col1.housing}€)</span>
                        <p className="text-[9px] text-slate-300 leading-tight">Estatísticas Oficiais do INE (Instituto Nacional de Estatística 2026) para {district1}.</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-2.5">
                      <Coins size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block">Alimentação & Cesta Básica ({col1.food}€)</span>
                        <p className="text-[9px] text-slate-300 leading-tight">Barómetro de Consumo DECO PROTESTE / PORDATA 2026 ({householdSize} pessoas).</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-2.5">
                      <Landmark size={15} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Utilidades & Tarifários ({col1.utilities}€)</span>
                        <p className="text-[9px] text-slate-300 leading-tight">Médias de Tarifários ERSE (Eletricidade/Gás) e ANACOM (Telecomunicações).</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🛂 AIMA SUBSISTENCE REQUIREMENT COMPLIANCE CARD */}
                <div className={`p-5 rounded-3xl border ${
                  finHealth.meetsAimaReq
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                } space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className={finHealth.meetsAimaReq ? 'text-emerald-400' : 'text-amber-400'} />
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Requisito de Subsistência Legal AIMA (2026)
                      </h4>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                      finHealth.meetsAimaReq ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`}>
                      {finHealth.meetsAimaReq ? 'Aprovado / Cumpres o Mínimo' : 'Abaixo do Limiar'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black block">O Teu Rendimento Líquido</span>
                      <span className="text-xl font-black text-white">{salaryResults.netSalary}€ / mês</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black block">Limiar Mínimo Exigido AIMA</span>
                      <span className="text-xl font-black text-white">{finHealth.totalAimaRequirement}€ / mês</span>
                      <p className="text-[8px] text-slate-400 font-bold mt-0.5">
                        (870€ Salário Mínimo + 261€ por cada dependente)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Housing Effort Rate Card */}
                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-white uppercase tracking-tight">
                        {tLocal('effort_rate_title')}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold leading-tight">
                        {tLocal('effort_rate_sub')}
                      </p>
                    </div>
                    <span className={`text-xl font-black ${
                      finHealth.status === 'healthy' ? 'text-emerald-400' :
                      finHealth.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {finHealth.effortRate}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        finHealth.status === 'healthy' ? 'bg-emerald-500' :
                        finHealth.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, finHealth.effortRate)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[10px] font-black uppercase">
                    {finHealth.status === 'healthy' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> {tLocal('effort_healthy')}
                      </span>
                    )}
                    {finHealth.status === 'warning' && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={13} /> {tLocal('effort_warning')}
                      </span>
                    )}
                    {finHealth.status === 'critical' && (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertTriangle size={13} /> {tLocal('effort_critical')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Net Savings Surplus / Deficit & Emergency Fund */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Wallet size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {finHealth.netSavings >= 0 ? tLocal('net_surplus') : tLocal('net_deficit')}
                      </span>
                    </div>
                    <h2 className={`text-2xl font-black tracking-tight ${finHealth.netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {finHealth.netSavings >= 0 ? `+${finHealth.netSavings}€` : `${finHealth.netSavings}€`}
                    </h2>
                  </div>

                  <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <PiggyBank size={14} className="text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {tLocal('emergency_fund_title')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-amber-400 tracking-tight">
                      {finHealth.emergencyFund}€
                    </h2>
                  </div>
                </div>

                {/* Setup Capital Card */}
                <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-400" />
                    <h4 className="text-xs font-black text-indigo-300 uppercase tracking-wide">
                      {tLocal('setup_budget_title')}
                    </h4>
                  </div>
                  <p className="text-[9px] text-indigo-200 font-bold leading-snug">
                    {tLocal('setup_budget_sub')}
                  </p>
                  <h3 className="text-2xl font-black text-white pt-1">
                    {finHealth.setupCapital}€
                  </h3>
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
