-- ============================================================
-- 🏗️ MIRA V2026: PILLAR 003 - KNOWLEDGE BASE (RAG)
-- Official Truth, Saber IA, and Sovereign Ranking V3
-- ============================================================

-- 1. OFFICIAL KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Diretrizes',
    url TEXT,
    embedding vector(768),
    metadata jsonb DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CEO SABER IA (Directives)
CREATE TABLE IF NOT EXISTS public.saber_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Estratégia CEO',
    url TEXT,
    embedding vector(768),
    metadata jsonb DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. VECTOR INDEXES
CREATE INDEX IF NOT EXISTS idx_kb_semantic ON public.knowledge_base USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_saber_semantic ON public.saber_ia USING hnsw (embedding vector_cosine_ops);

-- 4. SOVEREIGN RAG ENGINE: match_knowledge_global_v3
-- Hierarchy weights: CEO 1.5x, Official 1.2x, Others 1.1x/1.0x
CREATE OR REPLACE FUNCTION match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25, -- MIRA V2026.SUPREMO: LOCKED AT 0.25
  match_count int DEFAULT 10
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  -- Layer A: Official Knowledge Base (Peso 1.2x)
  select
    kb.id,
    kb.category,
    kb.topic,
    kb.content,
    kb.url,
    (1 - (kb.embedding <=> query_embedding)) * 1.2 as similarity,
    jsonb_build_object('type', 'elite', 'expert_name', 'MIRA Core') as metadata
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer B: Community (Peso 1.1x se Verificado)
  select
    p.id,
    p.category,
    p.title as topic,
    p.content,
    null as url,
    (1 - (p.embedding <=> query_embedding)) * 1.1 as similarity,
    jsonb_build_object('type', 'community', 'verified', p.is_verified) as metadata
  from posts p
  where 1 - (p.embedding <=> query_embedding) > match_threshold 
  AND p.is_verified = true -- CEO Decree: Only Vetted Community Input

  union all

  -- Layer C: CEO Saber IA (Peso 1.5x SOBERANO)
  select
    s.id,
    s.category,
    s.topic,
    s.content,
    s.url,
    (1 - (s.embedding <=> query_embedding)) * 1.5 as similarity,
    jsonb_build_object('type', 'ceo', 'expert_name', 'CEO Amanda Abreu') as metadata
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer D: MIRA Academy Courses (Peso 1.0x)
  select
    c.id,
    c.category,
    c.title as topic,
    c.description as content,
    c.link as url,
    (1 - (c.embedding <=> query_embedding)) * 1.0 as similarity,
    jsonb_build_object('type', 'course', 'duration', c.duration) as metadata
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;

-- 5. RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saber_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public KB viewable by everyone" ON public.knowledge_base FOR SELECT USING (true);
CREATE POLICY "Public Saber viewable by everyone" ON public.saber_ia FOR SELECT USING (true);
