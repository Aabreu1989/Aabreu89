-- 👑 SQL REPARAÇÃO SUPREMA V12902 - ESTABILIZAÇÃO TOTAL MIRA
-- OBJETIVO: Sincronização Automática (Cascades), Tradução Persistente e Persistência de Interação.

BEGIN;

-- 1. SINCRONIZAÇÃO AUTOMÁTICA DE APAGAR (CASCADING DELETES)
-- Garante que quando um post é apagado, TUDO o que depende dele some do disco.

ALTER TABLE IF EXISTS public.post_votes 
DROP CONSTRAINT IF EXISTS post_votes_post_id_fkey,
ADD CONSTRAINT post_votes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.saved_posts 
DROP CONSTRAINT IF EXISTS saved_posts_post_id_fkey,
ADD CONSTRAINT saved_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.comments 
DROP CONSTRAINT IF EXISTS comments_post_id_fkey,
ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.reports 
DROP CONSTRAINT IF EXISTS reports_post_id_fkey,
ADD CONSTRAINT reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

-- 2. LIMPEZA AUTOMÁTICA DA IA (STORY MODAL & SABER IA)
-- Atualiza o gatilho para limpar a knowledge_store quando o post morre.

CREATE OR REPLACE FUNCTION public.fn_sync_post_deletion_to_ai()
RETURNS TRIGGER AS $$
BEGIN
    -- Remove da base vetorial do RAG
    DELETE FROM public.knowledge_store 
    WHERE (metadata->>'post_id')::uuid = OLD.id;
    
    -- Remove da base de conhecimento legada se existir
    DELETE FROM public.knowledge_base
    WHERE metadata->>'post_id' = OLD.id::text;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_clean_ai_on_post_delete ON public.posts;
CREATE TRIGGER trg_clean_ai_on_post_delete
AFTER DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_post_deletion_to_ai();

-- 3. PERSISTÊNCIA DE INTERAÇÕES (SAVE, LIKE, VERIFY)
-- Libera as permissões necessárias para que o frontend escreva no disco sem bloqueios.

-- Garantir que a tabela saved_posts está pronta (se não estiver ainda)
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

GRANT ALL ON public.saved_posts TO authenticated;
GRANT ALL ON public.post_votes TO authenticated;
GRANT ALL ON public.comment_likes TO authenticated;

-- RLS para Saved Posts (Soberania do Usuário)
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own saves" ON public.saved_posts;
CREATE POLICY "Users can manage their own saves" ON public.saved_posts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. TRADUÇÃO PERSISTENTE
-- Permite que o App grave traduções enviadas pelos usuários na coluna JSONB do post.

GRANT UPDATE (translations) ON public.posts TO authenticated;
GRANT UPDATE (translations) ON public.comments TO authenticated;

-- RLS para Traduções (Permissivo para enriquecimento de dados)
DROP POLICY IF EXISTS "Public translation update" ON public.posts;
CREATE POLICY "Public translation update" ON public.posts
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- 5. CANHÃO DE VERIFICAÇÃO (POWERED BY AMANDA)
-- Função para a Amanda verificar posts diretamente.

CREATE OR REPLACE FUNCTION public.verify_post(p_post_id UUID, p_is_verified BOOLEAN)
RETURNS VOID AS $$
BEGIN
    -- Apenas a Amanda (CEO) pode disparar este canhão
    IF auth.jwt()->>'email' = 'amandasabreu89@gmail.com' THEN
        UPDATE public.posts SET is_verified = p_is_verified WHERE id = p_post_id;
    ELSE
        RAISE EXCEPTION 'Acesso Negado: Apenas a Soberana Amanda pode verificar conteúdo.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
