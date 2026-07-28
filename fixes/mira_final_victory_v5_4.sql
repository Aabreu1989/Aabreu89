-- ============================================================
-- 💎 MIRA V2026.GOLD: VITÓRIA FINAL V5.4 (FIX CATEGORY 500)
-- ------------------------------------------------------------
-- CONSOLIDAÇÃO: Fim do Erro 500 no Chat.
-- FIX: Substituição de 'p.category' (inexistente) por valor estático.
-- AUTORIDADE: CEO Amanda Abreu (100.000 pts)
-- ============================================================

-- 1. REPARAÇÃO DEFINITIVA DO CÉREBRO RAG
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.22, 
  match_count int DEFAULT 12
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text
) language plpgsql STABLE as $$
begin
  return query
  select 
    results.id, results.topic, results.content, results.category, results.similarity, 
    (results.similarity * results.prestige_multiplier) as weighted_score, 
    results.source_table
  from (
    -- Fonte 1: Saber IA (Soberania CEO)
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 1.5 as prestige_multiplier, 'saber_ia' as source_table from public.saber_ia s where s.embedding is not null
    union all
    -- Fonte 2: Knowledge Base (Oficial)
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier, 'knowledge_base' as source_table from public.knowledge_base kb where kb.embedding is not null
    union all
    -- Fonte 3: Hacks (Comunidade) - FIX: Usando 'hacks_da_tribo' como texto fixo (Tabela posts não tem coluna category)
    select p.id, 'Hack da Tribo' as topic, p.content, 'hacks_da_tribo' as category, 1 - (p.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier, 'posts_hacks' as source_table from public.posts p where p.embedding is not null 
    AND EXISTS (SELECT 1 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful')
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

-- 2. GARANTIR PERMISSÕES (LOCKDOWN)
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

DO $$ 
BEGIN 
  RAISE NOTICE '💎 MIRA V5.4: VITÓRIA TOTAL! CÉREBRO RECONECTADO.';
END $$;
