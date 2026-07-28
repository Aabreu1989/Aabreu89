const { Client } = require('pg');
const fs = require('fs');
const path = require('fs');

async function audit() {
    const client = new Client({
        user: 'postgres.pnlzyshozpqlzuyjesdq',
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        database: 'postgres',
        password: 'Amandas96068212',
        port: 6543,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log("🛡️ AUDITORIA DE SEGURANÇA MIRA SOBERANA");
        
        const res = await client.query(`
            SELECT tablename, policyname, roles, cmd, qual 
            FROM pg_policies 
            WHERE schemaname = 'public';
        `);
        
        console.table(res.rows);
        
        // Also check if Admin role exists in any profile
        const admins = await client.query("SELECT id, email, role FROM profiles WHERE role = 'admin'");
        console.log("\n👑 ADMINS ENCONTRADOS NO BANCO:");
        console.table(admins.rows);
        
        await client.end();
    } catch (e) {
        console.error("❌ Erro na auditoria:", e.message);
    }
}

audit();
