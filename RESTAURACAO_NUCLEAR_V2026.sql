-- 👑 MIRA NUCLEAR RESTORATION V2026.GOLD
-- OBJETIVO: Erradicar erros 404 de schema, restaurar RPCs e garantir soberania de dados.

-- 0. Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS vector;

BEGIN;

-- 1. Tabelas de Gamificação (Corrigindo Erro public.badges 404)
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    rarity TEXT DEFAULT 'common',
    points_required INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.reputation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    points INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabelas de Suporte e Admin
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    offender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    service_id UUID,
    reason TEXT NOT NULL,
    reported_content_text TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar colunas se a tabela já existir
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS offender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_content_text TEXT;

CREATE TABLE IF NOT EXISTS public.app_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabelas de Interação e Telemetria
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    category TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, comment_id)
);

CREATE TABLE IF NOT EXISTS public.post_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL, -- like, useful, fake
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, post_id, vote_type)
);

-- 4. IA e Base de Conhecimento (Saber IA Fix)
CREATE TABLE IF NOT EXISTS public.ai_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT NOT NULL,
    information TEXT NOT NULL,
    embedding vector(768), 
    metadata JSONB DEFAULT '{}'::jsonb,
    category TEXT,
    url TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Reforço de Colunas (Crucial para o RPC)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS nobel_score INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS urgency INT DEFAULT 1;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- 6. RPCs de Sistema

-- Busca de Conhecimento IA (Sniper v5)
DROP FUNCTION IF EXISTS public.match_knowledge_sniper_v5(vector, float, int);
DROP FUNCTION IF EXISTS public.match_knowledge_sniper_v5(vector(1536), float, int);
DROP FUNCTION IF EXISTS public.match_knowledge_sniper_v5(vector(768), float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_sniper_v5 (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  topic text,
  content text,
  metadata jsonb,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.topic,
    k.information as content,
    k.metadata,
    k.category,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM public.ai_knowledge k
  WHERE 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Busca de Perfis (Reputação) - VERSÃO PAGINADA PARA ADMIN
DROP FUNCTION IF EXISTS public.search_profiles_unaccent(text);
DROP FUNCTION IF EXISTS public.search_profiles_unaccent(text, int, int);

CREATE OR REPLACE FUNCTION public.search_profiles_unaccent(
    search_term TEXT,
    page_size INT DEFAULT 20,
    page_offset INT DEFAULT 0
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

-- Feed Soberano v25 (Param p_user_id como TEXT para maior compatibilidade JS)
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v25(int, int, uuid);
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v25(integer, integer, uuid);
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v25(int, int, text);
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v25(integer, integer, text);

CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v25(
    p_limit INT, 
    p_offset INT,
    p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT,
    author_is_verified BOOLEAN,
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
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := CASE WHEN p_user_id IS NOT NULL AND p_user_id <> '' THEN p_user_id::UUID ELSE NULL END;

    RETURN QUERY
    SELECT 
        p.id,
        p.author_id,
        COALESCE(prof.full_name, prof.username, 'Membro')::TEXT as author_name,
        prof.avatar_url::TEXT as author_avatar,
        COALESCE(prof.is_verified, false) as author_is_verified,
        p.title::TEXT,
        p.content::TEXT,
        p.category::TEXT,
        p.background_image::TEXT,
        p.is_verified,
        p.validation_status::TEXT,
        p.urgency,
        p.created_at,
        p.translations,
        COALESCE(p.likes_count, 0) as likes,
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'useful') as useful_votes,
        (SELECT count(*)::int FROM public.post_votes v WHERE v.post_id = p.id AND v.vote_type = 'fake') as fake_votes,
        (SELECT count(*)::int FROM public.reports r WHERE r.post_id = p.id) as reports,
        COALESCE(p.nobel_score, 0) as nobel_score,
        jsonb_build_object(
            'name', COALESCE(prof.full_name, prof.username, 'Membro'),
            'avatar_url', prof.avatar_url,
            'is_verified', prof.is_verified
        ) as author,
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id,
                'content', c.content,
                'created_at', c.created_at,
                'author_id', c.author_id,
                'likes', c.likes_count,
                'author', jsonb_build_object(
                    'name', COALESCE(cauth.full_name, cauth.username, 'Membro'),
                    'avatar_url', cauth.avatar_url
                )
            )) FROM public.comments c 
             JOIN public.profiles cauth ON c.author_id = cauth.id
             WHERE c.post_id = p.id), '[]'::jsonb
        ) as comments,
        EXISTS (
            SELECT 1 FROM public.post_votes v 
            WHERE v.post_id = p.id AND v.user_id = v_user_id AND v.vote_type = 'like'
        ) as is_liked_by_user,
        EXISTS (
            SELECT 1 FROM public.saved_posts s 
            WHERE s.post_id = p.id AND s.user_id = v_user_id
        ) as is_saved_by_user,
        (
            SELECT vote_type::TEXT FROM public.post_votes v 
            WHERE v.post_id = p.id AND v.user_id = v_user_id AND v.vote_type IN ('useful', 'fake')
            LIMIT 1
        ) as user_vote
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC PURGA NUCLEAR
CREATE OR REPLACE FUNCTION public.mira_nuclear_purge_user(target_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.profiles WHERE id = target_uid;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Permissões de Soberania
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ativar RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas
DROP POLICY IF EXISTS "Users can manage own activity" ON public.activity_logs;
CREATE POLICY "Users can manage own activity" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can see own notifications" ON public.notifications;
CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own saves" ON public.saved_posts;
CREATE POLICY "Users can manage own saves" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own comment likes" ON public.comment_likes;
CREATE POLICY "Users can manage own comment likes" ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

-- 7. Dados Iniciais de Gamificação e Soberania
INSERT INTO public.badges (id, name, description, icon_name, rarity) VALUES
('pioneer', 'Pioneiro MIRA', 'Concedido aos primeiros utilizadores que acreditaram no projeto.', 'Award', 'legendary'),
('verified', 'Conta Verificada', 'Identidade validada pessoalmente pela equipa MIRA.', 'ShieldCheck', 'rare'),
('helper', 'Mestre dos Documentos', 'Especialista em processos de regularização e documentação.', 'FileText', 'common')
ON CONFLICT (id) DO NOTHING;

-- 🛡️ MIRA SOBERANIA: Conteúdo Base para Conhecimento IA
INSERT INTO public.ai_knowledge (topic, information, category, is_verified) VALUES
('Artigo 88.º n.º 2 (Manifestação de Interesse)', 'A Manifestação de Interesse ao abrigo do Artigo 88.º n.º 2 foi extinta em Junho de 2024. Atualmente, a entrada em Portugal para trabalho exige um Visto Consular prévio. Processos submetidos antes da extinção continuam em análise pela AIMA.', 'Residência & Vistos', true),
('Artigo 89.º n.º 2 (Trabalho Independente)', 'Tal como o Art. 88, a Manifestação de Interesse para trabalhadores independentes (recibos verdes) foi revogada. É obrigatória a obtenção de visto de residência ou estada temporária no consulado de origem.', 'Residência & Vistos', true),
('Visto CPLP (Residência)', 'O Visto CPLP permite a cidadãos da Comunidade de Países de Língua Portuguesa a obtenção de uma autorização de residência simplificada. Em 2024, foi introduzido o novo modelo que permite a circulação no Espaço Schengen após a emissão do título físico.', 'Residência & Vistos', true),
('NIF (Número de Identificação Fiscal)', 'O NIF é o documento base para qualquer transação em Portugal. Pode ser obtido numa Loja do Cidadão ou Serviço de Finanças. Estrangeiros não residentes na UE/EEE podem necessitar de um representante fiscal residente em Portugal.', 'Finanças & Impostos', true),
('AIMA (Agência para a Integração, Migrações e Asilo)', 'A AIMA substituiu o antigo SEF. É responsável pela gestão dos títulos de residência e integração de imigrantes. Os agendamentos são realizados maioritariamente através do portal digital oficial.', 'Instituições', true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

