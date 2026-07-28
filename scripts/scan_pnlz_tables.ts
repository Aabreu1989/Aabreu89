import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
const supabase = createClient(url, key);

async function listTables() {
    // We can't list tables directly with JS SDK, so we try to query common names
    const names = ['job_sites', 'job_sources', 'sources', 'external_sources', 'job_listings'];
    for (const name of names) {
        const { error } = await supabase.from(name).select('*').limit(1);
        if (!error) console.log(`✅ Table found: ${name}`);
        else if (error.code !== '42P01') console.log(`❓ Table ${name} gave error: ${error.code} (${error.message})`);
    }
}

listTables();
