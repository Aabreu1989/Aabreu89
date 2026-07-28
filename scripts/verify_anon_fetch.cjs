const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// USAR A ANON KEY (Simular utilizador público do site)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("🔍 Verificando visibilidade PÚBLICA das vagas...");
    
    const { data, error, count } = await supabase
        .from('job_posts')
        .select('*', { count: 'exact' })
        .limit(5);

    if (error) {
        console.error("❌ Erro de Acesso (RLS provavelmente a bloquear):", error.message);
    } else {
        console.log(`✅ SUCESSO! Encontrei ${data.length} vagas visíveis publicamente.`);
        console.log(`📊 Total de vagas acessíveis ao público: ${data.length >= 5 ? 'Pelo menos 5 (RLS Aberto)' : data.length}`);
        
        if (data.length > 0) {
            console.log("📝 Exemplo de vaga visível:", data[0].title);
        }
    }
}

run();
