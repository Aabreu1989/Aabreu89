-- ============================================================
-- 🦾 MIRA V2026: PILLAR 008 - SUPREMO CONSOLIDATED (GOLD)
-- CEO: Amanda Abreu | Lógica de Soberania e Sincronismo 0ms
-- ============================================================

-- 1. EXTENSÃO E REPARAÇÃO DE SCHEMAS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_badges' AND column_name='description') THEN
        ALTER TABLE public.user_badges ADD COLUMN description TEXT;
    END IF;
END $$;

-- 2. REGISTO DE INFRAESTRUTURA (CONTADORES ATÓMICOS)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS likes_given_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS positive_comments_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reports_confirmed_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS scam_reports_confirmed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS document_downloads INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_courses_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_posts_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS validations_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS service_reviews_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS saber_ia_hits INT DEFAULT 0;

-- 3. SINCRONISMO SUPREMO (0ms UI Load Cache)
-- Esta função colapsa a tabela user_badges num array no perfil para evitar JOINs lentos no Frontend.
CREATE OR REPLACE FUNCTION public.sync_user_badges_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET badges = ARRAY(
        SELECT badge_id 
        FROM public.user_badges 
        WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    )
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_user_badges ON public.user_badges;
CREATE TRIGGER tr_sync_user_badges
AFTER INSERT OR UPDATE OR DELETE ON public.user_badges
FOR EACH ROW EXECUTE FUNCTION public.sync_user_badges_to_profile();

-- 4. MOTOR RAG V3 GOLD (O Cérebro do Império)
DROP FUNCTION IF EXISTS public.match_knowledge_global_v3(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25, 
  match_count int DEFAULT 12
) returns table (
  id uuid, category text, topic text, content text, url text, metadata jsonb, similarity float, weighted_score float
)
language plpgsql as $$
begin
  return query
  select results.id, results.category, results.topic, results.content, results.url, results.metadata, results.similarity, (results.similarity * results.prestige_multiplier) as weighted_score
  from (
    -- Camada 0: CEO Saber IA (A VOZ DA CEO) - 1.5x
    select s.id, 'Soberania' as category, s.topic, s.content, s.url, '{"type": "ceo", "expert": "CEO Amanda Abreu"}'::jsonb as metadata, 1 - (s.embedding <=> query_embedding) as similarity, 1.5 as prestige_multiplier from saber_ia s
    
    union all
    
    -- Camada 1: Especialistas Jurídicos (Vozes de Autoridade) - 1.3x
    select kb.id, kb.category, kb.topic, kb.content, kb.url, kb.metadata, 1 - (kb.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier from knowledge_base kb 
    where (kb.metadata->>'type' = 'legal_opinion' OR kb.metadata->>'expert_name' IS NOT NULL)

    union all
    
    -- Camada 2: Leis e Documentação Oficial - 1.2x
    select kb.id, kb.category, kb.topic, kb.content, kb.url, kb.metadata, 1 - (kb.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier from knowledge_base kb 
    where (kb.metadata->>'type' != 'legal_opinion' AND kb.metadata->>'expert_name' IS NULL)

    union all
    
    -- Camada 3: Posts da Comunidade Verificados - 1.1x
    select p.id, 'Comunidade' as category, p.title as topic, p.content, null as url, '{"type": "vetted"}'::jsonb as metadata, 1 - (p.embedding <=> query_embedding) as similarity, 1.1 as prestige_multiplier from posts p 
    where p.is_verified = true
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

-- 5. JUSTIÇA ATÓMICA: Triggers de Reputação e Histórico
CREATE OR REPLACE FUNCTION public.tr_award_reputation_on_like()
RETURNS TRIGGER AS $$
DECLARE
    post_author UUID;
BEGIN
    -- +1 ponto para quem dá o Like
    INSERT INTO public.gamification_history (user_id, amount, reason, related_id) 
    VALUES (NEW.user_id, 1, 'Like voluntário na Comunidade', NEW.post_id);
    UPDATE public.profiles SET reputation = COALESCE(reputation, 0) + 1, likes_given_count = COALESCE(likes_given_count, 0) + 1 WHERE id = NEW.user_id;

    -- +5 pontos para o autor do post
    SELECT author_id INTO post_author FROM public.posts WHERE id = NEW.post_id;
    IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
        UPDATE public.profiles SET reputation = COALESCE(reputation, 0) + 5 WHERE id = post_author;
        INSERT INTO public.gamification_history (user_id, amount, reason, related_id)
        VALUES (post_author, 5, 'Prémio de Mérito: Like Recebido', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_mira_reputation_on_like ON public.post_votes;
CREATE TRIGGER tr_mira_reputation_on_like AFTER INSERT ON public.post_votes FOR EACH ROW WHEN (NEW.vote_type = 'like') EXECUTE FUNCTION public.tr_award_reputation_on_like();

-- 6. CÉREBRO DE ATRIBUIÇÃO DOS 10 SELOS (V2026.SUPREMO)
-- IDs Alinhados com Frontend: pioneiro, verificado, sentinela, escudo_antiburla, mestre_docs, curador, exemplar, voz_autoridade, guia_local, coracao
CREATE OR REPLACE FUNCTION award_supremo_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- 🏆 1. PIONEIRO MIRA
  IF (SELECT count(*) FROM profiles WHERE created_at <= NEW.created_at) <= 500 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'pioneiro', 'Primeiros 500 membros do Império MIRA.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 2. CONTA VERIFICADA
  IF NEW.is_verified = true THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'verificado', 'Identidade validada pessoalmente pela equipa MIRA.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 3. SENTINELA
  IF NEW.reports_confirmed_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'sentinela', '10+ denúncias confirmadas. Guardião da integridade.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 4. ESCUDO ANTI-BURLA
  IF NEW.scam_reports_confirmed >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'escudo_antiburla', 'Barreira real contra 5 burlas detetadas.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 5. MESTRE DOS DOCUMENTOS
  IF NEW.document_downloads >= 30 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'mestre_docs', 'Especialista em documentação governamental direta.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 6. CURADOR DA COMUNIDADE
  IF NEW.validations_count >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'curador', 'Validou 50+ informações úteis como verdadeiras.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 7. UTILIZADOR EXEMPLAR
  IF (NEW.created_at <= (NOW() - INTERVAL '60 days')) AND NEW.reports_count = 0 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'exemplar', '60 dias de conduta impecável na plataforma.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 8. VOZ DE AUTORIDADE
  IF NEW.verified_posts_count >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'voz_autoridade', 'Posts verificados e selados pela CEO.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 9. GUIA LOCAL
  IF NEW.service_reviews_count >= 15 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'guia_local', 'Especialista em serviços públicos e locais.') ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 10. CORAÇÃO DA COMUNIDADE
  IF NEW.likes_given_count >= 50 AND NEW.positive_comments_count >= 20 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'coracao', 'Alto nível de empatia e apoio emocional aos membros.') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_award_badges_supremo ON public.profiles;
CREATE TRIGGER tr_award_badges_supremo AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION award_supremo_badges();

-- 7. RPCs DE SUPORTE
CREATE OR REPLACE FUNCTION increment_saber_hits(user_id UUID) RETURNS void AS $$
  UPDATE profiles SET saber_ia_hits = COALESCE(saber_ia_hits, 0) + 1 WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;
