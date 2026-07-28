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

async function importUsers() {
    const backupPath = path.join('backups', 'RESCUE_VAULT', 'users_backup.json');
    if (!fs.existsSync(backupPath)) {
        console.error("❌ Backup file not found!");
        return;
    }

    const users = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`🚀 Importing ${users.length} users into 'profiles' table...`);

    // We use upsert to handle existing records
    const { error } = await supabase
        .from('profiles')
        .upsert(users, { onConflict: 'id' });

    if (error) {
        console.error("❌ Error importing users:", error.message);
    } else {
        console.log("✅ Users imported successfully.");
    }
}

importUsers();
