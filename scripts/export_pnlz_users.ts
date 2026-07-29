import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function exportUsers() {
    console.log("🚀 Exporting active users from pnlz...");
    const { data, error } = await supabase.from('profiles').select('*');
    
    if (error) {
        console.error("Error:", error.message);
        return;
    }
    
    const vaultDir = path.join(process.cwd(), 'backups', 'RESCUE_VAULT');
    if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
    
    const filePath = path.join(vaultDir, 'users_pnlz_active_final.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Exported ${data.length} users to ${filePath}`);
}

exportUsers();
