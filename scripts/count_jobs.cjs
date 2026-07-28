const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count, error } = await supabase
        .from('job_posts')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("❌ Erro ao contar vagas:", error.message);
    } else {
        console.log(`📊 Total de Vagas no Banco: ${count}`);
    }
}

check();
