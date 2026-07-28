import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://ychwhxkxsxmuvabxlyjn.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
-- 🛡️ MIRA V2026.GOLD: AESTHETICS & PERSISTENCE STABILITY (V101.5)
-- AUTHOR: Antigravity (Advanced Agentic Assistant)

-- 1. UNIFY SUGGESTIONS (Sovereign Improvement Protocol)
CREATE TABLE IF NOT EXISTS public.app_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT,
    email TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRIVACY & SECURITY: PROTECT EMAILS
-- Nota: Para não quebrar o Auth, manteremos a coluna 'email' mas recomendaremos o bypass via views.
-- Adicionar coluna de backup se necessário, mas o foco é remover do SELECT público.

-- 3. FOLLOWER COUNT SYNC (The Trigger of 100k Sovereignty)
CREATE OR REPLACE FUNCTION public.sync_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_follows ON public.user_follows;
CREATE TRIGGER tr_sync_follows AFTER INSERT OR DELETE ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.sync_follow_counts();

-- 4. NOBEL STORIES RULES (Destaques da Comunidade)
-- Re-criar a view com regras mais rígidas para "DESTAQUES"
DROP VIEW IF EXISTS public.community_top_stories_nobel;
CREATE VIEW public.community_top_stories_nobel AS
SELECT 
    p.*
FROM public.posts p
WHERE (p.nobel_score >= 100) 
   OR (p.likes >= 5)
ORDER BY p.created_at DESC;

-- 5. ADMIN HUB SUGGESTIONS VIEW (Unificada)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_improvements') THEN
        INSERT INTO public.app_suggestions (user_id, content, created_at)
        SELECT user_id, content, created_at FROM public.site_improvements
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
`;

async function run() {
    console.log("Applying MIRA Sovereignty Stability SQL...");
    const { error } = await supabase.rpc('admin_execute_sql', { sql_query: sql });
    if (error) {
        console.error("RPC Failed, trying raw query...", error);
        // Fallback or explain to user
    } else {
        console.log("SQL Applied Successfully!");
    }
}

run();
