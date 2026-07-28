-- 🏰 MIRA V2026: PROTOCOLO DE INFRAESTRUTURA PRO (C3 & C4)
-- Escrito para 'Soldar' a reputação no servidor.

-- 1. ADAPTAÇÃO DA TABELA PROFILES (Se necessário)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_likes_received integer DEFAULT 0;

-- 2. FUNÇÃO MESTRA DE INCREMENTO (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.modify_reputation(user_id uuid, amount int)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET reputation = COALESCE(reputation, 0) + amount
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER: ATRIBUIÇÃO DE MÉRITO POR LIKE (POST_VOTES)
CREATE OR REPLACE FUNCTION public.handle_merit_on_like()
RETURNS TRIGGER AS $$
DECLARE
    target_author_id uuid;
BEGIN
    SELECT author_id INTO target_author_id FROM public.posts WHERE id = NEW.post_id;
    
    IF NEW.vote_type = 'like' THEN
        -- Autor do post ganha +5
        IF target_author_id IS NOT NULL AND target_author_id <> NEW.user_id THEN
            PERFORM modify_reputation(target_author_id, 5);
            UPDATE public.profiles SET total_likes_received = total_likes_received + 1 WHERE id = target_author_id;
        END IF;
        -- Quem curte ganha +1 (Incentivo ao engajamento)
        PERFORM modify_reputation(NEW.user_id, 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_merit_on_like ON public.post_votes;
CREATE TRIGGER tr_merit_on_like
    AFTER INSERT ON public.post_votes
    FOR EACH ROW EXECUTE FUNCTION public.handle_merit_on_like();

-- 4. TRIGGER: ATRIBUIÇÃO DE MÉRITO POR DESLIKE (DELETE LIKE)
CREATE OR REPLACE FUNCTION public.handle_merit_on_unlike()
RETURNS TRIGGER AS $$
DECLARE
    target_author_id uuid;
BEGIN
    SELECT author_id INTO target_author_id FROM public.posts WHERE id = OLD.post_id;
    
    IF OLD.vote_type = 'like' THEN
        IF target_author_id IS NOT NULL AND target_author_id <> OLD.user_id THEN
            PERFORM modify_reputation(target_author_id, -5);
            UPDATE public.profiles SET total_likes_received = GREATEST(0, total_likes_received - 1) WHERE id = target_author_id;
        END IF;
        PERFORM modify_reputation(OLD.user_id, -1);
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_merit_on_unlike ON public.post_votes;
CREATE TRIGGER tr_merit_on_unlike
    AFTER DELETE ON public.post_votes
    FOR EACH ROW EXECUTE FUNCTION public.handle_merit_on_unlike();

-- 5. TRIGGER: SOBERANIA AIMA (POST VERIFIED +50 PONTOS)
CREATE OR REPLACE FUNCTION public.handle_post_verification_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_verified = true AND (OLD.is_verified = false OR OLD.is_verified IS NULL) THEN
        PERFORM modify_reputation(NEW.author_id, 50);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_post_verification_points ON public.posts;
CREATE TRIGGER tr_post_verification_points
    AFTER UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_post_verification_points();

-- 6. NOTIFICAÇÃO DE INFRAESTRUTURA
DO $$ BEGIN RAISE NOTICE 'MIRA V2026: Infraestrutura Pro v1.0 Soldada! 🛡️'; END $$;
