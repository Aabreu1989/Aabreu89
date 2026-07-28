const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sqlPath = process.argv[2];
    if (!sqlPath) {
        console.error("❌ Indique o caminho do ficheiro SQL.");
        return;
    }

    console.log(`🚀 Executando SQL de: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase JS doesn't have a direct 'sql' method for raw queries like this.
    // However, I can use the internal 'postgrest' client to hit an RPC if it exists.
    // BUT since I want to run a migration, I should really use a direct PG connection if possible.
    
    // Given the environment, I'll try to use 'postgres' library if available.
    // Or I'll use the 'supabase' client to run it via an RPC 'exec_sql' if it exists.
    
    // Let's check if 'postgres' is in package.json
    try {
        const { Client } = require('pg');
        const client = new Client({
            user: 'postgres.pnlzyshozpqlzuyjesdq',
            host: 'aws-0-eu-central-1.pooler.supabase.com',
            database: 'postgres',
            password: 'Amandas96068212',
            port: 6543,
            ssl: { rejectUnauthorized: false }
        });
        await client.connect();
        const res = await client.query(sql);
        await client.end();
        console.table(res.rows);
        console.log("✅ SQL executado com sucesso!");
        process.exit(0);
    } catch (e) {
        console.error("❌ Falha ao usar 'pg' lib:", e.message);
        process.exit(1);
    }
}

run();
