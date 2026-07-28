-- 👥 MIRA V2026: PROTOCOLO SOCIAL-NOBEL - GAMIFICAÇÃO AUTOMÁTICA
-- Objetivo: Premiar a qualidade e o engajamento sem intervenção manual.

-- 1. Função para atribuir pontos com proteção de limites
CREATE OR REPLACE FUNCTION award_community_points()
RETURNS TRIGGER AS $$
DECLARE
    daily_count INT;
    post_author_id UUID;
BEGIN
    -- Obter o autor do post
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;

    -- REGRA: Dar Like (+1 ponto)
    -- Verificar limite diário (10/dia) para o utilizador que deu o like
    SELECT count(*) INTO daily_count 
    FROM public.post_votes 
    WHERE user_id = NEW.user_id 
      AND vote_type = 'like' 
      AND created_at >= CURRENT_DATE;

    IF (NEW.vote_type = 'like' AND daily_count <= 10) THEN
        UPDATE public.profiles 
        SET reputation = reputation + 1 
        WHERE id = NEW.user_id;
    END IF;

    -- REGRA: Receber Like (+5 pontos para o autor)
    IF (NEW.vote_type = 'like' AND post_author_id IS NOT NULL AND post_author_id != NEW.user_id) THEN
        UPDATE public.profiles 
        SET reputation = reputation + 5 
        WHERE id = post_author_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger para novos likes
DROP TRIGGER IF EXISTS tr_award_points_on_like ON public.post_votes;
CREATE TRIGGER tr_award_points_on_like
AFTER INSERT ON public.post_votes
FOR EACH ROW
WHEN (NEW.vote_type = 'like')
EXECUTE FUNCTION award_community_points();

-- 3. Função para Verificação CEO (+50 pontos)
-- Esta pode ser chamada via RPC pelo Admin Hub
CREATE OR REPLACE FUNCTION verify_post_by_ceo(target_post_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
    post_author_id UUID;
    is_ceo BOOLEAN;
BEGIN
    -- Verificar se o admin é a Amanda (Soberana)
    SELECT (email = 'amandasabreu89@gmail.com') INTO is_ceo FROM public.profiles WHERE id = admin_id;
    
    IF NOT is_ceo THEN
        RAISE EXCEPTION 'Apenas a Soberania (CEO) pode emitir Verificação Diamante.';
    END IF;

    SELECT author_id INTO post_author_id FROM public.posts WHERE id = target_post_id;

    -- Marcar post como verificado
    UPDATE public.posts SET is_verified = TRUE WHERE id = target_post_id;

    -- Atribuir +50 pontos ao autor
    IF post_author_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET reputation = reputation + 50 
        WHERE id = post_author_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.post_votes IS 'MIRA V2026.SOCIAL-NOBEL: Automatic Reputation System Active.';
