-- ============================================================
-- 🦾 MIRA V2026: PILLAR 023 - PERSISTENCE & GAMIFICATION GOLD
-- CEO: Amanda Abreu | Blindagem de Sincronismo e Mérito
-- ============================================================

-- 1. FIX POST_VOTES CONSTRAINTS
-- Remove a restrição antiga que impedia votar e curtir ao mesmo tempo
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_post_id_user_id_key;
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_pkey CASCADE;
ALTER TABLE public.post_votes ADD PRIMARY KEY (id);

-- Nova restrição: Permite 1 voto de cada TIPO por post (Ex: 1 'like' e 1 'useful')
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_unique_interaction;
ALTER TABLE public.post_votes ADD CONSTRAINT post_votes_unique_interaction UNIQUE(post_id, user_id, vote_type);

-- 2. ENSURE SAVED_POSTS EXISTENCE
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 3. RLS HARDENING (Permissões de Escrita)
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own votes" ON public.post_votes;
CREATE POLICY "Users can manage own votes" ON public.post_votes 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view votes" ON public.post_votes;
CREATE POLICY "Public can view votes" ON public.post_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own saved posts" ON public.saved_posts;
CREATE POLICY "Users can manage own saved posts" ON public.saved_posts 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. CONSOLIDATED REPUTATION TRIGGER (Likes & Fact Voting)
-- Garante que +1 para Liker e +5 para Autor funcionem sem falhas
CREATE OR REPLACE FUNCTION public.tr_award_reputation_v2026()
RETURNS TRIGGER AS $$
DECLARE
    post_author UUID;
BEGIN
    -- Identificar autor do post
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;

    -- Ação baseada no tipo de interação
    IF NEW.vote_type = 'like' THEN
        -- +1 ponto para quem curte
        UPDATE public.profiles SET reputation = COALESCE(reputation, 0) + 1, likes_given_count = COALESCE(likes_given_count, 0) + 1 WHERE id = NEW.user_id;
        INSERT INTO public.gamification_history (user_id, amount, reason, related_post_id) 
        VALUES (NEW.user_id, 1, 'Like na Comunidade', NEW.post_id);

        -- +5 pontos para o autor
        IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
            UPDATE public.profiles SET reputation = COALESCE(reputation, 0) + 5, total_likes_received = COALESCE(total_likes_received, 0) + 1 WHERE id = post_author;
            INSERT INTO public.gamification_history (user_id, amount, reason, related_post_id)
            VALUES (post_author, 5, 'Bónus de Mérito: Like Recebido', NEW.post_id);
        END IF;

    ELSIF NEW.vote_type IN ('useful', 'fake') THEN
        -- +2 pontos para participação em fact-check
        UPDATE public.profiles SET reputation = COALESCE(reputation, 0) + 2, validations_count = COALESCE(validations_count, 0) + 1 WHERE id = NEW.user_id;
        INSERT INTO public.gamification_history (user_id, amount, reason, related_post_id) 
        VALUES (NEW.user_id, 2, 'Validação de Facto', NEW.post_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_mira_reputation_v2026 ON public.post_votes;
CREATE TRIGGER tr_mira_reputation_v2026 
AFTER INSERT ON public.post_votes 
FOR EACH ROW EXECUTE FUNCTION public.tr_award_reputation_v2026();

-- Success check
DO $$ BEGIN RAISE NOTICE 'MIRA Persistence V023 Applied Succesfully! 🏛️'; END $$;
