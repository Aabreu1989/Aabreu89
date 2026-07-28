import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const email = 'amandasabreu89@gmail.com';
    const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (prof) {
        const { data: posts, error } = await supabase.from('posts').select('*').eq('author_id', prof.id).order('created_at', { ascending: false }).limit(5);
        if (error) console.error("POSTS ERR:", error.message);
        else {
            posts.forEach(p => console.log(`POST ID: ${p.id} | TITLE: ${p.title} | STATUS: ${p.validation_status} | CREATED: ${p.created_at}`));
        }
    }
}

check();
