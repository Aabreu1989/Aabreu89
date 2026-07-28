import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Fetching Feed V10000...");
    const { data, error } = await supabase.rpc('get_sovereign_community_feed_v10000', {
        p_limit: 10,
        p_offset: 0
    });
    
    if (error) {
        console.error("RPC ERROR:", error);
    } else {
        console.log("RPC SUCCESS! Rows returned:", data?.length);
        if (data?.length > 0) {
            console.log(data[0]);
        }
    }
}

testFetch();
