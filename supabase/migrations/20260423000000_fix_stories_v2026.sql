-- 🏛️ MIRA STORIES INFRASTRUCTURE v2026.GOLD
-- Reconstrução da Tabela Stories e View Nobél de Destaques

-- 1. Tabela de Stories
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Segurança RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public stories" ON public.stories;
CREATE POLICY "Public stories" ON public.stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert stories" ON public.stories;
CREATE POLICY "Authenticated insert stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admin All Access" ON public.stories;
CREATE POLICY "Admin All Access" ON public.stories FOR ALL USING (
    LOWER(auth.jwt()->>''email'') = ''amandasabreu89@gmail.com'' OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')
);

-- 2. View Nobél de Stories (community_top_stories_nobel)
-- Unifica as tabelas para que o app leia tudo num único fetch
CREATE OR REPLACE VIEW public.community_top_stories_nobel AS
SELECT 
    p.id,
    p.author_id,
    p.title,
    p.content,
    p.category,
    p.is_verified,
    p.created_at,
    p.likes_count as likes,
    prof.name as author_name,
    prof.avatar_url as author_avatar,
    prof.is_verified as author_is_verified,
    s.image_url as background_image,
    s.created_at as story_created_at,
    (CASE WHEN prof.role = ''admin'' THEN 10000 ELSE 0 END) + 
    (p.likes_count * 10) as nobel_score
FROM public.stories s
JOIN public.posts p ON s.post_id = p.id
JOIN public.profiles prof ON s.author_id = prof.id
WHERE s.expires_at > now()
ORDER BY nobel_score DESC, p.created_at DESC;

-- Recarregar Cache
NOTIFY pgrst, 'reload schema';
