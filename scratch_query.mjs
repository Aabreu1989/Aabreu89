import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabaseUrl or supabaseKey in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('metricas_impacto_social').select('*');
  if (error) {
    console.error("Error fetching metrics:", error);
  } else {
    console.log("Metricas impacto social:");
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
