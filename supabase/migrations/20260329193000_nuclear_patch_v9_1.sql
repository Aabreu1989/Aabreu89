-- ☢️ MIRA V2026: NUCLEAR PATCH (V9.1)
-- AUTHOR: Antigravity
-- OBJECTIVE: Fix RPC mismatch and ensure all report data is visible in Admin Hub

-- 1. Create Alias for Delete RPC (Fixes Task 4)
CREATE OR REPLACE FUNCTION admin_delete_full_user_v2026(target_uid UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM public.admin_delete_full_user_v10(target_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure admin_delete_full_user_v10 handles all possible tables
CREATE OR REPLACE FUNCTION admin_delete_full_user_v10(target_uid UUID)
RETURNS VOID AS $$
BEGIN
    -- Purga de dados da comunidade
    DELETE FROM public.community_reports WHERE reported_by = target_uid OR post_id IN (SELECT id FROM public.posts WHERE author_id = target_uid);
    DELETE FROM public.reports WHERE user_id = target_uid OR post_id IN (SELECT id FROM public.posts WHERE author_id = target_uid);
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.post_likes WHERE user_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;

    -- Purga de dados de gamificação e social
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    DELETE FROM public.reputation_logs WHERE user_id = target_uid;
    
    -- Purga de interacções MIRA (Realtime)
    DELETE FROM public.chat_messages WHERE session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = target_uid);
    DELETE FROM public.chat_sessions WHERE user_id = target_uid;
    DELETE FROM public.suggestions WHERE user_id = target_uid;
    DELETE FROM public.app_suggestions WHERE user_id = target_uid;

    -- Purga Final: Perfil
    DELETE FROM public.profiles WHERE id = target_uid;
    
    RAISE NOTICE 'Utilizador % purgado com sucesso.', target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix Reports Query (Task 5)
-- Ensure 'reports' table has all necessary fields
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content_type TEXT;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION admin_delete_full_user_v2026(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_delete_full_user_v10(UUID) TO authenticated, service_role;
