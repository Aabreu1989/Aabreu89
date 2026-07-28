-- ============================================================
-- 💎 MIRA V2026.GOLD: INTERACTION PERSISTENCE FIX (V13000)
-- OBJETIVO: Resolver falha de sincronização nos botões de interação.
-- 1. Recria a função de feed com dados completos de votos e comentários.
-- 2. Garante que os contadores são calculados em tempo real (não dependente de colunas estáticas).
-- 3. Mantém a sanidade de soberania da CEO Amanda Abreu.
-- ============================================================

BEGIN;

-- FIX 1: Recriar a função v10000 com dados de avatar nos comentários e cache de votos
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v10000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, translations JSONB, author_data JSONB, comments_data JSONB,
    post_votes JSONB -- ← Adicionado para redundância de soberania
) AS $$
BEGIN
    RETURN QUERY
    WITH current_votes AS (
        SELECT v.post_id,
               COUNT(*) FILTER (WHERE v.vote_type = 'like')::INT as l,
               COUNT(*) FILTER (WHERE v.vote_type = 'useful')::INT as u,
               COUNT(*) FILTER (WHERE v.vote_type = 'fake')::INT as f,
               jsonb_agg(jsonb_build_object('user_id', v.user_id, 'vote_type', v.vote_type)) as all_votes
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
        jsonb_build_object(
            'name', COALESCE(prof.username, SPLIT_PART(prof.email, '@', 1), 'Membro'),
            'avatar_url', COALESCE(prof.avatar_url, ''),
            'level', COALESCE(prof.level, 1),
            'is_verified', COALESCE(prof.is_verified, false),
            'followers_count', COALESCE(prof.followers_count, 0),
            'following_count', COALESCE(prof.following_count, 0)
        ),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'author_name', COALESCE(cp.username, 'Membro'),
                'author_avatar', COALESCE(cp.avatar_url, ''), -- ← Adicionado
                'author_id', c.author_id, -- ← Adicionado
                'created_at', c.created_at, 'likes', c.likes
            )) FROM public.comments c LEFT JOIN public.profiles cp ON c.author_id = cp.id WHERE c.post_id = p.id
        ), '[]'::jsonb),
        COALESCE(cv.all_votes, '[]'::jsonb) -- ← Redundância para o frontend
    FROM public.posts p
    LEFT JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN current_votes cv ON cv.post_id = p.id
    LEFT JOIN current_reports cr ON cr.post_id = p.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status IS DISTINCT FROM 'blocked'
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir acesso
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v10000(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v10000(INT, INT) TO service_role;

COMMIT;
