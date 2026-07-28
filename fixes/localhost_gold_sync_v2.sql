-- ============================================================
-- 💎 MIRA V2026.GOLD: CONSOLIDAÇÃO LOCALHOST & DIAMOND MASTER
-- ------------------------------------------------------------
-- FIX: Enums de Telemetria (Resolver Erros 400)
-- FIX: Ranking Soberano Sniper (100k/50k/15k)
-- FIX: Engagement Social (Votos/Comentários)
-- ============================================================

-- 1. SINCRONIZAÇÃO DE ENUMS (TELEMÊTRICA V2026)
DO $$ 
BEGIN 
    -- Se o tipo existir, adicionar os novos valores necessários para o Localhost
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_action') THEN
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'home_module_click';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'chat_session_create';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'profile_view';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- 2. ENFORCEMENT DO RANKING DIAMOND MASTER REAL (v24.2)
-- 🛡️ PROTOCOLO: CEO (100k) > AIMA (50k) > VERIFIED (15k)
CREATE OR REPLACE FUNCTION public.sovereign_feed_v24()
RETURNS SETOF public.posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM public.posts p
  INNER JOIN public.profiles pr ON p.author_id = pr.id
  WHERE p.validation_status NOT IN ('banned', 'hidden', 'fraud')
  ORDER BY 
      -- A. HIERARQUIA DE SOBERANIA (PESOS NOBEL REAIS)
      (CASE 
          WHEN pr.email = 'amandasabreu89@gmail.com' THEN 100000 -- CEO SUPREMA
          WHEN (pr.email ILIKE '%aima.pt%' OR pr.name ILIKE '%AIMA%') THEN 50000 -- OFICIAL AIMA
          WHEN pr.is_verified = true THEN 15000 -- UTILIZADORES ELITE
          ELSE 0 
      END) DESC,
      
      -- B. RELEVÂNCIA SOCIAL (ENGAJAMENTO)
      (
        COALESCE(p.likes, 0) + 
        (SELECT count(*) * 10 FROM public.comments c WHERE (c.posts_id = p.id OR c.post_id = p.id)) -- Robusto contra nomes de colunas
      ) DESC,
      
      -- C. RECÊNCIA SOBERANA
      p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERMISSÕES E RELOAD
GRANT EXECUTE ON FUNCTION public.sovereign_feed_v24 TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';

-- AUDITORIA RÁPIDA (O e-mail CEO deve aparecer primeiro):
-- SELECT author_id, (SELECT email FROM profiles WHERE id = author_id) as email FROM sovereign_feed_v24() LIMIT 1;
