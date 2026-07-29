import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function checkCols() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) console.error("Error:", error.message);
    else {
        console.log("Columns in pnlz profiles:", Object.keys(data[0]));
    }
}

checkCols();
