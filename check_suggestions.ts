
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = 'c:/Users/AmandaAbreu/mira/.env.local';
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSuggestions() {
    console.log("🔍 MIRA SOBERANA: SCRUTINIZING SUGGESTIONS");
    const { data, error } = await supabase.from('app_suggestions').select('*').order('created_at', { ascending: false }).limit(10);
    if (error) {
        console.error(error);
    } else {
        data.forEach(s => {
            console.log(`--- [${s.created_at}] [${s.user_id}] ---`);
            console.log(s.content || s.text || s.description);
        });
    }
}
checkSuggestions();
