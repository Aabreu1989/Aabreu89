import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkJobListings() {
    const { count, error } = await supabase.from('job_listings').select('*', { count: 'exact', head: true });
    if (error) console.log("Error:", error.message);
    else console.log(`Current job listings in pnlz: ${count}`);
}

checkJobListings();
