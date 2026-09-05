/**
 * MIRA Housing Intelligence & Affordability Engine 2026 (U-HOUSE-01)
 *
 * Motor puro desacoplado que implementa:
 * 1. Camada de fontes e integridade epistémica (RULE_HOUSE_INGESTION_001)
 * 2. Normalização anti-média cega (Mediana, P25-P75, deduplicação)
 * 3. Inteligência territorial (Asking vs Contracted, municipal vs distrital derived)
 * 4. Motores duais de Affordability (Arrendamento Art. 1076.º CC + Porta 65; Compra LTV, DSTI BdP, IMT Jovem 2026, Garantia Pública DL 44/2024)
 */

import {
  DataEpistemicStatus,
  ConfidenceLevel,
  TerritorialLevel,
  SourceFetchEvidence,
  HousingEvidenceStore
} from './housingSourceEvidence';

import { initializeCanonicalEvidenceStore } from './housingDataIngestion';

// ============================================================================
// 1. TIPOS E INTERFACES DE DOMÍNIO
// ============================================================================

export type HousingTypology = 'room' | 't0' | 't1' | 't2' | 't3' | 't4_plus';

export type DstiStatus =
  | 'within_macroprudential_reference'
  | 'above_reference_with_possible_exception'
  | 'above_exception_threshold';

export interface BorrowerInput {
  age: number;
  sharePct?: number;
}

export interface TerritorialHousingIntelligence {
  territoryId: string;
  territoryName: string;
  level: TerritorialLevel;
  parentTerritoryId?: string;

  contractedMarket: {
    medianRentEurPerM2: number;
    referencePeriod: string;
    ineObservationId: string;
    dataStatus: DataEpistemicStatus;
    evidence?: SourceFetchEvidence;
  };

  askingBenchmark: {
    typology: HousingTypology;
    medianRentEurMonthly: number;
    p25RentEurMonthly: number;
    p75RentEurMonthly: number;
    estimatedRentEurPerM2: number;
    activeListingsCount: number;
    dataStatus: DataEpistemicStatus;
    evidence?: SourceFetchEvidence;
  };

  askingVsContractedSpreadPct: number; // Ágio da oferta sobre os contratos reais

  purchaseBenchmark: {
    medianPriceEurPerM2: number;
    p25PriceEurPerM2: number;
    p75PriceEurPerM2: number;
    dataStatus: DataEpistemicStatus;
  };

  temporalTrends: {
    rentTrend12mPct: number | null;
    saleTrend12mPct: number | null;
    trendStatus: 'verified' | 'insufficient_data';
    trendNotice?: string;
  };
}

// ----------------------------------------------------------------------------
// ARRENDAMENTO
// ----------------------------------------------------------------------------

export interface RentalAffordabilityInput {
  territoryId: string;
  typology: HousingTypology;
  contractRentMonthly?: number; // Se ausente, usa benchmark MIRA
  netMonthlyHouseholdIncome: number;
  grossMonthlyHouseholdIncome?: number;
  correctedMonthlyHouseholdIncome?: number;
  otherMonthlyDebtPayments?: number;
  candidateAges: number[];
  dependentsCount?: number;
}

export interface Porta65IncomeEligibility {
  correctedMonthlyHouseholdIncome: number;
  grossMonthlyHouseholdIncome: number;
  maxByReferenceRent: number; // 4 * RMA
  maxByRMMG: number;          // 4 * RMMG (3.680 € em 2026)
  applicableIncomeCeiling: number;
  grossEffortRatePct: number;
  passesGrossEffortLimit: boolean; // grossEffortRatePct <= 60%
  passesReferenceRentLimit: boolean;
  passesRmmgLimit: boolean;
  passesOverallIncome: boolean;
}

export interface Porta65SubsidyRule2026 {
  subsidyStatus: 'calculable' | 'not_calculable';
  reasonIfNotCalculable?: string;
  incomeBracket?: number;
  basePct?: number;
  majorationsApplied?: { type: string; pct: number }[];
  finalSubsidyPct?: number;
  monthlySubsidyEur?: number;
}

export interface RentalAffordabilityResult {
  monthlyRentUsed: number;
  isBenchmarkRent: boolean;

  effortRateHousingPct: number;
  totalEffortRatePct: number;
  miraPrudenceStatus: 'sustainable' | 'moderate_risk' | 'critical';

  legalInitialCapitalCC1076: {
    firstMonthRent: number;
    maxAdvanceRentMonths: number;
    maxAdvanceRentEur: number;
    maxSecurityDepositMonths: number;
    maxSecurityDepositEur: number;
    maxAdmissibleTotalEur: number; // 5 rendas no teto legal
    label: string;
    disclaimer: string;
  };

  porta65JovemScreening: {
    screeningStatus: 'preliminary_pass' | 'income_exceeded' | 'rent_exceeded' | 'gross_effort_exceeded' | 'age_ineligible';
    screeningLabel: string;
    isAgeEligible: boolean;
    incomeEligibility: Porta65IncomeEligibility;
    isRentWithinMunicipalRma: boolean;
    municipalRmaEur: number;
    subsidyEvaluation: Porta65SubsidyRule2026;
    contractStatusNotice: string;
    legalDisclaimer: string;
  };
}

// ----------------------------------------------------------------------------
// COMPRA
// ----------------------------------------------------------------------------

export interface PurchaseAffordabilityInput {
  territoryId: string;
  acquisitionPrice: number;
  appraisalValue?: number;
  ownCapitalAvailable: number;
  netMonthlyIncome: number;
  otherMonthlyDebtPayments?: number;
  borrowers: BorrowerInput[];
  isFirstHpp: boolean;
  ownsResidentialProperty: boolean; // Apenas titularidade atual (DL 44/2024 sem lookback)
  ownsResidentialPropertyLast3Years?: boolean; // Relevante apenas para IMT Jovem (Art. 8.º-A CIMT)
  isYouthGuaranteeRequested?: boolean;
}

export interface PurchaseAffordabilityResult {
  acquisitionPrice: number;
  appraisalValue: number;
  eligiblePropertyValue: number; // min(acquisitionPrice, appraisalValue)

  financing: {
    maxLtvAllowedPct: number;
    effectiveLtvPct: number;
    maxLoanAllowed: number;
    loanAmount: number;
    minRequiredOwnCapital: number;
    capitalDeficitOrSurplusEur: number;
    maxMaturityYears: number;
    estimatedMonthlyMortgageEur: number;
  };

  dstiMacroprudential: {
    dstiHousingPct: number;
    dstiTotalPct: number;
    dstiStatus: DstiStatus;
    statusLabel: string;
    explanation: string;
  };

  fiscalTaxes: {
    standardImtEur: number;
    standardStampDutyEur: number;
    imtJovemApplied: boolean;
    payableImtEur: number;
    payableStampDutyEur: number;
    imtJovemSavingsEur: number;
    stampDutySavingsEur: number;
    legalReference: string;
  };

  publicGuaranteeDL44: {
    eligibleByRules: boolean;
    ineligibilityReasons: string[];
    maxGuaranteeAmountEur: number;
    stateGuaranteedFinancingAllowed: boolean;
    bankApprovalNotice: string;
  };

  totalInitialDisbursementRequiredEur: number;
}

// ============================================================================
// 2. TABELA FISCAL VERSIONADA: IMT JOVEM 2026 (DL n.º 48-A/2024 & AT)
// ============================================================================

export const IMT_JOVEM_2026 = {
  version: '2026.1',
  source: 'AT',
  legalBasis: 'Decreto-Lei n.º 48-A/2024 (Artigo 8.º-A do CIMT); Artigo 17.º n.º 1 alínea a) do CIMT',
  officialDocumentRef: 'Ofício-Circulado n.º 40019/2024 da Autoridade Tributária e Aduaneira',
  effectiveFrom: '2024-08-01',
  verifiedAt: '2026-01-01',

  fullExemptionLimitEur: 316772,     // 4.º escalão da tabela HPP Continente
  partialExemptionCeilingEur: 633453,// Limite do escalão de isenção parcial
  maxEligibleAge: 35,
  stampDutyExemptionRatePct: 0.8,

  mandatoryRequirements: {
    firstHpp: true,
    noPriorResidentialPropertyLast3Years: true,
    notDependentForIrs: true
  }
};

// ============================================================================
// 3. TABELA DE RENDAS MÁXIMAS ADMITIDAS (RMA) PORTA 65 POR CONCELHO E TIPOLOGIA
// ============================================================================

export const PORTA_65_MUNICIPAL_RMA_2026: Record<string, Record<HousingTypology, number>> = {
  'lisboa-concelho': { room: 350, t0: 600, t1: 750, t2: 950, t3: 1150, t4_plus: 1300 },
  'porto-concelho': { room: 300, t0: 500, t1: 650, t2: 800, t3: 950, t4_plus: 1100 },
  'almada': { room: 280, t0: 450, t1: 600, t2: 750, t3: 900, t4_plus: 1050 },
  'sintra': { room: 260, t0: 420, t1: 550, t2: 700, t3: 850, t4_plus: 980 },
  'braga-concelho': { room: 240, t0: 380, t1: 500, t2: 650, t3: 780, t4_plus: 900 },
  'coimbra-concelho': { room: 230, t0: 370, t1: 480, t2: 620, t3: 750, t4_plus: 880 },
  'funchal-concelho': { room: 280, t0: 450, t1: 600, t2: 750, t3: 900, t4_plus: 1050 },
  'ponta-delgada-concelho': { room: 220, t0: 350, t1: 450, t2: 580, t3: 700, t4_plus: 820 },
  'default': { room: 220, t0: 350, t1: 450, t2: 580, t3: 700, t4_plus: 820 }
};

// ============================================================================
// 4. DATASET TERRITORIAL AUDITADO (COM SEGREGAÇÃO CONCELHO OFICIAL VS DISTRITO DERIVED)
// ============================================================================

export interface RawTerritorialSeed {
  id: string;
  name: string;
  level: TerritorialLevel;
  parentTerritoryId?: string;
  ineObservationId?: string;
  ineRentM2: number;
  idealistaObservationId?: string;
  askingRentM2: number;
  t1Rent: number;
  t2Rent: number;
  t2P25: number;
  t2P75: number;
  purchaseM2: number;
}

export const TERRITORIAL_SEEDS: RawTerritorialSeed[] = [
  // Concelhos com ingestão oficial direta do INE
  {
    id: 'lisboa-concelho',
    name: 'Lisboa (Município)',
    level: 'municipality',
    parentTerritoryId: 'lisboa-distrito',
    ineObservationId: 'ine-lisboa-concelho-rent-m2',
    ineRentM2: 17.42,
    idealistaObservationId: 'idealista-lisboa-city-rent-m2',
    askingRentM2: 24.50,
    t1Rent: 1225,
    t2Rent: 1837,
    t2P25: 1600,
    t2P75: 2200,
    purchaseM2: 4400
  },
  {
    id: 'porto-concelho',
    name: 'Porto (Município)',
    level: 'municipality',
    parentTerritoryId: 'porto-distrito',
    ineObservationId: 'ine-porto-concelho-rent-m2',
    ineRentM2: 11.80,
    idealistaObservationId: 'idealista-porto-city-rent-m2',
    askingRentM2: 17.20,
    t1Rent: 860,
    t2Rent: 1290,
    t2P25: 1100,
    t2P75: 1550,
    purchaseM2: 3200
  },
  {
    id: 'almada',
    name: 'Almada',
    level: 'municipality',
    parentTerritoryId: 'setubal-distrito',
    ineRentM2: 11.20,
    askingRentM2: 14.67,
    t1Rent: 780,
    t2Rent: 1100,
    t2P25: 950,
    t2P75: 1300,
    purchaseM2: 2600
  },
  {
    id: 'sintra',
    name: 'Sintra',
    level: 'municipality',
    parentTerritoryId: 'lisboa-distrito',
    ineRentM2: 10.10,
    askingRentM2: 13.07,
    t1Rent: 720,
    t2Rent: 980,
    t2P25: 850,
    t2P75: 1180,
    purchaseM2: 2400
  },
  // Distritos Administrativos (Agregação Ponderada MIRA = Sempre DERIVED)
  {
    id: 'lisboa-distrito',
    name: 'Distrito de Lisboa',
    level: 'district',
    ineRentM2: 14.20,
    askingRentM2: 22.20,
    t1Rent: 1100,
    t2Rent: 1500,
    t2P25: 1300,
    t2P75: 1850,
    purchaseM2: 4100
  },
  {
    id: 'porto-distrito',
    name: 'Distrito do Porto',
    level: 'district',
    ineRentM2: 10.90,
    askingRentM2: 16.00,
    t1Rent: 850,
    t2Rent: 1200,
    t2P25: 1050,
    t2P75: 1450,
    purchaseM2: 3100
  },
  {
    id: 'setubal-distrito',
    name: 'Distrito de Setúbal',
    level: 'district',
    ineRentM2: 9.85,
    askingRentM2: 14.00,
    t1Rent: 780,
    t2Rent: 1050,
    t2P25: 900,
    t2P75: 1250,
    purchaseM2: 2550
  },
  {
    id: 'faro-distrito',
    name: 'Faro (Algarve)',
    level: 'district',
    ineRentM2: 11.20,
    askingRentM2: 14.67,
    t1Rent: 820,
    t2Rent: 1100,
    t2P25: 950,
    t2P75: 1350,
    purchaseM2: 3250
  },
  {
    id: 'braga-distrito',
    name: 'Distrito de Braga',
    level: 'district',
    ineRentM2: 8.40,
    askingRentM2: 11.73,
    t1Rent: 650,
    t2Rent: 880,
    t2P25: 750,
    t2P75: 1050,
    purchaseM2: 1950
  },
  {
    id: 'coimbra-distrito',
    name: 'Distrito de Coimbra',
    level: 'district',
    ineRentM2: 8.10,
    askingRentM2: 10.93,
    t1Rent: 600,
    t2Rent: 820,
    t2P25: 700,
    t2P75: 980,
    purchaseM2: 1850
  },
  {
    id: 'ram-madeira',
    name: 'Região Autónoma da Madeira',
    level: 'region',
    ineRentM2: 11.50,
    askingRentM2: 15.33,
    t1Rent: 880,
    t2Rent: 1150,
    t2P25: 1000,
    t2P75: 1400,
    purchaseM2: 3200
  },
  {
    id: 'raa-acores',
    name: 'Região Autónoma dos Açores',
    level: 'region',
    ineRentM2: 8.20,
    askingRentM2: 11.20,
    t1Rent: 620,
    t2Rent: 840,
    t2P25: 720,
    t2P75: 1000,
    purchaseM2: 1950
  }
];

// ============================================================================
// 5. MOTOR DE INTELIGÊNCIA TERRITORIAL & PROVENIÊNCIA
// ============================================================================

/**
 * Constrói a inteligência territorial aplicando rigorosamente a RULE_HOUSE_INGESTION_001.
 */
export function getTerritorialIntelligence(
  territoryId: string,
  evidenceStore?: HousingEvidenceStore
): TerritorialHousingIntelligence | null {
  const store = evidenceStore ?? HousingEvidenceStore.getInstance();
  // Se o repositório estiver completamente vazio, efetua o bootstrap canónico inicial uma única vez
  if (!store.getEvidence('ine-lisboa-concelho-rent-m2') && !store.hasValidEvidence('ine-lisboa-concelho-rent-m2')) {
    initializeCanonicalEvidenceStore();
  }
  const seed = TERRITORIAL_SEEDS.find((s) => s.id === territoryId);
  if (!seed) return null;

  // 1. Aferição do estatuto epistémico do mercado contratado (INE)
  let contractedStatus: DataEpistemicStatus = 'insufficient';
  let ineEvidence: SourceFetchEvidence | undefined = undefined;

  if (seed.level === 'municipality' && seed.ineObservationId) {
    const valResult = store.validateDataValue(seed.ineObservationId, seed.ineRentM2);
    if (valResult.isValid) {
      contractedStatus = 'official';
      ineEvidence = valResult.evidence;
    } else {
      contractedStatus = 'insufficient';
    }
  } else if (seed.level === 'district' || seed.level === 'region') {
    // Distritos e Regiões são agregações ponderadas MIRA => Sempre DERIVED
    contractedStatus = 'derived';
  }

  // 2. Aferição do estatuto epistémico dos anúncios (Idealista/Portais)
  let askingStatus: DataEpistemicStatus = 'derived';
  let portalEvidence: SourceFetchEvidence | undefined = undefined;

  if (seed.idealistaObservationId) {
    const valResult = store.validateDataValue(seed.idealistaObservationId, seed.askingRentM2);
    if (valResult.isValid) {
      portalEvidence = valResult.evidence;
      askingStatus = 'observed';
    } else {
      askingStatus = 'insufficient';
    }
  }

  // 3. Cálculo do Ágio (Spread Asking vs Contracted)
  const spreadPct =
    seed.ineRentM2 > 0
      ? Number((((seed.askingRentM2 - seed.ineRentM2) / seed.ineRentM2) * 100).toFixed(1))
      : 0;

  return {
    territoryId: seed.id,
    territoryName: seed.name,
    level: seed.level,
    parentTerritoryId: seed.parentTerritoryId,
    contractedMarket: {
      medianRentEurPerM2: seed.ineRentM2,
      referencePeriod: '1.º Trimestre de 2026 (12 meses)',
      ineObservationId: seed.ineObservationId || 'derived-aggregation',
      dataStatus: contractedStatus,
      evidence: ineEvidence
    },
    askingBenchmark: {
      typology: 't2',
      medianRentEurMonthly: seed.t2Rent,
      p25RentEurMonthly: seed.t2P25,
      p75RentEurMonthly: seed.t2P75,
      estimatedRentEurPerM2: seed.askingRentM2,
      activeListingsCount: portalEvidence?.sourceStatisticalUniverseCount ?? 500,
      dataStatus: askingStatus,
      evidence: portalEvidence
    },
    askingVsContractedSpreadPct: spreadPct,
    purchaseBenchmark: {
      medianPriceEurPerM2: seed.purchaseM2,
      p25PriceEurPerM2: Math.round(seed.purchaseM2 * 0.88),
      p75PriceEurPerM2: Math.round(seed.purchaseM2 * 1.15),
      dataStatus: 'derived'
    },
    temporalTrends: {
      rentTrend12mPct: null,
      saleTrend12mPct: null,
      trendStatus: 'insufficient_data',
      trendNotice: 'Dados de tendências do Q2 2026 aguardam publicação oficial calendarizada pelo INE para 29/09/2026.'
    }
  };
}

// ============================================================================
// 6. PIPELINE DE DEDUPLICAÇÃO E NORMALIZAÇÃO DE ANÚNCIOS (ANTI-MÉDIA CEGA)
// ============================================================================

export interface PortalListing {
  id: string;
  portalId: string;
  propertyAddress: string;
  typology: HousingTypology;
  priceEur: number;
  areaM2: number;
}

/**
 * Deduplica anúncios partilhados entre múltiplos portais e remove outliers via IQR.
 * Retorna mediana e percentis P25/P75. Jamais média aritmética cega.
 */
export function processPortalListings(listings: PortalListing[]): {
  rawCount: number;
  deduplicatedCount: number;
  filteredCount: number;
  medianEur: number;
  p25Eur: number;
  p75Eur: number;
} {
  // Filtro de exclusão do Airbnb no benchmark residencial de longa duração
  const validListings = listings.filter((l) => l.portalId !== 'house-13' && l.portalId !== 'airbnb');

  // Deduplicação baseada em endereço normalizado + tipologia + área aproximada (+-2m2)
  const seenMap = new Map<string, PortalListing>();
  for (const item of validListings) {
    const normKey = `${item.propertyAddress.trim().toLowerCase()}_${item.typology}_${Math.round(item.areaM2 / 3)}`;
    if (!seenMap.has(normKey)) {
      seenMap.set(normKey, item);
    }
  }

  const deduped = Array.from(seenMap.values());
  if (deduped.length === 0) {
    return { rawCount: listings.length, deduplicatedCount: 0, filteredCount: 0, medianEur: 0, p25Eur: 0, p75Eur: 0 };
  }

  const prices = deduped.map((l) => l.priceEur).sort((a, b) => a - b);
  const n = prices.length;

  // Filtro de Outliers IQR se houver amostra suficiente (n >= 4)
  let cleanPrices = prices;
  if (n >= 4) {
    const q1 = prices[Math.floor(n * 0.25)];
    const q3 = prices[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    cleanPrices = prices.filter((p) => p >= lower && p <= upper);
  }

  const cn = cleanPrices.length;
  const median = cn % 2 === 0 ? (cleanPrices[cn / 2 - 1] + cleanPrices[cn / 2]) / 2 : cleanPrices[Math.floor(cn / 2)];
  const p25 = cleanPrices[Math.floor(cn * 0.25)];
  const p75 = cleanPrices[Math.floor(cn * 0.75)];

  return {
    rawCount: listings.length,
    deduplicatedCount: deduped.length,
    filteredCount: cn,
    medianEur: Math.round(median),
    p25Eur: Math.round(p25),
    p75Eur: Math.round(p75)
  };
}

// ============================================================================
// 7. SIMULADOR DE ARRENDAMENTO & AFFORDABILITY
// ============================================================================

export function calculateRentalAffordability(input: RentalAffordabilityInput): RentalAffordabilityResult {
  const territory = getTerritorialIntelligence(input.territoryId);
  const benchmarkRent = territory?.askingBenchmark.medianRentEurMonthly ?? 850;
  const rentToUse = input.contractRentMonthly && input.contractRentMonthly > 0 ? input.contractRentMonthly : benchmarkRent;
  const isBenchmark = !input.contractRentMonthly || input.contractRentMonthly <= 0;

  // 1. Taxas de Esforço MIRA
  const netIncome = Math.max(1, input.netMonthlyHouseholdIncome);
  const effortRateHousing = Number(((rentToUse / netIncome) * 100).toFixed(1));
  const otherDebts = input.otherMonthlyDebtPayments ?? 0;
  const totalEffortRate = Number((((rentToUse + otherDebts) / netIncome) * 100).toFixed(1));

  let prudenceStatus: 'sustainable' | 'moderate_risk' | 'critical' = 'sustainable';
  if (effortRateHousing > 50) {
    prudenceStatus = 'critical';
  } else if (effortRateHousing > 35) {
    prudenceStatus = 'moderate_risk';
  }

  // 2. Capital Inicial Máximo Admissível (Art. 1076.º Código Civil)
  // 1 renda corrente + até 2 antecipadas + até 2 caução = 5 rendas no máximo legal
  const maxAdvanceMonths = 2;
  const maxDepositMonths = 2;
  const maxAdvanceEur = rentToUse * maxAdvanceMonths;
  const maxDepositEur = rentToUse * maxDepositMonths;
  const maxAdmissibleTotal = rentToUse + maxAdvanceEur + maxDepositEur; // 5 * rentToUse

  // 3. Triagem Indicativa Porta 65 Jovem (DL 42/2024 / Portaria 277-A/2010)
  const rmaMap = PORTA_65_MUNICIPAL_RMA_2026[input.territoryId] || PORTA_65_MUNICIPAL_RMA_2026['default'];
  const municipalRma = rmaMap[input.typology] || 750;
  const isRentWithinRma = rentToUse <= municipalRma;

  // Idades
  const isAgeEligible = input.candidateAges.every((age) => age >= 18 && age <= 35) ||
    (input.candidateAges.length === 2 && (input.candidateAges[0] + input.candidateAges[1]) / 2 <= 36);

  // Rendimentos
  const correctedIncome = input.correctedMonthlyHouseholdIncome ?? input.netMonthlyHouseholdIncome;
  const grossIncome = input.grossMonthlyHouseholdIncome ?? (input.netMonthlyHouseholdIncome * 1.28);

  const maxByReferenceRent = municipalRma * 4;
  const maxByRmmg = 920 * 4; // 3.680 € em 2026
  const applicableCeiling = Math.min(maxByReferenceRent, maxByRmmg);

  const passesRefRentLimit = correctedIncome <= maxByReferenceRent;
  const passesRmmgLimit = correctedIncome <= maxByRmmg;

  // Esforço Bruto Legal (Renda <= 60% do rendimento bruto)
  const grossEffortPct = Number(((rentToUse / grossIncome) * 100).toFixed(1));
  const passesGrossEffort = grossEffortPct <= 60;

  const passesOverallIncome = passesRefRentLimit && passesRmmgLimit && passesGrossEffort;

  let screeningStatus: 'preliminary_pass' | 'income_exceeded' | 'rent_exceeded' | 'gross_effort_exceeded' | 'age_ineligible' = 'preliminary_pass';
  if (!isAgeEligible) {
    screeningStatus = 'age_ineligible';
  } else if (!isRentWithinRma) {
    screeningStatus = 'rent_exceeded';
  } else if (!passesGrossEffort) {
    screeningStatus = 'gross_effort_exceeded';
  } else if (!passesRefRentLimit || !passesRmmgLimit) {
    screeningStatus = 'income_exceeded';
  }

  return {
    monthlyRentUsed: rentToUse,
    isBenchmarkRent: isBenchmark,
    effortRateHousingPct: effortRateHousing,
    totalEffortRatePct: totalEffortRate,
    miraPrudenceStatus: prudenceStatus,
    legalInitialCapitalCC1076: {
      firstMonthRent: rentToUse,
      maxAdvanceRentMonths: maxAdvanceMonths,
      maxAdvanceRentEur: maxAdvanceEur,
      maxSecurityDepositMonths: maxDepositMonths,
      maxSecurityDepositEur: maxDepositEur,
      maxAdmissibleTotalEur: maxAdmissibleTotal,
      label: 'Capital inicial máximo contratualmente admissível segundo os parâmetros do Art. 1076.º do Código Civil',
      disclaimer: 'O valor de 5 rendas constitui o teto legal de desembolso inicial admissível no contrato (1.ª renda + até 2 adiantamentos + até 2 cauções), não sendo um pagamento legalmente obrigatório se o senhorio acordar montante inferior.'
    },
    porta65JovemScreening: {
      screeningStatus: screeningStatus,
      screeningLabel: 'Triagem indicativa de elegibilidade prévia (Porta 65 Jovem)',
      isAgeEligible: isAgeEligible,
      isRentWithinMunicipalRma: isRentWithinRma,
      municipalRmaEur: municipalRma,
      incomeEligibility: {
        correctedMonthlyHouseholdIncome: correctedIncome,
        grossMonthlyHouseholdIncome: grossIncome,
        maxByReferenceRent: maxByReferenceRent,
        maxByRMMG: maxByRmmg,
        applicableIncomeCeiling: applicableCeiling,
        grossEffortRatePct: grossEffortPct,
        passesGrossEffortLimit: passesGrossEffort,
        passesReferenceRentLimit: passesRefRentLimit,
        passesRmmgLimit: passesRmmgLimit,
        passesOverallIncome: passesOverallIncome
      },
      subsidyEvaluation: {
        subsidyStatus: 'not_calculable',
        reasonIfNotCalculable: 'O apuramento da taxa de subvenção efetiva depende do escalão fiscal de IRS do agregado e de eventuais majorações (dependentes, pessoas com deficiência, concelhos do interior), devendo ser formalizado junto do IHRU.'
      },
      contractStatusNotice: 'Candidatura elegível para submissão mesmo sem contrato prévio de arrendamento. Em caso de aprovação pelo IHRU, o contrato formal deve ser celebrado no prazo legal subsequente.',
      legalDisclaimer: 'A presente triagem constitui uma simulação indicativa e não confere direito automático à subvenção, dependendo a concessão de pontuação concursal e da dotação orçamental do IHRU, I.P.'
    }
  };
}

// ============================================================================
// 8. SIMULADOR DE COMPRA DE HABITAÇÃO, CRÉDITO & BENEFÍCIOS FISCAIS
// ============================================================================

export function calculateMaximumLoanTerm(borrowers: BorrowerInput[]): number {
  if (!borrowers || borrowers.length === 0) return 35;
  const oldestAge = Math.max(...borrowers.map((b) => b.age));

  let maxTermByBdP = 35;
  if (oldestAge <= 30) {
    maxTermByBdP = 40;
  } else if (oldestAge <= 35) {
    maxTermByBdP = 37;
  } else {
    maxTermByBdP = 35;
  }

  // Teto bancário em que o empréstimo deve cessar até aos 75 anos
  const termUntil75 = Math.max(5, 75 - oldestAge);
  return Math.min(maxTermByBdP, termUntil75);
}

export function calculateImtAndStampDuty(
  price: number,
  isFirstHpp: boolean,
  isYouthUnder35: boolean,
  noPriorHouseLast3Years: boolean
): {
  standardImt: number;
  standardStampDuty: number;
  payableImt: number;
  payableStampDuty: number;
  imtJovemSavings: number;
  stampDutySavings: number;
  isJovemApplied: boolean;
} {
  const standardStampDuty = price * 0.008; // 0,8% Imposto de Selo

  // Tabela Geral de IMT 2026 para HPP (Continente)
  let standardImt = 0;
  if (price <= 101917) {
    standardImt = 0;
  } else if (price <= 139412) {
    standardImt = price * 0.02 - 2038.34;
  } else if (price <= 190086) {
    standardImt = price * 0.05 - 6220.70;
  } else if (price <= 316772) {
    standardImt = price * 0.07 - 10022.42;
  } else if (price <= 633453) {
    standardImt = price * 0.08 - 13190.14;
  } else if (price <= 1102920) {
    standardImt = price * 0.06;
  } else {
    standardImt = price * 0.075;
  }
  standardImt = Math.max(0, Math.round(standardImt));

  const isEligibleForJovem =
    isFirstHpp && isYouthUnder35 && noPriorHouseLast3Years && price <= IMT_JOVEM_2026.partialExemptionCeilingEur;

  if (!isEligibleForJovem) {
    return {
      standardImt,
      standardStampDuty: Math.round(standardStampDuty),
      payableImt: standardImt,
      payableStampDuty: Math.round(standardStampDuty),
      imtJovemSavings: 0,
      stampDutySavings: 0,
      isJovemApplied: false
    };
  }

  // Regime IMT Jovem (DL n.º 48-A/2024 & Ofício-Circulado n.º 40019/2024)
  let payableImt = 0;
  let payableStampDuty = 0;

  if (price <= IMT_JOVEM_2026.fullExemptionLimitEur) {
    payableImt = 0;
    payableStampDuty = 0;
  } else {
    // Isenção sobre a parcela até 316.772 €; tributação marginal a 8% sobre a parcela excedente
    payableImt = Math.round((price - IMT_JOVEM_2026.fullExemptionLimitEur) * 0.08);
    payableStampDuty = Math.round((price - IMT_JOVEM_2026.fullExemptionLimitEur) * 0.008);
  }

  return {
    standardImt,
    standardStampDuty: Math.round(standardStampDuty),
    payableImt,
    payableStampDuty,
    imtJovemSavings: Math.max(0, standardImt - payableImt),
    stampDutySavings: Math.max(0, Math.round(standardStampDuty) - payableStampDuty),
    isJovemApplied: true
  };
}

export function calculatePurchaseAffordability(input: PurchaseAffordabilityInput): PurchaseAffordabilityResult {
  const price = input.acquisitionPrice;
  const appraisal = input.appraisalValue && input.appraisalValue > 0 ? input.appraisalValue : price;

  // Regra do Banco de Portugal: Financiamento calculado sobre min(preço de aquisição, valor de avaliação)
  const eligiblePropertyValue = Math.min(price, appraisal);

  // Garantia Pública Jovem (Decreto-Lei n.º 44/2024 & Portaria n.º 236-A/2024)
  // ⚠️ DL 44/2024: Apenas ownsResidentialProperty: false (SEM regra dos 3 anos!)
  const oldestBorrowerAge = Math.max(...input.borrowers.map((b) => b.age));
  const isAgeValidForGuarantee = input.borrowers.every((b) => b.age >= 18 && b.age <= 35);
  const isGuaranteeRequested = input.isYouthGuaranteeRequested !== false;

  const guaranteeEligibleByRules =
    isGuaranteeRequested &&
    isAgeValidForGuarantee &&
    input.isFirstHpp &&
    !input.ownsResidentialProperty &&
    price <= 450000;

  const ineligibilityReasons: string[] = [];
  if (!isAgeValidForGuarantee) ineligibilityReasons.push('Todos os mutuários devem ter entre 18 e 35 anos inclusive.');
  if (!input.isFirstHpp) ineligibilityReasons.push('O imóvel deve destinar-se à 1.ª aquisição de Habitação Própria Permanente.');
  if (input.ownsResidentialProperty) ineligibilityReasons.push('O mutuário não pode ser proprietário de habitação à data da concessão.');
  if (price > 450000) ineligibilityReasons.push('O valor da transação não pode exceder o teto legal de 450.000 €.');

  // LTV Máximo Permitido
  // Se a Garantia Pública for aplicável, o Estado garante até 15%, permitindo financiamento até 100%
  const maxLtvAllowedPct = guaranteeEligibleByRules ? 100 : 90;
  const maxLoanAllowed = eligiblePropertyValue * (maxLtvAllowedPct / 100);

  // Montante de Financiamento Necessário (Preço - Capitais Próprios)
  const requiredLoan = Math.max(0, price - input.ownCapitalAvailable);
  const effectiveLoan = Math.min(requiredLoan, maxLoanAllowed);
  const effectiveLtvPct = eligiblePropertyValue > 0 ? Number(((effectiveLoan / eligiblePropertyValue) * 100).toFixed(1)) : 0;

  const minRequiredOwnCapital = Math.max(0, price - maxLoanAllowed);
  const capitalDeficitOrSurplus = input.ownCapitalAvailable - minRequiredOwnCapital;

  // Maturidade BdP e Prestação Mensal
  const maxMaturityYears = calculateMaximumLoanTerm(input.borrowers);
  const annualInterestRate = 0.038; // Taxa de juro indicativa 2026 (Euribor + spread = ~3.8%)
  const monthlyRate = annualInterestRate / 12;
  const totalMonths = maxMaturityYears * 12;

  const estimatedMonthlyMortgage =
    effectiveLoan > 0
      ? Math.round((effectiveLoan * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
      : 0;

  // DSTI e Semáforo do Banco de Portugal
  const netIncome = Math.max(1, input.netMonthlyIncome);
  const dstiHousing = Number(((estimatedMonthlyMortgage / netIncome) * 100).toFixed(1));
  const otherDebts = input.otherMonthlyDebtPayments ?? 0;
  const dstiTotal = Number((((estimatedMonthlyMortgage + otherDebts) / netIncome) * 100).toFixed(1));

  let dstiStatus: DstiStatus = 'within_macroprudential_reference';
  let explanation = 'DSTI dentro da diretriz macroprudencial de referência do Banco de Portugal (≤ 50%).';

  if (dstiTotal > 60) {
    dstiStatus = 'above_exception_threshold';
    explanation = 'DSTI acima de 60%. Excede a margem excecional de tolerância recomendada pelo Banco de Portugal.';
  } else if (dstiTotal > 50) {
    dstiStatus = 'above_reference_with_possible_exception';
    explanation = 'DSTI entre 50% e 60%. Acima da referência-base de 50%, admissível apenas mediante enquadramento na quota de exceções do Banco de Portugal.';
  }

  // Benefícios Fiscais IMT Jovem (Aplica a regra dos 3 anos apenas aqui!)
  const noPriorHouseLast3Years = input.ownsResidentialPropertyLast3Years !== true;
  const youthEligibleForImt = oldestBorrowerAge <= 35;
  const fiscalTaxes = calculateImtAndStampDuty(price, input.isFirstHpp, youthEligibleForImt, noPriorHouseLast3Years);

  // Garantia Pública montante
  const maxGuaranteeAmount = guaranteeEligibleByRules ? Math.round(eligiblePropertyValue * 0.15) : 0;

  const totalDisbursement = Math.max(0, minRequiredOwnCapital) + fiscalTaxes.payableImt + fiscalTaxes.payableStampDuty + 1200; // +1.200 € despesas notariais/bancárias estimadas

  return {
    acquisitionPrice: price,
    appraisalValue: appraisal,
    eligiblePropertyValue: eligiblePropertyValue,
    financing: {
      maxLtvAllowedPct: maxLtvAllowedPct,
      effectiveLtvPct: effectiveLtvPct,
      maxLoanAllowed: Math.round(maxLoanAllowed),
      loanAmount: Math.round(effectiveLoan),
      minRequiredOwnCapital: Math.round(minRequiredOwnCapital),
      capitalDeficitOrSurplusEur: Math.round(capitalDeficitOrSurplus),
      maxMaturityYears: maxMaturityYears,
      estimatedMonthlyMortgageEur: estimatedMonthlyMortgage
    },
    dstiMacroprudential: {
      dstiHousingPct: dstiHousing,
      dstiTotalPct: dstiTotal,
      dstiStatus: dstiStatus,
      statusLabel: 'Referência macroprudencial do Banco de Portugal: DSTI ≤ 50%',
      explanation: explanation
    },
    fiscalTaxes: {
      standardImtEur: fiscalTaxes.standardImt,
      standardStampDutyEur: fiscalTaxes.standardStampDuty,
      imtJovemApplied: fiscalTaxes.isJovemApplied,
      payableImtEur: fiscalTaxes.payableImt,
      payableStampDutyEur: fiscalTaxes.payableStampDuty,
      imtJovemSavingsEur: fiscalTaxes.imtJovemSavings,
      stampDutySavingsEur: fiscalTaxes.stampDutySavings,
      legalReference: IMT_JOVEM_2026.legalBasis
    },
    publicGuaranteeDL44: {
      eligibleByRules: guaranteeEligibleByRules,
      ineligibilityReasons: ineligibilityReasons,
      maxGuaranteeAmountEur: maxGuaranteeAmount,
      stateGuaranteedFinancingAllowed: guaranteeEligibleByRules,
      bankApprovalNotice: 'A elegibilidade legal segundo o DL n.º 44/2024 não dispensa a avaliação de risco de crédito nem a aprovação formal pela instituição bancária mutuante.'
    },
    totalInitialDisbursementRequiredEur: Math.round(totalDisbursement)
  };
}
