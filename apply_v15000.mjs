
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlPath = './V15000_SOBERANIA_TOTAL_STABILIZATION.sql';
const query = fs.readFileSync(sqlPath, 'utf8');

async function apply() {
    console.log("🚀 MIRA Soberana: Aplicando Estabilização V15000...");
    
    // Tentamos usar a RPC admin_execute_sql que deve existir no projeto para migrações
    const { data, error } = await supabase.rpc('admin_execute_sql', { sql_query: query });
    
    if (error) {
        console.error("❌ ERRO AO APLICAR MIGRAÇÃO:", error.message);
        if (error.message.includes('admin_execute_sql')) {
            console.log("ℹ️ RPC admin_execute_sql not found. Tente aplicar manualmente no dashboard do Supabase.");
        }
    } else {
        console.log("✅ PRODUÇÃO ESTABILIZADA: V15000 aplicada com sucesso.");
    }
}

apply();
