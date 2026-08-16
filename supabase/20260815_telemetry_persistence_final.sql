-- ============================================================
-- MIRA TELEMETRIA — PERSISTÊNCIA DEFINITIVA V2026
-- ============================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mira_telemetry_insert_all" ON public.activity_logs;
DROP POLICY IF EXISTS "mira_admin_read_all" ON public.activity_logs;
DROP POLICY IF EXISTS "mira_telemetry_select_own" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.activity_logs;

CREATE POLICY "mira_telemetry_insert_all"
ON public.activity_logs
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "mira_admin_read_all"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Índice composto para as métricas temporais do dashboard.
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_created
ON public.activity_logs (action, created_at);

-- ============================================================
-- RPC ÚNICA DE TELEMETRIA
-- ============================================================

DROP FUNCTION IF EXISTS public.mira_track_event(text, text, text, jsonb);

CREATE OR REPLACE FUNCTION public.mira_track_event(
    p_action text,
    p_user_id text,
    p_category text,
    p_metadata jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := NULL;
    v_metadata jsonb := '{}'::jsonb;
BEGIN

    -- Converter user_id apenas quando for UUID válido.
    IF p_user_id IS NOT NULL
       AND p_user_id <> ''
       AND p_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN
        v_user_id := p_user_id::uuid;
    END IF;

    -- Metadata único e consistente.
    v_metadata :=
        COALESCE(p_metadata, '{}'::jsonb)
        || jsonb_build_object(
            'category', p_category
        );

    -- Guest fica identificado no metadata, nunca em user_id.
    IF p_user_id IS NOT NULL
       AND v_user_id IS NULL
    THEN
        v_metadata :=
            v_metadata
            || jsonb_build_object('guest_id', p_user_id);
    END IF;

    INSERT INTO public.activity_logs (
        user_id,
        action,
        metadata,
        created_at
    )
    VALUES (
        v_user_id,
        p_action,
        v_metadata,
        now()
    );

END;
$$;

GRANT EXECUTE
ON FUNCTION public.mira_track_event(text, text, text, jsonb)
TO anon, authenticated;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

SELECT
    'RPC_OK' AS status,
    proname,
    prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'mira_track_event'
  AND pronamespace = (
      SELECT oid
      FROM pg_namespace
      WHERE nspname = 'public'
  );

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'activity_logs'
ORDER BY indexname;
