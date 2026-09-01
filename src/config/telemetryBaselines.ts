/**
 * 🛡️ MIRA SOVEREIGN BASELINES & TELEMETRY CONFIGURATION (TypeScript Interface)
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exporta definições tipadas a partir de lib/telemetryBaselines.js.
 */

export {
    TELEMETRY_CUTOFF_DATE,
    CANONICAL_AI_METRICS,
    HISTORICAL_CUMULATIVE_BASELINES,
    HISTORICAL_AI_CATEGORIES,
    CANONICAL_HUMAN_ACTIONS,
    CANONICAL_INTERACTION_ACTIONS,
    ADMIN_USER_IDS,
    deriveCanonicalRecurrenceMetrics,
    consolidatePlatformMetrics
} from '../../lib/telemetryBaselines.js';

export interface RealDatabaseTelemetryCounts {
    // Tipo A: Eventos da Telemetria (activity_logs pós-cutoff)
    appAccessesEvents: number;
    canonicalInteractionEvents: number;
    aiQueryEvents: number;
    simulationEvents: number;
    docDownloadEvents: number;
    pwaMobileEvents: number;
    pwaDesktopEvents: number;
    // Recorrentes pós-cutoff calculados via session clustering e dias distintos
    returningUsersPostCutoff: number | null;
    platformUsersEligible?: number;
    baseObservedUsers?: number;
    kpiUsersCount?: number;
    observedUsers?: number;
    distinctSessions?: number;
    distinctDaysReturningUsers?: number;
    weightedAdherenceScoreTotal?: number;
    weightedAdherenceReturningIndex?: number;
    weightedAdherenceIndex?: number;
    weightedAdherenceMethodology?: string;

    // Tipo B: Estado Corrente das Tabelas da Base de Dados (COUNT real direto)
    currentUsers: number;
    currentJobs: number;
    currentServices: number;
    currentCourses: number;
    currentPosts: number;
    currentComments: number;
    currentLikes: number;
}

export interface RecurrenceMetricsSnapshot {
    isLoaded: boolean;
    // 🔒 KPI SOBERANO FINAL ÚNICO:
    weightedRetentionRate: number;
    retentionRate?: number;
    // Universos Canónicos Segregados:
    platformUsersEligible?: number;
    platformUsers?: number;
    baseObservedUsers?: number;
    kpiUsersCount?: number;
    observedUsers: number;
    distinctSessions: number;
    returningUsers: number;
    observedRetentionRate: number;
    distinctDaysReturningUsers: number;
    distinctDaysRetentionRate: number;
    intraDayOnlyReturningUsers: number;
    weightedAdherenceScoreTotal: number;
    weightedAdherenceReturningIndex: number;
    weightedAdherenceIndex: number;
    weightedAdherenceMethodology: string;
    historicalReturningUsersBaseline: number;
    telemetryPeriodStart: string;
    sessionRule: string;
    distinctDaysRule: string;
    sourceSnapshotAt: string;
}

export interface ConsolidatedPlatformMetrics {
    users: number;
    appAccesses: number;
    totalInteractions: number;
    aiQueries: number;
    aiUserQueries: number;
    aiTelemetry: number;
    totalAiEvents: number;
    simulations: number;
    userDocuments: number;
    pwaMobile: number;
    pwaDesktop: number;

    // 🔒 ÚNICA AUTORIDADE DE RETORNO E RECORRÊNCIA
    recurrence: RecurrenceMetricsSnapshot | null;

    // Aliases derivados de compatibilidade
    observedUsers: number;
    distinctSessions: number;
    returningUsers: number;
    observedRetentionRate: number;
    distinctDaysReturningUsers: number;
    distinctDaysRetentionRate: number;
    retentionRate: number; // Mapeado para observedRetentionRate

    // Referência Histórica Documentada (Piloto)
    historicalReturningUsersBaseline: number;
    telemetryPeriodStart: string;
    sessionRule: string;
    distinctDaysRule: string;

    jobs: number;
    services: number;
    courses: number;
    posts: number;
    comments: number;
    likes: number;
    horasPoupadas: number;
    processosAjudados: number;
}
