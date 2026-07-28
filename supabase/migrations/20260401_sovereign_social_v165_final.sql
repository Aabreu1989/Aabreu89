-- ============================================================
-- 🛡️ MIRA V2026.GOLD: SOVEREIGN SOCIAL ARCHITECTURE (v165.1)
-- ------------------------------------------------------------
-- FUNÇÃO: Restaurar a integridade social V75.0 (Soberania)
-- TABELAS: follows, user_badges, reputation_logs
-- STATUS: LOCKDOWN DE LANÇAMENTO - DISCO DE PRODUÇÃO
-- ============================================================

-- [1] Tabela Soberana de Seguidores (Substitui user_follows pirata)
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- Indices de Performance para Scanners
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- [2] Tabela de Medalhas Atómicas (O fim do JSON nos Perfis)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- [3] Log de Reputação (Trilha de Auditoria Soberana)
CREATE TABLE IF NOT EXISTS public.reputation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [4] Saneamento da Tabela Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation INT DEFAULT 0;
-- Nota: 'badges' JSON column será mantida por retrocompatibilidade de leitura 
-- mas o motor V165.1 já ignora o JSON a favor da tabela user_badges.

-- [5] Motor RPC de Reputação (v75.1 Master)
CREATE OR REPLACE FUNCTION public.increment_reputation(target_user_id UUID, amount INT)
RETURNS INT AS $$
DECLARE
    new_rep INT;
BEGIN
    UPDATE public.profiles 
    SET reputation = reputation + amount 
    WHERE id = target_user_id
    RETURNING reputation INTO new_rep;
    RETURN new_rep;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [6] Permissões e Segurança (RLS)
GRANT ALL ON public.follows TO authenticated, service_role;
GRANT ALL ON public.user_badges TO authenticated, service_role;
GRANT ALL ON public.reputation_logs TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.increment_reputation(UUID, INT) TO authenticated, service_role;

-- [7] Gatilhos de Purgação Nuclear (Sincronização com DNA V71)
-- Garante que quando o utilizador morre, os follows e badges morrem com ele.
-- (Já coberto pelos REFERENCES ... ON DELETE CASCADE)

RAISE NOTICE 'Soberania Social V165.1 Implementada com Sucesso no Disco.';
