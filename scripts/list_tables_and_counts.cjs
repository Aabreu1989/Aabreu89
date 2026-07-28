const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
    console.log("Listing tables in public schema...");
    const { data, error } = await supabase.rpc('get_tables'); // If RPC exists
    if (error) {
        console.log("RPC failed, trying raw query via custom function if possible...");
        // Fallback: check if we can query some common tables
        const tables = ['courses', 'services', 'job_posts', 'posts', 'profiles', 'job_listings'];
        for (const table of tables) {
            const { count, error: err } = await supabase.from(table).select('*', { count: 'exact', head: true });
            if (!err) console.log(`✅ Table '${table}' exists and has ${count} rows.`);
            else console.log(`❌ Table '${table}' check failed: ${err.message}`);
        }
    } else {
        console.log("Tables:", data);
    }
}

listTables();
