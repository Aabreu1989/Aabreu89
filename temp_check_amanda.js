import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const email = 'amandasabreu89@gmail.com'; // This is the user email from the conversation state
    const { data: prof, error } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (error) console.error("PROFILE ERR:", error.message);
    else {
        console.log("PROFILE FOUND:", prof.username, "| ID:", prof.id);
        
        // Also check if any post exists for this user
        const { count, error: postErr } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', prof.id);
        if (postErr) console.error("POSTS ERR:", postErr.message);
        else console.log("POSTS BY THIS USER:", count);
    }
}

check();
