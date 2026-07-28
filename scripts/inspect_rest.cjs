const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔍 Inspecionando via REST API...");
    
    // Tentar listar tabelas via rpc ou query direta (se permitido)
    const { data: tables, error: tError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (tError) {
        console.warn("⚠️ Não foi possível listar tabelas via query direta. Tentando lista manual de tabelas conhecidas...");
        const knownTables = [
            'profiles', 'posts', 'comments', 'job_posts', 'courses', 
            'services', 'badges', 'user_badges', 'notifications', 
            'reports', 'app_suggestions', 'community_interactions',
            'newsroom_articles', 'ai_knowledge', 'admin_dashboard_stats'
        ];
        
        for (const table of knownTables) {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
            } else {
                console.log(`   ✅ ${table}: Encontrada.`);
            }
        }
    } else {
        console.log("📋 Tabelas encontradas:", tables.map(t => t.table_name).join(', '));
    }
}

run();
