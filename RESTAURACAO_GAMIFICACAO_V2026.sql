-- 👑 MIRA SUPREME DATABASE RESTORATION V2026.GOLD
-- OBJETIVO: Sincronização total de schema para Admin Hub e IA Soberana.

BEGIN;

-- 0. Extensões Nucleares
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Tabelas de Gamificação
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.reputation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Administração e Feedback
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. IA Soberana (RAG Optimized)
CREATE TABLE IF NOT EXISTS public.ai_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    information TEXT NOT NULL,
    category TEXT,
    url TEXT,
    embedding vector(768), -- Optimized for Gemini/Google Embeddings
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RPC: Busca Vetorial Sniper
CREATE OR REPLACE FUNCTION public.match_knowledge_sniper_v5(
    query_embedding vector(768),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    topic TEXT,
    content TEXT,
    category TEXT,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        k.id,
        k.topic,
        k.information as content,
        k.category,
        1 - (k.embedding <=> query_embedding) AS similarity
    FROM public.ai_knowledge k
    WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
    ORDER BY k.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Reputação Atómica
CREATE OR REPLACE FUNCTION public.increment_reputation(
    target_user_id UUID,
    amount INT
)
RETURNS INT AS $$
DECLARE
    new_score INT;
BEGIN
    UPDATE public.profiles
    SET reputation = COALESCE(reputation, 0) + amount
    WHERE id = target_user_id
    RETURNING reputation INTO new_score;
    
    RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Pesquisa Unaccent para Admin
CREATE OR REPLACE FUNCTION public.search_profiles_unaccent(
    search_term TEXT,
    page_size INT,
    page_offset INT
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    reputation INT,
    trust_level TEXT,
    role TEXT,
    is_muted BOOLEAN,
    is_blocked BOOLEAN,
    is_verified BOOLEAN,
    sovereignty_score INT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.full_name, p.username, p.email, p.avatar_url, 
        p.reputation, p.trust_level, p.role, p.is_muted, 
        p.is_blocked, p.is_verified, p.sovereignty_score,
        COUNT(*) OVER() as total_count
    FROM public.profiles p
    WHERE 
        p.full_name ILIKE '%' || search_term || '%' OR 
        p.username ILIKE '%' || search_term || '%' OR 
        p.email ILIKE '%' || search_term || '%'
    ORDER BY p.id DESC
    LIMIT page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Medalhas Mestre
INSERT INTO public.badges (id, title, description) VALUES
('coracao', 'Coração Solidário', 'Membros que ajudam ativamente.'),
('exemplar', 'Membro Exemplar', 'Alcançou 100 pontos de reputação.'),
('voz_autoridade', 'Voz da Autoridade', 'Líder com 500+ pontos.'),
('mira_gold', 'Membro Gold', 'Utilizador verificado e premium.')
ON CONFLICT (id) DO NOTHING;

-- 8. Permissões e Segurança
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_knowledge_sniper_v5 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_profiles_unaccent TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
