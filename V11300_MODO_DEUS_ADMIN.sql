-- 
-- 👑 SQL MASTER V11300 - MODO DEUS ADMIN (AMANDA ABREU)
-- OBJETIVO: Autoridade Total para Eliminação de Conteúdo Nocivo.
-- FIX: Permissões de DELETE em Comments/Reports e RLS Bypass para a CEO.
--

BEGIN;

-- 1. ADICIONAR PERMISSÕES DE DELETE EM FALTA
GRANT DELETE ON public.comments TO authenticated;
GRANT DELETE ON public.reports TO authenticated;
GRANT DELETE ON public.posts TO authenticated;

-- 2. CRIAR POLÍTICAS DE "MODO DEUS" (SUPERUSER)
-- Estas políticas garantem que a 'amandasabreu89@gmail.com' pode apagar QUALQUER COISA.

DROP POLICY IF EXISTS admin_god_mode_posts_delete ON public.posts;
CREATE POLICY admin_god_mode_posts_delete ON public.posts
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com');

DROP POLICY IF EXISTS admin_god_mode_comments_delete ON public.comments;
CREATE POLICY admin_god_mode_comments_delete ON public.comments
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com');

DROP POLICY IF EXISTS admin_god_mode_reports_delete ON public.reports;
CREATE POLICY admin_god_mode_reports_delete ON public.reports
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com');

COMMIT;
