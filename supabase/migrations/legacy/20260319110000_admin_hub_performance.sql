-- ============================================================
-- 🛡️ MIRA ADMIN HUB: PERFORMANCE & RELIABILITY UPGRADE (V2026.ADMIN)
-- ============================================================

-- 1. SINGLE CALL FOR DASHBOARD STATS (Eliminates 6 Round-trips)
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats_v2()
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Security Check (Consistent with V26.5)
    IF auth.jwt() ->> 'email' NOT IN ('amandasabreu89@gmail.com', 'mira-admin@mira.com', 'admin@mira.pt') AND 
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

-- 2. ROBUST MODERATION FETCH (Eliminates N+1 Logic in JS)
-- Fetches reports with joined titles, contents, and author names
CREATE OR REPLACE FUNCTION public.admin_get_moderation_data_v2()
RETURNS TABLE (
    report_id uuid,
    type text,
    status text,
    reason text,
    created_at timestamptz,
    reporter_name text,
    content_title text,
    content_text text,
    content_author_id uuid,
    target_id uuid
)
SECURITY DEFINER
AS $$
BEGIN
    IF auth.jwt() ->> 'email' != 'amandasabreu89@gmail.com' AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    RETURN QUERY
    SELECT 
        r.id AS report_id,
        CASE WHEN r.comment_id IS NOT NULL THEN 'comment' ELSE 'post' END AS type,
        r.status,
        r.reason,
        r.created_at,
        p_reporter.name AS reporter_name,
        COALESCE(posts.title, 'Comentário em ' || parent_posts.title) AS content_title,
        COALESCE(posts.content, comments.content) AS content_text,
        COALESCE(posts.author_id, comments.author_id) AS content_author_id,
        COALESCE(r.post_id, r.comment_id) AS target_id
    FROM public.community_reports r
    LEFT JOIN public.profiles p_reporter ON r.user_id = p_reporter.id
    LEFT JOIN public.posts ON r.post_id = posts.id
    LEFT JOIN public.comments ON r.comment_id = comments.id
    LEFT JOIN public.posts parent_posts ON comments.post_id = parent_posts.id
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. ENSURE REPUTATION RPC EXISTS (Used by Admin Hub)
CREATE OR REPLACE FUNCTION public.increment_reputation(target_user_id uuid, amount int)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET reputation = COALESCE(reputation, 0) + amount
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_moderation_data_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_reputation(uuid, int) TO authenticated;

-- Success indicator
DO $$ BEGIN RAISE NOTICE 'Admin Hub Performance Upgrade applied!'; END $$;
