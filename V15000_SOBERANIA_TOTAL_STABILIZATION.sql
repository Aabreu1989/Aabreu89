
-- ============================================================
-- 💎 MIRA V2026.GOLD: SOBERANIA TOTAL (V15000)
-- ------------------------------------------------------------
-- MISSÃO: Estabilização de Dados, Eliminação de Fantasmas e Persistência.
-- ALVO: posts, knowledge_store, knowledge_base, interações.
-- ============================================================

BEGIN;

-- [1] REFORÇO DE CASCATA (Fim dos Zombies)
-- Garantimos que ao apagar um POST, tudo o que depende dele morre no plano físico.
ALTER TABLE public.post_votes DROP CONSTRAINT IF EXISTS post_votes_post_id_fkey;
ALTER TABLE public.post_votes ADD CONSTRAINT post_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.saved_posts DROP CONSTRAINT IF EXISTS saved_posts_post_id_fkey;
ALTER TABLE public.saved_posts ADD CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_post_id_fkey;
ALTER TABLE public.reports ADD CONSTRAINT reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_post_id_fkey;
ALTER TABLE public.comments ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- [2] MOTOR DE EXPURGO SABER IA (V15000)
-- Limpa o cérebro da IA quando um post é vaporizado.
CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v15000()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o post for apagado, removemos do cérebro IA (Knowledge Store e Base)
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = OLD.id;
        DELETE FROM public.knowledge_base WHERE (metadata->>'post_id')::uuid = OLD.id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Removemos o gatilho antigo se existir e aplicamos o novo SOBERANO
DROP TRIGGER IF EXISTS trg_sync_post_to_ai_v10650 ON public.posts;
CREATE TRIGGER trg_sync_post_to_ai_v15000 
BEFORE DELETE ON public.posts 
FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_ai_v15000();

-- [3] LIBERDADE DE INTERACÇÃO (Grants)
-- Garante que o frontend pode persistir votos e saves sem bloqueios de permissão.
GRANT ALL ON TABLE public.post_votes TO authenticated;
GRANT ALL ON TABLE public.saved_posts TO authenticated;
GRANT ALL ON TABLE public.comment_likes TO authenticated;

-- [4] PROTOCOLO DE VERIFICAÇÃO (CEO ONLY)
-- Função para a Amanda verificar posts de terceiros.
CREATE OR REPLACE FUNCTION public.verify_post(p_post_id UUID, p_is_verified BOOLEAN)
RETURNS VOID AS $$
BEGIN
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        UPDATE public.posts SET is_verified = p_is_verified WHERE id = p_post_id;
    ELSE
        RAISE EXCEPTION 'MIRA SECURITY: Apenas a CEO Amanda Abreu pode exalar este nível de autoridade.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_post(UUID, BOOLEAN) TO authenticated;

-- [5] RE-STABILIZAÇÃO DO FEED (V15000)
-- Adicionamos background_image e autoridade ao feed retornado.
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v15000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    background_image TEXT, -- ← Adicionado
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, translations JSONB, author_data JSONB, comments_data JSONB,
    post_votes JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH current_votes AS (
        SELECT v.post_id,
               COUNT(*) FILTER (WHERE v.vote_type = 'like')::INT as l,
               COUNT(*) FILTER (WHERE v.vote_type = 'useful')::INT as u,
               COUNT(*) FILTER (WHERE v.vote_type = 'fake')::INT as f,
               jsonb_agg(jsonb_build_object('user_id', v.user_id, 'vote_type', v.vote_type)) as all_votes
        FROM public.post_votes v GROUP BY v.post_id
    )
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.is_verified, p.validation_status, p.created_at,
        p.background_image,
        COALESCE(cv.l, 0), COALESCE(cv.u, 0), COALESCE(cv.f, 0), 0, -- reports simplificado por agora
        COALESCE(ns.calculated_nobel_score, 0)::INT, p.translations,
        jsonb_build_object(
            'name', COALESCE(prof.username, SPLIT_PART(prof.email, '@', 1), 'Membro'),
            'avatar_url', prof.avatar_url,
            'level', COALESCE(prof.level, 1),
            'is_verified', COALESCE(prof.is_verified, false),
            'followers_count', COALESCE(prof.followers_count, 0),
            'following_count', COALESCE(prof.following_count, 0)
        ),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'author_name', COALESCE(cp.username, 'Membro'),
                'author_avatar', cp.avatar_url,
                'author_id', c.author_id,
                'created_at', c.created_at, 'likes', c.likes
            )) FROM public.comments c LEFT JOIN public.profiles cp ON c.author_id = cp.id WHERE c.post_id = p.id
        ), '[]'::jsonb),
        COALESCE(cv.all_votes, '[]'::jsonb)
    FROM public.posts p
    LEFT JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN current_votes cv ON cv.post_id = p.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v15000 TO authenticated;

COMMIT;
