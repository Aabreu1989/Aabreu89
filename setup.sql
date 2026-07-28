-- MIRA SOVEREIGNTY: Email Confirmation Bypass (V26.96)
CREATE OR REPLACE FUNCTION public.admin_verify_user_sovereign(target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE auth.users 
    SET email_confirmed_at = NOW(),
        confirmed_at = NOW(),
        last_sign_in_at = NOW()
    WHERE email = target_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_user_sovereign(text) TO anon, authenticated;
