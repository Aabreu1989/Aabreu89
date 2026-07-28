import { createClient } from '@supabase/supabase-js';

const PROJ1 = {
    name: "pnlzyshozpqlzuyjesdq (OLD per User)",
    url: "https://pnlzyshozpqlzuyjesdq.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0"
};

const PROJ2 = {
    name: "ychwhxkxsxmuvabxlyjn (NEW per User)",
    url: "https://ychwhxkxsxmuvabxlyjn.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAzNzc5OCwiZXhwIjoyMDg3NjEzNzk4fQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0"
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
