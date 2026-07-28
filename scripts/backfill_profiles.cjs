const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function backfillProfiles() {
    console.log('Starting Backfill Process...');
    
    // 1. Get all Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Auth Error:', authError);
        return;
    }
    
    console.log(`Found ${users.length} users in Auth.`);
    
    // 2. Get all Profile IDs
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id');
    if (pError) {
        console.error('Profile Error:', pError);
        return;
    }
    
    const existingIds = new Set(profiles.map(p => p.id));
    const missingUsers = users.filter(u => !existingIds.has(u.id));
    
    console.log(`Detected ${missingUsers.length} missing profiles.`);
    
    if (missingUsers.length === 0) {
        console.log('Nothing to backfill!');
        return;
    }
    
    // 3. Insert missing profiles
    let successCount = 0;
    for (const u of missingUsers) {
        const username = u.email ? u.email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 5) : 'membro_' + u.id.substring(0, 5);
        
        const { error } = await supabase.from('profiles').insert({
            id: u.id,
            email: u.email,
            username: username,
            full_name: 'Novo Membro',
            reputation: 10,
            trust_level: 'Novato',
            role: 'user',
            is_verified: false,
            created_at: u.created_at,
            updated_at: u.created_at,
            badges: ['pioneiro']
        });
        
        if (error) {
            console.error(`- Error for ${u.email}:`, error.message);
        } else {
            console.log(`+ Success: ${u.email}`);
            successCount++;
        }
    }
    
    console.log(`\nBackfill Completed: ${successCount} profiles created.`);
}

backfillProfiles();
