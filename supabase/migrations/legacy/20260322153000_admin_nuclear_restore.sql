-- MIRA V2026: NUCLEAR ADMIN RESTORATION
-- This script restores all RPCs and permissions required for the Admin Hub

-- 0. Cleanup existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS admin_get_dashboard_stats_v2();
DROP FUNCTION IF EXISTS admin_get_all_users_robust();

-- 1. Dashboard Stats RPC (V2)
CREATE OR REPLACE FUNCTION admin_get_dashboard_stats_v2()
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'user_count', (SELECT count(*) FROM profiles),
        'job_count', (SELECT count(*) FROM job_posts),
        'course_count', (SELECT count(*) FROM courses),
        'service_count', (SELECT count(*) FROM map_alerts),
        'report_count', (SELECT count(*) FROM community_reports WHERE status = 'pending'),
        'rating_count', (SELECT count(*) FROM service_ratings),
        'download_count', 0
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Robust User Fetch RPC
CREATE OR REPLACE FUNCTION admin_get_all_users_robust()
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
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.email,
        p.avatar_url,
        p.reputation,
        p.trust_level,
        p.role,
        p.is_muted,
        p.is_blocked,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Row Level Security Restoration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;
CREATE POLICY "Admins can see all profiles" ON public.profiles 
FOR SELECT USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Essential Permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_dashboard_stats_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_users_robust() TO authenticated;

-- 7. Verification
INSERT INTO migration_logs (migration_name, applied_at) 
VALUES ('20260322153000_admin_nuclear_restore', now())
ON CONFLICT (migration_name) DO UPDATE SET applied_at = now();
