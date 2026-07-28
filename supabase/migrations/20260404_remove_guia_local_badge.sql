-- 🦾 MIRA V2026: PURGE 'GUIA LOCAL' BADGE
-- CEO: Amanda Abreu | Obsolete feature removal

-- 1. Remove from award trigger
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

  -- 🏆 9. [ELIMINADO] GUIA LOCAL (Sincronizado com exclusão de Service Reviews)

  -- 🏆 10. CORAÇÃO DA COMUNIDADE
  IF NEW.likes_given_count >= 50 AND NEW.positive_comments_count >= 20 THEN
    INSERT INTO user_badges (user_id, badge_id, description) VALUES (NEW.id, 'coracao', 'Alto nível de empatia e apoio emocional aos membros.') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eradicate existing 'guia_local' badges from all users
DELETE FROM public.user_badges WHERE badge_id = 'guia_local';

-- 3. Force sync profiles (colapsing existing arrays)
UPDATE public.profiles p
SET badges = ARRAY(
    SELECT badge_id 
    FROM public.user_badges ub 
    WHERE ub.user_id = p.id
);
