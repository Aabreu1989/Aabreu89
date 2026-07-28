-- 
-- 👑 SQL V2000 - SOBERANIA SUPREMA (CONSOLIDADO V1800 + V1900)
-- OBJETIVO: 9 Selos Reais, Gamificação Ativa e Proteção de Schema.
--

BEGIN;

-- 1. HARDENING DE PROFILES (Uso da tabela pública para evitar duplicados)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verify_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS help_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consult_count INTEGER DEFAULT 0;

-- 2. INFRAESTRUTURA DE SELOS (BADGES)
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_emoji TEXT,
    rarity_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FORÇAR COLUNAS (A essência do V1900 aqui dentro)
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS icon_emoji TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.badges ADD COLUMN IF NOT EXISTS rarity_level VARCHAR(50);

-- REMOVER TRAVAS DE "NOT NULL" (Mata erros 23502 de colunas fantasmas como 'category' ou 'icon')
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='icon') THEN
    ALTER TABLE public.badges ALTER COLUMN icon DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='badges' AND column_name='category') THEN
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

-- 3. PERSISTÊNCIA DE INTERAÇÕES SOCIAIS
CREATE TABLE IF NOT EXISTS public.community_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id UUID NOT NULL, 
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'like', 'verify', 'false'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(target_id, user_id, type)
);

-- 4. INJEÇÃO DOS 9 SELOS REAIS (REGRAS AMANDA ABREU)
DELETE FROM public.badges;
INSERT INTO public.badges (name, description, icon_emoji, rarity_level) VALUES 
('Pioneiro MIRA', 'Concedido aos primeiros utilizadores que acreditaram no projeto.', '🏹', 'épico'),
('Conta Verificada', 'Identidade validada pessoalmente pela equipa MIRA.', '✅', 'lendário'),
('Curador da Comunidade', 'Valida ativamente informações úteis. 20+ validações.', '💡', 'raro'),
('Mestre dos Documentos', 'Especialista em processos oficiais. 30+ ajudas.', '📂', 'épico'),
('Utilizador Exemplar', '60 dias de atividade sem denúncias.', '💎', 'raro'),
('Sentinela', 'Guardião da integridade. Reportou 10+ fraudes.', '🛡️', 'épico'),
('Especialista em Leis', 'Conhecimento profundo da Lei de Estrangeiros. 50+ consultas.', '⚖️', 'raro'),
('Mentor de Emprego', 'Apoio na procura de emprego. 10+ comentários úteis.', '💼', 'incomum'),
('Coração da Comunidade', 'Reconhecimento de empatia e apoio emocional consistente.', '❤️', 'épico')
ON CONFLICT (name) DO UPDATE SET 
    icon_emoji = EXCLUDED.icon_emoji, 
    description = EXCLUDED.description, 
    rarity_level = EXCLUDED.rarity_level;

-- 5. MOTOR DE GAMIFICAÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION public.process_gamification_v2000()
RETURNS TRIGGER AS $$
DECLARE
    u_stats RECORD;
    b_id UUID;
BEGIN
    UPDATE public.profiles SET
        verify_count = (SELECT count(*) FROM public.community_interactions WHERE user_id = NEW.user_id AND type = 'verify'),
        report_count = (SELECT count(*) FROM public.community_interactions WHERE user_id = NEW.user_id AND type = 'false'),
        points = points + 10
    WHERE id = NEW.user_id
    RETURNING * INTO u_stats;

    -- Atribuição Automática: Curador (20+)
    IF u_stats.verify_count >= 20 THEN
        SELECT id INTO b_id FROM public.badges WHERE name = 'Curador da Comunidade';
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Atribuição Automática: Sentinela (10+)
    IF u_stats.report_count >= 10 THEN
        SELECT id INTO b_id FROM public.badges WHERE name = 'Sentinela';
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b_id) ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_gamification_v2000 ON public.community_interactions;
CREATE TRIGGER trg_gamification_v2000
AFTER INSERT ON public.community_interactions
FOR EACH ROW EXECUTE FUNCTION public.process_gamification_v2000();

COMMIT;
