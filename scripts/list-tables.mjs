
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
    try {
        const { data: cols, error: colErr } = await supabase.from('services').select('*').limit(1);
        if (cols && cols.length > 0) {
            console.log('Services columns:', Object.keys(cols[0]));
        } else {
            console.log('Services table is empty or could not fetch columns.');
            const { data: empty } = await supabase.from('services').select('*').limit(0);
            console.log('Services headers (limit 0):', empty);
        }
    } catch (e) {
        console.error(e.message);
    }
}
listTables();
