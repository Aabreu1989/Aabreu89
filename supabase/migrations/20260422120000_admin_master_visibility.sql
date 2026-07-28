-- 🛡️ MIRA SOBERANA: LIBERAÇÃO TOTAL PARA DASHBOARD ADMIN
-- Este script garante que o Admin Master (amandasabreu89@gmail.com) 
-- tenha visibilidade total de todas as métricas em tempo real.

DO $$ 
DECLARE
    tables TEXT[] := ARRAY['profiles', 'job_posts', 'services', 'courses', 'reports', 'app_suggestions', 'posts', 'comments'];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Remover políticas antigas de Admin para evitar conflitos
        EXECUTE format('DROP POLICY IF EXISTS "Admin Master Access" ON public.%I', t);
        
        -- Criar Política de Acesso Mestre baseada em JWT
        EXECUTE format('
            CREATE POLICY "Admin Master Access" ON public.%I
            FOR ALL
            TO authenticated
            USING (auth.jwt() ->> ''email'' = ''amandasabreu89@gmail.com'')
            WITH CHECK (auth.jwt() ->> ''email'' = ''amandasabreu89@gmail.com'')
        ', t);
        
        RAISE NOTICE '✅ Política Admin Master aplicada na tabela %', t;
    END LOOP;
END $$;
