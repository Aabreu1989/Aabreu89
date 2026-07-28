-- ============================================================
-- 🛡️ MIRA V2026: SNIPER PERFORMANCE v1.0
-- AUTHOR: Antigravity (Advanced Agentic Coding)
-- TARGET: Admin Hub Realtime & Ultra-Fast Database Engine
-- ============================================================

-- 1. EXTENSIONS & SEARCH HARDENING
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. INDEXAÇÃO SNIPER (Sub-100ms)
-- Trigram indexes for instant search by email/name
CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm ON public.profiles USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin (name gin_trgm_ops);

-- Reports prioritization index
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);

-- 3. VIEW UNIFICADA: GLOBAL KNOWLEDGE SEARCH
-- Unions saber_ia, knowledge_base and newsroom_articles for FTS
CREATE OR REPLACE VIEW public.global_knowledge_search AS
SELECT 
    id, 
    topic, 
    content, 
    category, 
    url, 
    created_at, 
    'saber_ia' as source_table,
    false as is_newsroom
FROM public.saber_ia
UNION ALL
SELECT 
    id, 
    topic, 
    content, 
    category, 
    url, 
    created_at, 
    'knowledge_base' as source_table,
    false as is_newsroom
FROM public.knowledge_base
UNION ALL
SELECT 
    id, 
    title as topic, 
    content, 
    category, 
    slug as url, 
    created_at, 
    'newsroom_articles' as source_table,
    true as is_newsroom
FROM public.newsroom_articles;

-- 4. RPC UNIFICADO: DASHBOARD SOVEREIGN STATS
-- Returns all critical counts in a single JSONB round-trip
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats_v3()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Security Check
    IF LOWER(auth.jwt()->>'email') != 'amandasabreu89@gmail.com' AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'MIRA SECURITY: Acesso negado às estatísticas soberanas.';
    END IF;

    SELECT jsonb_build_object(
        'users_count', (SELECT count(*) FROM public.profiles),
        'pending_reports_count', (SELECT count(*) FROM public.reports WHERE status = 'pending' OR status IS NULL),
        'jobs_count', (SELECT count(*) FROM public.job_posts),
        'courses_count', (SELECT count(*) FROM public.courses),
        'services_count', (SELECT count(*) FROM public.map_alerts),
        'suggestions_count', (SELECT count(*) FROM public.suggestions WHERE status = 'pending'),
        'last_updated', now()
    ) INTO result;

    RETURN result;
END;
$$;

-- 5. REALTIME ACTIVATION
-- Ensures community_reports (reports table) triggers are sent via Websocket
-- Note: This requires the table to be part of the 'supabase_realtime' publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'reports'
    ) THEN
        -- We try to add it, ignoring if the publication doesn't exist yet (standard in some setups)
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Nao foi possivel adicionar reports a publicacao realtime automaticamente.';
        END;
    END IF;
END $$;

COMMENT ON VIEW public.global_knowledge_search IS 'MIRA V2026: Sniper Unified Knowledge Search Window.';
COMMENT ON FUNCTION public.get_admin_dashboard_stats_v3 IS 'MIRA V2026: Sovereign Dashboard Single-Trip Stats.';
