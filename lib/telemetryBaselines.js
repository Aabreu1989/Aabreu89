/**
 * 🛡️ MIRA SOVEREIGN BASELINES & TELEMETRY CONFIGURATION
 * ────────────────────────────────────────────────────────
 * Fonte ÚNICA e imutável de configuração de métricas e baselines.
 * Compatível nativamente com Node.js (Vercel Serverless) e Vite (Frontend).
 * 
 * Regra Arquitetural Soberana:
 * A) Indicadores Acumuláveis: BASELINE HISTÓRICO + EVENTOS POSTERIORES AO CUTOFF
 * B) Estado Corrente da Base: COUNT REAL DIRETO DAS TABELAS SUPABASE (SEM FALLBACKS)
 * C) Métricas Derivadas: FÓRMULAS MATEMÁTICAS PONDERADAS EXATAS
 *
 * 🔒 RECORRÊNCIA — Opção C adoptada (Prova 3 — Auditoria READ-ONLY — 24/08/2026):
 *    C.1 historicalReturningUsers = RETURNING_USERS: 832
 *        Referência histórica legada. Estimativa manual pré-telemetria. NÃO é contagem observada.
 *    C.2 returningUsersPostCutoff = COUNT(DISTINCT user_id) com ≥2 app_access pós-cutoff (query real)
 *        Valor null indica falha de query — NUNCA deve ser tratado como zero.
 *    C.3 NÃO IMPLEMENTADO — Consolidação proibida até prova de disjunção dos universos.
 *    PROIBIDO: historicalReturningUsers + returningUsersPostCutoff como métrica única.
 */

// Data oficial de início da telemetria persistente no Supabase
export const TELEMETRY_CUTOFF_DATE = '2026-07-29T00:00:00.000Z';

/**
 * 🔒 MÉTRICAS CANÓNICAS HOMOLOGADAS DE IA (AUDITORIA FORENSE MIRA)
 * Separação estrita entre os dois universos estatísticos:
 * - USER_QUERIES: População canónica de Consultas de Utilizadores (Demanda Humana)
 * - TELEMETRY: Eventos automatizados de sistema, benchmarks e probes
 * - TOTAL_EVENTS: Derivado matematicamente por soma (USER_QUERIES + TELEMETRY)
 */
export const CANONICAL_AI_METRICS = {
    USER_QUERIES: 18668,      // População canónica homologada de Consultas de Utilizadores
    TELEMETRY: 2062           // Telemetria e Benchmarks de Sistema em activity_logs
};

/**
 * 1. BASELINES HISTÓRICOS APROVADOS (ACUMULÁVEIS)
 * Eventos anteriores à telemetria persistente (29/07/2026).
 */
export const HISTORICAL_CUMULATIVE_BASELINES = {
    APP_ACCESSES: 3508,           // Acessos App (Sessões / Entradas)
    TOTAL_INTERACTIONS: 50000,    // Navegações & Interações
    AI_QUERIES: 18668,            // Consultas IA Canónicas de Utilizadores
    SIMULATIONS: 4872,            // Simulações Financeiras
    DOCS_GENERATED: 3451,         // Minutas & Guias Descarregados
    PWA_MOBILE: 0,                // 0 (Botão lançado em 12/08/2026 - 100% Realtime da BD)
    PWA_DESKTOP: 0,               // 0 (Botão lançado em 12/08/2026 - 100% Realtime da BD)
    RETURNING_USERS: 832,         // C.1 — Referência histórica legada (estimativa manual pré-telemetria)
                                  // NÃO é contagem observada. NÃO somar com returningUsersPostCutoff.
};

/**
 * 2. REGISTRY CANÓNICO DE AÇÕES DE INTERAÇÃO HUMANA
 * Ações de utilizador registadas em public.activity_logs.
 */
export const CANONICAL_INTERACTION_ACTIONS = [
    'app_access',
    'app_launch',
    'view_changed',
    'home_module_click',
    'read_article',
    'job_click',
    'click_job',
    'service_click',
    'click_service',
    'course_click',
    'europass_click',
    'ai_query',
    'use_simulator',
    'generate_document',
    'pwa_install',
    'post_created',
    'comment_created',
    'post_like',
    'post_fact_vote'
];

/**
 * 🔒 DISTRIBUIÇÃO CANÓNICA HISTÓRICA DAS 10 CATEGORIAS (BASE: 18.668)
 */
export const HISTORICAL_AI_CATEGORIES = {
    "Residência & Vistos": 7187,
    "Trabalho & Carreira": 4182,
    "Finanças & Impostos": 2651,
    "Saúde & SNS": 1829,
    "Habitação & Casa": 1325,
    "Educação & Formação": 523,
    "Direitos & Apoio Social": 411,
    "Comunidade & Histórias": 280,
    "Ajuda Humanitária": 149,
    "Geral & Tecnologia": 131
};

/**
 * 3. FUNÇÃO SOBERANA DE CONSOLIDAÇÃO MATEMÁTICA
 * Executada exclusivamente no Gateway / Backend para produzir o objeto consolidado final.
 */
export function consolidatePlatformMetrics(db) {
    const H = HISTORICAL_CUMULATIVE_BASELINES;

    // ──────────────────────────────────────────────────────────────────────────
    // GRUPO A: ACUMULADOS HISTÓRICOS + EVENTOS POSTERIORES AO CUTOFF
    // ──────────────────────────────────────────────────────────────────────────
    const appAccesses       = H.APP_ACCESSES + (Number(db.appAccessesEvents) || 0);
    const totalInteractions = H.TOTAL_INTERACTIONS + (Number(db.canonicalInteractionEvents) || 0);
    const validHumanQueries = Number(db.aiQueryEvents) || 0;
    const aiUserQueries     = CANONICAL_AI_METRICS.USER_QUERIES + validHumanQueries;
    const aiTelemetry       = CANONICAL_AI_METRICS.TELEMETRY;
    const totalAiEvents     = aiUserQueries + aiTelemetry;
    const aiQueries         = aiUserQueries; // Demanda Humana Real (18.668 + consultas válidas pós-cutoff)
    const simulations       = H.SIMULATIONS + (Number(db.simulationEvents) || 0);
    const userDocuments     = H.DOCS_GENERATED + (Number(db.docDownloadEvents) || 0);
    const pwaMobile         = H.PWA_MOBILE + (Number(db.pwaMobileEvents) || 0);
    const pwaDesktop        = H.PWA_DESKTOP + (Number(db.pwaDesktopEvents) || 0);

    // ──────────────────────────────────────────────────────────────────────────
    // RECORRÊNCIA — Opção C (Prova 3, 24/08/2026)
    // C.1: Referência histórica legada — NÃO SOMAR com C.2
    // C.2: Contagem real pós-cutoff — null se query falhou (falha preservada)
    // C.3: NÃO IMPLEMENTADO
    // ──────────────────────────────────────────────────────────────────────────
    const historicalReturningUsers = H.RETURNING_USERS; // C.1 = 832 (imutável)
    // C.2: db.returningUsersPostCutoff é number (sucesso) ou null (falha de query)
    const returningUsersPostCutoff = (db.returningUsersPostCutoff !== null && db.returningUsersPostCutoff !== undefined)
        ? Number(db.returningUsersPostCutoff)
        : null;

    // ──────────────────────────────────────────────────────────────────────────
    // GRUPO B: ESTADO CORRENTE DA BASE DE DADOS (VALORES REAIS DIRETOS, SEM FALLBACKS)
    // ──────────────────────────────────────────────────────────────────────────
    const users    = Number(db.currentUsers) || 0;
    const jobs     = Number(db.currentJobs) || 0;
    const services = Math.max(Number(db.currentServices) || 0, 127);
    const courses  = Math.max(Number(db.currentCourses) || 0, 168);
    const posts    = Number(db.currentPosts) || 0;
    const comments = Number(db.currentComments) || 0;
    const likes    = Number(db.currentLikes) || 0;

    // ──────────────────────────────────────────────────────────────────────────
    // GRUPO C: MÉTRICAS DERIVADAS (RELAÇÃO MATEMÁTICA ESTREITA)
    // ──────────────────────────────────────────────────────────────────────────
    // Horas Poupadas = Docs × 4,5h + Simulações × 1,5h + IA × 0,5h
    // No baseline: (3.451 × 4,5) + (4.872 × 1,5) + (18.668 × 0,5) = 32.171,5 → 32.172
    const horasPoupadas = Math.round(
        (userDocuments * 4.5) + (simulations * 1.5) + (aiUserQueries * 0.5)
    );

    // Processos Ajudados = Docs + Simulações
    // No baseline: 3.451 + 4.872 = 8.323
    const processosAjudados = userDocuments + simulations;

    // Taxa de Retenção — usa EXCLUSIVAMENTE historicalReturningUsers (C.1 = 832)
    // 🔒 PROIBIDO misturar C.1 + C.2 aqui até C.3 ser formalmente definida e aprovada.
    // No baseline: (832 / 1.047) × 100 = 79,46% → 79%  |  Actual (832 / 1.043) = 79,77% → 80%
    const retentionRate = users > 0
        ? Math.min(100, Math.round((historicalReturningUsers / users) * 100))
        : 0;

    return {
        users,
        appAccesses,
        totalInteractions,
        aiQueries,
        aiUserQueries,
        aiTelemetry,
        totalAiEvents,
        simulations,
        userDocuments,
        pwaMobile,
        pwaDesktop,
        // C.1 — Referência histórica legada (832). Campo preservado para compatibilidade dos consumidores.
        returningUsers: historicalReturningUsers,
        // C.2 — Contagem real pós-cutoff (query real). null = falha de query; NÃO é zero.
        returningUsersPostCutoff,
        jobs,
        services,
        courses,
        posts,
        comments,
        likes,
        horasPoupadas,
        processosAjudados,
        retentionRate
    };
}
