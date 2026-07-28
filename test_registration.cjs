
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRegistration() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Missing Supabase credentials in .env.local");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const testEmail = `mira.test.user.${Math.floor(Math.random() * 100000)}@gmail.com`;
    const testPassword = 'Password123!';
    const testName = 'Test User MIRA 2026';

    console.log(`📡 [TEST] Attempting registration for: ${testEmail}`);

    try {
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                data: { name: testName, language: 'PT', role: 'member' }
            }
        });

        if (error) {
            console.error(`🚨 [TEST] Registration failed: ${error.message}`);
            process.exit(1);
        }

        console.log(`✅ [TEST] Registration request successful! User ID: ${data.user?.id}`);

        if (data.session) {
            console.log("✅ [TEST] Session received.");
        } else {
            console.log("ℹ️ [TEST] No session received. Email confirmation required.");
        }

        console.log("⏳ [TEST] Waiting for profile trigger (3 seconds)...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        const { data: metrics } = await supabase.rpc('get_admin_metrics_v2026');
        if (metrics) {
            console.log(`📊 [TEST] Total users in DB: ${metrics.users}`);
        }
    } catch (e) {
        console.error("🚨 [TEST] Unexpected error:", e);
        process.exit(1);
    }

    console.log("🏁 [TEST] Registration flow check completed.");
    process.exit(0);
}

testRegistration();
