-- ============================================================
-- 🦾 MIRA V2026: REPARAÇÃO CIRÚRGICA (PILLAR 008)
-- Alvo: user_badges & reputation system
-- ============================================================

-- 1. ADIÇÃO DE COLUNA EM FALTA: 'description'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_badges' AND column_name='description') THEN
        ALTER TABLE public.user_badges ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada a user_badges.';
    END IF;
END $$;

-- 2. CRIAÇÃO DO RPC 'increment_reputation'
-- Necessário para o gamificationService.ts no frontend
CREATE OR REPLACE FUNCTION increment_reputation(target_user_id UUID, amount INT)
RETURNS INT AS $$
DECLARE
    new_rep INT;
BEGIN
    UPDATE public.profiles 
    SET reputation = COALESCE(reputation, 0) + amount 
    WHERE id = target_user_id
    RETURNING reputation INTO new_rep;
    
    RETURN new_rep;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AUDITORIA: Registar a reparação no histórico
INSERT INTO public.gamification_history (reason, amount) 
VALUES ('Surgical Fix: Desc Column & RPC Restore (Auditoria Alpha-1)', 0);

COMMENT ON FUNCTION increment_reputation IS 'Sincroniza pontos de reputação de forma atómica no MIRA V2026.';
