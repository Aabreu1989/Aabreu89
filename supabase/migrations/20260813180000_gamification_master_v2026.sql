-- ============================================================
-- MIRA GAMIFICAÇÃO V2026 — MASTER MIGRATION
-- ============================================================
-- Escopo:
--   1. badges.rarity_level
--   2. gamification_rules
--   3. increment_reputation()
--   4. privilégios mínimos da RPC
--
-- NÃO altera auth.users nem profiles.role.
-- A autoridade administrativa será tratada numa etapa separada.
-- ============================================================

-- ============================================================

-- ============================================================
-- [1] RARITY LEVEL DOS BADGES
-- ============================================================

ALTER TABLE public.badges
ADD COLUMN IF NOT EXISTS rarity_level INT NOT NULL DEFAULT 1;

-- ============================================================
-- [2] REGRAS DINÂMICAS DE GAMIFICAÇÃO
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gamification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key TEXT UNIQUE NOT NULL,
    action_name TEXT NOT NULL,
    points INT NOT NULL DEFAULT 5,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT gamification_rules_points_valid
        CHECK (points > 0 AND points <= 1000)
);

-- ============================================================
-- [2.1] REGRAS PADRÃO
-- ============================================================

INSERT INTO public.gamification_rules
    (action_key, action_name, points, description)
VALUES
    (
        'publish_post',
        'Publicação de Post',
        10,
        'Pontos por publicar uma partilha na comunidade'
    ),
    (
        'add_comment',
        'Comentário em Post',
        5,
        'Pontos por comentar numa partilha de outro utilizador'
    ),
    (
        'like_given',
        'Gosto Concedido',
        1,
        'Pontos por interagir com gosto'
    ),
    (
        'like_received',
        'Gosto Recebido',
        2,
        'Pontos recebidos por gostos da comunidade'
    ),
    (
        'vote_true',
        'Voto de Veracidade',
        3,
        'Pontos por participar na validação de veracidade'
    ),
    (
        'vote_fake',
        'Alerta de Fraude',
        3,
        'Pontos por alertar sobre conteúdo suspeito'
    ),
    (
        'follow_user',
        'Seguir Utilizador',
        2,
        'Pontos por seguir um membro da comunidade'
    ),
    (
        'report_content',
        'Denúncia de Conteúdo',
        1,
        'Pontos por ajudar na moderação comunitária'
    ),
    (
        'curate_guide',
        'Curadoria de Guia',
        15,
        'Pontos por curadoria de guias de utilidade pública'
    )
ON CONFLICT (action_key)
DO UPDATE SET
    action_name = EXCLUDED.action_name,
    points = EXCLUDED.points,
    description = EXCLUDED.description;

-- ============================================================
-- [3] RPC ATÓMICA DE REPUTAÇÃO
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_reputation(
    target_user_id UUID,
    amount INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_rep INT;
BEGIN

    -- Proteção contra valores inválidos.
    IF amount IS NULL OR amount <= 0 OR amount > 1000 THEN
        RAISE EXCEPTION 'Quantidade de reputação inválida: deve estar entre 1 e 1000.';
    END IF;

    UPDATE public.profiles
    SET reputation = COALESCE(reputation, 0) + amount
    WHERE id = target_user_id
    RETURNING reputation INTO new_rep;

    IF new_rep IS NULL THEN
        RAISE EXCEPTION 'Utilizador não encontrado para incremento de reputação.';
    END IF;

    RETURN new_rep;
END;
$$;

-- ============================================================
-- [4] SEGURANÇA DA RPC
-- ============================================================

REVOKE EXECUTE
ON FUNCTION public.increment_reputation(UUID, INT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.increment_reputation(UUID, INT)
TO service_role;

-- ============================================================
-- [5] LEITURA DAS TABELAS DE GAMIFICAÇÃO
-- ============================================================

GRANT SELECT
ON public.badges
TO anon, authenticated;

GRANT SELECT
ON public.user_badges
TO anon, authenticated;

GRANT SELECT
ON public.gamification_rules
TO anon, authenticated;

-- ============================================================
-- [6] OPERAÇÕES PRIVILEGIADAS DO BACKEND
-- ============================================================

GRANT ALL
ON public.badges
TO service_role;

GRANT ALL
ON public.user_badges
TO service_role;

GRANT ALL
ON public.gamification_rules
TO service_role;

GRANT ALL
ON public.reputation_logs
TO service_role;

GRANT ALL
ON public.activity_logs
TO service_role;

-- FIM DA MIGRATION
