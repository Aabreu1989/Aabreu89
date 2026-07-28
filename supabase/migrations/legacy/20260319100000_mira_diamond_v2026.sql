-- 🧠 MIRA V2026: PROTOCOLO SUPREMO DE INTELIGÊNCIA AGENTE (V2026.DIAMOND)
-- Database Infrastructure Upgrade for 360º Semantic Search

-- 1. Enable vector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create saber_ia table (CEO Instructions)
CREATE TABLE IF NOT EXISTS public.saber_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Diretrizes',
    url TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add embedding columns to posts and courses
-- Note: Using DO block to be idempotent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='embedding') THEN
        ALTER TABLE public.posts ADD COLUMN embedding vector(768);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='courses' AND column_name='embedding') THEN
        ALTER TABLE public.courses ADD COLUMN embedding vector(768);
    END IF;
END $$;

-- 4. Create indexes for faster similarity search
CREATE INDEX IF NOT EXISTS saber_ia_embedding_idx ON public.saber_ia USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS posts_embedding_idx ON public.posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS courses_embedding_idx ON public.courses USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. Upgrade match_knowledge_global_v2 to 360º Search
-- This function integrates Official Knowledge, Community Posts, Courses and CEO Saber.
CREATE OR REPLACE FUNCTION match_knowledge_global_v2 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25,
  match_count int DEFAULT 15
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  -- Layer A: Official Knowledge Base
  select
    kb.id,
    kb.category,
    kb.topic,
    kb.content,
    kb.url,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer B: Community Posts
  select
    p.id,
    p.category,
    p.title as topic,
    p.content,
    null as url,
    1 - (p.embedding <=> query_embedding) as similarity
  from posts p
  where 1 - (p.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer C: Academy Courses
  select
    c.id,
    c.category,
    c.title as topic,
    c.description as content,
    COALESCE(c.link, c.image_url) as url,
    1 - (c.embedding <=> query_embedding) as similarity
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer D: CEO Instructions (Saber IA)
  select
    s.id,
    s.category,
    s.topic,
    s.content,
    s.url,
    1 - (s.embedding <=> query_embedding) as similarity
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;

COMMENT ON FUNCTION match_knowledge_global_v2 IS 'MIRA V2026.DIAMOND: Triple-C (Community, Courses, CEO) Semantic Search.';
