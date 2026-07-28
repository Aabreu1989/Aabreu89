-- 👑 MIRA V2026.GOLD: RPC FEED SOBERANO v25
-- OBJETIVO: Sincronização Total de Interações (Likes, Salvos, Votos) por Utilizador.

CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v25(
    p_limit INT, 
    p_offset INT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT,
    author_is_verified BOOLEAN,
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
    is_liked_by_user BOOLEAN,
    is_saved_by_user BOOLEAN,
    user_vote TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.author_id,
        prof.name as author_name,
        prof.avatar_url as author_avatar,
        prof.is_verified as author_is_verified,
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
        EXISTS (
            SELECT 1 FROM public.post_votes v 
            WHERE v.post_id = p.id AND v.user_id = p_user_id AND v.vote_type = 'like'
        ) as is_liked_by_user,
        EXISTS (
            SELECT 1 FROM public.saved_posts s 
            WHERE s.post_id = p.id AND s.user_id = p_user_id
        ) as is_saved_by_user,
        (
            SELECT vote_type FROM public.post_votes v 
            WHERE v.post_id = p.id AND v.user_id = p_user_id AND v.vote_type IN ('useful', 'fake')
            LIMIT 1
        ) as user_vote
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
