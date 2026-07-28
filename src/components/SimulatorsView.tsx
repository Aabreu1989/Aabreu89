// src/components/SimulatorsView.tsx
import React, { useState } from 'react';
import { 
  ArrowLeft, Calculator, Coins, TrendingUp, Landmark, ShieldCheck, 
  MapPin, HelpCircle, AlertCircle, RefreshCw, BarChart3, Info, CheckCircle2, ExternalLink
} from 'lucide-react';
import { ViewType } from '../types';

interface SimulatorsViewProps {
  language: string;
  onViewChange: (view: ViewType) => void;
}

// ─── TRANSLATIONS DICTIONARY ────────────────────────────────────────────────
const translations: Record<string, Record<string, string>> = {
  PT: {
    title: 'Simuladores MIRA',
    subtitle: 'Calculadoras de Apoio ao Imigrante',
    tab_salary: 'Salário Líquido',
    tab_cost: 'Custo de Vida',
    gross_salary: 'Salário Bruto Mensal',
    family_status: 'Situação Familiar',
    single: 'Não Casado / Single',
    married_1: 'Casado (1 Titular)',
    married_2: 'Casado (2 Titulares)',
    dependents: 'Número de Dependentes',
    region: 'Região Fiscal',
    continent: 'Portugal Continental',
    madeira: 'Região Aut. da Madeira',
    azores: 'Região Aut. dos Açores',
    meal_allowance: 'Subsídio de Alimentação (Diário)',
    meal_type: 'Método de Pagamento',
    cash: 'Dinheiro / Transferência',
    card: 'Cartão de Refeição',
    work_days: 'Dias de Trabalho (Mês)',
    results: 'Resultados da Simulação',
    net_salary_total: 'Salário Líquido Mensal',
    deductions: 'Retenções e Contribuições',
    social_security: 'Segurança Social (11%)',
    irs: 'Retenção na Fonte (IRS)',
    meal_taxed: 'Alimentação Tributado',
    meal_exempt: 'Alimentação Isento',
    total_tax_load: 'Carga Fiscal Total',
    district: 'Distrito de Destino',
    housing: 'Tipo de Alojamento',
    shared_room: 'Quarto Partilhado',
    t1_apartment: 'Apartamento T1',
    t2_apartment: 'Apartamento T2',
    food_style: 'Estilo de Alimentação',
    cook_home: 'Cozinhar em Casa',
    mixed: 'Estilo Misto',
    eat_out: 'Comer Fora Frequentemente',
    transport: 'Transporte e Mobilidade',
    public_pass: 'Passe de Transportes Públicos',
    own_car: 'Carro Próprio (Combustível/Manut.)',
    utilities_leisure: 'Utilidades e Lazer',
    utilities_basic: 'Básico (Agua, Luz, Net, Gás)',
    utilities_active: 'Ativo (Utilidades + Jantares/Ocio)',
    monthly_budget: 'Orçamento Mensal Estimado',
    comparison: 'Comparador de Distritos',
    compare_with: 'Comparar com outro Distrito',
    no_compare: 'Nenhum (Visualização Única)',
    cost_housing: 'Alojamento (Renda)',
    cost_food: 'Alimentação',
    cost_transport: 'Transportes',
    cost_utilities: 'Utilidades e Extras',
    cost_total: 'Custo Total Estimado',
    savings_calc: 'Diferença Mensal Estimada',
    savings_text: 'Ao escolher {d1} em vez de {d2}, pode poupar cerca de {val}€ por mês!',
    note_title: 'Nota de Isenção de Responsabilidade',
    note_text: 'As tabelas e cálculos baseiam-se em estimativas e médias vigentes em 2026. Os valores de IRS dependem da tabela oficial de retenção na fonte. Não constitui aconselhamento financeiro oficial.',
    cap_notice: 'A isenção fiscal do subsídio de refeição é de até 6,00€/dia em dinheiro ou 9,60€/dia em cartão.',
    active_comparison: 'Comparação Ativa',
    housing_search_title: 'Verificar Custos Reais em Tempo Real',
    housing_search_sub: 'Pesquise quartos e apartamentos para arrendar nos portais oficiais de alojamento:',
    household_size: 'Agregado Familiar',
    person: 'Pessoa',
    people: 'Pessoas',
    utilities_per_person: 'Por pessoa: {val}€'
  },
  EN: {
    title: 'MIRA Simulators',
    subtitle: 'Immigrant Support Calculators',
    tab_salary: 'Net Salary',
    tab_cost: 'Cost of Living',
    gross_salary: 'Monthly Gross Salary',
    family_status: 'Family Status',
    single: 'Single / Unmarried',
    married_1: 'Married (1 Earner)',
    married_2: 'Married (2 Earners)',
    dependents: 'Number of Dependents',
    region: 'Tax Region',
    continent: 'Mainland Portugal',
    madeira: 'Madeira Aut. Region',
    azores: 'Azores Aut. Region',
    meal_allowance: 'Meal Allowance (Daily)',
    meal_type: 'Payment Method',
    cash: 'Cash / Transfer',
    card: 'Meal Card',
    work_days: 'Working Days (Month)',
    results: 'Simulation Results',
    net_salary_total: 'Monthly Net Salary',
    deductions: 'Taxes and Contributions',
    social_security: 'Social Security (11%)',
    irs: 'Withholding Tax (IRS)',
    meal_taxed: 'Taxed Meal Allowance',
    meal_exempt: 'Tax-Free Meal Allowance',
    total_tax_load: 'Total Tax Load',
    district: 'Target District',
    housing: 'Housing Type',
    shared_room: 'Shared Room',
    t1_apartment: 'T1 Apartment',
    t2_apartment: 'T2 Apartment',
    food_style: 'Food Style',
    cook_home: 'Cooking at Home',
    mixed: 'Mixed Style',
    eat_out: 'Eating Out Frequently',
    transport: 'Transport & Mobility',
    public_pass: 'Public Transport Pass',
    own_car: 'Car (Fuel/Maintenance)',
    utilities_leisure: 'Utilities & Leisure',
    utilities_basic: 'Basic (Water, Power, Net, Gas)',
    utilities_active: 'Active (Utilities + Dining/Leisure)',
    monthly_budget: 'Estimated Monthly Budget',
    comparison: 'District Comparison',
    compare_with: 'Compare with another District',
    no_compare: 'None (Single View)',
    cost_housing: 'Housing (Rent)',
    cost_food: 'Food',
    cost_transport: 'Transport',
    cost_utilities: 'Utilities & Extras',
    cost_total: 'Estimated Total Cost',
    savings_calc: 'Estimated Monthly Difference',
    savings_text: 'By choosing {d1} instead of {d2}, you could save about {val}€ per month!',
    note_title: 'Disclaimer Note',
    note_text: 'Tables and calculations are based on estimates and averages current in 2026. IRS values depend on official tax brackets. This does not constitute official financial advice.',
    cap_notice: 'The meal allowance tax exemption is up to €6.00/day in cash or €9.60/day via meal card.',
    active_comparison: 'Active Comparison',
    housing_search_title: 'Check Real Costs in Real-Time',
    housing_search_sub: 'Search for rooms and apartments to rent on the official accommodation portals:',
    household_size: 'Household Size',
    person: 'Person',
    people: 'People',
    utilities_per_person: 'Per person: {val}€'
  },
  ES: {
    title: 'Simuladores MIRA',
    subtitle: 'Calculadoras de Apoyo al Inmigrante',
    tab_salary: 'Salario Neto',
    tab_cost: 'Costo de Vida',
    gross_salary: 'Salario Bruto Mensal',
    family_status: 'Situación Familiar',
    single: 'Soltero / No Casado',
    married_1: 'Casado (1 Titular)',
    married_2: 'Casado (2 Titulares)',
    dependents: 'Número de Dependientes',
    region: 'Región Fiscal',
    continent: 'Portugal Continental',
    madeira: 'Región Aut. de Madeira',
    azores: 'Región Aut. de Azores',
    meal_allowance: 'Subsidio de Alimentación (Diario)',
    meal_type: 'Método de Pago',
    cash: 'Dinero / Transferencia',
    card: 'Tarjeta de Comida',
    work_days: 'Días de Trabajo (Mes)',
    results: 'Resultados de la Simulación',
    net_salary_total: 'Salario Neto Mensual',
    deductions: 'Retenciones y Contribuciones',
    social_security: 'Seguridad Social (11%)',
    irs: 'Retención de Impuestos (IRS)',
    meal_taxed: 'Subsidio de Comida Gravado',
    meal_exempt: 'Subsidio de Comida Exento',
    total_tax_load: 'Carga Fiscal Total',
    district: 'Distrito de Destino',
    housing: 'Tipo de Alojamiento',
    shared_room: 'Habitación Compartida',
    t1_apartment: 'Apartamento T1',
    t2_apartment: 'Apartamento T2',
    food_style: 'Estilo de Alimentación',
    cook_home: 'Cocinar en Casa',
    mixed: 'Estilo Mixto',
    eat_out: 'Comer Fuera Frecuentemente',
    transport: 'Transporte y Movilidad',
    public_pass: 'Abono de Transporte Público',
    own_car: 'Coche Propio (Gasolina/Mantenimiento)',
    utilities_leisure: 'Servicios y Ocio',
    utilities_basic: 'Básico (Agua, Luz, Internet, Gas)',
    utilities_active: 'Activo (Servicios + Cenas/Ocio)',
    monthly_budget: 'Presupuesto Mensual Estimado',
    comparison: 'Comparación de Distritos',
    compare_with: 'Comparar con otro Distrito',
    no_compare: 'Ninguno (Vista Única)',
    cost_housing: 'Alojamiento (Alquiler)',
    cost_food: 'Alimentación',
    cost_transport: 'Transportes',
    cost_utilities: 'Servicios y Extras',
    cost_total: 'Costo Total Estimado',
    savings_calc: 'Diferencia Mensual Estimada',
    savings_text: '¡Al elegir {d1} en lugar de {d2}, puede ahorrar cerca de {val}€ al mes!',
    note_title: 'Nota de Exención de Responsabilidad',
    note_text: 'Las tablas y cálculos se basan en estimaciones y promedios vigentes en 2026. Los valores del IRS dependen de las tablas oficiales de retención. No constituye asesoramiento financiero oficial.',
    cap_notice: 'La exención fiscal del subsidio de alimentación es de hasta 6,00€/dia en efectivo o 9,60€/dia en tarjeta.',
    active_comparison: 'Comparación Activa',
    housing_search_title: 'Verificar Costes Reales en Tiempo Real',
    housing_search_sub: 'Busque habitaciones y apartamentos en alquiler en los portales oficiales de alojamiento:',
    household_size: 'Miembros del Hogar',
    person: 'Persona',
    people: 'Personas',
    utilities_per_person: 'Por persona: {val}€'
  },
  FR: {
    title: 'Simulateurs MIRA',
    subtitle: 'Calculateurs d\'Aide à l\'Immigrant',
    tab_salary: 'Salaire Net',
    tab_cost: 'Coût de la Vie',
    gross_salary: 'Salaire Brut Mensuel',
    family_status: 'Situation Familiale',
    single: 'Célibataire / Non Marié',
    married_1: 'Marié (1 Titulaire)',
    married_2: 'Marié (2 Titulaires)',
    dependents: 'Nombre de Dépendants',
    region: 'Région Fiscale',
    continent: 'Portugal Continental',
    madeira: 'Région Aut. de Madère',
    azores: 'Région Aut. des Açores',
    meal_allowance: 'Indemnité de Repas (Journalière)',
    meal_type: 'Mode de Paiement',
    cash: 'Espèces / Virement',
    card: 'Carte Repas',
    work_days: 'Jours de Travail (Mois)',
    results: 'Résultats de la Simulation',
    net_salary_total: 'Salaire Net Mensuel',
    deductions: 'Retenues et Cotisations',
    social_security: 'Sécurité Sociale (11%)',
    irs: 'Retenue à la Source (IRS)',
    meal_taxed: 'Indemnité Repas Imposée',
    meal_exempt: 'Indemnité Repas Exonérée',
    total_tax_load: 'Charge Fiscale Totale',
    district: 'District de Destination',
    housing: 'Type de Logement',
    shared_room: 'Chambre Partagée',
    t1_apartment: 'Appartement T1',
    t2_apartment: 'Appartement T2',
    food_style: 'Style d\'Alimentation',
    cook_home: 'Cuisiner à la Maison',
    mixed: 'Style Mixte',
    eat_out: 'Manger Dehors Souvent',
    transport: 'Transport & Mobilité',
    public_pass: 'Abonnement Transport Commun',
    own_car: 'Voiture Propre (Carburant/Entretien)',
    utilities_leisure: 'Charges et Loisirs',
    utilities_basic: 'Basique (Eau, Électricité, Net, Gaz)',
    utilities_active: 'Actif (Charges + Dîners/Loisirs)',
    monthly_budget: 'Budget Mensuel Estimé',
    comparison: 'Comparateur de Districts',
    compare_with: 'Comparer avec un autre District',
    no_compare: 'Aucun (Vue Simple)',
    cost_housing: 'Logement (Loyer)',
    cost_food: 'Alimentation',
    cost_transport: 'Transports',
    cost_utilities: 'Charges & Extras',
    cost_total: 'Coût Total Estimé',
    savings_calc: 'Différence Mensuelle Estimée',
    savings_text: 'En choisissant {d1} au lieu de {d2}, vous pouvez économiser environ {val}€ par mois !',
    note_title: 'Clause de Non-Responsabilité',
    note_text: 'Les tableaux et calculs sont basés sur des estimations et des moyennes en vigueur en 2026. Les valeurs de l\'IRS dépendent des barèmes officiels. Ceci ne constitue pas un conseil financier officiel.',
    cap_notice: 'L\'exonération d\'impôt sur le panier-repas va jusqu\'à 6,00€/jour en espèces ou 9,60€/jour par carte-repas.',
    active_comparison: 'Comparaison Active',
    housing_search_title: 'Vérifier les Coûts Réels en Temps Réel',
    housing_search_sub: "Recherchez des chambres et appartements à louer sur les portails officiels d'hébergement :",
    household_size: 'Taille du Ménage',
    person: 'Personne',
    people: 'Personnes',
    utilities_per_person: 'Par personne : {val}€'
  }
};

// ─── DISTRICT COST DATA PROFILE ──────────────────────────────────────────────
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
  Faro: { rentRoom: 350, rentT1: 700, rentT2: 950, transportPass: 35, foodBase: 200, utilitiesBase: 90, tier: 'High' },
  Setúbal: { rentRoom: 320, rentT1: 650, rentT2: 900, transportPass: 40, foodBase: 200, utilitiesBase: 85, tier: 'High' },
  Braga: { rentRoom: 280, rentT1: 580, rentT2: 800, transportPass: 30, foodBase: 185, utilitiesBase: 80, tier: 'Medium' },
  Coimbra: { rentRoom: 260, rentT1: 520, rentT2: 750, transportPass: 30, foodBase: 180, utilitiesBase: 80, tier: 'Medium' },
  Aveiro: { rentRoom: 290, rentT1: 590, rentT2: 820, transportPass: 30, foodBase: 190, utilitiesBase: 80, tier: 'Medium' },
  Leiria: { rentRoom: 250, rentT1: 500, rentT2: 720, transportPass: 30, foodBase: 180, utilitiesBase: 75, tier: 'Medium' },
  Funchal: { rentRoom: 330, rentT1: 680, rentT2: 920, transportPass: 30, foodBase: 210, utilitiesBase: 85, tier: 'Medium' },
  'Ponta Delgada': { rentRoom: 270, rentT1: 530, rentT2: 760, transportPass: 30, foodBase: 195, utilitiesBase: 80, tier: 'Medium' },
  Bragança: { rentRoom: 180, rentT1: 360, rentT2: 480, transportPass: 24, foodBase: 160, utilitiesBase: 65, tier: 'Low' },
  Guarda: { rentRoom: 175, rentT1: 340, rentT2: 460, transportPass: 22, foodBase: 160, utilitiesBase: 65, tier: 'Low' },
  'Castelo Branco': { rentRoom: 190, rentT1: 380, rentT2: 500, transportPass: 25, foodBase: 165, utilitiesBase: 70, tier: 'Low' },
  Portalegre: { rentRoom: 170, rentT1: 330, rentT2: 450, transportPass: 20, foodBase: 155, utilitiesBase: 65, tier: 'Low' },
  Évora: { rentRoom: 230, rentT1: 450, rentT2: 650, transportPass: 28, foodBase: 175, utilitiesBase: 75, tier: 'Low' },
  Beja: { rentRoom: 200, rentT1: 390, rentT2: 550, transportPass: 25, foodBase: 165, utilitiesBase: 70, tier: 'Low' },
  'Vila Real': { rentRoom: 190, rentT1: 380, rentT2: 520, transportPass: 25, foodBase: 170, utilitiesBase: 70, tier: 'Low' },
  Viseu: { rentRoom: 210, rentT1: 430, rentT2: 600, transportPass: 28, foodBase: 175, utilitiesBase: 75, tier: 'Low' },
  'Viana do Castelo': { rentRoom: 220, rentT1: 440, rentT2: 620, transportPass: 28, foodBase: 175, utilitiesBase: 75, tier: 'Low' },
  Santarém: { rentRoom: 230, rentT1: 460, rentT2: 660, transportPass: 30, foodBase: 180, utilitiesBase: 75, tier: 'Low' }
};

export const SimulatorsView: React.FC<SimulatorsViewProps> = ({ language, onViewChange }) => {
  const [activeTab, setActiveTab] = useState<'salary' | 'cost'>('salary');
  const lang = ['PT', 'EN', 'ES', 'FR'].includes(language) ? language : 'PT';
  const tLocal = (key: string) => translations[lang][key] || key;

  // ─── SALARY SIMULATOR STATE ────────────────────────────────────────────────
  const [grossSalary, setGrossSalary] = useState<number>(1050);
  const [familyStatus, setFamilyStatus] = useState<string>('single');
  const [dependents, setDependents] = useState<number>(0);
  const [fiscalRegion, setFiscalRegion] = useState<string>('continent');
  const [mealAllowance, setMealAllowance] = useState<number>(7.63);
  const [mealType, setMealType] = useState<string>('card');
  const [workDays, setWorkDays] = useState<number>(22);

  // ─── COST OF LIVING STATE ──────────────────────────────────────────────────
  const [district1, setDistrict1] = useState<string>('Lisboa');
  const [district2, setDistrict2] = useState<string>('Bragança');
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [housingType, setHousingType] = useState<string>('t1_apartment');
  const [foodStyle, setFoodStyle] = useState<string>('mixed');
  const [transportOption, setTransportOption] = useState<string>('public_pass');
  const [utilitiesTier, setUtilitiesTier] = useState<string>('utilities_basic');
  const [householdSize, setHouseholdSize] = useState<number>(1);

  // ─── SALARY CALCULATION LOGIC ──────────────────────────────────────────────
  const calculateSalary = () => {
    const ssRate = 0.11; // Employee social security
    const ssDeduction = grossSalary * ssRate;

    // Simulated IRS brackets based on 2026 family status and dependents
    let baseIrsRate = 0.08; // default minimum
    if (grossSalary > 3000) baseIrsRate = 0.28;
    else if (grossSalary > 2000) baseIrsRate = 0.18;
    else if (grossSalary > 1500) baseIrsRate = 0.14;
    else if (grossSalary > 1000) baseIrsRate = 0.10;
    else if (grossSalary > 870) baseIrsRate = 0.07;
    else baseIrsRate = 0.00; // minimum wage threshold

    // Family and dependent rate reductions
    if (familyStatus === 'married_2') baseIrsRate = Math.max(0, baseIrsRate - 0.015);
    else if (familyStatus === 'married_1') baseIrsRate = Math.max(0, baseIrsRate - 0.005);
    
    // Deduct 0.75% per dependent
    baseIrsRate = Math.max(0, baseIrsRate - (dependents * 0.0075));

    // Fiscal region adjustment (Azores -30%, Madeira -20% tax reductions)
    if (fiscalRegion === 'azores') baseIrsRate = baseIrsRate * 0.7;
    else if (fiscalRegion === 'madeira') baseIrsRate = baseIrsRate * 0.8;

    const irsDeduction = grossSalary * baseIrsRate;

    // Meal Allowance calculations
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

    // Tax taxed meal allowance with Social Security and simulated IRS rate
    const mealSsDeduction = mealTaxed * ssRate;
    const mealIrsDeduction = mealTaxed * baseIrsRate;

    const totalDeductions = ssDeduction + irsDeduction + mealSsDeduction + mealIrsDeduction;
    const netSalary = (grossSalary + totalMealAllowance) - totalDeductions;

    return {
      netSalary: Math.round(netSalary * 100) / 100,
      ssDeduction: Math.round((ssDeduction + mealSsDeduction) * 100) / 100,
      irsDeduction: Math.round((irsDeduction + mealIrsDeduction) * 100) / 100,
      mealExempt: Math.round(mealExempt * 100) / 100,
      mealTaxed: Math.round(mealTaxed * 100) / 100,
      totalMeal: Math.round(totalMealAllowance * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      taxRate: Math.round(baseIrsRate * 1000) / 10
    };
  };

  const salaryResults = calculateSalary();

  // ─── COST OF LIVING CALCULATION LOGIC ──────────────────────────────────────
  const calculateCostOfLiving = (districtName: string) => {
    const profile = DISTRICT_COST_DATA[districtName] || DISTRICT_COST_DATA['Lisboa'];
    
    // Housing rent
    let housingCost = profile.rentT1;
    if (housingType === 'shared_room') housingCost = profile.rentRoom;
    else if (housingType === 't2_apartment') housingCost = profile.rentT2;

    // Food cost
    let foodCost = profile.foodBase;
    if (foodStyle === 'cook_home') foodCost = profile.foodBase * 0.85;
    else if (foodStyle === 'eat_out') foodCost = profile.foodBase * 1.8;

    // Transport cost
    let transportCost = profile.transportPass;
    if (transportOption === 'own_car') transportCost = 150; // Average fuel/maint

    // Utilities and Leisure cost
    let utilitiesCost = profile.utilitiesBase;
    
    // Scale utilities by household size (official and DECO estimates: 1p: 1.0x, 2p: 1.40x, 3p: 1.70x, 4p: 1.90x, 5p+: 2.15x)
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

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden font-['Plus_Jakarta_Sans']">
      
      {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-8">
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

        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
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
          className={`flex-1 py-4 text-xs font-black uppercase tracking-wider text-center transition-all ${
            activeTab === 'salary' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
          }`}
        >
          {tLocal('tab_salary')}
        </button>
        <button
          onClick={() => setActiveTab('cost')}
          className={`flex-1 py-4 text-xs font-black uppercase tracking-wider text-center transition-all ${
            activeTab === 'cost' 
              ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
          }`}
        >
          {tLocal('tab_cost')}
        </button>
      </div>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
        <div className="p-5 space-y-6 pb-32">

          {/* ════ TAB 1: SALARY SIMULATOR ════════════════════════════════ */}
          {activeTab === 'salary' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Form Card */}
              <div className="bg-white border border-slate-100 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Coins className="text-[#FF8C00] shrink-0" size={18} />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {tLocal('tab_salary')}
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

                <div className="grid grid-cols-2 gap-4">
                  {/* Select: Family Status */}
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

                  {/* Select: Dependents */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">
                      {tLocal('dependents')}
                    </label>
                    <select
                      value={dependents}
                      onChange={(e) => setDependents(Number(e.target.value))}
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF8C00]"
                    >
                      {[0, 1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Select: Region */}
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

                  {/* Input: Work Days */}
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

                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                  {/* Input: Meal Allowance */}
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

                  {/* Select: Meal Method */}
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

              {/* Results Display */}
              <div className="bg-slate-900 border border-slate-800 rounded-[2.25rem] p-6 text-white shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#FF8C00]">
                    {tLocal('results')}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    IRS: ~{salaryResults.taxRate}%
                  </span>
                </div>

                <div className="text-center space-y-2 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-450">
                    {tLocal('net_salary_total')}
                  </p>
                  <h1 className="text-4xl font-black text-white tracking-tight">
                    {salaryResults.netSalary.toLocaleString(lang, { minimumFractionDigits: 2 })}€
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
                    {/* SS Deduction row */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{tLocal('social_security')}</span>
                      <span className="font-extrabold text-red-400">-{salaryResults.ssDeduction}€</span>
                    </div>
                    {/* IRS Deduction row */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">{tLocal('irs')}</span>
                      <span className="font-extrabold text-red-400">-{salaryResults.irsDeduction}€</span>
                    </div>
                    {/* Meal details rows */}
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
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-white/5 border border-white/5 rounded-2xl p-4">
                  <Info size={14} className="shrink-0 mt-0.5 text-[#FF8C00]" />
                  <span className="leading-relaxed">
                    {tLocal('cap_notice')}
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
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
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
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
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
                          <span className="text-[9px] text-slate-500 font-bold">
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
                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/10">
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
                            <span className="text-[9px] text-slate-500 font-bold">
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

          {/* Disclaimer / Note Box */}
          <div className="bg-white border border-slate-100 rounded-[2.25rem] p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-400">
              <AlertCircle size={14} className="shrink-0" />
              <h4 className="text-[9px] font-black uppercase tracking-widest">
                {tLocal('note_title')}
              </h4>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              {tLocal('note_text')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
