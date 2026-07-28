const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findRoles() {
    // Try to get enum via a new function if possible, or just look at existing profiles again
    const { data: roles, error } = await supabase.from('profiles').select('role');
    if (error) {
        console.error(error);
        return;
    }
    const uniqueRoles = [...new Set(roles.map(r => r.role))];
    console.log('Unique roles in DB:', uniqueRoles);
    
    // Try a direct insert with a known role to see if it works
    console.log('Testing role "specialist"...');
    const { error: err1 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000001', role: 'specialist', email: 'test@test.com', username: 'test_node' });
    if (err1) console.log('specialist FAILED:', err1.message);
    else console.log('specialist WORKS');

    console.log('Testing role "member"...');
    const { error: err2 } = await supabase.from('profiles').insert({ id: '00000000-0000-0000-0000-000000000002', role: 'member', email: 'test2@test.com', username: 'test_node_2' });
    if (err2) console.log('member FAILED:', err2.message);
    else console.log('member WORKS');
}

findRoles();
