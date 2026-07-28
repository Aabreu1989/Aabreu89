-- Drop if exists to handle return type changes (V26.NUCLEAR)
DROP FUNCTION IF EXISTS match_knowledge_global_v3(vector,double precision,integer);

CREATE OR REPLACE FUNCTION match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.22,
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
  -- Layer A: Official Knowledge Base (CEO directives already 1.5x in Layer D)
  select kb.id, kb.category, kb.topic, kb.content, kb.url, kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer B: Community Posts
  select p.id, p.category, p.title as topic, p.content, null as url,
    '{"expert_name": "Comunidade MIRA", "source_prestige": "community"}'::jsonb as metadata,
    1 - (p.embedding <=> query_embedding) as similarity
  from posts p
  where 1 - (p.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer C: Academy Courses (WEIGHTED 1.1x)
  -- CEO REQUIREMENT: Surface [/learning] and cite PFOL
  select c.id, c.category, c.title as topic, 
    c.description || ' [Aceda em /learning para cursos oficiais]' as content,
    COALESCE(c.link, '/learning') as url,
    '{"expert_name": "Academia MIRA", "source_prestige": "high", "cite": "IEFP/PFOL"}'::jsonb as metadata,
    (1 - (c.embedding <=> query_embedding)) * 1.1 as similarity
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer D: CEO Instructions (Saber IA) (WEIGHTED 1.5x)
  select s.id, 'Diretriz' as category, s.topic, s.content, s.url,
    '{"expert_name": "CEO Amanda Abreu", "source_prestige": "maximum"}'::jsonb as metadata,
    (1 - (s.embedding <=> query_embedding)) * 1.5 as similarity
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;

COMMENT ON FUNCTION match_knowledge_global_v3 IS 'MIRA V2026.NUCLEAR: Weighted Academy & CEO Directives Search.';
