
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findConsultor() {
    try {
        console.log('🔍 Searching job_posts for MIRA...');
        const { data: jobs } = await supabase.from('job_posts').select('id, title').ilike('title', '%MIRA%');
        console.log('Jobs Found:', JSON.stringify(jobs, null, 2));

        console.log('🔍 Searching posts for gibberish...');
        const { data: posts } = await supabase.from('posts').select('id, content');
        const toDelete = posts?.filter(p => /^[A-Z\s]{10,}$/.test(p.content) || p.content.includes('KNCXBV'));
        console.log('Posts to delete:', JSON.stringify(toDelete, null, 2));

    } catch (err) {
        console.error('❌ Find failed:', err.message);
    }
}

findConsultor();
