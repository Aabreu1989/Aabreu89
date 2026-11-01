-- =============================================================================================
-- 👑 MIRA V2026.CANONICAL: PROJEÇÃO DE MEDALHAS NO FEED A PARTIR DE USER_BADGES
-- Migration: 20261024231500_project_feed_badges_from_canonical_user_badges.sql
-- ---------------------------------------------------------------------------------------------
-- DESCRIÇÃO:
-- 1. get_sovereign_community_feed_v25:
--    - Substitui a projeção estática 'badges', '[]'::jsonb pela consulta dinâmica à tabela
--      canónica public.user_badges (COALESCE(jsonb_agg(ub.badge_id ORDER BY ub.awarded_at ASC), '[]'::jsonb)).
--    - Preserva estritamente: assinatura de parâmetros, tipos de retorno, ordenação, contagens
--      de seguidores via public.user_follows, resolução de interações com auth.uid(),
--      SECURITY DEFINER, search_path e concessão de privilégios.
--    - Sem DROP FUNCTION destrutivo: utiliza CREATE OR REPLACE FUNCTION.
-- 2. get_sovereign_community_post_by_id_v25:
--    - Aplica exatamente a mesma projeção canónica de user_badges para posts individuais buscados
--      por ID (utilizados em Realtime e Deep Links).
--    - Preserva integralmente todas as restantes regras e blindagens criptográficas.
-- 3. Sem mutação de dados históricos:
--    - A auditoria confirmou 175 atribuições legítimas já existentes em public.user_badges para
--      31 utilizadores (sem IDs órfãos). Nenhuma atribuição retroativa artificial ou inferência
--      a partir de profiles.badges é executada nesta migração.
-- =============================================================================================

-- ────────────────────────────────────────────────────────────
-- FUNÇÃO 1: get_sovereign_community_feed_v25
-- ────────────────────────────────────────────────────────────
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
DECLARE
    v_auth_uid UUID := auth.uid();
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
        COALESCE(p.media_url, '') as background_image,
        p.is_verified,
        p.validation_status,
        0::int as urgency,
        p.created_at,
        '{}'::jsonb as translations,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like')::int as likes,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type IN ('useful', 'true'))::int as useful_votes,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake')::int as fake_votes,
        (SELECT count(*) FROM public.reports r WHERE r.post_id = p.id)::int as reports,
        10::int as nobel_score,
        jsonb_build_object(
            'name', prof.name,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'badges', COALESCE(
                (
                    SELECT jsonb_agg(ub.badge_id ORDER BY ub.awarded_at ASC)
                    FROM public.user_badges ub
                    WHERE ub.user_id = prof.id
                ),
                '[]'::jsonb
            ),
            'is_verified', prof.is_verified,
            'followers_count', (SELECT count(*)::int FROM public.user_follows uf WHERE uf.following_id = prof.id),
            'following_count', (SELECT count(*)::int FROM public.user_follows uf WHERE uf.follower_id = prof.id)
        ) as author,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'content', c.content,
                'created_at', c.created_at,
                'author_id', c.author_id,
                'author_name', cauth.name,
                'author_avatar', cauth.avatar_url,
                'likes', c.likes_count,
                'likes_count', c.likes_count,
                'parent_id', c.parent_id,
                'translations', '{}'::jsonb,
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
            WHERE v.post_id = p.id AND v.user_id = v_auth_uid AND v.vote_type = 'like'
        ) as is_liked_by_user,
        EXISTS (
            SELECT 1 FROM public.saved_posts s
            WHERE s.post_id = p.id AND s.user_id = v_auth_uid
        ) as is_saved_by_user,
        (
            SELECT vote_type FROM public.post_votes v
            WHERE v.post_id = p.id AND v.user_id = v_auth_uid AND v.vote_type IN ('useful', 'fake', 'true')
            ORDER BY v.created_at DESC
            LIMIT 1
        ) as user_vote
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_sovereign_community_feed_v25(integer, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v25(integer, integer, uuid) TO anon, authenticated, service_role;

-- ────────────────────────────────────────────────────────────
-- FUNÇÃO 2: get_sovereign_community_post_by_id_v25
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_sovereign_community_post_by_id_v25(
    p_post_id UUID,
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
DECLARE
    v_auth_uid UUID := auth.uid();
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
        COALESCE(p.media_url, '') as background_image,
        p.is_verified,
        p.validation_status,
        0::int as urgency,
        p.created_at,
        '{}'::jsonb as translations,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like')::int as likes,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type IN ('useful', 'true'))::int as useful_votes,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake')::int as fake_votes,
        (SELECT count(*) FROM public.reports r WHERE r.post_id = p.id)::int as reports,
        10::int as nobel_score,
        jsonb_build_object(
            'name', prof.name,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'badges', COALESCE(
                (
                    SELECT jsonb_agg(ub.badge_id ORDER BY ub.awarded_at ASC)
                    FROM public.user_badges ub
                    WHERE ub.user_id = prof.id
                ),
                '[]'::jsonb
            ),
            'is_verified', prof.is_verified,
            'followers_count', (SELECT count(*)::int FROM public.user_follows uf WHERE uf.following_id = prof.id),
            'following_count', (SELECT count(*)::int FROM public.user_follows uf WHERE uf.follower_id = prof.id)
        ) as author,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'content', c.content,
                'created_at', c.created_at,
                'author_id', c.author_id,
                'author_name', cauth.name,
                'author_avatar', cauth.avatar_url,
                'likes', c.likes_count,
                'likes_count', c.likes_count,
                'parent_id', c.parent_id,
                'translations', '{}'::jsonb,
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
            WHERE v.post_id = p.id AND v.user_id = v_auth_uid AND v.vote_type = 'like'
        ) as is_liked_by_user,
        EXISTS (
            SELECT 1 FROM public.saved_posts s
            WHERE s.post_id = p.id AND s.user_id = v_auth_uid
        ) as is_saved_by_user,
        (
            SELECT vote_type FROM public.post_votes v
            WHERE v.post_id = p.id AND v.user_id = v_auth_uid AND v.vote_type IN ('useful', 'fake', 'true')
            ORDER BY v.created_at DESC
            LIMIT 1
        ) as user_vote
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.id = p_post_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_sovereign_community_post_by_id_v25(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_post_by_id_v25(uuid, uuid) TO anon, authenticated, service_role;
