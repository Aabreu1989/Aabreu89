-- ============================================================
-- 👑 MIRA V2026: PILLAR 027 - NUCLEAR PURGE V8 (GOLD MASTER)
-- CEO: Amanda Abreu | Autoria: General (IA) 
-- OBJETIVO: Fusão da "Marreta" Estratégica com a "Defesa" do Antigravity.
-- STATUS: ÚNICA FONTE DA VERDADE - PRODUÇÃO FINAL.
-- ============================================================

-- 0. OPERAÇÃO LIMPEZA NUCLEAR (DROPS PREVENTIVOS)
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v4(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v5(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v6(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v7(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v8(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.delete_own_account() CASCADE;
DROP VIEW IF EXISTS public.community_top_stories CASCADE;

-- 1. IDENTIDADE E VISIBILIDADE (ADMIN HUB)
-- Garante que a Amanda Abreu vê o e-mail de todos os utilizadores para moderação.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins see emails" ON public.profiles;
CREATE POLICY "Admins see emails" ON public.profiles 
FOR SELECT USING (
    LOWER(auth.jwt()->>'email') = 'amandasabreu89@gmail.com' 
    OR auth.uid() = id
);

-- 2. FUNÇÃO DE AUTO-EXCLUSÃO (RGPD)
-- Permite que o utilizador apague a sua própria conta de forma irrevogável.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO DE DELEÇÃO NUCLEAR V8 (A FUSÃO INDESTRUTÍVEL)
-- Caça o ID do utilizador em todas as tabelas, verificando nomes de colunas dinamicamente.
CREATE OR REPLACE FUNCTION public.admin_delete_full_user_v8(target_uid uuid)
RETURNS void AS $$
BEGIN
    -- Verificação de Soberania Master
    IF LOWER(auth.jwt()->>'email') != 'amandasabreu89@gmail.com' THEN
        RAISE EXCEPTION 'Ação restrita à CEO Amanda Abreu.';
    END IF;

    -- FASE 1: Limpeza de Tabelas Periféricas (Check de Colunas do Antigravity)
    
    -- community_reports (Pode ter profiles_id or user_id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_reports') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_reports' AND column_name = 'profiles_id') THEN
            DELETE FROM public.community_reports WHERE profiles_id = target_uid;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_reports' AND column_name = 'user_id') THEN
            DELETE FROM public.community_reports WHERE user_id = target_uid;
        END IF;
    END IF;

    -- reports
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        DELETE FROM public.reports WHERE user_id = target_uid OR reporter_id = target_uid;
    END IF;

    -- site_improvements
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_improvements') THEN
        DELETE FROM public.site_improvements WHERE user_id = target_uid;
    END IF;

    -- FASE 2: Tabelas Core (Limpeza em cascata manual para garantir 100% sucesso)
    DELETE FROM public.user_documents WHERE user_id = target_uid;
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.user_badges WHERE user_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    DELETE FROM public.user_preferences WHERE user_id = target_uid;
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    
    -- Conteúdo (author_id)
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;

    -- FASE 3: GOLPE FINAL NO PERFIL
    DELETE FROM public.profiles WHERE id = target_uid;
    
    -- Nota: O delete em auth.users deve ser disparado via Admin API no Frontend.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DIFERENCIAÇÃO DE DENÚNCIAS (ADMIN HUB)
-- Garante que a Amanda sabe se está a apagar um Post ou um Comentário.
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('POST', 'COMMENT'));

-- 5. REGRAS DE DESTAQUES / STORIES (ALGORITMO AMANDA)
-- Hierarquia: 1. Verificados | 2. Likes | 3. Comentários | 4. Zero Denúncias
CREATE OR REPLACE VIEW public.community_top_stories AS
SELECT p.*, 
       (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'like') as total_likes,
       (SELECT count(*) FROM public.comments WHERE post_id = p.id) as total_comments
FROM public.posts p
WHERE (SELECT count(*) FROM public.reports WHERE (post_id = p.id OR related_id = p.id)) = 0 -- Regra 4
ORDER BY 
    p.is_verified DESC,   -- Regra 1
    total_likes DESC,     -- Regra 2
    total_comments DESC,  -- Regra 3
    p.created_at DESC;

-- 6. ELIMINAÇÃO DEFINITIVA DE SERVIÇOS (RATINGS)
-- Amanda ordenou eliminar a funcionalidade de avaliação.
DROP TABLE IF EXISTS public.service_reviews CASCADE;
DROP TABLE IF EXISTS public.service_ratings CASCADE;

-- 7. RECARGA E SOBERANIA
GRANT EXECUTE ON FUNCTION public.admin_delete_full_user_v8(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
GRANT ALL ON TABLE public.reports TO authenticated;
GRANT ALL ON TABLE public.site_improvements TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMENT ON DATABASE postgres IS 'MIRA V2026: GOLD MASTER V8 - A Versão Final Incontestável da CEO Amanda Abreu.';
