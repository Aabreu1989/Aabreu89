const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🧹 MIRA PURGE: Iniciando limpeza de vagas com mais de 30 dias...");
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoDate = thirtyDaysAgo.toISOString();

    console.log(`📅 Data de corte: ${isoDate}`);

    const { data, error, count } = await supabase
        .from('job_posts')
        .delete({ count: 'exact' })
        .lt('created_at', isoDate);

    if (error) {
        console.error(`❌ Erro ao apagar vagas antigas:`, error.message);
    } else {
        console.log(`🗑️ MIRA SOBERANIA: Expurgadas ${count || 0} vagas obsoletas (mais de 30 dias).`);
    }

    console.log(`✨ Operação de limpeza concluída.`);
}

run();
