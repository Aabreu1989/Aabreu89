import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = "https://ychwhxkxsxmuvabxlyjn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzc3OTgsImV4cCI6MjA4NzYxMzc5OH0.o3-cCO24KjNrW8NM7HFOycdpxX8D0q4vHeXS0BqFMGc";
const supabase = createClient(supabaseUrl, supabaseKey);

const vaultDir = path.resolve('backups/RESCUE_VAULT');

async function exportYchw() {
    console.log("🚀 Exporting REAL data from NEW project (ychw)...");

    // Profiles
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) console.error("❌ Error profiles:", pErr.message);
    else {
        fs.writeFileSync(path.join(vaultDir, 'users_ychw_backup.json'), JSON.stringify(profiles, null, 2));
        console.log(`✅ Saved ${profiles.length} profiles.`);
    }

    // Services
    const { data: services, error: sErr } = await supabase.from('services').select('*');
    if (sErr) console.error("❌ Error services:", sErr.message);
    else {
        fs.writeFileSync(path.join(vaultDir, 'services_ychw_backup.json'), JSON.stringify(services, null, 2));
        console.log(`✅ Saved ${services.length} services.`);
    }

    console.log("✨ Export finished.");
}

exportYchw();
