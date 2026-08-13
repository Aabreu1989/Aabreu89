-- ============================================================
-- MIRA — Correcção RLS post_votes
-- Correr no Supabase → SQL Editor
-- ============================================================

-- 1. Permitir INSERT para utilizadores autenticados (likes e votos requerem login)
DROP POLICY IF EXISTS "mira_votes_insert" ON public.post_votes;
CREATE POLICY "mira_votes_insert"
ON public.post_votes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Permitir SELECT para todos (votos são públicos)
DROP POLICY IF EXISTS "mira_votes_select" ON public.post_votes;
CREATE POLICY "mira_votes_select"
ON public.post_votes
FOR SELECT
USING (true);

-- 3. Permitir UPDATE e DELETE só ao próprio utilizador
DROP POLICY IF EXISTS "mira_votes_update" ON public.post_votes;
CREATE POLICY "mira_votes_update"
ON public.post_votes
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mira_votes_delete" ON public.post_votes;
CREATE POLICY "mira_votes_delete"
ON public.post_votes
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Verificação
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'post_votes';
