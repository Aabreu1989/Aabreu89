-- 👑 MIRA V2026.GOLD: GAMIFICATION & FOLLOWS RLS CORRECTION
-- Autor: Antigravity
-- Executar no Supabase SQL Editor: https://supabase.com/dashboard/project/pnlzyshozpqlzuyjesdq/sql/new

BEGIN;

-- ==========================================
-- [1] TABELA: public.badges
-- ==========================================
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.badges;
CREATE POLICY "Allow select for all" ON public.badges FOR SELECT USING (true);


-- ==========================================
-- [2] TABELA: public.user_badges
-- ==========================================
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.user_badges;
CREATE POLICY "Allow select for all" ON public.user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for self" ON public.user_badges;
CREATE POLICY "Allow insert for self" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ==========================================
-- [3] TABELA: public.follows
-- ==========================================
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.follows;
CREATE POLICY "Allow select for all" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for self" ON public.follows;
CREATE POLICY "Allow insert for self" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Allow delete for self" ON public.follows;
CREATE POLICY "Allow delete for self" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

COMMIT;
