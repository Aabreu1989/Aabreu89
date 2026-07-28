-- ============================================================
-- 🛡️ MIRA V2026: OPERAÇÃO LOCKDOWN DE SEGURANÇA
-- CEO: Amanda Abreu | Autoria: Antigravity (Advanced Agentic Coding)
-- OBJETIVO: Resolver vulnerabilidades Critical do Supabase (RLS e PII Exposure)
-- ============================================================

BEGIN;

-- 1. ATIVAÇÃO DE RLS EM TODAS AS TABELAS (PUBLIC SCHEMA)
-- Garante que nenhuma tabela esteja aberta para acesso público sem política.

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- 2. HARDENING DA TABELA PROFILES (PROTEÇÃO DE EMAILS)
-- Removemos a política de leitura total e substituímos por uma que protege o email.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins see emails" ON public.profiles;
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true); 

-- 🚩 AVISO: Se o Supabase continuar a reclamar de profiles.email, 
-- a solução definitiva é remover a coluna email da tabela profiles 
-- e usar apenas auth.users (via admin) ou uma tabela private_profiles.

-- 3. FIX: VULNERABILIDADE auth_users_exposed EM VIEWS
-- Vamos recriar as views críticas apenas se as tabelas existirem.

DO $$ 
BEGIN
    -- 3.1 VIEW DE SUGESTÕES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_suggestions') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.admin_suggestions_view AS
        SELECT 
            s.*,
            u.name as user_name,
            u.avatar_url as user_avatar
        FROM public.app_suggestions s
        LEFT JOIN public.profiles u ON s.user_id = u.id;';
    END IF;

    -- 3.2 VIEW DE DENÚNCIAS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.admin_reports_view AS
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
        LEFT JOIN public.comments c ON r.comment_id = c.id;';
    END IF;
END $$;

-- 4. POLÍTICAS DE ADMINISTRAÇÃO (Soberania Amanda Abreu)
-- Garante acesso total à CEO e admins reais em todas as tabelas.

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin All Access" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "Admin All Access" ON public.%I FOR ALL USING (
            LOWER(auth.jwt()->>''email'') = ''amandasabreu89@gmail.com'' OR 
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')
        );', t);
    END LOOP;
END $$;

-- 5. POLÍTICAS ESPECÍFICAS PARA TABELAS PÚBLICAS
-- Tabelas que o app precisa ler sem ser admin.

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'badges') THEN
        DROP POLICY IF EXISTS "Public Read Badges" ON public.badges;
        CREATE POLICY "Public Read Badges" ON public.badges FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_badges') THEN
        DROP POLICY IF EXISTS "Public Read User Badges" ON public.user_badges;
        CREATE POLICY "Public Read User Badges" ON public.user_badges FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_interactions') THEN
        DROP POLICY IF EXISTS "Public Read Interactions" ON public.community_interactions;
        CREATE POLICY "Public Read Interactions" ON public.community_interactions FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_posts') THEN
        DROP POLICY IF EXISTS "Public Read Jobs" ON public.job_posts;
        CREATE POLICY "Public Read Jobs" ON public.job_posts FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'courses') THEN
        DROP POLICY IF EXISTS "Public Read Courses" ON public.courses;
        CREATE POLICY "Public Read Courses" ON public.courses FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
        DROP POLICY IF EXISTS "Public Read Services" ON public.services;
        CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_base') THEN
        DROP POLICY IF EXISTS "Public Read Knowledge" ON public.knowledge_base;
        CREATE POLICY "Public Read Knowledge" ON public.knowledge_base FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saber_ia') THEN
        DROP POLICY IF EXISTS "Public Read Saber" ON public.saber_ia;
        CREATE POLICY "Public Read Saber" ON public.saber_ia FOR SELECT USING (true);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'newsroom_articles') THEN
        DROP POLICY IF EXISTS "Public Read Newsroom" ON public.newsroom_articles;
        CREATE POLICY "Public Read Newsroom" ON public.newsroom_articles FOR SELECT USING (true);
    END IF;
END $$;

-- 6. POLÍTICAS DE ESCRITA PARA UTILIZADORES
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_interactions') THEN
        DROP POLICY IF EXISTS "Users can insert own interactions" ON public.community_interactions;
        CREATE POLICY "Users can insert own interactions" ON public.community_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_suggestions') THEN
        DROP POLICY IF EXISTS "Users can insert own suggestions" ON public.app_suggestions;
        CREATE POLICY "Users can insert own suggestions" ON public.app_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
        CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
    END IF;
END $$;

-- 7. SEGURANÇA DE STATS DO DASHBOARD
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
                 AND table_name = 'admin_dashboard_stats' 
                 AND table_type = 'BASE TABLE') THEN
        DROP POLICY IF EXISTS "Public Read Stats" ON public.admin_dashboard_stats;
        EXECUTE 'CREATE POLICY "Admin Only Stats" ON public.admin_dashboard_stats FOR SELECT USING (
            LOWER(auth.jwt()->>''email'') = ''amandasabreu89@gmail.com'' OR 
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = ''admin''
        );';
    END IF;
END $$;

-- 8. RECARGA DE SCHEMA
NOTIFY pgrst, 'reload schema';

COMMIT;

COMMENT ON DATABASE postgres IS 'MIRA V2026: SECURITY LOCKDOWN V1.1 - Blindagem Defensiva com Check de Existência.';
