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

async function inspectReports() {
    try {
        console.log('--- REPORTS ---');
        const { data: r, error: rError } = await supabase.from('reports').select('*').limit(1);
        if (rError) console.error('Reports Error:', rError.message);
        else console.log('Reports columns:', Object.keys(r[0] || {}).join(', '));

    } catch (err) {
        console.error('Catch Error:', err.message);
    }
}

inspectReports();
