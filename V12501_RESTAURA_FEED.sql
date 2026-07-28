-- 
-- 👑 SQL FIX V12501 - RESTAURAÇÃO DO MOTOR DO FEED (AMANDA ABREU)
-- OBJETIVO: Devolver a função do feed comunitário que caiu no 'DROP FUNCTION' da V12500.
-- FIX: Sem isto, a aba da Comunidade fica vazia porque não há como ler os posts.
--

BEGIN;

-- 1. RECONSTRUÇÃO DA FUNÇÃO DO FEED SOBERANO
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
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GARANTIR PERMISSÃO
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v10000 TO authenticated;

COMMIT;
