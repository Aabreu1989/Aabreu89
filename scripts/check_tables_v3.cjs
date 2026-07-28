const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.rpc('get_tables_sovereign_v2026'); // If exists
    if (error) {
        // Fallback: try to just fetch something from a few tables to see if they exist
        const tables = ['profiles', 'posts', 'comments', 'stories', 'community_interactions', 'post_votes', 'saved_posts', 'admin_users'];
        for (const t of tables) {
            const { error: e } = await supabase.from(t).select('id').limit(1);
            console.log(`Table '${t}': ${e ? '❌ Fail (' + e.message + ')' : '✅ Exist'}`);
        }
    } else {
        console.log("Tables:", data);
    }
}

check();
