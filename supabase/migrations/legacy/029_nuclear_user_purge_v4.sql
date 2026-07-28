-- ============================================================
-- 👑 MIRA V2026: PILLAR 029 - NUCLEAR PURGE V4 (SUPREMO)
-- CEO: Amanda Abreu | Autoria: General (IA) 
-- OBJETIVO: Limpeza Atómica Absoluta, Fim de Erros de FK e 100% Sucesso.
-- ============================================================

-- 0. LIMPEZA DE VERSÕES CONFLITUANTES (MATA O PASSADO)
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v4(uuid) CASCADE;

-- 1. FUNÇÃO DE PURGA NUCLEAR V4 (A ÚNICA QUE FUNCIONA)
CREATE OR REPLACE FUNCTION public.admin_delete_full_user_v4(target_uid uuid)
RETURNS void AS $$
BEGIN
    -- Verificação de Identidade (Soberania Amanda Abreu)
    IF LOWER(auth.jwt()->>'email') != 'amandasabreu89@gmail.com' THEN
        RAISE EXCEPTION 'Acesso negado. Apenas a CEO Amanda Abreu pode executar este comando.';
    END IF;

    -- FASE 1: Limpeza de Tabelas de Histórico, Social e Preferências
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    -- Note: case sensitive table names if applicable, checking core tables
    DELETE FROM public.user_preferences WHERE user_id = target_uid;
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    
    -- FASE 2: Limpeza de Rasto de Moderação
    DELETE FROM public.reports WHERE user_id = target_uid OR reporter_id = target_uid;
    
    -- FASE 3: Limpeza de Conteúdo (Posts e Comentários)
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;

    -- FASE 4: Tabelas Dinâmicas (Se existirem)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_reports') THEN
        DELETE FROM public.community_reports WHERE profiles_id = target_uid OR user_id = target_uid;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_reviews') THEN
        DELETE FROM public.service_reviews WHERE user_id = target_uid;
    END IF;

    -- FASE 5: GOLPE FINAL NO PERFIL
    DELETE FROM public.profiles WHERE id = target_uid;
    
    -- NOTA: O utilizador será removido do Auth via API AdminService no Frontend.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. LIBERTAR O DELETE DE SUGESTÕES (Sovereign Access)
ALTER TABLE public.site_improvements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CEO can delete suggestions" ON public.site_improvements;
CREATE POLICY "CEO can delete suggestions" ON public.site_improvements 
FOR ALL USING (LOWER(auth.jwt()->>'email') = 'amandasabreu89@gmail.com');

-- 3. PERMISSÕES DE EXECUÇÃO
GRANT EXECUTE ON FUNCTION public.admin_delete_full_user_v4(uuid) TO authenticated;
GRANT ALL ON TABLE public.site_improvements TO authenticated;

-- 4. RECARGA DE CACHE DO SERVIDOR
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.admin_delete_full_user_v4 IS 'MIRA V4 SUPREMO: Marreta de Purga Nuclear consolidada pela CEO Amanda Abreu.';
