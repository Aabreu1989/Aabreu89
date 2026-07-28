-- 
-- 👑 SQL FIX V12900 - RESTAURAÇÃO DE SOBERANIA ADMINISTRATIVA (AMANDA ABREU)
-- OBJETIVO: Sincronizar o Admin Hub com a nova arquitetura MASTER V12800.
-- FIX: Redireciona RPCs para 'reports' e reativa o Sniper de Sugestões.
--

BEGIN;

-- 1. REPARAÇÃO DO SNIPER DE SUGESTÕES
-- Tinha sido removido no V12800 mas o Admin Hub ainda o chama.
CREATE OR REPLACE FUNCTION public.admin_nuclear_suggestion_delete(suggestion_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        DELETE FROM public.app_suggestions WHERE id = suggestion_uuid;
    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO.';
    END IF;
END;
$$;

-- 2. REPARAÇÃO DA VISIBILIDADE DE DENÚNCIAS
-- O RPC get_community_reports_json_sovereign estava a ler da tabela errada (community_reports).
CREATE OR REPLACE FUNCTION public.get_community_reports_json_sovereign()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(r))
        FROM public.admin_reports_view r
    );
END;
$$;

-- 3. ATUALIZAÇÃO DO DASHBOARD CENTRAL (COUNTS)
-- Sincroniza os contadores com os nomes de tabelas oficiais.
CREATE OR REPLACE FUNCTION public.get_admin_counts_sovereign()
RETURNS TABLE (
    courses jsonb,
    services jsonb,
    users int,
    jobs jsonb,
    reports int,
    suggestions int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY SELECT 
        jsonb_build_object('db', (SELECT count(*)::int FROM public.courses), 'prot', 20),
        jsonb_build_object('db', (SELECT count(*)::int FROM public.map_alerts), 'prot', 50),
        (SELECT count(*)::int FROM public.profiles),
        jsonb_build_object('db', (SELECT count(*)::int FROM public.job_posts), 'prot', 10),
        (SELECT count(*)::int FROM public.reports), -- Usar 'reports' (oficial V12800)
        (SELECT count(*)::int FROM public.app_suggestions); -- Usar 'app_suggestions'
END;
$$;

-- 4. PERMISSÕES FINAIS
GRANT EXECUTE ON FUNCTION public.admin_nuclear_suggestion_delete TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_reports_json_sovereign TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_counts_sovereign TO authenticated;

COMMIT;
