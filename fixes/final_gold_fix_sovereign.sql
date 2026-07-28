-- ============================================================
-- 💎 MIRA V2026.GOLD: REMEDIAÇÃO CIRÚRGICA (FINAL FIX)
-- ------------------------------------------------------------
-- MOTIVO: O SQL Anterior falhou ao inserir colunas em tabelas existentes.
-- FIX: Forçar 'likes' em posts e 'updated_at' em chat_sessions.
-- ============================================================

-- 1. REPARAÇÃO DE ESQUEMA (FORÇADA)
DO $$ 
BEGIN
    -- Posts: Garantir coluna 'likes' para o Ranking Nobel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes') THEN
        ALTER TABLE public.posts ADD COLUMN likes INT DEFAULT 0;
    END IF;

    -- Chat Sessions: Garantir coluna 'updated_at' para Persistência
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_sessions' AND column_name='updated_at') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 2. RE-LIGAÇÃO DO CÉREBRO RAG (V5.1 RECONCILIADA)
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.22, 
  match_count int DEFAULT 12
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text
) language plpgsql STABLE as $$
begin
  return query
  select results.id, results.topic, results.content, results.category, results.similarity, (results.similarity * results.prestige_multiplier) as weighted_score, results.source_table
  from (
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 1.5 as prestige_multiplier, 'saber_ia' as source_table from public.saber_ia s where s.embedding is not null
    union all
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier, 'knowledge_base' as source_table from public.knowledge_base kb where kb.embedding is not null
    union all
    -- Hacks: Posts úteis (Mais robusto contra nulos)
    select p.id, 'Hack da Tribo' as topic, p.content, p.category, 1 - (p.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier, 'posts_hacks' as source_table 
    from public.posts p where p.embedding is not null 
    AND (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful') > 1 -- Baixei threshold de 50 para 1 para facilitar testes iniciais
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

-- 3. RE-LIGAÇÃO DO FEED (100K CEO)
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
      (COALESCE(p.likes, 0) + (SELECT count(*) * 10 FROM public.comments c WHERE (c.posts_id = p.id OR c.post_id = p.id))) DESC,
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.match_knowledge_sovereign_v2026 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

DO $$ 
BEGIN 
  RAISE NOTICE '💎 MIRA REMEDIAÇÃO FINAL V2026.GOLD APLICADA COM SUCESSO!';
END $$;
