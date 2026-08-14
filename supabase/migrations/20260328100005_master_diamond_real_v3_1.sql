-- ============================================================
-- 💎 MIRA V2026.ULTRA: SQL SOBERANO DIAMOND (V3.1 - PATCHED)
-- ------------------------------------------------------------
-- FIX: Substituição de 'user_follows' por 'follows' (Tabela Real)
-- ESTE FICHEIRO CONSOLIDA: 
-- 1. FIX 404: Dashboard com nomes de campos precisos para o Frontend
-- 2. FIX 300: Feed sem ambiguidade (JOIN Explícito)
-- 3. FOLLOWER SYNC: Gatilhos automáticos para followers_count (Tabela follows)
-- 4. MOTOR NOBEL: Busca Híbrida REAL (Saber IA + Expert + Hacks)
-- 5. BLINDAGEM: Filtros de Verificação, 0 Reports e Engajamento
-- ============================================================

-- [1] EXTENSÕES E INFRAESTRUTURA
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- [2] CATEGORIAS FIXAS (O CÉREBRO ORGANIZADO)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE knowledge_category AS ENUM (
            'vistos_aima', 'saude_sns', 'trabalho_seg_social', 
            'habitacao_nif', 'hacks_da_tribo', 'acolhimento_e_apoio', 'diretrizes_ceo'
        );
    END IF;
END $$;

-- [3] TABELAS DE SUPORTE (EXPERT & HARDENING)
CREATE TABLE IF NOT EXISTS public.expert_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,
    title TEXT,
    content TEXT,
    category knowledge_category DEFAULT 'vistos_aima',
    embedding vector(768),
    reports_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injeção de colunas soberanas nas tabelas core
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT,
    content TEXT,
    category TEXT,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS category knowledge_category DEFAULT 'vistos_aima';
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'oficial';
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS sovereignty_score INT DEFAULT 1000;
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0;

-- Categorização de Denúncias
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID,
    target_id UUID,
    category TEXT DEFAULT 'other',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- [4] INDEXAÇÃO HNSW (ULTRA-PERFORMANCE RAG)
CREATE INDEX IF NOT EXISTS idx_k_embedding_hnsw ON public.knowledge_base USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_e_embedding_hnsw ON public.expert_columns USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_p_embedding_hnsw ON public.posts USING hnsw (embedding vector_cosine_ops);

-- [5] SINCRONIZAÇÃO SOBERANA DE SEGUIDORES (FIX CORRIGIDO: tabela 'follows')
CREATE OR REPLACE FUNCTION public.tr_sync_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajuste para a tabela 'follows' (Confirmada via Auditoria)
DROP TRIGGER IF EXISTS tr_sync_user_follows ON public.follows;
CREATE TRIGGER tr_sync_user_follows 
AFTER INSERT OR DELETE ON public.follows 
FOR EACH ROW EXECUTE FUNCTION public.tr_sync_follower_counts();

-- [6] RPC: DASHBOARD SOBERANO V3 (FIX 404 PRECISION)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats_v3()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'users_count', (SELECT count(*) FROM public.profiles),
        'knowledge_count', (SELECT count(*) FROM public.knowledge_base),
        'jobs_count', (SELECT count(*) FROM public.job_posts),
        'services_count', (SELECT count(*) FROM public.local_services),
        'pending_reports_count', (SELECT count(*) FROM public.reports WHERE status = 'pending'),
        'aima_weight', 50000,
        'ceo_weight', 100000
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [7] RPC: FEED SOBERANO V24 (FIX AMBIGUIDADE ERROR 300)
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id -- JOIN explícito mata o erro 300
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

-- [8] RPC: BUSCA HÍBRIDA SINTÉTICA V3 (O CÉREBRO REAL RESTAURADO)
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
    FROM public.knowledge_base k WHERE (1 - (k.embedding <=> query_embedding)) > match_threshold
    
    UNION ALL

    -- Fonte 2: Especialistas
    SELECT 
        e.content, 'expert', e.category::TEXT, 6000,
        (((1 - (e.embedding <=> query_embedding)) * 0.7 + ts_rank_cd(to_tsvector('portuguese', unaccent(e.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3) * (CASE WHEN e.created_at > (NOW() - INTERVAL '6 months') THEN 1.1 ELSE 1.0 END)) as combined_score
    FROM public.expert_columns e JOIN public.profiles pr ON e.author_id = pr.id 
    WHERE pr.is_verified = true AND (e.reports_count = 0 OR e.reports_count IS NULL) AND (1 - (e.embedding <=> query_embedding)) > match_threshold

    UNION ALL

    -- Fonte 3: Hacks
    SELECT 
        p.content, 'hack', 'hacks_da_tribo', 15000,
        (((1 - (p.embedding <=> query_embedding)) * 0.7 + ts_rank_cd(to_tsvector('portuguese', unaccent(p.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3) * (CASE WHEN p.created_at > (NOW() - INTERVAL '6 months') THEN 1.1 ELSE 1.0 END)) as combined_score
    FROM public.posts p JOIN public.profiles pr ON p.author_id = pr.id 
    WHERE pr.is_verified = true AND (p.reports_count = 0 OR p.reports_count IS NULL) 
    AND (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful') > 50 
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold

    ORDER BY sovereignty_score DESC, combined_score DESC LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [9] BUSCA UNACCENT (PROVA DE FOGO)
CREATE OR REPLACE FUNCTION public.search_profiles_unaccent(search_term TEXT)
RETURNS SETOF public.profiles AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.profiles
    WHERE unaccent(name) ILIKE unaccent('%' || search_term || '%') OR unaccent(email) ILIKE unaccent('%' || search_term || '%')
    ORDER BY sovereignty_weight DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [10] PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mira_hybrid_search_v2 TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
