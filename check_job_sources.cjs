const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('execute_sql_mira', { sql: 'SELECT source_name, COUNT(*) FROM job_posts GROUP BY source_name;' });
  // Wait, I don't know if execute_sql_mira exists.
  // I'll just use the client.
  const { data: counts, error: err } = await supabase.from('job_posts').select('source_name');
  if (err) {
    console.error(err);
  } else {
    const stats = {};
    counts.forEach(c => {
      stats[c.source_name] = (stats[c.source_name] || 0) + 1;
    });
    console.log(stats);
  }
}
check();
