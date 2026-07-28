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

async function inspectKnowledge() {
    try {
        console.log('--- AI_KNOWLEDGE ---');
        const { data: ak, error: akError } = await supabase.from('ai_knowledge').select('*').limit(1);
        if (akError) console.error('AI_KNOWLEDGE Error:', akError.message);
        else console.log('AI_KNOWLEDGE columns:', Object.keys(ak[0] || {}).join(', '));

        console.log('\n--- KNOWLEDGE_BASE ---');
        const { data: kb, error: kbError } = await supabase.from('knowledge_base').select('*').limit(1);
        if (kbError) console.error('KNOWLEDGE_BASE Error:', kbError.message);
        else console.log('KNOWLEDGE_BASE columns:', Object.keys(kb[0] || {}).join(', '));

    } catch (err) {
        console.error('Catch Error:', err.message);
    }
}

inspectKnowledge();
