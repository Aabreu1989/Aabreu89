-- 👑 MIRA SOBERANA: NOBEL SCORE RULES V2026.GOLD
-- Reconfiguração dos Destaques baseada em SOBERANIA TOTAL (AMANDA)

BEGIN;

-- 1. DESMONTAGEM DE SEGURANÇA
DROP VIEW IF EXISTS public.community_top_stories_nobel CASCADE;

-- 2. RECONSTRUÇÃO DA INTELIGÊNCIA DE DESTAQUES
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
WITH vote_counts AS (
    SELECT 
        post_id, 
        COUNT(*) FILTER (WHERE vote_type = 'like') as likes_agg, 
        COUNT(*) FILTER (WHERE vote_type = 'useful') as usefuls_agg, 
        COUNT(*) FILTER (WHERE vote_type = 'fake') as fakes_agg
    FROM public.post_votes 
    GROUP BY post_id
)
SELECT 
    p.id, 
    p.author_id, 
    p.title, 
    p.content, 
    p.category, 
    p.is_verified, 
    p.created_at,
    p.translations,
    (
      CASE 
        WHEN prof.email = 'amandasabreu89@gmail.com' THEN 3000 
        WHEN p.category = 'AIMA' OR p.content ILIKE '%AIMA%' THEN 5000 
        WHEN p.is_verified = true THEN 1000 
        ELSE 0 
      END 
      + (COALESCE(v.likes_agg, 0) * 10) 
      + (COALESCE(v.usefuls_agg, 0) * 50) 
      - (COALESCE(v.fakes_agg, 0) * 100)
    )::INT as calculated_nobel_score
FROM public.posts p 
JOIN public.profiles prof ON p.author_id = prof.id 
LEFT JOIN vote_counts v ON v.post_id = p.id
WHERE 
    p.validation_status IS DISTINCT FROM 'blocked'
    AND prof.role IS DISTINCT FROM 'blocked';

-- 3. PERMISSÕES SOBERANAS
GRANT SELECT ON public.community_top_stories_nobel TO anon, authenticated, service_role;

COMMIT;
