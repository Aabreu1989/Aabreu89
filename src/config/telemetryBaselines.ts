/**
 * 🛡️ MIRA SOVEREIGN BASELINES & TELEMETRY CONFIGURATION (TypeScript Interface)
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exporta definições tipadas a partir de lib/telemetryBaselines.js.
 */

export {
    TELEMETRY_CUTOFF_DATE,
    CANONICAL_AI_METRICS,
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
    // C.2 — Recorrentes pós-cutoff: number (resultado real) | null (falha de query — preservar erro)
    // 🔒 PROIBIDO: tratar null como 0. null indica falha de integração, não ausência de recorrentes.
    returningUsersPostCutoff: number | null;

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
    aiUserQueries: number;
    aiTelemetry: number;
    totalAiEvents: number;
    simulations: number;
    userDocuments: number;
    pwaMobile: number;
    pwaDesktop: number;
    // C.1 — Referência histórica legada (832). NÃO é contagem observada.
    returningUsers: number;
    // C.2 — Contagem real pós-cutoff. null = falha de query; não deve ser tratado como zero.
    returningUsersPostCutoff: number | null;

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
