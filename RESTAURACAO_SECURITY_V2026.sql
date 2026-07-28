-- 🛡️ MIRA SECURITY & FOLLOW FIX V2026.GOLD
-- OBJETIVO: Corrigir falha de e-mail e unificar sistema de seguidores

BEGIN;

-- 1. Unificar tabelas de seguidores (Atomic Write)
-- Se 'community_followers' existir, movemos para 'follows'
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_followers') THEN
        INSERT INTO public.follows (follower_id, following_id, created_at)
        SELECT follower_id, followed_id, created_at FROM public.community_followers
        ON CONFLICT DO NOTHING;
        
        DROP TABLE public.community_followers CASCADE;
    END IF;
END $$;

-- 2. Garantir que 'follows' existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- 3. Trigger de Sincronização de Contadores (Auto-Repair)
CREATE OR REPLACE FUNCTION public.handle_follow_stats_v2026()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_change_v2026 ON public.follows;
CREATE TRIGGER on_follow_change_v2026
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats_v2026();

-- 4. FIX DE SEGURANÇA: Privacidade de E-mail
-- Revogar acesso direto à coluna email para utilizadores comuns via RLS não é possível,
-- então vamos usar uma política que restringe a visibilidade total da linha se o e-mail for solicitado? Não.
-- A melhor forma é garantir que o RPC de busca não vaze e-mail.

CREATE OR REPLACE FUNCTION public.search_profiles_unaccent(
    search_term TEXT,
    page_size INT DEFAULT 20,
    page_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    reputation INT,
    trust_level TEXT,
    role TEXT,
    is_muted BOOLEAN,
    is_blocked BOOLEAN,
    is_verified BOOLEAN,
    sovereignty_score INT,
    total_count BIGINT
) AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    -- Verificar se o chamador é admin
    v_is_admin := (SELECT p.role = 'admin' FROM public.profiles p WHERE p.id = auth.uid());

    RETURN QUERY
    SELECT 
        p.id, 
        p.name as full_name, 
        p.name as username, -- Fallback
        CASE WHEN v_is_admin OR p.id = auth.uid() THEN p.email ELSE NULL END as email, 
        p.avatar_url, 
        p.reputation, 
        p.trust_level, 
        p.role, 
        p.is_muted, 
        p.is_blocked, 
        p.is_verified, 
        p.reputation as sovereignty_score, -- Alias
        COUNT(*) OVER() as total_count
    FROM public.profiles p
    WHERE 
        p.name ILIKE '%' || search_term || '%' OR 
        (v_is_admin AND p.email ILIKE '%' || search_term || '%')
    ORDER BY p.id DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recalibração de Contadores
UPDATE public.profiles p
SET 
  followers_count = (SELECT count(*) FROM public.follows WHERE following_id = p.id),
  following_count = (SELECT count(*) FROM public.follows WHERE follower_id = p.id);

COMMIT;
