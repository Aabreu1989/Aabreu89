-- ==============================================================================
-- 📊 MIRA SOVEREIGN AI TELEMETRY: TABELA DEDICADA DE QUOTA & CONSUMO GEMINI
-- Data: 2026-09-03
-- Objetivo: Telemetria factual da API Gemini sem misturar com activity_logs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ai_api_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guest_id TEXT,
    request_id TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', '429', '5xx', 'fallback'
    prompt_tokens INT NOT NULL DEFAULT 0,
    candidate_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT,
    http_status INT NOT NULL DEFAULT 200,
    error_code TEXT,
    error_message TEXT,
    finish_reason TEXT
);

-- Índices de alta performance para agregações temporais no Admin Hub
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_created_at ON public.ai_api_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_status ON public.ai_api_telemetry (status);
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_model ON public.ai_api_telemetry (model);
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_http_status ON public.ai_api_telemetry (http_status);

-- Ativar Row Level Security
ALTER TABLE public.ai_api_telemetry ENABLE ROW LEVEL SECURITY;

-- 1. Service Role tem controlo total (INSERT do backend api/chat.js)
DROP POLICY IF EXISTS "Service role full access on ai_api_telemetry" ON public.ai_api_telemetry;
CREATE POLICY "Service role full access on ai_api_telemetry"
    ON public.ai_api_telemetry FOR ALL
    USING (true)
    WITH CHECK (true);

-- 2. Administradores e utilizadores autenticados podem consultar telemetria
DROP POLICY IF EXISTS "Admins can view ai_api_telemetry" ON public.ai_api_telemetry;
CREATE POLICY "Admins can view ai_api_telemetry"
    ON public.ai_api_telemetry FOR SELECT
    TO authenticated
    USING (true);

-- Conceder permissões formais
GRANT ALL ON public.ai_api_telemetry TO service_role;
GRANT SELECT ON public.ai_api_telemetry TO authenticated;
