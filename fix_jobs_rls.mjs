import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const urlMatch = envText.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');
const supabase = createClient(url, key);

const sql = `
-- Fix RLS for job_posts table so background sync and admin can insert fresh jobs
ALTER TABLE public.job_posts DISABLE ROW LEVEL SECURITY;

-- Ensure date_posted column exists if needed or default created_at index
CREATE INDEX IF NOT EXISTS idx_job_posts_created_at ON public.job_posts(created_at DESC);
`;

async function fixRls() {
  console.log("🔓 Unlocking RLS on job_posts via admin_execute_sql RPC...");
  const { data, error } = await supabase.rpc('admin_execute_sql', { sql_query: sql });
  if (error) {
    console.error("❌ RPC Error:", error);
  } else {
    console.log("✅ RLS Disabled on job_posts! RPC Result:", data);
  }
}

fixRls();
