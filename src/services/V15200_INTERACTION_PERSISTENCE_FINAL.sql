-- 👑 MIRA SOBERANIA V2026.GOLD: PERSISTÊNCIA TOTAL DE INTERAÇÕES
-- OBJETIVO: Sincronizar Likes, Votos de Útil e Falso entre as tabelas 'post_votes' e 'posts'.

-- 1. Garantir que as colunas existem na tabela posts
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='useful_votes') THEN
        ALTER TABLE public.posts ADD COLUMN useful_votes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='fake_votes') THEN
        ALTER TABLE public.posts ADD COLUMN fake_votes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes') THEN
        ALTER TABLE public.posts ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Criar a função de sincronização de interações
CREATE OR REPLACE FUNCTION public.sync_post_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Se um voto foi ADICIONADO
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.vote_type = 'like') THEN
            UPDATE public.posts SET likes = likes + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes = useful_votes + 1 WHERE id = NEW.post_id;
        ELSIF (NEW.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes = fake_votes + 1 WHERE id = NEW.post_id;
        END IF;
        
    -- Se um voto foi REMOVIDO
    ELSIF (TG_OP = 'DELETE') THEN
        IF (OLD.vote_type = 'like') THEN
            UPDATE public.posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'useful') THEN
            UPDATE public.posts SET useful_votes = GREATEST(0, useful_votes - 1) WHERE id = OLD.post_id;
        ELSIF (OLD.vote_type = 'fake') THEN
            UPDATE public.posts SET fake_votes = GREATEST(0, fake_votes - 1) WHERE id = OLD.post_id;
        END IF;
        
    -- Se o tipo de voto MUDOU (ex: de VERDADEIRO para FALSO)
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.vote_type <> NEW.vote_type) THEN
            -- Decrementar o antigo
            IF (OLD.vote_type = 'like') THEN UPDATE public.posts SET likes = GREATEST(0, likes - 1) WHERE id = OLD.post_id;
            ELSIF (OLD.vote_type = 'useful') THEN UPDATE public.posts SET useful_votes = GREATEST(0, useful_votes - 1) WHERE id = OLD.post_id;
            ELSIF (OLD.vote_type = 'fake') THEN UPDATE public.posts SET fake_votes = GREATEST(0, fake_votes - 1) WHERE id = OLD.post_id;
            END IF;
            
            -- Incrementar o novo
            IF (NEW.vote_type = 'like') THEN UPDATE public.posts SET likes = likes + 1 WHERE id = NEW.post_id;
            ELSIF (NEW.vote_type = 'useful') THEN UPDATE public.posts SET useful_votes = useful_votes + 1 WHERE id = NEW.post_id;
            ELSIF (NEW.vote_type = 'fake') THEN UPDATE public.posts SET fake_votes = fake_votes + 1 WHERE id = NEW.post_id;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicar o Trigger na tabela post_votes
DROP TRIGGER IF EXISTS trigger_sync_post_interactions ON public.post_votes;
CREATE TRIGGER trigger_sync_post_interactions
AFTER INSERT OR UPDATE OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_interaction_counts();

-- 4. Re-sincronizar os números atuais para garantir integridade total imediata
UPDATE public.posts p
SET 
  likes = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like'),
  useful_votes = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful'),
  fake_votes = (SELECT count(*) FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake');

-- 5. Atualizar a RPC do Feed para retornar estas colunas
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v24(p_limit integer, p_offset integer)
RETURNS SETOF jsonb AS $$
BEGIN
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', p.id,
    'author_id', p.author_id,
    'content', p.content,
    'category', p.category,
    'background_image', p.background_image,
    'validation_status', p.validation_status,
    'created_at', p.created_at,
    'likes', COALESCE(p.likes, 0),
    'useful_votes', COALESCE(p.useful_votes, 0),
    'fake_votes', COALESCE(p.fake_votes, 0),
    'nobel_score', p.nobel_score,
    'author', jsonb_build_object(
      'id', pr.id,
      'name', pr.name,
      'avatar_url', pr.avatar_url,
      'is_verified', pr.is_verified,
      'role', pr.role
    )
  )
  FROM public.posts p
  JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status != 'blocked'
  ORDER BY p.nobel_score DESC, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
