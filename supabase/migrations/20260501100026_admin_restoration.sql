-- 👑 MIRA SOBERANIA V2026.GOLD - DATABASE RESTORATION
-- OBJECTIVE: Restore real-time metrics and missing tables for Admin Hub.

-- 0. Recreate courses table with TEXT ID to match codebase (mx-1, dg-1)
DROP TABLE IF EXISTS public.courses CASCADE;
CREATE TABLE public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    duration TEXT,
    image_url TEXT,
    link TEXT,
    is_iefp_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.courses TO anon, authenticated;

-- 1. Create user_documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Policies for user_documents
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Users can view their own documents') THEN
        CREATE POLICY "Users can view their own documents" ON public.user_documents FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_documents' AND policyname = 'Admins can view all documents') THEN
        CREATE POLICY "Admins can view all documents" ON public.user_documents FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- 2. Ensure activity_logs has necessary indices for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 3. Create or Update the admin_dashboard_stats VIEW
-- This view aggregates metrics from across the system.
-- Handle case where it might exist as a table (from previous versions)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_dashboard_stats' AND table_type = 'BASE TABLE') THEN
        DROP TABLE public.admin_dashboard_stats CASCADE;
    END IF;
    DROP VIEW IF EXISTS public.admin_dashboard_stats CASCADE;
END $$;
CREATE VIEW public.admin_dashboard_stats AS
SELECT
    (SELECT count(*) FROM public.profiles) as total_users,
    (SELECT count(*) FROM public.posts) as total_posts,
    (SELECT count(*) FROM public.comments) as total_comments,
    (SELECT count(*) FROM public.job_posts) as total_jobs,
    (SELECT count(*) FROM public.user_documents) as total_downloads,
    (SELECT count(*) FROM public.courses) as total_courses,
    (SELECT COALESCE(sum(likes), 0) FROM public.posts) as total_likes,
    (SELECT count(*) FROM public.posts WHERE is_verified = true) as verified_posts,
    (SELECT count(*) FROM public.posts WHERE validation_status = 'fraud') as fake_posts,
    (SELECT count(*) FROM public.activity_logs WHERE action IN ('app_launch', 'view_changed')) as app_accesses,
    (SELECT count(*) FROM public.activity_logs WHERE action = 'read_article' OR (action = 'home_module_click' AND metadata->>'moduleId' = 'learning')) as article_reads;

-- 4. RPC for real-time interaction sums (Sovereignty Support)
CREATE OR REPLACE FUNCTION public.get_admin_metrics_v2026()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'users', (SELECT count(*) FROM public.profiles),
        'posts', (SELECT count(*) FROM public.posts),
        'comments', (SELECT count(*) FROM public.comments),
        'jobs', (SELECT count(*) FROM public.job_posts),
        'courses', (SELECT count(*) FROM public.courses),
        'downloads', (SELECT count(*) FROM public.user_documents),
        'likes', (SELECT COALESCE(sum(likes), 0) FROM public.posts),
        'verified', (SELECT count(*) FROM public.posts WHERE is_verified = true),
        'fake', (SELECT count(*) FROM public.posts WHERE validation_status = 'fraud'),
        'accesses', (SELECT count(*) FROM public.activity_logs WHERE action IN ('app_launch', 'view_changed')),
        'articles', (SELECT count(*) FROM public.activity_logs WHERE action = 'read_article' OR (action = 'home_module_click' AND metadata->>'moduleId' = 'learning'))
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant permissions to anon and authenticated
GRANT SELECT ON public.admin_dashboard_stats TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics_v2026() TO anon, authenticated;
