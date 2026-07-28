const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔍 Auditando DOMÍNIOS das Vagas...");
    const { data, error } = await supabase.from('job_posts').select('source_url');
    
    if (data) {
        const domains = new Set();
        data.forEach(j => {
            try {
                const url = new URL(j.source_url);
                domains.add(url.hostname);
            } catch (e) {}
        });
        console.log("📋 Domínios encontrados:", Array.from(domains).join(', '));
    }
}

run();
