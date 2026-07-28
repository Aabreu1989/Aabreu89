-- MIRA V1000.0: NUCLEAR USER DELETION
-- Function to delete a user and all their associated data across all tables.
-- Requires service role for auth deletion if possible, or handles public data.

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Profiles & Metadata
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- 2. Community Content
    DELETE FROM public.posts WHERE author_id = target_user_id;
    DELETE FROM public.comments WHERE author_id = target_user_id;
    DELETE FROM public.saved_posts WHERE user_id = target_user_id;
    DELETE FROM public.user_votes WHERE user_id = target_user_id;
    
    -- 3. App Interactions
    DELETE FROM public.course_progress WHERE user_id = target_user_id;
    DELETE FROM public.activity_logs WHERE user_id = target_user_id;
    DELETE FROM public.reports WHERE user_id = target_user_id;
    DELETE FROM public.suggestions WHERE user_id = target_user_id;
    
    -- Note: auth.users deletion is best handled by the admin client 
    -- but for most Supabase setups, deleting from public.profiles with 
    -- a trigger or manual admin-api call is safer.
    -- This function cleans ALL traces in the public schema.
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
