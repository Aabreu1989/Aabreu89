const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const projectRef = "pnlzyshozpqlzuyjesdq";
const password = "Britney123%"; 
const host = "db.pnlzyshozpqlzuyjesdq.supabase.co";

const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`;

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log("🔍 Inspecionando POLÍTICAS de PROFILES...");
        
        const res = await client.query(`
            SELECT policyname, definition 
            FROM pg_policies 
            WHERE tablename = 'job_posts';
        `);
        
        res.rows.forEach(r => {
            console.log(`📌 Policy: ${r.policyname}`);
            console.log(`   Def: ${r.definition}`);
        });

    } catch (e) {
        console.error("❌ Erro:", e.message);
    } finally {
        await client.end();
    }
}

run();
