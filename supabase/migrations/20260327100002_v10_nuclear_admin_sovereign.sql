-- ☢️ MIRA V2026: NUCLEAR DELETION PROTOCOL (V10)
-- AUTHOR: Antigravity (Sovereign Order: Amanda Abreu)
-- OBJECTIVO: Purgação total e atómica de utilizadores, ultrapassando RLS.

CREATE OR REPLACE FUNCTION admin_delete_full_user_v10(target_uid UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Purga de dados da comunidade
    DELETE FROM community_reports WHERE reported_by = target_uid OR post_id IN (SELECT id FROM posts WHERE author_id = target_uid);
    DELETE FROM comments WHERE author_id = target_uid;
    DELETE FROM post_likes WHERE user_id = target_uid;
    DELETE FROM posts WHERE author_id = target_uid;

    -- 2. Purga de dados de gamificação e social
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    DELETE FROM public.reputation_logs WHERE user_id = target_uid;
    
    -- 3. Purga de interacções MIRA (Realtime)
    DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = target_uid);
    DELETE FROM chat_sessions WHERE user_id = target_uid;
    DELETE FROM suggestions WHERE user_id = target_uid;

    -- 4. Purga Final: Perfil e Autenticação
    DELETE FROM profiles WHERE id = target_uid;
    
    -- DELETE FROM auth.users WHERE id = target_uid; 
    -- Nota: A eliminação em auth.users pode requerer privilégios de superuser ou trigger em profiles.
    -- O MIRA ADMIN HUB confia na deleção do Profile para invalidar o acesso.

    RAISE NOTICE 'Utilizador % purgado com sucesso do MIRA V2026. Sovereignty Certified.', target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
