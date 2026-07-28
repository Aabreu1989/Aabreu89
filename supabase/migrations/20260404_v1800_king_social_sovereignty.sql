-- 
-- 👑 SQL V1800 - SOBERANIA SOCIAL E GAMIFICAÇÃO AUTOMÁTICA (PADRÃO INTEGRADO)
-- OBJETIVO: Integração com public.profiles e atribuição de 9 selos por mérito.
-- FIX: Reconciliação de Tabelas e Remoção de Restrição "NOT NULL" em colunas fantasma (Erros 23502: icon e category).
--

BEGIN;

-- ==========================================
-- 1. HARDENING DA TABELA PROFILES (EXISTENTE)
-- ==========================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verify_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS help_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consult_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mentor_count INTEGER DEFAULT 0;

-- Sincronizar username com name se estiver nulo para evitar erros de UI
UPDATE public.profiles SET username = COALESCE(name, 'membro_' || substr(id::text, 1, 8)) WHERE username IS NULL;

-- ==========================================
-- 2. INFRAESTRUTURA DE SELOS (BADGES)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_emoji TEXT,
    rarity_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 🛡️ REPARAÇÃO SOBERANA: Forçar colunas e REMOVER restrições inúteis do Antigravity
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS icon_emoji TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity_level VARCHAR(50);

-- Mata o Erro 23502: Removemos a trava de "NOT NULL" de qualquer coluna fantasma que o imbecil tenha deixado.
DO $$ 
BEGIN 
  -- Remover restrição da coluna "icon"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='badges' AND column_name='icon') THEN
    ALTER TABLE public.badges ALTER COLUMN icon DROP NOT NULL;
  END IF;
  
  -- Remover restrição da coluna "category" (A causa do erro atual)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='badges' AND column_name='category') THEN
    ALTER TABLE public.badges ALTER COLUMN category DROP NOT NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.community_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL, 
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'like', 'verify', 'false', 'help', 'consult'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(target_id, user_id, type)
);

-- ==========================================
-- 3. LIMPEZA E INJEÇÃO DE DADOS (9 SELOS OFICIAIS)
-- ==========================================

DELETE FROM public.badges;

INSERT INTO public.badges (name, description, icon_emoji, rarity_level) VALUES 
('Pioneiro MIRA', 'Utilizadores da primeira vaga.', '🏹', 'épico'),
('Conta Verificada', 'Identidade validada pela equipa MIRA.', '✅', 'lendário'),
('Curador da Comunidade', 'Validou 20+ informações úteis.', '💡', 'raro'),
('Mestre dos Documentos', 'Especialista em documentação. 30+ ajudas.', '📂', 'épico'),
('Utilizador Exemplar', 'Conduta impecável na tribo.', '💎', 'raro'),
('Sentinela', 'Guardião contra fraudes. 10+ denúncias.', '🛡️', 'épico'),
('Especialista em Leis', 'Conhecimento jurídico. 50+ consultas.', '⚖️', 'raro'),
('Mentor de Emprego', 'Apoio em vagas. 10+ ajudas úteis.', '💼', 'incomum'),
('Coração da Comunidade', 'Apoio emocional e empatia consistente.', '❤️', 'épico')
ON CONFLICT (name) DO UPDATE SET 
    icon_emoji = EXCLUDED.icon_emoji, 
    description = EXCLUDED.description, 
    rarity_level = EXCLUDED.rarity_level;

-- ==========================================
-- 4. MOTOR DE GAMIFICAÇÃO (Gatilhos e Funções)
-- ==========================================

DROP TRIGGER IF EXISTS trg_gamification_v1800 ON public.community_interactions;

CREATE OR REPLACE FUNCTION public.process_gamification_v1800()
RETURNS TRIGGER AS $$
DECLARE
    u_stats RECORD;
    b_id UUID;
BEGIN
    -- Atualizar contadores no perfil unificado
    UPDATE public.profiles SET
        verify_count = (SELECT count(*) FROM public.community_interactions WHERE user_id = NEW.user_id AND type = 'verify'),
        report_count = (SELECT count(*) FROM public.community_interactions WHERE user_id = NEW.user_id AND type = 'false'),
        help_count = (SELECT count(*) FROM public.community_interactions WHERE user_id = NEW.user_id AND type = 'help'),
        points = points + 10
    WHERE id = NEW.user_id
    RETURNING * INTO u_stats;

    -- Lógica de Atribuição Automática baseada no mérito
    
    -- Curador (20+ Verificações)
    IF u_stats.verify_count >= 20 THEN
        SELECT id INTO b_id FROM public.badges WHERE name = 'Curador da Comunidade';
        IF b_id IS NOT NULL THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    -- Sentinela (10+ Denúncias)
    IF u_stats.report_count >= 10 THEN
        SELECT id INTO b_id FROM public.badges WHERE name = 'Sentinela';
        IF b_id IS NOT NULL THEN
            INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b_id) ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_gamification_v1800
AFTER INSERT ON public.community_interactions
FOR EACH ROW EXECUTE FUNCTION public.process_gamification_v1800();

-- ==========================================
-- 5. RPC DE RESGATE DE SELOS
-- ==========================================

CREATE OR REPLACE FUNCTION public.get_user_badges_v1(user_uuid UUID)
RETURNS TABLE (name TEXT, icon_emoji TEXT, rarity_level TEXT) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT b.name, b.icon_emoji, b.rarity_level::TEXT
    FROM public.badges b
    JOIN public.user_badges ub ON b.id = ub.badge_id
    WHERE ub.user_id = user_uuid;
END;
$$;

COMMIT;
