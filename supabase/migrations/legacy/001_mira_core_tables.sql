-- ============================================================
-- 🏛️ MIRA V2026: PILLAR 001 - CORE INFRASTRUCTURE
-- Profiles, Community Social Graph, and Security Foundations
-- ============================================================

-- 1. PROFILES & IDENTITY
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  email text,
  avatar_url text,
  bio text,
  nationality text,
  age_range text,
  location text,
  main_challenge text,
  reputation integer DEFAULT 0,
  trust_level text DEFAULT 'Observador',
  is_verified boolean DEFAULT false,
  is_muted boolean DEFAULT false,
  role text DEFAULT 'member',
  
  -- Social Stats (Phase 2)
  online_status text DEFAULT 'offline',
  last_seen timestamptz DEFAULT now(),
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  
  -- Gamification (Phase 3)
  badges text[] DEFAULT '{}',
  verified_posts_count integer DEFAULT 0,
  total_likes_received integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. USER PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  official_aima boolean DEFAULT true,
  legal_changes boolean DEFAULT true,
  doc_expiration boolean DEFAULT true,
  job_matches boolean DEFAULT true,
  community_reputation boolean DEFAULT true,
  map_urgency boolean DEFAULT true,
  mira_insights boolean DEFAULT true,
  social_connect boolean DEFAULT true
);

-- 3. COMMUNITY: POSTS & COMMENTS
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  work_topic text,
  geo_tag text,
  background_image text,
  tags text[] DEFAULT '{}',
  likes integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_fraud_warning boolean DEFAULT false,
  urgency integer DEFAULT 0,
  validation_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 3.1 VOTING SYSTEM
CREATE TABLE IF NOT EXISTS public.post_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL, -- 'like', 'useful', 'fake'
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_votes_rel ON public.post_votes (post_id, user_id);

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes integer DEFAULT 0,
  is_validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. SOCIAL GRAPH: FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id <> following_id)
);

-- 5. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. RLS & SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 🛡️ Profile Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 🛡️ Post Policies
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);

-- 🛡️ Comment Policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 7. TRIGGERS: IDENTITY & COUNTERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Novo Membro ' || LEFT(new.id::text, 6)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'member'
  );
  INSERT INTO public.user_preferences (user_id) VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_follow_stats()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats();
