-- ============================================================
-- 🛡️ MIRA V2026.ULTRA: INTELIGÊNCIA SINTÉTICA HÍBRIDA (V2.0-NOBEL-FIX)
-- ------------------------------------------------------------
-- 1. Ativação de PGVECTOR (768D) e Extensões de Performance
-- 2. Criação da Tabela expert_columns (Soberania Técnica)
-- 3. Restauro de Categorias ENUM (Estrutura RAG)
-- 4. Vetorização da Camada Social (Hacks da Tribo em public.posts)
-- 5. RPC de Busca Híbrida v2 (HNSW + Keyword + Multi-Source Synthesis)
-- 6. Trigger de Soberania Amanda Abreu (100k) e Pesos Nobel
-- ============================================================

-- [1] EXTENSÕES DE INTELIGÊNCIA E PERFORMANCE
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- [2] CATEGORIAS FIXAS (O CÉREBRO ORGANIZADO)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE knowledge_category AS ENUM (
            'vistos_aima', 
            'saude_sns', 
            'trabalho_seg_social', 
            'habitacao_nif', 
            'hacks_da_tribo', 
            'acolhimento_e_apoio',
            'diretrizes_ceo'
        );
    END IF;
END $$;

-- [3] TABELA DE ESPECIALISTAS (NEWSROOM DATA - 768D)
CREATE TABLE IF NOT EXISTS public.expert_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id),
    author_name TEXT,
    title TEXT,
    content TEXT,
    category knowledge_category DEFAULT 'vistos_aima',
    embedding vector(768), -- Gemini text-embedding-004
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [4] UPDATE NAS TABELAS CORE (ADICIONAR VETORES E METADADOS)

-- Base de Conhecimento (Saber IA / Diretrizes CEO)
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS category knowledge_category DEFAULT 'vistos_aima';
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'oficial';
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS sovereignty_score INT DEFAULT 1000;

-- Tabela de Posts (Para que os "Hacks" sejam pesquisáveis semanticamente)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(768);

-- [5] INDEXAÇÃO HNSW (ULTRA-PERFORMANCE PARA BUSCA SINTÉTICA)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding_hnsw 
ON public.knowledge_base USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_expert_embedding_hnsw 
ON public.expert_columns USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_posts_embedding_hnsw 
ON public.posts USING hnsw (embedding vector_cosine_ops);

-- [6] RPC: BUSCA HÍBRIDA SINTÉTICA V2.0-NOBEL (SNIPER CORE)
-- Síntese de 3 Fontes: Saber IA, Especialistas e Hacks da Comunidade
CREATE OR REPLACE FUNCTION public.mira_hybrid_search_v2(
    query_text TEXT,
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 12
)
RETURNS TABLE (
    content TEXT,
    source_type TEXT,
    category TEXT,
    sovereignty_score INT,
    combined_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    -- Fonte 1: Base de Conhecimento (Saber IA / Diretrizes CEO)
    SELECT 
        k.content, 
        k.source_type, 
        k.category::TEXT, 
        k.sovereignty_score,
        ((1 - (k.embedding <=> query_embedding)) * 0.7 + 
        ts_rank_cd(to_tsvector('portuguese', unaccent(k.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3)::FLOAT as combined_score
    FROM public.knowledge_base k
    WHERE (1 - (k.embedding <=> query_embedding)) > match_threshold
    
    UNION ALL

    -- Fonte 2: Colunas de Especialistas (Newsroom)
    SELECT 
        e.content, 
        'expert' as source_type, 
        e.category::TEXT, 
        6000 as sovereignty_score,
        ((1 - (e.embedding <=> query_embedding)) * 0.7 + 
        ts_rank_cd(to_tsvector('portuguese', unaccent(e.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3)::FLOAT as combined_score
    FROM public.expert_columns e
    WHERE (1 - (e.embedding <=> query_embedding)) > match_threshold

    UNION ALL

    -- Fonte 3: Posts da Comunidade (Hacks da Tribo > 50 votos)
    SELECT 
        p.content, 
        'hack' as source_type, 
        'hacks_da_tribo' as category, 
        15000 as sovereignty_score,
        ((1 - (p.embedding <=> query_embedding)) * 0.7 + 
        ts_rank_cd(to_tsvector('portuguese', unaccent(p.content)), plainto_tsquery('portuguese', unaccent(query_text))) * 0.3)::FLOAT as combined_score
    FROM public.posts p
    WHERE (1 - (p.embedding <=> query_embedding)) > match_threshold
    AND (
        SELECT count(*) 
        FROM public.post_votes v 
        WHERE v.post_id = p.id AND v.vote_type = 'useful'
    ) > 50

    ORDER BY sovereignty_score DESC, combined_score DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [7] TRIGGER DE SOBERANIA (HIERARQUIA NOBEL AMANDA ABREU)
CREATE OR REPLACE FUNCTION public.apply_sovereign_logic_v2_0()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.source_type = 'ceo' OR NEW.content ILIKE '%Amanda Abreu%' THEN 
        NEW.sovereignty_score := 100000;
    ELSIF NEW.category = 'hacks_da_tribo' OR NEW.source_type = 'hack' THEN 
        NEW.sovereignty_score := 15000;
    ELSIF NEW.source_type = 'oficial' OR NEW.content ILIKE '%AIMA%' THEN 
        NEW.sovereignty_score := 50000;
    ELSIF NEW.source_type = 'expert' THEN
        NEW.sovereignty_score := 6000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sovereign_v2_0 ON public.knowledge_base;
CREATE TRIGGER tr_sovereign_v2_0
BEFORE INSERT OR UPDATE ON public.knowledge_base
FOR EACH ROW EXECUTE FUNCTION public.apply_sovereign_logic_v2_0();

-- [8] PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.mira_hybrid_search_v2 TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
