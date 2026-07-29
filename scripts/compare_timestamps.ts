import { createClient } from '@supabase/supabase-js';

const PNLZ_URL = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const PNLZ_KEY = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";

const YCHW_URL = "https://ychwhxkxsxmuvabxlyjn.supabase.co";
const YCHW_ANON = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";

async function compareTimestamps() {
    const s1 = createClient(PNLZ_URL, PNLZ_KEY);
    const s2 = createClient(YCHW_URL, YCHW_ANON);

    console.log("Checking PNLZ...");
    const { data: d1 } = await s1.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1);
    console.log("PNLZ Latest User:", d1?.[0]?.created_at);

    console.log("Checking YCHW...");
    const { data: d2 } = await s2.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1);
    console.log("YCHW Latest User:", d2?.[0]?.created_at);
}

compareTimestamps();
