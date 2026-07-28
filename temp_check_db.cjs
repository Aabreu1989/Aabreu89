const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = {};
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim().replace(/"/g, '');
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'job_posts' });
    
    // If RPC doesn't exist, try getting columns via query
    if (error) {
        console.log('RPC failed, trying query...');
        const { data: cols, error: err2 } = await supabase
            .from('job_posts')
            .select('*')
            .limit(1);
        if (err2) {
             console.error('Query failed:', err2);
        } else {
             console.log('Columns:', Object.keys(cols[0] || {}));
        }
    } else {
        console.log('Table Info:', data);
    }
}

checkJobs();
