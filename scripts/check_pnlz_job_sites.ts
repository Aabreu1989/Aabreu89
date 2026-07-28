import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
const supabase = createClient(url, key);

async function checkJobSites() {
    const { count, error } = await supabase.from('job_sites').select('*', { count: 'exact', head: true });
    if (error) console.error("Error:", error.message);
    else if (count === null) {
        const { error: e2 } = await supabase.from('job_sites').select('*').limit(1);
        console.log("Count is null. Error from select:", e2?.message);
    }
    else console.log(`Current job sites in pnlz: ${count}`);
}

checkJobSites();
