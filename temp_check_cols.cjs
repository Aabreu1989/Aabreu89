const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCols() {
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    console.log('Columns in posts:', Object.keys(data[0]));
}

checkCols();
