// ============================================================================
// 🏛️ MIRA BUSINESS & ENTREPRENEURSHIP INTELLIGENCE ENGINE (U-BIZ-01)
// Módulo Canónico de Inteligência Fiscal, Societária e Contributiva (2026)
// Soberania Normativa, Liquidação em 6 Camadas Estanques e Auditoria Forense
// ============================================================================

// ============================================================================
// FUNÇÕES CRIPTOGRÁFICAS ISOMÓRFICAS (NODE.JS & NAVEGADOR / VITE)
// SHA-256 (FIPS 180-4) e HMAC-SHA256 (RFC 2104) 100% Determinísticos
// ============================================================================

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function sha256InternalBytes(bytes: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const originalLength = bytes.length;
  const bitLength = originalLength * 8;

  const remainder = (originalLength + 9) % 64;
  const paddingLength = remainder === 0 ? 0 : 64 - remainder;
  const totalLength = originalLength + 1 + paddingLength + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(bytes);
  padded[originalLength] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(totalLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(totalLength - 4, bitLength >>> 0, false);

  const w = new Uint32Array(64);

  for (let i = 0; i < totalLength; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^ ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^ (w[j - 15] >>> 3);
      const s1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^ ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let j = 0; j < 64; j++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + SHA256_K[j] + w[j]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const resView = new DataView(result.buffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  resView.setUint32(20, h5, false);
  resView.setUint32(24, h6, false);
  resView.setUint32(28, h7, false);
  return result;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function toUint8Array(data: Uint8Array | string | any): Uint8Array {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data);
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data && typeof data === 'object' && 'length' in data) {
    return new Uint8Array(data);
  }
  return new Uint8Array(0);
}

export function miraSha256Hex(data: Uint8Array | string | any): string {
  return bytesToHex(sha256InternalBytes(toUint8Array(data)));
}

export function miraHmacSha256Hex(keyStr: string, messageStr: string): string {
  const keyBytes = toUint8Array(keyStr);
  const msgBytes = toUint8Array(messageStr);

  const k = new Uint8Array(64);
  if (keyBytes.length > 64) {
    const hashedKey = sha256InternalBytes(keyBytes);
    k.set(hashedKey);
  } else {
    k.set(keyBytes);
  }

  const oPad = new Uint8Array(64);
  const iPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oPad[i] = k[i] ^ 0x5c;
    iPad[i] = k[i] ^ 0x36;
  }

  const inner = new Uint8Array(64 + msgBytes.length);
  inner.set(iPad);
  inner.set(msgBytes, 64);
  const innerHash = sha256InternalBytes(inner);

  const outer = new Uint8Array(64 + 32);
  outer.set(oPad);
  outer.set(innerHash, 64);
  const outerHash = sha256InternalBytes(outer);

  return bytesToHex(outerHash);
}


// ============================================================================
// 1. CONSTANTES E PARÂMETROS NORMATIVOS (OE 2026 / CIRC / CIRS / CRC / CSC / CFI)
// ============================================================================

// Taxas de IRC no Continente (Artigo 87.º do CIRC / OE 2026)
export const IRC_PME_REDUCED_BRACKET_CAP_EUR = 50_000.00;
export const IRC_PME_REDUCED_RATE_PCT = 15.0; // PME qualificada continental
export const IRC_STARTUP_REDUCED_RATE_PCT = 12.5; // Startup qualificada (Lei n.º 21/2023)
export const IRC_STANDARD_RATE_CONTINENTE_PCT = 19.0; // Taxa normal continental (redução OE 2026)

// Prejuízos Fiscais (Artigo 52.º do CIRC)
export const TAX_LOSS_MAX_DEDUCTION_PERCENTAGE = 65.0; // Limite de 65% do lucro tributável do período

// TSU MOE - Sócio-Gerente (Artigo 69.º, n.º 2 do CRC)
export const TSU_EMPLOYER_CONTRIBUTION_RATE_PCT = 23.75;
export const TSU_MANAGER_MOE_CONTRIBUTION_RATE_PCT = 11.00; // Taxa obrigatória de 11% (Art. 69.º/2 CRC)
export const TSU_TOTAL_MOE_RATE_PCT = 34.75; // 23,75% + 11,00%

// Derrama Municipal (Artigo 18.º da Lei n.º 73/2013)
export const MUNICIPAL_SURCHARGE_RATES_2026: Record<string, number> = {
  lisboa: 1.5,
  porto: 1.5,
  coimbra: 1.5,
  braga: 1.5,
  faro: 1.5,
  aveiro: 1.5,
  leiria: 1.5,
  setubal: 1.5,
  cascais: 1.5,
  oeiras: 1.5,
  sintra: 1.5,
  guimaraes: 1.5,
  matosinhos: 1.5,
  vila_nova_de_gaia: 1.5,
  funchal: 1.5,
  ponta_delgada: 1.5
};

// Segurança Social Trabalhadores Independentes / ENI (Código Contributivo)
export const SS_TI_GENERAL_CONTRIBUTION_RATE_PCT = 21.4;
export const SS_ENI_COMMERCIAL_CONTRIBUTION_RATE_PCT = 25.2;
export const SS_TI_EXPENSE_DEDUCTION_BASE_PARCEL_EUR = 4_104.00; // Parcela base do Art. 31.º/13 CIRS
export const SS_TI_MINIMUM_CONTRIBUTION_FLOOR_EUR = 20.00; // Art. 163.º/2 CRC

// IVA - Regime de Isenção dos Pequenos Retalhistas e Isenção Geral (Art. 53.º CIVA / DL 35/2025)
export const IVA_ART53_EXEMPTION_THRESHOLD_EUR = 15_000.00;

// ============================================================================
// 2. MODELO DE DADOS & INTERFACES CANÓNICAS
// ============================================================================

export type FiscalTerritory = 'continente' | 'madeira' | 'acores';
export type CorporateCategory = 'pme_qualificada' | 'startup_qualificada' | 'grande_empresa_geral';
export type CorporateLegalForm = 'sociedade_por_quotas' | 'sociedade_anonima' | 'unipessoal_lda';

export interface FiscalAdjustmentItem {
  id: string;
  description: string;
  type: 'positive_addition' | 'negative_subtraction';
  amountEur: number;
  statutoryBasis: string; // Ex: 'Art. 23.º-A CIRC (Multas e encargos não dedutíveis)'
}

export interface TaxBenefitItem {
  id: string;
  name: string;
  deductionStage: 'taxable_base_deduction' | 'tax_collection_deduction';
  amountAvailableEur: number;
  statutoryBasis: string; // Ex: 'Art. 37.º CFI (SIFIDE II DL 170/2026)'
}

// RFAI (Código Fiscal do Investimento)
export type RfaiAidedRegionTier =
  | 'regioes_fronteiricas_ou_interior' // Majorada: 30% até 15M€ e 10% no excedente (Art. 23.º/1, al. a) CFI)
  | 'outras_regioes_elegiveis';        // Conforme mapa nacional de auxílios com finalidade regional (Art. 43.º CFI)

export type RfaiAllocationPolicy =
  | 'mira_gold_optimal_preservation'   // Padrão MIRA-GOLD: consome primeiro quota standard (50%), preservando saldo trienal (100%)
  | 'strict_triennial_priority';       // Alternativa: consome primeiro as tranches trienais até ao limite da coleta

export interface RfaiInvestmentTranche {
  trancheId: string;
  investmentTaxYear: number;
  activityStartTaxYear: number;
  eligibleInvestmentExpenditureEur: number;
  regionTier: RfaiAidedRegionTier;
  statutoryCreditRatePct: number;
  generatedTaxCreditEur?: number;
  previouslyDeductedInPriorYearsEur: number;
  currentAvailableCarryforwardEur: number;
  statutoryFiscalDossierRefId: string; // Artigo 25.º CFI e Artigo 130.º CIRC
  hasCertifiedTechnicalReport?: boolean;
  certifyingRocNumber?: string;
}

export interface RfaiLiquidationResult {
  totalRfaiDeductedCurrentPeriodEur: number;
  remainingCarryforwardTotalEur: number;
  remainingStandardCapacityEur: number;
  remainingTotalCapacityEur: number;
  appliedPolicy: RfaiAllocationPolicy;
  detailedTrancheAllocations: Array<{
    trancheId: string;
    investmentTaxYear: number;
    isTriennialInvestment: boolean;
    statutoryCapPercentage: 100.0 | 50.0;
    deductedInPeriodEur: number;
    carriedForwardEur: number;
    isExpired: boolean;
  }>;
}

// Tributações Autónomas (Artigo 88.º do CIRC)
export type VehicleEngineType =
  | 'internal_combustion'
  | 'plug_in_hybrid_phev'
  | 'battery_electric_bev';

export interface AutonomousTaxVehicleItem {
  vehicleId: string;
  engineType: VehicleEngineType;
  acquisitionCostEur: number;
  acquisitionYear: number;
  electricAutonomyKm?: number;
  co2EmissionsGramsPerKm?: number;
  emissionStandard?: 'EURO_6E_BIS' | 'OTHER';
  homologationIngestionReceiptId?: string; // ID do recibo de ingestão autenticado para validação do benefício PHEV
}

export interface AutonomousTaxInput {
  vehicles?: AutonomousTaxVehicleItem[];
  representationExpensesEur?: number;
  undocumentedExpensesEur?: number;
  nonInvoicedPerDiemAndMileageEur?: number;
}

// Liquidação Corporativa em 6 Camadas
export interface CorporateLiquidationInput {
  taxYear: number;
  fiscalTerritory: FiscalTerritory;
  corporateCategory: CorporateCategory;
  corporateLegalForm: CorporateLegalForm;
  municipalityCode?: string;
  isMultiMunicipality?: boolean;
  
  // Camada 1: RAI Contabilístico
  accountingProfitBeforeTaxEur: number;
  turnoverEur?: number;
  operatingExpensesExcludingStaffEur?: number;
  managerProLaboreAnnualEur?: number;
  employerTsuAnnualEur?: number;

  // Camada 2: Ajustamentos Fiscais
  fiscalAdjustments?: FiscalAdjustmentItem[];

  // Camada 3: Matéria Coletável
  priorTaxLossesAvailableEur?: number;
  taxableBaseDeductions?: TaxBenefitItem[];

  // Camada 5: Deduções à Coleta
  rfaiTranches?: RfaiInvestmentTranche[];
  rfaiAllocationPolicy?: RfaiAllocationPolicy;
  otherCollectionDeductions?: TaxBenefitItem[];
  foreignTaxCreditsEur?: number;

  // Camada 6: Tributações Autónomas
  autonomousTaxInput?: AutonomousTaxInput;
  hasTaxLossInPeriodOverride?: boolean; // Para majoração de TA (Art. 88.º/14)
}

export interface CorporateLiquidationAssessmentResult {
  dataStatus: 'official' | 'insufficient' | 'safe_fail';
  safeFailReason?: string;
  
  // 6 Camadas Estanques
  layer1_accountingProfitBeforeTaxEur: number;
  layer1_reconciliationFlag: boolean;
  layer1_reconciliationDeltaEur: number;

  layer2_taxableProfitEur: number;
  layer2_totalPositiveAdjustmentsEur: number;
  layer2_totalNegativeAdjustmentsEur: number;

  layer3_taxableBaseMateriaColetavelEur: number;
  layer3_deductedTaxLossesEur: number;
  layer3_unusedTaxLossesCarriedForwardEur: number;
  layer3_otherTaxableBaseDeductionsEur: number;

  layer4_baseColetaIrcEur: number;
  layer4_firstBracketTaxEur: number;
  layer4_secondBracketTaxEur: number;
  layer4_appliedMarginalRatePct: number;

  layer5_netIrcEur: number;
  layer5_rfaiDeductionDetails?: RfaiLiquidationResult;
  layer5_totalCollectionDeductionsEur: number;
  layer5_foreignTaxCreditDeductedEur: number;

  layer6_totalFinalAssessmentDueEur: number;
  layer6_netIrcTransitedEur: number;
  layer6_derramaMunicipalEur: number;
  layer6_derramaRatePct: number;
  layer6_autonomousTaxesTotalEur: number;
  layer6_autonomousTaxesDetailed: Array<{
    category: string;
    taxableAmountEur: number;
    statutoryRatePct: number;
    taxDueEur: number;
    status: string;
  }>;
}

// Dividendos e Código das Sociedades Comerciais
export interface DividendDistributionInput {
  corporateForm: CorporateLegalForm;
  netProfitOfExerciseEur: number;
  shareCapitalEur: number;
  legalReserveBalanceInitialEur: number;
  retainedEarningsBalanceEur: number; // Positivo (reservas livres) ou negativo (perdas transitadas)
  unrealizedFairValueReservesEur?: number;
  unrealizedEquityMethodReservesEur?: number;
  unrealizedDevelopmentExpensesEur?: number; // Despesas de constituição ou I&D (Art. 33.º/2)
  equitySituationTotalEur?: number;
  requestedDistributionAmountEur?: number;
  distributionOption: 'mandatory_fifty_percent' | 'full_retention' | 'full_distribution' | 'custom_amount';
  hasStatutoryDistributionWaiver: boolean; // Cláusula ou deliberação por maioria de 3/4 (Arts. 217.º/1 e 294.º/1)
  shareholderTaxOption?: 'flat_withholding_28' | 'aggregate_taxation_category_e';
}

export interface DividendDistributionResult {
  dataStatus: 'official' | 'insufficient' | 'safe_fail';
  safeFailReason?: string;
  legalReserveMandatoryAllocationEur: number;
  legalReserveTargetCapEur: number;
  legalReserveFinalBalanceEur: number;
  unrealizedCapitalImpairmentEur: number;
  distributableProfitGlobalMaxEur: number;
  mandatoryMinimumDistributionFiftyPctEur: number;
  statutoryDistributionAllowed: boolean;
  finalDistributedAmountEur: number;
  retainedForReservesEur: number;
  shareholderTaxWithholdingEur: number;
  shareholderEffectiveIncomeEur: number;
}

// Ingestão Forense e Recibos Criptográficos
export interface IngestionAuditReceipt {
  receiptId: string;
  sourceUrl: string;
  httpStatus: 200;
  responseTimestampIso: string;
  contentLengthBytes: number;
  canonicalSha256Digest: string;
  documentVersion: string;
  rawPayloadVerifiedByCollector: boolean;
  hmacSignature: string;
}

export interface NormativeRuleProvenance {
  ruleId: string;
  legalBasis: string;
  sourceDocument: string;
  sourceUrl: string;
  sourceVersion: string;
  ingestionReceiptId?: string;
  payloadDigestHex: string;
  verificationStatus: 'verified' | 'unverified_declared_digest' | 'digest_mismatch' | 'tampered_receipt' | 'provisional';
}

// ============================================================================
// 3. SUBSISTEMA FORENSE DE INGESTÃO (NÍVEL 1 E NÍVEL 2)
// ============================================================================

export class IngestionProvenanceSubEngine {
  private receiptLedger: Map<string, IngestionAuditReceipt> = new Map();
  private auditVerificationSecret: string;

  constructor(auditVerificationSecret: string = 'mira_gold_default_sovereign_audit_secret_2026') {
    this.auditVerificationSecret = auditVerificationSecret;
  }

  public registerIngestionReceipt(receipt: IngestionAuditReceipt): void {
    this.receiptLedger.set(receipt.receiptId, receipt);
  }

  public createSignedReceiptFromCollectorBytes(
    sourceUrl: string,
    rawBytes: Uint8Array | any,
    documentVersion: string
  ): IngestionAuditReceipt {
    const receiptId = `RCPT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const canonicalSha256Digest = miraSha256Hex(rawBytes);
    const responseTimestampIso = new Date().toISOString();
    const httpStatus = 200 as const;
    const payloadToSign = `${receiptId}:${sourceUrl}:${canonicalSha256Digest}:${httpStatus}:${responseTimestampIso}:${documentVersion}`;
    const hmacSignature = miraHmacSha256Hex(this.auditVerificationSecret, payloadToSign);

    const receipt: IngestionAuditReceipt = {
      receiptId,
      sourceUrl,
      httpStatus,
      responseTimestampIso,
      contentLengthBytes: rawBytes.length,
      canonicalSha256Digest,
      documentVersion,
      rawPayloadVerifiedByCollector: true,
      hmacSignature
    };

    this.registerIngestionReceipt(receipt);
    return receipt;
  }

  public verifyNormativeProvenance(rule: NormativeRuleProvenance): NormativeRuleProvenance['verificationStatus'] {
    if (!rule.ingestionReceiptId || !this.receiptLedger.has(rule.ingestionReceiptId)) {
      return 'unverified_declared_digest';
    }

    const receipt = this.receiptLedger.get(rule.ingestionReceiptId)!;

    // 1. Validação Criptográfica da Assinatura HMAC do Recibo
    const payloadToSign = `${receipt.receiptId}:${receipt.sourceUrl}:${receipt.canonicalSha256Digest}:${receipt.httpStatus}:${receipt.responseTimestampIso}:${receipt.documentVersion}`;
    const expectedHmac = miraHmacSha256Hex(this.auditVerificationSecret, payloadToSign);

    if (receipt.hmacSignature.toLowerCase() !== expectedHmac.toLowerCase()) {
      return 'tampered_receipt';
    }

    // 2. Validação da Origem Institucional Whitelisted
    const isOfficialDomain = /^https:\/\/(diariodarepublica\.pt|dre\.pt|info\.portaldasfinancas\.gov\.pt|www\.seg-social\.pt)\//.test(receipt.sourceUrl);
    if (!isOfficialDomain || receipt.sourceUrl !== rule.sourceUrl) {
      return 'provisional';
    }

    // 3. Validação do Digest e da Versão Documental
    if (
      receipt.canonicalSha256Digest.toLowerCase() !== rule.payloadDigestHex.toLowerCase() ||
      receipt.documentVersion !== rule.sourceVersion
    ) {
      return 'digest_mismatch';
    }

    // 4. Validação de Consulta Fática Efetiva pelo Coletor
    if (!receipt.rawPayloadVerifiedByCollector) {
      return 'provisional';
    }

    return 'verified';
  }

  public hasValidReceiptForUrlAndDigest(receiptId: string, expectedDigest: string): boolean {
    if (!this.receiptLedger.has(receiptId)) return false;
    const rcpt = this.receiptLedger.get(receiptId)!;
    const ruleMock: NormativeRuleProvenance = {
      ruleId: 'CHECK',
      legalBasis: 'VERIFICATION',
      sourceDocument: 'LEGAL',
      sourceUrl: rcpt.sourceUrl,
      sourceVersion: rcpt.documentVersion,
      ingestionReceiptId: receiptId,
      payloadDigestHex: expectedDigest,
      verificationStatus: 'verified'
    };
    return this.verifyNormativeProvenance(ruleMock) === 'verified';
  }
}

// ============================================================================
// 4. SUBMOTOR RFAI: POLÍTICA MIRA-GOLD & DETERMINISMO CONCORRENTE
// ============================================================================

function compareTranchesFifo(a: RfaiInvestmentTranche, b: RfaiInvestmentTranche): number {
  const expiryA = a.investmentTaxYear + 10;
  const expiryB = b.investmentTaxYear + 10;
  if (expiryA !== expiryB) {
    return expiryA - expiryB;
  }
  return a.trancheId.localeCompare(b.trancheId);
}

export function calculateRfaiDeduction(
  tranches: RfaiInvestmentTranche[],
  currentTaxYear: number,
  coletaBaseEur: number,
  policy: RfaiAllocationPolicy = 'mira_gold_optimal_preservation'
): RfaiLiquidationResult {
  // 1. Recálculo e Validação Soberana de Todas as Tranches
  for (const tranche of tranches) {
    const expectedCredit = Number(((tranche.eligibleInvestmentExpenditureEur * tranche.statutoryCreditRatePct) / 100).toFixed(2));
    if (tranche.generatedTaxCreditEur !== undefined && Math.abs(tranche.generatedTaxCreditEur - expectedCredit) > 0.01) {
      throw new Error(`inconsistent_rfai_credit_input: tranche ${tranche.trancheId} declarou ${tranche.generatedTaxCreditEur}€ mas cálculo apura ${expectedCredit}€`);
    }
    const maxPossibleCarryforward = Number((expectedCredit - tranche.previouslyDeductedInPriorYearsEur).toFixed(2));
    if (tranche.currentAvailableCarryforwardEur > maxPossibleCarryforward + 0.01) {
      throw new Error(`inconsistent_rfai_carryforward_input: saldo de ${tranche.currentAvailableCarryforwardEur}€ excede o histórico possível de ${maxPossibleCarryforward}€`);
    }
  }

  // 2. Segregação e Ordenação FIFO das Tranches
  const expiredTranches: RfaiLiquidationResult['detailedTrancheAllocations'] = [];
  const validTranches: RfaiInvestmentTranche[] = [];

  for (const tranche of tranches) {
    const yearsSinceInvestment = currentTaxYear - tranche.investmentTaxYear;
    if (yearsSinceInvestment > 10 || yearsSinceInvestment < 0) {
      expiredTranches.push({
        trancheId: tranche.trancheId,
        investmentTaxYear: tranche.investmentTaxYear,
        isTriennialInvestment: false,
        statutoryCapPercentage: 50.0,
        deductedInPeriodEur: 0,
        carriedForwardEur: 0,
        isExpired: true
      });
    } else {
      validTranches.push(tranche);
    }
  }

  const standardTranches = validTranches
    .filter(t => (t.investmentTaxYear - t.activityStartTaxYear) < 0 || (t.investmentTaxYear - t.activityStartTaxYear) > 2)
    .sort(compareTranchesFifo);

  const triennialTranches = validTranches
    .filter(t => (t.investmentTaxYear - t.activityStartTaxYear) >= 0 && (t.investmentTaxYear - t.activityStartTaxYear) <= 2)
    .sort(compareTranchesFifo);

  let standardCapacity = Number(((coletaBaseEur * 50.0) / 100).toFixed(2));
  let totalCollectionHeadroom = coletaBaseEur;
  let totalDeducted = 0;
  let totalRemainingCarryforward = 0;
  const allocationsMap = new Map<string, RfaiLiquidationResult['detailedTrancheAllocations'][0]>();

  if (policy === 'mira_gold_optimal_preservation') {
    // Esgota prioritariamente a quota standard de 50%, preservando os créditos trienais de teto 100%
    for (const tranche of standardTranches) {
      const usable = Math.min(tranche.currentAvailableCarryforwardEur, standardCapacity, totalCollectionHeadroom);
      const deducted = Number(usable.toFixed(2));
      const carriedForward = Number((tranche.currentAvailableCarryforwardEur - deducted).toFixed(2));

      standardCapacity = Number((standardCapacity - deducted).toFixed(2));
      totalCollectionHeadroom = Number((totalCollectionHeadroom - deducted).toFixed(2));
      totalDeducted = Number((totalDeducted + deducted).toFixed(2));
      totalRemainingCarryforward = Number((totalRemainingCarryforward + carriedForward).toFixed(2));

      allocationsMap.set(tranche.trancheId, {
        trancheId: tranche.trancheId,
        investmentTaxYear: tranche.investmentTaxYear,
        isTriennialInvestment: false,
        statutoryCapPercentage: 50.0,
        deductedInPeriodEur: deducted,
        carriedForwardEur: carriedForward,
        isExpired: false
      });
    }

    for (const tranche of triennialTranches) {
      const usable = Math.min(tranche.currentAvailableCarryforwardEur, totalCollectionHeadroom);
      const deducted = Number(usable.toFixed(2));
      const carriedForward = Number((tranche.currentAvailableCarryforwardEur - deducted).toFixed(2));

      totalCollectionHeadroom = Number((totalCollectionHeadroom - deducted).toFixed(2));
      standardCapacity = Math.min(standardCapacity, totalCollectionHeadroom);
      totalDeducted = Number((totalDeducted + deducted).toFixed(2));
      totalRemainingCarryforward = Number((totalRemainingCarryforward + carriedForward).toFixed(2));

      allocationsMap.set(tranche.trancheId, {
        trancheId: tranche.trancheId,
        investmentTaxYear: tranche.investmentTaxYear,
        isTriennialInvestment: true,
        statutoryCapPercentage: 100.0,
        deductedInPeriodEur: deducted,
        carriedForwardEur: carriedForward,
        isExpired: false
      });
    }
  } else {
    // Política Alternativa: Consome prioritariamente as tranches trienais
    for (const tranche of triennialTranches) {
      const usable = Math.min(tranche.currentAvailableCarryforwardEur, totalCollectionHeadroom);
      const deducted = Number(usable.toFixed(2));
      const carriedForward = Number((tranche.currentAvailableCarryforwardEur - deducted).toFixed(2));

      totalCollectionHeadroom = Number((totalCollectionHeadroom - deducted).toFixed(2));
      standardCapacity = Math.min(standardCapacity, totalCollectionHeadroom);
      totalDeducted = Number((totalDeducted + deducted).toFixed(2));
      totalRemainingCarryforward = Number((totalRemainingCarryforward + carriedForward).toFixed(2));

      allocationsMap.set(tranche.trancheId, {
        trancheId: tranche.trancheId,
        investmentTaxYear: tranche.investmentTaxYear,
        isTriennialInvestment: true,
        statutoryCapPercentage: 100.0,
        deductedInPeriodEur: deducted,
        carriedForwardEur: carriedForward,
        isExpired: false
      });
    }

    for (const tranche of standardTranches) {
      const usable = Math.min(tranche.currentAvailableCarryforwardEur, standardCapacity, totalCollectionHeadroom);
      const deducted = Number(usable.toFixed(2));
      const carriedForward = Number((tranche.currentAvailableCarryforwardEur - deducted).toFixed(2));

      standardCapacity = Number((standardCapacity - deducted).toFixed(2));
      totalCollectionHeadroom = Number((totalCollectionHeadroom - deducted).toFixed(2));
      totalDeducted = Number((totalDeducted + deducted).toFixed(2));
      totalRemainingCarryforward = Number((totalRemainingCarryforward + carriedForward).toFixed(2));

      allocationsMap.set(tranche.trancheId, {
        trancheId: tranche.trancheId,
        investmentTaxYear: tranche.investmentTaxYear,
        isTriennialInvestment: false,
        statutoryCapPercentage: 50.0,
        deductedInPeriodEur: deducted,
        carriedForwardEur: carriedForward,
        isExpired: false
      });
    }
  }

  // Preservação da ordem original fornecida pelo chamador
  const detailedTrancheAllocations: RfaiLiquidationResult['detailedTrancheAllocations'] = [];
  for (const t of tranches) {
    if (allocationsMap.has(t.trancheId)) {
      detailedTrancheAllocations.push(allocationsMap.get(t.trancheId)!);
    }
  }
  detailedTrancheAllocations.push(...expiredTranches);

  return {
    totalRfaiDeductedCurrentPeriodEur: totalDeducted,
    remainingCarryforwardTotalEur: totalRemainingCarryforward,
    remainingStandardCapacityEur: standardCapacity,
    remainingTotalCapacityEur: totalCollectionHeadroom,
    appliedPolicy: policy,
    detailedTrancheAllocations
  };
}

// ============================================================================
// 5. SUBMOTOR DE LIQUIDAÇÃO DE IRC EM 6 CAMADAS ESTANQUES
// ============================================================================

export class CorporateIrcSubEngine {
  private provenanceEngine: IngestionProvenanceSubEngine;

  constructor(provenanceEngine?: IngestionProvenanceSubEngine) {
    this.provenanceEngine = provenanceEngine || new IngestionProvenanceSubEngine();
  }

  public calculateLiquidation(input: CorporateLiquidationInput): CorporateLiquidationAssessmentResult {
    // 0. Safe-fail: Regiões Autónomas (sem fallback silencioso)
    if (input.fiscalTerritory !== 'continente') {
      return this.buildSafeFailResult(input, 'unsupported_tax_territory');
    }

    if (input.isMultiMunicipality) {
      return this.buildSafeFailResult(input, 'unsupported_multimunicipality');
    }

    // Camada 1: Resultado Contabilístico Primário (RAI Soberano)
    const rai = Number(input.accountingProfitBeforeTaxEur.toFixed(2));
    let reconciliationFlag = false;
    let reconciliationDelta = 0;

    if (
      input.turnoverEur !== undefined &&
      input.operatingExpensesExcludingStaffEur !== undefined &&
      input.managerProLaboreAnnualEur !== undefined &&
      input.employerTsuAnnualEur !== undefined
    ) {
      const derivedRai = Number((
        input.turnoverEur -
        input.operatingExpensesExcludingStaffEur -
        input.managerProLaboreAnnualEur -
        input.employerTsuAnnualEur
      ).toFixed(2));
      reconciliationDelta = Number(Math.abs(rai - derivedRai).toFixed(2));
      if (reconciliationDelta > 0.05) {
        reconciliationFlag = true;
      }
    }

    // Camada 2: Determinação do Lucro Tributável (Artigo 17.º CIRC)
    let positiveAdjustments = 0;
    let negativeAdjustments = 0;

    if (input.fiscalAdjustments && input.fiscalAdjustments.length > 0) {
      for (const adj of input.fiscalAdjustments) {
        if (adj.type === 'positive_addition') {
          positiveAdjustments += adj.amountEur;
        } else if (adj.type === 'negative_subtraction') {
          negativeAdjustments += adj.amountEur;
        }
      }
    }

    positiveAdjustments = Number(positiveAdjustments.toFixed(2));
    negativeAdjustments = Number(negativeAdjustments.toFixed(2));
    const taxableProfit = Number((rai + positiveAdjustments - negativeAdjustments).toFixed(2));

    // Camada 3: Determinação da Matéria Coletável (Artigo 15.º CIRC)
    let deductedTaxLosses = 0;
    let unusedTaxLossesCarriedForward = Number((input.priorTaxLossesAvailableEur || 0).toFixed(2));
    let otherTaxableBaseDeductions = 0;

    if (taxableProfit > 0 && unusedTaxLossesCarriedForward > 0) {
      const maxLossDeduction = Number(((taxableProfit * TAX_LOSS_MAX_DEDUCTION_PERCENTAGE) / 100).toFixed(2));
      deductedTaxLosses = Math.min(unusedTaxLossesCarriedForward, maxLossDeduction);
      deductedTaxLosses = Number(deductedTaxLosses.toFixed(2));
      unusedTaxLossesCarriedForward = Number((unusedTaxLossesCarriedForward - deductedTaxLosses).toFixed(2));
    }

    if (input.taxableBaseDeductions && input.taxableBaseDeductions.length > 0) {
      for (const d of input.taxableBaseDeductions) {
        if (d.deductionStage === 'taxable_base_deduction') {
          otherTaxableBaseDeductions += d.amountAvailableEur;
        }
      }
      otherTaxableBaseDeductions = Number(otherTaxableBaseDeductions.toFixed(2));
    }

    const materiaColetavel = Math.max(0, Number((taxableProfit - deductedTaxLosses - otherTaxableBaseDeductions).toFixed(2)));

    // Camada 4: Determinação da Coleta Base de IRC (Artigo 87.º CIRC / OE 2026)
    let firstBracketTax = 0;
    let secondBracketTax = 0;
    let appliedMarginalRate = IRC_STANDARD_RATE_CONTINENTE_PCT;

    if (materiaColetavel > 0) {
      if (input.corporateCategory === 'grande_empresa_geral') {
        firstBracketTax = Number(((materiaColetavel * IRC_STANDARD_RATE_CONTINENTE_PCT) / 100).toFixed(2));
        appliedMarginalRate = IRC_STANDARD_RATE_CONTINENTE_PCT;
      } else {
        const reducedRate = input.corporateCategory === 'startup_qualificada'
          ? IRC_STARTUP_REDUCED_RATE_PCT
          : IRC_PME_REDUCED_RATE_PCT;

        const firstBracketBase = Math.min(materiaColetavel, IRC_PME_REDUCED_BRACKET_CAP_EUR);
        const secondBracketBase = Math.max(0, materiaColetavel - IRC_PME_REDUCED_BRACKET_CAP_EUR);

        firstBracketTax = Number(((firstBracketBase * reducedRate) / 100).toFixed(2));
        secondBracketTax = Number(((secondBracketBase * IRC_STANDARD_RATE_CONTINENTE_PCT) / 100).toFixed(2));
        appliedMarginalRate = secondBracketBase > 0 ? IRC_STANDARD_RATE_CONTINENTE_PCT : reducedRate;
      }
    }

    const baseColetaIrc = Number((firstBracketTax + secondBracketTax).toFixed(2));

    // Camada 5: Deduções à Coleta & Apuramento do IRC Líquido (Art. 90.º CIRC e CFI)
    let rfaiLiquidation: RfaiLiquidationResult | undefined;
    let totalCollectionDeductions = 0;

    if (baseColetaIrc > 0 && input.rfaiTranches && input.rfaiTranches.length > 0) {
      rfaiLiquidation = calculateRfaiDeduction(
        input.rfaiTranches,
        input.taxYear,
        baseColetaIrc,
        input.rfaiAllocationPolicy || 'mira_gold_optimal_preservation'
      );
      totalCollectionDeductions += rfaiLiquidation.totalRfaiDeductedCurrentPeriodEur;
    }

    if (input.otherCollectionDeductions && input.otherCollectionDeductions.length > 0) {
      const remainingHeadroom = Math.max(0, baseColetaIrc - totalCollectionDeductions);
      for (const b of input.otherCollectionDeductions) {
        if (b.deductionStage === 'tax_collection_deduction') {
          const usable = Math.min(b.amountAvailableEur, remainingHeadroom);
          totalCollectionDeductions += usable;
        }
      }
    }

    let foreignTaxCreditDeducted = 0;
    if (input.foreignTaxCreditsEur && input.foreignTaxCreditsEur > 0) {
      const headroomForCredit = Math.max(0, baseColetaIrc - totalCollectionDeductions);
      foreignTaxCreditDeducted = Math.min(input.foreignTaxCreditsEur, headroomForCredit);
      totalCollectionDeductions += foreignTaxCreditDeducted;
    }

    totalCollectionDeductions = Number(totalCollectionDeductions.toFixed(2));
    const netIrc = Math.max(0, Number((baseColetaIrc - totalCollectionDeductions).toFixed(2)));

    // Camada 6: Liquidação Final Unificada (CIRC e Lei n.º 73/2013)
    let derramaRatePct = 0;
    let derramaMunicipalEur = 0;

    if (input.municipalityCode) {
      const normMunicipality = input.municipalityCode.toLowerCase().trim();
      if (MUNICIPAL_SURCHARGE_RATES_2026[normMunicipality] !== undefined) {
        derramaRatePct = MUNICIPAL_SURCHARGE_RATES_2026[normMunicipality];
        derramaMunicipalEur = Number(((materiaColetavel * derramaRatePct) / 100).toFixed(2));
      } else {
        return this.buildSafeFailResult(input, 'municipality_rate_not_found');
      }
    }

    // Tributações Autónomas (Art. 88.º CIRC)
    const hasTaxLossInPeriod = input.hasTaxLossInPeriodOverride !== undefined
      ? input.hasTaxLossInPeriodOverride
      : (taxableProfit < 0);

    const autonomousTaxesDetailed: CorporateLiquidationAssessmentResult['layer6_autonomousTaxesDetailed'] = [];
    let autonomousTaxesTotal = 0;

    if (input.autonomousTaxInput?.vehicles && input.autonomousTaxInput.vehicles.length > 0) {
      for (const vehicle of input.autonomousTaxInput.vehicles) {
        const vResult = this.evaluateVehicleAutonomousTax(vehicle, hasTaxLossInPeriod, input.taxYear);
        autonomousTaxesDetailed.push(vResult);
        autonomousTaxesTotal += vResult.taxDueEur;
      }
    }

    if (input.autonomousTaxInput?.representationExpensesEur && input.autonomousTaxInput.representationExpensesEur > 0) {
      const rate = hasTaxLossInPeriod ? 20.0 : 10.0;
      const tax = Number(((input.autonomousTaxInput.representationExpensesEur * rate) / 100).toFixed(2));
      autonomousTaxesDetailed.push({
        category: 'Despesas de Representação (Art. 88.º/7 CIRC)',
        taxableAmountEur: input.autonomousTaxInput.representationExpensesEur,
        statutoryRatePct: rate,
        taxDueEur: tax,
        status: hasTaxLossInPeriod ? 'tax_loss_surcharged' : 'standard_rate'
      });
      autonomousTaxesTotal += tax;
    }

    if (input.autonomousTaxInput?.undocumentedExpensesEur && input.autonomousTaxInput.undocumentedExpensesEur > 0) {
      const rate = hasTaxLossInPeriod ? 60.0 : 50.0; // Art. 88.º/1 e n.º 14
      const tax = Number(((input.autonomousTaxInput.undocumentedExpensesEur * rate) / 100).toFixed(2));
      autonomousTaxesDetailed.push({
        category: 'Despesas Não Documentadas (Art. 88.º/1 CIRC)',
        taxableAmountEur: input.autonomousTaxInput.undocumentedExpensesEur,
        statutoryRatePct: rate,
        taxDueEur: tax,
        status: 'undocumented_penalty_rate'
      });
      autonomousTaxesTotal += tax;
    }

    if (input.autonomousTaxInput?.nonInvoicedPerDiemAndMileageEur && input.autonomousTaxInput.nonInvoicedPerDiemAndMileageEur > 0) {
      const rate = hasTaxLossInPeriod ? 15.0 : 5.0; // Art. 88.º/9 e n.º 14
      const tax = Number(((input.autonomousTaxInput.nonInvoicedPerDiemAndMileageEur * rate) / 100).toFixed(2));
      autonomousTaxesDetailed.push({
        category: 'Ajudas de Custo e Compensação por Km (Art. 88.º/9 CIRC)',
        taxableAmountEur: input.autonomousTaxInput.nonInvoicedPerDiemAndMileageEur,
        statutoryRatePct: rate,
        taxDueEur: tax,
        status: hasTaxLossInPeriod ? 'tax_loss_surcharged' : 'standard_rate'
      });
      autonomousTaxesTotal += tax;
    }

    autonomousTaxesTotal = Number(autonomousTaxesTotal.toFixed(2));
    const totalFinalAssessmentDue = Number((netIrc + derramaMunicipalEur + autonomousTaxesTotal).toFixed(2));

    return {
      dataStatus: 'official',
      layer1_accountingProfitBeforeTaxEur: rai,
      layer1_reconciliationFlag: reconciliationFlag,
      layer1_reconciliationDeltaEur: reconciliationDelta,
      layer2_taxableProfitEur: taxableProfit,
      layer2_totalPositiveAdjustmentsEur: positiveAdjustments,
      layer2_totalNegativeAdjustmentsEur: negativeAdjustments,
      layer3_taxableBaseMateriaColetavelEur: materiaColetavel,
      layer3_deductedTaxLossesEur: deductedTaxLosses,
      layer3_unusedTaxLossesCarriedForwardEur: unusedTaxLossesCarriedForward,
      layer3_otherTaxableBaseDeductionsEur: otherTaxableBaseDeductions,
      layer4_baseColetaIrcEur: baseColetaIrc,
      layer4_firstBracketTaxEur: firstBracketTax,
      layer4_secondBracketTaxEur: secondBracketTax,
      layer4_appliedMarginalRatePct: appliedMarginalRate,
      layer5_netIrcEur: netIrc,
      layer5_rfaiDeductionDetails: rfaiLiquidation,
      layer5_totalCollectionDeductionsEur: totalCollectionDeductions,
      layer5_foreignTaxCreditDeductedEur: foreignTaxCreditDeducted,
      layer6_totalFinalAssessmentDueEur: totalFinalAssessmentDue,
      layer6_netIrcTransitedEur: netIrc,
      layer6_derramaMunicipalEur: derramaMunicipalEur,
      layer6_derramaRatePct: derramaRatePct,
      layer6_autonomousTaxesTotalEur: autonomousTaxesTotal,
      layer6_autonomousTaxesDetailed: autonomousTaxesDetailed
    };
  }

  private evaluateVehicleAutonomousTax(
    vehicle: AutonomousTaxVehicleItem,
    hasTaxLossInPeriod: boolean,
    taxYear: number
  ): CorporateLiquidationAssessmentResult['layer6_autonomousTaxesDetailed'][0] {
    const cost = vehicle.acquisitionCostEur;
    const isStartYear = (vehicle.acquisitionYear === taxYear);

    // 1. BEV (100% Elétrico) - Artigo 88.º, n.º 19 do CIRC
    if (vehicle.engineType === 'battery_electric_bev') {
      if (cost <= 62_500.00) {
        return {
          category: `BEV Elétrico (<= 62.500€) - ${vehicle.vehicleId}`,
          taxableAmountEur: cost,
          statutoryRatePct: 0.0,
          taxDueEur: 0.0,
          status: 'exempt_art88_19'
        };
      } else {
        const rate = 10.0;
        const tax = Number(((cost * rate) / 100).toFixed(2));
        return {
          category: `BEV Elétrico (> 62.500€) - ${vehicle.vehicleId}`,
          taxableAmountEur: cost,
          statutoryRatePct: rate,
          taxDueEur: tax,
          status: 'standard_bev_bracket'
        };
      }
    }

    // 2. PHEV (Híbrido Plug-in) - Artigo 88.º, n.º 18 do CIRC (OE 2026)
    if (vehicle.engineType === 'plug_in_hybrid_phev') {
      const autonomyOk = (vehicle.electricAutonomyKm || 0) >= 50;
      const traditionalCo2Ok = (vehicle.co2EmissionsGramsPerKm || 0) < 50;
      const euro6eBisCo2Ok = vehicle.emissionStandard === 'EURO_6E_BIS' && (vehicle.co2EmissionsGramsPerKm || 0) <= 80;
      const qualifiesNormatively = autonomyOk && (traditionalCo2Ok || euro6eBisCo2Ok);

      // Verificação Criptográfica do Recibo de Homologação no Ledger
      const hasReceipt = Boolean(
        vehicle.homologationIngestionReceiptId &&
        this.provenanceEngine.hasValidReceiptForUrlAndDigest(
          vehicle.homologationIngestionReceiptId,
          miraSha256Hex(vehicle.vehicleId)
        )
      );

      if (qualifiesNormatively && hasReceipt) {
        let rate = 2.5;
        if (cost > 37_500.00 && cost <= 45_000.00) rate = 7.5;
        else if (cost > 45_000.00) rate = 15.0;

        const tax = Number(((cost * rate) / 100).toFixed(2));
        return {
          category: `PHEV Reduzido Autenticado (Art. 88.º/18) - ${vehicle.vehicleId}`,
          taxableAmountEur: cost,
          statutoryRatePct: rate,
          taxDueEur: tax,
          status: 'reduced_rate_validated'
        };
      }

      // Safe-fail: Não cumpre requisitos técnicos ou sem recibo autenticado -> Aplica taxa ordinária
      const ordinaryRate = this.getOrdinaryVehicleBracketRate(cost, hasTaxLossInPeriod, isStartYear);
      const tax = Number(((cost * ordinaryRate) / 100).toFixed(2));
      return {
        category: `PHEV Enquadramento Ordinário (Sem Homologação Validada) - ${vehicle.vehicleId}`,
        taxableAmountEur: cost,
        statutoryRatePct: ordinaryRate,
        taxDueEur: tax,
        status: 'reduced_rate_not_validated'
      };
    }

    // 3. Combustão Ordinária - Artigo 88.º, n.º 3 do CIRC
    const rate = this.getOrdinaryVehicleBracketRate(cost, hasTaxLossInPeriod, isStartYear);
    const tax = Number(((cost * rate) / 100).toFixed(2));
    return {
      category: `Viatura Combustão Ordinária (Art. 88.º/3) - ${vehicle.vehicleId}`,
      taxableAmountEur: cost,
      statutoryRatePct: rate,
      taxDueEur: tax,
      status: hasTaxLossInPeriod && !isStartYear ? 'tax_loss_surcharged' : 'standard_bracket'
    };
  }

  private getOrdinaryVehicleBracketRate(cost: number, hasTaxLossInPeriod: boolean, isStartYear: boolean): number {
    const surcharge = (hasTaxLossInPeriod && !isStartYear) ? 10.0 : 0.0;
    if (cost <= 37_500.00) return 8.0 + surcharge;
    if (cost <= 45_000.00) return 25.0 + surcharge;
    return 32.0 + surcharge;
  }

  private buildSafeFailResult(input: CorporateLiquidationInput, reason: string): CorporateLiquidationAssessmentResult {
    return {
      dataStatus: 'safe_fail',
      safeFailReason: reason,
      layer1_accountingProfitBeforeTaxEur: input.accountingProfitBeforeTaxEur,
      layer1_reconciliationFlag: false,
      layer1_reconciliationDeltaEur: 0,
      layer2_taxableProfitEur: 0,
      layer2_totalPositiveAdjustmentsEur: 0,
      layer2_totalNegativeAdjustmentsEur: 0,
      layer3_taxableBaseMateriaColetavelEur: 0,
      layer3_deductedTaxLossesEur: 0,
      layer3_unusedTaxLossesCarriedForwardEur: 0,
      layer3_otherTaxableBaseDeductionsEur: 0,
      layer4_baseColetaIrcEur: 0,
      layer4_firstBracketTaxEur: 0,
      layer4_secondBracketTaxEur: 0,
      layer4_appliedMarginalRatePct: 0,
      layer5_netIrcEur: 0,
      layer5_totalCollectionDeductionsEur: 0,
      layer5_foreignTaxCreditDeductedEur: 0,
      layer6_totalFinalAssessmentDueEur: 0,
      layer6_netIrcTransitedEur: 0,
      layer6_derramaMunicipalEur: 0,
      layer6_derramaRatePct: 0,
      layer6_autonomousTaxesTotalEur: 0,
      layer6_autonomousTaxesDetailed: []
    };
  }
}

// ============================================================================
// 6. SUBMOTOR DE DISTRIBUIÇÃO DE DIVIDENDOS (CÓDIGO DAS SOCIEDADES COMERCIAIS)
// ============================================================================

export class DividendDistributionSubEngine {
  public calculateDistribution(input: DividendDistributionInput): DividendDistributionResult {
    const netProfit = Number(input.netProfitOfExerciseEur.toFixed(2));
    const capital = Number(input.shareCapitalEur.toFixed(2));
    const initialReserve = Number(input.legalReserveBalanceInitialEur.toFixed(2));

    // 1. Piso Mínimo e Meta da Reserva Legal (Arts. 218.º e 295.º CSC)
    let targetCap = Number((capital * 0.20).toFixed(2));
    if (input.corporateForm === 'sociedade_por_quotas' || input.corporateForm === 'unipessoal_lda') {
      targetCap = Math.max(2_500.00, targetCap); // Art. 218.º, n.º 2 CSC (piso de 2.500€)
    }

    let legalReserveAllocation = 0;
    if (netProfit > 0 && initialReserve < targetCap) {
      const fivePercentProfit = Number((netProfit * 0.05).toFixed(2));
      const remainingToTarget = Number((targetCap - initialReserve).toFixed(2));
      legalReserveAllocation = Math.min(fivePercentProfit, remainingToTarget);
    }
    legalReserveAllocation = Number(legalReserveAllocation.toFixed(2));
    const finalReserve = Number((initialReserve + legalReserveAllocation).toFixed(2));

    // 2. Artigo 33.º, n.º 2 do CSC: Custos de Constituição e I&D não amortizados
    const freeReservesAndPriorEarnings = Math.max(0, input.retainedEarningsBalanceEur);
    const unamortizedRnd = input.unrealizedDevelopmentExpensesEur || 0;
    const rndExcessOverFreeReserves = Math.max(0, unamortizedRnd - freeReservesAndPriorEarnings);

    // 3. Perdas Transitadas Anteriores
    const priorLosses = Math.min(0, input.retainedEarningsBalanceEur) < 0
      ? Math.abs(input.retainedEarningsBalanceEur)
      : 0;

    // 4. Lucro Distribuível Global Máximo do Exercício (Art. 31.º a 33.º CSC)
    const distributableProfitGlobalMax = Math.max(0, Number((
      netProfit -
      legalReserveAllocation -
      priorLosses -
      rndExcessOverFreeReserves
    ).toFixed(2)));

    // 5. Teste de Cobertura do Capital Próprio Floor (Art. 32.º/1 CSC)
    let unrealizedCapitalImpairment = 0;
    if (input.equitySituationTotalEur !== undefined) {
      const unavailableReserves = finalReserve +
        (input.unrealizedFairValueReservesEur || 0) +
        (input.unrealizedEquityMethodReservesEur || 0);
      const minEquityFloor = capital + unavailableReserves;
      if (input.equitySituationTotalEur < minEquityFloor) {
        unrealizedCapitalImpairment = Number((minEquityFloor - input.equitySituationTotalEur).toFixed(2));
      }
    }

    const distributableAfterEquityFloor = Math.max(0, Number((distributableProfitGlobalMax - unrealizedCapitalImpairment).toFixed(2)));
    const mandatoryFiftyPercent = Number((distributableAfterEquityFloor * 0.50).toFixed(2));

    // 6. Aplicação Cogente dos 50% Mínimos (Arts. 217.º/1 e 294.º/1 do CSC)
    let requestedAmount = 0;
    switch (input.distributionOption) {
      case 'mandatory_fifty_percent':
        requestedAmount = mandatoryFiftyPercent;
        break;
      case 'full_distribution':
        requestedAmount = distributableAfterEquityFloor;
        break;
      case 'full_retention':
        requestedAmount = 0;
        break;
      case 'custom_amount':
        requestedAmount = input.requestedDistributionAmountEur || 0;
        break;
    }

    requestedAmount = Number(requestedAmount.toFixed(2));

    // Validação Cogente: Quotas e SA exigem deliberação de 3/4 para reter mais de metade
    if (distributableAfterEquityFloor > 0 && requestedAmount < mandatoryFiftyPercent && !input.hasStatutoryDistributionWaiver) {
      return {
        dataStatus: 'safe_fail',
        safeFailReason: 'distribution_below_statutory_minimum',
        legalReserveMandatoryAllocationEur: legalReserveAllocation,
        legalReserveTargetCapEur: targetCap,
        legalReserveFinalBalanceEur: finalReserve,
        unrealizedCapitalImpairmentEur: unrealizedCapitalImpairment,
        distributableProfitGlobalMaxEur: distributableAfterEquityFloor,
        mandatoryMinimumDistributionFiftyPctEur: mandatoryFiftyPercent,
        statutoryDistributionAllowed: false,
        finalDistributedAmountEur: 0,
        retainedForReservesEur: distributableAfterEquityFloor,
        shareholderTaxWithholdingEur: 0,
        shareholderEffectiveIncomeEur: 0
      };
    }

    const finalDistributedAmount = Math.min(requestedAmount, distributableAfterEquityFloor);
    const retainedForReserves = Number((distributableAfterEquityFloor - finalDistributedAmount).toFixed(2));

    // Tributação na Esfera do Sócio (Artigo 71.º CIRS - 28% flat)
    const taxRate = input.shareholderTaxOption === 'aggregate_taxation_category_e' ? 0.28 * 0.50 : 0.28;
    const shareholderWithholding = Number((finalDistributedAmount * taxRate).toFixed(2));
    const shareholderEffectiveIncome = Number((finalDistributedAmount - shareholderWithholding).toFixed(2));

    return {
      dataStatus: 'official',
      legalReserveMandatoryAllocationEur: legalReserveAllocation,
      legalReserveTargetCapEur: targetCap,
      legalReserveFinalBalanceEur: finalReserve,
      unrealizedCapitalImpairmentEur: unrealizedCapitalImpairment,
      distributableProfitGlobalMaxEur: distributableAfterEquityFloor,
      mandatoryMinimumDistributionFiftyPctEur: mandatoryFiftyPercent,
      statutoryDistributionAllowed: true,
      finalDistributedAmountEur: finalDistributedAmount,
      retainedForReservesEur: retainedForReserves,
      shareholderTaxWithholdingEur: shareholderWithholding,
      shareholderEffectiveIncomeEur: shareholderEffectiveIncome
    };
  }
}

// ============================================================================
// 7. SUBMOTOR DE SEGURANÇA SOCIAL & ENI (ARTS. 145.º/146.º CRC & CIRS)
// ============================================================================

export interface ActivityCessationPeriod {
  cessationYear: number;
  cessationMonth: number; // 1-12
  restartYear?: number;
  restartMonth?: number;  // 1-12
  cessationReason?: 'voluntary' | 'statutory_inactivity' | 'other';
}

export interface SocialSecurityTemporalContextInput {
  activityStartYear: number;
  activityStartMonth: number; // 1-12
  assessmentYear: number;
  assessmentMonth: number;    // 1-12
  isFirstEnrolmentEver: boolean;
  cessationPeriods?: ActivityCessationPeriod[];
  hasOptedForEarlyCoverageArt146: boolean;
  earlyCoverageRequestYear?: number;
  earlyCoverageRequestMonth?: number;
}

function toMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

function fromMonthIndex(index: number): { year: number; month: number } {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month };
}

export function evaluateSocialSecurityMonthlyProductionOfEffects(
  ctx: SocialSecurityTemporalContextInput
): {
  obligationInEffect: boolean;
  effectiveDateIso: string;
  activeMonthsAccumulated: number;
  suspendedMonthsTotal: number;
  status: 
    | 'exempt_first_12_months' 
    | 'obligation_active' 
    | 'early_coverage_exercised' 
    | 'obligation_active_post_12m_cessation'
    | 'insufficient_cessation_history';
  legalBasis: string;
} {
  // 1. Reenquadramentos anteriores
  if (!ctx.isFirstEnrolmentEver) {
    const effDateIso = `${ctx.activityStartYear}-${String(ctx.activityStartMonth).padStart(2, '0')}-01`;
    return {
      obligationInEffect: true,
      effectiveDateIso: effDateIso,
      activeMonthsAccumulated: 12,
      suspendedMonthsTotal: 0,
      status: 'obligation_active',
      legalBasis: 'Art. 145.º do CRC (O diferimento de 12 meses aplica-se exclusivamente no primeiro enquadramento)'
    };
  }

  // 2. Antecipação do Artigo 146.º do CRC (1.º dia do mês seguinte ao requerimento)
  if (ctx.hasOptedForEarlyCoverageArt146 && ctx.earlyCoverageRequestYear && ctx.earlyCoverageRequestMonth) {
    const requestIndex = toMonthIndex(ctx.earlyCoverageRequestYear, ctx.earlyCoverageRequestMonth);
    const eff = fromMonthIndex(requestIndex + 1);
    const effDateIso = `${eff.year}-${String(eff.month).padStart(2, '0')}-01`;
    const currentIndex = toMonthIndex(ctx.assessmentYear, ctx.assessmentMonth);
    const inEffect = currentIndex >= (requestIndex + 1);
    return {
      obligationInEffect: inEffect,
      effectiveDateIso: effDateIso,
      activeMonthsAccumulated: 0,
      suspendedMonthsTotal: 0,
      status: inEffect ? 'early_coverage_exercised' : 'exempt_first_12_months',
      legalBasis: 'Art. 146.º do CRC (Produção de efeitos no 1.º dia do mês seguinte ao requerimento)'
    };
  }

  // 3. Regra Geral dos 12 Meses com Suspensão por Cessação (Art. 145.º, n.º 3 e 4)
  const startIndex = toMonthIndex(ctx.activityStartYear, ctx.activityStartMonth);
  let activeMonthsCount = 0;
  let suspendedMonthsCount = 0;
  let currentCursorIndex = startIndex;

  if (ctx.cessationPeriods && ctx.cessationPeriods.length > 0) {
    const sorted = [...ctx.cessationPeriods].sort((a, b) => 
      toMonthIndex(a.cessationYear, a.cessationMonth) - toMonthIndex(b.cessationYear, b.cessationMonth)
    );

    for (const period of sorted) {
      const cessationIndex = toMonthIndex(period.cessationYear, period.cessationMonth);

      if (activeMonthsCount < 12) {
        const activeInSegment = Math.max(0, cessationIndex - currentCursorIndex);
        activeMonthsCount += activeInSegment;

        if (activeMonthsCount >= 12) {
          break;
        }

        if (period.restartYear === undefined || period.restartMonth === undefined) {
          const currentIndex = toMonthIndex(ctx.assessmentYear, ctx.assessmentMonth);
          if (currentIndex >= cessationIndex) {
            return {
              obligationInEffect: false,
              effectiveDateIso: '',
              activeMonthsAccumulated: activeMonthsCount,
              suspendedMonthsTotal: suspendedMonthsCount,
              status: 'insufficient_cessation_history',
              legalBasis: 'Art. 145.º, n.º 3 do CRC (Cessação em aberto sem registo formal de reinício de atividade)'
            };
          }
        } else {
          const restartIndex = toMonthIndex(period.restartYear, period.restartMonth);
          const interruptionMonths = restartIndex - cessationIndex;

          if (interruptionMonths <= 12) {
            suspendedMonthsCount += interruptionMonths;
            currentCursorIndex = restartIndex;
          } else {
            const effDateIso = `${period.restartYear}-${String(period.restartMonth).padStart(2, '0')}-01`;
            const currentIndex = toMonthIndex(ctx.assessmentYear, ctx.assessmentMonth);
            return {
              obligationInEffect: currentIndex >= restartIndex,
              effectiveDateIso: effDateIso,
              activeMonthsAccumulated: activeMonthsCount,
              suspendedMonthsTotal: suspendedMonthsCount,
              status: 'obligation_active_post_12m_cessation',
              legalBasis: 'Art. 145.º, n.º 4 do CRC (Reinício após mais de 12 meses de cessação extingue o diferimento residual, produzindo efeitos imediatos)'
            };
          }
        }
      }
    }
  }

  const remainingActiveMonths = Math.max(0, 12 - activeMonthsCount);
  const finalEffectiveIndex = currentCursorIndex + remainingActiveMonths;
  const finalEff = fromMonthIndex(finalEffectiveIndex);
  const effectiveDateIso = `${finalEff.year}-${String(finalEff.month).padStart(2, '0')}-01`;

  const currentIndex = toMonthIndex(ctx.assessmentYear, ctx.assessmentMonth);
  const inEffect = currentIndex >= finalEffectiveIndex;

  return {
    obligationInEffect: inEffect,
    effectiveDateIso,
    activeMonthsAccumulated: activeMonthsCount,
    suspendedMonthsTotal: suspendedMonthsCount,
    status: inEffect ? 'obligation_active' : 'exempt_first_12_months',
    legalBasis: 'Art. 145.º, n.º 3 do CRC (Diferimento para o 12.º mês com contagem suspensa por cessação/reinício)'
  };
}

// ENI Decomposição de Despesas (Art. 31.º, n.º 13 CIRS)
export interface EniSimplifiedExpensesInput {
  grossServicesTurnoverEur: number;
  socialSecurityPaidInPeriodEur: number;
  verifiedEFaturaExpensesEur: number;
  personnelExpensesEur?: number;
}

export function evaluateEniSimplifiedExpensesRequirement(input: EniSimplifiedExpensesInput): {
  requiredExpensesAmountEur: number;
  baseParcelEur: number;
  totalJustifiedExpensesEur: number;
  expenseDeficitEur: number;
  statutoryAdditionToTaxableBaseEur: number;
} {
  const required = Number(((input.grossServicesTurnoverEur * 0.15)).toFixed(2));
  const baseParcel = Math.max(SS_TI_EXPENSE_DEDUCTION_BASE_PARCEL_EUR, input.socialSecurityPaidInPeriodEur);
  const totalJustified = Number((baseParcel + input.verifiedEFaturaExpensesEur + (input.personnelExpensesEur || 0)).toFixed(2));
  const deficit = Math.max(0, Number((required - totalJustified).toFixed(2)));

  return {
    requiredExpensesAmountEur: required,
    baseParcelEur: baseParcel,
    totalJustifiedExpensesEur: totalJustified,
    expenseDeficitEur: deficit,
    statutoryAdditionToTaxableBaseEur: deficit
  };
}

// IVA Limiar Art. 53.º CIVA
export function evaluateIvaArticle53Regime(
  priorYearTurnoverEur: number,
  isActivityStart: boolean,
  estimatedAnnualTurnoverAtStartEur: number,
  hasExportOperations: boolean
): {
  regime: 'exempt_art53' | 'normal_regime';
  legalBasis: string;
} {
  if (hasExportOperations) {
    return {
      regime: 'normal_regime',
      legalBasis: 'Art. 53.º, n.º 1 CIVA (Exclusão por realização de operações de exportação/intracomunitárias)'
    };
  }

  if (isActivityStart) {
    if (estimatedAnnualTurnoverAtStartEur > IVA_ART53_EXEMPTION_THRESHOLD_EUR) {
      return {
        regime: 'normal_regime',
        legalBasis: 'Art. 53.º, n.º 5 CIVA (Previsão de volume de negócios superior a 15.000€ no início)'
      };
    }
    return {
      regime: 'exempt_art53',
      legalBasis: 'Art. 53.º, n.º 5 CIVA (Previsão de volume de negócios até 15.000€ no início)'
    };
  }

  if (priorYearTurnoverEur > IVA_ART53_EXEMPTION_THRESHOLD_EUR) {
    return {
      regime: 'normal_regime',
      legalBasis: 'Art. 53.º, n.º 1 CIVA (Volume de negócios anterior superior a 15.000€)'
    };
  }

  return {
    regime: 'exempt_art53',
    legalBasis: 'Art. 53.º, n.º 1 CIVA (Volume de negócios até 15.000€ no ano civil anterior)'
  };
}

// Avaliação de Coeficiente Categoria B (Artigo 31.º CIRS)
export function evaluateCategoryBCoefficient(
  sectorOrServiceType: 'sales' | 'services_art151' | 'other_services' | 'hospitality_catering',
  isActivityStartYear1: boolean,
  hasOtherCategoryAOrHIncome: boolean,
  isRelatedPartyOrEconomicDependencyArt31_1_g: boolean
): {
  statutoryCoefficient: number;
  reductionApplied: boolean;
  legalBasis: string;
} {
  if (isRelatedPartyOrEconomicDependencyArt31_1_g) {
    return {
      statutoryCoefficient: 1.00,
      reductionApplied: false,
      legalBasis: 'Art. 31.º, n.º 1, al. g) do CIRS (Entidades relacionadas ou dependência económica: coeficiente 1,00 sem benefício de início)'
    };
  }

  let baseCoefficient = 0.75;
  if (sectorOrServiceType === 'sales') baseCoefficient = 0.15;
  else if (sectorOrServiceType === 'hospitality_catering') baseCoefficient = 0.35;
  else if (sectorOrServiceType === 'other_services') baseCoefficient = 0.35;

  if (isActivityStartYear1 && !hasOtherCategoryAOrHIncome) {
    return {
      statutoryCoefficient: Number((baseCoefficient * 0.50).toFixed(4)),
      reductionApplied: true,
      legalBasis: 'Art. 31.º, n.º 10 do CIRS (Redução de 50% no período de início de atividade)'
    };
  }

  return {
    statutoryCoefficient: baseCoefficient,
    reductionApplied: false,
    legalBasis: 'Art. 31.º, n.º 1 do CIRS (Coeficiente estatutário geral do regime simplificado)'
  };
}
