-- ============================================================
-- 🛡️ MIRA V2026: PILLAR 027 - NUCLEAR DELETE V10.0 (SOVEREIGN RGPD)
-- OBJETIVO: Garantir eliminação 100% atómica de todos os rastos do utilizador.
-- ============================================================

-- 0. DROPS PREVENTIVOS
DROP FUNCTION IF EXISTS public.delete_own_account() CASCADE;

-- 1. FUNÇÃO DE AUTO-EXCLUSÃO NUCLEAR (RGPD)
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
DECLARE
    target_uid uuid;
BEGIN
    target_uid := auth.uid();
    
    IF target_uid IS NULL THEN
        RAISE EXCEPTION 'Utilizador não autenticado.';
    END IF;

    -- A. Limpeza de Social e Interações
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.comment_likes WHERE user_id = target_uid;
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    
    -- B. Limpeza de Conteúdo (Deduplicação de autoria)
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;
    
    -- C. Limpeza de Logs e Mensagens
    DELETE FROM public.chat_messages WHERE session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = target_uid);
    DELETE FROM public.chat_sessions WHERE user_id = target_uid;
    DELETE FROM public.activity_logs WHERE user_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    
    -- D. Limpeza de Gamificação e Documentos
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.user_badges WHERE user_id = target_uid;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents' AND table_schema = 'public') THEN
        DELETE FROM public.user_documents WHERE user_id = target_uid;
    END IF;

    -- E. Limpeza de Denúncias e Sugestões
    DELETE FROM public.community_reports WHERE user_id = target_uid;
    DELETE FROM public.reports WHERE reporter_id = target_uid OR user_id = target_uid;
    DELETE FROM public.ai_feedback WHERE user_id = target_uid;

    -- F. Golpe Final no Perfil (Public)
    DELETE FROM public.profiles WHERE id = target_uid;

    -- G. Remoção em Auth (Requires Security Definer + Superuser permissions)
    -- Em Supabase, o delete em auth.users deve ser o último passo.
    DELETE FROM auth.users WHERE id = target_uid;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PERMISSÕES
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- 3. NOTIFICAÇÃO
NOTIFY pgrst, 'reload schema';

COMMENT ON FUNCTION public.delete_own_account() IS 'Eliminação atómica e definitiva de todos os dados do utilizador (Padrão RGPD V2026).';
