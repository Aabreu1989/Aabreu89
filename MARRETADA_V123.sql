-- ============================================================
-- 💎 MIRA V2026.GOLD: MARRETADA V123.0 (CALIBRAÇÃO NUCLEAR)
-- ------------------------------------------------------------
-- FUNÇÃO: Forçar Vector(768) e Resurreição da Soberania.
-- PILAR: Calibração de Precisão (Gemini 2.0 / 768D)
-- STATUS: URGENTE - EXECUÇÃO MECÂNICA
-- ============================================================

-- [1] EXTENSÕES E INFRA (BLOQUEIO 768D)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- [2] AS 7 GAVETAS DO CÉREBRO (CATEGORIAS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE knowledge_category AS ENUM (
            'diretrizes_ceo',
            'vistos_aima',
            'saude_sns',
            'trabalho_seg_social',
            'habitacao_nif',
            'hacks_da_tribo',
            'acolhimento_e_apoio'
        );
    END IF;
END $$;

-- [3] MARRETADA NA SABER_IA (COLUNA VECTOR 768)
-- Se a tabela existir, forçamos a transição do calibre.
DO $$ 
BEGIN
    -- Se a tabela não existe, cria. Se existe, limpa para recepção limpa (ou altera coluna)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saber_ia') THEN
        CREATE TABLE public.saber_ia (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            topic TEXT NOT NULL,
            content TEXT NOT NULL,
            category knowledge_category DEFAULT 'diretrizes_ceo',
            source_type TEXT DEFAULT 'ceo',
            sovereignty_score INT DEFAULT 1000,
            embedding vector(768),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Alteramos a coluna se existir para garantir 768D
        ALTER TABLE public.saber_ia ALTER COLUMN embedding TYPE vector(768);
    END IF;
END $$;

-- [4] CACHE SEMÂNTICO (PROTEÇÃO DE CUSTO 768D)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_semantic_cache') THEN
        CREATE TABLE public.ai_semantic_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            prompt_text TEXT UNIQUE,
            response_text TEXT,
            embedding vector(768),
            model_used TEXT,
            metadata JSONB DEFAULT '{}',
            usage_count INT DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_accessed_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        ALTER TABLE public.ai_semantic_cache ALTER COLUMN embedding TYPE vector(768);
    END IF;
END $$;

-- [5] MOTOR DE BUSCA SOBERANO (DIMENSÃO 768)
-- Recriar função com a assinatura correta
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int, text);
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768), -- FORÇADO 768
  match_threshold float DEFAULT 0.18, 
  match_count int DEFAULT 8,
  query_text text DEFAULT ''
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float
) language plpgsql STABLE as $$
begin
  return query select 
    res.id, res.topic, res.content, res.category, res.similarity,
    (res.similarity * res.prestige) as weighted_score
  from (
    select s.id, s.topic, s.content, s.category::text, (1 - (s.embedding <=> query_embedding)) as similarity, 
    (CASE WHEN s.category = 'diretrizes_ceo' THEN 1.6 ELSE 1.2 END) as prestige 
    from public.saber_ia s where s.embedding is not null
    
    union all
    
    select p.id, 'Conteúdo Tribo'::text, p.content, 'hacks_da_tribo'::text, (1 - (p.embedding <=> query_embedding)) as similarity, 1.4 as prestige 
    from public.posts p where p.embedding is not null
  ) as res 
  where res.similarity >= match_threshold 
  order by weighted_score desc limit match_count;
end; $$;

-- [6] PERMISSÕES FINAIS
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;

SELECT 'PATCH SUCCESSFUL: Calibre 768D Ativo' as status;
