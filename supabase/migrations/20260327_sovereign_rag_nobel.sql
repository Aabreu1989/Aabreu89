-- ============================================================
-- 👑 MIRA V2026: SOVEREIGN RAG & MANIFESTO (GOLD LOCKDOWN)
-- ============================================================

-- [CLEANUP]
DROP FUNCTION IF EXISTS public.match_knowledge_supreme(vector(768), float, int);

-- [1. MANIFESTO V2026.SUPREMO INGESTION]
-- Check and insert the official manifesto into saber_ia
INSERT INTO public.saber_ia (topic, content, category, embedding)
SELECT 
    'MANIFESTO MIRA V2026.SUPREMO',
    'O MIRA é o Império de Informação Soberana para o Imigrante em Portugal. Regras Magnas: 1. A Verdade da CEO Amanda Abreu é a Lei Suprema (Saber IA tem peso 1.5x). 2. As Manifestações de Interesse (Art. 88/89) foram EXTINTAS em 03/06/2024; não existem mais. 3. O NIF e NISS são os pilares da dignidade inicial. 4. Repudiamos a venda de agendamentos e a mentira institucional.',
    'DIRETRIZ_SUPREMA',
    NULL -- Will be updated by trigger or manual embedding call if needed
ON CONFLICT (topic) DO UPDATE SET content = EXCLUDED.content;

-- [2. THE NOBEL SOVEREIGN RAG ENGINE]
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.22, 
  match_count int DEFAULT 10
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text
) language plpgsql STABLE as $$
begin
  return query
  select results.id, results.topic, results.content, results.category, results.similarity, (results.similarity * results.prestige_multiplier) as weighted_score, results.source_table
  from (
    -- 💎 LAYER A: SABER IA (CEO Directives) - WEIGHT: 1.5x
    select s.id, s.topic, s.content, s.category, 
           1 - (s.embedding <=> query_embedding) as similarity, 
           1.5 as prestige_multiplier, 
           'saber_ia' as source_table 
    from public.saber_ia s
    where s.embedding is not null
    
    union all
    
    -- 💎 LAYER B: KNOWLEDGE BASE (Elite/Official) - WEIGHT: 1.2x to 1.3x
    select kb.id, kb.topic, kb.content, kb.category, 
           1 - (kb.embedding <=> query_embedding) as similarity, 
           CASE WHEN (kb.metadata->>'prestige' = 'elite') THEN 1.3 ELSE 1.2 END as prestige_multiplier, 
           'knowledge_base' as source_table 
    from public.knowledge_base kb 
    where kb.embedding is not null
    
    union all
    
    -- 🎓 LAYER C: COURSES (Academy) - WEIGHT: 1.1x
    select c.id, c.title as topic, c.description as content, 'ACADEMY' as category, 
           1 - (c.embedding <=> query_embedding) as similarity, 
           1.1 as prestige_multiplier, 
           'courses' as source_table 
    from public.courses c
    where c.embedding is not null
    
    union all
    
    -- 🤝 LAYER D: COMMUNITY (Posts) - WEIGHT: 1.0x
    select p.id, p.title as topic, p.content, p.category, 
           1 - (p.embedding <=> query_embedding) as similarity, 
           1.0 as prestige_multiplier, 
           'posts' as source_table 
    from public.posts p
    where p.embedding is not null
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

COMMENT ON FUNCTION public.match_knowledge_sovereign_v2026 IS 'Unified RAG Engine for MIRA V2026 Production Lockdown.';
