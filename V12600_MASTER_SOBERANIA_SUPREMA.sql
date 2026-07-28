-- 
-- 👑 SQL MASTER V12600 - SOBERANIA SUPREMA (AMANDA ABREU)
-- OBJETIVO: Consolidação Final (Moderação + Sugestões + Restauro de Feed).
-- FIX: Reinstalação da função de busca de posts (Morte ao ecrã vazio no Refresh).
--

BEGIN;

-- ==========================================
-- 1. DESMONTAGEM DE DEPENDÊNCIAS (LIMPEZA TOTAL)
-- ==========================================
DROP VIEW IF EXISTS public.admin_reports_view CASCADE;
DROP VIEW IF EXISTS public.admin_suggestions_view CASCADE;
DROP VIEW IF EXISTS public.community_top_stories_nobel CASCADE;
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v10000(integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.admin_nuclear_content_delete(text, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_nuclear_suggestion_delete(uuid) CASCADE;

-- ==========================================
-- 2. OPERAÇÃO LIMPEZA E CONVERSÃO (O FIM DO LIXO)
-- ==========================================
DO $$ 
BEGIN 
    -- Varre votos, salvamentos e denúncias de posts que já não existem
    DELETE FROM public.post_votes WHERE post_id::text NOT IN (SELECT id::text FROM public.posts);
    DELETE FROM public.saved_posts WHERE post_id::text NOT IN (SELECT id::text FROM public.posts);
    DELETE FROM public.reports WHERE post_id::text NOT IN (SELECT id::text FROM public.posts);

    -- Converter colunas para UUID de uma vez por todas
    ALTER TABLE IF EXISTS public.post_votes ALTER COLUMN post_id TYPE UUID USING post_id::uuid;
    ALTER TABLE IF EXISTS public.reports ALTER COLUMN post_id TYPE UUID USING post_id::uuid;
    ALTER TABLE IF EXISTS public.saved_posts ALTER COLUMN post_id TYPE UUID USING post_id::uuid;

    -- Soldar as Cascatas (Se o Post morre, o lixo morre com ele)
    ALTER TABLE IF EXISTS public.post_votes DROP CONSTRAINT IF EXISTS post_votes_post_id_fkey;
    ALTER TABLE IF EXISTS public.post_votes ADD CONSTRAINT post_votes_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

    ALTER TABLE IF EXISTS public.reports DROP CONSTRAINT IF EXISTS reports_post_id_fkey;
    ALTER TABLE IF EXISTS public.reports ADD CONSTRAINT reports_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
END $$;

-- ==========================================
-- 3. RECONSTRUÇÃO DA INTELIGÊNCIA (RAG V12600)
-- ==========================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_post_id ON public.knowledge_store ((metadata->>'post_id'));

CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v12600()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = OLD.id;
    ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        IF (NEW.validation_status != 'blocked') THEN
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

DROP TRIGGER IF EXISTS trg_sync_post_to_ai_v12600 ON public.posts;
CREATE TRIGGER trg_sync_post_to_ai_v12600 AFTER INSERT OR UPDATE OR DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_ai_v12600();

-- ==========================================
-- 4. RECONSTRUÇÃO DAS VIEWS (DENÚNCIAS, SUGESTÕES E NOBEL)
-- ==========================================

-- View de Destaques (Nobel Score)
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
WHERE p.validation_status != 'blocked';

-- View de Denúncias
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT r.id, r.reason, r.status, r.created_at, r.reported_content_text, r.post_id, r.comment_id,
    jsonb_build_object('id', r.reporter_id, 'name', p_rep.username) as reporter,
    jsonb_build_object('id', r.target_author_id, 'name', p_tar.username, 'avatar', p_tar.avatar_url) as offender
FROM public.reports r LEFT JOIN public.profiles p_rep ON r.reporter_id = p_rep.id LEFT JOIN public.profiles p_tar ON r.target_author_id = p_tar.id;

-- View de Sugestões
CREATE OR REPLACE VIEW public.admin_suggestions_view AS
SELECT s.id, s.subject, s.content, s.email as contact_email, s.status, s.aima_priority, s.created_at,
    jsonb_build_object('id', s.user_id, 'name', COALESCE(p.username, 'Visitante'), 'avatar', p.avatar_url) as user_data
FROM public.app_suggestions s LEFT JOIN public.profiles p ON s.user_id = p.id;

-- ==========================================
-- 5. FUNÇÕES DE FEED (O MOTOR RESTAURADO)
-- ==========================================

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
    WHERE p.validation_status != 'blocked'
    ORDER BY COALESCE(ns.calculated_nobel_score, 0) DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. FUNÇÕES NUCLEARES (MODERAÇÃO E SUGESTÕES)
-- ==========================================

-- Eliminação de Conteúdo Denunciado
CREATE OR REPLACE FUNCTION public.admin_nuclear_content_delete(target_type TEXT, target_id UUID, report_id UUID)
RETURNS VOID AS $$
BEGIN
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        IF target_type = 'POST' THEN
            DELETE FROM public.posts WHERE id = target_id;
        ELSIF target_type = 'COMMENT' THEN
            DELETE FROM public.comments WHERE id = target_id;
        END IF;
        IF report_id IS NOT NULL THEN
            DELETE FROM public.reports WHERE id = report_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO: Apenas a CEO Amanda Abreu pode executar moderação atómica.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminação de Sugestões
CREATE OR REPLACE FUNCTION public.admin_nuclear_suggestion_delete(suggestion_uuid UUID)
RETURNS VOID AS $$
BEGIN
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        DELETE FROM public.app_suggestions WHERE id = suggestion_uuid;
    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. PERMISSÕES FINAIS
-- ==========================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.admin_reports_view TO authenticated;
GRANT SELECT ON public.admin_suggestions_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v10000 TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_content_delete TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_suggestion_delete TO authenticated;

COMMIT;
