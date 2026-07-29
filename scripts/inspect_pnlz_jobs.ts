import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkJobs() {
    const { data, error } = await supabase.from('job_posts').select('*').limit(5);
    if (error) console.error("Error:", error.message);
    else {
        console.log("Jobs in pnlz (sample):", JSON.stringify(data, null, 2));
    }
}

checkJobs();
