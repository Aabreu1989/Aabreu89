-- 🛡️ PROTOCOLO AMANDA: BLINDAGEM DE PERFIS V2026.GOLD
-- Este script corrige o vazamento de e-mails detectado na auditoria.

-- 1. Remover políticas excessivamente abertas
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- 2. Permitir que qualquer pessoa veja o NOME e AVATAR, mas NUNCA o EMAIL (via RLS seria difícil, então bloqueamos o acesso total à tabela para ANON)
-- A melhor prática é permitir apenas utilizadores AUTENTICADOS verem outros perfis.
CREATE POLICY "Profiles viewable by authenticated users only" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- 3. Garantir que apenas o DONO ou ADMIN pode atualizar
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 4. Criar uma VIEW SEGURA para o público (se necessário), mas por agora, fechamos a tabela.
-- NOTA: O script de auditoria detectou que a ANON KEY tem acesso total. 
-- Ao remover as políticas acima e não criar uma para 'anon', o acesso público é cortado.

ANALYZE profiles;
