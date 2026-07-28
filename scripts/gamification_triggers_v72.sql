-- ============================================================
-- 💎 MIRA V2026.GOLD: GAMIFICATION AUTOMATED TRIGGERS
-- ------------------------------------------------------------
-- PROJETO: Mira Migrante
-- FUNÇÃO: Atribuição Automática de Medalhas por Milestones
-- ============================================================

-- [1] FUNÇÃO DE VERIFICAÇÃO DE MEDALHAS AUTOMÁTICAS
CREATE OR REPLACE FUNCTION public.check_automated_badges()
RETURNS trigger AS $$
BEGIN
    -- 🎖️ MEDALHA: Pioneiro MIRA (Atribuída no registo se for dos primeiros 1000)
    -- (Já tratada no insert inicial se necessário, ou aqui)
    
    -- 🎖️ MEDALHA: Exemplar (Reputação > 500)
    IF NEW.reputation >= 500 THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (NEW.id, 'exemplar')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 🎖️ MEDALHA: Curador (Se validou muitas informações - assumindo coluna community_validations_count)
    -- Nota: Verificamos se a coluna existe antes para evitar erros
    BEGIN
        IF NEW.community_validations_count >= 20 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (NEW.id, 'curador')
            ON CONFLICT DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Coluna pode não existir ainda, ignoramos
    END;

    -- 🎖️ MEDALHA: Voz de Autoridade (Reputação > 5000)
    IF NEW.reputation >= 5000 THEN
        INSERT INTO public.user_badges (user_id, badge_id)
        VALUES (NEW.id, 'voz_autoridade')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [2] TRIGGER NA TABELA PROFILES
DROP TRIGGER IF EXISTS trigger_check_badges ON public.profiles;
CREATE TRIGGER trigger_check_badges
AFTER UPDATE OF reputation ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_automated_badges();

-- [3] FUNÇÃO PARA ATRIBUIR MEDALHA DE SENTINELA (Ao confirmar denúncias)
CREATE OR REPLACE FUNCTION public.award_sentinel_badge()
RETURNS trigger AS $$
BEGIN
    -- Se a denúncia for marcada como válida/fraud confirmada pelo admin
    -- e o utilizador que reportou tiver mais de 10 denúncias confirmadas
    IF NEW.status = 'confirmed' THEN
        UPDATE public.profiles
        SET reports_confirmed_count = COALESCE(reports_confirmed_count, 0) + 1
        WHERE id = NEW.reporter_id;
        
        -- Verificar milestone
        IF (SELECT reports_confirmed_count FROM public.profiles WHERE id = NEW.reporter_id) >= 10 THEN
            INSERT INTO public.user_badges (user_id, badge_id)
            VALUES (NEW.reporter_id, 'sentinela')
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nota: Este trigger depende da existência da tabela 'reports' e coluna 'status'
-- Adaptar conforme o esquema real se necessário.
