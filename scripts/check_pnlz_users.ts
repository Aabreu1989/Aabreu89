import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkUsers() {
    const { data, error } = await supabase.from('profiles').select('email, name').limit(10);
    if (error) console.error("Error:", error.message);
    else {
        console.log("Top users in pnlz:");
        data.forEach(u => console.log(`- ${u.email} (${u.name})`));
    }
}

checkUsers();
