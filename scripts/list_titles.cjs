const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔍 Inspecionando títulos para identificar lixo...");
    
    const { data, error } = await supabase
        .from('job_posts')
        .select('title, source_url')
        .eq('source_name', 'Web-Emprego');
    
    if (error) {
        console.error("❌ Erro:", error.message);
    } else {
        const garbage = data.filter(j => 
            j.title.toLowerCase().includes('como ') || 
            j.title.toLowerCase().includes('guia') || 
            j.title.toLowerCase().includes('valor') ||
            j.title.toLowerCase().includes('saiba') ||
            j.title.toLowerCase().includes('direitos') ||
            j.title.toLowerCase().includes('?')
        );
        console.log(`🔍 Encontrados ${garbage.length} itens de lixo no Web-Emprego:`);
        garbage.forEach((j, i) => console.log(`${i+1}. ${j.title} (${j.source_url})`));
    }
}

run();
