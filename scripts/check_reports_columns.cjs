const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('admin_reports_view').select('*').limit(1);
    if (error) {
        console.error("❌ Erro:", error.message);
    } else if (data && data.length > 0) {
        console.log("✅ Colunas encontradas:", Object.keys(data[0]));
        console.log("Sample:", data[0]);
    } else {
        console.log("⚠️ Nenhuma denúncia encontrada para analisar colunas.");
        // Try to get columns from a different way if possible, or just look at 'reports'
        const { data: reports } = await supabase.from('reports').select('*').limit(1);
        if (reports) console.log("Colunas 'reports':", Object.keys(reports[0]));
    }
}

check();
