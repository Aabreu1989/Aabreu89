-- 🏰 MIRA V2026: SCRIPT DE SOBERANIA TÉCNICA v2.3-NOBEL
-- 🛡️ PROTOCOLO: LOCKDOWN PRODUTIVO (AMANDA ABREU)
-- 🛡️ INSTRUÇÕES: COPIAR E EXECUTAR NO 'SQL EDITOR' DO SUPABASE

-- 1. EXTENSÕES E INFRAESTRUTURA DE BASE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADIÇÃO DE COLUNAS DE PERSISTÊNCIA (JSONB + GAMIFICAÇÃO)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 3. TABELA DE FOLLOWS (SOBERANIA SOCIAL)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(follower_id, following_id)
);

-- 4. TRIGGERS DE CONTAGEM ATÓMICA (HARDENING)
-- Garante que os contadores nunca fiquem dessincronizados, independente do front-end.
CREATE OR REPLACE FUNCTION public.update_profile_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_update ON public.user_follows;
CREATE TRIGGER on_follow_update
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.update_profile_follow_counts();

-- 5. VIEW NOBEL (ALGORITMO DE RANKING SOBERANO)
-- Pesos: Verificados (5000), Likes (10), Comentários (20), Denúncias (-1000)
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
SELECT 
    p.*,
    (CASE WHEN pr.is_verified THEN 5000 ELSE 0 END) + 
    (COALESCE(p.likes, 0) * 10) + 
    (COALESCE((SELECT count(*) FROM public.comments c WHERE c.posts_id = p.id), 0) * 20) - 
    (COALESCE(p.reports, 0) * 1000) as ranking_score
FROM public.posts p
JOIN public.profiles pr ON p.author_id = pr.id
ORDER BY ranking_score DESC;

-- 6. RPC NUCLEAR RGPD v2026 (PURGA ATÓMICA)
CREATE OR REPLACE FUNCTION public.admin_delete_full_user_v2026(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 🛡️ PROTOCOLO SOBERANO: Purga em cascata manual para garantir bypass de RLS se necessário
    DELETE FROM public.user_follows WHERE follower_id = target_user_id OR following_id = target_user_id;
    DELETE FROM public.posts WHERE author_id = target_user_id;
    DELETE FROM public.comments WHERE author_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;
    -- Nota: A eliminação de auth.users deve ser feita via Admin API do Supabase ou Service Role.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🏰 PROTOCOLO v2.3 CONCLUÍDO. SISTEMA PRONTO PARA LOCKDOWN.
