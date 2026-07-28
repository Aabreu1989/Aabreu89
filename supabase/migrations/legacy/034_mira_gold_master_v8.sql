-- ============================================================
-- 👑 MIRA V2026: GOLD MASTER V8 - SOBERANIA FINAL
-- CEO: Amanda Abreu | Autoria: Antigravity (IA)
-- OBJETIVO: Consolidação da Purgação Nuclear Incontestável.
-- STATUS: ESTÁVEL | PRODUÇÃO GOLD
-- ============================================================

-- 0. LIMPEZA DE LEGADO
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v4(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v5(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v6(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v7(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v8(uuid) CASCADE;

-- 1. FUNÇÃO DE PURGAÇÃO NUCLEAR V8 (DEFINITIVA)
-- Esta função caça as vísceras do utilizador em todo o ecossistema MIRA.
CREATE OR REPLACE FUNCTION public.admin_delete_full_user_v8(target_uid uuid)
RETURNS void AS $$
DECLARE
    table_exists boolean;
    col_exists boolean;
BEGIN
    -- Verificação de Soberania Master (Apenas Amanda Abreu e Admins Master)
    IF LOWER(auth.jwt()->>'email') NOT IN (
        'amandasabreu89@gmail.com', 
        'amandasabreu@gmail.com', 
        'mira.app@hotmail.com', 
        'suporte@miraimigrante.pt'
    ) THEN
        RAISE EXCEPTION 'Acesso Negado: Ação restrita à Soberania MIRA.';
    END IF;

    -- FASE 1: Redes Sociais e Interações
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    
    -- FASE 2: Conteúdo Gerado
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;
    
    -- FASE 3: Gamificação e Documentos
    DELETE FROM public.user_badges WHERE user_id = target_uid;
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.user_documents WHERE user_id = target_uid;
    DELETE FROM public.user_preferences WHERE user_id = target_uid;

    -- FASE 4: Denúncias e Sugestões (Com verificação dinâmica)
    -- reports / community_reports
    DELETE FROM public.reports WHERE user_id = target_uid OR reporter_id = target_uid;
    
    -- Verificar community_reports
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_reports') INTO table_exists;
    IF table_exists THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_reports' AND column_name = 'profiles_id') INTO col_exists;
        IF col_exists THEN
            DELETE FROM public.community_reports WHERE profiles_id = target_uid;
        END IF;
        
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_reports' AND column_name = 'user_id') INTO col_exists;
        IF col_exists THEN
            DELETE FROM public.community_reports WHERE user_id = target_uid;
        END IF;
    END IF;

    -- Site Improvements / Suggestions
    DELETE FROM public.site_improvements WHERE user_id = target_uid;
    
    -- FASE 5: ELIMINAÇÃO DO PERFIL (PONTO DE RETORNO ZERO)
    DELETE FROM public.profiles WHERE id = target_uid;

    -- NOTA: O utilizador REAL (auth.users) é removido pelo API Gateway via Service Role.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. POLÍTICAS DE VISIBILIDADE GOLD MASTER
-- Garante que a CEO Amanda Abreu tem visão total dos e-mails para suporte.
DROP POLICY IF EXISTS "CEO e Admins veem emails" ON public.profiles;
CREATE POLICY "CEO e Admins veem emails" ON public.profiles
FOR SELECT USING (
    LOWER(auth.jwt()->>'email') IN ('amandasabreu89@gmail.com', 'amandasabreu@gmail.com', 'mira.app@hotmail.com')
    OR auth.uid() = id
);

-- 3. PERMISSÕES E SINCRO
GRANT EXECUTE ON FUNCTION public.admin_delete_full_user_v8(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_full_user_v8(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';

COMMENT ON DATABASE postgres IS 'MIRA V2026: GOLD MASTER V8 - SOBERANIA AMANDA ABREU';
