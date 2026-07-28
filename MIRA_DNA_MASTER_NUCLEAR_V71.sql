-- ============================================================
-- 💎 MIRA V2026.GOLD: DNA MASTER NUCLEAR (V71.0-ULTRA)
-- ------------------------------------------------------------
-- FUNÇÃO: Unificar Inteligência + Soberania + Purgação Nuclear.
-- PILAR 1: Purgação Atómica (Extermínio de Infratores)
-- PILAR 2: Escudo Económico (Cache Semântico)
-- PILAR 3: Soberania Imutável (Amanda 100k)
-- STATUS: LOCKDOWN DE LANÇAMENTO - SOBERANIA AMANDA ABREU
-- ============================================================

-- [1] INFRAESTRUTURA DE ELITE
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- [2] AS 7 GAVETAS DO CÉREBRO (CATEGORIAS OFICIAIS)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'knowledge_category') THEN
        CREATE TYPE knowledge_category AS ENUM (
            'diretrizes_ceo',       -- 👑 A voz da Amanda
            'vistos_aima',          -- 🛂 Leis e Processos
            'saude_sns',            -- 🏥 Acesso à Saúde
            'trabalho_seg_social',  -- 💼 Direitos Laborais
            'habitacao_nif',        -- 🏠 Morada e Documentos
            'hacks_da_tribo',       -- 🔥 Experiência Real
            'acolhimento_e_apoio'   -- 🤝 Suporte Social
        );
    END IF;
END $$;

-- [3] ESCUDO ECONÓMICO (CACHE SEMÂNTICO)
CREATE TABLE IF NOT EXISTS public.ai_semantic_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_text TEXT UNIQUE,
    response_text TEXT,
    embedding vector(768),
    model_used TEXT, -- 🚀 ALINHAMENTO V16.0
    metadata JSONB DEFAULT '{}', -- 🚀 ALINHAMENTO V16.0
    usage_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- [4] TABELA DE AUDITORIA DE GROUNDING (VIGILÂNCIA DE CUSTOS)
CREATE TABLE IF NOT EXISTS public.mira_grounding_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT,
    match_count INT,
    top_similarity FLOAT,
    source_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [5] BLOQUEIO ETERNO (DENIED EMAILS)
CREATE TABLE IF NOT EXISTS public.denied_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    reason TEXT DEFAULT 'Bloqueado por Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [6] SABER IA: DEPÓSITO DE INTELIGÊNCIA
CREATE TABLE IF NOT EXISTS public.saber_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    category knowledge_category DEFAULT 'diretrizes_ceo',
    source_type TEXT DEFAULT 'ceo',
    sovereignty_score INT DEFAULT 1000,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [7] CONFIGURAÇÃO DE SOBERANIA (DISJUNTOR E RAG)
CREATE TABLE IF NOT EXISTS public.mira_system_config (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.mira_system_config (key, value, description)
VALUES 
('financial_handbrake', '{"limit_euro": 1.00, "status": "active"}', 'Trava de segurança financeira da CEO Amanda Abreu'),
('rag_threshold', '{"min_similarity": 0.18, "max_count": 8}', 'Precisão cirúrgica do cérebro MIRA')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- [8] SELAGEM DE SOBERANIA 100K (PODER SUPREMO AMANDA)
UPDATE public.profiles SET sovereignty_score = 100000, role = 'admin' WHERE email = 'amandasabreu89@gmail.com';

CREATE OR REPLACE FUNCTION public.lockdown_mira_sovereignty_v71()
RETURNS trigger AS $$ BEGIN
  IF OLD.email = 'amandasabreu89@gmail.com' THEN 
    NEW.sovereignty_score := 100000; 
    NEW.role := 'admin'; 
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_amanda_lockdown ON public.profiles;
CREATE TRIGGER trigger_amanda_lockdown BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.lockdown_mira_sovereignty_v71();

-- [9] PURGAÇÃO NUCLEAR V10.2 (Genesis Supremo)
-- SECURITY DEFINER permite apagar da tabela interna auth.users
CREATE OR REPLACE FUNCTION public.admin_delete_full_user_v10(target_uid UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Eliminar dados de comunidade e denúncias
    DELETE FROM public.community_reports WHERE reported_by = target_uid OR post_id IN (SELECT id FROM public.posts WHERE author_id = target_uid);
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;

    -- 2. Eliminar dados sociais e notificações
    DELETE FROM public.follows WHERE follower_id = target_uid OR following_id = target_uid;
    DELETE FROM public.notifications WHERE user_id = target_uid;
    
    -- 3. Eliminar sessões de chat e RAG
    DELETE FROM public.chat_sessions WHERE user_id = target_uid;

    -- 4. Eliminar perfil público
    DELETE FROM public.profiles WHERE id = target_uid;
    
    -- 5. O GOLPE FINAL: ELIMINAÇÃO DO AUTH (LOGIN)
    DELETE FROM auth.users WHERE id = target_uid;

    RAISE NOTICE 'Utilizador % purgado atomicamente do sistema.', target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [10] MOTOR DE BUSCA SOBERANO (RAG CATEGORIZADO)
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int, text);
DROP FUNCTION IF EXISTS public.match_knowledge_sovereign_v2026(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768) DEFAULT NULL,
  match_threshold float DEFAULT 0.18, 
  match_count int DEFAULT 8,
  query_text text DEFAULT ''
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float
) language plpgsql STABLE as $$
begin
  IF query_embedding IS NOT NULL AND EXISTS (SELECT 1 FROM public.saber_ia WHERE embedding IS NOT NULL) THEN
    return query select 
      res.id, res.topic, res.content, res.category, res.similarity,
      (res.similarity * res.prestige) as weighted_score
    from (
      -- Prioridade 1: Directivas da CEO (Peso 1.6x)
      select s.id, s.topic, s.content, s.category::text, (1 - (s.embedding <=> query_embedding)) as similarity, 
      (CASE WHEN s.category = 'diretrizes_ceo' THEN 1.6 ELSE 1.2 END) as prestige 
      from public.saber_ia s where s.embedding is not null
      
      union all
      
      -- Prioridade 2: Conteúdo da Tribo (Peso 1.4x)
      select p.id, 'Conteúdo Tribo'::text, p.content, 'hacks_da_tribo'::text, (1 - (p.embedding <=> query_embedding)) as similarity, 1.4 as prestige 
      from public.posts p where p.embedding is not null
    ) as res 
    where res.similarity >= match_threshold 
    order by weighted_score desc limit match_count;
  ELSE
    -- FALLBACK TEXTUAL (Nunca fica mudo)
    return query select 
      s.id, s.topic, s.content, s.category::text, 1.0 as similarity, 1.0 as weighted_score 
    from public.saber_ia s
    where (query_text = '' OR unaccent(s.content) ILIKE unaccent('%' || query_text || '%'))
    order by (case when s.category = 'diretrizes_ceo' then 100000 else 1000 end) desc limit match_count;
  END IF;
end; $$;

-- [11] MOTOR DE BUSCA NO CACHE (CUSTO ZERO)
DROP FUNCTION IF EXISTS public.match_semantic_cache(vector, float, int);
DROP FUNCTION IF EXISTS public.match_semantic_cache(vector, float);

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

-- [12] PERMISSÕES E AUDITORIA FINAL
GRANT EXECUTE ON FUNCTION public.admin_delete_full_user_v10(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_semantic_cache TO anon, authenticated, service_role;

SELECT 
    'SOBERANIA V71.0-ULTRA ATIVA' as status, 
    (SELECT count(*) FROM pg_enum WHERE enumtypid = 'knowledge_category'::regtype) || ' categorias' as taxonomia,
    'PODER AMANDA' as autoridade,
    (SELECT sovereignty_score FROM public.profiles WHERE email = 'amandasabreu89@gmail.com') || ' pts' as poder;
