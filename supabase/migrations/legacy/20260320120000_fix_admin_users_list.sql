-- ============================================================
-- ☢️ MIRA V2026.ULTRA_FIX: ADMIN HUB USER LIST RECOVERY
-- ============================================================

-- 1. ADD MISSING CREATED_AT TO PROFILES (If missing)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. BACKFILL CREATED_AT FROM AUTH.USERS
UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id AND (p.created_at IS NULL OR p.created_at = now());

-- 3. RECONSTRUCT THE RPC WITH ABSOLUTE DISAMBIGUATION
CREATE OR REPLACE FUNCTION public.admin_get_all_users_robust()
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    avatar_url text,
    reputation integer,
    trust_level text,
    role text,
    is_muted boolean,
    is_blocked boolean,
    created_at timestamptz,
    followers_count integer,
    following_count integer
)
SECURITY DEFINER
AS $$
BEGIN
    -- Security Barrier: Improved email check
    IF LOWER(auth.jwt() ->> 'email') NOT IN ('amandasabreu89@gmail.com', 'mira-admin@mira.com', 'admin@mira.pt') AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado ao Banco de Dados MIRA.';
    END IF;

    RETURN QUERY
    SELECT 
        prof.id, 
        prof.name, 
        prof.email, 
        prof.avatar_url, 
        COALESCE(prof.reputation, 0), 
        prof.trust_level, 
        prof.role, 
        prof.is_muted, 
        prof.is_blocked, 
        prof.created_at,
        COALESCE(prof.followers_count, 0),
        COALESCE(prof.following_count, 0)
    FROM public.profiles prof
    ORDER BY prof.created_at DESC
    LIMIT 2000;
END;
$$ LANGUAGE plpgsql;

-- 4. RE-GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_robust() TO authenticated;
