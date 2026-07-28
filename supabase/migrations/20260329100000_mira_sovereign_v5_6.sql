-- ============================================================
-- 💎 MIRA V2026.GOLD: MISSÃO SOBERANA V5.6 (FINAL LOCKDOWN)
-- ------------------------------------------------------------
-- CONSOLIDAÇÃO: Fim definitivo dos Erros 400/500
-- FIX: Zero Ambiguidade em 'post_id' (Comunidade)
-- FIX: Remoção de 'p.category' (Inexistente) no RAG
-- FIX: Recriação de 'post_votes' (Estabilidade de Ranking)
-- AUTORIDADE: CEO Amanda Abreu (100.000 pts)
-- ============================================================

-- [1] REPARAÇÃO DE INFRAESTRUTURA (ANTI-APAGÃO)
DO $$ 
BEGIN
    -- 1. Garantir coluna 'likes' nos posts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes') THEN
        ALTER TABLE public.posts ADD COLUMN likes INT DEFAULT 0;
    END IF;

    -- 2. Garantir coluna 'updated_at' nas sessões de chat
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_sessions' AND column_name='updated_at') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. RECRIAR TABELAS DE VOTOS E CHAT (CONSOLIDAÇÃO)
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('useful', 'not_useful')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_sovereign BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [2] GATILHOS DE SOBERANIA (MILSTONE V5.6)
CREATE OR REPLACE FUNCTION public.handle_user_sovereignty_v5_6()
RETURNS trigger AS $$
DECLARE
    f_count int;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_diamond_sovereignty ON public.follows;
CREATE TRIGGER trigger_diamond_sovereignty AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.handle_user_sovereignty_v5_6();

-- [3] CÉREBRO RAG TRIPLO (HYPER-RESILIENT)
-- FIX: p.category removido (usando texto fixo); post_id explicitado.
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
    -- Fonte 1: Saber IA (1.5x)
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 1.5 as prestige_multiplier, 'saber_ia' as source_table from public.saber_ia s where s.embedding is not null
    union all
    -- Fonte 2: Knowledge Base (1.2x)
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier, 'knowledge_base' as source_table from public.knowledge_base kb where kb.embedding is not null
    union all
    -- Fonte 3: Hacks (1.3x) - Categoria Manual para evitar Erro 500
    select p.id, 'Hack da Tribo' as topic, p.content, 'hacks_da_tribo' as category, 1 - (p.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier, 'posts_hacks' as source_table from public.posts p where p.embedding is not null 
    AND EXISTS (SELECT 1 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful')
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

-- [4] FEED DIAMOND (ZERO AMBIGUIDADE)
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status NOT IN ('banned', 'hidden', 'fraud')
  ORDER BY 
      (CASE WHEN pr.email = 'amandasabreu89@gmail.com' THEN 100000 
            WHEN (pr.email ILIKE '%aima.pt%' OR pr.name ILIKE '%AIMA%') THEN 50000 
            WHEN pr.is_verified = true THEN 15000 ELSE 0 END) DESC,
      (COALESCE(p.likes, 0) + (SELECT count(*) * 10 FROM public.comments c WHERE c.post_id = p.id)) DESC, -- Explicit column fix
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [5] PERMISSÕES E SINCROZINAÇÃO
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

DO $$ 
BEGIN 
  RAISE NOTICE '💎 MIRA V5.6: MISSÃO SOBERANA CONCLUÍDA. SISTEMA BLINDADO.';
END $$;
