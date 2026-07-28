
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

const sqlPath = './V15100_NOBEL_SCORE_FINAL.sql';
const query = fs.readFileSync(sqlPath, 'utf8');

async function apply() {
    console.log("🚀 MIRA Soberana: Aplicando Regras Nobel V15100...");
    
    const { data, error } = await supabase.rpc('admin_execute_sql', { sql_query: query });
    
    if (error) {
        console.error("❌ ERRO AO APLICAR MIGRAÇÃO:", error.message);
    } else {
        console.log("✅ DESTAQUES SOBERANOS: Regras Nobel aplicadas com sucesso.");
    }
}

apply();
