-- ============================================================
-- 💎 MIRA V2026.GOLD: RECONSTRUÇÃO MESTRE (LOCKDOWN FINAL)
-- ------------------------------------------------------------
-- CEO: Amanda Abreu | Protocolo Sniper + Antigravity (Deepmind)
-- FOCO: Recuperação Total de 10 Horas de Estruturação
-- ============================================================

-- [1] EXTENSÕES E INFRAESTRUTURA DE VETORES
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- [2] SINCRONIZAÇÃO DE TELÊMETRIA (FIX ERRO 400)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_action') THEN
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'home_module_click';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'chat_session_create';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- [3] PERSISTÊNCIA DE CHAT (REPARAÇÃO "CHAT MUDO")
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

-- RLS PARA CHAT (ACESSO GARANTIDO AO UTILIZADOR)
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages 
FOR ALL USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid())) 
WITH CHECK (EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid()));

-- [4] GATILHOS DE SEGUIDORES (FIX PERSISTÊNCIA v2.3)
CREATE OR REPLACE FUNCTION public.handle_user_follows_v23()
RETURNS trigger AS $$
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

-- Ajuste para ambas as tabelas comuns no workspace (Robustez Total)
DROP TRIGGER IF EXISTS on_user_follow_change_v23 ON public.user_follows;
CREATE TRIGGER on_user_follow_change_v23 AFTER INSERT OR DELETE ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.handle_user_follows_v23();

DROP TRIGGER IF EXISTS on_follows_change_v23 ON public.follows;
CREATE TRIGGER on_follows_change_v23 AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.handle_user_follows_v23();

-- [5] CÉREBRO RAG (SOVEREIGN ENGINE 1.5x)
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
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 1.5 as prestige_multiplier, 'saber_ia' as source_table from public.saber_ia s where s.embedding is not null
    union all
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, CASE WHEN (kb.metadata->>'prestige' = 'elite') THEN 1.3 ELSE 1.2 END as prestige_multiplier, 'knowledge_base' as source_table from public.knowledge_base kb where kb.embedding is not null
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

-- [6] RANKING DIAMOND MASTER REAL (v24.2 - 100k CEO)
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status NOT IN ('banned', 'hidden', 'fraud')
  ORDER BY 
      (CASE 
          WHEN pr.email = 'amandasabreu89@gmail.com' THEN 100000 
          WHEN (pr.email ILIKE '%aima.pt%' OR pr.name ILIKE '%AIMA%') THEN 50000 
          WHEN pr.is_verified = true THEN 15000 
          ELSE 0 
      END) DESC,
      (COALESCE(p.likes, 0) + (SELECT count(*) * 10 FROM public.comments c WHERE (c.posts_id = p.id OR c.post_id = p.id))) DESC,
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [7] PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

-- Success Status
DO $$ 
BEGIN 
  RAISE NOTICE '💎 MIRA RECONSTRUCTION MASTER V2026.GOLD APPLIED SUCCESSFULLY!';
END $$;
