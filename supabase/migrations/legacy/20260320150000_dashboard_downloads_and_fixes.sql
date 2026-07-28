
-- ============================================================
-- 🛡️ MIRA: DASHBOARD DOWNLOADS & SECURITY PATCH (V2026.ELITE)
-- ============================================================

-- 1. Create Downloads table if missing
CREATE TABLE IF NOT EXISTS public.user_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    form_data jsonb,
    file_url text,
    is_draft boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Create Service Ratings table if missing
CREATE TABLE IF NOT EXISTS public.service_ratings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    stars int CHECK (stars >= 1 AND stars <= 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_ratings ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Downloads
DROP POLICY IF EXISTS "Anyone can insert downloads" ON public.user_documents;
CREATE POLICY "Anyone can insert downloads" ON public.user_documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view downloads" ON public.user_documents;
CREATE POLICY "Admins can view downloads" ON public.user_documents FOR SELECT USING (
    auth.jwt() ->> 'email' IN ('amandasabreu89@gmail.com', 'mira-admin@mira.com', 'admin@mira.pt') OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Policies for Service Ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.service_ratings;
CREATE POLICY "Anyone can view ratings" ON public.service_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Logged in users can rate" ON public.service_ratings;
CREATE POLICY "Logged in users can rate" ON public.service_ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Update Dashboard Stats RPC to include Downloads
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats_v2()
RETURNS json
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Security Check
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
        'downloadCount', (SELECT count(*) FROM public.user_documents),
        'lastSync', now()
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant Permissions
GRANT ALL ON public.user_documents TO authenticated;
GRANT ALL ON public.user_documents TO anon;
GRANT ALL ON public.service_ratings TO authenticated;
GRANT SELECT ON public.service_ratings TO anon;

-- Success indicator
DO $$ BEGIN RAISE NOTICE 'MIRA V2026: Dashboard & Security Patch Applied!'; END $$;
