-- ============================================================
-- 🎓 MIRA V2026: PILLAR 004 - ACADEMY & SERVICES
-- IEFP Courses, Job Posts, DMs, and Gamification Audit
-- ============================================================

-- 1. ACADEMY: COURSES
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    duration TEXT,
    image_url TEXT,
    link TEXT,
    is_iefp_synced BOOLEAN DEFAULT false,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. JOB PORTAL: POSTS
CREATE TABLE IF NOT EXISTS public.job_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    location TEXT,
    source_name TEXT,
    source_url TEXT,
    tags text[] DEFAULT '{}',
    category TEXT,
    work_topic TEXT,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MESSAGING INFRASTRUCTURE (DMs)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4. GAMIFICATION AUDIT
CREATE TABLE IF NOT EXISTS public.gamification_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text,
  points_earned integer,
  related_post_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 5. SEMANTIC SEARCH FOR SERVICES
CREATE INDEX IF NOT EXISTS idx_courses_semantic ON public.courses USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_job_posts_semantic ON public.job_posts USING hnsw (embedding vector_cosine_ops);

-- 6. RLS FOR MESSAGES
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own conversations" ON public.conversations 
  FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = id AND user_id = auth.uid()));

CREATE POLICY "Send messages in own conversations" ON public.messages 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = public.messages.conversation_id AND user_id = auth.uid()));
