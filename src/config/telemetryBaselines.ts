/**
 * 🛡️ MIRA SOVEREIGN BASELINES & TELEMETRY CONFIGURATION (TypeScript Interface)
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exporta definições tipadas a partir de lib/telemetryBaselines.js.
 */

export {
    TELEMETRY_CUTOFF_DATE,
    HISTORICAL_CUMULATIVE_BASELINES,
    CANONICAL_INTERACTION_ACTIONS,
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
    returningUsersPostCutoff: number;

    // Tipo B: Estado Corrente das Tabelas da Base de Dados (COUNT real direto)
    currentUsers: number;
    currentJobs: number;
    currentServices: number;
    currentCourses: number;
    currentPosts: number;
    currentComments: number;
    currentLikes: number;
}

export interface ConsolidatedPlatformMetrics {
    users: number;
    appAccesses: number;
    totalInteractions: number;
    aiQueries: number;
    simulations: number;
    userDocuments: number;
    pwaMobile: number;
    pwaDesktop: number;
    returningUsers: number;

    jobs: number;
    services: number;
    courses: number;
    posts: number;
    comments: number;
    likes: number;

    horasPoupadas: number;
    processosAjudados: number;
    retentionRate: number;
}
