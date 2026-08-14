-- ============================================================
-- 💎 MIRA V2026.ULTRA: SQL SOBERANO DIAMOND (V3.2 - CHECKMATE)
-- ------------------------------------------------------------
-- FIX: Tabela 'follows' (Confirmada)
-- FIX: Busca Híbrida REAL (Saber IA + Expert + Hacks)
-- FIX: Integridade Nuclear (Zero Denúncias)
-- FIX: Freshness Boost (1.1x)
-- ============================================================

-- [1] EXTENSÕES E INFRAESTRUTURA
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- [2] CATEGORIAS SOBERANAS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE knowledge_category AS ENUM (
            'vistos_aima', 'saude_sns', 'trabalho_seg_social', 
            'habitacao_nif', 'hacks_da_tribo', 'acolhimento_e_apoio', 'diretrizes_ceo'
        );
    END IF;
END $$;

-- [3] HARDENING DE COLUNAS (768D)
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS category knowledge_category DEFAULT 'vistos_aima';
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS sovereignty_score INT DEFAULT 1000;
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0;

-- [4] RPC: DASHBOARD SOBERANO V3 (FIX 404)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats_v3()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'users_count', (SELECT count(*) FROM public.profiles),
        'knowledge_count', (SELECT count(*) FROM public.knowledge_base),
        'jobs_count', (SELECT count(*) FROM public.job_posts),
        'services_count', (SELECT count(*) FROM public.map_alerts),
        'pending_reports_count', (SELECT count(*) FROM public.community_reports WHERE status = 'pending'),
        'aima_weight', 50000,
        'ceo_weight', 100000
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [5] SINCRONIZAÇÃO DE SEGUIDORES (FIX: Tabela 'follows')
CREATE OR REPLACE FUNCTION public.tr_sync_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_follows ON public.follows;
CREATE TRIGGER tr_sync_user_follows AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.tr_sync_follower_counts();

-- [6] RPC: BUSCA HÍBRIDA SINTÉTICA V3 (O CÉREBRO REAL)
-- Integra as 3 fontes (Saber IA, Experts, Hacks) com Freshness Boost
CREATE OR REPLACE FUNCTION public.mira_hybrid_search_v2(
    query_text TEXT,
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 12
)
RETURNS TABLE (
    content TEXT, source_type TEXT, category TEXT, sovereignty_score INT, combined_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    -- Fonte 1: Saber IA
    SELECT 
        k.content, k.source_type, k.category::TEXT, k.sovereignty_score,
        (((1 - (k.embedding <=> query_embedding)) * 0.7 + ts_rank_cd(to_tsvector('portuguese', unaccent(k.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3) * (CASE WHEN k.created_at > (NOW() - INTERVAL '6 months') THEN 1.1 ELSE 1.0 END)) as combined_score
    FROM public.knowledge_base k 
    WHERE (1 - (k.embedding <=> query_embedding)) > match_threshold
    
    UNION ALL

    -- Fonte 2: Especialistas (Verificados e com ZERO reports)
    SELECT 
        e.content, 'expert', e.category::TEXT, 6000,
        (((1 - (e.embedding <=> query_embedding)) * 0.7 + ts_rank_cd(to_tsvector('portuguese', unaccent(e.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3) * (CASE WHEN e.created_at > (NOW() - INTERVAL '6 months') THEN 1.1 ELSE 1.0 END)) as combined_score
    FROM public.expert_columns e 
    JOIN public.profiles pr ON e.author_id = pr.id 
    WHERE pr.is_verified = true AND (e.reports_count = 0 OR e.reports_count IS NULL) 
    AND (1 - (e.embedding <=> query_embedding)) > match_threshold

    UNION ALL

    -- Fonte 3: Hacks da Tribo (>50 votos e ZERO reports)
    SELECT 
        p.content, 'hack', 'hacks_da_tribo', 15000,
        (((1 - (p.embedding <=> query_embedding)) * 0.7 + ts_rank_cd(to_tsvector('portuguese', unaccent(p.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3) * (CASE WHEN p.created_at > (NOW() - INTERVAL '6 months') THEN 1.1 ELSE 1.0 END)) as combined_score
    FROM public.posts p 
    JOIN public.profiles pr ON p.author_id = pr.id 
    WHERE pr.is_verified = true 
    AND (p.reports_count = 0 OR p.reports_count IS NULL) 
    AND (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful') > 50 
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold

    ORDER BY sovereignty_score DESC, combined_score DESC LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [7] FEED SOBERANO V24 (FIX 300)
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status NOT IN ('banned', 'hidden', 'fraud')
  ORDER BY 
      (CASE 
          WHEN pr.email = 'amandasabreu89@gmail.com' THEN 100000 
          WHEN pr.name ILIKE '%AIMA%' THEN 50000 
          WHEN pr.is_verified = true THEN 5000
          ELSE 0 
      END) DESC,
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [8] PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mira_hybrid_search_v2 TO anon, authenticated;
NOTIFY pgrst, 'reload schema';

-- SUCESSO: MIRA V2026.GOLD INITIALIZED 💎
NOTIFY pgrst, 'reload schema';
