-- 👑 SQL FIX V12401 - RESTAURAÇÃO DE SUGESTÕES (AMANDA ABREU)
-- OBJETIVO: Restaurar a View e a RPC de Sugestões que caíram na limpeza da V12400.
--

BEGIN;

-- 1. VIEW ADMIN: SUGESTÕES HIDRATADAS
CREATE OR REPLACE VIEW public.admin_suggestions_view AS
SELECT s.id, s.subject, s.content, s.email as contact_email, s.status, s.aima_priority, s.created_at,
    jsonb_build_object('id', s.user_id, 'name', COALESCE(p.username, 'Visitante'), 'avatar', p.avatar_url) as user_data
FROM public.app_suggestions s LEFT JOIN public.profiles p ON s.user_id = p.id;

-- 2. FUNÇÃO NUCLEAR: ELIMINAÇÃO DE SUGESTÃO
CREATE OR REPLACE FUNCTION public.admin_nuclear_suggestion_delete(suggestion_uuid UUID)
RETURNS VOID AS $$
BEGIN
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        DELETE FROM public.app_suggestions WHERE id = suggestion_uuid;
    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMISSÕES FINAIS
GRANT SELECT ON public.admin_suggestions_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_suggestion_delete TO authenticated;

COMMIT;
