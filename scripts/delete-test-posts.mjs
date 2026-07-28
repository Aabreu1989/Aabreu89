
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteTestPosts() {
    try {
        console.log('🧹 Purging test records for MIRA Sovereignty...');
        
        // 1. Delete "Consultor MIRA" and explicit "teste" jobs
        const { data: jobs, error: jobErr } = await supabase
            .from('job_posts')
            .delete()
            .or('title.ilike.%teste%,title.ilike.%consultor mira%')
            .select();
            
        if (jobErr) throw jobErr;
        console.log(`✅ Deleted ${jobs?.length || 0} test jobs.`);

        // 2. Delete "teste" posts from community
        const { data: posts, error: postErr } = await supabase
            .from('posts')
            .delete()
            .or('title.ilike.%teste%,content.ilike.%teste%')
            .select();

        if (postErr) throw postErr;
        console.log(`✅ Deleted ${posts?.length || 0} test posts.`);
        
        console.log('🚀 CLEANUP COMPLETE: MIRA READY FOR LAUNCH.');
    } catch (err) {
        console.error('❌ Cleanup failed:', err.message);
    }
}

deleteTestPosts();
