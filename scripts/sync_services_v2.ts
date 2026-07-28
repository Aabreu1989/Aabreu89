import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PROTECTED_SERVICES } from '../src/utils/protectedData';

dotenv.config({ path: '.env.local' });

const URL = process.env.VITE_SUPABASE_URL || '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(URL, KEY);

async function syncServices() {
    console.log(`🛠️ Syncing ${PROTECTED_SERVICES.length} services from code to DB...`);
    
    const formatted = PROTECTED_SERVICES.map(s => ({
        name: s.title || s.name,
        description: `${s.description || 'Apoio ao Migrante'}\n📍 Endereço: ${s.address || 'Consultar MIRA'}\n🌐 Site: ${s.website || 'N/A'}\n🏙️ Cidade: ${s.city || 'Portugal'}`,
        created_at: new Date().toISOString()
    }));

    // Clean and Insert
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error } = await supabase.from('services').insert(formatted);

    if (error) console.error("❌ Error:", error.message);
    else console.log("✅ Services synced successfully.");
}

syncServices();
