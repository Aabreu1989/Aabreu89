-- ============================================================
-- 🏛️ MIRA RESTAURAÇÃO SUPREMA V2026.GOLD
-- Reconstrução de Tabelas Núcleo e Infraestrutura do Admin Hub
-- ============================================================

-- 1. TABELAS NÚCLEO (Se não existirem)

-- 💼 VAGAS DE EMPREGO
CREATE TABLE IF NOT EXISTS public.job_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    location TEXT,
    source_name TEXT,
    source_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    work_topic TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 🎓 CURSOS
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    duration TEXT,
    image_url TEXT,
    link TEXT,
    is_iefp_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 🛠️ SERVIÇOS PÚBLICOS / APOIO
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    address TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 🚩 DENÚNCIAS DA COMUNIDADE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID,
    comment_id UUID,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, resolved, dismissed
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 💡 SUGESTÕES E MELHORIAS
CREATE TABLE IF NOT EXISTS public.app_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 📊 ESTATÍSTICAS DO DASHBOARD (CACHE)
CREATE TABLE IF NOT EXISTS public.admin_dashboard_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_users INTEGER DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    total_courses INTEGER DEFAULT 0,
    total_sources INTEGER DEFAULT 14,
    total_downloads INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VIEWS ESTRATÉGICAS PARA O ADMIN HUB

-- 🚩 VIEW DE DENÚNCIAS CONSOLIDADA
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT 
    r.*,
    reporter.name as reporter_name,
    offender.name as offender_name,
    offender.avatar_url as offender_avatar,
    COALESCE(p.content, c.content) as reported_content_text_full
FROM public.reports r
LEFT JOIN public.profiles reporter ON r.reporter_id = reporter.id
LEFT JOIN public.profiles offender ON r.target_user_id = offender.id
LEFT JOIN public.posts p ON r.post_id = p.id
LEFT JOIN public.comments c ON r.comment_id = c.id;

-- 💡 VIEW DE SUGESTÕES
CREATE OR REPLACE VIEW public.admin_suggestions_view AS
SELECT 
    s.*,
    u.name as user_name,
    u.avatar_url as user_avatar,
    u.email as user_email
FROM public.app_suggestions s
LEFT JOIN public.profiles u ON s.user_id = u.id;

-- 🧠 VIEW DO SABER IA (CONHECIMENTO ADMIN)
CREATE OR REPLACE VIEW public.admin_saber_view AS
SELECT 
    id,
    topic,
    content,
    category,
    created_at
FROM public.knowledge_base
UNION ALL
SELECT 
    id,
    topic,
    content,
    category,
    created_at
FROM public.saber_ia;

-- 3. PERMISSÕES E SEGURANÇA (RLS)

ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
CREATE POLICY "Public Read Jobs" ON public.job_posts FOR SELECT USING (true);
CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);

-- Políticas de Admin
CREATE POLICY "Admin All Access Jobs" ON public.job_posts ALL USING (auth.jwt()->>'email' = 'amandasabreu89@gmail.com');
CREATE POLICY "Admin All Access Courses" ON public.courses ALL USING (auth.jwt()->>'email' = 'amandasabreu89@gmail.com');
CREATE POLICY "Admin All Access Services" ON public.services ALL USING (auth.jwt()->>'email' = 'amandasabreu89@gmail.com');
CREATE POLICY "Admin All Access Reports" ON public.reports ALL USING (auth.jwt()->>'email' = 'amandasabreu89@gmail.com');
CREATE POLICY "Admin All Access Suggestions" ON public.app_suggestions ALL USING (auth.jwt()->>'email' = 'amandasabreu89@gmail.com');

-- 4. BOOTSTRAP INICIAL DE STATS
INSERT INTO public.admin_dashboard_stats (id, total_users, total_jobs, total_courses)
VALUES (1, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
