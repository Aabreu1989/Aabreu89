-- MIRA GAMIFICACAO V2026
-- PATCH 3F-B.2
-- CORRECAO: reputation_logs.amount -> reputation_logs.points
-- Recria a RPC usando o schema REAL de reputation_logs.

CREATE OR REPLACE FUNCTION public.grant_idempotent_vote_reputation(
    target_user_id UUID,
    p_action_key TEXT,
    p_entity_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_amount INT := 3;
    v_new_reputation INT;
    v_reason TEXT;
BEGIN
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilizador invalido.';
    END IF;

    IF p_action_key IS NULL
       OR p_action_key NOT IN ('vote_true', 'vote_fake') THEN
        RAISE EXCEPTION 'Acao de voto invalida. Apenas vote_true e vote_fake sao permitidas.';
    END IF;

    IF p_entity_id IS NULL
       OR BTRIM(p_entity_id) = '' THEN
        RAISE EXCEPTION 'ID do post invalido.';
    END IF;

    v_reason :=
        CASE
            WHEN p_action_key = 'vote_true'
                THEN 'Voto TRUE no Post ' || p_entity_id
            WHEN p_action_key = 'vote_fake'
                THEN 'Voto FAKE no Post ' || p_entity_id
        END;

    BEGIN
        INSERT INTO public.activity_logs (
            user_id,
            action,
            metadata,
            created_at
        )
        VALUES (
            target_user_id,
            'reputation_gained',
            jsonb_build_object(
                'action_key', p_action_key,
                'entity_id', p_entity_id,
                'amount', v_amount,
                'reason', v_reason
            ),
            NOW()
        );

        UPDATE public.profiles
        SET
            reputation = COALESCE(reputation, 0) + v_amount,
            updated_at = NOW()
        WHERE id = target_user_id
        RETURNING reputation INTO v_new_reputation;

        IF v_new_reputation IS NULL THEN
            RAISE EXCEPTION 'Perfil do utilizador nao encontrado.';
        END IF;

        INSERT INTO public.reputation_logs (
            user_id,
            points,
            reason
        )
        VALUES (
            target_user_id,
            v_amount,
            v_reason
        );

        RETURN jsonb_build_object(
            'earned', true,
            'amount', v_amount,
            'reputation', v_new_reputation,
            'action_key', p_action_key,
            'entity_id', p_entity_id
        );

    EXCEPTION
        WHEN unique_violation THEN
            RETURN jsonb_build_object(
                'earned', false,
                'amount', 0,
                'reason', 'already_awarded',
                'action_key', p_action_key,
                'entity_id', p_entity_id
            );
    END;
END;
$$;

REVOKE EXECUTE
ON FUNCTION public.grant_idempotent_vote_reputation(UUID, TEXT, TEXT)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.grant_idempotent_vote_reputation(UUID, TEXT, TEXT)
TO service_role;
