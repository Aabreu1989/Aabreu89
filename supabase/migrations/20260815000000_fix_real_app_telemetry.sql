CREATE OR REPLACE FUNCTION public.mira_track_event(
    p_action text,
    p_user_id uuid DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'MIRA telemetry requires authenticated user';
    END IF;

    INSERT INTO public.activity_logs (
        user_id,
        action,
        category,
        metadata
    )
    VALUES (
        auth.uid(),
        p_action,
        p_category,
        COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.mira_track_event(text, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mira_track_event(text, uuid, text, jsonb) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created_at
ON public.activity_logs (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_action_created_at
ON public.activity_logs (user_id, action, created_at DESC);
