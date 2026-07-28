-- MIRA V11000: AUTO-PROFILE CREATION TRIGGER
-- Garante que CADA novo utilizador que se regista tem um perfil criado automaticamente
-- Nunca mais a lista vai estar vazia

-- 1. Função que cria o perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role, reputation, trust_level, is_muted, is_blocked)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'member',
        0,
        'Observador',
        false,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name);
    RETURN NEW;
END;
$$;

-- 2. Criar o trigger ligado ao auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: criar perfis para todos os utilizadores auth que ainda não têm perfil
INSERT INTO public.profiles (id, name, email, role, reputation, trust_level, is_muted, is_blocked)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
    u.email,
    CASE WHEN LOWER(u.email) = 'amandasabreu89@gmail.com' THEN 'admin' ELSE 'member' END,
    CASE WHEN LOWER(u.email) = 'amandasabreu89@gmail.com' THEN 1000 ELSE 0 END,
    CASE WHEN LOWER(u.email) = 'amandasabreu89@gmail.com' THEN 'Curador Comunitário' ELSE 'Observador' END,
    false,
    false
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Confirmar
SELECT count(*) as total_profiles FROM public.profiles;
