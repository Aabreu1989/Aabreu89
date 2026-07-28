import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
const supabase = createClient(url, key);

async function checkServices() {
    const { data, error } = await supabase.from('services').select('*').limit(5);
    if (error) console.error("Error:", error.message);
    else {
        console.log("Services in pnlz (sample):", JSON.stringify(data, null, 2));
    }
}

checkServices();
