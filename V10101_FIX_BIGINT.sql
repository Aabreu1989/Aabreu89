-- 👑 SQL MASTER V10101 - SOBERANIA COMUNITÁRIA (AMANDA ABREU)
-- OBJETIVO: Resolver erro de tipo BIGINT no Nobel Score e garantir RAG.
-- FIX: Morte ao erro "Returned type bigint does not match expected type integer".
-- REGRA DE DESTAQUES: PROTOCOLO NOBEL V1 (AIMA > CEO > VERIFICADOS)
--

BEGIN;

-- 1. LIMPEZA DE GHOSTS (Prevenção de Erro 42P13)
-- Esta etapa garante que não sobra lixo das versões medíocres do desenvolvedor.
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v10000(integer, integer);
DROP VIEW IF EXISTS public.community_top_stories_nobel CASCADE;

-- 2. INFRAESTRUTURA DE INTERAÇÕES (Likes e Fact-Check)
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL, -- 'like', 'useful', 'fake'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, vote_type)
);

-- 3. INFRAESTRUTURA DE SALVAMENTO (Bookmark)
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- 4. REPARAÇÃO DA TABELA DE DENÚNCIAS (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. GATILHO DE INTELIGÊNCIA (RAG SOBERANO)
-- Garante que cada post da comunidade alimente a MIRA automaticamente.
CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v10101()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.knowledge_store (content, metadata)
    VALUES (
        NEW.content, 
        jsonb_build_object(
            'source', 'community',
            'post_id', NEW.id,
            'category', NEW.category,
            'is_official', NEW.is_verified
        )
    ) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_to_ai_v10101 ON public.posts;
CREATE TRIGGER trg_sync_post_to_ai_v10101
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_ai_v10101();

-- 6. VIEW NOBEL - FIX BIGINT (Conversão explícita para INTEGER)
-- Aqui reside a inteligência de Destaques que o Antigravity tentou simplificar.
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
WITH engagement_scores AS (
    SELECT 
        p.id as post_id,
        (
          CASE 
            WHEN prof.email = 'amandasabreu89@gmail.com' THEN 3000 -- CEO Priority
            WHEN p.category = 'AIMA' OR p.content ILIKE '%AIMA%' THEN 5000 -- AIMA Sovereignty
            WHEN p.is_verified = true THEN 1000 -- Verified Post
            ELSE 0 
          END +
          (SELECT count(*) * 10 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like') + 
          (SELECT count(*) * 50 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful') - 
          (SELECT count(*) * 100 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake')
        )::INT as calculated_score -- O CAST PARA INT RESOLVE O SUMIÇO DOS POSTS
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
)
SELECT 
    p.id, p.author_id, p.title, p.content, p.category, 
    p.background_image, p.is_verified, p.validation_status, 
    p.urgency, p.created_at, p.translations, p.likes,
    s.calculated_score as nobel_score
FROM public.posts p
JOIN engagement_scores s ON p.id = s.post_id
WHERE s.calculated_score > 0
ORDER BY s.calculated_score DESC;

-- 7. FUNÇÃO DE FEED ELITE V10101 (Sincronizada com Nobel e Fix de Tipos)
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v10000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, author_data JSONB, comments_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.is_verified, p.validation_status, p.created_at,
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like'),
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful'),
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake'),
        (SELECT count(*)::int FROM public.reports r WHERE r.post_id = p.id),
        COALESCE(ns.nobel_score, 0)::INT, -- Proteção contra o erro BigInt
        jsonb_build_object(
            'name', prof.username, 
            'avatar_url', prof.avatar_url, 
            'level', prof.level, 
            'is_verified', prof.is_verified
        ),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 
                'content', c.content, 
                'author_name', cp.username,
                'created_at', c.created_at
            )) 
            FROM public.comments c 
            JOIN public.profiles cp ON c.author_id = cp.id 
            WHERE c.post_id = p.id
        ), '[]'::jsonb)
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status != 'blocked'
    ORDER BY COALESCE(ns.nobel_score, 0) DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
