/**
 * MIRA Housing Intelligence 2026 - Repositório de Evidências e Rastreabilidade Epistémica
 * Implementação estrita da RULE_HOUSE_INGESTION_001 (Gate H-08)
 */

export type DataEpistemicStatus = 'official' | 'observed' | 'derived' | 'insufficient';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient_data';
export type TerritorialLevel = 'national' | 'region' | 'district' | 'municipality';

export interface VerificationChecks {
  httpStatusOk: boolean;            // httpStatus === 200
  contentHashValid: boolean;        // Hash SHA-256 válido e não vazio
  referencePeriodMatches: boolean;  // Período de referência coincide com o alvo
  schemaValid: boolean;             // Schema de metadados obrigatórios respeitado
  extractionVerified: boolean;      // Valor extraído é numérico válido (> 0) e coincide com o localizador
}

export interface SourceFetchEvidence {
  evidenceId: string;                   // UUID ou identificador único da evidência
  sourceId: string;                     // ex: 'INE', 'IDEALISTA', 'AT', 'IHRU', 'BDP'
  sourceType: 'official' | 'portal';
  requestedUrl: string;                // URL exato executado no fetch
  fetchedAt: string;                   // Timestamp ISO 8601 da consulta
  httpStatus: number;                  // Código HTTP (200)
  contentHash: string;                 // Hash SHA-256 do payload recebido
  responseTimestamp?: string;          // Timestamp do cabeçalho da resposta
  
  // Rastreabilidade Observação-a-Observação
  observationId: string;               // Identificador único da observação no MIRA
  sourceRecordId?: string;             // ID da série temporal ou registo oficial
  observationLocator: string;          // Localizador estruturado (JSONPath, XPath, seletor CSS)
  rawObservationSnippet: string;       // Excerto textual bruto comprovativo
  extractedValue: number;              // Valor numérico extraído (€/m² ou €)
  
  // Metadados do Dataset e Período
  referencePeriod: string;             // ex: '1.º Trimestre de 2026 (12 meses)' ou 'Agosto 2026'
  releaseDate: string;                 // Data de publicação formal pela entidade
  datasetOrPage: string;               // Nome do destaque, tabela ou relatório consultado
  extractionMethod:
    | 'official_api'
    | 'official_dataset'
    | 'web_page'
    | 'structured_data'
    | 'document';
  
  // Segregação entre Universo Estatístico da Fonte e Registos Ingeridos
  sourceStatisticalUniverseCount?: number; // ex: 8.940 contratos analisados pelo INE
  recordsActuallyIngested: number;         // ex: 1 registo municipal agregado
  
  // Critérios Cumulativos de Verificação (HTTP 200 != Verified)
  verificationChecks: VerificationChecks;
  
  extractionStatus: 'success' | 'partial' | 'failed';
  verificationStatus: 'verified' | 'not_verified';
}

/**
 * Validação soberana dos 5 critérios cumulativos da RULE_HOUSE_INGESTION_001.
 * Retorna true se e só se TODOS os 5 checks forem estritamente verdadeiros.
 */
export function verifySourceEvidence(evidence: SourceFetchEvidence): boolean {
  if (!evidence) return false;

  const checks = evidence.verificationChecks;
  if (!checks) return false;

  const allPassed =
    checks.httpStatusOk === true &&
    checks.contentHashValid === true &&
    checks.referencePeriodMatches === true &&
    checks.schemaValid === true &&
    checks.extractionVerified === true;

  return allPassed && evidence.verificationStatus === 'verified';
}

/**
 * Repositório Canónico de Evidências em Runtime (In-Memory Store).
 * Garante que nenhum dado externo é fornecido ao motor sem SourceFetchEvidence válida.
 */
export class HousingEvidenceStore {
  private static instance: HousingEvidenceStore;
  private evidenceMap: Map<string, SourceFetchEvidence> = new Map();

  private constructor() {}

  public static getInstance(): HousingEvidenceStore {
    if (!HousingEvidenceStore.instance) {
      HousingEvidenceStore.instance = new HousingEvidenceStore();
    }
    return HousingEvidenceStore.instance;
  }

  /**
   * Regista uma evidência de ingestão.
   * Valida previamente os 5 critérios. Se falhar, rejeita o registo.
   */
  public registerEvidence(evidence: SourceFetchEvidence): boolean {
    const isValid = verifySourceEvidence(evidence);
    if (!isValid) {
      evidence.verificationStatus = 'not_verified';
      this.evidenceMap.set(evidence.observationId, evidence);
      return false;
    }
    this.evidenceMap.set(evidence.observationId, evidence);
    return true;
  }

  public getEvidence(observationId: string): SourceFetchEvidence | undefined {
    return this.evidenceMap.get(observationId);
  }

  public hasValidEvidence(observationId: string): boolean {
    const evidence = this.evidenceMap.get(observationId);
    if (!evidence) return false;
    return verifySourceEvidence(evidence);
  }

  public invalidate(observationId: string): void {
    const evidence = this.evidenceMap.get(observationId);
    if (evidence) {
      evidence.verificationStatus = 'not_verified';
      evidence.verificationChecks.contentHashValid = false;
    }
  }

  public remove(observationId: string): void {
    this.evidenceMap.delete(observationId);
  }

  public clear(): void {
    this.evidenceMap.clear();
  }

  /**
   * Aplica a RULE_HOUSE_INGESTION_001 a um valor candidato.
   * Se a evidência faltar, estiver corrompida ou o valor diferir do extraído,
   * emite compulsoriamente 'insufficient'.
   */
  public validateDataValue(
    observationId: string,
    candidateValue: number
  ): {
    isValid: boolean;
    dataStatus: DataEpistemicStatus;
    evidence?: SourceFetchEvidence;
  } {
    const evidence = this.evidenceMap.get(observationId);

    if (!evidence || !verifySourceEvidence(evidence)) {
      return {
        isValid: false,
        dataStatus: 'insufficient',
        evidence: undefined
      };
    }

    // Tolerância infinitesimal para arredondamento float (0.001)
    if (Math.abs(evidence.extractedValue - candidateValue) > 0.001) {
      return {
        isValid: false,
        dataStatus: 'insufficient',
        evidence: evidence
      };
    }

    const assignedStatus: DataEpistemicStatus =
      evidence.sourceType === 'official' ? 'official' : 'observed';

    return {
      isValid: true,
      dataStatus: assignedStatus,
      evidence: evidence
    };
  }
}
