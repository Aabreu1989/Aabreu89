-- ============================================================================
-- MIRA V2026.GOLD -- Migration Atomica Job Alerts Option 2
-- Versao: V5.3.11
-- Data: 2026-11-07
-- Ambito: job_backfill_queue, job_backfill_batch_manifest, RPCs, ACL
-- Idempotente: sim (IF NOT EXISTS, OR REPLACE, DROP IF EXISTS)
-- NOTA: ingested_at = created_at nas vagas legadas e uma aproximacao
--       historica, nao uma prova da data real de ingestao.
-- ============================================================================


\echo '--- 1. Executando Detecção de Extensões ---'
DO $$
DECLARE
    v_ext_schema TEXT;
BEGIN
    SELECT n.nspname INTO v_ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'unaccent';

    IF v_ext_schema IS NULL THEN
        CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;
    END IF;
END $$;

\echo '--- 2. Evolução de Schema em job_posts e user_job_alerts ---'
ALTER TABLE public.job_posts 
    ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ingested_at_source TEXT;

UPDATE public.job_posts
SET ingested_at = COALESCE(created_at, now()),
    ingested_at_source = 'legacy_ingestion'
WHERE ingested_at IS NULL;

ALTER TABLE public.job_posts 
    ALTER COLUMN ingested_at SET DEFAULT now(),
    ALTER COLUMN ingested_at SET NOT NULL,
    ALTER COLUMN ingested_at_source SET DEFAULT 'unverified',
    ALTER COLUMN ingested_at_source SET NOT NULL;

ALTER TABLE public.user_job_alerts
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_job_alerts_active_non_deleted 
    ON public.user_job_alerts(user_id, is_active) 
    WHERE deleted_at IS NULL;

\echo '--- 3. Trigger de Proteção de Proveniência Temporal em job_posts ---'
CREATE OR REPLACE FUNCTION public.trg_protect_job_posts_ingestion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.ingested_at := OLD.ingested_at;
    NEW.ingested_at_source := OLD.ingested_at_source;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_job_posts_ingestion ON public.job_posts;
CREATE TRIGGER trg_protect_job_posts_ingestion
BEFORE UPDATE ON public.job_posts
FOR EACH ROW
EXECUTE FUNCTION public.trg_protect_job_posts_ingestion();

\echo '--- 4. Preflight Estrutural e Migração Integral de job_backfill_queue ---'
DO $$
DECLARE
    v_attnum_alert INT;
    v_attnum_job INT;
    v_rec RECORD;
    v_col_name TEXT;
    v_expected_type TEXT;
    v_actual_type TEXT;
    v_expected_cols JSONB := '{
        "job_title": "text",
        "job_description": "text",
        "job_location": "text",
        "job_work_topic": "text",
        "job_source_url": "text",
        "job_company": "text",
        "job_ingested_at": "timestamp with time zone",
        "status": "character varying",
        "lease_expires_at": "timestamp with time zone",
        "batch_id": "uuid",
        "created_at": "timestamp with time zone",
        "processed_at": "timestamp with time zone"
    }'::jsonb;
BEGIN
    CREATE TABLE IF NOT EXISTS public.job_backfill_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        alert_id UUID NOT NULL,
        job_id UUID NOT NULL,
        job_title TEXT NOT NULL,
        job_ingested_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.job_backfill_queue 
        ADD COLUMN IF NOT EXISTS job_title TEXT,
        ADD COLUMN IF NOT EXISTS job_description TEXT,
        ADD COLUMN IF NOT EXISTS job_location TEXT,
        ADD COLUMN IF NOT EXISTS job_work_topic TEXT,
        ADD COLUMN IF NOT EXISTS job_source_url TEXT,
        ADD COLUMN IF NOT EXISTS job_company TEXT,
        ADD COLUMN IF NOT EXISTS job_ingested_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS batch_id UUID,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
        ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

    FOR v_col_name, v_expected_type IN SELECT key, value#>>'{}' FROM jsonb_each(v_expected_cols) LOOP
        SELECT data_type INTO v_actual_type
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = 'job_backfill_queue' 
          AND column_name = v_col_name;

        IF v_actual_type IS NULL THEN
            RAISE EXCEPTION 'MIRA Catalog Failure: Column % missing from public.job_backfill_queue', v_col_name;
        END IF;

        IF v_actual_type <> v_expected_type THEN
            EXECUTE format('ALTER TABLE public.job_backfill_queue ALTER COLUMN %I TYPE %s USING %I::%s', 
                           v_col_name, v_expected_type, v_col_name, v_expected_type);
        END IF;
    END LOOP;

    UPDATE public.job_backfill_queue
    SET job_ingested_at = COALESCE(created_at, now())
    WHERE job_ingested_at IS NULL;

    ALTER TABLE public.job_backfill_queue
        ALTER COLUMN job_ingested_at SET NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public' 
          AND t.relname = 'job_backfill_queue' 
          AND c.contype IN ('u', 'p')
          AND ARRAY[
              (SELECT attnum::smallint FROM pg_attribute WHERE attrelid = t.oid AND attname = 'alert_id'),
              (SELECT attnum::smallint FROM pg_attribute WHERE attrelid = t.oid AND attname = 'job_id')
          ] <@ c.conkey
    ) THEN
        DELETE FROM public.job_backfill_queue a
        USING public.job_backfill_queue b
        WHERE a.alert_id = b.alert_id 
          AND a.job_id = b.job_id 
          AND a.created_at < b.created_at;

        ALTER TABLE public.job_backfill_queue 
            ADD CONSTRAINT uq_backfill_alert_job UNIQUE (alert_id, job_id);
    END IF;

    SELECT attnum INTO v_attnum_alert FROM pg_attribute WHERE attrelid = 'public.job_backfill_queue'::regclass AND attname = 'alert_id';
    SELECT attnum INTO v_attnum_job FROM pg_attribute WHERE attrelid = 'public.job_backfill_queue'::regclass AND attname = 'job_id';

    FOR v_rec IN 
        SELECT conname, confdeltype 
        FROM pg_constraint 
        WHERE conrelid = 'public.job_backfill_queue'::regclass 
          AND contype = 'f' 
          AND conkey = ARRAY[v_attnum_alert::smallint]
    LOOP
        IF v_rec.confdeltype <> 'r' THEN
            EXECUTE 'ALTER TABLE public.job_backfill_queue DROP CONSTRAINT ' || quote_ident(v_rec.conname);
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.job_backfill_queue'::regclass 
          AND contype = 'f' 
          AND conkey = ARRAY[v_attnum_alert::smallint] 
          AND confdeltype = 'r'
    ) THEN
        ALTER TABLE public.job_backfill_queue 
            ADD CONSTRAINT fk_backfill_queue_alert 
            FOREIGN KEY (alert_id) REFERENCES public.user_job_alerts(id) ON DELETE RESTRICT;
    END IF;

    FOR v_rec IN 
        SELECT conname, confdeltype 
        FROM pg_constraint 
        WHERE conrelid = 'public.job_backfill_queue'::regclass 
          AND contype = 'f' 
          AND conkey = ARRAY[v_attnum_job::smallint]
    LOOP
        IF v_rec.confdeltype <> 'r' THEN
            EXECUTE 'ALTER TABLE public.job_backfill_queue DROP CONSTRAINT ' || quote_ident(v_rec.conname);
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.job_backfill_queue'::regclass 
          AND contype = 'f' 
          AND conkey = ARRAY[v_attnum_job::smallint] 
          AND confdeltype = 'r'
    ) THEN
        ALTER TABLE public.job_backfill_queue 
            ADD CONSTRAINT fk_backfill_queue_job 
            FOREIGN KEY (job_id) REFERENCES public.job_posts(id) ON DELETE RESTRICT;
    END IF;

    CREATE TABLE IF NOT EXISTS public.job_backfill_batch_manifest (
        batch_id UUID PRIMARY KEY,
        item_count INTEGER NOT NULL,
        expected_item_ids UUID[] NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        status VARCHAR(25) NOT NULL DEFAULT 'created',
        closed_at TIMESTAMPTZ
    );

    ALTER TABLE public.job_backfill_batch_manifest
        ADD COLUMN IF NOT EXISTS item_count INTEGER,
        ADD COLUMN IF NOT EXISTS expected_item_ids UUID[],
        ADD COLUMN IF NOT EXISTS status VARCHAR(25) DEFAULT 'created',
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_backfill_queue_pending 
    ON public.job_backfill_queue(status, lease_expires_at, alert_id, job_id)
    WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_job_backfill_queue_batch 
    ON public.job_backfill_queue(batch_id) 
    WHERE batch_id IS NOT NULL;

\echo '--- 5. Trigger de Imutabilidade do Manifesto ---'
CREATE OR REPLACE FUNCTION public.trg_protect_manifest_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Manifest records cannot be deleted (batch_id: %)', OLD.batch_id;
    END IF;

    IF OLD.expected_item_ids IS DISTINCT FROM NEW.expected_item_ids 
       OR OLD.item_count IS DISTINCT FROM NEW.item_count 
       OR OLD.batch_id IS DISTINCT FROM NEW.batch_id 
       OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Manifest core structure is strictly immutable (batch_id: %)', OLD.batch_id;
    END IF;

    IF OLD.status IN ('committed', 'expired_aborted') THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Manifest % is finalized as % and cannot be modified', OLD.batch_id, OLD.status;
    END IF;

    IF NEW.status NOT IN ('committed', 'expired_aborted') THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Invalid manifest status transition from % to %', OLD.status, NEW.status;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_manifest_integrity ON public.job_backfill_batch_manifest;
CREATE TRIGGER trg_protect_manifest_integrity
BEFORE UPDATE OR DELETE ON public.job_backfill_batch_manifest
FOR EACH ROW
EXECUTE FUNCTION public.trg_protect_manifest_integrity();

\echo '--- 6. Evolução de job_alert_deliveries ---'
ALTER TABLE public.job_alert_deliveries 
    ADD COLUMN IF NOT EXISTS batch_id UUID,
    ADD COLUMN IF NOT EXISTS notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_alert_deliveries_batch 
    ON public.job_alert_deliveries(batch_id) 
    WHERE batch_id IS NOT NULL;

\echo '--- 7. Motor Canónico de Matching (STABLE com search_path dinâmico) ---'
CREATE OR REPLACE FUNCTION public.canonical_match_job(
    p_alert_keywords TEXT,
    p_alert_work_topic TEXT,
    p_alert_location TEXT,
    p_job_title TEXT,
    p_job_description TEXT,
    p_job_work_topic TEXT,
    p_job_location TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_title_norm TEXT;
    v_desc_norm TEXT;
    v_combined_job_text TEXT;
    v_job_topic_norm TEXT;
    v_job_loc_norm TEXT;
    v_alert_topic_norm TEXT;
    v_alert_loc_norm TEXT;
    v_kw_tokens TEXT[];
    v_kw TEXT;
    v_escaped_kw TEXT;
    v_has_matching_kw BOOLEAN := false;
BEGIN
    v_title_norm := unaccent(lower(COALESCE(p_job_title, '')));
    v_desc_norm := unaccent(lower(COALESCE(p_job_description, '')));
    v_job_topic_norm := unaccent(lower(COALESCE(p_job_work_topic, '')));
    v_job_loc_norm := unaccent(lower(COALESCE(p_job_location, '')));
    v_combined_job_text := ' ' || v_title_norm || ' ' || v_desc_norm || ' ';

    v_alert_topic_norm := unaccent(lower(trim(COALESCE(p_alert_work_topic, ''))));
    v_alert_loc_norm := unaccent(lower(trim(COALESCE(p_alert_location, ''))));

    -- 1. Resolução de Tópico de Trabalho (com mapeamento canónico de Aliases)
    IF v_alert_topic_norm <> '' AND v_alert_topic_norm <> 'todos' THEN
        v_alert_topic_norm := CASE 
            WHEN v_alert_topic_norm IN ('ti', 'it', 'software', 'programacao', 'desenvolvimento', 'informatica', 'tecnologia da informacao') THEN 'tecnologia, dados & ia'
            WHEN v_alert_topic_norm IN ('hospitalar', 'clinica', 'enfermagem', 'farmacia', 'medicina') THEN 'saude & bem-estar'
            WHEN v_alert_topic_norm IN ('contabilidade', 'financas', 'gestao', 'administrativo') THEN 'administracao & financas'
            WHEN v_alert_topic_norm IN ('vendas', 'comercial', 'retalho', 'atendimento ao cliente') THEN 'comercio & vendas'
            WHEN v_alert_topic_norm IN ('hotelaria', 'restauracao', 'cozinha', 'turismo') THEN 'turismo & hotelaria'
            ELSE v_alert_topic_norm
        END;

        IF position(v_alert_topic_norm IN v_job_topic_norm) = 0 AND position(v_alert_topic_norm IN v_title_norm) = 0 THEN
            RETURN jsonb_build_object('matched', false, 'reason', 'topic_mismatch', 'engine_version', 'canonical_v5_3_11');
        END IF;
    END IF;

    -- 2. Resolução de Localização / Remoto
    IF v_alert_loc_norm <> '' AND v_alert_loc_norm <> 'todos os distritos' AND v_alert_loc_norm <> 'todos' THEN
        IF position(v_alert_loc_norm IN v_job_loc_norm) = 0 
           AND position(v_job_loc_norm IN v_alert_loc_norm) = 0 
           AND position('remoto' IN v_job_loc_norm) = 0 
           AND position('remoto' IN v_title_norm) = 0 THEN
            RETURN jsonb_build_object('matched', false, 'reason', 'location_mismatch', 'engine_version', 'canonical_v5_3_11');
        END IF;
    END IF;

    -- 3. Resolução de Palavras-chave com Limites Regex Padded
    IF p_alert_keywords IS NOT NULL AND length(trim(p_alert_keywords)) > 0 THEN
        v_kw_tokens := regexp_split_to_array(unaccent(lower(trim(p_alert_keywords))), '[\s,]+');
        
        FOREACH v_kw IN ARRAY v_kw_tokens LOOP
            IF length(v_kw) > 2 THEN
                v_escaped_kw := regexp_replace(v_kw, '([.*+?^${}()|[\]\\])', '\\\1', 'g');
                IF v_combined_job_text ~* ('[^a-zA-Z0-9]' || v_escaped_kw || '[^a-zA-Z0-9]') THEN
                    v_has_matching_kw := true;
                    EXIT;
                END IF;
            END IF;
        END LOOP;

        IF NOT v_has_matching_kw THEN
            RETURN jsonb_build_object('matched', false, 'reason', 'keywords_mismatch', 'engine_version', 'canonical_v5_3_11');
        END IF;
    END IF;

    RETURN jsonb_build_object('matched', true, 'reason', 'ok', 'engine_version', 'canonical_v5_3_11');
END;
$$;

\echo '--- 8. RPC initialize_backfill_snapshot ---'
CREATE OR REPLACE FUNCTION public.initialize_backfill_snapshot(
    p_max_age_days INT DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_alert RECORD;
    v_total_inserted INT := 0;
    v_inserted INT := 0;
    v_alerts_processed INT := 0;
BEGIN
    IF p_max_age_days IS NULL OR p_max_age_days < 1 OR p_max_age_days > 365 THEN
        RAISE EXCEPTION 'MIRA Validation: p_max_age_days must be between 1 and 365 (received %)', p_max_age_days;
    END IF;

    FOR v_alert IN 
        SELECT id, user_id, work_topic, location, keywords, created_at
        FROM public.user_job_alerts
        WHERE is_active = true 
          AND deleted_at IS NULL
    LOOP
        INSERT INTO public.job_backfill_queue (
            alert_id,
            job_id,
            job_title,
            job_description,
            job_location,
            job_work_topic,
            job_source_url,
            job_company,
            job_ingested_at,
            status,
            created_at
        )
        SELECT 
            v_alert.id,
            jp.id,
            jp.title,
            jp.description,
            jp.location,
            jp.work_topic,
            jp.source_url,
            jp.company,
            jp.ingested_at,
            'pending',
            now()
        FROM public.job_posts jp
        WHERE jp.is_active IS NOT FALSE
          AND jp.ingested_at < v_alert.created_at
          AND jp.ingested_at >= (v_alert.created_at - (p_max_age_days || ' days')::interval)
          AND jp.created_at >= (v_alert.created_at - (p_max_age_days || ' days')::interval)
        ON CONFLICT (alert_id, job_id) DO NOTHING;

        GET DIAGNOSTICS v_inserted = ROW_COUNT;
        v_total_inserted := v_total_inserted + v_inserted;
        v_alerts_processed := v_alerts_processed + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'status', 'success',
        'alerts_processed', v_alerts_processed,
        'queue_items_populated', v_total_inserted,
        'timestamp', now()
    );
END;
$$;

\echo '--- 9. RPC claim_backfill_batch ---'
CREATE OR REPLACE FUNCTION public.claim_backfill_batch(
    p_batch_size INT DEFAULT 50,
    p_lease_seconds INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_batch_id UUID := gen_random_uuid();
    v_now TIMESTAMPTZ := now();
    v_lease_until TIMESTAMPTZ;
    v_item_ids UUID[];
    v_items JSONB;
BEGIN
    IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 500 THEN
        RAISE EXCEPTION 'MIRA Validation: p_batch_size must be between 1 and 500 (received %)', p_batch_size;
    END IF;

    IF p_lease_seconds IS NULL OR p_lease_seconds < 30 OR p_lease_seconds > 3600 THEN
        RAISE EXCEPTION 'MIRA Validation: p_lease_seconds must be between 30 and 3600 (received %)', p_lease_seconds;
    END IF;

    v_lease_until := v_now + (p_lease_seconds || ' seconds')::interval;

    UPDATE public.job_backfill_batch_manifest
    SET status = 'expired_aborted', closed_at = v_now
    WHERE status = 'created' 
      AND batch_id IN (
          SELECT DISTINCT batch_id FROM public.job_backfill_queue 
          WHERE status = 'processing' AND lease_expires_at < v_now AND batch_id IS NOT NULL
      );

    UPDATE public.job_backfill_queue
    SET status = 'pending', lease_expires_at = NULL, batch_id = NULL
    WHERE status = 'processing' AND lease_expires_at < v_now;

    UPDATE public.job_backfill_queue q
    SET status = 'cancelled_alert_inactive', processed_at = v_now
    FROM public.user_job_alerts a
    WHERE q.alert_id = a.id
      AND q.status = 'pending'
      AND (a.is_active IS NOT TRUE OR a.deleted_at IS NOT NULL);

    SELECT array_agg(q_sub.id ORDER BY q_sub.alert_id ASC, q_sub.job_id ASC)
    INTO v_item_ids
    FROM (
        SELECT q.id, q.alert_id, q.job_id
        FROM public.job_backfill_queue q
        JOIN public.user_job_alerts a ON a.id = q.alert_id
        WHERE q.status = 'pending'
          AND a.is_active IS TRUE
          AND a.deleted_at IS NULL
        ORDER BY q.alert_id ASC, q.job_id ASC
        LIMIT p_batch_size
        FOR UPDATE OF q SKIP LOCKED
    ) q_sub;

    IF v_item_ids IS NULL OR array_length(v_item_ids, 1) = 0 THEN
        RETURN jsonb_build_object(
            'status', 'empty',
            'batch_id', null,
            'count', 0,
            'items', '[]'::jsonb
        );
    END IF;

    UPDATE public.job_backfill_queue
    SET status = 'processing',
        batch_id = v_batch_id,
        lease_expires_at = v_lease_until
    WHERE id = ANY(v_item_ids);

    INSERT INTO public.job_backfill_batch_manifest (
        batch_id,
        item_count,
        expected_item_ids,
        status,
        created_at
    ) VALUES (
        v_batch_id,
        array_length(v_item_ids, 1),
        v_item_ids,
        'created',
        v_now
    );

    SELECT jsonb_agg(
        jsonb_build_object(
            'queue_id', q.id,
            'alert_id', q.alert_id,
            'job_id', q.job_id,
            'job_title', q.job_title,
            'job_description', q.job_description,
            'job_location', q.job_location,
            'job_work_topic', q.job_work_topic,
            'job_source_url', q.job_source_url,
            'job_company', q.job_company,
            'job_ingested_at', q.job_ingested_at,
            'alert_user_id', a.user_id,
            'alert_keywords', a.keywords,
            'alert_work_topic', a.work_topic,
            'alert_location', a.location
        ) ORDER BY q.alert_id ASC, q.job_id ASC
    )
    INTO v_items
    FROM public.job_backfill_queue q
    JOIN public.user_job_alerts a ON a.id = q.alert_id
    WHERE q.id = ANY(v_item_ids);

    RETURN jsonb_build_object(
        'status', 'claimed',
        'batch_id', v_batch_id,
        'lease_expires_at', v_lease_until,
        'count', array_length(v_item_ids, 1),
        'items', v_items
    );
END;
$$;

\echo '--- 10. RPC commit_backfill_batch ---'
CREATE OR REPLACE FUNCTION public.commit_backfill_batch(
    p_batch_id UUID,
    p_results JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_manifest RECORD;
    v_res RECORD;
    v_queue_item RECORD;
    v_alert RECORD;
    v_eval JSONB;
    v_is_matched BOOLEAN;
    v_delivery_id UUID;
    v_notif_id UUID;
    v_submitted_ids UUID[];
    v_matches_count INT := 0;
    v_deliveries_count INT := 0;
    v_notifications_count INT := 0;
    v_discarded_count INT := 0;
    v_alert_deliveries_map JSONB := '{}'::jsonb;
    v_cur_alert_id TEXT;
    v_alert_dels JSONB;
    v_title TEXT;
    v_message TEXT;
    v_first_cand JSONB;
BEGIN
    SELECT * INTO v_manifest
    FROM public.job_backfill_batch_manifest
    WHERE batch_id = p_batch_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Batch manifest not found for batch %', p_batch_id;
    END IF;

    IF v_manifest.status <> 'created' THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Manifest % is in state %, expected created', p_batch_id, v_manifest.status;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM unnest(v_manifest.expected_item_ids) AS expected_id
        LEFT JOIN public.job_backfill_queue q ON q.id = expected_id
        WHERE q.id IS NULL 
           OR q.batch_id IS DISTINCT FROM p_batch_id
           OR q.status IS DISTINCT FROM 'processing'
           OR q.lease_expires_at IS NULL
           OR q.lease_expires_at < now()
    ) THEN
        RAISE EXCEPTION 'MIRA Item State/Lease Violation: Items in batch % do not all satisfy status=processing, batch_id match, and active lease (lease_expires_at >= now())', p_batch_id;
    END IF;

    SELECT array_agg((item->>'queue_id')::uuid ORDER BY (item->>'queue_id')::uuid)
    INTO v_submitted_ids
    FROM jsonb_array_elements(p_results) AS item;

    IF array_length(v_submitted_ids, 1) IS DISTINCT FROM v_manifest.item_count THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Result count (%) does not match manifest count (%)',
            COALESCE(array_length(v_submitted_ids, 1), 0), v_manifest.item_count;
    END IF;

    IF v_submitted_ids IS DISTINCT FROM (SELECT array_agg(x ORDER BY x) FROM unnest(v_manifest.expected_item_ids) x) THEN
        RAISE EXCEPTION 'MIRA R21 Violation: Submitted item IDs do not match manifest expected_item_ids';
    END IF;

    FOR v_res IN 
        SELECT (item->>'queue_id')::uuid AS queue_id
        FROM jsonb_array_elements(p_results) AS item
        ORDER BY (item->>'queue_id')::uuid
    LOOP
        SELECT * INTO v_queue_item
        FROM public.job_backfill_queue
        WHERE id = v_res.queue_id AND batch_id = p_batch_id
        FOR UPDATE;

        SELECT * INTO v_alert
        FROM public.user_job_alerts
        WHERE id = v_queue_item.alert_id;

        IF NOT FOUND OR v_alert.is_active IS NOT TRUE OR v_alert.deleted_at IS NOT NULL THEN
            UPDATE public.job_backfill_queue
            SET status = 'cancelled_alert_inactive', processed_at = now()
            WHERE id = v_queue_item.id;
            v_discarded_count := v_discarded_count + 1;
            CONTINUE;
        END IF;

        v_eval := public.canonical_match_job(
            v_alert.keywords,
            v_alert.work_topic,
            v_alert.location,
            v_queue_item.job_title,
            v_queue_item.job_description,
            v_queue_item.job_work_topic,
            v_queue_item.job_location
        );

        v_is_matched := COALESCE((v_eval->>'matched')::boolean, false);

        IF v_is_matched THEN
            v_matches_count := v_matches_count + 1;

            INSERT INTO public.job_alert_deliveries (
                alert_id,
                job_id,
                batch_id,
                delivered_at
            ) VALUES (
                v_queue_item.alert_id,
                v_queue_item.job_id,
                p_batch_id,
                now()
            )
            ON CONFLICT (alert_id, job_id) DO NOTHING
            RETURNING id INTO v_delivery_id;

            IF v_delivery_id IS NOT NULL THEN
                v_deliveries_count := v_deliveries_count + 1;

                v_cur_alert_id := v_queue_item.alert_id::text;
                v_alert_dels := COALESCE(v_alert_deliveries_map->v_cur_alert_id, '[]'::jsonb);
                v_alert_dels := v_alert_dels || jsonb_build_object(
                    'delivery_id', v_delivery_id,
                    'job_id', v_queue_item.job_id,
                    'job_title', v_queue_item.job_title,
                    'job_company', v_queue_item.job_company,
                    'job_location', v_queue_item.job_location,
                    'user_id', v_alert.user_id
                );
                v_alert_deliveries_map := jsonb_set(v_alert_deliveries_map, ARRAY[v_cur_alert_id], v_alert_dels);
            END IF;

            UPDATE public.job_backfill_queue
            SET status = 'completed', processed_at = now()
            WHERE id = v_queue_item.id;
        ELSE
            UPDATE public.job_backfill_queue
            SET status = 'no_match', processed_at = now()
            WHERE id = v_queue_item.id;
        END IF;
    END LOOP;

    FOR v_cur_alert_id IN SELECT jsonb_object_keys(v_alert_deliveries_map) LOOP
        v_alert_dels := v_alert_deliveries_map->v_cur_alert_id;
        IF jsonb_array_length(v_alert_dels) > 0 THEN
            v_first_cand := v_alert_dels->0;
            
            IF jsonb_array_length(v_alert_dels) = 1 THEN
                v_title := '🎯 Nova Oportunidade: ' || (v_first_cand->>'job_title');
                v_message := 'Encontrámos uma vaga compatível em ' || COALESCE(v_first_cand->>'job_location', 'Portugal') || '.';
            ELSE
                v_title := '🎯 ' || jsonb_array_length(v_alert_dels) || ' Novas Oportunidades Encontradas';
                v_message := 'Encontrámos ' || jsonb_array_length(v_alert_dels) || ' vagas compatíveis com os seus alertas.';
            END IF;

            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                is_read,
                created_at
            ) VALUES (
                (v_first_cand->>'user_id')::uuid,
                v_title,
                v_message,
                'job_match',
                false,
                now()
            ) RETURNING id INTO v_notif_id;

            UPDATE public.job_alert_deliveries
            SET notification_id = v_notif_id
            WHERE id IN (
                SELECT (d->>'delivery_id')::uuid 
                FROM jsonb_array_elements(v_alert_dels) AS d
            );

            v_notifications_count := v_notifications_count + 1;
        END IF;
    END LOOP;

    UPDATE public.job_backfill_batch_manifest
    SET status = 'committed', closed_at = now()
    WHERE batch_id = p_batch_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'batch_id', p_batch_id,
        'matches', v_matches_count,
        'deliveries', v_deliveries_count,
        'notifications', v_notifications_count,
        'discarded', v_discarded_count
    );
END;
$$;

\echo '--- 11. RPC process_live_alert_matches (B-01: Temporalidade Soberana no SQL) ---'
CREATE OR REPLACE FUNCTION public.process_live_alert_matches(
    p_alert_id UUID,
    p_job_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_alert RECORD;
    v_job RECORD;
    v_eval JSONB;
    v_is_matched BOOLEAN;
    v_delivery_id UUID;
    v_notif_id UUID;
    v_new_deliveries JSONB := '[]'::jsonb;
    v_first_job JSONB;
    v_title TEXT;
    v_message TEXT;
    v_inserted_count INT := 0;
BEGIN
    IF p_alert_id IS NULL OR p_job_ids IS NULL OR array_length(p_job_ids, 1) = 0 THEN
        RETURN jsonb_build_object('status', 'noop', 'notified', false, 'delivered_count', 0);
    END IF;

    SELECT * INTO v_alert
    FROM public.user_job_alerts
    WHERE id = p_alert_id
    FOR UPDATE;

    IF NOT FOUND OR v_alert.is_active IS NOT TRUE OR v_alert.deleted_at IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'skipped_inactive', 'notified', false, 'delivered_count', 0);
    END IF;

    IF v_alert.frequency IN ('daily', 'weekly') THEN
        RETURN jsonb_build_object('status', 'skipped_digest_schedule', 'notified', false, 'delivered_count', 0);
    END IF;

    -- Barreira Soberana Live: Apenas vagas ingeridas a partir da criação do alerta
    FOR v_job IN 
        SELECT id, title, description, location, work_topic, company, created_at, ingested_at
        FROM public.job_posts
        WHERE id = ANY(p_job_ids) 
          AND is_active IS TRUE
          AND ingested_at >= v_alert.created_at
        ORDER BY id
    LOOP
        v_eval := public.canonical_match_job(
            v_alert.keywords,
            v_alert.work_topic,
            v_alert.location,
            v_job.title,
            v_job.description,
            v_job.work_topic,
            v_job.location
        );

        v_is_matched := COALESCE((v_eval->>'matched')::boolean, false);

        IF v_is_matched THEN
            INSERT INTO public.job_alert_deliveries (
                alert_id,
                job_id,
                delivered_at
            ) VALUES (
                v_alert.id,
                v_job.id,
                now()
            )
            ON CONFLICT (alert_id, job_id) DO NOTHING
            RETURNING id INTO v_delivery_id;

            IF v_delivery_id IS NOT NULL THEN
                v_inserted_count := v_inserted_count + 1;
                v_new_deliveries := v_new_deliveries || jsonb_build_object(
                    'delivery_id', v_delivery_id,
                    'job_id', v_job.id,
                    'job_title', v_job.title,
                    'job_location', v_job.location
                );
            END IF;
        END IF;
    END LOOP;

    IF v_inserted_count > 0 THEN
        v_first_job := v_new_deliveries->0;

        IF v_inserted_count = 1 THEN
            v_title := '🎯 Nova Oportunidade: ' || (v_first_job->>'job_title');
            v_message := 'Encontrámos uma vaga compatível em ' || COALESCE(v_first_job->>'job_location', 'Portugal') || '.';
        ELSE
            v_title := '🎯 ' || v_inserted_count || ' Novas Oportunidades Encontradas';
            v_message := 'Encontrámos ' || v_inserted_count || ' novas vagas compatíveis com os seus alertas.';
        END IF;

        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            is_read,
            created_at
        ) VALUES (
            v_alert.user_id,
            v_title,
            v_message,
            'job_match',
            false,
            now()
        ) RETURNING id INTO v_notif_id;

        UPDATE public.job_alert_deliveries
        SET notification_id = v_notif_id
        WHERE id IN (
            SELECT (d->>'delivery_id')::uuid 
            FROM jsonb_array_elements(v_new_deliveries) AS d
        );

        UPDATE public.user_job_alerts
        SET last_notified_at = now()
        WHERE id = v_alert.id;

        RETURN jsonb_build_object(
            'status', 'success',
            'alert_id', v_alert.id,
            'delivered_count', v_inserted_count,
            'notification_id', v_notif_id,
            'notified', true
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'no_new_matches',
        'alert_id', v_alert.id,
        'delivered_count', 0,
        'notified', false
    );
END;
$$;

\echo '--- 12. RPC purge_user_account_gdpr (B-02: Purga Relacional Atómica) ---'
CREATE OR REPLACE FUNCTION public.purge_user_account_gdpr(p_target_uid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog, pg_temp
AS $$
DECLARE
    v_alert_ids UUID[];
BEGIN
    SELECT array_agg(id) INTO v_alert_ids FROM public.user_job_alerts WHERE user_id = p_target_uid;

    IF v_alert_ids IS NOT NULL AND array_length(v_alert_ids, 1) > 0 THEN
        DELETE FROM public.job_backfill_queue WHERE alert_id = ANY(v_alert_ids);
        DELETE FROM public.job_alert_deliveries WHERE alert_id = ANY(v_alert_ids);
    END IF;

    DELETE FROM public.user_documents WHERE user_id = p_target_uid;
    DELETE FROM public.user_job_alerts WHERE user_id = p_target_uid;
    DELETE FROM public.saved_posts WHERE user_id = p_target_uid;
    DELETE FROM public.post_votes WHERE user_id = p_target_uid;
    DELETE FROM public.user_badges WHERE user_id = p_target_uid;
    DELETE FROM public.reputation_logs WHERE user_id = p_target_uid;
    DELETE FROM public.notifications WHERE user_id = p_target_uid;
    DELETE FROM public.app_suggestions WHERE user_id = p_target_uid;
    DELETE FROM public.community_interactions WHERE user_id = p_target_uid;
    DELETE FROM public.user_follows WHERE follower_id = p_target_uid OR following_id = p_target_uid;
    DELETE FROM public.reports WHERE reporter_id = p_target_uid OR target_user_id = p_target_uid;
    DELETE FROM public.comments WHERE author_id = p_target_uid;
    DELETE FROM public.stories WHERE author_id = p_target_uid;
    DELETE FROM public.posts WHERE author_id = p_target_uid;
    DELETE FROM public.profiles WHERE id = p_target_uid;
    UPDATE public.activity_logs SET user_id = NULL WHERE user_id = p_target_uid;

    RETURN jsonb_build_object('status', 'success', 'purged_uid', p_target_uid);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'MIRA RGPD Purge Failed: %', SQLERRM;
END;
$$;

\echo '--- 12.5. ACL: REVOKE/GRANT Explícito das RPCs Privilegiadas ---'
-- Por omissão, o PostgreSQL concede EXECUTE a PUBLIC em novas funções.
-- Revogação e concessão explícita seguindo o padrão do projecto MIRA.

-- Funções de trigger: não recebem EXECUTE de utilizadores; revogação defensiva.
REVOKE EXECUTE ON FUNCTION public.trg_protect_job_posts_ingestion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_protect_manifest_integrity() FROM PUBLIC, anon, authenticated;

-- Motor canónico: interno, chamado pelas RPCs SECURITY DEFINER.
-- Sem GRANT a anon/authenticated.
REVOKE EXECUTE
ON FUNCTION public.canonical_match_job(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.canonical_match_job(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
TO service_role;

-- initialize_backfill_snapshot: invocada apenas por cron/service backend.
REVOKE EXECUTE
ON FUNCTION public.initialize_backfill_snapshot(INT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.initialize_backfill_snapshot(INT)
TO service_role;

-- claim_backfill_batch: invocada apenas por worker backend.
REVOKE EXECUTE
ON FUNCTION public.claim_backfill_batch(INT, INT)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.claim_backfill_batch(INT, INT)
TO service_role;

-- commit_backfill_batch: invocada apenas por worker backend.
REVOKE EXECUTE
ON FUNCTION public.commit_backfill_batch(UUID, JSONB)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.commit_backfill_batch(UUID, JSONB)
TO service_role;

-- process_live_alert_matches: invocada apenas por sync-jobs (service_role key).
REVOKE EXECUTE
ON FUNCTION public.process_live_alert_matches(UUID, UUID[])
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.process_live_alert_matches(UUID, UUID[])
TO service_role;

-- purge_user_account_gdpr: invocada apenas por community.js (service_role key).
-- NÃO exposta a authenticated: o utilizador autentica-se via JWT e o backend
-- valida a identidade antes de chamar a RPC como service_role.
REVOKE EXECUTE
ON FUNCTION public.purge_user_account_gdpr(UUID)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE
ON FUNCTION public.purge_user_account_gdpr(UUID)
TO service_role;

-- Verificação das permissões efectivas após concessão
DO $$
DECLARE
    v_fn TEXT;
    v_priv BOOLEAN;
    v_failed_checks TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar que service_role TEM EXECUTE em cada RPC privilegiada
    FOREACH v_fn IN ARRAY ARRAY[
        'canonical_match_job(text,text,text,text,text,text,text)',
        'initialize_backfill_snapshot(integer)',
        'claim_backfill_batch(integer,integer)',
        'commit_backfill_batch(uuid,jsonb)',
        'process_live_alert_matches(uuid,uuid[])',
        'purge_user_account_gdpr(uuid)'
    ] LOOP
        SELECT has_function_privilege('service_role', 'public.' || v_fn, 'EXECUTE')
        INTO v_priv;
        IF NOT v_priv THEN
            v_failed_checks := v_failed_checks || ('service_role SEM EXECUTE em ' || v_fn);
        END IF;
    END LOOP;

    -- Verificar que anon NÃO TEM EXECUTE nas RPCs privilegiadas
    FOREACH v_fn IN ARRAY ARRAY[
        'initialize_backfill_snapshot(integer)',
        'claim_backfill_batch(integer,integer)',
        'commit_backfill_batch(uuid,jsonb)',
        'process_live_alert_matches(uuid,uuid[])',
        'purge_user_account_gdpr(uuid)'
    ] LOOP
        SELECT has_function_privilege('anon', 'public.' || v_fn, 'EXECUTE')
        INTO v_priv;
        IF v_priv THEN
            v_failed_checks := v_failed_checks || ('anon COM EXECUTE indevido em ' || v_fn);
        END IF;
    END LOOP;

    -- Verificar que authenticated NÃO TEM EXECUTE nas RPCs privilegiadas
    FOREACH v_fn IN ARRAY ARRAY[
        'initialize_backfill_snapshot(integer)',
        'claim_backfill_batch(integer,integer)',
        'commit_backfill_batch(uuid,jsonb)',
        'process_live_alert_matches(uuid,uuid[])',
        'purge_user_account_gdpr(uuid)'
    ] LOOP
        SELECT has_function_privilege('authenticated', 'public.' || v_fn, 'EXECUTE')
        INTO v_priv;
        IF v_priv THEN
            v_failed_checks := v_failed_checks || ('authenticated COM EXECUTE indevido em ' || v_fn);
        END IF;
    END LOOP;

    IF array_length(v_failed_checks, 1) > 0 THEN
        RAISE EXCEPTION 'MIRA ACL Failure: %', array_to_string(v_failed_checks, ' | ');
    END IF;

    RAISE NOTICE 'MIRA ACL CHECK: Permissões das 6 RPCs verificadas — service_role GRANT ✓, anon/authenticated REVOKE ✓.';
END $$;
