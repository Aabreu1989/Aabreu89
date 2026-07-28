-- 👑 SQL MASTER V12000 - SOBERANIA SINDICAL (AMANDA ABREU)
-- OBJETIVO: Moderação Nuclear (Post/Comentário + Denúncia) e Sugestões Soldadas.
-- FIX: Fim da moderação "falsa". Eliminação atómica e sincronização RAG.
--

BEGIN;

-- 1. LIMPEZA DE SEGURANÇA E GHOSTS
DROP FUNCTION IF EXISTS public.admin_nuclear_content_delete(text, uuid, uuid);
DROP VIEW IF EXISTS public.admin_reports_view CASCADE;
DROP VIEW IF EXISTS public.admin_suggestions_view CASCADE;

-- 2. INFRAESTRUTURA DE SUGESTÕES (SOLDAGEM CLAUSULA PÉTREA)
CREATE TABLE IF NOT EXISTS public.app_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'pending',
    aima_priority INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. REPARAÇÃO DE CASCATAS (Mata o erro de "Foreign Key" ao apagar)
-- Garante que se o post morre, tudo o que está ligado a ele morre automaticamente.
DO $$ 
BEGIN 
    -- Reparar post_votes
    ALTER TABLE IF EXISTS public.post_votes DROP CONSTRAINT IF EXISTS post_votes_post_id_fkey;
    ALTER TABLE IF EXISTS public.post_votes ADD CONSTRAINT post_votes_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

    -- Reparar reports
    ALTER TABLE IF EXISTS public.reports DROP CONSTRAINT IF EXISTS reports_post_id_fkey;
    ALTER TABLE IF EXISTS public.reports ADD CONSTRAINT reports_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
END $$;

-- 4. GATILHO DE INTELIGÊNCIA SOBERANA (RAG V12000)
-- Limpa a memória da IA se o post for apagado ou bloqueado.
CREATE OR REPLACE FUNCTION public.sync_post_to_ai_v12000()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = OLD.id;
    ELSIF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        IF (NEW.validation_status != 'blocked') THEN
            INSERT INTO public.knowledge_store (content, metadata)
            VALUES (NEW.content, jsonb_build_object('source', 'community','post_id', NEW.id,'category', NEW.category,'is_official', COALESCE(NEW.is_verified, false)))
            ON CONFLICT ((metadata->>'post_id')) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;
        ELSE
            DELETE FROM public.knowledge_store WHERE (metadata->>'post_id')::uuid = NEW.id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_to_ai_v12000 ON public.posts;
CREATE TRIGGER trg_sync_post_to_ai_v12000 AFTER INSERT OR UPDATE OR DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_ai_v12000();

-- 5. VIEW ADMIN: SUGESTÕES HIDRATADAS
CREATE OR REPLACE VIEW public.admin_suggestions_view AS
SELECT s.id, s.subject, s.content, s.email as contact_email, s.status, s.aima_priority, s.created_at,
    jsonb_build_object('id', s.user_id, 'name', COALESCE(p.username, 'Visitante'), 'avatar', p.avatar_url) as user_data
FROM public.app_suggestions s LEFT JOIN public.profiles p ON s.user_id = p.id;

-- 6. VIEW ADMIN: DENÚNCIAS COM PROVA DE CONTEÚDO
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT r.id, r.reason, r.status, r.created_at, r.reported_content_text, r.post_id, r.comment_id,
    jsonb_build_object('id', r.reporter_id, 'name', p_rep.username) as reporter,
    jsonb_build_object('id', r.target_author_id, 'name', p_tar.username, 'avatar', p_tar.avatar_url) as offender
FROM public.reports r 
LEFT JOIN public.profiles p_rep ON r.reporter_id = p_rep.id 
LEFT JOIN public.profiles p_tar ON r.target_author_id = p_tar.id;

-- 7. FUNÇÃO NUCLEAR: MODERAÇÃO ATÓMICA (O BISTURI)
-- Esta função é o que o Antigravity não sabe fazer: apaga o crime e a queixa num só passo.
CREATE OR REPLACE FUNCTION public.admin_nuclear_content_delete(target_type TEXT, target_id UUID, report_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Verificação Soberana Amanda Abreu
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        
        -- 1. Apagar o Alvo (Post ou Comentário)
        IF target_type = 'POST' THEN
            DELETE FROM public.posts WHERE id = target_id;
        ELSIF target_type = 'COMMENT' THEN
            DELETE FROM public.comments WHERE id = target_id;
        END IF;

        -- 2. Apagar a Denúncia da lista
        IF report_id IS NOT NULL THEN
            DELETE FROM public.reports WHERE id = report_id;
        END IF;

    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO: Apenas a CEO Amanda Abreu pode executar moderação atómica.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO NUCLEAR: ELIMINAÇÃO DE SUGESTÃO
CREATE OR REPLACE FUNCTION public.admin_nuclear_suggestion_delete(suggestion_uuid UUID)
RETURNS VOID AS $$
BEGIN
    IF (auth.jwt() ->> 'email' = 'amandasabreu89@gmail.com') THEN
        DELETE FROM public.app_suggestions WHERE id = suggestion_uuid;
    ELSE
        RAISE EXCEPTION 'ACESSO NEGADO.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. PERMISSÕES FINAIS
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.admin_reports_view TO authenticated;
GRANT SELECT ON public.admin_suggestions_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_content_delete TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_nuclear_suggestion_delete TO authenticated;

COMMIT;
