
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFunctionalities() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase credentials in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("🔍 [TEST] Testing Community Feed...");
    const { data: feed, error: feedError } = await supabase.rpc('get_sovereign_community_feed_v25', { p_limit: 5 });
    if (feedError) {
        console.error(`🚨 [TEST] Community Feed error: ${feedError.message}`);
    } else {
        console.log(`✅ [TEST] Community Feed returned ${feed.length} posts.`);
        if (feed.length > 0) {
            console.log(`📝 [TEST] Top post: ${feed[0].title}`);
        }
    }

    console.log("🔍 [TEST] Testing Job Board...");
    const { data: jobs, error: jobsError } = await supabase.from('job_posts').select('id, title').limit(5);
    if (jobsError) {
        console.error(`🚨 [TEST] Job Board error: ${jobsError.message}`);
    } else {
        console.log(`✅ [TEST] Job Board returned ${jobs.length} jobs.`);
    }

    console.log("🔍 [TEST] Testing Admin Metrics...");
    const { data: metrics, error: metricsError } = await supabase.rpc('get_admin_metrics_v2026');
    if (metricsError) {
        console.error(`🚨 [TEST] Metrics error: ${metricsError.message}`);
    } else {
        console.log("✅ [TEST] Admin Metrics fetched successfully.");
        console.log(`📊 [TEST] Stats: Users(${metrics.users}), Jobs(${metrics.jobs}), Courses(${metrics.courses})`);
    }

    console.log("🏁 [TEST] Functionality check completed.");
    process.exit(0);
}

testFunctionalities();
