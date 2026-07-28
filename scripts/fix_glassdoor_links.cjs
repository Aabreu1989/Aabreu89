const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🛠️ Aplicando 'Ponte Inteligente' nos links do Glassdoor...");
    
    // 1. Buscar todas as vagas do Glassdoor
    const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, source_url')
        .ilike('source_name', '%glassdoor%');

    if (error) {
        console.error("❌ Erro:", error.message);
        return;
    }

    console.log(`📊 Processando ${data.length} vagas...`);
    let updated = 0;

    for (const job of data) {
        // Se o link for o genérico /Job/portugal, transformamos numa busca pelo título
        if (job.source_url.includes('/Job/portugal') || !job.source_url.includes('job-listing')) {
            const encodedTitle = encodeURIComponent(job.title);
            const smartLink = `https://www.glassdoor.pt/Job/jobs.htm?sc.keyword=${encodedTitle}`;
            
            const { error: upErr } = await supabase
                .from('job_posts')
                .update({ source_url: smartLink })
                .eq('id', job.id);
            
            if (!upErr) updated++;
        }
    }

    console.log(`✅ SUCESSO! ${updated} links do Glassdoor foram "curados" e agora são funcionais.`);
}

run();
