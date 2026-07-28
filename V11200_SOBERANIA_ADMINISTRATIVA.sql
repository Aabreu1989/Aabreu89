-- 
-- 👑 SQL MASTER V11200 - SOBERANIA ADMINISTRATIVA (AMANDA ABREU)
-- OBJETIVO: Versão Final de Lançamento (05/04/2026).
-- FIX: Autoridade Total de Eliminação (Modo CEO), Performance e RAG.
--

BEGIN;

-- 1. LIMPEZA DE SEGURANÇA (Prevenção de Colisão)
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v10000(integer, integer);
DROP VIEW IF EXISTS public.community_top_stories_nobel CASCADE;
DROP VIEW IF EXISTS public.admin_reports_view CASCADE;

-- 2. HARDENING DE PROFILES (Garantir colunas de mérito)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 3. ÍNDICES DE PERFORMANCE EXTREMA
CREATE INDEX IF NOT EXISTS idx_post_votes_composite ON public.post_votes (post_id, vote_type);
CREATE INDEX IF NOT EXISTS idx_posts_ranking ON public.posts (is_verified, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON public.reports (post_id);
CREATE INDEX IF NOT EXISTS idx_follows_optimized ON public.follows (follower_id, following_id);

-- 4. INFRAESTRUTURA DE SEGUIDORES E GATILHOS
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

CREATE OR REPLACE FUNCTION public.handle_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_follow_stats ON public.follows;
CREATE TRIGGER trg_follow_stats AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats();

-- 5. TABELA DE DENÚNCIAS (CAIXA PRETA SOBERANA)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    target_author_id UUID REFERENCES auth.users(id),
    reason TEXT,
    reported_content_text TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. GATILHO DE INTELIGÊNCIA SOBERANA (RAG V10650)
CREATE UNIQUE INDEX IF NOT EXISTS idx_knowledge_post_id ON public.knowledge_store ((metadata->>'post_id'));

CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v10650()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = OLD.id;
    ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        IF (NEW.validation_status != 'blocked') THEN
            INSERT INTO public.knowledge_store (content, metadata)
            VALUES (
                NEW.content, 
                jsonb_build_object(
                    'source', 'community',
                    'post_id', NEW.id,
                    'category', NEW.category,
                    'is_official', COALESCE(NEW.is_verified, false),
                    'author_id', NEW.author_id
                )
            )
            ON CONFLICT ((metadata->>'post_id')) DO UPDATE SET 
                content = EXCLUDED.content,
                metadata = EXCLUDED.metadata;
        ELSE
            DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = NEW.id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_to_ai_v10650 ON public.posts;
CREATE TRIGGER trg_sync_post_to_ai_v10650 AFTER INSERT OR UPDATE OR DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_ai_v10650();

-- 7. VIEW NOBEL - PERFORMANCE REESCRITA (AIMA 5000 / CEO 3000)
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
WITH vote_counts AS (
    SELECT 
        post_id,
        COUNT(*) FILTER (WHERE vote_type = 'like') as likes_agg,
        COUNT(*) FILTER (WHERE vote_type = 'useful') as usefuls_agg,
        COUNT(*) FILTER (WHERE vote_type = 'fake') as fakes_agg
    FROM public.post_votes
    GROUP BY post_id
)
SELECT 
    p.id, p.author_id, p.title, p.content, p.category, 
    p.background_image, p.is_verified, p.validation_status, 
    p.urgency, p.created_at, p.translations, p.likes,
    (
      CASE 
        WHEN prof.email = 'amandasabreu89@gmail.com' THEN 3000
        WHEN p.category = 'AIMA' OR p.content ILIKE '%AIMA%' THEN 5000
        WHEN p.is_verified = true THEN 1000
        ELSE 0 
      END +
      (COALESCE(v.likes_agg, 0) * 10) + 
      (COALESCE(v.usefuls_agg, 0) * 50) - 
      (COALESCE(v.fakes_agg, 0) * 100)
    )::INT as calculated_nobel_score
FROM public.posts p
JOIN public.profiles prof ON p.author_id = prof.id
LEFT JOIN vote_counts v ON v.post_id = p.id
WHERE p.validation_status != 'blocked' 
  AND (
    prof.email = 'amandasabreu89@gmail.com' 
    OR p.category = 'AIMA' 
    OR COALESCE(v.usefuls_agg, 0) > 0
  );

-- 8. FUNÇÃO DE FEED ELITE V11200 (FIM DA LENTIDÃO)
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
        SELECT 
            v.post_id,
            COUNT(*) FILTER (WHERE v.vote_type = 'like')::INT as l,
            COUNT(*) FILTER (WHERE v.vote_type = 'useful')::INT as u,
            COUNT(*) FILTER (WHERE v.vote_type = 'fake')::INT as f
        FROM public.post_votes v
        GROUP BY v.post_id
    ),
    current_reports AS (
        SELECT r.post_id, COUNT(*)::INT as rep_count FROM public.reports r GROUP BY r.post_id
    )
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.is_verified, p.validation_status, p.created_at,
        COALESCE(cv.l, 0),
        COALESCE(cv.u, 0),
        COALESCE(cv.f, 0),
        COALESCE(cr.rep_count, 0),
        COALESCE(ns.calculated_nobel_score, 0)::INT,
        p.translations,
        jsonb_build_object(
            'name', prof.username, 'avatar_url', prof.avatar_url, 
            'level', prof.level, 'is_verified', prof.is_verified,
            'followers_count', prof.followers_count, 'following_count', prof.following_count
        ),
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
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. VIEW ADMIN HUB (DENÚNCIAS)
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT 
    r.id, r.reason, r.status, r.created_at, r.reported_content_text, r.post_id, r.comment_id,
    jsonb_build_object('id', r.reporter_id, 'name', p_rep.username) as reporter,
    jsonb_build_object('id', r.target_author_id, 'name', p_tar.username, 'avatar', p_tar.avatar_url) as offender
FROM public.reports r
LEFT JOIN public.profiles p_rep ON r.reporter_id = p_rep.id
LEFT JOIN public.profiles p_tar ON r.target_author_id = p_tar.id
ORDER BY r.created_at DESC;

-- 10. PERMISSÕES FINAIS (INCLUINDO DELETE)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.post_votes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE(username, avatar_url) ON public.profiles TO authenticated;
GRANT SELECT ON public.admin_reports_view TO authenticated;

-- 11. POLÍTICAS DE SOBERANIA ADMINISTRATIVA (MODO CEO AMANDA)
-- Ativa RLS e garante que apenas a CEO pode apagar conteúdo de terceiros.

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Política de Deleção de Posts (Apenas Autor ou CEO Amanda)
DROP POLICY IF EXISTS "Sovereign Post Deletion" ON public.posts;
CREATE POLICY "Sovereign Post Deletion" ON public.posts
FOR DELETE TO authenticated
USING (auth.uid() = author_id OR (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com'));

-- Política de Deleção de Comentários (Apenas Autor ou CEO Amanda)
DROP POLICY IF EXISTS "Sovereign Comment Deletion" ON public.comments;
CREATE POLICY "Sovereign Comment Deletion" ON public.comments
FOR DELETE TO authenticated
USING (auth.uid() = author_id OR (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com'));

-- Política de Deleção de Reports (Apenas CEO Amanda pode limpar a lista)
DROP POLICY IF EXISTS "Sovereign Report Deletion" ON public.reports;
CREATE POLICY "Sovereign Report Deletion" ON public.reports
FOR DELETE TO authenticated
USING (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com');

-- Políticas básicas de leitura e inserção para não bloquear o app
DROP POLICY IF EXISTS "Authenticated Users Can Select" ON public.posts;
CREATE POLICY "Authenticated Users Can Select" ON public.posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users Can Insert Own Posts" ON public.posts;
CREATE POLICY "Users Can Insert Own Posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authenticated Users Can Select Comments" ON public.comments;
CREATE POLICY "Authenticated Users Can Select Comments" ON public.comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users Can Insert Own Comments" ON public.comments;
CREATE POLICY "Users Can Insert Own Comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

COMMIT;
