import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkServices() {
    const { count, error } = await supabase.from('services').select('*', { count: 'exact', head: true });
    if (error) console.error("Error:", error.message);
    else console.log(`Current services in pnlz: ${count}`);
}

checkServices();
