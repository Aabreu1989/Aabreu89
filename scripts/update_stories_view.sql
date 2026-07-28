-- 🎥 MIRA STORIES V2026.GOLD: SINCRONIZAÇÃO INSTANTÂNEA
-- Une a tabela 'stories' (posts recentes) com os posts de alto Nobel Score.

BEGIN;

CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
WITH active_stories AS (
    -- 1. Capturar Stories ativos da tabela 'stories'
    SELECT 
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.category,
        COALESCE(s.image_url, p.background_image) as background_image,
        p.is_verified,
        p.validation_status,
        p.urgency,
        p.created_at,
        p.nobel_score,
        prof.name as author_name,
        prof.avatar_url as author_avatar,
        prof.is_verified as author_is_verified,
        999999 as sort_priority -- Stories manuais/automáticos têm prioridade total
    FROM public.stories s
    JOIN public.posts p ON s.post_id = p.id
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE s.expires_at > now()
    AND p.validation_status != 'blocked'
),
top_posts AS (
    -- 2. Capturar Posts com Nobel Score elevado (Algoritmo original)
    SELECT 
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.category,
        p.background_image,
        p.is_verified,
        p.validation_status,
        p.urgency,
        p.created_at,
        p.nobel_score,
        prof.name as author_name,
        prof.avatar_url as author_avatar,
        prof.is_verified as author_is_verified,
        p.nobel_score as sort_priority
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    AND p.nobel_score >= 20
    AND NOT EXISTS (SELECT 1 FROM public.stories s2 WHERE s2.post_id = p.id AND s2.expires_at > now())
)
SELECT * FROM active_stories
UNION ALL
SELECT * FROM top_posts
ORDER BY sort_priority DESC, created_at DESC
LIMIT 20;

COMMIT;
