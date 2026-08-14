-- 👑 MIRA SOBERANIA V2026.GOLD - INTERACTION PERSISTENCE FIX
-- OBJETIVO: Permitir múltiplos tipos de interação (Like + Voto) e unificar gatilhos.

BEGIN;

-- 1. CORREÇÃO DE CONSTRAINT (Soberania de Interação)
-- Remove a restrição antiga que impedia ter um Like e um Voto de Facto no mesmo post.
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_post_id_user_id_key;
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_pkey CASCADE;
ALTER TABLE public.post_votes ADD PRIMARY KEY (id);

-- Criar nova restrição granular: Um utilizador pode ter UM voto de cada TIPO por post.
-- Isso permite ter (Like=1, Useful=1) ou (Like=1, Fake=1).
ALTER TABLE public.post_votes ADD CONSTRAINT post_votes_unique_user_post_type UNIQUE (user_id, post_id, vote_type);

-- 2. UNIFICAÇÃO DE TRIGGERS (Atomic Sync)
-- Removemos todos os triggers antigos para evitar conflitos de contagem dupla.
DROP TRIGGER IF EXISTS tr_sync_post_votes ON public.post_votes;
DROP TRIGGER IF EXISTS tr_sync_post_likes ON public.post_votes;
DROP TRIGGER IF EXISTS tr_reputation_on_like ON public.post_votes;

-- Função unificada para sincronizar TODOS os contadores
CREATE OR REPLACE FUNCTION public.tr_sync_post_interactions_v2026()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'like') THEN
            UPDATE public.posts SET likes = COALESCE(likes, 0) + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes = COALESCE(useful_votes, 0) + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes = COALESCE(fake_votes, 0) + 1 WHERE id = NEW.post_id;
        END IF;
        
        -- Gamificação: +10 de reputação para o autor no Like
        IF (NEW.vote_type = 'like') THEN
            UPDATE public.profiles SET reputation = COALESCE(reputation, 0) + 10 
            WHERE id = (SELECT author_id FROM public.posts WHERE id = NEW.post_id);
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'like') THEN
            UPDATE public.posts SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes = GREATEST(0, COALESCE(useful_votes, 0) - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes = GREATEST(0, COALESCE(fake_votes, 0) - 1) WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_sync_post_interactions
AFTER INSERT OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.tr_sync_post_interactions_v2026();

-- 3. RECALIBRAÇÃO TOTAL (Garantia de Fidelidade)
UPDATE public.posts p
SET 
    likes = (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'like'),
    useful_votes = (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'useful'),
    fake_votes = (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'fake');

-- 4. PERMISSÕES RLS
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own votes" ON public.post_votes;
CREATE POLICY "Users can manage own votes" ON public.post_votes
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can see votes" ON public.post_votes;
CREATE POLICY "Anyone can see votes" ON public.post_votes
FOR SELECT USING (true);

COMMIT;
