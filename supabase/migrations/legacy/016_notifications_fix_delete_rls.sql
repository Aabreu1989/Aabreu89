-- ============================================================
-- MIRA V2026: PILLAR 016 — NOTIFICAÇÕES: LIMPEZA E BLINDAGEM
-- Corrige RLS DELETE, apaga notificações antigas com conteúdo errado
-- ============================================================

-- 1. GARANTIR POLÍTICA DE DELETE (idempotente)
DO $$
BEGIN
    -- Apagar versões antigas da política que possam ter nomes diferentes
    DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
    
    -- Criar a política correcta e definitiva
    CREATE POLICY "Users delete own notifications"
        ON public.notifications
        FOR DELETE
        USING (auth.uid() = user_id);
END $$;

-- 2. GARANTIR PERMISSÕES DE DELETE NO SUPABASE
GRANT DELETE ON TABLE public.notifications TO authenticated;
GRANT DELETE ON TABLE public.notifications TO service_role;

-- 3. APAGAR NOTIFICAÇÕES COM CONTEÚDO OBSOLETO ("nuvem MIRA")
DELETE FROM public.notifications
WHERE message ILIKE '%nuvem MIRA%'
   OR message ILIKE '%nuvem%'
   OR message ILIKE '%cloud%';
