-- 🧠 MIRA V2026: PROTOCOLO DE SOBERANIA - PESOS DE PRESTÍGIO (SQL V3 - MASTER)
-- Sincronização com Edge Function: match_knowledge_global_v3

CREATE OR REPLACE FUNCTION match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.15,
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

  -- Layer B: Community Posts (Peso 1.0x)
  select
    p.id,
    p.category,
    p.title as topic,
    p.content,
    null as url,
    (1 - (p.embedding <=> query_embedding)) * 1.0 as similarity,
    jsonb_build_object('type', 'community', 'author', p.author_name) as metadata
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
    (1 - (c.embedding <=> query_embedding)) * 1.1 as similarity,
    jsonb_build_object('type', 'academy', 'expert_name', 'MIRA Academy') as metadata
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
    (1 - (s.embedding <=> query_embedding)) * 1.5 as similarity,
    jsonb_build_object('type', 'ceo', 'expert_name', 'CEO Amanda Abreu') as metadata
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;
