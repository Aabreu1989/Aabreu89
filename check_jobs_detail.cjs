const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pnlzyshozpqlzuyjesdq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('job_posts')
    .select('id, title, created_at, posted_at, date_posted, source_name')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
check();
