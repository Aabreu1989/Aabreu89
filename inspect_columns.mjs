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

async function inspectColumns() {
    try {
        console.log('--- POSTS ---');
        const { data: posts, error: pError } = await supabase.from('posts').select('*').limit(1);
        if (pError) console.error('Posts Error:', pError.message);
        else console.log('Posts columns:', Object.keys(posts[0] || {}).join(', '));

        console.log('\n--- PROFILES ---');
        const { data: profiles, error: prError } = await supabase.from('profiles').select('*').limit(1);
        if (prError) console.error('Profiles Error:', prError.message);
        else console.log('Profiles columns:', Object.keys(profiles[0] || {}).join(', '));

    } catch (err) {
        console.error('Catch Error:', err.message);
    }
}

inspectColumns();
