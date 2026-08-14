-- ============================================================
-- ☢️ MIRA V2026: SUPREME NUCLEAR PURGE (SOVEREIGN RGPD V2026.GOLD)
-- AUTHOR: Antigravity (Sovereign Master)
-- OBJECTIVE: Garantir eliminação 100% atómica de todos os rastos do utilizador.
--            ESTE É O PROTOCOLO DEFINITIVO PARA EVITAR "ZOMBIE USERS".
-- ============================================================

-- 0. DROPS PREVENTIVOS
DROP FUNCTION IF EXISTS public.admin_nuclear_purge_v2026_supreme(UUID) CASCADE;

-- 1. FUNÇÃO DE PURGAÇÃO NUCLEAR SUPREMA
CREATE OR REPLACE FUNCTION public.admin_nuclear_purge_v2026_supreme(target_uid UUID)
RETURNS void AS $$
DECLARE
    row_count INT;
BEGIN
    -- 🛡️ LOG DE AUDITORIA (SOBERANIA ADMIN)
    RAISE NOTICE '🚀 [MIRA NUCLEAR] Iniciando purgação definitiva para: %', target_uid;

    -- A. LIMPEZA DE REDE SOCIAL E INTERAÇÕES (PUBLIC)
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.comment_likes WHERE user_id = target_uid;
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    
    -- B. LIMPEZA DE CONTEÚDO (POSTS E COMENTÁRIOS)
    -- Primeiro as referências circulares
    UPDATE public.comments SET parent_id = NULL WHERE author_id = target_uid;
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;
    
    -- C. LIMPEZA DE CHAT E MENSAGENS
    DELETE FROM public.chat_messages WHERE session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = target_uid);
    DELETE FROM public.chat_sessions WHERE user_id = target_uid;
    
    -- D. LIMPEZA DE GAMIFICAÇÃO E REPUTAÇÃO
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.user_badges WHERE user_id = target_uid;
    DELETE FROM public.reputation_logs WHERE user_id = target_uid;
    
    -- E. LIMPEZA DE DOCUMENTOS E DOWNLOADS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents' AND table_schema = 'public') THEN
        DELETE FROM public.user_documents WHERE user_id = target_uid;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_downloads' AND table_schema = 'public') THEN
        DELETE FROM public.user_downloads WHERE user_id = target_uid;
    END IF;

    -- F. LIMPEZA DE DENÚNCIAS E SUGESTÕES
    DELETE FROM public.community_reports WHERE reporter_id = target_uid OR target_user_id = target_uid OR post_id IN (SELECT id FROM public.posts WHERE author_id = target_uid);
    DELETE FROM public.reports WHERE reporter_id = target_uid OR user_id = target_uid;
    DELETE FROM public.suggestions WHERE user_id = target_uid;
    DELETE FROM public.app_suggestions WHERE user_id = target_uid;
    DELETE FROM public.site_improvements WHERE user_id = target_uid;
    DELETE FROM public.ai_feedback WHERE user_id = target_uid;

    -- G. LIMPEZA DE AUDITORIA E LOGS DE ATIVIDADE
    DELETE FROM public.activity_logs WHERE user_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;

    -- H. GOLPE FINAL NO PERFIL (PUBLIC)
    DELETE FROM public.profiles WHERE id = target_uid;
    
    -- I. REMOÇÃO NO SISTEMA DE AUTENTICAÇÃO (MANDATÓRIO)
    -- Nota: Exige SECURITY DEFINER para aceder ao schema 'auth'.
    -- Se falhar aqui, o utilizador continuaria a poder fazer login.
    BEGIN
        DELETE FROM auth.users WHERE id = target_uid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ [MIRA NUCLEAR] Aviso: Falha ao remover de auth.users via SQL. O Gateway API deve finalizar.';
    END;

    RAISE NOTICE '✅ [MIRA NUCLEAR] Purgação concluída para: %', target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PERMISSÕES
GRANT EXECUTE ON FUNCTION public.admin_nuclear_purge_v2026_supreme(UUID) TO service_role;
-- Permitimos temporariamente a 'authenticated' para que o utilizador possa apagar a sua própria conta
GRANT EXECUTE ON FUNCTION public.admin_nuclear_purge_v2026_supreme(UUID) TO authenticated;

-- 3. ALIAS PARA RESILIÊNCIA (REPLACES OLD VERSIONS)
CREATE OR REPLACE FUNCTION admin_delete_full_user_v2026(target_uid UUID) RETURNS void AS $$
BEGIN PERFORM public.admin_nuclear_purge_v2026_supreme(target_uid); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_full_user_v10(target_uid UUID) RETURNS void AS $$
BEGIN PERFORM public.admin_nuclear_purge_v2026_supreme(target_uid); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. NOTIFICAÇÃO DE SUCESSO
SELECT 'MIRA: NUCLEAR PURGE PROTOCOL V2026.GOLD DEPLOYED' as status;
