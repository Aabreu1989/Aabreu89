
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
    console.log("🧹 MIRA CLEANUP: Exposing test data to the sovereign vacuum...");
    
    // 1. Jobs
    const { data: jobs, error: jErr } = await supabase.from('job_posts').delete().or('title.ilike.%Consultor%,title.ilike.%MIRA (TEST)%');
    console.log("Jobs Deleted:", jobs?.length || 0, jErr || "Success");
    
    // 2. Community Posts
    const { data: posts, error: pErr } = await supabase.from('posts').delete().or('content.ilike.%TEST%,content.ilike.%teste%');
    console.log("Posts Deleted:", posts?.length || 0, pErr || "Success");
    
    process.exit(0);
}

cleanup();
