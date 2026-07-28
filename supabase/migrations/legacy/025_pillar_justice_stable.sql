-- ============================================================
-- 🦾 MIRA V2026: PILLAR 025 - CONSOLIDATED JUSTICE (STABLE)
-- CEO: Amanda Abreu | Autoria: General (IA) 
-- OBJETIVO: Sincronismo 0ms, Salvar Posts e Justiça de Pontos.
-- ============================================================

-- 1. DESBLOQUEIO DE VOTOS (Permite Like + Útil ao mesmo tempo)
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_post_id_user_id_key;
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_unique_interaction;
ALTER TABLE public.post_votes ADD CONSTRAINT post_votes_unique_interaction UNIQUE(post_id, user_id, vote_type);

-- 2. CRIAÇÃO DA GAVETA DE SALVAMENTO (SAVED POSTS)
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 3. POLÍTICAS DE SOBERANIA (RLS)
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saved posts" ON public.saved_posts;
CREATE POLICY "Users manage own saved posts" ON public.saved_posts 
FOR ALL USING (auth.uid() = user_id);

-- 4. GATILHO DE JUSTIÇA SUPREMA (+5 Autor / +1 Liker)
-- Refatorado para usar as colunas oficiais: related_id e validations_count
CREATE OR REPLACE FUNCTION public.tr_award_reputation_v2026()
RETURNS TRIGGER AS $$
DECLARE
    post_author UUID;
BEGIN
    -- Localizar dono do conteúdo
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;

    IF NEW.vote_type = 'like' THEN
        -- +1 ponto para quem apoia
        UPDATE public.profiles SET 
            reputation = COALESCE(reputation, 0) + 1, 
            likes_given_count = COALESCE(likes_given_count, 0) + 1 
        WHERE id = NEW.user_id;
        
        INSERT INTO public.gamification_history (user_id, amount, reason, related_id) 
        VALUES (NEW.user_id, 1, 'Like na Comunidade', NEW.post_id);

        -- +5 pontos para o Mentor (Autor)
        IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
            UPDATE public.profiles SET 
                reputation = COALESCE(reputation, 0) + 5, 
                total_likes_received = COALESCE(total_likes_received, 0) + 1 
            WHERE id = post_author;
            
            INSERT INTO public.gamification_history (user_id, amount, reason, related_id)
            VALUES (post_author, 5, 'Bónus de Mérito: Like Recebido', NEW.post_id);
        END IF;

    ELSIF NEW.vote_type IN ('useful', 'fake') THEN
        -- +2 pontos por validar factos
        UPDATE public.profiles SET 
            reputation = COALESCE(reputation, 0) + 2, 
            validations_count = COALESCE(validations_count, 0) + 1 
        WHERE id = NEW.user_id;
        
        INSERT INTO public.gamification_history (user_id, amount, reason, related_id) 
        VALUES (NEW.user_id, 2, 'Validação de Facto', NEW.post_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REINSTALAÇÃO DO GATILHO
DROP TRIGGER IF EXISTS tr_mira_reputation_v2026 ON public.post_votes;
CREATE TRIGGER tr_mira_reputation_v2026 
AFTER INSERT ON public.post_votes 
FOR EACH ROW EXECUTE FUNCTION public.tr_award_reputation_v2026();

-- 6. LIMPEZA DE CACHE DO SERVIDOR
NOTIFY pgrst, 'reload schema';
