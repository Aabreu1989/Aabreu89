import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkJobs() {
    const { count, error } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });
    if (error) console.error("Error:", error.message);
    else console.log(`Current jobs in pnlz: ${count}`);
}

checkJobs();
