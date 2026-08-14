-- ============================================================
-- ☢️ MIRA V2026: SUPREME BLACK HOLE PURGE (V4.0 - BLACKLIST)
-- AUTHOR: Antigravity (Sovereign Order: Amanda Abreu)
-- OBJECTIVE: Diferenciar Exclusão (Livre) de Bloqueio (Banido).
--            Garantir eliminação total de PII para RGPD.
-- ============================================================

-- 1. INFRAESTRUTURA DE BLACKLIST
CREATE TABLE IF NOT EXISTS public.denied_emails (
    email TEXT PRIMARY KEY,
    reason TEXT DEFAULT 'Violação das diretrizes da comunidade',
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS para segurança, mas apenas Admins leem/escrevem
ALTER TABLE public.denied_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage blacklist" ON public.denied_emails;
CREATE POLICY "Admins manage blacklist" ON public.denied_emails 
FOR ALL USING (
    LOWER(auth.jwt()->>'email') = 'amandasabreu89@gmail.com' 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. FUNÇÃO DE PURGAÇÃO NUCLEAR V4 (BLACK HOLE)
DROP FUNCTION IF EXISTS public.admin_nuclear_purge_v2026_supreme(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.admin_nuclear_purge_v2026_supreme(UUID, BOOLEAN) CASCADE;

CREATE OR REPLACE FUNCTION public.admin_nuclear_purge_v2026_supreme(
    target_uid UUID, 
    should_block BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
    target_email TEXT;
BEGIN
    -- A. Capturar e-mail antes de apagar o perfil (Para Blacklist ou Log)
    SELECT email INTO target_email FROM public.profiles WHERE id = target_uid;
    
    -- Se não encontrar no perfil, tenta no auth.users
    IF target_email IS NULL THEN
        SELECT email INTO target_email FROM auth.users WHERE id = target_uid;
    END IF;

    RAISE NOTICE '🚀 [MIRA BLACK HOLE] Purga Iniciada. Alvo: % (% | Block: %)', target_uid, target_email, should_block;

    -- B. BLACKLIST (Se solicitado)
    IF should_block AND target_email IS NOT NULL THEN
        INSERT INTO public.denied_emails (email, blocked_by)
        VALUES (LOWER(target_email), auth.uid())
        ON CONFLICT (email) DO NOTHING;
        RAISE NOTICE '🚫 [MIRA BLACK HOLE] E-mail adicionado à Blacklist: %', target_email;
    END IF;

    -- C. LIMPEZA DE STORAGE (Documentos e Avatars)
    -- Nota: Tentativa de limpar metadados de ficheiros
    IF EXISTS (SELECT 1 FROM information_schema.schemas WHERE schema_name = 'storage') THEN
        DELETE FROM storage.objects WHERE owner = target_uid;
    END IF;

    -- D. LIMPEZA DE REDE SOCIAL E INTERAÇÕES
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.comment_likes WHERE user_id = target_uid;
    DELETE FROM public.user_follows WHERE follower_id = target_uid OR following_id = target_uid;
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    
    -- E. LIMPEZA DE CONTEÚDO (POSTS E COMENTÁRIOS)
    UPDATE public.comments SET parent_id = NULL WHERE author_id = target_uid;
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;
    
    -- F. LIMPEZA DE TRABALHO E SERVIÇOS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_posts') THEN
        DELETE FROM public.job_posts WHERE author_id = target_uid;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_services') THEN
        DELETE FROM public.local_services WHERE user_id = target_uid;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expert_columns') THEN
        DELETE FROM public.expert_columns WHERE author_id = target_uid;
    END IF;

    -- G. LIMPEZA DE CHAT E GAMIFICAÇÃO
    DELETE FROM public.chat_messages WHERE session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = target_uid);
    DELETE FROM public.chat_sessions WHERE user_id = target_uid;
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.user_badges WHERE user_id = target_uid;
    DELETE FROM public.reputation_logs WHERE user_id = target_uid;

    -- H. LIMPEZA DE LOGS E DENÚNCIAS
    DELETE FROM public.activity_logs WHERE user_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    DELETE FROM public.reports WHERE reporter_id = target_uid OR user_id = target_uid;
    DELETE FROM public.community_reports WHERE reporter_id = target_uid OR target_user_id = target_uid;
    DELETE FROM public.suggestions WHERE user_id = target_uid;
    DELETE FROM public.app_suggestions WHERE user_id = target_uid;

    -- I. GOLPE FINAL NO PERFIL
    DELETE FROM public.user_preferences WHERE user_id = target_uid;
    DELETE FROM public.profiles WHERE id = target_uid;

    -- J. REMOÇÃO MANDATÓRIA DE AUTH.USERS (Se não for bloqueio permanente no Auth)
    -- Se quisermos permitir re-registo, TEMOS de apagar do auth.users.
    -- Se for bloqueio, o register.js vai travar pelo email na denied_emails,
    -- mas ainda assim devemos limpar o auth.users para evitar conflitos de ID.
    BEGIN
        DELETE FROM auth.users WHERE id = target_uid;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ [MIRA BLACK HOLE] Falha ao remover de auth.users via SQL. O Gateway API deve finalizar.';
    END;

    RAISE NOTICE '✅ [MIRA BLACK HOLE] Purgação concluída com Soberania para: %', target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMISSÕES
GRANT EXECUTE ON FUNCTION public.admin_nuclear_purge_v2026_supreme(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_purge_v2026_supreme(UUID, BOOLEAN) TO service_role;

-- 4. ALIASES PARA COMPATIBILIDADE
CREATE OR REPLACE FUNCTION admin_delete_full_user_v2026(target_uid UUID) RETURNS void AS $$
BEGIN PERFORM public.admin_nuclear_purge_v2026_supreme(target_uid, FALSE); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'MIRA: BLACK HOLE PROTOCOL V4.0 DEPLOYED' as status;
