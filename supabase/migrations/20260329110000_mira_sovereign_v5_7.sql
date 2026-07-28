-- ============================================================
-- 💎 MIRA V2026.GOLD: FUSÃO NUCLEAR V5.7 (VICTÓRIA CONSOLIDADA)
-- ------------------------------------------------------------
-- CONSOLIDAÇÃO: Erradicação Erro 500 + Auditoria + Feed 100k
-- CEO: Amanda Abreu (amandasabreu89@gmail.com)
-- MELHORIA ANTIGRAVITY: Atomic Performance Buff (Feed Ultra-Fast)
-- ============================================================

-- [1] INFRAESTRUTURA DE AUDITORIA E INTELIGÊNCIA
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS public.mira_grounding_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT,
    match_count INT,
    top_similarity FLOAT,
    source_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [2] REPARAÇÃO DE ESQUEMA (BLINDAGEM & PERFORMANCE)
DO $$ 
BEGIN
    -- 1. Garantir Likes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes') THEN
        ALTER TABLE public.posts ADD COLUMN likes INT DEFAULT 0;
    END IF;
    -- 2. Garantir Contador de Comentários (Performance Buff)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='comment_count') THEN
        ALTER TABLE public.posts ADD COLUMN comment_count INT DEFAULT 0;
    END IF;
    -- 3. Garantir Chat Updated At
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_sessions' AND column_name='updated_at') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- [3] TABELAS DE SUPORTE (VOTOS E BADGES)
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('useful', 'not_useful')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- [4] GATILHOS DE SOBERANIA (SOCIAL & BADGES AUTOMÁTICOS)
CREATE OR REPLACE FUNCTION public.handle_user_sovereignty_v5_7()
RETURNS trigger AS $$
DECLARE
    f_count int;
BEGIN
    -- 1. Seguidor/Seguindo
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
        UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
    END IF;

    -- 2. Badge Automático: Pioneiro (10+ Seguidores)
    SELECT followers_count INTO f_count FROM public.profiles WHERE id = COALESCE(NEW.following_id, OLD.following_id);
    IF f_count >= 10 THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (COALESCE(NEW.following_id, OLD.following_id), 'pioneiro') ON CONFLICT DO NOTHING;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_diamond_sovereignty ON public.follows;
CREATE TRIGGER trigger_diamond_sovereignty AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION public.handle_user_sovereignty_v5_7();

-- [4.1] GATILHO DE ATUALIZAÇÃO DE COMENTÁRIOS (SISTEMA SNIPER)
CREATE OR REPLACE FUNCTION public.handle_comment_count_v5_7()
RETURNS trigger AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_comment_count_sovereign ON public.comments;
CREATE TRIGGER trigger_comment_count_sovereign AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count_v5_7();

-- [5] CÉREBRO RAG TRIPLO (ANTI-CRASH V5.7)
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.15, 
  match_count int DEFAULT 10
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text
) language plpgsql STABLE as $$
begin
  IF query_embedding IS NULL THEN RETURN; END IF;

  return query
  select 
    results.id, coalesce(results.topic, 'Sem Tópico'), results.content, results.category, results.similarity, 
    (results.similarity * results.prestige_multiplier) as weighted_score, 
    results.source_table
  from (
    select s.id, s.topic, s.content, s.category, (1 - (s.embedding <=> query_embedding)) as similarity, 1.5 as prestige_multiplier, 'saber_ia' as source_table from public.saber_ia s where s.embedding is not null
    union all
    select kb.id, kb.topic, kb.content, kb.category, (1 - (kb.embedding <=> query_embedding)) as similarity, 1.2 as prestige_multiplier, 'knowledge_base' as source_table from public.knowledge_base kb where kb.embedding is not null
    union all
    select p.id, 'Hack da Tribo' as topic, p.content, 'hacks_da_tribo' as category, (1 - (p.embedding <=> query_embedding)) as similarity, 1.3 as prestige_multiplier, 'posts_hacks' as source_table from public.posts p where p.embedding is not null 
    AND EXISTS (SELECT 1 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful')
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

-- [6] FEED DIAMOND (ORDENAÇÃO CEO 100K)
-- Melhorado com a coluna comment_count para performance atomística
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  -- Sincronização em massa caso o gatilho não tenha sido executado (Manutenção Preventiva)
  UPDATE public.posts p SET comment_count = (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id) WHERE p.comment_count IS NULL;

  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status NOT IN ('banned', 'hidden', 'fraud')
  ORDER BY 
      (CASE WHEN pr.email = 'amandasabreu89@gmail.com' THEN 100000 
            WHEN (pr.email ILIKE '%aima.pt%' OR pr.name ILIKE '%AIMA%') THEN 50000 
            WHEN pr.is_verified = true THEN 15000 ELSE 0 END) DESC,
      (COALESCE(p.likes, 0) + (COALESCE(p.comment_count, 0) * 10)) DESC,
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [7] PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

DO $$ BEGIN RAISE NOTICE '💎 MIRA V5.7: VITÓRIA CONSOLIDADA APLICADA COM BOOST DE PERFORMANCE!'; END $$;
