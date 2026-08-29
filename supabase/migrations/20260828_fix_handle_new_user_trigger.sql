-- ============================================================================
-- MIRA V2026: CORREÇÃO DA FUNÇÃO HANDLE_NEW_USER (PERSISTÊNCIA DE EMAIL)
-- ============================================================================
-- Garante que novos utilizadores criados via Google OAuth ou Email/Password
-- nasçam com id, name, email e avatar_url persistidos atomicamente no perfil,
-- respeitando a regra soberana de não-sobrescrita de emails existentes.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        name,
        email,
        avatar_url,
        role,
        reputation,
        trust_level,
        account_status
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1), 'Membro'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        'member',
        0,
        'Observador',
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(profiles.email, EXCLUDED.email),
        name = COALESCE(profiles.name, EXCLUDED.name),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

    RETURN NEW;
END;
$$;
