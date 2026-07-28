-- ============================================================
-- 🦾 MIRA V2026: community_sovereignty_final.sql
-- Finalização da Soberania Comunitária (Gold Master)
-- ============================================================

-- [1] MODERAÇÃO SOBERANA: Categorização Precisa de Denúncias
-- Adiciona a coluna de categoria na tabela de reports
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- [2] SINCRONIZAÇÃO SOBERANA: Followers & Following Counts
-- Garante que o contador nos perfis seja sempre real em relação à tabela user_follows

CREATE OR REPLACE FUNCTION public.tr_sync_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Incrementar contador do seguidor (quem segue)
        UPDATE public.profiles 
        SET following_count = COALESCE(following_count, 0) + 1 
        WHERE id = NEW.follower_id;
        
        -- Incrementar contador de quem é seguido
        UPDATE public.profiles 
        SET followers_count = COALESCE(followers_count, 0) + 1 
        WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrementar contador do seguidor
        UPDATE public.profiles 
        SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
        WHERE id = OLD.follower_id;
        
        -- Decrementar contador de quem era seguido
        UPDATE public.profiles 
        SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
        WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_follows ON public.user_follows;
CREATE TRIGGER tr_sync_user_follows
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.tr_sync_follower_counts();

-- [3] RECALIBRAÇÃO INICIAL (Garantia de Sincronismo Gold Master)
-- Executa uma atualização em massa para corrigir eventuais desvios passados
UPDATE public.profiles p
SET 
  followers_count = (SELECT count(*) FROM public.user_follows WHERE following_id = p.id),
  following_count = (SELECT count(*) FROM public.user_follows WHERE follower_id = p.id);

-- [4] PERMISSÕES RLS: Garantir que o Admin possa ver tudo em Gold Master
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Sucesso: Finalização de Sincronismo Core Mira V2026
DO $$ BEGIN RAISE NOTICE 'MIRA Sovereignty V2026 Applied! 🛡️'; END $$;
