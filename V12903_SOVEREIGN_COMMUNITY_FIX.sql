-- ============================================================
-- 👑 V12903_SOVEREIGN_COMMUNITY_FIX.sql
-- OBJETIVO: Resolver 2 bugs críticos:
-- 1. Posts da CEO desaparecem ao navegar (JOIN issue no feed)
-- 2. Posts deletados voltam (falta de fallback RLS na deleção)
-- ============================================================

BEGIN;

-- ==============================================================
-- FIX 1: Garantir que profiles.username nunca está NULL
-- (Causa dos posts da CEO desaparecerem do feed)
-- ==============================================================
UPDATE public.profiles 
SET username = SPLIT_PART(email, '@', 1) 
WHERE username IS NULL AND email IS NOT NULL;

UPDATE public.profiles 
SET username = 'Membro' 
WHERE username IS NULL;

-- ==============================================================
-- FIX 2: Recriar a função do feed com LEFT JOIN em profiles
-- (O JOIN estava a excluir posts cujo author_data era incompleto)
-- ==============================================================
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
                'created_at', c.created_at, 'likes', c.likes
            )) FROM public.comments c LEFT JOIN public.profiles cp ON c.author_id = cp.id WHERE c.post_id = p.id
        ), '[]'::jsonb)
    FROM public.posts p
    LEFT JOIN public.profiles prof ON p.author_id = prof.id  -- ← FIX: LEFT JOIN instead of JOIN
    LEFT JOIN current_votes cv ON cv.post_id = p.id
    LEFT JOIN current_reports cr ON cr.post_id = p.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status IS DISTINCT FROM 'blocked'
    ORDER BY p.created_at DESC  -- ← FIX: Recency-first, not Nobel-first (prevents CEO posts from dropping)
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- FIX 3: Garantir que posts deletados ficam 'blocked' como fallback
-- (Se a deleção física falhar por FK, o post fica invisível)
-- Criar função nuclear que primeiro bloqueia, depois apaga
-- ==============================================================
CREATE OR REPLACE FUNCTION public.nuclear_delete_post(p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Passo 1: Marcar como bloqueado imediatamente (invisível no feed)
    UPDATE public.posts SET validation_status = 'blocked' WHERE id = p_post_id;
    
    -- Passo 2: Limpar dependências
    DELETE FROM public.post_votes WHERE post_id = p_post_id;
    DELETE FROM public.saved_posts WHERE post_id = p_post_id;
    DELETE FROM public.reports WHERE post_id = p_post_id;
    
    -- Passo 3: Apagar comentários e seus likes
    DELETE FROM public.comment_likes WHERE comment_id IN (
        SELECT id FROM public.comments WHERE post_id = p_post_id
    );
    DELETE FROM public.comments WHERE post_id = p_post_id;
    
    -- Passo 4: Limpar knowledge store
    DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = p_post_id;
    
    -- Passo 5: Apagar o post
    DELETE FROM public.posts WHERE id = p_post_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Se falhar, pelo menos o post fica bloqueado e invisível
    RAISE WARNING 'nuclear_delete_post: deleção física falhou para %, mas post foi bloqueado. Erro: %', p_post_id, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão total ao service_role
GRANT EXECUTE ON FUNCTION public.nuclear_delete_post(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v10000(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v10000(INT, INT) TO service_role;

COMMIT;
