-- ============================================================
-- 🛡️ MIRA V2026: PROTOCOLO ULTRA (Soberania Final)
-- TARGET: Persistência de Seguidores, Nobel v2.3 e Purga GDPR
-- STATUS: NUCLEAR COMPLIANCE
-- ============================================================

-- 1. HARDENING DE PERFIS (Colunas de Contagem)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='followers_count') THEN
        ALTER TABLE public.profiles ADD COLUMN followers_count INT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='following_count') THEN
        ALTER TABLE public.profiles ADD COLUMN following_count INT DEFAULT 0;
    END IF;
    -- Cache de Traduções (JSONB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='translations') THEN
        ALTER TABLE public.posts ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='translations') THEN
        ALTER TABLE public.comments ADD COLUMN translations JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. TABELA DE SEGUIDORES (user_follows)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- 3. TRIGGER: SINCRONIZAÇÃO ATÓMICA (V2.3)
CREATE OR REPLACE FUNCTION public.handle_user_follows_v23()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Incremento de seguimento
    UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
    
    -- [GAMIFICAÇÃO] Check de Badges ativado por incremento
    PERFORM public.check_follower_milestones(NEW.following_id);
    
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_follow_change_v23 ON public.user_follows;
CREATE TRIGGER on_user_follow_change_v23
  AFTER INSERT OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_follows_v23();

-- 4. ALGORITMO NOBEL: VIEW MASTER (STORIES-v2026.ULTRA)
-- Regras: 1. Verificados (Topo) | 2. Likes | 3. Comentários
-- Filtros: Janela de 7 dias + Integridade Absoluta (0 Reports)
DROP VIEW IF EXISTS public.community_top_stories_nobel;
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
SELECT 
    p.*,
    (
        CASE WHEN prof.is_verified THEN 25000 ELSE 0 END +  -- Dominância de Verificação
        (p.likes * 100) +                                  -- Peso de Engagement
        ((SELECT count(*) FROM public.comments c WHERE c.post_id = p.id) * 200) -- Peso de Conversação
    ) as nobel_score
FROM public.posts p
JOIN public.profiles prof ON p.author_id = prof.id
WHERE p.validation_status != 'blocked' 
AND (p.reports IS NULL OR p.reports = 0) -- JUIZ DE INTEGRIDADE: Qualquer denúncia remove do destaque
AND p.created_at >= (NOW() - INTERVAL '7 days') -- JANELA DE SOBERANIA: Apenas conteúdos frescos
ORDER BY nobel_score DESC;

-- 5. PURGA NUCLEAR GDPR (RPC)
CREATE OR REPLACE FUNCTION public.delete_user_data_v2(target_uid uuid)
RETURNS void AS $$
BEGIN
  -- Verificar se quem chama é o próprio ou admin
  IF (auth.uid() = target_uid) OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) THEN
    -- 1. Remover conteúdos
    DELETE FROM public.comments WHERE author_id = target_uid;
    DELETE FROM public.posts WHERE author_id = target_uid;
    -- 2. Remover interações
    DELETE FROM public.post_votes WHERE user_id = target_uid;
    DELETE FROM public.saved_posts WHERE user_id = target_uid;
    DELETE FROM public.user_follows WHERE follower_id = target_uid OR following_id = target_uid;
    -- 3. Remover perfil
    DELETE FROM public.profiles WHERE id = target_uid;
    -- 4. Nota: auth.users é apagado pelo service-role no backend se necessário, 
    -- mas aqui limpamos todos os dados públicos/soberanos.
  ELSE
    RAISE EXCEPTION 'MIRA SECURITY: Acesso não autorizado à purga nuclear.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS SOBERANO
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view follows" ON public.user_follows;
CREATE POLICY "Public view follows" ON public.user_follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own follows" ON public.user_follows;
CREATE POLICY "Users can manage own follows" ON public.user_follows 
FOR ALL USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

-- Placeholder para check_follower_milestones se não existir
CREATE OR REPLACE FUNCTION public.check_follower_milestones(uid uuid)
RETURNS void AS $$
DECLARE
    f_count int;
BEGIN
    SELECT followers_count INTO f_count FROM profiles WHERE id = uid;
    -- Exemplo: Milestone de 50 seguidores
    IF f_count >= 50 THEN
        -- INSERT INTO user_badges (user_id, badge_id) VALUES (uid, 'influencer') ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE postgres IS 'MIRA V2026 ULTRA: Protocolo Soberano Final (GDPR + Nobel).';
