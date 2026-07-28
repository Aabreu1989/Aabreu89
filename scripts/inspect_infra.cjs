const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const projectRef = "pnlzyshozpqlzuyjesdq";
const password = "Britney123%"; 
const hosts = ["aws-0-eu-west-3.pooler.supabase.com", "db.pnlzyshozpqlzuyjesdq.supabase.co"];

async function run() {
    let connected = false;
    let client;

    for (const host of hosts) {
        if (connected) break;
        console.log(`🔌 Tentando ligar a ${host}...`);
        const port = host.includes("pooler") ? 6543 : 5432;
        const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:${port}/postgres`;
        client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
        
        try {
            await client.connect();
            connected = true;
            console.log("✅ Conectado!");
        } catch (e) {
            console.warn(`⚠️ Falha em ${host}: ${e.message}`);
        }
    }

    if (!connected) {
        console.error("❌ Não foi possível conectar a nenhum host.");
        process.exit(1);
    }

    try {
        console.log("🔍 Inspecionando Infraestrutura MIRA...");
        
        // Listar tabelas
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        const tables = tablesRes.rows.map(r => r.table_name);
        console.log(`📋 Tabelas encontradas (${tables.length}):`, tables.join(', '));

        for (const table of tables) {
            const colsRes = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND table_schema = 'public';
            `, [table]);
            console.log(`   🔹 ${table}: ${colsRes.rows.map(c => c.column_name).join(', ')}`);
        }

    } catch (e) {
        console.error("❌ Erro na inspeção:", e.message);
    } finally {
        await client.end();
    }
}

run();
