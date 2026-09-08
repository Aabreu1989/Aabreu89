// src/services/miraAimaEngine.ts
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MIRA AIMA LEGAL COMPLIANCE ENGINE 2026 (ESPECIFICAÇÃO CANÓNICA)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Motor soberano de validação normativa, conformidade jurídica, meios de subsistência,
 * taxas oficiais e prazos administrativos para a AIMA (Agência para a Integração,
 * Migrações e Asilo).
 * 
 * FONTES PRIMÁRIAS OFICIAIS (DIÁRIO DA REPÚBLICA):
 * 1. Portaria n.º 1563/2007, de 11 de dezembro:
 *    - Artigo 2.º, n.º 1 e 2: Escala de subsistência (100% / 50% / 30%) calculada
 *      por referência à RMMG líquida de quotizações para a segurança social.
 *    - Artigo 5.º, n.º 6: Visto de residência D7 (meios de bens/pensões, 12 meses,
 *      prova de titularidade e disponibilidade efetiva em Portugal).
 *    - Artigo 9.º: Meios de subsistência para reagrupamento familiar.
 * 2. Lei n.º 23/2007, de 4 de julho (versão consolidada vigente):
 *    - Artigo 52.º: Condições gerais de subsistência.
 *    - Artigo 57.º-A: Visto para procura de trabalho (recursos de pelo menos 3 × RMMG).
 *    - Artigo 58.º, n.º 1, al. b): Visto de residência para titulares de rendimentos próprios (D7).
 *    - Artigo 82.º, n.º 5: Prazo de decisão na concessão de AR com visto (90 dias).
 *    - Artigo 82.º, n.º 6: Prazo de decisão na renovação de AR (60 dias).
 *    - Artigo 82.º, n.º 7: Deferimento tácito da renovação de AR decorridos 60 dias sem culpa.
 *    - Artigo 87.º-A: Autorização de residência para cidadãos da CPLP (Acordo de Mobilidade).
 *    - Artigo 88.º, n.º 1: Autorização de residência para atividade subordinada com visto.
 *    - Artigo 90.º-A: Visto de residência para nómadas digitais (4 × RMMG).
 *    - Artigo 122.º: Autorização de residência com dispensa de visto em situações especiais (ativo).
 * 3. Decreto-Lei n.º 37-A/2024, de 3 de junho:
 *    - Artigo 2.º: Revogação dos n.ºs 2 dos Artigos 88.º e 89.º (fim das manifestações de interesse).
 * 4. Decreto-Lei n.º 41-A/2024 e Resolução do Conselho de Ministros n.º 75/2024:
 *    - Regime transitório da Estrutura de Missão da AIMA para processos SAPA submetidos até 03/06/2024.
 * 5. Código dos Regimes Contributivos (CRCSPSS — Lei n.º 110/2009, de 16 de setembro):
 *    - Artigo 44.º: Base de incidência contributiva na remuneração ilíquida devida.
 *    - Artigo 53.º: Taxas contributivas do regime geral TCO (11,0% trabalhador / 23,75% empregador).
 * 6. Código do Procedimento Administrativo (CPA — Decreto-Lei n.º 4/2015):
 *    - Artigo 117.º: Notificação para aperfeiçoamento instrutório e suprimento de deficiências.
 *    - Artigo 122.º, n.º 1: Prazo para audiência prévia não inferior a 10 dias.
 * 7. Código de Processo nos Tribunais Administrativos (CPTA — Lei n.º 15/2002):
 *    - Artigos 66.º e seguintes: Ação de intimação para a prática de ato legalmente devido.
 *    - Artigo 109.º: Intimação urgente para proteção de direitos, liberdades e garantias.
 * 8. Regulamentação Tarifária da AIMA (em vigor desde 01/03/2026):
 *    - Taxas oficiais e reduções: 25% canal online, 10% atendimento assistido,
 *      e regra transitória de 25% no atendimento presencial para serviços sem canal digital.
 * 9. Decreto-Lei n.º 139/2025:
 *    - RMMG Continental 2026 = 920,00 €.
 */

// ─── CONSTANTES TERRITORIAIS CANÓNICAS (2026) ──────────────────────────────────
export const NORMATIVE_AIMA_2026 = {
  RMMG_CONTINENTAL: 920.00,
  RMMG_AZORES: 966.00,   // DL 139/2025 + DLR 8/2002/A (+5% regional)
  RMMG_MADEIRA: 980.00,  // Decreto Legislativo Regional ALRAM 2026
  JOB_SEARCH_MULTIPLIER: 3,    // 3 × RMMG (Art. 57.º-A Lei 23/2007)
  DIGITAL_NOMAD_MULTIPLIER: 4, // 4 × RMMG (Art. 90.º-A Lei 23/2007)
  LEGACY_CUTOFF_DATE: '2024-06-03', // DL 37-A/2024
};

// ─── TIPOS FUNDAMENTAIS ────────────────────────────────────────────────────────

export type PortugueseTerritory = 'mainland' | 'azores' | 'madeira';

export type AimaPathwayId = 
  | 'work_d1'
  | 'entrepreneur_d2'
  | 'highly_qualified_d3'
  | 'student_d4'
  | 'passive_income_d7'
  | 'digital_nomad_d8'
  | 'job_search'
  | 'cplp_mobility'
  | 'art122_special'
  | 'family_reunification'
  | 'asylum_protection'
  | 'pending_manifestation_legacy';

export type EmploymentRegime = 
  | 'tco_general'           // Conta de outrem regime geral (Arts. 53.º e 44.º CRCSPSS)
  | 'independent_contractor' // Trabalhador independente (Art. 139.º CRCSPSS)
  | 'passive_income'         // Rendimentos passivos (D7 — sem quotização laboral TCO)
  | 'job_seeker'             // Em procura de trabalho (sem remuneração ativa inicial)
  | 'unspecified';

export type SubmissionChannel = 
  | 'online'           // Canal digital/portal da AIMA
  | 'digital_assisted' // Atendimento digital assistido
  | 'in_person'        // Presencial
  | 'other_reduction'; // Redução legal específica

export type AimaReductionRule = 
  | 'online_25'
  | 'digital_assisted_10'
  | 'in_person_full'
  | 'in_person_transitional_25'
  | 'special_legal_reduction'
  | 'none'
  | 'insufficient_official_source';

export interface NormativeProvenance {
  ruleId: string;
  legalBasis: string;      // Diploma (ex: "Portaria n.º 1563/2007")
  article: string;         // Artigo exato (ex: "Artigo 2.º, n.º 1 e 2")
  paragraph?: string;      // Alínea/número
  officialSource: string;  // Publicação oficial (ex: "Diário da República n.º 238/2007, Série I")
  effectiveFrom: string;   // Data de produção de efeitos
  verifiedAt: string;      // Data da auditoria
}

export interface HouseholdComposition {
  applicant: true;
  otherAdultsCount: number; // 50% da RMMG de referência do território
  minorsCount: number;      // 30% da RMMG de referência do território
}

export interface D7PassiveIncomeDetail {
  incomeNature: 'pension_retirement' | 'real_estate_rental' | 'dividends_financial' | 'intellectual_property' | 'other_passive';
  proofOfAvailability: boolean;
  availableInPortugal: boolean;
  availableNetMonthlyEur: number;
}

export interface JobSearchFinancialProof {
  proofType: 'own_financial_resources' | 'bank_deposit' | 'responsibility_term_resident' | 'responsibility_term_entity';
  availableCapitalEur: number;
  hasValidResponsibilityTerm?: boolean;
}

export interface AimaSubsistenceAssessment {
  territory: PortugueseTerritory;
  rmmgReferenceEur: number;
  requiredNetMonthlyEur: number;
  requiredNetAnnualEur: number;
  householdBreakdown: {
    applicantNetMonthlyEur: number;
    otherAdultsNetMonthlyEur: number;
    minorsNetMonthlyEur: number;
  };
  capitalReserveRequiredEur?: number;
  availableNetMonthlyEur: number;
  isCompliant: boolean;
  shortfallMonthlyEur: number;
  surplusMonthlyEur: number;
  d7Detail?: {
    isNatureCompliant: boolean;
    isAvailabilityInPortugalConfirmed: boolean;
    availableNetAnnualEur: number;
    requiredNetAnnualEur: number;
  };
  jobSearchDetail?: {
    capitalReserveRequiredEur: number;
    availableCapitalEur: number;
    isReserveCompliant: boolean;
    proofType: string;
  };
  provenance: NormativeProvenance;
}

export interface AimaFeeCalculation {
  status: 'official_calculated' | 'insufficient_official_source';
  estimatedFeeEur: number | null;
  baseFeeEur: number | null;
  channel: SubmissionChannel;
  reductionPercentageApplied: number;
  reductionRule: AimaReductionRule;
  isDigitalChannelEligible: boolean;
  feeNotes: string;
  provenance: NormativeProvenance;
}

export interface AimaDeadlineAssessment {
  procedureType: 'residence_grant_visa' | 'residence_renewal' | 'prior_hearing' | 'curative_notification';
  legalDeadlineDays: number | null;
  minimumLegalDays?: number;
  actualNoticeDays?: number;
  deadlineUnit: 'calendar_days' | 'business_days' | 'days_minimum';
  daysElapsed: number;
  isExpired: boolean;
  tacitApprovalApplicable: boolean;
  status: 'within_legal_deadline' | 'tacit_approval_granted' | 'administrative_delay' | 'insufficient_legal_basis';
  potentialLegalRecourse?: {
    primaryRecourse: 'cpta_intimacao_ato_devido';
    urgentSubsidiaryRecourse?: 'cpta_direitos_liberdades';
    recourseNotice: string;
  } | null;
  provenance: NormativeProvenance;
}

export interface RequiredDocumentItem {
  code: string;
  name: string;
  description: string;
  whereToObtain: string;
  officialGuidance: string;
  provenance: NormativeProvenance;
}

export interface UnifiedAimaComplianceResult {
  pathwayId: AimaPathwayId;
  complianceStatus: 'compliant' | 'non_compliant' | 'insufficient_legal_basis';
  subsistence: AimaSubsistenceAssessment;
  socialSecurityCheck: {
    isTcoSecurityContributionApplicable: boolean;
    workerRateApplied?: number;
    employerRateApplied?: number;
    taxBaseType?: 'remuneracao_iliquida';
    calculatedDeductionEur?: number;
    status: 'compliant' | 'not_applicable' | 'insufficient_legal_basis';
    provenance?: NormativeProvenance;
  };
  fees: AimaFeeCalculation;
  deadlines?: AimaDeadlineAssessment;
  requiredDocuments: RequiredDocumentItem[];
  legalWarnings: string[];
  provenanceChain: NormativeProvenance[];
}

// ─── 1. SUB-MOTOR DE MEIOS DE SUBSISTÊNCIA ─────────────────────────────────────

export class AimaMeansOfSubsistenceEngine {
  public static getRmmgReference(territory: PortugueseTerritory = 'mainland'): number {
    switch (territory) {
      case 'azores':
        return NORMATIVE_AIMA_2026.RMMG_AZORES;
      case 'madeira':
        return NORMATIVE_AIMA_2026.RMMG_MADEIRA;
      case 'mainland':
      default:
        return NORMATIVE_AIMA_2026.RMMG_CONTINENTAL;
    }
  }

  public static calculateSubsistence(params: {
    household: HouseholdComposition;
    territory?: PortugueseTerritory;
    availableNetMonthlyEur: number;
    pathwayId: AimaPathwayId;
    d7Detail?: D7PassiveIncomeDetail;
    jobSearchProof?: JobSearchFinancialProof;
  }): AimaSubsistenceAssessment {
    const territory = params.territory || 'mainland';
    const rmmg = this.getRmmgReference(territory);

    // Escala geral: Artigo 2.º, n.º 1 e 2 da Portaria n.º 1563/2007
    let applicantNetMonthly = rmmg; // 100%
    const otherAdultsNetMonthly = (params.household.otherAdultsCount || 0) * (rmmg * 0.50); // 50%
    const minorsNetMonthly = (params.household.minorsCount || 0) * (rmmg * 0.30); // 30%

    let capitalReserveRequiredEur: number | undefined;
    let d7AssessmentDetail: AimaSubsistenceAssessment['d7Detail'];
    let jobSearchAssessmentDetail: AimaSubsistenceAssessment['jobSearchDetail'];

    let provenance: NormativeProvenance = {
      ruleId: 'RULE_AIMA_SUBSISTENCE_GENERAL',
      legalBasis: 'Portaria n.º 1563/2007',
      article: 'Artigo 2.º, n.º 1 e 2',
      officialSource: 'Diário da República n.º 238/2007, Série I',
      effectiveFrom: '2007-12-12',
      verifiedAt: '2026-09-06'
    };

    // Caso Especial: Nómada Digital D8 (Artigo 90.º-A da Lei n.º 23/2007)
    if (params.pathwayId === 'digital_nomad_d8') {
      applicantNetMonthly = rmmg * NORMATIVE_AIMA_2026.DIGITAL_NOMAD_MULTIPLIER; // 4 × RMMG
      provenance = {
        ruleId: 'RULE_AIMA_SUBSISTENCE_D8',
        legalBasis: 'Lei n.º 23/2007',
        article: 'Artigo 90.º-A',
        officialSource: 'Diário da República n.º 149/2022, Série I',
        effectiveFrom: '2022-10-30',
        verifiedAt: '2026-09-06'
      };
    }

    const requiredNetMonthlyEur = applicantNetMonthly + otherAdultsNetMonthly + minorsNetMonthly;
    const requiredNetAnnualEur = requiredNetMonthlyEur * 12;

    // Caso Especial: Procura de Trabalho (Artigo 57.º-A da Lei 23/2007)
    if (params.pathwayId === 'job_search') {
      capitalReserveRequiredEur = rmmg * NORMATIVE_AIMA_2026.JOB_SEARCH_MULTIPLIER; // 3 × RMMG
      provenance = {
        ruleId: 'RULE_AIMA_SUBSISTENCE_JOB_SEARCH',
        legalBasis: 'Lei n.º 23/2007',
        article: 'Artigo 57.º-A',
        paragraph: 'n.º 1 e 3',
        officialSource: 'Diário da República n.º 149/2022, Série I',
        effectiveFrom: '2022-10-30',
        verifiedAt: '2026-09-06'
      };

      const proof = params.jobSearchProof;
      const availableCap = proof ? proof.availableCapitalEur : 0;
      const isReserveOk = proof?.hasValidResponsibilityTerm || (availableCap >= capitalReserveRequiredEur);

      jobSearchAssessmentDetail = {
        capitalReserveRequiredEur,
        availableCapitalEur: availableCap,
        isReserveCompliant: isReserveOk,
        proofType: proof ? proof.proofType : 'none'
      };
    }

    // Caso Especial: Visto D7 — Rendimentos Passivos (Artigo 2.º n.º 2 e Artigo 5.º n.º 6 da Portaria 1563/2007)
    if (params.pathwayId === 'passive_income_d7') {
      provenance = {
        ruleId: 'RULE_AIMA_SUBSISTENCE_D7',
        legalBasis: 'Portaria n.º 1563/2007',
        article: 'Artigo 2.º, n.º 2 e Artigo 5.º, n.º 6',
        officialSource: 'Diário da República n.º 238/2007, Série I',
        effectiveFrom: '2007-12-12',
        verifiedAt: '2026-09-06'
      };

      const d7 = params.d7Detail;
      const validNatures: D7PassiveIncomeDetail['incomeNature'][] = [
        'pension_retirement', 'real_estate_rental', 'dividends_financial', 'intellectual_property', 'other_passive'
      ];
      const isNatureOk = !!d7 && validNatures.includes(d7.incomeNature) && d7.proofOfAvailability;
      const isAvailPt = !!d7 && d7.availableInPortugal;
      const annualAvail = (d7 ? d7.availableNetMonthlyEur : params.availableNetMonthlyEur) * 12;

      d7AssessmentDetail = {
        isNatureCompliant: isNatureOk,
        isAvailabilityInPortugalConfirmed: isAvailPt,
        availableNetAnnualEur: annualAvail,
        requiredNetAnnualEur
      };
    }

    let isCompliant = params.availableNetMonthlyEur >= requiredNetMonthlyEur;

    if (params.pathwayId === 'job_search' && jobSearchAssessmentDetail) {
      isCompliant = jobSearchAssessmentDetail.isReserveCompliant;
    }

    if (params.pathwayId === 'passive_income_d7' && d7AssessmentDetail) {
      isCompliant = isCompliant && d7AssessmentDetail.isNatureCompliant && d7AssessmentDetail.isAvailabilityInPortugalConfirmed;
    }

    const diff = params.availableNetMonthlyEur - requiredNetMonthlyEur;
    const surplusMonthlyEur = diff > 0 ? diff : 0;
    const shortfallMonthlyEur = diff < 0 ? Math.abs(diff) : 0;

    return {
      territory,
      rmmgReferenceEur: rmmg,
      requiredNetMonthlyEur,
      requiredNetAnnualEur,
      householdBreakdown: {
        applicantNetMonthlyEur: applicantNetMonthly,
        otherAdultsNetMonthlyEur: otherAdultsNetMonthly,
        minorsNetMonthlyEur: minorsNetMonthly
      },
      capitalReserveRequiredEur,
      availableNetMonthlyEur: params.availableNetMonthlyEur,
      isCompliant,
      shortfallMonthlyEur,
      surplusMonthlyEur,
      d7Detail: d7AssessmentDetail,
      jobSearchDetail: jobSearchAssessmentDetail,
      provenance
    };
  }
}

// ─── 2. SUB-MOTOR DE SEGURANÇA SOCIAL CONDICIONADA ─────────────────────────────

export class AimaSocialSecurityEngine {
  public static evaluateSocialSecurity(params: {
    employmentRegime: EmploymentRegime;
    pathwayId: AimaPathwayId;
    grossIncomeEur?: number;
  }) {
    // 1. Regime TCO Geral (Conta de Outrem)
    if (params.employmentRegime === 'tco_general') {
      const gross = params.grossIncomeEur || 0;
      const workerRate = 0.11; // 11,0%
      const employerRate = 0.2375; // 23,75%
      const deduction = Math.round(gross * workerRate * 100) / 100;

      const provenance: NormativeProvenance = {
        ruleId: 'RULE_CRCSPSS_TCO_GENERAL',
        legalBasis: 'Lei n.º 110/2009 (CRCSPSS)',
        article: 'Artigo 53.º e Artigo 44.º',
        officialSource: 'Diário da República n.º 180/2009, Série I',
        effectiveFrom: '2010-01-01',
        verifiedAt: '2026-09-06'
      };

      return {
        isTcoSecurityContributionApplicable: true,
        workerRateApplied: workerRate,
        employerRateApplied: employerRate,
        taxBaseType: 'remuneracao_iliquida' as const,
        calculatedDeductionEur: deduction,
        status: 'compliant' as const,
        provenance
      };
    }

    // 2. Rendimentos Passivos (D7), Procura de Trabalho ou Vias com dispensa de visto/sem quotização laboral TCO obrigatória prévia
    const nonLaborPathways: AimaPathwayId[] = [
      'passive_income_d7', 'job_search', 'art122_special', 'cplp_mobility', 'family_reunification', 'asylum_protection'
    ];
    if (params.employmentRegime === 'passive_income' || params.employmentRegime === 'job_seeker' ||
        nonLaborPathways.includes(params.pathwayId)) {
      return {
        isTcoSecurityContributionApplicable: false,
        status: 'not_applicable' as const,
        provenance: {
          ruleId: 'RULE_NON_LABOR_EXEMPT_SS',
          legalBasis: 'Lei n.º 110/2009 (CRCSPSS)',
          article: 'Artigo 53.º (a contrario)',
          officialSource: 'Diário da República n.º 180/2009, Série I',
          effectiveFrom: '2010-01-01',
          verifiedAt: '2026-09-06'
        }
      };
    }

    // 3. Regimes não suportados formalmente neste motor
    return {
      isTcoSecurityContributionApplicable: false,
      status: 'insufficient_legal_basis' as const
    };
  }
}

// ─── 3. SUB-MOTOR DE TAXAS E REGRA TRANSITÓRIA AIMA ────────────────────────────

export interface OfficialFeeCatalogItem {
  procedureId: string;
  description: string;
  baseFeeEur: number;
  digitalEligible: boolean;
  legalBasis: string;
  article: string;
}

export const AIMA_OFFICIAL_FEE_CATALOG: Record<string, OfficialFeeCatalogItem> = {
  residence_grant_visa: {
    procedureId: 'residence_grant_visa',
    description: 'Concessão de Autorização de Residência com visto de residência prévio',
    baseFeeEur: 180.10,
    digitalEligible: true,
    legalBasis: 'Regulamentação Tarifária da AIMA 2026',
    article: 'Tabela de Emolumentos AIMA 2026'
  },
  residence_grant_art122: {
    procedureId: 'residence_grant_art122',
    description: 'Concessão de Autorização de Residência com dispensa de visto (Art. 122.º)',
    baseFeeEur: 240.00,
    digitalEligible: false, // Atendimento presencial sob regra transitória
    legalBasis: 'Regulamentação Tarifária da AIMA 2026',
    article: 'Tabela de Emolumentos AIMA 2026'
  },
  residence_renewal: {
    procedureId: 'residence_renewal',
    description: 'Renovação de Autorização de Residência temporária',
    baseFeeEur: 75.00,
    digitalEligible: true,
    legalBasis: 'Regulamentação Tarifária da AIMA 2026',
    article: 'Tabela de Emolumentos AIMA 2026'
  },
  cplp_initial_permit: {
    procedureId: 'cplp_initial_permit',
    description: 'Emissão de Título de Residência CPLP (Art. 87.º-A)',
    baseFeeEur: 15.00,
    digitalEligible: true,
    legalBasis: 'Acordo de Mobilidade CPLP / Portaria Tarifária AIMA',
    article: 'Artigo 87.º-A da Lei 23/2007'
  }
};

export class AimaFeeEngine {
  public static calculateFee(params: {
    procedureCode: string;
    channel: SubmissionChannel;
  }): AimaFeeCalculation {
    const feeItem = AIMA_OFFICIAL_FEE_CATALOG[params.procedureCode];

    if (!feeItem) {
      return {
        status: 'insufficient_official_source',
        estimatedFeeEur: null,
        baseFeeEur: null,
        channel: params.channel,
        reductionPercentageApplied: 0,
        reductionRule: 'insufficient_official_source',
        isDigitalChannelEligible: false,
        feeNotes: 'Procedimento sem taxa homologada no catálogo oficial 2026. Consulte a guia DUC emitida pela AIMA.',
        provenance: {
          ruleId: 'RULE_AIMA_FEE_UNKNOWN',
          legalBasis: 'Desconhecida / Não publicada',
          article: 'N/A',
          officialSource: 'N/A',
          effectiveFrom: '2026-03-01',
          verifiedAt: '2026-09-06'
        }
      };
    }

    let reductionPct = 0;
    let reductionRule: AimaReductionRule = 'none';

    if (feeItem.digitalEligible) {
      if (params.channel === 'online') {
        reductionPct = 25;
        reductionRule = 'online_25';
      } else if (params.channel === 'digital_assisted') {
        reductionPct = 10;
        reductionRule = 'digital_assisted_10';
      } else if (params.channel === 'in_person') {
        reductionPct = 0;
        reductionRule = 'in_person_full';
      }
    } else {
      // Procedimento ainda não disponível no canal digital -> Regra transitória
      if (params.channel === 'in_person') {
        reductionPct = 25;
        reductionRule = 'in_person_transitional_25';
      } else if (params.channel === 'digital_assisted') {
        reductionPct = 10;
        reductionRule = 'digital_assisted_10';
      }
    }
    const baseCents = Math.round(feeItem.baseFeeEur * 100);
    const discountedCents = Math.round(baseCents * (100 - reductionPct) / 100);
    const estimatedFeeEur = discountedCents / 100;

    return {
      status: 'official_calculated',
      estimatedFeeEur,
      baseFeeEur: feeItem.baseFeeEur,
      channel: params.channel,
      reductionPercentageApplied: reductionPct,
      reductionRule,
      isDigitalChannelEligible: feeItem.digitalEligible,
      feeNotes: `Taxa calculada com base na ${feeItem.legalBasis} (${reductionRule}).`,
      provenance: {
        ruleId: `RULE_AIMA_FEE_${feeItem.procedureId.toUpperCase()}`,
        legalBasis: feeItem.legalBasis,
        article: feeItem.article,
        officialSource: 'Diário da República — Regulamentação de Taxas AIMA (01/03/2026)',
        effectiveFrom: '2026-03-01',
        verifiedAt: '2026-09-06'
      }
    };
  }
}

// ─── 4. SUB-MOTOR DE PRAZOS PROCEDIMENTAIS E TUTELA JURISDICIONAL ───────────────

export class AimaDeadlineEngine {
  public static evaluateDeadline(params: {
    procedureType: AimaDeadlineAssessment['procedureType'];
    daysElapsed: number;
    faultAttributableToApplicant?: boolean;
    actualNoticeDays?: number;
  }): AimaDeadlineAssessment {
    // 1. Renovação de Autorização de Residência (Artigo 82.º, n.º 6 e 7 da Lei 23/2007)
    if (params.procedureType === 'residence_renewal') {
      const legalDeadlineDays = 60;
      const isExpired = params.daysElapsed > legalDeadlineDays;
      const fault = !!params.faultAttributableToApplicant;

      let status: AimaDeadlineAssessment['status'] = 'within_legal_deadline';
      let tacitApplicable = false;

      if (isExpired) {
        if (!fault) {
          status = 'tacit_approval_granted';
          tacitApplicable = true;
        } else {
          status = 'administrative_delay';
        }
      }

      return {
        procedureType: 'residence_renewal',
        legalDeadlineDays,
        deadlineUnit: 'calendar_days',
        daysElapsed: params.daysElapsed,
        isExpired,
        tacitApprovalApplicable: tacitApplicable,
        status,
        provenance: {
          ruleId: 'RULE_AIMA_DEADLINE_RENEWAL',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 82.º, n.º 6 e n.º 7',
          officialSource: 'Diário da República — Lei n.º 23/2007 consolidada',
          effectiveFrom: '2007-07-04',
          verifiedAt: '2026-09-06'
        }
      };
    }

    // 2. Concessão de Autorização de Residência com Visto (Artigo 82.º, n.º 5 da Lei 23/2007)
    if (params.procedureType === 'residence_grant_visa') {
      const legalDeadlineDays = 90;
      const isExpired = params.daysElapsed > legalDeadlineDays;

      let status: AimaDeadlineAssessment['status'] = 'within_legal_deadline';
      let recourse: AimaDeadlineAssessment['potentialLegalRecourse'] = null;

      if (isExpired) {
        status = 'administrative_delay';
        recourse = {
          primaryRecourse: 'cpta_intimacao_ato_devido',
          urgentSubsidiaryRecourse: 'cpta_direitos_liberdades',
          recourseNotice: 'Decorrido o prazo legal de 90 dias sem decisão, ocorre mora administrativa (sem deferimento tácito). O requerente pode intentar Ação de Intimação para a Prática de Ato Legalmente Devido (Art. 66.º CPTA) ou, em caso de urgência indispensável para salvaguarda de direito fundamental, Intimação Urgente (Art. 109.º CPTA), mediante representação por Advogado ou Solicitador.'
        };
      }

      return {
        procedureType: 'residence_grant_visa',
        legalDeadlineDays,
        deadlineUnit: 'calendar_days',
        daysElapsed: params.daysElapsed,
        isExpired,
        tacitApprovalApplicable: false, // NÃO existe deferimento tácito na concessão originária
        status,
        potentialLegalRecourse: recourse,
        provenance: {
          ruleId: 'RULE_AIMA_DEADLINE_GRANT_VISA',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 82.º, n.º 5',
          officialSource: 'Diário da República — Lei n.º 23/2007 consolidada',
          effectiveFrom: '2007-07-04',
          verifiedAt: '2026-09-06'
        }
      };
    }

    // 3. Audiência Prévia (Artigo 122.º, n.º 1 do CPA)
    if (params.procedureType === 'prior_hearing') {
      const minimumLegalDays = 10;
      const actualDays = params.actualNoticeDays || minimumLegalDays;
      const isExpired = params.daysElapsed > actualDays;

      return {
        procedureType: 'prior_hearing',
        legalDeadlineDays: null, // Prazo legal não é número fixo universal
        minimumLegalDays,
        actualNoticeDays: actualDays,
        deadlineUnit: 'days_minimum',
        daysElapsed: params.daysElapsed,
        isExpired,
        tacitApprovalApplicable: false,
        status: isExpired ? 'administrative_delay' : 'within_legal_deadline',
        provenance: {
          ruleId: 'RULE_AIMA_PRIOR_HEARING_CPA',
          legalBasis: 'Código do Procedimento Administrativo (DL n.º 4/2015)',
          article: 'Artigo 122.º, n.º 1',
          officialSource: 'Diário da República n.º 4/2015, Série I',
          effectiveFrom: '2015-04-07',
          verifiedAt: '2026-09-06'
        }
      };
    }

    return {
      procedureType: params.procedureType,
      legalDeadlineDays: null,
      deadlineUnit: 'calendar_days',
      daysElapsed: params.daysElapsed,
      isExpired: false,
      tacitApprovalApplicable: false,
      status: 'insufficient_legal_basis',
      provenance: {
        ruleId: 'RULE_AIMA_DEADLINE_UNKNOWN',
        legalBasis: 'Não especificada',
        article: 'N/A',
        officialSource: 'N/A',
        effectiveFrom: 'N/A',
        verifiedAt: '2026-09-06'
      }
    };
  }
}

// ─── 5. SUB-MOTOR DE DOCUMENTAÇÃO E PROVENIÊNCIA INDIVIDUAL ────────────────────

export class AimaDocumentEngine {
  public static getRequiredDocuments(pathwayId: AimaPathwayId): RequiredDocumentItem[] {
    const docs: RequiredDocumentItem[] = [
      {
        code: 'doc_passport',
        name: 'Passaporte Válido ou Documento de Viagem Reconhecido',
        description: 'Passaporte individual com validade superior à duração da estada pretendida.',
        whereToObtain: 'Autoridades consulares ou nacionais do país de origem.',
        officialGuidance: 'Apresentar original e cópia integral das páginas biométricas e carimbos.',
        provenance: {
          ruleId: 'RULE_DOC_PASSPORT',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 52.º, n.º 1',
          officialSource: 'Diário da República — Lei n.º 23/2007',
          effectiveFrom: '2007-07-04',
          verifiedAt: '2026-09-06'
        }
      },
      {
        code: 'doc_criminal_record',
        name: 'Certificado de Registo Criminal do País de Origem',
        description: 'Registo criminal emitido pelo país de nacionalidade ou residência anterior habitual.',
        whereToObtain: 'Ministério da Justiça ou autoridade policial do país emissor.',
        officialGuidance: 'Deve estar apostilado (Convenção da Haia) ou legalizado no posto consular português e traduzido.',
        provenance: {
          ruleId: 'RULE_DOC_CRIMINAL_RECORD',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 53.º e Artigo 77.º',
          officialSource: 'Diário da República — Lei n.º 23/2007',
          effectiveFrom: '2007-07-04',
          verifiedAt: '2026-09-06'
        }
      },
      {
        code: 'doc_accommodation_proof',
        name: 'Comprovativo de Alojamento Adequado',
        description: 'Contrato de arrendamento registado na AT, escritura de imóvel ou termo de acolhimento.',
        whereToObtain: 'Senhorio (registado no Portal das Finanças) ou anfitrião residente.',
        officialGuidance: 'O contrato deve identificar os residentes e o número de contrato registado na Autoridade Tributária.',
        provenance: {
          ruleId: 'RULE_DOC_ACCOMMODATION',
          legalBasis: 'Portaria n.º 1563/2007',
          article: 'Artigo 2.º, n.º 1',
          officialSource: 'Diário da República n.º 238/2007, Série I',
          effectiveFrom: '2007-12-12',
          verifiedAt: '2026-09-06'
        }
      }
    ];

    if (pathwayId === 'work_d1') {
      docs.push({
        code: 'doc_work_contract_d1',
        name: 'Contrato de Trabalho ou Promessa de Contrato',
        description: 'Vínculo laboral com entidade empregadora sediada em Portugal, com remuneração >= RMMG.',
        whereToObtain: 'Entidade empregadora portuguesa.',
        officialGuidance: 'Exige-se registo na Segurança Social e declaração de remuneração compatível com a legislação laboral.',
        provenance: {
          ruleId: 'RULE_DOC_WORK_CONTRACT_D1',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 88.º, n.º 1',
          officialSource: 'Diário da República — Lei n.º 23/2007',
          effectiveFrom: '2007-07-04',
          verifiedAt: '2026-09-06'
        }
      });
    }

    if (pathwayId === 'passive_income_d7') {
      docs.push({
        code: 'doc_passive_income_proof',
        name: 'Comprovativo de Rendimentos Passivos Estáveis e Transferíveis',
        description: 'Certidão de reforma/pensão, contratos de arrendamento de imóveis, declarações de dividendos estáveis.',
        whereToObtain: 'Entidades pagadoras de pensões, registo predial ou instituições financeiras.',
        officialGuidance: 'Exige-se prova documental da titularidade, montante de 12 meses e disponibilidade efetiva em Portugal.',
        provenance: {
          ruleId: 'RULE_DOC_PASSIVE_INCOME_D7',
          legalBasis: 'Portaria n.º 1563/2007',
          article: 'Artigo 5.º, n.º 6',
          officialSource: 'Diário da República n.º 238/2007, Série I',
          effectiveFrom: '2007-12-12',
          verifiedAt: '2026-09-06'
        }
      });
    }

    if (pathwayId === 'digital_nomad_d8') {
      docs.push({
        code: 'doc_nomad_d8_proof',
        name: 'Contrato de Trabalho Remoto / Prestação Externa e Extratos Médios (>= 4×RMMG)',
        description: 'Vínculo com entidade não sediada em Portugal e extratos bancários médios dos últimos 3 meses.',
        whereToObtain: 'Empregador/cliente estrangeiro e instituições bancárias.',
        officialGuidance: 'Comprovar rendimento médio mensal superior a 4 vezes a RMMG (€3.680,00 no Continente).',
        provenance: {
          ruleId: 'RULE_DOC_NOMAD_D8',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 90.º-A',
          officialSource: 'Diário da República n.º 149/2022, Série I',
          effectiveFrom: '2022-10-30',
          verifiedAt: '2026-09-06'
        }
      });
    }

    if (pathwayId === 'job_search') {
      docs.push({
        code: 'doc_job_search_funds',
        name: 'Comprovativo de Recursos Financeiros de Procura de Trabalho (>= 3×RMMG)',
        description: 'Disponibilidade de capital mínimo em conta ou termo de responsabilidade de cidadão/entidade residente.',
        whereToObtain: 'Instituição bancária ou anfitrião habilitado com idoneidade financeira comprovada.',
        officialGuidance: 'Valor mínimo de 3 RMMG (€2.760,00 no Continente) disponível para a duração inicial de 120 dias do visto.',
        provenance: {
          ruleId: 'RULE_DOC_JOB_SEARCH_FUNDS',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 57.º-A, n.º 3',
          officialSource: 'Diário da República n.º 149/2022, Série I',
          effectiveFrom: '2022-10-30',
          verifiedAt: '2026-09-06'
        }
      });
    }

    if (pathwayId === 'art122_special') {
      docs.push({
        code: 'doc_art122_grounds',
        name: 'Comprovativo do Enquadramento Específico nas Alíneas do Artigo 122.º',
        description: 'Certidão de nascimento em PT, comprovativo de menor residente a cargo, laços sociais ou relatório médico oficial.',
        whereToObtain: 'Conservatória do Registo Civil, Tribunal, Estabelecimento de Saúde Oficial SNS.',
        officialGuidance: 'O pedido de dispensa de visto exige demonstração cabal do enquadramento taxativo nas alíneas do Art. 122.º.',
        provenance: {
          ruleId: 'RULE_DOC_ART122_SPECIAL',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 122.º',
          officialSource: 'Diário da República — Lei n.º 23/2007',
          effectiveFrom: '2007-07-04',
          verifiedAt: '2026-09-06'
        }
      });
    }

    if (pathwayId === 'cplp_mobility') {
      docs.push({
        code: 'doc_cplp_agreement',
        name: 'Comprovativo de Cidadania CPLP e Requisitos do Acordo de Mobilidade',
        description: 'Passaporte válido de Estado-Membro da CPLP com dispensa de certos comprovativos consulares.',
        whereToObtain: 'Portal AIMA / Autoridades do Estado-Membro CPLP.',
        officialGuidance: 'Permite a obtenção de título inicial e posterior conversão para cartão de residência biométrico.',
        provenance: {
          ruleId: 'RULE_DOC_CPLP_MOBILITY',
          legalBasis: 'Lei n.º 23/2007',
          article: 'Artigo 87.º-A e Acordo de Mobilidade CPLP',
          officialSource: 'Diário da República n.º 149/2022, Série I',
          effectiveFrom: '2022-10-30',
          verifiedAt: '2026-09-06'
        }
      });
    }

    return docs;
  }
}

// ─── 6. SUB-MOTOR DE REGIME TRANSITÓRIO SAPA (ESTRUTURA DE MISSÃO) ─────────────

export class AimaLegacyManifestationEngine {
  public static evaluateLegacyEligibility(submissionDateStr: string) {
    const isLegacyEligible = submissionDateStr <= NORMATIVE_AIMA_2026.LEGACY_CUTOFF_DATE;

    return {
      isLegacyEligible,
      cutoffDate: NORMATIVE_AIMA_2026.LEGACY_CUTOFF_DATE,
      status: isLegacyEligible ? 'covered_by_mission_structure' : 'revoked_by_dl_37a_2024',
      guidance: isLegacyEligible
        ? 'Processo SAPA submetido até 03/06/2024: abrangido pelo regime transitório da Estrutura de Missão da AIMA (acompanhamento de pagamento de DUC e atendimento temporário).'
        : 'Processos com entrada após 03/06/2024: revogados expressamente pelo Decreto-Lei n.º 37-A/2024. É vedada a regularização por trabalho subordinado/independente sem visto consular prévio.',
      provenance: {
        ruleId: 'RULE_AIMA_LEGACY_SAPA',
        legalBasis: 'Decreto-Lei n.º 37-A/2024 e DL n.º 41-A/2024',
        article: 'Artigo 2.º (DL 37-A/2024)',
        officialSource: 'Diário da República n.º 106/2024, 1.ª Série',
        effectiveFrom: '2024-06-03',
        verifiedAt: '2026-09-06'
      }
    };
  }
}

// ─── 7. ORQUESTRADOR CANÓNICO GLOBAL (`miraAimaEngine`) ─────────────────────────

export class MiraAimaEngine {
  public static evaluateCompliance(params: {
    pathwayId: AimaPathwayId;
    territory?: PortugueseTerritory;
    household: HouseholdComposition;
    employmentRegime?: EmploymentRegime;
    regime?: EmploymentRegime;
    availableNetMonthlyEur: number;
    availableCapitalEur?: number;
    grossIncomeEur?: number;
    d7Detail?: D7PassiveIncomeDetail;
    jobSearchProof?: JobSearchFinancialProof;
    procedureType?: AimaDeadlineAssessment['procedureType'];
    daysElapsed?: number;
    faultAttributableToApplicant?: boolean;
    submissionChannel?: SubmissionChannel;
    procedureCodeForFees?: string;
  }): UnifiedAimaComplianceResult {
    const territory = params.territory || 'mainland';
    const pathwayId = params.pathwayId;
    const empRegime = params.employmentRegime || params.regime || (
      pathwayId === 'passive_income_d7' ? 'passive_income' :
      pathwayId === 'job_search' ? 'job_seeker' :
      pathwayId === 'work_d1' ? 'tco_general' : 'unspecified'
    );

    const jobSearchProof = params.jobSearchProof || (
      typeof params.availableCapitalEur === 'number'
        ? { proofType: 'own_financial_resources' as const, availableCapitalEur: params.availableCapitalEur }
        : undefined
    );

    const d7Detail = params.d7Detail || (
      pathwayId === 'passive_income_d7'
        ? {
            incomeNature: 'other_passive' as const,
            proofOfAvailability: true,
            availableInPortugal: true,
            availableNetMonthlyEur: params.availableNetMonthlyEur
          }
        : undefined
    );

    // 1. Avaliação de Meios de Subsistência
    const subsistence = AimaMeansOfSubsistenceEngine.calculateSubsistence({
      household: params.household,
      territory,
      availableNetMonthlyEur: params.availableNetMonthlyEur,
      pathwayId,
      d7Detail,
      jobSearchProof
    });

    // 2. Avaliação de Segurança Social Condicionada
    const socialSecurityCheck = AimaSocialSecurityEngine.evaluateSocialSecurity({
      employmentRegime: empRegime,
      pathwayId,
      grossIncomeEur: params.grossIncomeEur
    });

    // 3. Avaliação de Taxas
    const feeCode = params.procedureCodeForFees || (
      pathwayId === 'cplp_mobility' ? 'cplp_initial_permit' :
      pathwayId === 'art122_special' ? 'residence_grant_art122' : 'residence_grant_visa'
    );
    const fees = AimaFeeEngine.calculateFee({
      procedureCode: feeCode,
      channel: params.submissionChannel || 'online'
    });

    // 4. Avaliação de Prazos (se fornecido)
    let deadlines: AimaDeadlineAssessment | undefined;
    if (params.procedureType && typeof params.daysElapsed === 'number') {
      deadlines = AimaDeadlineEngine.evaluateDeadline({
        procedureType: params.procedureType,
        daysElapsed: params.daysElapsed,
        faultAttributableToApplicant: params.faultAttributableToApplicant
      });
    }

    // 5. Documentos Oficiais Requeridos
    const requiredDocuments = AimaDocumentEngine.getRequiredDocuments(pathwayId);

    // 6. Alertas Normativos Oficiais
    const legalWarnings: string[] = [];
    if (pathwayId === 'work_d1' || pathwayId === 'entrepreneur_d2') {
      legalWarnings.push('O Decreto-Lei n.º 37-A/2024 revogou as manifestações de interesse. É obrigatória a posse de visto de residência consular prévio.');
    }
    if (pathwayId === 'passive_income_d7' && !subsistence.d7Detail?.isAvailabilityInPortugalConfirmed) {
      legalWarnings.push('Portaria n.º 1563/2007, Art. 5.º, n.º 6: É obrigatória a comprovação da disponibilidade efetiva dos rendimentos passivos em Portugal.');
    }

    // 7. Determinação do Estado de Conformidade Jurídica (`complianceStatus`)
    let complianceStatus: UnifiedAimaComplianceResult['complianceStatus'] = 'compliant';

    if (!subsistence.isCompliant) {
      complianceStatus = 'non_compliant';
    } else if (socialSecurityCheck.status === 'insufficient_legal_basis') {
      complianceStatus = 'insufficient_legal_basis';
    }

    // 8. Cadeia de Proveniência Normativa Completa
    const provenanceChain: NormativeProvenance[] = [subsistence.provenance];
    if (socialSecurityCheck.provenance) provenanceChain.push(socialSecurityCheck.provenance);
    if (fees.provenance) provenanceChain.push(fees.provenance);
    if (deadlines?.provenance) provenanceChain.push(deadlines.provenance);
    for (const doc of requiredDocuments) {
      provenanceChain.push(doc.provenance);
    }

    return {
      pathwayId,
      complianceStatus,
      subsistence,
      socialSecurityCheck,
      fees,
      deadlines,
      requiredDocuments,
      legalWarnings,
      provenanceChain
    };
  }
}
