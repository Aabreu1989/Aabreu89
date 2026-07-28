-- 👑 PROTOCOLO SOBERANO: CACHE SEMÂNTICO V1.2M (HARDENED)
-- OBJETIVO: Blindagem financeira com rastreio de uso automático.
-- SOBERANA: amandasabreu89@gmail.com

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Tabela de Cache (PRECISÃO 1536)
CREATE TABLE IF NOT EXISTS public.ai_semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding vector(1536), -- 🛡️ DIMENSÃO SOBERANA
    usage_count INT DEFAULT 1,
    last_hit_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índice HNSW para busca em milissegundos
CREATE INDEX IF NOT EXISTS idx_semantic_cache_embedding_1536 
ON public.ai_semantic_cache USING hnsw (embedding vector_cosine_ops);

-- 3. Função Sniper de correspondência (COM AUTO-UPDATE)
CREATE OR REPLACE FUNCTION match_semantic_cache (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.96,
  match_count int DEFAULT 1
) RETURNS TABLE (response text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  -- 🧬 SOBERANIA: Atualiza as estatísticas no momento do hit
  UPDATE public.ai_semantic_cache
  SET usage_count = usage_count + 1,
      last_hit_at = now()
  WHERE id IN (
      SELECT id FROM public.ai_semantic_cache 
      WHERE 1 - (embedding <=> query_embedding) > match_threshold
      ORDER BY 1 - (embedding <=> query_embedding) DESC
      LIMIT 1
  );

  RETURN QUERY
  SELECT c.response, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM ai_semantic_cache c
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC LIMIT match_count;
END;
$$;

-- 4. Segurança RLS
ALTER TABLE public.ai_semantic_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Cache Read" ON public.ai_semantic_cache;
CREATE POLICY "Public Cache Read" ON public.ai_semantic_cache FOR SELECT USING (true);

COMMIT;
