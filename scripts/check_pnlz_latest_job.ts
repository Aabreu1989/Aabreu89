import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkLatestJob() {
    const { data, error } = await supabase.from('job_posts').select('*').order('created_at', { ascending: false }).limit(1);
    if (error) console.error("Error:", error.message);
    else console.log("Latest job in pnlz:", JSON.stringify(data[0], null, 2));
}

checkLatestJob();
