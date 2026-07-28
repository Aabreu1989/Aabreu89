import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = {};
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) env[key.trim()] = val.join('=').trim();
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRealSchema() {
    try {
        // Querying RPC that might exist for schema or just trying to guess via REST
        console.log('--- POSTS COLUMNS (guessing) ---');
        const { data, error } = await supabase.from('posts').select('*').limit(0);
        if (error) console.error('Posts Error:', error.message);
        else console.log('Posts columns:', data); // In some versions this might return columns in headers or empty data

        // Try direct SQL via RPC if it exists
        const { data: qData, error: qError } = await supabase.rpc('exec_sql', { sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'" });
        if (qError) console.log('exec_sql RPC not available.');
        else console.log('Posts Columns:', qData);

    } catch (err) {
        console.error('Catch Error:', err.message);
    }
}

inspectRealSchema();
