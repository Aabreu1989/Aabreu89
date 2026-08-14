-- 🛡️ MIRA V2026.GOLD: USER FOLLOWS TABLE MIGRATION
-- Table: public.user_follows
-- Primary Key: (follower_id, following_id)

CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT prevent_self_follow CHECK (follower_id <> following_id)
);

-- Index for fast query of user's following list
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can read user_follows" ON public.user_follows;
CREATE POLICY "Public can read user_follows"
  ON public.user_follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own follows" ON public.user_follows;
CREATE POLICY "Users can manage their own follows"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);
