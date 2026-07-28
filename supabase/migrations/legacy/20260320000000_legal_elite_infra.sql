-- ⚖️ MIRA V2026: LEGAL-ELITE INFRASTRUCTURE UPGRADE
-- Adds metadata support and advanced ranking for legal experts.

-- 1. Add metadata column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_base' AND column_name='metadata') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Upgrade match_knowledge_global_v2 to handle metadata
CREATE OR REPLACE FUNCTION match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.22, -- Sensitivity as requested by CEO
  match_count int DEFAULT 10
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  -- Layer A: Official Knowledge Base (Now with Expert Metadata)
  select
    kb.id,
    kb.category,
    kb.topic,
    kb.content,
    kb.url,
    kb.metadata,
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
    '{"expert_name": "Comunidade MIRA", "source_prestige": "community"}'::jsonb as metadata,
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
    '{"expert_name": "Academia MIRA", "source_prestige": "high"}'::jsonb as metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer D: CEO Instructions (Saber IA)
  select
    s.id,
    'Diretriz' as category,
    s.topic,
    s.content,
    s.url,
    '{"expert_name": "CEO Amanda Abreu", "source_prestige": "maximum"}'::jsonb as metadata,
    1 - (s.embedding <=> query_embedding) as similarity
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;

-- Success notice
COMMENT ON FUNCTION match_knowledge_global_v3 IS 'MIRA V2026.LEGAL-ELITE: Expert-Aware Semantic Search Engine.';
