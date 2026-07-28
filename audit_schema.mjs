import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSchema() {
    console.log("🔍 [MIRA SCHEMA AUDIT] Iniciando auditoria de tabelas...");

    try {
        // List all tables in public schema
        const { data, error } = await supabase
            .from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public');
        
        if (error) {
            console.log("⚠️ RPC direct access failed. Trying alternative metadata check...");
            // Alternative: try to select from expected tables to see which exist
            const tables = [
                'profiles', 'posts', 'comments', 'ai_knowledge', 
                'activity_logs', 'notifications', 'saved_posts', 
                'comment_likes', 'reports', 'services', 'job_posts', 'courses'
            ];
            
            for (const table of tables) {
                const { error: tError } = await supabase.from(table).select('id').limit(1);
                if (tError) {
                    console.log(`❌ Table '${table}' ERROR: ${tError.message}`);
                } else {
                    console.log(`✅ Table '${table}' EXISTS`);
                }
            }
        } else {
            console.log("✅ Tables found in 'public' schema:");
            data.forEach(t => console.log(` - ${t.tablename}`));
        }

    } catch (e) {
        console.error("🚨 [MIRA AUDIT ERROR]:", e);
    }
}

inspectSchema();
