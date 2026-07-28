const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pnlzyshozpqlzuyjesdq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase.from('services').select('category');
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  const cats = new Set(data.map(item => item.category));
  console.log('Unique categories in database:', Array.from(cats));
}

run().catch(console.error);
