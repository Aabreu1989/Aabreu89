import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: last, error: lastErr } = await supabase.from('posts').select('*, prof:profiles(*)').order('created_at', { ascending: false }).limit(1);
    if (lastErr) console.error("LAST ERR:", lastErr.message);
    else {
        console.log("LAST POST ID:", last?.[0]?.id);
        console.log("AUTHOR ID:", last?.[0]?.author_id);
        console.log("PROFILE FOUND:", !!last?.[0]?.prof);
        if (last?.[0]?.prof) {
            console.log("PROFILE NAME:", last?.[0]?.prof.username || last?.[0]?.prof.name);
        }
    }
}

check();
