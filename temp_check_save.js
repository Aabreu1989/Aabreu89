import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const email = 'amandasabreu89@gmail.com';
    const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).single();
    let res = "";
    if (prof) {
        const { data: posts, error } = await supabase.from('posts').select('*').eq('author_id', prof.id).order('created_at', { ascending: false }).limit(20);
        if (error) res = "POSTS ERR:" + error.message;
        else {
            posts.forEach(p => {
                res += `ID: ${p.id} | CATEGORY: ${p.category} | STATUS: ${p.validation_status} | CREATED: ${p.created_at}\n`;
            });
        }
    } else {
        res = "NO PROFILE FOUND FOR AMANDA";
    }
    fs.writeFileSync('posts_check.txt', res);
}

check();
