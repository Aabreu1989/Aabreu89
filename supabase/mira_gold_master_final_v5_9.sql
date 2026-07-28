-- 🛡️ MIRA V2026.GOLD: SQL NUCLEAR V5.9 (GOLD MASTER FINAL)
-- CEO: Amanda Abreu | Autoria: Antigravity (IA)

-- 1. Garantir que a Função de Feed Soberano V24 existe e está calibrada
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_email TEXT,
    author_avatar TEXT,
    title TEXT,
    content TEXT,
    category TEXT,
    likes BIGINT,
    useful_votes BIGINT,
    fake_votes BIGINT,
    is_verified BOOLEAN,
    "timestamp" TIMESTAMPTZ,
    nobel_score FLOAT,
    prestige_multiplier FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.author_id,
        u.name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar,
        p.title,
        p.content,
        p.category,
        COALESCE(p.likes_count, 0) as likes,
        COALESCE(p.useful_votes, 0) as useful_votes,
        COALESCE(p.fake_votes, 0) as fake_votes,
        p.is_verified,
        p.created_at as "timestamp",
        (
            -- MOTOR DE SOBERANIA V5.9 (CÁLCULO DE PONTUAÇÃO)
            CASE 
                WHEN u.email = 'amandasabreu89@gmail.com' THEN 100000 -- CEO SUPREMA
                WHEN u.role = 'admin' THEN 10000 -- ADMINISTRAÇÃO
                WHEN p.is_verified = true THEN 5000 -- VERIFICADOS
                ELSE 0
            END +
            COALESCE(p.likes_count, 0) * 10 +
            COALESCE(p.useful_votes, 0) * 50 -
            COALESCE(p.fake_votes, 0) * 100
        )::FLOAT as nobel_score,
        1.5 as prestige_multiplier
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.validation_status != 'deleted'
    ORDER BY nobel_score DESC, p.created_at DESC;
END;
$$;

-- 2. Garantir que a CEO tem acesso de Super Admin
UPDATE users 
SET role = 'admin', reputation = 100000 
WHERE email = 'amandasabreu89@gmail.com';

-- 3. Verificação de Integridade
DO $$ 
BEGIN 
    RAISE NOTICE '💎 MIRA: SQL V5.9 Aplicado. Soberania Reestabelecida.';
END $$;
