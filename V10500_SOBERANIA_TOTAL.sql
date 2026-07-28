-- 
-- 👑 SQL MASTER V10500 - SOBERANIA COMUNITÁRIA TOTAL (AMANDA ABREU)
-- OBJETIVO: Versão Final de Lançamento (05/04/2026).
-- FIX: Reinstalação do RAG Sync, Permissões Totais e Botões SoldADOS.
--

BEGIN;

-- 1. LIMPEZA DE SEGURANÇA (Prevenção de Colisão)
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v10000(integer, integer);
DROP VIEW IF EXISTS public.community_top_stories_nobel CASCADE;

-- 2. INFRAESTRUTURA DE SEGUIDORES E PERFIL
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);

-- Gatilho de Contagem de Seguidores (Mata o erro de persistência no Perfil)
CREATE OR REPLACE FUNCTION public.handle_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
        UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
        UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_follow_stats ON public.follows;
CREATE TRIGGER trg_follow_stats
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats();

-- 3. INFRAESTRUTURA DE INTERAÇÕES (BOTÕES: V, X, ❤️)
CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL, -- 'like', 'useful', 'fake'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, vote_type)
);

-- 4. INFRAESTRUTURA DE SALVAMENTO (BOTÃO: 🔖)
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- 5. REPARAÇÃO DA TABELA DE DENÚNCIAS (Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. GATILHO DE INTELIGÊNCIA (O NERVO RAG QUE O ANTIGRAVITY TIROU)
-- Garante que cada post vira conhecimento para a MIRA responder outros utilizadores.
CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v10500()
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

DROP TRIGGER IF EXISTS trg_sync_post_to_ai_v10500 ON public.posts;
CREATE TRIGGER trg_sync_post_to_ai_v10500
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_ai_v10500();

-- 7. VIEW NOBEL - REGRA DE DESTAQUES (Hierarquia de Autoridade)
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
          (SELECT count(*)::INT * 10 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'like') + 
          (SELECT count(*)::INT * 50 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful') - 
          (SELECT count(*)::INT * 100 FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake')
        )::INT as calculated_score
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

-- 8. FUNÇÃO DE FEED ELITE V10500 (Tudo em um para o Lançamento)
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v10000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, translations JSONB, author_data JSONB, comments_data JSONB
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
        COALESCE(ns.nobel_score, 0)::INT,
        p.translations,
        jsonb_build_object(
            'name', prof.username, 'avatar_url', prof.avatar_url, 
            'level', prof.level, 'is_verified', prof.is_verified,
            'followers_count', prof.followers_count, 'following_count', prof.following_count
        ),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'author_name', cp.username,
                'created_at', c.created_at, 'likes', c.likes
            )) FROM public.comments c JOIN public.profiles cp ON c.author_id = cp.id WHERE c.post_id = p.id
        ), '[]'::jsonb)
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN (SELECT ns_v.id, ns_v.nobel_score FROM public.community_top_stories_nobel ns_v) ns ON p.id = ns.id
    WHERE p.validation_status != 'blocked'
    ORDER BY COALESCE(ns.nobel_score, 0) DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. PERMISSÕES FINAIS (A GARANTIA DO LANÇAMENTO)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.post_votes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.comments TO authenticated;
GRANT INSERT ON public.reports TO authenticated;

COMMIT;
