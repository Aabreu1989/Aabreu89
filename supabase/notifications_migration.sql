-- ============================================================
-- MIRA: Tabela de Notificações In-App (Real-Time)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('comment', 'like', 'mention', 'report_resolved', 'system')),
  title       text NOT NULL,
  body        text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index para performance nas queries por utilizador
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS: utilizadores só veem as suas próprias notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins e sistema podem inserir notificações para qualquer user
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- TRIGGER: Notificar automaticamente quando alguém comenta
--          num post do utilizador
-- ============================================================
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  post_author_id uuid;
  commenter_name text;
  post_title     text;
BEGIN
  -- Vai buscar o autor do post e o nome do comentador
  SELECT p.author_id, p.title INTO post_author_id, post_title
    FROM posts p WHERE p.id = NEW.post_id;

  SELECT name INTO commenter_name
    FROM profiles WHERE id = NEW.author_id;

  -- Não notificar se o comentador é o próprio autor
  IF post_author_id IS NOT NULL AND post_author_id <> NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, body, metadata)
    VALUES (
      post_author_id,
      'comment',
      commenter_name || ' comentou no teu post',
      '"' || LEFT(NEW.content, 100) || '"',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

-- ============================================================
-- TRIGGER: Notificar quando alguém dá like num post
-- ============================================================
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  post_author_id uuid;
  liker_name     text;
  post_title     text;
BEGIN
  SELECT p.author_id, p.title INTO post_author_id, post_title
    FROM posts p WHERE p.id = NEW.post_id;

  SELECT name INTO liker_name
    FROM profiles WHERE id = NEW.user_id;

  IF post_author_id IS NOT NULL AND post_author_id <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, metadata)
    VALUES (
      post_author_id,
      'like',
      liker_name || ' gostou do teu post',
      '"' || COALESCE(post_title, 'Post sem título') || '"',
      jsonb_build_object('post_id', NEW.post_id)
    )
    ON CONFLICT DO NOTHING; -- Evitar spam de likes
  END IF;

  RETURN NEW;
END;
$$;

-- Note: só ativar se tiver uma tabela de post_likes
-- DROP TRIGGER IF EXISTS trg_notify_like ON post_likes;
-- CREATE TRIGGER trg_notify_like
--   AFTER INSERT ON post_likes
--   FOR EACH ROW EXECUTE FUNCTION notify_post_like();
