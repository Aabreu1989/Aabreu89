/**
 * 🏛️ MIRA COST OF LIVING ENGINE (U-COST-01 — ESPECIFICAÇÃO CANÓNICA 2026)
 * 
 * ⚠️ REGRA FUNDAMENTAL DE GOVERNANÇA MIRA:
 * Este motor calcula estimativas de custo de vida e indicadores de suficiência financeira MIRA.
 * NÃO determina elegibilidade migratória nem substitui a apreciação jurídica da AIMA ou autoridade competente.
 * 
 * Separação Arquitetural Soberana:
 * MIRA Financial Sufficiency ≠ Portaria General Subsistence Reference ≠ Specific Visa Eligibility ≠ AIMA Final Decision
 */

// ─── TIPOS E INTERFACES DE PROVENIÊNCIA DE DADOS ───────────────────────────
export type ProvenanceSourceType = 
  | 'official_statistic' 
  | 'official_tariff' 
  | 'market_benchmark' 
  | 'derived_estimate';

export interface DataProvenanceMetadata {
  sourceType: ProvenanceSourceType;
  sourceName: string;
  referenceDate: string;
  methodology: string;
  confidence: 'high' | 'medium' | 'low';
}

// ─── TIPOLOGIAS E OPÇÕES DE SIMULAÇÃO ──────────────────────────────────────
export type HousingType = 'room' | 't0' | 't1' | 't2' | 't3';
export type FoodStyle = 'cook_home' | 'balanced' | 'eat_out';
export type TransportOption = 'public_pass' | 'own_car' | 'rail_pass';

export interface CostProfile {
  rentRoom: number;
  rentT0: number;
  rentT1: number;
  rentT2: number;
  rentT3: number;
  transportPass: number;
  foodBase: number;
  utilitiesBase: number;
  tier: 'High' | 'Medium' | 'Low';
  provenance: {
    housing: DataProvenanceMetadata;
    transport: DataProvenanceMetadata;
    food: DataProvenanceMetadata;
    utilities: DataProvenanceMetadata;
  };
}

// ─── ESTRUTURA DEMOGRÁFICA DO AGREGADO FAMILIAR ────────────────────────────
// Retificação 1: Segregação etária estrita para conciliar OCDE (<14) com Portaria 1563/2007 (<18)
export interface HouseholdDemographics {
  adultsCount: number;         // Idade >= 18 anos (mínimo 1)
  youth14To17Count?: number;   // Idade 14 a 17 anos (OCDE = 0.5 | Jurídico Portaria = 0.3)
  childrenUnder14Count?: number; // Idade < 14 anos (OCDE = 0.3 | Jurídico Portaria = 0.3)
  // Para retrocompatibilidade de UI caso fornecido childrenCount agregado:
  childrenCount?: number;
}

export interface CostOfLivingInput {
  destinationDistrict: string;
  comparisonDistrict?: string;
  housingType: HousingType;
  foodStyle: FoodStyle;
  transportOption: TransportOption;
  demographics: HouseholdDemographics;
  transportUsersCount?: number; // Adultos que necessitam de transporte pago (jovens sub-23 têm passe gratuito)
  netMonthlyIncome?: number;    // Para cálculo de Taxa de Esforço e Poupança MIRA
}

// ─── RESULTADOS ESTRUTURADOS DE CUSTO DE VIDA ──────────────────────────────
export interface DistrictCostBreakdown {
  district: string;
  tier: 'High' | 'Medium' | 'Low';
  housing: number;
  food: number;
  transport: number;
  utilities: number;
  telecom: number;
  healthAndPersonal: number;
  totalMonthlyCost: number;
  provenanceSummary: Record<string, DataProvenanceMetadata>;
}

export interface FinancialSufficiencyMetrics {
  netMonthlyIncome: number;
  effortRateHousingPct: number;
  effortRateStatus: 'sustainable' | 'moderate_risk' | 'critical';
  netMonthlySavings: number;
  emergencyFund3Months: number;
  emergencyFund6Months: number;
  isDeficit: boolean;
}

export interface LegalSubsistenceReference {
  rmmg2026: number;
  calculatedReference: number;
  totalHouseholdMembers: number;
  formulaDescription: string;
  disclaimer: string;
}

export interface CostOfLivingAssessment {
  destination: DistrictCostBreakdown;
  comparison?: DistrictCostBreakdown;
  differenceBetweenDistricts?: {
    cheaperDistrict: string;
    expensiveDistrict: string;
    monthlySavingsDiff: number;
  };
  familyScaleFactors: {
    ocdeScaleFactor: number; // Aplicado exclusivamente a Alimentação e Utilidades
    legalDependentsCount: number; // Dependentes < 18 anos para referência da Portaria
  };
  financialSufficiency?: FinancialSufficiencyMetrics;
  legalSubsistenceReference?: LegalSubsistenceReference;
}

// ─── CONSTANTES CANÓNICAS 2026 ─────────────────────────────────────────────
export const RMMG_2026 = 920.00; // Decreto-Lei n.º 139/2025 (Salário Mínimo Nacional 2026)
export const RAIL_PASS_COST_2026 = 20.00; // Passe Ferroviário Verde CP (Decreto-Lei)
export const OWN_CAR_MONTHLY_BENCHMARK = 240.00; // Benchmark MIRA (combustível médio, seguros, IUC, amortização)
export const TELECOM_FIXED_HOUSEHOLD = 30.00; // Benchmark MIRA fibra/móvel base agregado

export const PROVENANCE_METADATA_DEFAULTS = {
  HOUSING_DERIVED: {
    sourceType: 'derived_estimate' as ProvenanceSourceType,
    sourceName: 'Benchmark de Mercado Derivado MIRA (INE m² novos contratos + portais)',
    referenceDate: '2026-Q1',
    methodology: 'Cruzamento das medianas de €/m² do INE por concelho com áreas tipificadas e oferta observada',
    confidence: 'medium' as const,
  },
  TRANSPORT_OFFICIAL: {
    sourceType: 'official_tariff' as ProvenanceSourceType,
    sourceName: 'Tarifários Oficiais de Transportes (AML Navegante / AMP Andante / CP Verde)',
    referenceDate: '2026-01',
    methodology: 'Tarifas públicas metropolitanas e gratuitidade sub-23 em vigor',
    confidence: 'high' as const,
  },
  MARKET_PARAMETRIC: {
    sourceType: 'market_benchmark' as ProvenanceSourceType,
    sourceName: 'Benchmark de Mercado MIRA 2026',
    referenceDate: '2026-Q1',
    methodology: 'Cesta básica de consumo, operadoras de telecomunicações e custos médios de viatura',
    confidence: 'medium' as const,
  }
};

// ─── MATRIZ AUDITADA DOS 20 DISTRITOS / REGIÕES AUTÓNOMAS ──────────────────
export const DISTRICT_COST_DATA: Record<string, CostProfile> = {
  Lisboa: {
    rentRoom: 480, rentT0: 850, rentT1: 1150, rentT2: 1500, rentT3: 1950,
    transportPass: 40, foodBase: 230, utilitiesBase: 110, tier: 'High',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Porto: {
    rentRoom: 400, rentT0: 680, rentT1: 880, rentT2: 1200, rentT3: 1550,
    transportPass: 40, foodBase: 220, utilitiesBase: 100, tier: 'High',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Faro: {
    rentRoom: 390, rentT0: 650, rentT1: 820, rentT2: 1100, rentT3: 1450,
    transportPass: 35, foodBase: 225, utilitiesBase: 100, tier: 'High',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  'Funchal (Madeira)': {
    rentRoom: 380, rentT0: 650, rentT1: 880, rentT2: 1150, rentT3: 1500,
    transportPass: 30, foodBase: 230, utilitiesBase: 95, tier: 'High', // Reclassificado para High após pressão imobiliária
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Setúbal: {
    rentRoom: 360, rentT0: 600, rentT1: 780, rentT2: 1050, rentT3: 1350,
    transportPass: 40, foodBase: 215, utilitiesBase: 95, tier: 'High',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Braga: {
    rentRoom: 310, rentT0: 480, rentT1: 650, rentT2: 880, rentT3: 1150,
    transportPass: 30, foodBase: 200, utilitiesBase: 88, tier: 'Medium',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Aveiro: {
    rentRoom: 320, rentT0: 500, rentT1: 670, rentT2: 900, rentT3: 1180,
    transportPass: 30, foodBase: 205, utilitiesBase: 88, tier: 'Medium',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Coimbra: {
    rentRoom: 290, rentT0: 450, rentT1: 600, rentT2: 820, rentT3: 1080,
    transportPass: 30, foodBase: 195, utilitiesBase: 88, tier: 'Medium',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Leiria: {
    rentRoom: 280, rentT0: 440, rentT1: 580, rentT2: 790, rentT3: 1020,
    transportPass: 30, foodBase: 195, utilitiesBase: 85, tier: 'Medium',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Santarém: {
    rentRoom: 260, rentT0: 410, rentT1: 530, rentT2: 720, rentT3: 950,
    transportPass: 30, foodBase: 190, utilitiesBase: 85, tier: 'Medium',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  'Ponta Delgada (Açores)': {
    rentRoom: 300, rentT0: 460, rentT1: 620, rentT2: 840, rentT3: 1100,
    transportPass: 30, foodBase: 215, utilitiesBase: 90, tier: 'Medium',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Évora: {
    rentRoom: 260, rentT0: 400, rentT1: 520, rentT2: 710, rentT3: 940,
    transportPass: 28, foodBase: 190, utilitiesBase: 82, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  'Viana do Castelo': {
    rentRoom: 250, rentT0: 390, rentT1: 510, rentT2: 690, rentT3: 920,
    transportPass: 28, foodBase: 190, utilitiesBase: 82, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Viseu: {
    rentRoom: 240, rentT0: 380, rentT1: 490, rentT2: 660, rentT3: 880,
    transportPass: 28, foodBase: 185, utilitiesBase: 80, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Beja: {
    rentRoom: 230, rentT0: 360, rentT1: 460, rentT2: 620, rentT3: 830,
    transportPass: 25, foodBase: 180, utilitiesBase: 78, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  'Castelo Branco': {
    rentRoom: 210, rentT0: 330, rentT1: 420, rentT2: 560, rentT3: 750,
    transportPass: 25, foodBase: 175, utilitiesBase: 78, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  'Vila Real': {
    rentRoom: 220, rentT0: 340, rentT1: 430, rentT2: 580, rentT3: 780,
    transportPass: 25, foodBase: 180, utilitiesBase: 78, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Bragança: {
    rentRoom: 200, rentT0: 310, rentT1: 400, rentT2: 530, rentT3: 710,
    transportPass: 24, foodBase: 175, utilitiesBase: 75, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Guarda: {
    rentRoom: 195, rentT0: 300, rentT1: 390, rentT2: 510, rentT3: 690,
    transportPass: 22, foodBase: 175, utilitiesBase: 75, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  },
  Portalegre: {
    rentRoom: 190, rentT0: 290, rentT1: 380, rentT2: 500, rentT3: 670,
    transportPass: 20, foodBase: 170, utilitiesBase: 75, tier: 'Low',
    provenance: {
      housing: PROVENANCE_METADATA_DEFAULTS.HOUSING_DERIVED,
      transport: PROVENANCE_METADATA_DEFAULTS.TRANSPORT_OFFICIAL,
      food: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      utilities: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  }
};

// ─── NORMALIZAÇÃO DE DEMOGRAFIA FAMILIAR ───────────────────────────────────
export function normalizeDemographics(d: HouseholdDemographics): {
  adultsCount: number;
  youth14To17Count: number;
  childrenUnder14Count: number;
  totalMembers: number;
  ocdeScaleFactor: number;
  legalDependentsCount: number;
} {
  const adultsCount = Math.max(1, d.adultsCount || 1);
  
  let youth14To17Count = Math.max(0, d.youth14To17Count || 0);
  let childrenUnder14Count = Math.max(0, d.childrenUnder14Count || 0);

  // Fallback retrocompatível se o chamador passou apenas childrenCount
  if (d.childrenCount !== undefined && youth14To17Count === 0 && childrenUnder14Count === 0) {
    childrenUnder14Count = Math.max(0, d.childrenCount);
  }

  const totalMembers = adultsCount + youth14To17Count + childrenUnder14Count;

  // Escala de Equivalência OCDE Modificada:
  // 1.º adulto = 1.0 | Adultos adicionais (>=14) = 0.5 | Crianças (<14) = 0.3
  const ocdeScaleFactor = Math.round(
    (1.0 + (0.5 * (adultsCount - 1)) + (0.5 * youth14To17Count) + (0.3 * childrenUnder14Count)) * 100
  ) / 100;

  // Subsistência Jurídica (Portaria n.º 1563/2007):
  // Menores < 18 anos são classificados como dependentes a 30%
  const legalDependentsCount = youth14To17Count + childrenUnder14Count;

  return {
    adultsCount,
    youth14To17Count,
    childrenUnder14Count,
    totalMembers,
    ocdeScaleFactor,
    legalDependentsCount
  };
}

// ─── CÁLCULO CIRÚRGICO POR DISTRITO ─────────────────────────────────────────
export function calculateDistrictCost(
  districtName: string,
  housingType: HousingType,
  foodStyle: FoodStyle,
  transportOption: TransportOption,
  demographics: HouseholdDemographics,
  explicitTransportUsers?: number
): DistrictCostBreakdown {
  const profile = DISTRICT_COST_DATA[districtName] || DISTRICT_COST_DATA['Lisboa'];
  const demo = normalizeDemographics(demographics);

  // 1. Habitação: A renda depende estritamente da TIPOLOGIA CONTRATADA (NÃO multiplica por fator OCDE)
  let housing = profile.rentT1;
  if (housingType === 'room') housing = profile.rentRoom;
  else if (housingType === 't0') housing = profile.rentT0;
  else if (housingType === 't1') housing = profile.rentT1;
  else if (housingType === 't2') housing = profile.rentT2;
  else if (housingType === 't3') housing = profile.rentT3;

  // 2. Alimentação: Aplica o fator OCDE sobre a base individual + estilo alimentar
  let foodStyleMultiplier = 1.0;
  if (foodStyle === 'cook_home') foodStyleMultiplier = 0.85;
  else if (foodStyle === 'eat_out') foodStyleMultiplier = 1.75;

  const food = Math.round(profile.foodBase * demo.ocdeScaleFactor * foodStyleMultiplier);

  // 3. Transporte: Mobilidade por utilizador efetivo
  let transport = 0;
  if (transportOption === 'own_car') {
    // Viatura própria: Benchmark MIRA estrutural fixo (€ 240)
    transport = OWN_CAR_MONTHLY_BENCHMARK;
  } else if (transportOption === 'rail_pass') {
    // Passe Ferroviário Verde: € 20 por utilizador adulto pagante
    const users = explicitTransportUsers !== undefined ? explicitTransportUsers : demo.adultsCount;
    transport = users * RAIL_PASS_COST_2026;
  } else {
    // Passe Público Municipal / Metropolitano: Jovens sub-23 têm gratuitidade legal
    const users = explicitTransportUsers !== undefined ? explicitTransportUsers : demo.adultsCount;
    transport = users * profile.transportPass;
  }

  // 4. Utilidades Domésticas (Água, Eletricidade, Gás): Aplica o fator OCDE
  const utilities = Math.round(profile.utilitiesBase * demo.ocdeScaleFactor);

  // 5. Telecomunicações: Fibra doméstica e pacote base por agregado (€ 30 fixo)
  const telecom = TELECOM_FIXED_HOUSEHOLD;

  // 6. Saúde, Higiene e Cuidados Pessoais: € 35 por adulto + € 20 por dependente menor
  const healthAndPersonal = (demo.adultsCount * 35) + ((demo.youth14To17Count + demo.childrenUnder14Count) * 20);

  // 7. Custo Total Mensal Estimado
  const totalMonthlyCost = housing + food + transport + utilities + telecom + healthAndPersonal;

  return {
    district: districtName,
    tier: profile.tier,
    housing,
    food,
    transport,
    utilities,
    telecom,
    healthAndPersonal,
    totalMonthlyCost,
    provenanceSummary: {
      housing: profile.provenance.housing,
      transport: profile.provenance.transport,
      food: profile.provenance.food,
      utilities: profile.provenance.utilities,
      telecom: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC,
      healthAndPersonal: PROVENANCE_METADATA_DEFAULTS.MARKET_PARAMETRIC
    }
  };
}

// ─── MÉTRICAS DE PRUDÊNCIA FINANCEIRA MIRA ─────────────────────────────────
export function calculateFinancialSufficiency(
  netIncome: number,
  housingCost: number,
  totalLivingCost: number
): FinancialSufficiencyMetrics {
  const effortRateHousingPct = netIncome > 0 ? Math.round((housingCost / netIncome) * 1000) / 10 : 0;
  
  // Limiares de Prudência Financeira MIRA (Standard de literacia financeira e gestão orçamental)
  let effortRateStatus: 'sustainable' | 'moderate_risk' | 'critical' = 'sustainable';
  if (effortRateHousingPct > 50.0) {
    effortRateStatus = 'critical';
  } else if (effortRateHousingPct > 35.0) {
    effortRateStatus = 'moderate_risk';
  }

  const netMonthlySavings = Math.round((netIncome - totalLivingCost) * 100) / 100;
  const emergencyFund3Months = Math.round(totalLivingCost * 3);
  const emergencyFund6Months = Math.round(totalLivingCost * 6);
  const isDeficit = netMonthlySavings < 0;

  return {
    netMonthlyIncome: netIncome,
    effortRateHousingPct,
    effortRateStatus,
    netMonthlySavings,
    emergencyFund3Months,
    emergencyFund6Months,
    isDeficit
  };
}

// ─── REFERÊNCIA GERAL DE SUBSISTÊNCIA DA PORTARIA N.º 1563/2007 ────────────
// ⚠️ AVISO: MIRA Financial Sufficiency ≠ Portaria General Subsistence Reference ≠ Specific Visa Eligibility
export function calculateLegalSubsistenceReference(demographics: HouseholdDemographics): LegalSubsistenceReference {
  const demo = normalizeDemographics(demographics);

  // Artigo 2.º da Portaria n.º 1563/2007:
  // 1.º Adulto: 100% RMMG (€ 920,00)
  // Restantes Adultos (>= 18 anos): 50% RMMG (€ 460,00)
  // Menores (< 18 anos): 30% RMMG (€ 276,00)
  const firstAdult = RMMG_2026;
  const additionalAdults = Math.max(0, demo.adultsCount - 1) * (0.50 * RMMG_2026);
  const minors = (demo.youth14To17Count + demo.childrenUnder14Count) * (0.30 * RMMG_2026);

  const calculatedReference = Math.round((firstAdult + additionalAdults + minors) * 100) / 100;

  return {
    rmmg2026: RMMG_2026,
    calculatedReference,
    totalHouseholdMembers: demo.totalMembers,
    formulaDescription: `100% RMMG (€ 920) titular + 50% RMMG (€ 460) outros adultos + 30% RMMG (€ 276) menores < 18 anos`,
    disclaimer: 'Referência normativa calculada com base na RMMG e Portaria n.º 1563/2007. Trata-se de uma referência orçamental indicativa e não de um parecer ou garantia de elegibilidade migratória. Tipologias específicas de visto têm exigências próprias (ex.: Visto D8 exige 4× RMMG; Visto de Procura de Trabalho exige 3× RMMG; Visto D7 exige rendimentos passivos próprios estáveis).'
  };
}

// ─── FUNÇÃO PURA ORQUESTRADORA GLOBAL: calculateCostOfLiving ───────────────
export function calculateCostOfLiving(input: CostOfLivingInput): CostOfLivingAssessment {
  const demo = normalizeDemographics(input.demographics);

  const destination = calculateDistrictCost(
    input.destinationDistrict,
    input.housingType,
    input.foodStyle,
    input.transportOption,
    input.demographics,
    input.transportUsersCount
  );

  let comparison: DistrictCostBreakdown | undefined;
  let differenceBetweenDistricts: { cheaperDistrict: string; expensiveDistrict: string; monthlySavingsDiff: number } | undefined;

  if (input.comparisonDistrict && input.comparisonDistrict !== input.destinationDistrict) {
    comparison = calculateDistrictCost(
      input.comparisonDistrict,
      input.housingType,
      input.foodStyle,
      input.transportOption,
      input.demographics,
      input.transportUsersCount
    );

    const diff = Math.abs(destination.totalMonthlyCost - comparison.totalMonthlyCost);
    const cheaper = destination.totalMonthlyCost < comparison.totalMonthlyCost ? destination.district : comparison.district;
    const expensive = destination.totalMonthlyCost > comparison.totalMonthlyCost ? destination.district : comparison.district;

    differenceBetweenDistricts = {
      cheaperDistrict: cheaper,
      expensiveDistrict: expensive,
      monthlySavingsDiff: diff
    };
  }

  let financialSufficiency: FinancialSufficiencyMetrics | undefined;
  if (input.netMonthlyIncome !== undefined && input.netMonthlyIncome > 0) {
    financialSufficiency = calculateFinancialSufficiency(
      input.netMonthlyIncome,
      destination.housing,
      destination.totalMonthlyCost
    );
  }

  const legalSubsistenceReference = calculateLegalSubsistenceReference(input.demographics);

  return {
    destination,
    comparison,
    differenceBetweenDistricts,
    familyScaleFactors: {
      ocdeScaleFactor: demo.ocdeScaleFactor,
      legalDependentsCount: demo.legalDependentsCount
    },
    financialSufficiency,
    legalSubsistenceReference
  };
}
