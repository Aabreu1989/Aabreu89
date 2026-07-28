import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
const supabase = createClient(url, key);

async function createTable() {
    console.log("Attempting to create job_sites table via RPC...");
    const { error } = await supabase.rpc('exec_sql', {
        sql: `
            CREATE TABLE IF NOT EXISTS public.job_sites (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                category TEXT,
                trust_level INTEGER DEFAULT 5,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            ALTER TABLE public.job_sites ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Job sites are public" ON public.job_sites FOR SELECT USING (true);
        `
    });
    
    if (error) {
        console.error("RPC Error:", error.message);
        console.log("Likely exec_sql RPC is missing. Trying alternative...");
    } else {
        console.log("✅ Table job_sites created successfully!");
    }
}

createTable();
