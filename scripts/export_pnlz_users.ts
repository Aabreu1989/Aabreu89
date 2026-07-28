import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
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
