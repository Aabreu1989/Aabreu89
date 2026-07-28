import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRPCs() {
    console.log("🔍 Checking MIRA Admin RPCs...");
    
    const rpcs = ['sum_post_likes', 'sum_post_useful', 'sum_post_fake', 'count_total_comments'];
    
    for (const rpc of rpcs) {
        const { data, error } = await supabase.rpc(rpc);
        if (error) {
            console.error(`❌ RPC ${rpc} error:`, error.message);
        } else {
            console.log(`✅ RPC ${rpc} success:`, data);
        }
    }
}

testRPCs();
