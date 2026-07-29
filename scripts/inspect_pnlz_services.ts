import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkServices() {
    const { data, error } = await supabase.from('services').select('*').limit(5);
    if (error) console.error("Error:", error.message);
    else {
        console.log("Services in pnlz (sample):", JSON.stringify(data, null, 2));
    }
}

checkServices();
