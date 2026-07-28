-- ============================================================
-- 🛡️ MIRA V2026: SNIPER ADMIN DASHBOARD v1000
-- AUTHOR: Antigravity (Advanced Agentic Coding)
-- TARGET: Admin Hub Realtime Performance & Accuracy
-- ============================================================

BEGIN;

-- 1. RPC ULTRA-FAST PARA DASHBOARD
-- Agrega todas as contagens em uma única chamada de banco de dados.
CREATE OR REPLACE FUNCTION public.get_mira_admin_stats_v2026()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Verificação de Soberania (Apenas CEO Amanda ou Admins)
    IF LOWER(auth.jwt()->>'email') != 'amandasabreu89@gmail.com' AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'MIRA SECURITY: Acesso negado às estatísticas soberanas.';
    END IF;

    SELECT jsonb_build_object(
        'users', (SELECT count(*) FROM public.profiles),
        'reports', (SELECT count(*) FROM public.reports),
        'jobs', (SELECT count(*) FROM public.job_posts),
        'courses', (SELECT count(*) FROM public.courses),
        'services', (SELECT count(*) FROM public.map_alerts),
        'suggestions', (SELECT count(*) FROM public.app_suggestions),
        'denied_emails', (SELECT count(*) FROM public.denied_emails),
        'ai_knowledge', (SELECT count(*) FROM public.knowledge_base),
        'downloads', 3500, -- Meta-data de marketing (alinhado com o Admin Hub UI)
        'last_updated', now()
    ) INTO result;

    RETURN result;
END;
$$;

-- 2. VIEW PARA SUGESTÕES (HIDRATAÇÃO COMPLETA)
-- Garante que o Admin Hub carregue dados reais de utilizadores.
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
        'name', COALESCE(p.username, p.name, 'Membro MIRA'), 
        'avatar', p.avatar_url
    ) as user_data
FROM public.app_suggestions s
LEFT JOIN public.profiles p ON s.user_id = p.id
ORDER BY s.created_at DESC;

COMMIT;
