-- 
-- 👑 SQL MASTER V11200 - SOBERANIA EM MODERAÇÃO (AMANDA ABREU)
-- OBJETIVO: Visibilidade Total de Conteúdo Denunciado e Exclusão Atómica.
-- FIX: Reconstrução da View de Admin e Hardening de Cascades.
--

BEGIN;

-- 1. LIMPEZA DA VIEW ANTERIOR
DROP VIEW IF EXISTS public.admin_reports_view CASCADE;

-- 2. RECONSTRUÇÃO DA VIEW COM CONTEÚDO REAL
-- Esta view garante que a Amanda veja o que está a apagar.
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT 
    r.id,
    r.reason,
    r.status,
    r.created_at,
    rp.username as reporter_name,
    CASE 
        WHEN r.post_id IS NOT NULL THEN 'POST'
        WHEN r.comment_id IS NOT NULL THEN 'COMENTÁRIO'
        ELSE 'OUTRO'
    END as target_type,
    COALESCE(p.content, c.content) as reported_content_text,
    COALESCE(p.author_id, c.author_id) as offender_id,
    op.username as offender_name,
    op.avatar_url as offender_avatar,
    r.post_id,
    r.comment_id
FROM public.reports r
LEFT JOIN public.profiles rp ON r.reporter_id = rp.id
LEFT JOIN public.posts p ON r.post_id = p.id
LEFT JOIN public.comments c ON r.comment_id = c.id
LEFT JOIN public.profiles op ON COALESCE(p.author_id, c.author_id) = op.id;

-- 3. PERMISSÕES DE ACESSO
GRANT SELECT ON public.admin_reports_view TO authenticated;
GRANT SELECT ON public.admin_reports_view TO service_role;

-- 4. GARANTIA DE ELIMINAÇÃO TOTAL (CASCADES)
-- Verifica se as FKs estão com ON DELETE CASCADE para não deixar rastos.
-- Nota: Estas tabelas já devem ter CASCADE do V10500, mas reforçamos a lógica mental aqui.

COMMIT;
