-- ============================================================
-- 🦾 MIRA V2026: PILLAR 006 - MASTER BADGES ENGINE (OFFICIAL)
-- "Soldered" Counters, Audit Trail, and Sovereign Gamification
-- ============================================================

-- 1. INFRASTRUCTURE: Extended Counters for Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reports_confirmed_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS scam_reports_confirmed INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_downloads INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_courses_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_posts_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_reviews_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invites_confirmed_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saber_ia_hits INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lynx_eye_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS community_validations_count INT DEFAULT 0;

-- 2. AUDIT TRAIL: user_badges (The "Invy" Test)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL, -- e.g., 'pioneiro', 'sentinela', 'mestre_docs'
  description TEXT, -- "Como conquistei este selo?"
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_uid ON public.user_badges(user_id);

-- 3. LOGIC: badge_grant_logic()
-- This function is the "Heart" of the gamification system.
CREATE OR REPLACE FUNCTION award_badges_automatically()
RETURNS TRIGGER AS $$
DECLARE
  p_id UUID := NEW.id;
  user_count INT;
BEGIN
  -- 🏆 1. PIONEIRO MIRA (First 500)
  SELECT count(*) INTO user_count FROM profiles WHERE created_at <= NEW.created_at;
  IF user_count <= 500 THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'pioneiro', 'Fui um dos primeiros 500 membros a acreditar no império MIRA.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 2. CONTA VERIFICADA (is_verified)
  IF NEW.is_verified = true AND (OLD.is_verified = false OR OLD.is_verified IS NULL) THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'verificado', 'Identidade validada pessoalmente pela equipa MIRA. Confiança e autoridade máxima.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 3. VOZ DE AUTORIDADE (5+ posts verificados)
  IF NEW.verified_posts_count >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'voz_autoridade', 'Publiquei 5+ posts técnicos de documentação que foram selados pela própria Amanda Abreu.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 4. MESTRE DOS DOCUMENTOS (30+ downloads)
  IF NEW.document_downloads >= 30 THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'mestre_docs', 'Dominio da burocracia: Realizei 30+ downloads de guias e minutas oficiais da plataforma.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 5. ESPECIALISTA CERTIFICADO (5+ cursos)
  IF NEW.completed_courses_count >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'especialista', 'Concluí 5 cursos técnicos do IEFP ou módulos linguísticos na MIRA Academy.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 6. SENTINELA (10+ denúncias confirmadas)
  IF NEW.reports_confirmed_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'sentinela', 'Guardião da rede: Ajudei a limpar a comunidade de abusos com 10+ denúncias confirmadas.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 7. ESCUDO ANTI-BURLA (5+ denúncias de burla)
  IF NEW.scam_reports_confirmed >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id, description)
    VALUES (p_id, 'escudo_antiburla', 'Herói da Proteção: Denunciei com sucesso 5 tentativas de venda de agendamentos falsos.')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 🏆 8. RESILIENTE (90 dias + Sem denúncias)
  -- This requires a scheduled check, but we can verify on activity update
  IF (NEW.created_at <= (NOW() - INTERVAL '90 days')) AND NEW.is_muted = false THEN
     INSERT INTO user_badges (user_id, badge_id, description)
     VALUES (p_id, 'resiliente', 'Membro veterano: 90 dias de conduta exemplar e residência digital ativa na MIRA.')
     ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger ONLY on actual count changes or status changes for efficiency
DROP TRIGGER IF EXISTS tr_award_badges ON public.profiles;
CREATE TRIGGER tr_award_badges
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION award_badges_automatically();

-- 4. UTILITY RPCs (The "Click" Actions)
CREATE OR REPLACE FUNCTION track_document_download(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET document_downloads = COALESCE(document_downloads, 0) + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_course_completion(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET completed_courses_count = COALESCE(completed_courses_count, 0) + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ADMIN MODERATION HOOK: Linking reports to badges
-- When a report status changes to 'resolved', we increment the reporter's count
CREATE OR REPLACE FUNCTION track_reporter_merit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status = 'pending' THEN
    UPDATE profiles SET reports_confirmed_count = COALESCE(reports_confirmed_count, 0) + 1 WHERE id = NEW.reporter_id;
    
    -- If it's a scam/fraud report, boost the Shield too
    IF NEW.reason ILIKE '%burla%' OR NEW.reason ILIKE '%scam%' OR NEW.reason ILIKE '%venda%' THEN
        UPDATE profiles SET scam_reports_confirmed = COALESCE(scam_reports_confirmed, 0) + 1 WHERE id = NEW.reporter_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_report_resolved ON public.reports;
CREATE TRIGGER tr_on_report_resolved
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION track_reporter_merit();
