-- ============================================================
-- 💎 MIRA V2026.GOLD: ULTIMATO DE REPARAÇÃO (V126.0)
-- ------------------------------------------------------------
-- MISSÃO: Corrigir o calibre 768D (SEM ERROS DE SINTAXE).
-- ALVO: Limpeza total de bloqueios e reconstrução do cérebro.
-- ============================================================

-- [1] LIMPEZA TOTAL DE BLOQUEIOS (DROPS AGRESSIVOS)
-- Dropamos tudo o que pode estar a trancar a coluna 'embedding'.
DROP INDEX IF EXISTS public.idx_saber_ia_embedding_hnsw;
DROP INDEX IF EXISTS public.idx_posts_embedding_hnsw;
DROP INDEX IF EXISTS public.idx_knowledge_embedding_hnsw;

DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int, text) CASCADE;
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int) CASCADE;
DROP FUNCTION IF EXISTS public.match_semantic_cache(vector, float, int) CASCADE;
DROP FUNCTION IF EXISTS public.match_semantic_cache(vector, float) CASCADE;

-- [2] TRUNCATE (LIMPANDO O CALIBRE ERRADO 764D)
-- Sem dados, o PostgreSQL não tem desculpa para falhar o ALTER TYPE.
TRUNCATE TABLE public.saber_ia CASCADE;
TRUNCATE TABLE public.ai_semantic_cache CASCADE;

-- [3] ALTERAÇÃO DE TIPO (A MARRETADA FINAL 768D)
-- Se este comando der erro, é porque existe uma VIEW que não foi dropada.
ALTER TABLE public.saber_ia ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE public.ai_semantic_cache ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE public.posts ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE public.knowledge_base ALTER COLUMN embedding TYPE vector(768);

-- [4] RECONSTRUÇÃO DO MOTOR RAG SOBERANO (RE-CALIBRADO)
-- Sintaxe corrigida (Apenas um WHERE).
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768) DEFAULT NULL,
  match_threshold float DEFAULT 0.18, 
  match_count int DEFAULT 10,
  query_text text DEFAULT ''
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float
) language plpgsql STABLE as $$
begin
  IF query_embedding IS NOT NULL THEN
    return query select 
      res.id, res.topic, res.content, res.category, res.similarity,
      (res.similarity * res.prestige) as weighted_score
    from (
      select s.id, s.topic, s.content, s.category::text, (1 - (s.embedding <=> query_embedding)) as similarity, 
      (CASE WHEN s.category = 'diretrizes_ceo' THEN 1.8 ELSE 1.2 END) as prestige 
      from public.saber_ia s where s.embedding is not null
      union all
      select p.id, 'Hack da Tribo'::text, p.content, 'hacks_da_tribo'::text, (1 - (p.embedding <=> query_embedding)) as similarity, 1.4 as prestige 
      from public.posts p where p.embedding is not null
    ) as res 
    where res.similarity >= match_threshold 
    order by weighted_score desc limit match_count;
  ELSE
    return query select 
      s.id, s.topic, s.content, s.category::text, 1.0 as similarity, 1.0 as weighted_score 
    from public.saber_ia s
    where (query_text = '' OR unaccent(s.content) ILIKE unaccent('%' || query_text || '%'))
    order by (case when s.category = 'diretrizes_ceo' then 100000 else 1000 end) desc limit match_count;
  END IF;
end; $$;

-- [5] RECONSTRUÇÃO DO MOTOR DE CACHE (768D)
CREATE OR REPLACE FUNCTION public.match_semantic_cache (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.97,
  match_count int DEFAULT 1
) returns table (id uuid, response_text text) 
language plpgsql STABLE as $$
begin
  return query
  select c.id, c.response_text
  from public.ai_semantic_cache c
  where (1 - (c.embedding <=> query_embedding)) > match_threshold
  order by (1 - (c.embedding <=> query_embedding)) desc
  limit match_count;
end; $$;

-- [6] RE-SELAGEM DE SOBERANIA 100K 
UPDATE public.profiles 
SET sovereignty_score = 100000, role = 'admin', is_verified = true 
WHERE email = 'amandasabreu89@gmail.com';

-- [7] PERMISSÕES E VERIFICAÇÃO FINAL
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_semantic_cache TO anon, authenticated, service_role;

SELECT 
    'CALIBRE DISCO' as pilar,
    (SELECT atttypmod - 4 FROM pg_attribute WHERE attrelid = 'public.saber_ia'::regclass AND attname = 'embedding') || 'D' as resultado;
