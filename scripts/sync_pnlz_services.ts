import { createClient } from '@supabase/supabase-js';
import { MASSIVE_SERVICES_DATABASE } from '../src/utils/massiveServicesDatabase';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function syncServices() {
    console.log(`🚀 Starting sync of ${MASSIVE_SERVICES_DATABASE.length} services...`);
    
    // Mapping local format to DB format
    const servicesToUpsert = MASSIVE_SERVICES_DATABASE.map(s => ({
        // We use a mapping or title-based matching if IDs differ
        // For AIMA, IDs are like 'p-aima-albufeira'. In DB they are UUIDs.
        // We will match by NAME.
        name: s.title,
        category: s.category,
        address: s.address,
        website: s.website,
        // We keep the existing description but enriched if possible
    }));

    // Actually, I'll fetch existing services first to get their IDs
    const { data: existing } = await supabase.from('services').select('id, name');
    
    let updated = 0;
    for (const localSrv of MASSIVE_SERVICES_DATABASE) {
        const dbMatch = existing?.find(e => e.name === localSrv.title);
        if (dbMatch) {
            const { error } = await supabase.from('services').update({
                category: localSrv.category,
                address: localSrv.address,
                website: localSrv.website
            }).eq('id', dbMatch.id);
            
            if (!error) updated++;
        }
    }
    
    console.log(`✅ Finished! Updated ${updated} services in pnlz.`);
}

syncServices();
