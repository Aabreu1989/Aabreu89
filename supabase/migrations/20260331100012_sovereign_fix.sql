-- 🛡️ MIRA V2026.GOLD: DNA MASTER NUCLEAR - ESTEROIDES (V150.0)
-- DNA MIRA: SABER IA + GROUNDING + 100K SOBERANIA

-- [1] EXTENSÕES E INFRAESTRUTURA
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- [2] TABELA DE CONHECIMENTO SOBERANO (DE ACORDO COM O CÓDIGO DA CEO)
CREATE TABLE IF NOT EXISTS public.saber_ia (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    url text,
    category text DEFAULT 'vistos_aima',
    source_type text DEFAULT 'mira',
    embedding vector(768),
    created_at timestamptz DEFAULT now()
);

-- Tabela de Prompts do Sistema
CREATE TABLE IF NOT EXISTS public.mira_system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    instruction TEXT NOT NULL,
    grounding_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Auditoria de Grounding
CREATE TABLE IF NOT EXISTS public.mira_grounding_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    match_count INT,
    source_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injeção da Regra de Ouro (NotebookLM Mode)
INSERT INTO public.mira_system_prompts (key, instruction, grounding_enabled)
VALUES (
    'NOTEBOOK_LM_MODE',
    'VOCÊ É O MIRA. Sua inteligência é um híbrido entre o Saber IA e a Internet. 
     1. Prioridade absoluta aos documentos locais da Amanda Abreu.
     2. Se o dado interno estiver desatualizado (pré-2025), use o Google Search.
     3. Amanda Abreu (100k pts) vence qualquer fonte externa.',
    TRUE
) ON CONFLICT (key) DO UPDATE SET instruction = EXCLUDED.instruction;

-- [3] MOTOR RPC MAESTRO V150.0 (HÍBRIDO VETOR + TEXTO)
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768) DEFAULT NULL,
  query_text text DEFAULT '',
  match_threshold float DEFAULT 0.15, 
  match_count int DEFAULT 10
) returns table (
  id uuid, content text, category text, similarity float, weighted_score float
) language plpgsql STABLE as $$
begin
    return query select 
      s.id, s.content, s.category::text,
      (case when query_embedding is not null then (1 - (s.embedding <=> query_embedding)) else 0.6 end) as similarity,
      ((case when s.category = 'diretrizes_ceo' or s.source_type = 'ceo' then 1.8 else 1.1 end) * (case when query_embedding is not null then (1 - (s.embedding <=> query_embedding)) else 1.0 end)) as weighted_score 
    from public.saber_ia s
    where 
      (
        (query_embedding is not null AND (1 - (s.embedding <=> query_embedding)) > match_threshold)
        OR (query_text != '' AND unaccent(s.content) ILIKE unaccent('%' || query_text || '%'))
      )
    order by weighted_score desc, similarity desc 
    limit match_count;
end; $$;

-- [4] SELAGEM DE SOBERANIA 100K
-- A Amanda é a autoridade máxima.
UPDATE public.profiles SET sovereignty_score = 100000, role = 'admin' WHERE email = 'amandasabreu89@gmail.com';

GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
