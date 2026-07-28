-- ============================================================
-- 🦾 MIRA V2026: PILLAR 019 - LOCKDOWN REMEDIATION RLS
-- Resolving "Ghost Likes" and "Report Persistence"
-- ============================================================

-- 1. REPORTS TABLE HARDENING
-- Allow authenticated users to insert reports (Suggestions, Bugs, etc.)
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;
CREATE POLICY "Anyone can insert reports" ON public.reports 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can see all reports" ON public.reports;
CREATE POLICY "Admins can see all reports" ON public.reports 
FOR SELECT USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. POST_VOTES (GHOST LIKES FIX)
-- Ensure public list of votes is always visible and users can manage their own
ALTER TABLE IF EXISTS public.post_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public cast votes are visible" ON public.post_votes;
CREATE POLICY "Public cast votes are visible" ON public.post_votes 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote" ON public.post_votes;
CREATE POLICY "Users can vote" ON public.post_votes 
FOR ALL USING (auth.uid() = user_id);

-- 3. AGGREGATE TRIGGER: Sync post_likes_count in REAL-TIME
-- This ensures that when a like is inserted into post_votes, the 'posts' table is updated immediately.
CREATE OR REPLACE FUNCTION public.sync_post_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts 
        SET likes_count = COALESCE(likes_count, 0) + 1 
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts 
        SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) 
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_post_likes ON public.post_votes;
CREATE TRIGGER tr_sync_post_likes
AFTER INSERT OR DELETE ON public.post_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes();

-- 4. REPUTATION SYNC: Ensure author gets reputation points
-- Awarding 10 merit points per like (V2026.SOCIAL)
CREATE OR REPLACE FUNCTION public.award_reputation_on_like()
RETURNS TRIGGER AS $$
DECLARE
    post_author_id uuid;
BEGIN
    SELECT author_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    
    IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
        UPDATE public.profiles 
        SET reputation = COALESCE(reputation, 0) + 10 
        WHERE id = post_author_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_reputation_on_like ON public.post_votes;
CREATE TRIGGER tr_reputation_on_like
AFTER INSERT ON public.post_votes
FOR EACH ROW WHEN (NEW.vote_type = 'like')
EXECUTE FUNCTION public.award_reputation_on_like();

-- Success notice
DO $$ BEGIN RAISE NOTICE 'MIRA Lockdown Remediation (019) Applied! Cables connected. 🔌'; END $$;
