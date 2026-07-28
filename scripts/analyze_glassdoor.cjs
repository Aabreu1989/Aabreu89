const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔍 Analisando Estrutura de Links do Glassdoor...");
    
    const { data, error } = await supabase
        .from('job_posts')
        .select('id, title, source_url')
        .ilike('source_url', '%glassdoor%');

    if (error) {
        console.error("❌ Erro:", error.message);
    } else if (data) {
        console.log(`📊 Encontrados ${data.length} links do Glassdoor.`);
        data.forEach((j, i) => {
            const isGeneric = !j.source_url.includes('job-listing') && !j.source_url.includes('.htm');
            console.log(`${i+1}. [${isGeneric ? 'GENÉRICO' : 'ESPECÍFICO'}] ${j.title} -> ${j.source_url}`);
        });
    }
}

run();
