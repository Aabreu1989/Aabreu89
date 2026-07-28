const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const data = fs.readFileSync(path.resolve(__dirname, '../src/utils/protectedData.ts'), 'utf8');
    
    // Simple regex to extract IDs and Titles from the array
    const idRegex = /id:\s*'([^']+)'/g;
    const titleRegex = /title:\s*"([^"]+)"/g;
    
    const ids = [];
    let match;
    while ((match = idRegex.exec(data)) !== null) {
        ids.push(match[1]);
    }
    
    const titles = [];
    while ((match = titleRegex.exec(data)) !== null) {
        titles.push(match[1]);
    }
    
    const services = ids.slice(0, 159).map((id, index) => ({
        id: id,
        name: titles[index] || 'Serviço Oficial MIRA',
        description: 'Serviço público oficial mapeado pela rede MIRA.',
        created_at: new Date().toISOString()
    }));

    console.log(`Upserting ${services.length} services...`);
    const { error } = await supabase.from('services').upsert(services, { onConflict: 'id' });
    
    if (error) {
        console.error("Error:", error);
    } else {
        const { count } = await supabase.from('services').select('*', { count: 'exact', head: true });
        console.log(`Done! Total DB services: ${count}`);
    }
}

run();
