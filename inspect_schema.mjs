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

async function inspectSchema() {
    try {
        console.log('--- TABLES ---');
        // Usando a API REST para listar tabelas se possível, ou consultando views
        const { data: tables, error: tError } = await supabase.from('profiles').select('id').limit(1);
        if (tError) console.error('Profiles Table Error:', tError.message);
        else console.log('Profiles table exists.');

        const { data: posts, error: pError } = await supabase.from('posts').select('id').limit(1);
        if (pError) console.error('Posts Table Error:', pError.message);
        else console.log('Posts table exists.');

        const { data: saved, error: sError } = await supabase.from('saved_posts').select('*').limit(1);
        if (sError) console.error('Saved Posts Table Error:', sError.message);
        else console.log('Saved Posts table exists.');

    } catch (err) {
        console.error('Catch Error:', err.message);
    }
}

inspectSchema();
