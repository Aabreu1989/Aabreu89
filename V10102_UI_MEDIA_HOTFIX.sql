-- 👑 SQL MASTER V10102 - UI MEDIA HOTFIX (AMANDA ABREU)
-- OBJETIVO: Devolver as fotos de fundo (background_image) dos posts e as fotos dos autores (avatar_url) nos comentários.
-- A V10101 resolveu o erro crítico do BIGINT e restaurou os dados, esta corrige exclusivamente a camada visual dos Destaques e Comentários.

BEGIN;

DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v10000(integer, integer);

-- 7. FUNÇÃO DE FEED ELITE V10102 (Com background_image e avatar JSON)
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v10000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    background_image TEXT, -- 🔥 RECUPERADO O BACKGROUND DO POST
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, author_data JSONB, comments_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.background_image, -- 🔥 RECUPERADO NA QUERY PRINCIPAL
        p.is_verified, p.validation_status, p.created_at,
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like'),
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful'),
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake'),
        (SELECT count(*)::int FROM public.reports r WHERE r.post_id = p.id),
        COALESCE(ns.nobel_score, 0)::INT,
        jsonb_build_object(
            'name', prof.username, 
            'avatar_url', prof.avatar_url, 
            'level', prof.level, 
            'is_verified', prof.is_verified
        ),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 
                'content', c.content, 
                'author_name', cp.username,
                'author_avatar', cp.avatar_url, -- 🔥 RECUPERADO A FOTO DOS COMENTÁRIOS
                'created_at', c.created_at
            )) 
            FROM public.comments c 
            JOIN public.profiles cp ON c.author_id = cp.id 
            WHERE c.post_id = p.id
        ), '[]'::jsonb)
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status != 'blocked'
    ORDER BY COALESCE(ns.nobel_score, 0) DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
