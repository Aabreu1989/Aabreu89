-- MIRA Nobel Edition: 360º Semantic Search RPC
-- Adds support for match_threshold and match_count in a unified global query.

create or replace function match_knowledge_global_v2 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25,
  match_count int DEFAULT 10
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
  select
    knowledge_base.id,
    knowledge_base.category,
    knowledge_base.topic,
    knowledge_base.content,
    knowledge_base.url,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

COMMENT ON FUNCTION match_knowledge_global_v2 IS 'Busca semântica 360º para a MIRA Nobel Edition.';
