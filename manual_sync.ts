
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { PROTECTED_SERVICES } from './src/utils/protectedData';

const envPath = 'c:/Users/AmandaAbreu/mira/.env.local';
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabaseUrl = envConfig.VITE_SUPABASE_URL || envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
    console.log(`🚀 MIRA SOBERANA: MANUAL SYNC OF ${PROTECTED_SERVICES.length} SERVICES`);
    const services = PROTECTED_SERVICES.map(s => ({ 
        id: s.id, 
        title: s.title, 
        category: s.category, 
        lat: s.lat, 
        lng: s.lng, 
        address: s.address,
        city: s.city,
        phone: s.phone,
        email: s.email,
        website: s.website,
        created_at: new Date().toISOString() 
    }));
    const { error } = await supabase.from('map_alerts').upsert(services, { onConflict: 'id' });
    if (error) {
        console.error("❌ Sync failed:", error.message);
    } else {
        console.log("✅ Sync complete!");
    }
}
sync();
