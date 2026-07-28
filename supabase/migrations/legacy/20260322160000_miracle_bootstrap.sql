-- MIRA V11000: MIRACLE BOOTSTRAP (VERSÃO FINAL — SEM ERROS)
-- Este script reconstrói a base de dados e as ferramentas do Admin Hub

-- 0. Limpeza total para evitar conflitos
DROP FUNCTION IF EXISTS admin_get_dashboard_stats_v2();
DROP FUNCTION IF EXISTS admin_get_dashboard_stats_v2() CASCADE;
DROP FUNCTION IF EXISTS admin_get_all_users_robust();
DROP FUNCTION IF EXISTS admin_get_all_users_robust() CASCADE;
DELETE FROM public.profiles WHERE email = 'amandasabreu89@gmail.com';

-- 1. Garantir que a coluna created_at existe (pode não ter sido adicionada ainda)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'followers_count'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN followers_count integer DEFAULT 0;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'following_count'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN following_count integer DEFAULT 0;
    END IF;
END $$;

-- 2. Dashboard Stats RPC
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats_v2()
RETURNS json
SECURITY DEFINER
AS $$
DECLARE result json;
BEGIN
    SELECT json_build_object(
        'userCount', (SELECT count(*) FROM public.profiles),
        'jobCount',  (SELECT count(*) FROM public.job_posts),
        'courseCount', (SELECT count(*) FROM public.courses),
        'serviceCount', (SELECT count(*) FROM public.map_alerts),
        'reportCount', (SELECT count(*) FROM public.community_reports WHERE status = 'pending'),
        'ratingCount', (SELECT count(*) FROM public.service_ratings),
        'lastSync', now()
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. User Fetch RPC (com a assinatura correta de retorno)
CREATE OR REPLACE FUNCTION public.admin_get_all_users_robust()
RETURNS TABLE (
    id uuid, name text, email text, avatar_url text,
    reputation integer, trust_level text, role text,
    is_muted boolean, is_blocked boolean,
    created_at timestamptz, followers_count integer, following_count integer
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.name, p.email, p.avatar_url,
        COALESCE(p.reputation, 0),
        p.trust_level, p.role, p.is_muted, p.is_blocked,
        p.created_at,
        COALESCE(p.followers_count, 0),
        COALESCE(p.following_count, 0)
    FROM public.profiles p
    ORDER BY p.created_at DESC LIMIT 2000;
END;
$$ LANGUAGE plpgsql;

-- 4. RECRIAR PERFIL DA AMANDA COMO ADMIN
INSERT INTO public.profiles (id, name, email, role, reputation, trust_level, is_muted, is_blocked)
SELECT id, 'Amanda Abreu', email, 'admin', 1000, 'elite', false, false
FROM auth.users WHERE LOWER(email) = 'amandasabreu89@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', reputation = 1000, trust_level = 'elite';

-- Preencher created_at do auth.users
UPDATE public.profiles p SET created_at = u.created_at
FROM auth.users u WHERE p.id = u.id AND (p.created_at IS NULL);

-- 5. SEED DE DADOS PARA O DASHBOARD
INSERT INTO public.courses (title, provider, category, description, type, duration, image, is_iefp_synced)
VALUES ('Português para Estrangeiros', 'IEFP', 'Língua', 'Curso de integração linguística.', 'Presencial', '50h', 'https://images.unsplash.com/photo-1544652478-6653e09f18a2', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.map_alerts (title, category, address, city, lat, lng, type)
VALUES ('CNAIM Lisboa (Bootstrap)', 'Oficial', 'Rua Álvaro Coutinho, 14', 'Lisboa', 38.7258, -9.1341, 'Public Service')
ON CONFLICT DO NOTHING;

INSERT INTO public.job_posts (title, company, location, type, category, work_topic, source_name)
VALUES ('Desenvolvedor React Native', 'MIRA Tech', 'Lisboa / Remoto', 'Full-time', 'Trabalho & Carreira', 'Tecnologia, Dados & IA', 'Interno')
ON CONFLICT DO NOTHING;

-- 6. PERMISSÕES FINAIS
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_robust() TO authenticated;

-- 7. RLS PARA PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;
CREATE POLICY "Admins can see all profiles" ON public.profiles 
FOR SELECT USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


