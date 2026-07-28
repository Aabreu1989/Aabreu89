-- MIRA V2026.SUPREME: Admin Moderation Engine V3
-- Purpose: Unified visibility for reports and high-performance administrative deletion

-- 1. Unified Moderation RPC V3
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
    -- Post Reports
    SELECT 
        cr.id as report_id,
        'post'::TEXT as type,
        cr.status,
        cr.reason,
        cr.created_at,
        p.name as reporter_name,
        COALESCE(posts.title, 'Post sem título') as content_title,
        COALESCE(posts.content, '[Conteúdo Removido]') as content_text,
        posts.author_id as content_author_id,
        posts.id as target_id
    FROM community_reports cr
    JOIN profiles p ON cr.profiles_id = p.id
    LEFT JOIN posts ON cr.post_id = posts.id
    WHERE cr.post_id IS NOT NULL AND cr.status = 'pending'
    
    UNION ALL
    
    -- Comment Reports
    SELECT 
        cr.id as report_id,
        'comment'::TEXT as type,
        cr.status,
        cr.reason,
        cr.created_at,
        p.name as reporter_name,
        'Comentário em Post'::TEXT as content_title,
        COALESCE(c.content, '[Comentário Removido]') as content_text,
        c.author_id as content_author_id,
        c.id as target_id
    FROM community_reports cr
    JOIN profiles p ON cr.profiles_id = p.id
    LEFT JOIN comments c ON cr.comment_id = c.id
    WHERE cr.comment_id IS NOT NULL AND cr.status = 'pending';
END;
$$;

-- 2. Legacy Alias for V2 Compatibility
CREATE OR REPLACE FUNCTION admin_get_moderation_data_v2()
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
    RETURN QUERY SELECT * FROM admin_get_moderation_data_v3();
END;
$$;

-- 3. Fix site_improvements Deletion & RLS
-- Allow admins to delete site improvements
DROP POLICY IF EXISTS "Admins can delete site improvements" ON site_improvements;
CREATE POLICY "Admins can delete site improvements" 
ON site_improvements FOR DELETE 
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Ensure site_improvements table has the correct policy for admins to view
DROP POLICY IF EXISTS "Admins can view all site improvements" ON site_improvements;
CREATE POLICY "Admins can view all site improvements" 
ON site_improvements FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- 3. Robust Deletion Helper (Optional but recommended for Admin Hub)
CREATE OR REPLACE FUNCTION admin_hard_delete_suggestion(target_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sweep across all potential suggestion tables
    DELETE FROM site_improvements WHERE id::TEXT = target_id;
    DELETE FROM app_suggestions WHERE id::TEXT = target_id;
    DELETE FROM suggestions WHERE id::TEXT = target_id;
    DELETE FROM reports WHERE id::TEXT = target_id AND type = 'suggestion';
EXCEPTION WHEN OTHERS THEN
    -- Fallback for numeric IDs if cast fails
    DELETE FROM site_improvements WHERE id::TEXT = target_id;
END;
$$;

-- 4. Grant access to authenticated admins
GRANT EXECUTE ON FUNCTION admin_get_moderation_data_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION admin_hard_delete_suggestion TO authenticated;
