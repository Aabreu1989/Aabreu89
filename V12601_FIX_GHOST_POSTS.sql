-- 
-- 👑 SQL FIX V12601 - VÁLVULA DE SEGURANÇA (AMANDA ABREU)
-- OBJETIVO: Erradicar o "Post Fantasma" e corrigir o Enum do Gamification.
-- FIX 1: O "validation_status" NULL estava a ser devorado pelo filtro != 'blocked'. Foi reparado com IS DISTINCT FROM e DEFAULT.
-- FIX 2: Adicionado o valor 'points_earned' à estrutura da atividade para evitar erro 400.
--

BEGIN;

-- ==========================================
-- 1. CORREÇÃO DO LIXO TELEMÉTRICO (ERRO 400)
-- ==========================================
-- Injetar o novo valor no Enum que impede o frontend de validar a criação de pontos.
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'points_earned';

-- ==========================================
-- 2. REPARAÇÃO DA VISIBILIDADE (POSTS FANTASMAS)
-- ==========================================
-- Se uma publicação entra sem status definido, ela recebe NULL. E NULL != 'blocked' dá FALSO!
-- O Post fica invisível em todos os motores. Vamos forçar um DEFAULT e atualizar tudo.
ALTER TABLE public.posts ALTER COLUMN validation_status SET DEFAULT 'pending';
UPDATE public.posts SET validation_status = 'pending' WHERE validation_status IS NULL;

-- Retemperar a View de Destaques para aceitar NULLs se ainda existirem
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
WITH vote_counts AS (
    SELECT post_id, 
           COUNT(*) FILTER (WHERE vote_type = 'like') as likes_agg, 
           COUNT(*) FILTER (WHERE vote_type = 'useful') as usefuls_agg, 
           COUNT(*) FILTER (WHERE vote_type = 'fake') as fakes_agg
    FROM public.post_votes GROUP BY post_id
)
SELECT p.id, p.author_id, p.title, p.content, p.category, p.is_verified, p.created_at,
    (CASE 
        WHEN prof.email = 'amandasabreu89@gmail.com' THEN 3000 
        WHEN p.category = 'AIMA' OR p.content ILIKE '%AIMA%' THEN 5000 
        WHEN p.is_verified = true THEN 1000 
        ELSE 0 
    END + (COALESCE(v.likes_agg, 0) * 10) + (COALESCE(v.usefuls_agg, 0) * 50) - (COALESCE(v.fakes_agg, 0) * 100))::INT as calculated_nobel_score
FROM public.posts p 
JOIN public.profiles prof ON p.author_id = prof.id 
LEFT JOIN vote_counts v ON v.post_id = p.id
WHERE p.validation_status IS DISTINCT FROM 'blocked';

-- Retemperar a Função de Feed para ler os status invisíveis
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v10000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, translations JSONB, author_data JSONB, comments_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH current_votes AS (
        SELECT v.post_id,
               COUNT(*) FILTER (WHERE v.vote_type = 'like')::INT as l,
               COUNT(*) FILTER (WHERE v.vote_type = 'useful')::INT as u,
               COUNT(*) FILTER (WHERE v.vote_type = 'fake')::INT as f
        FROM public.post_votes v GROUP BY v.post_id
    ),
    current_reports AS (
        SELECT r.post_id, COUNT(*)::INT as rep_count FROM public.reports r GROUP BY r.post_id
    )
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.is_verified, p.validation_status, p.created_at,
        COALESCE(cv.l, 0), COALESCE(cv.u, 0), COALESCE(cv.f, 0), COALESCE(cr.rep_count, 0),
        COALESCE(ns.calculated_nobel_score, 0)::INT, p.translations,
        jsonb_build_object('name', prof.username, 'avatar_url', prof.avatar_url, 'level', prof.level, 'is_verified', prof.is_verified),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'author_name', cp.username,
                'created_at', c.created_at, 'likes', c.likes
            )) FROM public.comments c JOIN public.profiles cp ON c.author_id = cp.id WHERE c.post_id = p.id
        ), '[]'::jsonb)
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN current_votes cv ON cv.post_id = p.id
    LEFT JOIN current_reports cr ON cr.post_id = p.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status IS DISTINCT FROM 'blocked'
    ORDER BY COALESCE(ns.calculated_nobel_score, 0) DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retemperar o Gatilho RAG da AI para captar status vazios
CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v12600()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = OLD.id;
    ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        IF (NEW.validation_status IS DISTINCT FROM 'blocked') THEN
            INSERT INTO public.knowledge_store (content, metadata)
            VALUES (NEW.content, jsonb_build_object('source', 'community','post_id', NEW.id,'category', NEW.category,'is_official', COALESCE(NEW.is_verified, false)))
            ON CONFLICT ((metadata->>'post_id')) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;
        ELSE
            DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = NEW.id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
