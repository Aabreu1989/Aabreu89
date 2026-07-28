-- 
-- 👑 SQL FIX V12701 - DESBLOQUEIO DE DENÚNCIAS (AMANDA ABREU)
-- OBJETIVO: Permitir que os Imigrantes (Utilizadores Comuns) possam enviar denúncias.
-- FIX: A tabela de reports estava sob RLS rigoroso (Apenas a CEO podia Apagar), mas faltava a permissão "INSERT" para o povo criar as queixas.
--

BEGIN;

-- 1. POLÍTICA DE INSERÇÃO: O Povo pode apresentar as próprias denúncias
DROP POLICY IF EXISTS "Users Can Insert Own Reports" ON public.reports;
CREATE POLICY "Users Can Insert Own Reports" ON public.reports 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = reporter_id);

-- 2. POLÍTICA DE LEITURA (PREVENÇÃO DE ERROS DE CACHE DO SUPABASE)
-- Garante que o usuário consiga ver que a denúncia que ele próprio fez foi salva.
-- E garante expressamente que o Hub da CEO veja sempre tudo (Apesar das Views ignorarem RLS por defeito, é mais seguro).
DROP POLICY IF EXISTS "Users Can View Reports" ON public.reports;
CREATE POLICY "Users Can View Reports" ON public.reports 
FOR SELECT TO authenticated 
USING (auth.uid() = reporter_id OR (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com'));

COMMIT;
