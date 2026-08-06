-- 1. CRIAÇÃO DE TABELAS DEFINITIVAS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    nationality TEXT DEFAULT 'Não especificada',
    age_range TEXT,
    location TEXT,
    main_challenge TEXT,
    role TEXT DEFAULT 'member',
    reputation INT DEFAULT 0,
    trust_level TEXT DEFAULT 'Observador',
    is_verified BOOLEAN DEFAULT FALSE,
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    verified_posts_count INT DEFAULT 0,
    total_likes_received INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Post Comunitário',
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Geral',
    background_image TEXT DEFAULT '',
    validation_status TEXT DEFAULT 'approved',
    nobel_score INT DEFAULT 10,
    likes INT DEFAULT 0,
    useful_votes INT DEFAULT 0,
    fake_votes INT DEFAULT 0,
    review_votes INT DEFAULT 0,
    reports INT DEFAULT 0,
    translations JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    urgency INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    likes_count INT DEFAULT 0,
    translations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 2. POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura Publica Posts" ON public.posts;
CREATE POLICY "Leitura Publica Posts" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Escrita Posts Auth" ON public.posts;
CREATE POLICY "Escrita Posts Auth" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Gestao Posts Autor" ON public.posts;
CREATE POLICY "Gestão Posts Autor" ON public.posts FOR ALL USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Leitura Publica Perfis" ON public.profiles;
CREATE POLICY "Leitura Publica Perfis" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestao Proprio Perfil" ON public.profiles;
CREATE POLICY "Gestao Proprio Perfil" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Gestao Likes User" ON public.post_likes;
CREATE POLICY "Gestao Likes User" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Gestao Saved User" ON public.saved_posts;
CREATE POLICY "Gestao Saved User" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Leitura Comentarios" ON public.comments;
CREATE POLICY "Leitura Comentarios" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insercao Comentarios" ON public.comments;
CREATE POLICY "Insercao Comentarios" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 3. TRIGGERS DE GAMIFICAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION update_user_reputation_on_like()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET total_likes_received = total_likes_received + 1,
        reputation = reputation + 5,
        trust_level = CASE 
            WHEN reputation + 5 >= 2500 THEN 'Elite'
            WHEN reputation + 5 >= 500 THEN 'Especialista'
            WHEN reputation + 5 >= 100 THEN 'Pioneiro'
            ELSE 'Observador'
        END
    WHERE id = (SELECT author_id FROM public.posts WHERE id = NEW.post_id);
    
    UPDATE public.posts
    SET likes = likes + 1
    WHERE id = NEW.post_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_like_reputation ON public.post_likes;
CREATE TRIGGER trigger_like_reputation
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION update_user_reputation_on_like();

CREATE OR REPLACE FUNCTION update_user_reputation_on_post()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET verified_posts_count = verified_posts_count + 1,
        reputation = reputation + 50,
        trust_level = CASE 
            WHEN reputation + 50 >= 2500 THEN 'Elite'
            WHEN reputation + 50 >= 500 THEN 'Especialista'
            WHEN reputation + 50 >= 100 THEN 'Pioneiro'
            ELSE 'Observador'
        END
    WHERE id = NEW.author_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_post_reputation ON public.posts;
CREATE TRIGGER trigger_post_reputation
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE FUNCTION update_user_reputation_on_post();

-- 4. ACTIVAÇÃO DO REALTIME PUBLICATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts, public.comments;
