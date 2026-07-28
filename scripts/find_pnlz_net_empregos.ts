import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
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
