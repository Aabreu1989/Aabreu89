-- 👑 MIRA V2026.GOLD: FIX PERSISTÊNCIA DE INTERAÇÕES (VERDADEIRO/FALSO)
-- OBJETIVO: Sincronizar contadores de votos úteis e falsos na tabela posts e atualizar feed.

BEGIN;

-- [1] ADICIONAR COLUNAS SE NÃO EXISTIREM
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS useful_votes INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS fake_votes INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;

-- [2] TRIGGER PARA ATUALIZAR CONTADORES AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.tr_sync_post_votes_v3()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes = COALESCE(useful_votes, 0) + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes = COALESCE(fake_votes, 0) + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'like') THEN
            UPDATE public.posts SET likes = COALESCE(likes, 0) + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes = GREATEST(0, COALESCE(useful_votes, 0) - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes = GREATEST(0, COALESCE(fake_votes, 0) - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'like') THEN
            UPDATE public.posts SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_post_votes ON public.post_votes;
CREATE TRIGGER tr_sync_post_votes
AFTER INSERT OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.tr_sync_post_votes_v3();

-- [3] RECALIBRAÇÃO INICIAL DOS CONTADORES
UPDATE public.posts p
SET 
    useful_votes = (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'useful'),
    fake_votes = (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'fake'),
    likes = (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'like');

-- [4] ATUALIZAÇÃO DO RPC DO FEED PARA RETORNAR OS CONTADORES
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v24 CASCADE;
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v24(p_limit INT, p_offset INT)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    background_image TEXT,
    is_verified BOOLEAN,
    validation_status TEXT,
    urgency INT,
    created_at TIMESTAMPTZ,
    translations JSONB,
    likes INT,
    useful_votes INT,
    fake_votes INT,
    reports INT,
    nobel_score INT,
    author JSONB,
    comments JSONB,
    post_votes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.category,
        p.background_image,
        p.is_verified,
        p.validation_status,
        p.urgency,
        p.created_at,
        p.translations,
        p.likes,
        p.useful_votes,
        p.fake_votes,
        (SELECT count(*) FROM public.reports r WHERE r.post_id = p.id)::int as reports,
        p.nobel_score,
        jsonb_build_object(
            'name', prof.name,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'badges', prof.badges,
            'is_verified', prof.is_verified,
            'followers_count', prof.followers_count,
            'following_count', prof.following_count
        ) as author,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'content', c.content,
                'created_at', c.created_at,
                'author_id', c.author_id,
                'likes', c.likes,
                'parent_id', c.parent_id,
                'translations', c.translations,
                'author', jsonb_build_object(
                    'name', cauth.name,
                    'avatar_url', cauth.avatar_url,
                    'is_verified', cauth.is_verified
                )
            )) FROM public.comments c 
             JOIN public.profiles cauth ON c.author_id = cauth.id
             WHERE c.post_id = p.id), '[]'::jsonb
        ) as comments,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'user_id', v.user_id,
                'vote_type', v.vote_type
            )) FROM public.post_votes v WHERE v.post_id = p.id), '[]'::jsonb
        ) as post_votes
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [5] REPARAÇÃO DO ADMIN HUB STATS
-- Garantir que a tabela existe e tem uma linha inicial
DROP VIEW IF EXISTS public.admin_dashboard_stats CASCADE;
CREATE TABLE IF NOT EXISTS public.admin_dashboard_stats (
    id INT PRIMARY KEY DEFAULT 1,
    verified_courses INT DEFAULT 0,
    mapped_services INT DEFAULT 0,
    verified_jobs INT DEFAULT 0,
    total_jobs INT DEFAULT 0,
    total_sources INT DEFAULT 66,
    total_suggestions INT DEFAULT 0,
    total_downloads INT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_row CHECK (id = 1)
);

INSERT INTO public.admin_dashboard_stats (id, last_updated)
VALUES (1, NOW())
ON CONFLICT DO NOTHING;

-- END
