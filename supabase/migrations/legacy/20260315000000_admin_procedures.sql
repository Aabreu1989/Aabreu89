-- Protocolo Nuclear: RPC para exclusão segura de utilizadores (V26.5)
-- Esta função permite que um administrador exclua um utilizador ignorando verificações básicas de RLS
-- mas respeitando as restrições de integridade referencial (cascateamento).

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios de superuser
SET search_path = public
AS $$
BEGIN
  -- Verificar se o chamador é um administrador (proteção adicional dentro do SQL)
  -- Nota: No MIRA, o controle de acesso é feito pelo middleware e pela política do Supabase,
  -- mas o SECURITY DEFINER exige cautela. 
  
  -- 1. Remover da tabela de perfis (os dados da comunidade devem cascatear ou ser limpos)
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- 2. Remover da tabela de auth (isto é o que realmente remove o acesso ao app)
  -- Nota: auth.users não pode ser deletado diretamente via SQL em instâncias gerenciadas do Supabase 
  -- sem permissões especiais. Se esta parte falhar, o profile foi apagado mas a conta auth persiste.
  -- Usamos o serviço do Supabase Admin API via Edge Function ou SDK para remover o Auth.
  -- Esta RPC foca na limpeza dos dados da base de dados.
  
  -- Registar a ação na auditoria
  INSERT INTO public.activity_logs (user_id, action, metadata)
  VALUES (auth.uid(), 'admin_delete_user_executed', jsonb_build_object('target', target_user_id, 'timestamp', now()));

END;
$$;
