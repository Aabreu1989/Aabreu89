-- 🛡️ MIRA V2026.GOLD: PROTOCOLO SNIPER V4.0
-- 🛡️ SOBERANIA 100k/50k (NOBEL REAL)
-- EXECUÇÃO: SQL EDITOR SUPABASE

-- 1. ATUALIZAÇÃO DO FEED SOBERANO (RANKING SQL PURO)
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status NOT IN ('banned', 'hidden', 'fraud')
  ORDER BY 
      (CASE 
          WHEN pr.email = 'amandasabreu89@gmail.com' THEN 100000 
          WHEN pr.is_verified = true THEN 50000
          ELSE 0 
      END) DESC,
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GARANTIR PERMISSÕES
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated, service_role;

-- 3. RELOAD
NOTIFY pgrst, 'reload schema';
