
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findTests() {
    try {
        console.log('🔍 Listing last 5 posts...');
        const { data: posts } = await supabase.from('posts').select('id, title, content').order('created_at', { ascending: false }).limit(5);
        console.log('Posts:', JSON.stringify(posts, null, 2));
        
        console.log('🔍 Listing last 5 job_posts...');
        const { data: jobs } = await supabase.from('job_posts').select('id, title').order('created_at', { ascending: false }).limit(5);
        console.log('Jobs:', JSON.stringify(jobs, null, 2));

    } catch (err) {
        console.error('❌ Find failed:', err.message);
    }
}

findTests();
