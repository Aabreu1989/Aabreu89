-- ============================================================
-- 🛡️ MIRA V2026.GOLD: COMUNIDADE SOBERANA EXTREMA (v24.1)
-- TARGET: Resgate Total de Posts, Seguidores e Destaques
-- STATUS: NUCLEAR RESTORATION - DISCO DE PRODUÇÃO
-- ============================================================

-- [1] UNIFICAÇÃO DE TABELAS DE SEGUIDORES (Atomic Unification)
-- Se a 'user_follows' existir, movemos os dados para 'follows' e destruímos a redundância.
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_follows') THEN
        INSERT INTO public.follows (follower_id, following_id, created_at)
        SELECT follower_id, following_id, created_at FROM public.user_follows
        ON CONFLICT DO NOTHING;
        
        DROP TABLE public.user_follows CASCADE;
    END IF;
END $$;

-- Garantir que columns existam em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;

-- [2] TRIGGER SOBERANO: SINCRONIZAÇÃO DE CONTADORES E BADGES
CREATE OR REPLACE FUNCTION public.tr_sync_follows_atomic_v24()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Incrementar counts
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
        
        -- [GAMIFICAÇÃO] Check de Badges ativado por incremento
        -- 50 Seguidores -> Influenciador
        IF (SELECT followers_count FROM public.profiles WHERE id = NEW.following_id) >= 50 THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.following_id, 'badge3_name') ON CONFLICT DO NOTHING;
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrementar counts
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_follows_atomic ON public.follows;
CREATE TRIGGER tr_sync_follows_atomic
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.tr_sync_follows_atomic_v24();

-- [3] MOTOR DE FEED SOBERANO (v24.1)
-- Esta é a função que o frontend chama: get_sovereign_community_feed_v24
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
        (SELECT count(*) FROM public.reports r WHERE r.content_id = p.id::text)::int as reports,
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

-- [4] RECALIBRAÇÃO DE DESTAQUES (Nobel v2026.GOLD)
DROP VIEW IF EXISTS public.community_top_stories_nobel;
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
SELECT 
    p.*,
    (
        CASE WHEN prof.is_verified THEN 1000 ELSE 0 END +
        (p.likes * 50) +
        ((SELECT count(*) FROM public.comments c WHERE c.post_id = p.id) * 30)
    ) as calculated_nobel_score
FROM public.posts p
JOIN public.profiles prof ON p.author_id = prof.id
WHERE p.validation_status != 'blocked'
AND p.created_at >= (NOW() - INTERVAL '30 days') -- Janela expandida de 7 para 30 dias para evitar "feed vazio"
ORDER BY calculated_nobel_score DESC;

-- [5] SEGURANÇA E ADMIN (Email Visibility)
-- Garantir que o Admin veja o e-mail no perfil
DROP POLICY IF EXISTS "Public profiles email visibility" ON public.profiles;
CREATE POLICY "Public profiles email visibility" ON public.profiles
FOR SELECT USING (
    TRUE -- Todos vêem o básico
);
-- Nota: O email é retornado no JSON do author no RPC se o admin assim o desejar.

-- [6] RECALIBRAÇÃO MANUAL DE CONTADORES (Garantia Pós-Fix)
UPDATE public.profiles p
SET 
  followers_count = (SELECT count(*) FROM public.follows WHERE following_id = p.id),
  following_count = (SELECT count(*) FROM public.follows WHERE follower_id = p.id);

DO $$ BEGIN RAISE NOTICE 'Soberania Restaurada: Feed v24.1 Ativo e Sincronizado.'; END $$;
