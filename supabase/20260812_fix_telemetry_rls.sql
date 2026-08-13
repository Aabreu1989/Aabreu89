-- ============================================================
-- MIRA TELEMETRIA SOBERANA — SQL CORRIGIDO
-- Correr no Supabase → SQL Editor → New Query
-- Correr em 3 passos separados se necessário
-- ============================================================

-- ══════════════════════════════════════════
-- PASSO 1: POLÍTICAS RLS (correr primeiro)
-- ══════════════════════════════════════════

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mira_telemetry_insert_all" ON public.activity_logs;
DROP POLICY IF EXISTS "mira_admin_read_all" ON public.activity_logs;
DROP POLICY IF EXISTS "mira_telemetry_select_own" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.activity_logs;

CREATE POLICY "mira_telemetry_insert_all"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "mira_admin_read_all"
ON public.activity_logs
FOR SELECT
USING (auth.uid() IS NOT NULL);


-- ══════════════════════════════════════════
-- PASSO 2: FUNÇÃO RPC (correr separado)
-- ══════════════════════════════════════════

DROP FUNCTION IF EXISTS public.mira_track_event(text, text, text, jsonb);

CREATE FUNCTION public.mira_track_event(
    p_action text,
    p_user_id text,
    p_category text,
    p_metadata jsonb
) RETURNS void AS $$
DECLARE
    v_uuid uuid;
BEGIN
    BEGIN
        IF p_user_id IS NOT NULL AND length(p_user_id) = 36 THEN
            v_uuid := p_user_id::uuid;
        END IF;
    EXCEPTION WHEN others THEN
        v_uuid := NULL;
    END;

    INSERT INTO public.activity_logs (action, user_id, metadata)
    VALUES (
        p_action,
        v_uuid,
        jsonb_build_object(
            'category', p_category,
            'extra', p_metadata,
            'ts', extract(epoch from now())
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.mira_track_event(text, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.mira_track_event(text, text, text, jsonb) TO authenticated;


-- ══════════════════════════════════════════
-- PASSO 3: VERIFICAÇÃO (correr no fim)
-- ══════════════════════════════════════════

SELECT 'OK' AS funcao_criada, proname, prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'mira_track_event'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

SELECT policyname, cmd AS tipo, qual AS condicao
FROM pg_policies
WHERE tablename = 'activity_logs';
