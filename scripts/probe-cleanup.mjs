
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
    try {
        console.log('🔍 Probing MIRA Sovereignty Tables...');
        
        const { data: pData, error: pErr } = await supabase.from('posts').select('id').limit(1);
        console.log('posts:', pErr ? `❌ ${pErr.message}` : '✅ OK');
        
        const { data: jData, error: jErr } = await supabase.from('job_posts').select('id').limit(1);
        console.log('job_posts:', jErr ? `❌ ${jErr.message}` : '✅ OK');

        const { data: kData, error: kErr } = await supabase.from('knowledge_store').select('id').limit(1);
        console.log('knowledge_store:', kErr ? `❌ ${kErr.message}` : '✅ OK');
        
        if (!pErr) {
            const { data: delPosts, error: delErr } = await supabase
                .from('posts')
                .delete()
                .or('title.ilike.%teste%,content.ilike.%teste%')
                .select();
            console.log(`🧹 Deleted ${delPosts?.length || 0} test posts.`);
        }
        
        if (!jErr) {
            const { data: delJobs, error: delErr2 } = await supabase
                .from('job_posts')
                .delete()
                .or('title.ilike.%teste%,title.ilike.%consultor mira%')
                .select();
            console.log(`🧹 Deleted ${delJobs?.length || 0} test jobs.`);
        }
        
        console.log('🚀 CLEANUP OPERATION STANDBY.');
    } catch (err) {
        console.error('❌ Probe failed:', err.message);
    }
}

testConnection();
