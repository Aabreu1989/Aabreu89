-- 👑 SQL MASTER V11900 - SOBERANIA DE SUGESTÕES (AMANDA ABREU)
-- OBJETIVO: Garantir que as sugestões aparecem no Admin Hub e podem ser incineradas.
-- FIX: Função Nuclear RPC para Deleção, View Hidratada e Prioridade AIMA.
--

BEGIN;

-- 1. LIMPEZA DE ENTULHO (Prevenção de Conflitos)
DROP VIEW IF EXISTS public.admin_suggestions_view CASCADE;
DROP TABLE IF EXISTS public.app_suggestions CASCADE;
DROP FUNCTION IF EXISTS public.admin_nuclear_suggestion_delete(uuid);

-- 2. CRIAÇÃO DA TABELA COM CONTEXTO MIRA
-- Adicionamos aima_priority para que a IA saiba o que ler primeiro.
CREATE TABLE public.app_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'implemented'
    aima_priority INTEGER DEFAULT 100,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ÍNDICE DE VELOCIDADE
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON public.app_suggestions(status);

-- 4. VIEW PARA O ADMIN HUB (A ABA SUGESTÕES)
-- Esta view garante que vês o nome e o avatar de quem sugeriu, não apenas um ID.
CREATE OR REPLACE VIEW public.admin_suggestions_view AS
SELECT 
    s.id,
    s.subject,
    s.content,
    s.email as contact_email,
    s.status,
    s.aima_priority,
    s.created_at,
    jsonb_build_object(
        'id', s.user_id, 
        'name', COALESCE(p.username, 'Visitante'), 
        'avatar', p.avatar_url
    ) as user_data
FROM public.app_suggestions s
LEFT JOIN public.profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC;

-- 5. FUNÇÃO NUCLEAR: ELIMINAÇÃO DE SUGESTÃO (RPC)
-- Esta função corre como SUPERUTILIZADOR e ignora qualquer bloqueio de RLS.
CREATE OR REPLACE FUNCTION public.admin_nuclear_suggestion_delete(suggestion_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Verificação de Soberania via Email de CEO
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        DELETE FROM public.app_suggestions WHERE id = suggestion_uuid;
        
        -- Registar a limpeza na auditoria de tarefas
        -- Se a tabela system_tasks não existir, ignoramos este log para não quebrar a deleção
        BEGIN
            INSERT INTO public.system_tasks (task_name, aima_priority, payload)
            VALUES ('SUGGESTION_CLEANUP', 1000, jsonb_build_object('id', suggestion_uuid, 'by', 'CEO Amanda'));
        EXCEPTION WHEN OTHERS THEN
            -- Ignora erro se a tabela de tarefas não existir
        END;
    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO: Apenas a CEO Amanda Abreu pode apagar sugestões.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PERMISSÕES SOBERANAS
ALTER TABLE public.app_suggestions ENABLE ROW LEVEL SECURITY;

-- Permissões de Inserção: Aberto a todos (Tribo e Visitantes)
CREATE POLICY "Public Suggestion Insertion" ON public.app_suggestions FOR INSERT WITH CHECK (true);

-- Permissões de Leitura e Deleção: Apenas CEO Amanda via RLS (Camada de Segurança extra)
CREATE POLICY "CEO Suggestion Access" ON public.app_suggestions 
FOR ALL TO authenticated 
USING (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com');

-- Grants Finais
GRANT ALL ON TABLE public.app_suggestions TO service_role;
GRANT INSERT ON public.app_suggestions TO anon, authenticated;
GRANT SELECT, DELETE ON public.app_suggestions TO authenticated;
GRANT SELECT ON public.admin_suggestions_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_suggestion_delete TO authenticated;

COMMIT;
