import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const urlMatch = envText.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');
const supabase = createClient(url, key);

async function run() {
  const { data, error, count } = await supabase.from('job_posts').select('*', { count: 'exact' }).limit(5);
  console.log('Error:', error);
  console.log('Count:', count);
  console.log('Data:', data);
}

run();
