import { createClient } from '@supabase/supabase-js';
import { PROTECTED_JOBS } from '../src/utils/massiveJobsDatabase';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
const supabase = createClient(url, key);

async function syncJobs() {
    console.log(`🚀 Starting massive sync of ${PROTECTED_JOBS.length} jobs...`);
    
    const BATCH_SIZE = 100;
    let totalUpdated = 0;
    
    for (let i = 0; i < PROTECTED_JOBS.length; i += BATCH_SIZE) {
        const batch = PROTECTED_JOBS.slice(i, i + BATCH_SIZE);
        
        // We use upsert on ID since we confirmed at least some IDs match.
        // For those that don't match, it will create a new entry (which is fine if the old one was different).
        // To avoid duplicates if IDs differ, we could match by title+location, 
        // but upsert is safer for now given the confirmed match.
        
        const { error } = await supabase.from('job_posts').upsert(batch.map(j => ({
            id: j.id,
            title: j.title,
            location: j.location,
            source_name: j.source_name,
            source_url: j.source_url,
            category: j.category,
            work_topic: j.work_topic,
            posted_at: j.posted_at
        })), { onConflict: 'id' });
        
        if (error) {
            console.error(`❌ Error in batch ${i}:`, error.message);
        } else {
            totalUpdated += batch.length;
            if (totalUpdated % 500 === 0) console.log(`  Processed ${totalUpdated} jobs...`);
        }
    }
    
    console.log(`✅ Finished! Synchronized ${totalUpdated} jobs in pnlz.`);
}

syncJobs();
