-- ============================================================
-- 🦾 MIRA V2026: PILLAR 005 - SOVEREIGN LOGIC PROTOCOL
-- Atomic Justice, Unified RAG, and Security Hardening
-- ============================================================

-- A. INFRASTRUCTURE: Gamification History
CREATE TABLE IF NOT EXISTS public.gamification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT,
  related_post_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_user ON gamification_history(user_id);

-- B. PROFILE STATS: Tracking real metrics for Badges
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS saber_ia_hits INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_likes_received INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fake_votes_count INT DEFAULT 0;

-- 1. UNIFIED RAG ENGINE: match_knowledge_global_v3
-- Hierarchy weights: CEO 1.5x, Official 1.2x, Community (Vetted) 1.1x, Courses 1.0x
DROP FUNCTION IF EXISTS match_knowledge_global_v3(vector, double precision, integer);
CREATE OR REPLACE FUNCTION match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25, -- MIRA V2026.SUPREMO: LOCKED AT 0.25
  match_count int DEFAULT 10
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  -- Layer A: Official Knowledge Base (Peso 1.2x)
  select
    kb.id,
    kb.category,
    kb.topic,
    kb.content,
    kb.url,
    (1 - (kb.embedding <=> query_embedding)) * 1.2 as similarity,
    jsonb_build_object('type', 'elite', 'expert_name', 'MIRA Core') as metadata
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer B: Community (Peso 1.1x se Verificado)
  select
    p.id,
    p.category,
    p.title as topic,
    p.content,
    null as url,
    (1 - (p.embedding <=> query_embedding)) * 1.1 as similarity,
    jsonb_build_object('type', 'community', 'verified', p.is_verified) as metadata
  from posts p
  where 1 - (p.embedding <=> query_embedding) > match_threshold 
  AND p.is_verified = true -- CEO Decree: Only Vetted Community Input

  union all

  -- Layer C: CEO Saber IA (Peso 1.5x SOBERANO)
  select
    s.id,
    s.category,
    s.topic,
    s.content,
    s.url,
    (1 - (s.embedding <=> query_embedding)) * 1.5 as similarity,
    jsonb_build_object('type', 'ceo', 'expert_name', 'CEO Amanda Abreu') as metadata
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold

  union all

  -- Layer D: MIRA Academy Courses (Peso 1.0x)
  select
    c.id,
    c.category,
    c.title as topic,
    c.description as content,
    c.link as url,
    (1 - (c.embedding <=> query_embedding)) * 1.0 as similarity,
    jsonb_build_object('type', 'course', 'duration', c.duration) as metadata
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold

  order by similarity desc
  limit match_count;
end;
$$;

-- 2. ATOMIC GAMIFICATION TRIGGER (+5 Points)
-- MIRA V2026: Justiça Atómica via Server-Side Trigger
CREATE OR REPLACE FUNCTION award_points_for_like_v2()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
BEGIN
  -- 1. Unificar histórico do autor do Like (+1 ponto)
  INSERT INTO gamification_history (user_id, amount, reason) 
  VALUES (NEW.user_id, 1, 'Like dado no MIRA HUB');

  -- 2. Identificar autor do post para bónus de mérito (+5 pontos)
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;

  -- 3. Award post author se não for auto-like (V2026.PREMIUM)
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    UPDATE profiles 
    SET reputation = COALESCE(reputation, 0) + 5,
        total_likes_received = COALESCE(total_likes_received, 0) + 1 
    WHERE id = post_author;
    
    INSERT INTO gamification_history (user_id, amount, reason, related_post_id)
    VALUES (post_author, 5, 'Like recebido (Bónus de Mérito)', NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_award_points_for_like ON public.post_votes;
CREATE TRIGGER trigger_award_points_for_like
  AFTER INSERT ON public.post_votes
  FOR EACH ROW
  EXECUTE FUNCTION award_points_for_like_v2();

-- 3. REPARAR RPC DE REPUTAÇÃO (INCREMENTO GLOBAL)
DROP FUNCTION IF EXISTS increment_reputation(uuid, int);
CREATE OR REPLACE FUNCTION increment_reputation(target_user_id UUID, amount INT)
RETURNS INT AS $$
  UPDATE profiles 
  SET reputation = COALESCE(reputation, 0) + amount 
  WHERE id = target_user_id 
  RETURNING reputation;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 4. SABER IA HIT TRACKER: Count legal doctrine engagement
CREATE OR REPLACE FUNCTION increment_saber_hits(user_id UUID)
RETURNS void AS $$
  UPDATE profiles SET saber_ia_hits = COALESCE(saber_ia_hits, 0) + 1 WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- 4. SENTINEL TRIGGER: Track fake identification
CREATE OR REPLACE FUNCTION track_sentinel_actions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vote_type = 'fake' THEN
    UPDATE profiles SET fake_votes_count = COALESCE(fake_votes_count, 0) + 1 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sentinel_count ON public.post_votes;
CREATE TRIGGER trigger_sentinel_count
  AFTER INSERT ON public.post_votes
  FOR EACH ROW
  EXECUTE FUNCTION track_sentinel_actions();
