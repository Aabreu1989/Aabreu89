import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
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
