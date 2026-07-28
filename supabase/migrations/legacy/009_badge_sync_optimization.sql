-- ============================================================
-- 🦾 MIRA V2026: OPTIMIZAÇÃO DE PERFORMANCE (BADGE SYNC)
-- Sobregravação do Array de Prestígio em Profiles
-- ============================================================

-- 1. ADICIONAR COLUNA DE CACHE (Para evitar JOINS pesados no Feed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- 2. FUNÇÃO DE SINCRONIZAÇÃO ATÓMICA
CREATE OR REPLACE FUNCTION public.sync_user_badges_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET badges = (
        SELECT COALESCE(array_agg(badge_id), '{}')
        FROM public.user_badges
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GATILHOS (TRIGGERS) DE ATUALIZAÇAO EM TEMPO REAL
DROP TRIGGER IF EXISTS tr_sync_badges_on_insert_delete ON public.user_badges;
CREATE TRIGGER tr_sync_badges_on_insert_delete
AFTER INSERT OR DELETE OR UPDATE ON public.user_badges
FOR EACH ROW EXECUTE FUNCTION public.sync_user_badges_to_profile();

-- 4. HIDRATAÇÃO INICIAL (Sincronizar utilizadores existentes)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        UPDATE public.profiles
        SET badges = (
            SELECT COALESCE(array_agg(badge_id), '{}')
            FROM public.user_badges
            WHERE user_id = r.id
        )
        WHERE id = r.id;
    END LOOP;
END $$;
