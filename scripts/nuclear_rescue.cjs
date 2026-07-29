const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

async function rescueWithDB() {
    const projectRef = "ychwhxkxsxmuvabxlyjn";
    const passwords = ["mira-admin-2024", "Britney"];
    const NEW_URL = "https://pnlzyshozpqlzuyjesdq.supabase.co";
    const NEW_KEY = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
    
    const newSupa = createClient(NEW_URL, NEW_KEY);
    let legacyProfiles = [];

    for (const password of passwords) {
        const connectionString = `postgres://postgres.${projectRef}:${password}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;
        const client = new Client({ connectionString });
        
        try {
            console.log(`🔌 Tentando conexão com senha: ${password === 'Britney' ? '****' : password}`);
            await client.connect();
            console.log("✅ Conectado ao banco legado!");
            
            const res = await client.query('SELECT * FROM public.profiles');
            legacyProfiles = res.rows;
            await client.end();
            break; 
        } catch (err) {
            console.error(`❌ Falha com senha ${password}:`, err.message);
            if (client) await client.end();
        }
    }

    if (legacyProfiles.length === 0) {
        console.error("💀 Nenhum perfil extraído.");
        return;
    }

    console.log(`💎 Extraídos ${legacyProfiles.length} perfis. Iniciando migração para o Bastião Novo...`);
    
    let count = 0;
    for (const p of legacyProfiles) {
        const userData = {
            id: p.id,
            full_name: p.full_name || p.name || 'Membro Imperial',
            email: p.email,
            username: p.username,
            avatar_url: p.avatar_url,
            role: p.role || 'member',
            reputation: p.reputation || 0,
            points: p.points || 0,
            account_status: p.account_status || 'active'
        };

        const { error } = await newSupa.from('profiles').upsert(userData, { onConflict: 'id' });
        if (!error) count++;
        else console.error(`⚠️ Erro no utilizador ${p.email}:`, error.message);
    }

    console.log(`✨ MISSÃO CUMPRIDA! ${count} utilizadores resgatados com sucesso.`);
}

rescueWithDB();
