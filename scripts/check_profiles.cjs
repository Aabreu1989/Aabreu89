const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔍 Inspecionando colunas de PROFILES...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error("❌ Erro:", error.message);
    } else if (data && data.length > 0) {
        console.log("✅ Colunas encontradas em profiles:", Object.keys(data[0]));
    } else {
        console.log("⚠️ Tabela vazia. Tentando via RPC ou erro estrutural.");
    }
}

run();
