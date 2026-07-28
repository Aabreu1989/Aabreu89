-- 👑 MIRA GAMIFICAÇÃO V2026.SUPREMA
-- OBJETIVO: Garantir que a tabela de selos está populada e funcional.

BEGIN;

-- 1. Garantir que as tabelas base existem (Resiliência)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_emoji TEXT,
    icon TEXT, -- Lucide icon name
    category TEXT DEFAULT 'social', -- social, trust, help, etc.
    rarity_level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, badge_id)
);

-- 2. Inserir Selos Mestres (Soberania V2026)
INSERT INTO public.badges (id, name, description, icon_emoji, icon, category, rarity_level)
VALUES 
    ('pioneiro', 'Pioneiro MIRA', 'Concedido aos primeiros utilizadores que acreditaram no projeto. Representa a fundação da comunidade.', '🌟', 'Star', 'social', 5),
    ('verificado', 'Conta Verificada', 'Identidade validada pessoalmente pela equipa MIRA. Símbolo de confiança máxima na plataforma.', '✅', 'CheckCircle2', 'trust', 4),
    ('sentinela', 'Sentinela', 'Guardião da integridade. Atribuído a quem reporta fraudes de forma consistente.', '🛡️', 'ShieldAlert', 'trust', 3),
    ('escudo_antiburla', 'Escudo Anti-Burla', 'Barreira real contra burlas detetadas na comunidade. Requer 5 burlas confirmadas prevenidas.', '🛡️', 'Shield', 'trust', 4),
    ('mestre_docs', 'Mestre dos Docs', 'Especialista em documentação oficial. Requer 30+ downloads ou ajudas documentais.', '📚', 'Bookmark', 'help', 2),
    ('curador', 'Curador', 'Atribuído a quem valida informações úteis. Requer 20+ validações confirmadas.', '🧐', 'Check', 'trust', 2),
    ('exemplar', 'Utilizador Exemplar', 'Conduta impecável na plataforma. Requer 60 dias de atividade sem denúncias.', '🏆', 'Award', 'social', 3),
    ('voz_autoridade', 'Voz de Autoridade', 'Posts verificados e selados pela CEO da plataforma MIRA.', '🔥', 'Flame', 'social', 5),
    ('coracao', 'Coração MIRA', 'Alto nível de empatia e apoio emocional consistente aos membros.', '❤️', 'Heart', 'social', 1),
    ('embaixador_mira', 'Embaixador MIRA', 'Líder comunitário que traz novos membros e mantém a paz.', '👑', 'Users', 'social', 5)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_emoji = EXCLUDED.icon_emoji,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    rarity_level = EXCLUDED.rarity_level;

-- 3. Automação de Reputação e Medalhas
-- Trigger para sincronizar a coluna 'badges' no perfil sempre que uma medalha é atribuída ou removida
CREATE OR REPLACE FUNCTION public.sync_user_badges_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.profiles
        SET badges = (
            SELECT jsonb_agg(jsonb_build_object('badge_id', badge_id, 'awarded_at', awarded_at))
            FROM public.user_badges
            WHERE user_id = NEW.user_id
        )
        WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET badges = COALESCE((
            SELECT jsonb_agg(jsonb_build_object('badge_id', badge_id, 'awarded_at', awarded_at))
            FROM public.user_badges
            WHERE user_id = OLD.user_id
        ), '[]'::jsonb)
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_badges ON public.user_badges;
CREATE TRIGGER tr_sync_user_badges
AFTER INSERT OR UPDATE OR DELETE ON public.user_badges
FOR EACH ROW EXECUTE FUNCTION public.sync_user_badges_to_profile();

-- Inserir medalha de Pioneiro para os utilizadores existentes (Opcional, mas recomendado para o lançamento)
INSERT INTO public.user_badges (user_id, badge_id)
SELECT id, 'pioneiro' FROM public.profiles
ON CONFLICT DO NOTHING;

COMMIT;
