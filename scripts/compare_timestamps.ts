import { createClient } from '@supabase/supabase-js';

const PNLZ_URL = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const PNLZ_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";

const YCHW_URL = "https://ychwhxkxsxmuvabxlyjn.supabase.co";
const YCHW_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzc3OTgsImV4cCI6MjA4NzYxMzc5OH0.o3-cCO24KjNrW8NM7HFOycdpxX8D0q4vHeXS0BqFMGc";

async function compareTimestamps() {
    const s1 = createClient(PNLZ_URL, PNLZ_KEY);
    const s2 = createClient(YCHW_URL, YCHW_ANON);

    console.log("Checking PNLZ...");
    const { data: d1 } = await s1.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1);
    console.log("PNLZ Latest User:", d1?.[0]?.created_at);

    console.log("Checking YCHW...");
    const { data: d2 } = await s2.from('profiles').select('created_at').order('created_at', { ascending: false }).limit(1);
    console.log("YCHW Latest User:", d2?.[0]?.created_at);
}

compareTimestamps();
