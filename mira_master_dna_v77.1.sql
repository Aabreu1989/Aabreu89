-- ============================================================
-- 💎 MIRA V2026.GOLD: DNA MASTER NUCLEAR - ESTEROIDES (V77.1)
-- ------------------------------------------------------------
-- MISSÃO: Transformar o MIRA no NotebookLM Soberano.
-- LÓGICA: RAG (Busca Semântica) + Freshness (Grounding Google)
-- SOBERANIA: Amanda Abreu (100.000 pts)
-- ============================================================

-- [1] EXTENSÕES E INFRAESTRUTURA
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- [2] CATEGORIAS E PROMPTS DE SISTEMA
CREATE TABLE IF NOT EXISTS public.mira_system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    instruction TEXT NOT NULL,
    grounding_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injeção da Regra de Ouro (NotebookLM Mode)
INSERT INTO public.mira_system_prompts (key, instruction, grounding_enabled)
VALUES (
    'MASTER_SOVEREIGN_V2026',
    'Tu és o MIRA V2026.GOLD, a inteligência oficial da Amanda Abreu para imigrantes em Portugal. Prioriza sempre os documentos em saber_ia (peso 1.8x). Se a informação não estiver lá, usa o Grounding (Google Search) para dados de hoje (AIMA, Social Security). Nunca sejas genérico. Refere-te à Amanda como CEO e autoridade máxima.',
    TRUE
) ON CONFLICT (key) DO UPDATE SET instruction = EXCLUDED.instruction;

-- [3] SABER IA (RAG HARDENING)
CREATE TABLE IF NOT EXISTS public.saber_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    category TEXT NOT NULL DEFAULT 'diretrizes_ceo',
    embedding vector(1536), -- Compatível com text-embedding-3-small (Gemini Vector logic)
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexação para busca rápida de texto
CREATE INDEX IF NOT EXISTS idx_saber_ia_trgm ON public.saber_ia USING gin (content pg_trgm_ops);

-- [4] GROUNDING AUDIT (VIGILÂNCIA)
CREATE TABLE IF NOT EXISTS public.mira_grounding_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    query TEXT,
    grounding_sources JSONB,
    rag_retrieved BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [5] RPC: BUSCA HÍBRIDA MAESTRO (O CORAÇÃO DO SISTEMA)
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026(
    query_text TEXT,
    query_embedding vector(1536),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    category TEXT,
    url TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id, k.content, k.category, k.url,
        (1.0 - (k.embedding <=> query_embedding)) as similarity
    FROM public.saber_ia k
    WHERE (1.0 - (k.embedding <=> query_embedding)) > match_threshold
    OR k.content ILIKE '%' || query_text || '%'
    ORDER BY similarity DESC, k.category = 'diretrizes_ceo' DESC
    LIMIT match_count;
END;
$$;

-- [6] CRAVAÇÃO DA SOBERANIA (AMANDA ABREU: 100.000 PTS)
UPDATE public.profiles
SET 
  reputation = 100000,
  role = 'admin',
  full_name = 'Amanda Abreu 💎 Sovereign',
  badges = ARRAY['FOUNDER', 'CEO', 'MAESTRO']
WHERE email = 'amandasabreu89@gmail.com';

-- [7] GARANTIA DE POLÍTICA RLS (PERMISSÕES)
ALTER TABLE public.saber_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Pública Saber IA" ON public.saber_ia FOR SELECT USING (true);
CREATE POLICY "Admin Escrita Saber IA" ON public.saber_ia FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================================
-- 🏁 MIGRATION COMPLETE: MIRA V2026.GOLD IS ARMED.
-- ============================================================
