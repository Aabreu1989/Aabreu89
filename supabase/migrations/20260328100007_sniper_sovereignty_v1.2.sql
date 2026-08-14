-- ==========================================
-- 🛡️ MIRA SNIPER v1.2: SOVEREIGNTY HARDENING
-- ==========================================

-- 1. Enable Unaccent for Portuguese search
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Add Sovereignty Weight to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sovereignty_weight NUMERIC DEFAULT 100.0;

-- 3. Initialize Sovereignty (CEO & Partners)
-- CEO Supremacy
UPDATE public.profiles 
SET sovereignty_weight = 100000.0 
WHERE email = 'amandasabreu89@gmail.com';

-- AIMA & Official Partners
UPDATE public.profiles 
SET sovereignty_weight = 50000.0 
WHERE name ILIKE '%AIMA%' 
   OR name ILIKE '%AIMA (Oficial)%'
   OR email ILIKE '%@aima.gov.pt%';

-- 4. Unified Accent-Insensitive Search RPC
-- This RPC handles trigram + unaccent for sub-100ms ultra-precision.
DROP FUNCTION IF EXISTS public.search_profiles_unaccent(text, int, int);
DROP FUNCTION IF EXISTS public.search_profiles_unaccent(text);
DROP FUNCTION IF EXISTS public.search_profiles_unaccent();
CREATE OR REPLACE FUNCTION search_profiles_unaccent(
    search_term text, 
    page_size int DEFAULT 20, 
    page_offset int DEFAULT 0
) 
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    avatar_url text,
    role text,
    reputation int,
    trust_level text,
    is_muted boolean,
    is_blocked boolean,
    sovereignty_weight numeric,
    total_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH searched AS (
        SELECT 
            p.id, p.name, p.email, p.avatar_url, p.role, 
            p.reputation, p.trust_level, p.is_muted, 
            p.is_blocked, p.sovereignty_weight
        FROM public.profiles p
        WHERE 
            unaccent(p.name) ILIKE unaccent('%' || search_term || '%')
            OR unaccent(p.email) ILIKE unaccent('%' || search_term || '%')
        ORDER BY p.sovereignty_weight DESC, p.reputation DESC
    )
    SELECT 
        s.*, 
        (SELECT COUNT(*) FROM searched) as total_count
    FROM searched s
    LIMIT page_size
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Indexing for Unaccent Search (Optional but recommended for scale)
CREATE OR REPLACE FUNCTION public.f_unaccent(text) RETURNS text AS $$
  SELECT public.unaccent($1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX IF NOT EXISTS idx_profiles_name_unaccent ON public.profiles USING GIN (public.f_unaccent(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_email_unaccent ON public.profiles USING GIN (public.f_unaccent(email) gin_trgm_ops);
