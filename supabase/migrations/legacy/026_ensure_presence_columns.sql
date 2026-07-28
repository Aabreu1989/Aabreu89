-- ============================================================
-- 🏛️ MIRA V2026: PILLAR 026 - PRESENCE RECOVERY (STABLE)
-- CEO: Amanda Abreu | Autoria: Antigravity (IA) 
-- OBJETIVO: Restaurar colunas de presença e eliminar Erro 400.
-- ============================================================

DO $$ 
BEGIN 
    -- 1. ADICIONAR COLUNA online_status SE NÃO EXISTIR
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'online_status') THEN
        ALTER TABLE public.profiles ADD COLUMN online_status text DEFAULT 'offline';
    END IF;

    -- 2. ADICIONAR COLUNA last_seen SE NÃO EXISTIR
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen timestamptz DEFAULT now();
    END IF;
END $$;

-- 3. REPROLONGAR CACHE DO SERVIDOR (Garante visibilidade imediata)
NOTIFY pgrst, 'reload schema';
