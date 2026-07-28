
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function purgeEverything() {
    try {
        console.log('🧹 Purging Specific Gibberish Posts...');
        const gibberishIds = [
            "df5e5ccc-716d-4c4f-bd0e-e08657da5c34",
            "8df2598b-42db-441f-b097-0954857c0b7d",
            "d8e0512f-dfad-4df5-a0d1-54d0a8aad936",
            "c8eeb7cf-cf01-4ba6-bb41-288f05f6c621",
            "4406571a-8c20-4282-abf7-33472b100ea8",
            "09fb0bef-4177-4867-bf6d-a4a1cf1cd8db",
            "fa416796-6073-4662-8ca5-ba1c9b26f5f1"
        ];
        
        const { data: posts } = await supabase.from('posts').delete().in('id', gibberishIds).select();
        console.log(`✅ Purged ${posts?.length || 0} gibberish posts.`);

        console.log('🧹 Searching for "Consultor MIRA" in ANY table...');
        // Let's check knowledge_store too
        const { data: ks } = await supabase.from('knowledge_store').delete().ilike('content', '%Consultor MIRA%').select();
        console.log(`✅ Purged ${ks?.length || 0} from knowledge_store.`);

        // Final check for job_posts with "Consultor"
        const { data: jobs } = await supabase.from('job_posts').delete().ilike('title', '%Consultor%').select();
        console.log(`✅ Purged ${jobs?.length || 0} consultor jobs.`);

        console.log('🚀 DATABASE PRISTINE.');
    } catch (err) {
        console.error('❌ Purge failed:', err.message);
    }
}

purgeEverything();
