const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRpc() {
    // Try execute_sql if it exists
    const { data: qData, error: qError } = await supabase.rpc('execute_sql', { 
        query: "SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'get_sovereign_community_feed_v24'" 
    });
    
    if (qData) {
        console.log('RPC Definition:', qData);
        return;
    }

    // Try finding via public metadata
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    console.log('Columns in posts:', Object.keys(data[0]));
}

checkRpc();
