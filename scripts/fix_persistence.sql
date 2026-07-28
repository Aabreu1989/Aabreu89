-- 👑 MIRA V2026.GOLD: RESTAURAÇÃO DE PERSISTÊNCIA TOTAL
-- CEO: Amanda Abreu | Autoria: Antigravity

BEGIN;

-- [1] CRIAR TABELAS EM FALTA
CREATE TABLE IF NOT EXISTS public.saved_posts (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- [2] ASSEGURAR COLUNAS NAS TABELAS CRÍTICAS
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS background_image TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- [3] ATUALIZAR RPC DO FEED PARA SUPORTAR PERSISTÊNCIA DE UTILIZADOR
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v24(p_limit INT, p_offset INT, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    title TEXT,
    content TEXT,
    category TEXT,
    background_image TEXT,
    is_verified BOOLEAN,
    validation_status TEXT,
    urgency INT,
    created_at TIMESTAMPTZ,
    translations JSONB,
    likes INT,
    useful_votes INT,
    fake_votes INT,
    reports INT,
    nobel_score INT,
    author JSONB,
    comments JSONB,
    is_liked_by_user BOOLEAN,
    is_saved_by_user BOOLEAN,
    user_vote TEXT
) AS $$
BEGIN
    RETURN QUERY
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
        p.translations,
        p.likes,
        p.useful_votes,
        p.fake_votes,
        (SELECT count(*) FROM public.reports r WHERE r.post_id = p.id)::int as reports,
        p.nobel_score,
        jsonb_build_object(
            'name', prof.name,
            'avatar_url', prof.avatar_url,
            'bio', prof.bio,
            'badges', prof.badges,
            'is_verified', prof.is_verified,
            'followers_count', prof.followers_count,
            'following_count', prof.following_count
        ) as author,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'content', c.content,
                'created_at', c.created_at,
                'author_id', c.author_id,
                'likes', c.likes,
                'parent_id', c.parent_id,
                'translations', c.translations,
                'author', jsonb_build_object(
                    'name', cauth.name,
                    'avatar_url', cauth.avatar_url,
                    'is_verified', cauth.is_verified
                )
            )) FROM public.comments c 
             JOIN public.profiles cauth ON c.author_id = cauth.id
             WHERE c.post_id = p.id), '[]'::jsonb
        ) as comments,
        EXISTS (SELECT 1 FROM public.post_votes v WHERE v.post_id = p.id AND v.user_id = p_user_id AND v.vote_type = 'like') as is_liked_by_user,
        EXISTS (SELECT 1 FROM public.saved_posts s WHERE s.post_id = p.id AND s.user_id = p_user_id) as is_saved_by_user,
        (SELECT vote_type FROM public.post_votes v WHERE v.post_id = p.id AND v.user_id = p_user_id AND v.vote_type IN ('useful', 'fake') LIMIT 1) as user_vote
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [4] RLS PARA NOVAS TABELAS
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Saved posts access" ON public.saved_posts;
CREATE POLICY "Saved posts access" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public stories" ON public.stories;
CREATE POLICY "Public stories" ON public.stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Author stories" ON public.stories;
CREATE POLICY "Author stories" ON public.stories FOR ALL USING (auth.uid() = author_id);

COMMIT;
