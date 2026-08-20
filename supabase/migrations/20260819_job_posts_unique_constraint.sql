-- ====================================================================
-- MIRA V2026.GOLD — FASE 3C: UNIQUE CONSTRAINT ON job_posts(source_url)
-- ====================================================================
-- Como a tabela foi 100% deduplicada dinamicamente (7.875 vagas unicas e 0 duplicadas),
-- este comando aplica a constraint de unicidade definitiva.

ALTER TABLE public.job_posts 
DROP CONSTRAINT IF EXISTS job_posts_source_url_unique;

ALTER TABLE public.job_posts 
ADD CONSTRAINT job_posts_source_url_unique UNIQUE (source_url);

-- Notificar PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload schema';
