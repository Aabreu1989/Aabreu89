-- Migration: Create job_alert_deliveries table for server-side idempotency
-- Author: MIRA System
-- Date: 2026-08-16

CREATE TABLE IF NOT EXISTS public.job_alert_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.user_job_alerts(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.job_posts(id) ON DELETE CASCADE,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_alert_job_delivery UNIQUE (alert_id, job_id)
);

-- Enable RLS
ALTER TABLE public.job_alert_deliveries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view delivery receipts for their alerts
CREATE POLICY "Users can view own job alert deliveries"
    ON public.job_alert_deliveries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_job_alerts
            WHERE user_job_alerts.id = job_alert_deliveries.alert_id
            AND user_job_alerts.user_id = auth.uid()
        )
    );

-- Allow authenticated users to insert delivery receipts for their alerts
CREATE POLICY "Users can insert own job alert deliveries"
    ON public.job_alert_deliveries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_job_alerts
            WHERE user_job_alerts.id = job_alert_deliveries.alert_id
            AND user_job_alerts.user_id = auth.uid()
        )
    );

-- Allow Service Role full access
CREATE POLICY "Service role full access on job alert deliveries"
    ON public.job_alert_deliveries FOR ALL
    USING (true)
    WITH CHECK (true);

