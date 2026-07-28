-- ============================================================
-- 🦾 MIRA V2026: PILLAR 013 - EMERGENCY INFRASTRUCTURE SYNC
-- Fixing "Localhost" issues: Missing Newsroom and Enum Mismatches
-- ============================================================

-- 1. INFRAESTRUTURA DE ARTIGOS (NEWSROOM)
-- Garantir que a tabela existe, caso a migração 012 não tenha sido aplicada corretamente
CREATE TABLE IF NOT EXISTS public.newsroom_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Guia',
    embedding vector(768), -- Motor Nobel 768-D
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REGISTO DE ATIVIDADE (AUDITORIA)
-- Garantir que a tabela de logs existe
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SINCRONIZAÇÃO DE ENUMS (V2026 TRACKING)
-- Adicionar novos tipos de ação para o motor de analítica real-time
DO $$ 
BEGIN 
    -- Se o tipo existir, adicionar os novos valores
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_action') THEN
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'app_launch';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'view_changed';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 4. PERMISSÕES DE SOBERANIA
ALTER TABLE public.newsroom_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Newsroom" ON public.newsroom_articles;
CREATE POLICY "Public Read Newsroom" ON public.newsroom_articles FOR SELECT USING (true);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_logs;
CREATE POLICY "Users can view own logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

-- 5. NOTIFICAR SUCESSO
DO $$ BEGIN RAISE NOTICE 'MIRA: Sincronização de Infraestrutura Concluída. Localhost pronto para V2026! 🚀'; END $$;
