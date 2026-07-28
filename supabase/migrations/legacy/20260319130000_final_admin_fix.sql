-- ============================================================
-- ☢️ MIRA V2026.FINAL: NUCLEAR FIX FOR ADMIN HUB & KNOWLEDGE
-- ============================================================

-- 1. FIX DASHBOARD STATS (Ensuring absolute count accuracy)
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats_v2()
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Security Check (Case Insensitive Email & Admin Role)
    IF LOWER(auth.jwt() ->> 'email') NOT IN ('amandasabreu89@gmail.com', 'mira-admin@mira.com', 'admin@mira.pt') AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    SELECT json_build_object(
        'jobCount', (SELECT count(*) FROM public.job_posts),
        'courseCount', (SELECT count(*) FROM public.courses),
        'serviceCount', (SELECT count(*) FROM public.map_alerts),
        'userCount', (SELECT count(*) FROM public.profiles),
        'reportCount', (SELECT count(*) FROM public.community_reports WHERE status = 'pending'),
        'ratingCount', (SELECT count(*) FROM public.service_ratings),
        'lastSync', now()
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. FIX USER FETCH (Bypassing potential JWT email issues)
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
        p.id, 
        p.name, 
        p.email, 
        p.avatar_url, 
        COALESCE(p.reputation, 0), 
        p.trust_level, 
        p.role, 
        p.is_muted, 
        p.is_blocked, 
        p.created_at,
        COALESCE(p.followers_count, 0),
        COALESCE(p.following_count, 0)
    FROM public.profiles p
    ORDER BY p.created_at DESC
    LIMIT 2000; -- Increased limit for launch
END;
$$ LANGUAGE plpgsql;

-- 3. ENSURE SERVICE RATINGS TABLE IS USED (And mapped to reviews if needed)
-- If service_reviews exists, we might want to copy data, but for now we ensure service_ratings is the primary.
-- This script assumes the table exists as it was used in previous migrations.

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_robust() TO authenticated;

-- 5. KNOWLEDGE BASE SEARCH IMPROVEMENT (For Saber IA)
CREATE OR REPLACE FUNCTION public.search_knowledge(query_embedding vector(768), match_threshold float, match_count int)
RETURNS TABLE (
  id uuid,
  topic text,
  information text,
  category text,
  url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.topic,
    kb.information,
    kb.category,
    kb.url,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_knowledge(vector, float, int) TO anon, authenticated;
