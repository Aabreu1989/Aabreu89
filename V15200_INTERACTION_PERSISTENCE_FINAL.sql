-- 👑 MIRA SOBERANA: INTERACTION PERSISTENCE FINAL (V2026.GOLD)
-- Objetivo: Soldadura total dos contadores de Likes, Útil e Falso no banco de dados.

BEGIN;

-- 1. Garante que colunas de contagem existem na tabela posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS useful_votes_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS fake_votes_count INT DEFAULT 0;

-- 2. Gatilho de Sincronização de Votos (Soberania de Dados)
CREATE OR REPLACE FUNCTION public.sync_post_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'like') THEN
            UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes_count = useful_votes_count + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes_count = fake_votes_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'like') THEN
            UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes_count = GREATEST(0, useful_votes_count - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes_count = GREATEST(0, fake_votes_count - 1) WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_post_interactions ON public.post_votes;
CREATE TRIGGER trigger_sync_post_interactions
AFTER INSERT OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_interaction_counts();

-- 3. Função de Verificação de Post (Admin Portal)
CREATE OR REPLACE FUNCTION public.verify_post(p_post_id UUID, p_is_verified BOOLEAN)
RETURNS VOID AS $$
BEGIN
    UPDATE public.posts 
    SET is_verified = p_is_verified,
        nobel_score = CASE WHEN p_is_verified THEN nobel_score + 1000 ELSE nobel_score - 1000 END
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recalcular contagens atuais para sanear o banco (Cura do Cemitério)
UPDATE public.posts p SET
    likes_count = (SELECT COUNT(*)::INT FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like'),
    useful_votes_count = (SELECT COUNT(*)::INT FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful'),
    fake_votes_count = (SELECT COUNT(*)::INT FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake');

-- 5. Atualizar RPC get_sovereign_community_feed_v24 para usar as novas colunas (Performance Sniper)
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v24(INT, INT);
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v24(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    background_image TEXT, is_verified BOOLEAN, validation_status TEXT,
    urgency INT, created_at TIMESTAMPTZ, translations JSONB,
    likes INT, useful_votes INT, fake_votes INT, reports INT, nobel_score INT,
    author JSONB, comments JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.background_image, p.is_verified, p.validation_status,
        p.urgency, p.created_at, p.translations, 
        p.likes_count, p.useful_votes_count, p.fake_votes_count,
        (SELECT COUNT(*)::INT FROM public.reports r WHERE r.post_id = p.id),
        p.nobel_score,
        jsonb_build_object(
            'id', prof.id, 'name', prof.name, 'avatar_url', prof.avatar_url,
            'is_verified', prof.is_verified, 'role', prof.role, 
            'followers_count', prof.followers_count, 'following_count', prof.following_count,
            'level', prof.level
        ) as author,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'created_at', c.created_at,
                'author_id', c.author_id, 'likes', c.likes, 'parent_id', c.parent_id,
                'translations', c.translations,
                'author', jsonb_build_object('name', cauth.name, 'avatar_url', cauth.avatar_url, 'is_verified', cauth.is_verified)
            )) FROM public.comments c 
             JOIN public.profiles cauth ON c.author_id = cauth.id
             WHERE c.post_id = p.id), '[]'::jsonb
        ) as comments
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
