-- 👑 MIRA V2026.GOLD: SOBERANIA DE SUGESTÕES (SQL V11600)
-- -------------------------------------------------------------
-- EXECUTAR NO EDITOR SQL DO SUPABASE
-- -------------------------------------------------------------

-- 0. Limpeza Nuclear (Para garantir que colunas novas como 'content' apareçam)
DROP TABLE IF EXISTS public.app_suggestions CASCADE;

-- 1. Criação da Tabela Unificada
CREATE TABLE public.app_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.app_suggestions ENABLE ROW LEVEL SECURITY;

-- 3. Limpeza de políticas antigas (para evitar conflitos)
DROP POLICY IF EXISTS "Anyone can insert suggestions" ON public.app_suggestions;
DROP POLICY IF EXISTS "Admins can view suggestions" ON public.app_suggestions;
DROP POLICY IF EXISTS "Admins can delete suggestions" ON public.app_suggestions;

-- 4. Nova Política de Inserção (Soberania Universal)
-- Permite que qualquer utilizador (logado ou não) envie sugestões
CREATE POLICY "Anyone can insert suggestions" 
ON public.app_suggestions
FOR INSERT 
WITH CHECK (true);

-- 5. Nova Política de Visualização (Soberania Administrativa)
-- Apenas a CEO (Amanda) ou Admins podem ler as sugestões
CREATE POLICY "Admins can view suggestions" 
ON public.app_suggestions
FOR SELECT 
USING (
  auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Nova Política de Eliminação (Martelo da CEO)
CREATE POLICY "Admins can delete suggestions" 
ON public.app_suggestions
FOR DELETE 
USING (
  auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
