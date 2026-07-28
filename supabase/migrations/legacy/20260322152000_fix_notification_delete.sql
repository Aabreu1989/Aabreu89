-- MIRA V2026: Fix for Notification Deletion via RLS
-- Step 1: Ensure Policy exists for users to delete their own notifications
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'Users can delete their own notifications'
    ) THEN
        CREATE POLICY "Users can delete their own notifications" ON "public"."notifications"
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Step 2: Ensure table permissions are set
GRANT DELETE ON TABLE notifications TO authenticated;
GRANT DELETE ON TABLE notifications TO service_role;

-- Step 3: Verification log entry
INSERT INTO migration_logs (migration_name, applied_at) 
VALUES ('20260322152000_fix_notification_delete', now())
ON CONFLICT (migration_name) DO UPDATE SET applied_at = now();
