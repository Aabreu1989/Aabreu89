import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { count, error } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    if (error) {
        console.error("ERROR:", error.message);
    } else {
        console.log("POSTS COUNT:", count);
        
        // Let's also check the last post
        const { data: last, error: lastErr } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(1);
        if (lastErr) console.error("LAST ERR:", lastErr.message);
        else console.log("LAST POST ID:", last?.[0]?.id, " | STATUS:", last?.[0]?.validation_status);
    }
}

check();
