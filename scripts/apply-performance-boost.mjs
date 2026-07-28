import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
-- 🚀 MIRA PERFORMANCE BOOST V11000
-- Optimized indexes for Jobs and Services

CREATE INDEX IF NOT EXISTS idx_map_alerts_title ON public.map_alerts(title);
CREATE INDEX IF NOT EXISTS idx_map_alerts_category ON public.map_alerts(category);
CREATE INDEX IF NOT EXISTS idx_job_posts_title ON public.job_posts(title);
CREATE INDEX IF NOT EXISTS idx_job_posts_work_topic ON public.job_posts(work_topic);
CREATE INDEX IF NOT EXISTS idx_job_posts_created_at ON public.job_posts(created_at DESC);
`;

async function run() {
    console.log("Applying MIRA Performance Boost SQL...");
    try {
        const { error } = await supabase.rpc('admin_execute_sql', { sql_query: sql });
        if (error) {
            console.error("❌ RPC Failed:", error.message);
        } else {
            console.log("✅ Performance Boost Applied Successfully!");
        }
    } catch (e) {
        console.error("❌ Execution error:", e);
    }
}

run();
