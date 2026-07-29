import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkJob() {
    const { data, error } = await supabase.from('job_posts').select('*').ilike('title', '%Cozinheiro%').limit(10);
    if (error) console.error("Error:", error.message);
    else {
        console.log(`Found ${data.length} jobs with 'Cozinheiro'`);
        data.forEach(j => console.log(`- ${j.id}: ${j.title} (${j.location})`));
    }
}

checkJob();
