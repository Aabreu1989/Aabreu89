import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: metrics, error: metricsError } = await supabase
        .from('metricas_impacto_social')
        .select('*');
        
    console.log("metrica_impacto_social:");
    console.dir(metrics, { depth: null });
    
    const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
    console.log(`profiles count: ${usersCount}`);
}
main();
