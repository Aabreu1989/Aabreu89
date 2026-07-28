import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const URL = process.env.VITE_SUPABASE_URL || '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!URL || !KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(URL, KEY);

async function exportUsers() {
    console.log("🚀 Exporting all users from 'profiles' table...");
    
    // Fetch profiles
    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error("❌ Error fetching profiles:", error.message);
        process.exit(1);
    }

    const backupPath = path.join('backups', 'RESCUE_VAULT', 'users_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Exported ${data.length} profiles to ${backupPath}`);
}

exportUsers();
