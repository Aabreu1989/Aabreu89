-- ============================================================
-- 🦾 MIRA V2026: PILLAR 014 - TAXONOMIA DE SOBERANIA (V4 GOLD)
-- CEO: Amanda Rodrigues | Motor Nobel 768-D
-- ============================================================

-- 1. BLINDAGEM DA TABELA SABER IA (As 8 Categorias Obrigatórias)
DO $$ 
BEGIN 
    ALTER TABLE public.saber_ia DROP CONSTRAINT IF EXISTS saber_ia_category_check;
    ALTER TABLE public.saber_ia ADD CONSTRAINT saber_ia_category_check 
    CHECK (category IN (
        'AIMA Imigração', 
        'Diretriz CEO', 
        'Trabalho e Emprego', 
        'Saúde (SNS)', 
        'Direitos e Deveres', 
        'Segurança Social', 
        'Educação e Vistos', 
        'Habitação'
    ));
END $$;

-- 2. TRONO EDITORIAL: NEWSROOM IMPERIAL
CREATE TABLE IF NOT EXISTS public.newsroom_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Newsroom Imperial',
    author TEXT DEFAULT 'MIRA Editorial',
    metadata JSONB DEFAULT '{"prestige": "editorial", "type": "long_form"}'::jsonb,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas em caso de tabela já existente (idempotente)
ALTER TABLE public.newsroom_articles ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'MIRA Editorial';
ALTER TABLE public.newsroom_articles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{"prestige": "editorial", "type": "long_form"}'::jsonb;
ALTER TABLE public.newsroom_articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.newsroom_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Newsroom" ON public.newsroom_articles;
CREATE POLICY "Public Read Newsroom" ON public.newsroom_articles FOR SELECT USING (true);

-- Garantir coluna embedding nos cursos (para futura geração de vetores)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. MOTOR RAG V4 GOLD (MULTI-FONTE PONDERADO)
DROP FUNCTION IF EXISTS public.match_knowledge_global_v3(vector, float, int);
DROP FUNCTION IF EXISTS public.match_knowledge_global_v4(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_global_v4 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25, 
  match_count int DEFAULT 15
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text
) language plpgsql as $$
begin
  return query
  select results.id, results.topic, results.content, results.category, results.similarity, (results.similarity * results.prestige_multiplier) as weighted_score, results.source_table
  from (
    -- Camada Suprema: SABER IA (A VOZ DA AMANDA)
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 
    CASE 
        WHEN s.category = 'Diretriz CEO' THEN 1.5
        ELSE 1.3
    END as prestige_multiplier, 
    'saber_ia' as source_table from saber_ia s
    
    union all
    
    -- Camada Editorial: NEWSROOM IMPERIAL (Manuais e Guias) - 1.3x
    select nr.id, nr.title as topic, nr.content, nr.category, 1 - (nr.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier, 'newsroom_articles' as source_table from newsroom_articles nr

    union all
    
    -- Camada Legal: KNOWLEDGE BASE (Leis Oficiais) - 1.2x
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier, 'knowledge_base' as source_table from knowledge_base kb 

    union all
    
    -- Camada Educativa: ACADEMY (Cursos IEFP) - 1.1x
    select c.id, c.title as topic, c.description as content, 'Academy' as category, 1 - (c.embedding <=> query_embedding) as similarity, 1.1 as prestige_multiplier, 'courses' as source_table from courses c
    where c.embedding is not null

    union all
    
    -- Camada Comunitária: POSTS VERIFICADOS - 1.0x
    select p.id, p.title as topic, p.content, 'Comunidade' as category, 1 - (p.embedding <=> query_embedding) as similarity, 1.0 as prestige_multiplier, 'posts' as source_table from posts p 
    where p.is_verified = true
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

COMMENT ON FUNCTION public.match_knowledge_global_v4 IS 'MIRA V2026.GOLD: Motor 360 — 5 Camadas, 8 Categorias Atómicas, Newsroom Imperial.';
