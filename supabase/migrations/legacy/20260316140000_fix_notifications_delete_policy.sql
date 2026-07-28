-- Protocolo MIRA: 2026-03-16_fix_notifications_delete_policy.sql
-- Garante que utilizadores podem APAGAR as suas próprias notificações
-- Sem isso, o botão "APAGAR TODAS" falha com erro 42501 (Permission Denied)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND policyname = 'Users can delete own notifications'
    ) THEN
        CREATE POLICY "Users can delete own notifications"
        ON public.notifications FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Garante que RLS está ativo
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
