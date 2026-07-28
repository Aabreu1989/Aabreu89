-- ============================================================
-- 🦾 MIRA V2026: PILLAR 017 - ADMIN SOVEREIGNTY HARDENING
-- CEO: Amanda Abreu | Permissões de Escrita e Moderação Real
-- ============================================================

-- 1. POLÍTICAS DE SOBERANIA: ESCRITA PARA ADMINS
-- Permite que a Amanda (e qualquer admin) insira, apague e edite o cérebro da MIRA

-- 1.1 SABER IA
DROP POLICY IF EXISTS "Admins can manage Saber IA" ON public.saber_ia;
CREATE POLICY "Admins can manage Saber IA" ON public.saber_ia 
FOR ALL USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 1.2 KNOWLEDGE BASE
DROP POLICY IF EXISTS "Admins can manage Knowledge Base" ON public.knowledge_base;
CREATE POLICY "Admins can manage Knowledge Base" ON public.knowledge_base 
FOR ALL USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 1.3 NEWSROOM ARTICLES
DROP POLICY IF EXISTS "Admins can manage Newsroom" ON public.newsroom_articles;
CREATE POLICY "Admins can manage Newsroom" ON public.newsroom_articles 
FOR ALL USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. POLÍTICAS DE MODERAÇÃO: BANIR CONTEÚDO
-- Permite que admins apaguem posts e comentários denunciados

-- 2.1 POSTS (Permissão de DELETE)
DROP POLICY IF EXISTS "Admins can delete posts" ON public.posts;
CREATE POLICY "Admins can delete posts" ON public.posts 
FOR DELETE USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2.2 COMMENTS (Permissão de DELETE)
DROP POLICY IF EXISTS "Admins can delete comments" ON public.comments;
CREATE POLICY "Admins can delete comments" ON public.comments 
FOR DELETE USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2.3 MODERATION REPORTS
DROP POLICY IF EXISTS "Admins can manage reports" ON public.community_reports;
CREATE POLICY "Admins can manage reports" ON public.community_reports 
FOR ALL USING (
  LOWER(auth.jwt() ->> 'email') = 'amandasabreu89@gmail.com' OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. UNIFICAÇÃO DE FLUXO DE DENÚNCIAS (Garante que nada falha)
-- Garante que o Admin Panel recebe dados tanto de 'reports' quanto de 'community_reports'

CREATE OR REPLACE FUNCTION public.admin_get_moderation_data_v3()
RETURNS TABLE (
    report_id uuid,
    type text,
    status text,
    reason text,
    created_at timestamptz,
    reporter_name text,
    content_title text,
    content_text text,
    content_author_id uuid,
    target_id uuid
)
SECURITY DEFINER
AS $$
BEGIN
    -- Security Check
    IF auth.jwt() ->> 'email' != 'amandasabreu89@gmail.com' AND 
       NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado.';
    END IF;

    RETURN QUERY
    -- Unir as duas tabelas de denúncia para garantir visibilidade 100%
    SELECT * FROM (
        -- Fonte A: community_reports (Específica)
        SELECT 
            r.id AS report_id,
            CASE WHEN r.comment_id IS NOT NULL THEN 'comment' ELSE 'post' END AS type,
            COALESCE(r.status, 'pending') as status,
            r.reason,
            r.created_at,
            COALESCE(p_reporter.name, 'Membro') AS reporter_name,
            COALESCE(posts.title, 'Comentário em ' || parent_posts.title, 'Conteúdo Externo') AS content_title,
            COALESCE(posts.content, comments.content, 'Conteúdo removido ou inacessível.') AS content_text,
            COALESCE(posts.author_id, comments.author_id) AS content_author_id,
            COALESCE(r.post_id, r.comment_id) AS target_id
        FROM public.community_reports r
        LEFT JOIN public.profiles p_reporter ON r.user_id = p_reporter.id
        LEFT JOIN public.posts ON r.post_id = posts.id
        LEFT JOIN public.comments ON r.comment_id = comments.id
        LEFT JOIN public.posts parent_posts ON comments.post_id = parent_posts.id
        
        UNION ALL
        
        -- Fonte B: reports (Genérica)
        SELECT 
            rep.id AS report_id,
            rep.type as type,
            'pending' as status,
            'Denúncia Comunitária' as reason,
            rep.created_at,
            'Sistema' as reporter_name,
            'Relato Genérico' as content_title,
            rep.content as content_text,
            rep.user_id as content_author_id,
            COALESCE(rep.post_id, rep.comment_id) as target_id
        FROM public.reports rep
        WHERE rep.post_id IS NOT NULL OR rep.comment_id IS NOT NULL
    ) as unified_reports
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.admin_get_moderation_data_v3() TO authenticated;

-- Success notice
DO $$ BEGIN RAISE NOTICE 'MIRA Sovereignty Part 17 Applied! Admins are now empowered. 🛡️'; END $$;
