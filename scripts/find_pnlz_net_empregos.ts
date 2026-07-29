import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkJob() {
    const { data, error } = await supabase.from('job_posts').select('*').eq('source_name', 'Net-Empregos').limit(5);
    if (error) console.error("Error:", error.message);
    else {
        console.log(`Found ${data.length} jobs with 'Net-Empregos'`);
        data.forEach(j => console.log(`- ${j.id}: ${j.title} (${j.source_url})`));
    }
}

checkJob();
