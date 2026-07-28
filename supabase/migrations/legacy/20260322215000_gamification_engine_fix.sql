-- =====================================================
-- MIRA V2026: Gamification Engine Fix (CORRIGIDO)
-- Erros corrigidos:
--   1. 42P13: DROP FUNCTION antes de CREATE OR REPLACE (return type mismatch)
--   2. HAVING COUNT() dentro de NOT EXISTS era SQL inválido → reescrito com IF/THEN
--   3. increment_reputation: RETURNS void (não INT) pois UPDATE...RETURNING num
--      SQL-language function com RETURNS INT causa 42P13
--   4. Adicionado RLS e grant na tabela gamification_history
-- =====================================================

-- =====================================================
-- FIX 1: increment_reputation RPC (sem erro 42P13)
-- DROP obrigatório para resolver return type mismatch
-- =====================================================
DROP FUNCTION IF EXISTS increment_reputation(UUID, INT);
DROP FUNCTION IF EXISTS increment_reputation(uuid, integer);

CREATE OR REPLACE FUNCTION increment_reputation(target_user_id UUID, amount INT)
RETURNS void AS $$
  UPDATE profiles 
  SET reputation = COALESCE(reputation, 0) + amount 
  WHERE id = target_user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- FIX 2: Tabela de histórico de gamificação
-- =====================================================
CREATE TABLE IF NOT EXISTS gamification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gamification_user ON gamification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_date ON gamification_history(created_at DESC);

-- RLS para segurança
ALTER TABLE gamification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own gamification" ON gamification_history;
CREATE POLICY "Users can see own gamification" ON gamification_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage gamification" ON gamification_history;
CREATE POLICY "Service role can manage gamification" ON gamification_history
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON gamification_history TO authenticated;
GRANT ALL ON gamification_history TO service_role;

-- =====================================================
-- FIX 3: Trigger de pontos por Like
-- CORRIGIDO: HAVING COUNT() em NOT EXISTS era SQL inválido
-- Reescrito em plpgsql com IF/THEN e subquery de contagem
-- =====================================================
CREATE OR REPLACE FUNCTION award_points_for_like()
RETURNS TRIGGER AS $$
DECLARE
  likes_today INT;
  post_author UUID;
BEGIN
  -- Só processa likes (não fact-votes tipo 'useful'/'fake')
  IF TG_OP = 'INSERT' AND NEW.vote_type = 'like' THEN

    -- Contar quantos likes o utilizador deu hoje
    SELECT COUNT(*) INTO likes_today
    FROM gamification_history
    WHERE user_id = NEW.user_id
      AND reason = 'Like dado'
      AND created_at > NOW() - INTERVAL '1 day';

    -- Máximo 10 likes premiados por dia
    IF likes_today < 10 THEN
      INSERT INTO gamification_history (user_id, amount, reason)
      VALUES (NEW.user_id, 1, 'Like dado');

      UPDATE profiles
      SET reputation = COALESCE(reputation, 0) + 1
      WHERE id = NEW.user_id;
    END IF;

    -- Premiar o autor do post com 5 pontos
    SELECT author_id INTO post_author
    FROM posts
    WHERE id = NEW.post_id;

    IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
      UPDATE profiles
      SET reputation = COALESCE(reputation, 0) + 5
      WHERE id = post_author;

      INSERT INTO gamification_history (user_id, amount, reason)
      VALUES (post_author, 5, 'Like recebido no post');
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger de forma limpa
DROP TRIGGER IF EXISTS trigger_award_points_for_like ON post_votes;
CREATE TRIGGER trigger_award_points_for_like
  AFTER INSERT ON post_votes
  FOR EACH ROW
  EXECUTE FUNCTION award_points_for_like();

-- =====================================================
-- FIX 4: Coluna reputation na tabela profiles
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'reputation'
  ) THEN
    ALTER TABLE profiles ADD COLUMN reputation INT DEFAULT 0;
    RAISE NOTICE 'Coluna reputation adicionada ao profiles';
  ELSE
    RAISE NOTICE 'Coluna reputation já existe';
  END IF;
END $$;

-- =====================================================
-- FIX 5: Coluna badges na tabela profiles
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'badges'
  ) THEN
    ALTER TABLE profiles ADD COLUMN badges TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Coluna badges adicionada ao profiles';
  ELSE
    RAISE NOTICE 'Coluna badges já existe';
  END IF;
END $$;

-- =====================================================
-- FIX 6: Points column alias (alguns queries usam 'points')
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN points INT GENERATED ALWAYS AS (COALESCE(reputation, 0)) STORED;
    RAISE NOTICE 'Coluna points (alias de reputation) adicionada';
  ELSE
    RAISE NOTICE 'Coluna points já existe';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Não foi possível criar alias points (pode já existir como coluna normal): %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT id, name, reputation, badges
FROM profiles
ORDER BY reputation DESC NULLS LAST
LIMIT 20;

SELECT * FROM gamification_history
ORDER BY created_at DESC
LIMIT 20;
