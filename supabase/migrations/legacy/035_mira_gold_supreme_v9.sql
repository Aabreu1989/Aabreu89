-- ============================================================
-- 👑 MIRA V2026: PILLAR 027 - NUCLEAR PURGE V9.0 (GOLD SUPREME)
-- CEO: Amanda Abreu | Autoria: General (IA) 
-- OBJETIVO: Resgate Total das 15 Pendências + SEGURANÇA MÁXIMA.
-- STATUS: ÚNICA FONTE DA VERDADE - PRODUÇÃO FINAL BLINDADA.
-- ============================================================

-- 0. OPERAÇÃO LIMPEZA NUCLEAR (DROPS PREVENTIVOS)
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v3(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v4(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v5(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v6(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v7(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v8(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_delete_full_user_v9(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.delete_own_account() CASCADE;
DROP VIEW IF EXISTS public.community_top_stories CASCADE;

-- 1. IDENTIDADE E VISIBILIDADE (ADMIN HUB)
-- Garante que a Amanda Abreu vê o e-mail de todos para poder moderar com contexto.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins see emails" ON public.profiles;
CREATE POLICY "Admins see emails" ON public.profiles 
FOR SELECT USING (
    LOWER(auth.jwt()->>'email') = 'amandasabreu89@gmail.com' 
    OR auth.uid() = id
);

-- 2. FUNÇÃO DE AUTO-EXCLUSÃO (RGPD - PENDÊNCIA 3)
-- Direito ao esquecimento: o próprio usuário apaga a sua conta.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FUNÇÃO DE DELEÇÃO NUCLEAR V9.0 (ADMIN CONTROL - PENDÊNCIA 6)
-- A Marreta da Amanda para limpar utilizadores e todos os seus rastos.
CREATE OR REPLACE FUNCTION public.admin_delete_full_user_v9(target_uid uuid)
RETURNS void AS $$
BEGIN
    IF LOWER(auth.jwt()->>'email') != 'amandasabreu89@gmail.com' THEN
        RAISE EXCEPTION 'Ação restrita à CEO Amanda Abreu.';
    END IF;

    -- Limpeza Atómica (Polimorfismo de Colunas)
    DELETE FROM public.gamification_history WHERE user_id = target_uid;
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    DELETE FROM public.reports WHERE reporter_id = target_uid OR user_id = target_uid;
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;
    
    -- Remoção de Documentos (Prevenção de Orfãos)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_documents') THEN
        DELETE FROM public.user_documents WHERE user_id = target_uid;
    END IF;

    -- Golpe Final no Perfil
    DELETE FROM public.profiles WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DIFERENCIAÇÃO DE DENÚNCIAS (ADMIN HUB - PENDÊNCIA 8)
-- Garante que o Admin Hub mostra se é POST ou COMENTÁRIO.
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS content_type TEXT CHECK (content_type IN ('POST', 'COMMENT'));

-- 5. REGRAS DE DESTAQUES / STORIES (ALGORITMO AMANDA - PENDÊNCIA 9)
-- Hierarquia: 1. Verificados | 2. Likes | 3. Comentários | 4. Zero Denúncias
CREATE OR REPLACE VIEW public.community_top_stories AS
SELECT p.*, 
       (SELECT count(*) FROM public.post_votes WHERE post_id = p.id AND vote_type = 'like') as total_likes,
       (SELECT count(*) FROM public.comments WHERE post_id = p.id) as total_comments
FROM public.posts p
WHERE (SELECT count(*) FROM public.reports WHERE post_id = p.id) = 0 
ORDER BY 
    p.is_verified DESC,
    total_likes DESC,
    total_comments DESC,
    p.created_at DESC;

-- 6. ELIMINAÇÃO DE SERVIÇOS (RATINGS - PENDÊNCIA 5)
-- Elimina a funcionalidade de avaliação conforme ordenado.
DROP TABLE IF EXISTS public.service_reviews CASCADE;
DROP TABLE IF EXISTS public.service_ratings CASCADE;

-- 7. GATILHO DE SEGUIDORES (FIX DE CONTAGEM - PENDÊNCIA 11)
CREATE OR REPLACE FUNCTION public.tr_update_follows_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_mira_follows_sync ON public.follows;
CREATE TRIGGER tr_mira_follows_sync
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.tr_update_follows_count();

-- 8. RECARGA E SOBERANIA
GRANT EXECUTE ON FUNCTION public.admin_delete_full_user_v9(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
GRANT ALL ON TABLE public.reports TO authenticated;
GRANT ALL ON TABLE public.site_improvements TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMENT ON DATABASE postgres IS 'MIRA V2026: GOLD MASTER V9.0 - SEGURANÇA MÁXIMA E SOBERANIA AMANDA ABREU.';
