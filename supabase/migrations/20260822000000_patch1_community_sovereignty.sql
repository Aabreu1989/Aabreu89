
-- 👑 MIRA V2026.GOLD: PATCH 1 (PATCH 1A + PATCH 1B)
-- ---------------------------------------------------------------------------------------------
-- DESCRIÇÃO:
-- 1. PATCH 1A (get_sovereign_community_feed_v25):
--    - Contadores dinâmicos reais derivados da tabela post_votes (likes, useful_votes, fake_votes).
--    - Projeção de 'author_avatar' com cauth.avatar_url real na agregação de comentários.
--    - Projeção de 'likes' com c.likes_count real na agregação de comentários.
--    - Mapeamento exato das colunas físicas de posts e profiles.
--    - Blindagem criptográfica com auth.uid(): p_user_id é preservado exclusivamente por compatibilidade
--      de assinatura, mas a identidade soberana para leitura de interações pessoais deriva estritamente
--      de v_auth_uid := auth.uid().
--    - Determinismo em user_vote com ORDER BY v.created_at DESC LIMIT 1.
-- 2. PATCH 1B (get_sovereign_community_post_by_id_v25):
--    - Nova RPC soberana para busca atómica de um único post por ID (usada por Realtime e Deep Links).
--    - Elimina o acesso direto a profiles pelo frontend; a resolução de identidade permanece
--      estritamente encapsulada dentro da RPC SECURITY DEFINER.
-- ---------------------------------------------------------------------------------------------

-- =============================================================================================
-- 🔹 PATCH 1A: ATUALIZAÇÃO DO FEED SOBERANO (get_sovereign_community_feed_v25)
-- =============================================================================================
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v25(integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v25(
    p_limit INT, 
    p_offset INT,
    p_user_id UUID DEFAULT NULL -- ⚠️ Parâmetro legado preservado exclusivamente para compatibilidade de assinatura
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
    -- 🛡️ SOBERANIA DE SESSÃO: auth.uid() é a única fonte de verdade para interações privadas
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
        -- 🛡️ CONTADORES CANÓNICOS REAIS DERIVADOS DE POST_VOTES
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like')::int as likes,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type IN ('useful', 'true'))::int as useful_votes,
        (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake')::int as fake_votes,
        (SELECT count(*) FROM public.reports r WHERE r.post_id = p.id)::int as reports,
        10::int as nobel_score,
        jsonb_build_object(
            'name', prof.name,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'badges', '[]'::jsonb,
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
                'author_name', cauth.name,
                'author_avatar', cauth.avatar_url, -- 🛡️ AVATAR REAL DO AUTOR DO COMENTÁRIO
                'likes', c.likes_count,             -- 🛡️ CURTIDAS REAIS DO COMENTÁRIO
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
        -- 🛡️ ISOLAMENTO SOBERANO: Apenas a sessão JWT real pode consultar as suas interações
        EXISTS (
            SELECT 1 FROM public.post_votes v 
            WHERE v.post_id = p.id AND v_auth_uid IS NOT NULL AND v.user_id = v_auth_uid AND v.vote_type = 'like'
        ) as is_liked_by_user,
        EXISTS (
            SELECT 1 FROM public.saved_posts s 
            WHERE s.post_id = p.id AND v_auth_uid IS NOT NULL AND s.user_id = v_auth_uid
        ) as is_saved_by_user,
        (
            SELECT vote_type FROM public.post_votes v 
            WHERE v.post_id = p.id AND v_auth_uid IS NOT NULL AND v.user_id = v_auth_uid AND v.vote_type IN ('useful', 'fake', 'true')
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

-- 🛡️ BLINDAGEM EXPLÍCITA DE EXECUÇÃO: Revogar PUBLIC e conceder apenas às roles autorizadas
REVOKE ALL ON FUNCTION public.get_sovereign_community_feed_v25(integer, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v25(integer, integer, uuid) TO anon, authenticated, service_role;


-- =============================================================================================
-- 🔹 PATCH 1B: NOVA RPC SOBERANA POR ID (get_sovereign_community_post_by_id_v25)
-- =============================================================================================
DROP FUNCTION IF EXISTS public.get_sovereign_community_post_by_id_v25(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_sovereign_community_post_by_id_v25(
    p_post_id UUID,
    p_user_id UUID DEFAULT NULL -- ⚠️ Parâmetro legado preservado exclusivamente para compatibilidade de assinatura
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
    -- 🛡️ SOBERANIA DE SESSÃO: auth.uid() é a única fonte de verdade para interações privadas
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
            'badges', '[]'::jsonb,
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
            WHERE v.post_id = p.id AND v_auth_uid IS NOT NULL AND v.user_id = v_auth_uid AND v.vote_type = 'like'
        ) as is_liked_by_user,
        EXISTS (
            SELECT 1 FROM public.saved_posts s 
            WHERE s.post_id = p.id AND v_auth_uid IS NOT NULL AND s.user_id = v_auth_uid
        ) as is_saved_by_user,
        (
            SELECT vote_type FROM public.post_votes v 
            WHERE v.post_id = p.id AND v_auth_uid IS NOT NULL AND v.user_id = v_auth_uid AND v.vote_type IN ('useful', 'fake', 'true')
            ORDER BY v.created_at DESC
            LIMIT 1
        ) as user_vote
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.id = p_post_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 🛡️ BLINDAGEM EXPLÍCITA DE EXECUÇÃO: Revogar PUBLIC e conceder apenas às roles autorizadas
REVOKE ALL ON FUNCTION public.get_sovereign_community_post_by_id_v25(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_post_by_id_v25(uuid, uuid) TO anon, authenticated, service_role;
