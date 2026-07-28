const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🚫 Banindo Glassdoor da Base de Dados...");
    
    const { data, error, count } = await supabase
        .from('job_posts')
        .delete({ count: 'exact' })
        .ilike('source_url', '%glassdoor%');

    if (error) {
        console.error("❌ Erro:", error.message);
    } else {
        console.log(`🗑️ Removidos ${count || 0} links do Glassdoor que estavam a "sujar" o sistema.`);
    }
}

run();
