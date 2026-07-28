-- 👑 MIRA ADMIN HUB: REAL-TIME STATS V2026.SUPREME
-- OBJETIVO: Criar RPCs para contagem real de interações e votos.

BEGIN;

-- 1. RPC para somar todos os likes da plataforma
CREATE OR REPLACE FUNCTION public.sum_post_likes()
RETURNS INT AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(likes), 0)::INT FROM public.posts);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RPC para somar todos os votos "Úteis" (Verificados pela Comunidade)
CREATE OR REPLACE FUNCTION public.sum_post_useful()
RETURNS INT AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(useful_votes), 0)::INT FROM public.posts);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC para somar todos os votos "Fake"
CREATE OR REPLACE FUNCTION public.sum_post_fake()
RETURNS INT AS $$
BEGIN
    RETURN (SELECT COALESCE(SUM(fake_votes), 0)::INT FROM public.posts);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC para contagem total de comentários
CREATE OR REPLACE FUNCTION public.count_total_comments()
RETURNS INT AS $$
BEGIN
    RETURN (SELECT count(*)::INT FROM public.comments);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atualizar a tabela de estatísticas do dashboard (Admin Console)
-- Garante que temos as colunas necessárias para o cache se necessário
ALTER TABLE public.admin_dashboard_stats ADD COLUMN IF NOT EXISTS total_comments INT DEFAULT 0;
ALTER TABLE public.admin_dashboard_stats ADD COLUMN IF NOT EXISTS total_likes INT DEFAULT 0;
ALTER TABLE public.admin_dashboard_stats ADD COLUMN IF NOT EXISTS total_useful INT DEFAULT 0;
ALTER TABLE public.admin_dashboard_stats ADD COLUMN IF NOT EXISTS total_fake INT DEFAULT 0;

-- 6. Recriar View de Estatísticas para tempo real
DROP VIEW IF EXISTS public.admin_dashboard_stats CASCADE;
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*)::INT FROM public.job_posts) AS total_jobs,
    (SELECT COUNT(DISTINCT source_name)::INT FROM public.job_posts WHERE source_name IS NOT NULL) AS total_job_sources,
    (SELECT COUNT(*)::INT FROM public.courses) AS total_courses,
    (SELECT COUNT(*)::INT FROM public.services) AS total_services,
    (SELECT COUNT(*)::INT FROM public.profiles) AS total_users,
    (SELECT COUNT(*)::INT FROM public.reports) AS total_reports,
    (SELECT COALESCE(SUM(likes), 0)::INT FROM public.posts) AS total_likes,
    (SELECT COUNT(*)::INT FROM public.comments) AS total_comments,
    (SELECT COUNT(*)::INT FROM public.user_documents) AS total_downloads;

GRANT SELECT ON public.admin_dashboard_stats TO anon, authenticated, service_role;

COMMIT;
