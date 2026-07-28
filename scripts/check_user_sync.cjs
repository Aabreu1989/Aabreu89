const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
    console.log('Checking User Sync Status...');
    
    // 1. Get count from public.profiles
    const { count: profileCount, error: pError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
    if (pError) console.error('Error fetching profiles:', pError);

    // 2. Get count from auth.users (requires service role)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
        console.error('Error fetching auth users:', authError);
    } else {
        const authCount = users.length;
        console.log(`\nResults:`);
        console.log(`- Auth Users (Supabase Auth): ${authCount}`);
        console.log(`- Profile Rows (public.profiles): ${profileCount}`);
        
        if (authCount > profileCount) {
            console.log(`\n⚠️ DISCREPANCY DETECTED: ${authCount - profileCount} users are in Auth but missing from Profiles!`);
            
            // Check the 5 most recent auth users
            const recentAuth = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
            console.log('\nRecent Auth Users (top 5):');
            recentAuth.forEach(u => {
                console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`);
            });
            
            // Check if these IDs exist in profiles
            const ids = recentAuth.map(u => u.id);
            const { data: existingProfiles } = await supabase
                .from('profiles')
                .select('id')
                .in('id', ids);
            
            const existingIds = new Set(existingProfiles?.map(p => p.id) || []);
            const missing = recentAuth.filter(u => !existingIds.has(u.id));
            
            if (missing.length > 0) {
                console.log('\n❌ Missing Profiles for:');
                missing.forEach(m => console.log(`  - ${m.email} (${m.id})`));
                console.log('\nSuggestion: The "handle_new_user" trigger might be broken or missing.');
            }
        } else {
            console.log('\n✅ Counts match! Sync seems okay.');
        }
    }
}

checkUsers();
