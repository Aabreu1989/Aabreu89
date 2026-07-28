-- ============================================================
-- 💎 MIRA V2026.GOLD: MARRETADA V124.0 (MASTER CALIBRATION)
-- ------------------------------------------------------------
-- FUNÇÃO: Forçar Vector(768) no Disco e Unificar Inteligência.
-- PILAR: Calibração de Precisão (Gemini 2.0 / 768D)
-- STATUS: URGENTE - EXECUÇÃO MANUAL (SQL EDITOR)
-- ============================================================

-- [1] EXTENSÕES E INFRA (BLOQUEIO 768D)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- [2] CATEGORIAS (7 GAVETAS DO CÉREBRO)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE knowledge_category AS ENUM (
            'diretrizes_ceo', 'vistos_aima', 'saude_sns', 'trabalho_seg_social', 
            'habitacao_nif', 'hacks_da_tribo', 'acolhimento_e_apoio'
        );
    END IF;
END $$;

-- [3] MARRETADA NA SABER_IA (DIMENSÃO 768)
-- Alteramos a coluna para garantir que o calibre 768D seja aceite.
ALTER TABLE public.saber_ia ALTER COLUMN embedding TYPE vector(768);

-- [4] CACHE SEMÂNTICO (768D)
ALTER TABLE public.ai_semantic_cache ALTER COLUMN embedding TYPE vector(768);

-- [5] MOTOR DE BUSCA SOBERANO (RE-CALIBRADO)
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int, text);
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768),
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

-- [6] PERMISSÕES E VERIFICAÇÃO FINAL
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;

SELECT 'PATCH SUCCESSFUL: Calibre 768D Ativo no disco' as status;
