-- ============================================================
-- 🦾 MIRA V2026: PILLAR 028 - RAG MOTOR V7 (DIAMOND SOVEREIGN)
-- Calibration: CEO Amanda Abreu (1.5x) | Experts (1.3x) | Laws (1.2x) 
-- ============================================================

DROP FUNCTION IF EXISTS public.match_knowledge_global_v7(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_global_v7 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25, 
  match_count int DEFAULT 10
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text, author text
) language plpgsql as $$
begin
  return query
  select results.id, results.topic, results.content, results.category, results.similarity, (results.similarity * results.prestige_multiplier) as weighted_score, results.source_table, results.author
  from (
    -- 👑 CAMADA SOBERANA: SABER IA (AMANDA ABREU) - 1.5x
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 1.5 as prestige_multiplier, 'saber_ia' as source_table, 'Amanda Abreu' as author from saber_ia s
    where s.embedding is not null
    
    union all
    
    -- 🏛️ CAMADA EXPERT: KNOWLEDGE BASE (ESPECIALISTAS) - 1.3x
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier, 'knowledge_base' as source_table, 'Expert MIRA' as author from knowledge_base kb 
    where kb.embedding is not null

    union all
    
    -- ⚖️ CAMADA LEGAL: NEWSROOM (LEIS OFICIAIS) - 1.2x
    select nr.id, nr.title as topic, nr.content, nr.category, 1 - (nr.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier, 'newsroom_articles' as source_table, nr.author from newsroom_articles nr
    where nr.embedding is not null

    union all
    
    -- 🎓 CAMADA ACADEMY / VETTED: 1.0x
    select c.id, c.title as topic, c.description as content, 'Academy' as category, 1 - (c.embedding <=> query_embedding) as similarity, 1.0 as prestige_multiplier, 'courses' as source_table, 'MIRA Academy' as author from courses c
    where c.embedding is not null
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

COMMENT ON FUNCTION public.match_knowledge_global_v7 IS 'MIRA V2026.DIAMOND: Master RAG V7 with 1.5x CEO Multiplier and 0.25 Fixed Threshold.';
