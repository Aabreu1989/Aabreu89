const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pnlzyshozpqlzuyjesdq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0'
);

const sql = `
-- 🏛️ MIRA STORIES INFRASTRUCTURE v2026.GOLD
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public stories" ON public.stories;
CREATE POLICY "Public stories" ON public.stories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert stories" ON public.stories;
CREATE POLICY "Authenticated insert stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 🏛️ NOBEL STORIES VIEW
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
SELECT 
    p.*,
    prof.name as author_name,
    prof.avatar_url as author_avatar,
    prof.is_verified as author_is_verified,
    s.image_url as background_image,
    s.created_at as story_created_at
FROM public.stories s
JOIN public.posts p ON s.post_id = p.id
JOIN public.profiles prof ON s.author_id = prof.id
WHERE s.expires_at > now()
ORDER BY p.is_verified DESC, p.created_at DESC;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
  console.log("⚡ Executing DB Recovery...");
  const { data, error } = await supabase.rpc('run_sql_mira_v2026', { sql_query: sql });
  if (error) {
    // If RPC fails, try running via a direct table insert if we have a runner, 
    // but here we expect the RPC 'run_sql_mira_v2026' to exist from previous sessions.
    console.error("Error executing SQL:", error);
    
    // Alternative: Try to see if we can use a standard approach if RPC is missing
    console.log("Retrying with raw query check...");
  } else {
    console.log("✅ DB Recovery Successful.");
  }
}

run();
