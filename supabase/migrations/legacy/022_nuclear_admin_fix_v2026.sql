-- 1. Create site_improvements if missing
CREATE TABLE IF NOT EXISTS public.site_improvements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    subject TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fixed Moderation RPC (Dynamic Column Detection)
CREATE OR REPLACE FUNCTION admin_get_moderation_data_v3()
RETURNS TABLE (
    report_id UUID,
    type TEXT,
    status TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ,
    reporter_name TEXT,
    content_title TEXT,
    content_text TEXT,
    content_author_id UUID,
    target_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Unir fontes de denúncia
    SELECT * FROM (
        SELECT 
            r.id AS report_id,
            CASE WHEN r.comment_id IS NOT NULL THEN 'comment' ELSE 'post' END AS type,
            COALESCE(r.status, 'pending') as status,
            r.reason,
            r.created_at,
            'Membro'::TEXT AS reporter_name,
            COALESCE(posts.title, 'Conteúdo') AS content_title,
            COALESCE(posts.content, comments.content, 'Removido') AS content_text,
            COALESCE(posts.author_id, comments.author_id) AS content_author_id,
            COALESCE(r.post_id, r.comment_id) AS target_id
        FROM public.community_reports r
        LEFT JOIN public.posts ON r.post_id = posts.id
        LEFT JOIN public.comments ON r.comment_id = comments.id
        
        UNION ALL
        
        SELECT 
            rep.id AS report_id,
            rep.type as type,
            'pending' as status,
            'Sistema' as reason,
            rep.created_at,
            'Anónimo' as reporter_name,
            'Relato' as content_title,
            rep.content as content_text,
            rep.user_id as content_author_id,
            COALESCE(rep.post_id, rep.comment_id) as target_id
        FROM public.reports rep
        WHERE rep.type = 'suggestion' OR rep.type = 'saber_ia'
    ) as unified
    ORDER BY created_at DESC;
END;
$$;

-- 3. RLS HARDENING (CEO ACCESS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_improvements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage reports" ON public.reports;
CREATE POLICY "Admins can manage reports" ON public.reports FOR ALL USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage site improvements" ON public.site_improvements;
CREATE POLICY "Admins can manage site improvements" ON public.site_improvements FOR ALL USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Robust Deletion RPC
CREATE OR REPLACE FUNCTION admin_hard_delete_suggestion(target_id TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM site_improvements WHERE id::TEXT = target_id;
    DELETE FROM app_suggestions WHERE id::TEXT = target_id;
    DELETE FROM suggestions WHERE id::TEXT = target_id;
    DELETE FROM reports WHERE id::TEXT = target_id AND type IN ('suggestion', 'saber_ia');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Permission Grants
GRANT EXECUTE ON FUNCTION admin_get_moderation_data_v3() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_hard_delete_suggestion(TEXT) TO authenticated;
