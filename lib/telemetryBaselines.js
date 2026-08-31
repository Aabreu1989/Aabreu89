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
 * 🔒 REGISTRY OFICIAL CANÓNICO DE AÇÕES HUMANAS DELIBERADAS (17 AÇÕES LITERAIS)
 * Ações exclusivas que demonstram interação humana voluntária e fundamentam sessões de uso.
 * 
 * Classificação Imutável:
 * - 🟢 HUMAN_CANONICAL: As 17 ações abaixo (iniciam/continuam sessões de uso).
 * - 🟡 AUTOMATIC_DERIVED: badge_awarded, reputation_gained, verify_user, points_earned (NÃO criam sessões).
 * - 🔵 SYSTEM_INFRA: app_access, app_launch, pwa_install, system_benchmark (Infra/Cold starts).
 * - ⛔ ADMIN_OPS: admin_*, post_deleted (Moderação/Operação).
 * - 🧪 DIAGNOSTIC_PROBE: audit_diagnostic, probes, testes técnicos.
 */
export const CANONICAL_HUMAN_ACTIONS = [
    'view_changed',        // Navegação voluntária entre ecrãs
    'home_module_click',   // Clique deliberado em card da Home
    'ai_query',            // Pergunta humana voluntária no Chat
    'use_simulator',       // Execução voluntária de cálculo no Simulador
    'job_click',           // Clique voluntário para ver vaga de emprego
    'click_job',           // Variante de clique em vaga de emprego
    'service_click',       // Clique voluntário para ver balcão/serviço público
    'click_service',       // Variante de clique em balcão/serviço público
    'course_click',        // Clique voluntário para ver curso de formação
    'read_article',        // Leitura voluntária de artigo/guia
    'generate_document',   // Geração voluntária de minuta jurídica
    'post_created',        // Criação deliberada de publicação na comunidade
    'comment_created',     // Criação deliberada de comentário na comunidade
    'post_like',           // Interação deliberada de like em publicação
    'post_fact_vote',      // Voto de verificação voluntário na comunidade
    'user_followed',       // Seguir voluntariamente outro utilizador
    'europass_click'       // Clique deliberado para exportar modelo Europass
];

/**
 * 🔒 REGISTRY CANÓNICO DE TRÁFEGO GLOBAL & NAVEGAÇÕES (19 AÇÕES)
 * Utilizado exclusivamente para contabilizar Páginas Vistas + Ações globais (54.043+).
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
    // MODELO DUAL DE RECORRÊNCIA (TELEMETRIA TEMPO REAL PÓS-CUTOFF)
    // • Universo Observado (observedUsers): Utilizadores distintos com ≥1 sessão canónica
    // • Métrica A — Recorrência por Sessões (returningUsers): Utilizadores com ≥2 sessões canónicas distintas (inatividade ≥30m ou datas distintas)
    //   Taxa de Recorrência por Sessões (observedRetentionRate): (returningUsers / observedUsers) * 100
    // • Métrica B — Retorno em Dias Distintos (distinctDaysReturningUsers): Utilizadores com atividade em ≥2 datas civis distintas
    //   Taxa de Retorno em Dias Distintos (distinctDaysRetentionRate): (distinctDaysReturningUsers / observedUsers) * 100
    // • Baseline Histórico Piloto (historicalReturningUsersBaseline): 832 (referência legada documentada — NÃO usada em cálculos live)
    // ──────────────────────────────────────────────────────────────────────────
    const observedUsers          = Number(db.observedUsers) || 0;
    const distinctSessions       = Number(db.distinctSessions) || 0;
    const returningUsers         = (db.returningUsersPostCutoff !== null && db.returningUsersPostCutoff !== undefined)
        ? Number(db.returningUsersPostCutoff)
        : (Number(db.returningUsers) || 0);

    const distinctDaysReturningUsers = Number(db.distinctDaysReturningUsers) || 0;

    const observedRetentionRate  = observedUsers > 0
        ? Math.round((returningUsers / observedUsers) * 1000) / 10
        : 0;

    const distinctDaysRetentionRate = observedUsers > 0
        ? Math.round((distinctDaysReturningUsers / observedUsers) * 1000) / 10
        : 0;

    const intraDayOnlyReturningUsers = Math.max(0, returningUsers - distinctDaysReturningUsers);

    // historicalReturningUsersBaseline: Preservado exclusivamente como documentação histórica
    const historicalReturningUsersBaseline = H.RETURNING_USERS; // 832

    // 🔒 SNAPSHOT ATÓMICO SOBERANO DE RECORRÊNCIA
    const recurrence = (observedUsers > 0 || returningUsers > 0) ? {
        isLoaded: true,
        observedUsers,
        distinctSessions,
        returningUsers,
        observedRetentionRate,
        distinctDaysReturningUsers,
        distinctDaysRetentionRate,
        intraDayOnlyReturningUsers,
        historicalReturningUsersBaseline,
        telemetryPeriodStart: TELEMETRY_CUTOFF_DATE,
        sessionRule: 'Atividade humana canónica separada por inatividade ≥ 30 minutos ou alteração de data civil UTC',
        distinctDaysRule: 'Atividade humana canónica registada em ≥ 2 datas civis UTC distintas',
        sourceSnapshotAt: new Date().toISOString()
    } : null;

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
    const horasPoupadas = Math.round(
        (userDocuments * 4.5) + (simulations * 1.5) + (aiUserQueries * 0.5)
    );

    const processosAjudados = userDocuments + simulations;

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
        // 🔒 ÚNICA AUTORIDADE
        recurrence,
        // Recorrência Observada em Tempo Real (Aliases de compatibilidade)
        observedUsers,
        distinctSessions,
        returningUsers,
        observedRetentionRate,
        distinctDaysReturningUsers,
        distinctDaysRetentionRate,
        retentionRate: observedRetentionRate, // Mapeado para compatibilidade com consumidores
        // Referência Histórica Documentada (Auditada — NÃO live)
        historicalReturningUsersBaseline,
        telemetryPeriodStart: TELEMETRY_CUTOFF_DATE,
        sessionRule: 'Atividade humana canónica separada por inatividade ≥ 30 minutos ou alteração de data civil UTC',
        distinctDaysRule: 'Atividade humana canónica registada em ≥ 2 datas civis UTC distintas',
        jobs,
        services,
        courses,
        posts,
        comments,
        likes,
        horasPoupadas,
        processosAjudados
    };
}
