
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function list() {
    const { data, error } = await supabase.rpc('get_tables');
    if (error) {
        // Fallback: try common names
        const tables = ['profiles', 'posts', 'community_posts', 'job_posts', 'map_alerts', 'reports', 'suggestions'];
        for (const t of tables) {
            const { error: tErr } = await supabase.from(t).select('count', { count: 'exact', head: true });
            console.log(`Table ${t}: ${tErr ? 'FAIL (' + tErr.message + ')' : 'OK'}`);
        }
    } else {
        console.log(data);
    }
}
list();
