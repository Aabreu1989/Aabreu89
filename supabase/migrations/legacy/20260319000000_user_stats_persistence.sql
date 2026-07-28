-- ============================================================
-- 🛡️ MIRA PROTOCOLO V26.15: PERSISTÊNCIA DE ESTATÍSTICAS DE USUÁRIO
-- 1. Novos campos em 'profiles'
-- 2. Triggers para contagem automática de posts verificados
-- 3. Triggers para contagem automática de curtidas recebidas
-- ============================================================

-- 1. ADICIONAR COLUNAS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_posts_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_likes_received int DEFAULT 0;

-- 2. TRIGGER PARA CONTAGEM DE POSTS VERIFICADOS
CREATE OR REPLACE FUNCTION public.sync_profile_verified_posts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.is_verified = true) THEN
        UPDATE public.profiles SET verified_posts_count = verified_posts_count + 1 WHERE id = NEW.author_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.is_verified = false AND NEW.is_verified = true) THEN
            UPDATE public.profiles SET verified_posts_count = verified_posts_count + 1 WHERE id = NEW.author_id;
        ELSIF (OLD.is_verified = true AND NEW.is_verified = false) THEN
            UPDATE public.profiles SET verified_posts_count = verified_posts_count - 1 WHERE id = NEW.author_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.is_verified = true) THEN
        UPDATE public.profiles SET verified_posts_count = verified_posts_count - 1 WHERE id = OLD.author_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_verification_change ON public.posts;
CREATE TRIGGER on_post_verification_change
AFTER INSERT OR UPDATE OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verified_posts();

-- 3. TRIGGER PARA CONTAGEM DE CURTIDAS EM POSTS
CREATE OR REPLACE FUNCTION public.sync_profile_post_likes()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id uuid;
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.vote_type = 'like') THEN
        SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
        IF post_author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_likes_received = total_likes_received + 1 WHERE id = post_author_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.vote_type = 'like') THEN
        SELECT author_id INTO post_author_id FROM public.posts WHERE id = OLD.post_id;
        IF post_author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_likes_received = total_likes_received - 1 WHERE id = post_author_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
        IF post_author_id IS NOT NULL THEN
            IF (OLD.vote_type != 'like' AND NEW.vote_type = 'like') THEN
                UPDATE public.profiles SET total_likes_received = total_likes_received + 1 WHERE id = post_author_id;
            ELSIF (OLD.vote_type = 'like' AND NEW.vote_type != 'like') THEN
                UPDATE public.profiles SET total_likes_received = total_likes_received - 1 WHERE id = post_author_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_like_change ON public.post_votes;
CREATE TRIGGER on_post_like_change
AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_post_likes();

-- 4. TRIGGER PARA CONTAGEM DE CURTIDAS EM COMENTÁRIOS
CREATE OR REPLACE FUNCTION public.sync_profile_comment_likes()
RETURNS TRIGGER AS $$
DECLARE
    comment_author_id uuid;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        SELECT author_id INTO comment_author_id FROM public.comments WHERE id = NEW.comment_id;
        IF comment_author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_likes_received = total_likes_received + 1 WHERE id = comment_author_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT author_id INTO comment_author_id FROM public.comments WHERE id = OLD.comment_id;
        IF comment_author_id IS NOT NULL THEN
            UPDATE public.profiles SET total_likes_received = total_likes_received - 1 WHERE id = comment_author_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_comment_likes();

-- 5. RECONSTRUÇÃO RETROATIVA DAS ESTATÍSTICAS
UPDATE public.profiles p
SET 
  verified_posts_count = (SELECT count(*) FROM public.posts WHERE author_id = p.id AND is_verified = true),
  total_likes_received = 
    (SELECT count(*) FROM public.post_votes pv JOIN public.posts post ON pv.post_id = post.id WHERE post.author_id = p.id AND pv.vote_type = 'like') + 
    (SELECT count(*) FROM public.comment_likes cl JOIN public.comments c ON cl.comment_id = c.id WHERE c.author_id = p.id);

-- COMENTÁRIO DE SUCESSO
COMMENT ON COLUMN public.profiles.verified_posts_count IS 'Número total de publicações validadas pela comunidade ou staff.';
COMMENT ON COLUMN public.profiles.total_likes_received IS 'Soma total de curtidas recebidas em posts e comentários.';
