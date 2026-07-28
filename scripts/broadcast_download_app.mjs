import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pnlzyshozpqlzuyjesdq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("📡 Acedendo à lista de cidadãos registados na plataforma MIRA...");
  const { data: users, error: fetchError } = await supabase.from('profiles').select('id');
  if (fetchError) {
    console.error("❌ Erro ao obter perfis de utilizadores:", fetchError.message);
    return;
  }
  
  console.log(`👥 Total de perfis encontrados: ${users.length}`);
  if (users.length === 0) {
    console.log("⚠️ Nenhum utilizador registado.");
    return;
  }
  
  console.log("⚙️ A preparar notificação de instalação da App...");
  const notifications = users.map(u => ({
    user_id: u.id,
    type: 'system',
    title: 'Instale a App Oficial da MIRA! 📲',
    message: 'Sabia que pode instalar a MIRA diretamente no seu telemóvel ou computador? Aceda ao menu do seu navegador (Google Chrome, Safari, etc.) e clique em "Adicionar ao ecrã principal" ou "Instalar App" para ter acesso rápido sem gastar espaço na memória!',
    link: '/',
    is_read: false,
    created_at: new Date().toISOString()
  }));
  
  const CHUNK_SIZE = 100;
  let countSent = 0;
  
  for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
    const chunk = notifications.slice(i, i + CHUNK_SIZE);
    const { error: insertError } = await supabase.from('notifications').insert(chunk);
    if (insertError) {
      console.error(`❌ Falha na inserção do chunk inicializado em ${i}:`, insertError.message);
      return;
    }
    countSent += chunk.length;
    console.log(`✅ Chunk enviado com sucesso: ${countSent} de ${notifications.length} enviados.`);
  }
  
  console.log(`📡 TRANSMISSÃO COMPLETA! Notificação sobre a App enviada para todos os ${countSent} cidadãos. ✅`);
}

run();
