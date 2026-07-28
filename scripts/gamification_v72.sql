-- ============================================================
-- 💎 MIRA V2026.GOLD: GAMIFICATION SYSTEM (V72.0-SUPREME)
-- ------------------------------------------------------------
-- PROJETO: Mira Migrante
-- AUTORIDADE: Amanda Abreu
-- FUNÇÃO: Tabelas Relacionais de Medalhas e Reputação
-- ============================================================

-- [1] TABELA DE MEDALHAS (DICIONÁRIO MESTRE)
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT, -- Lucide Icon Name
    icon_emoji TEXT, -- Emoji Fallback
    description TEXT,
    category TEXT DEFAULT 'social', -- social, trust, help, etc.
    rarity_level INT DEFAULT 1, -- 1: Comum, 2: Raro, 3: Épico, 4: Lendário
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [2] TABELA RELACIONAL DE MEDALHAS DE UTILIZADORES
CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- [3] TABELA DE LOGS DE REPUTAÇÃO (AUDITORIA SOBERANA)
CREATE TABLE IF NOT EXISTS public.reputation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [4] RPC: INCREMENTO ATÓMICO DE REPUTAÇÃO
CREATE OR REPLACE FUNCTION public.increment_reputation(target_user_id UUID, amount INT)
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

-- [5] INJEÇÃO DE MEDALHAS INICIAIS (CONFORME DESIGN APROVADO)
INSERT INTO public.badges (id, name, icon, icon_emoji, description, category, rarity_level)
VALUES 
('pioneiro', 'Pioneiro MIRA', 'Star', '⭐', 'Membro fundador que acreditou no projeto desde o início.', 'social', 3),
('verificado', 'Conta Verificada', 'CheckCircle2', '✅', 'Identidade validada pessoalmente pela equipa MIRA.', 'trust', 4),
('sentinela', 'Sentinela', 'ShieldAlert', '🛡️', 'Guardião da integridade. Atribuído a quem reporta fraudes confirmadas.', 'trust', 2),
('mestre_docs', 'Mestre dos Docs', 'Bookmark', '📚', 'Especialista em documentação oficial e ajuda a outros membros.', 'help', 2),
('curador', 'Curador', 'Check', '🔍', 'Validou mais de 20 informações úteis para a comunidade.', 'trust', 1),
('exemplar', 'Utilizador Exemplar', 'Award', '💎', 'Conduta impecável na plataforma sem denúncias confirmadas.', 'social', 2),
('voz_autoridade', 'Voz de Autoridade', 'Flame', '🔥', 'Publicações seladas pela CEO por extrema relevância.', 'social', 4),
('coracao', 'Coração MIRA', 'Heart', '❤️', 'Alto nível de empatia e apoio emocional aos membros.', 'social', 1)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    icon_emoji = EXCLUDED.icon_emoji;

-- [6] PERMISSÕES
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
GRANT ALL ON public.reputation_logs TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_reputation TO authenticated, service_role;

-- [7] ADICIONAR COLUNAS DE GAMIFICAÇÃO EM PROFILES SE NÃO EXISTIREM
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'reputation') THEN
        ALTER TABLE public.profiles ADD COLUMN reputation INT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'level') THEN
        ALTER TABLE public.profiles ADD COLUMN level INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'trust_level') THEN
        ALTER TABLE public.profiles ADD COLUMN trust_level TEXT DEFAULT 'Observador';
    END IF;
END $$;
