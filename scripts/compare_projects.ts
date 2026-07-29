import { createClient } from '@supabase/supabase-js';

const PROJ1 = {
    name: "pnlzyshozpqlzuyjesdq (OLD per User)",
    url: "https://pnlzyshozpqlzuyjesdq.supabase.co",
    key: "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER"
};

const PROJ2 = {
    name: "ychwhxkxsxmuvabxlyjn (NEW per User)",
    url: "https://ychwhxkxsxmuvabxlyjn.supabase.co",
    key: "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER"
};

async function check(proj) {
    console.log(`\n🔍 Checking ${proj.name}...`);
    const supabase = createClient(proj.url, proj.key);
    
    try {
        const { count: userCount, error: uErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (uErr) console.error(`❌ User Error:`, uErr.message);
        else console.log(`✅ Users: ${userCount}`);

        const { count: serviceCount, error: sErr } = await supabase.from('services').select('*', { count: 'exact', head: true });
        if (sErr) console.error(`❌ Service Error:`, sErr.message);
        else console.log(`✅ Services: ${serviceCount}`);
    } catch (e) {
        console.error(`❌ Fatal error for ${proj.name}:`, e.message);
    }
}

async function run() {
    await check(PROJ1);
    await check(PROJ2);
}

run();
