-- 🧠 MIRA V2026: PROTOCOLO DE SOBERANIA - PESOS DE PRESTÍGIO (SQL V3)
-- Objetivo: Priorizar a voz da CEO (Saber IA) e Fontes Oficiais

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
  -- Layer A: Official Knowledge Base (Peso 1.2x)
  select
    kb.id,
    kb.category,
    kb.topic,
    kb.content,
    kb.url,
    (1 - (kb.embedding <=> query_embedding)) * 1.2 as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer B: Community Posts (Peso 1.0x - Base)
  select
    p.id,
    p.category,
    p.title as topic,
    p.content,
    null as url,
    (1 - (p.embedding <=> query_embedding)) * 1.0 as similarity
  from posts p
  where 1 - (p.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer C: Academy Courses (Peso 1.1x)
  select
    c.id,
    c.category,
    c.title as topic,
    c.description as content,
    COALESCE(c.link, c.image_url) as url,
    (1 - (c.embedding <=> query_embedding)) * 1.1 as similarity
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer D: CEO Instructions (Saber IA - Peso 1.5x SOBERANO)
  select
    s.id,
    s.category,
    s.topic,
    s.content,
    s.url,
    (1 - (s.embedding <=> query_embedding)) * 1.5 as similarity
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;

COMMENT ON FUNCTION match_knowledge_global_v2 IS 'MIRA V2026.SOVEREIGN: Prestige Ranking (CEO 1.5x, Law 1.2x, Academy 1.1x).';
