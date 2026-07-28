
import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const projectRef = "ychwhxkxsxmuvabxlyjn";
const passwords = ["mira-admin-2024", "Britney"];
const sqlPath = './V15000_SOBERANIA_TOTAL_STABILIZATION.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

async function apply() {
    console.log("🚀 MIRA Soberana: Iniciando Marretada V15000 (V2)...");
    
    let lastError = null;
    for (const password of passwords) {
        // Tentamos o formato direto db.[ref].supabase.co
        const connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
        const client = new pg.Client({ connectionString });

        try {
            console.log(`📡 Tentando conexão com password: ${password === 'Britney' ? '****' : password}...`);
            await client.connect();
            console.log("✅ Conectado! Executando SQL...");
            
            await client.query(sql);
            console.log("💎 V15000 APLICADA COM SUCESSO!");
            
            await client.end();
            return;
        } catch (err) {
            console.error(`❌ Falha com password ${password === 'Britney' ? '****' : password}:`, err.message);
            lastError = err.message;
            try { await client.end(); } catch (e) {}
        }
    }

    console.error("💀 FALHA TOTAL: Não foi possível aplicar a V15000.", lastError);
    process.exit(1);
}

apply();
