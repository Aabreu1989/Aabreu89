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

async function verifyInfrastructure() {
    console.log("🛠️ VERIFICANDO INFRAESTRUTURA MIRA V2026.GOLD...");
    
    const tables = ['profiles', 'posts', 'comments', 'activity_logs', 'notifications', 'saved_posts', 'comment_likes', 'post_votes'];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Table '${table}' ERROR: ${error.message}`);
        } else {
            console.log(`✅ Table '${table}' is accessible.`);
        }
    }

    // Test the RPC
    const { data: feed, error: rpcError } = await supabase.rpc('get_sovereign_community_feed_v25', {
        p_limit: 1,
        p_offset: 0
    });

    if (rpcError) {
        console.error(`❌ RPC 'get_sovereign_community_feed_v25' ERROR: ${rpcError.message}`);
    } else {
        console.log(`✅ RPC 'get_sovereign_community_feed_v25' is operational.`);
    }

    console.log("\n📡 TESTANDO INTEGRAÇÃO DE RELACIONAMENTO (POSTS -> PROFILES)...");
    const { data: relationshipTest, error: relError } = await supabase
        .from('posts')
        .select(`
            id,
            author:profiles (
                full_name
            )
        `)
        .limit(1);

    if (relError) {
        console.error(`❌ Relationship 'posts -> profiles' ERROR: ${relError.message}`);
        if (relError.message.includes("Could not find a relationship")) {
            console.log("💡 DICA: O cache do PostgREST pode precisar de um NOTIFY pgrst, 'reload schema';");
        }
    } else {
        console.log(`✅ Relationship 'posts -> profiles' is working correctly.`);
    }
}

verifyInfrastructure();
