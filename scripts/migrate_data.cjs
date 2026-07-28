const { Client } = require('pg');

const OLD_DB = "postgresql://postgres:Britney123%25@db.ychwhxkxsxmuvabxlyjn.supabase.co:5432/postgres";
const NEW_DB = "postgresql://postgres:Britney123%25@db.pnlzyshozpqlzuyjesdq.supabase.co:5432/postgres";

async function migrate() {
    console.log("🚛 [MIRA] Iniciando Camião de Mudanças Soberano...");
    
    const oldClient = new Client({ connectionString: OLD_DB });
    const newClient = new Client({ connectionString: NEW_DB });

    try {
        await oldClient.connect();
        await newClient.connect();
        console.log("✅ Ligação estabelecida com ambos os Bastiões.");

        // 1. Resgatar Usuários (Profiles)
        console.log("👥 Resgatando perfis dos usuários...");
        const profiles = await oldClient.query("SELECT * FROM public.profiles");
        console.log(`📊 Encontrados ${profiles.rows.length} perfis.`);

        for (const row of profiles.rows) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            await newClient.query(
                `INSERT INTO public.profiles (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
                values
            ).catch(err => console.log(`⚠️ Erro ao inserir perfil ${row.email}: ${err.message}`));
        }

        // 2. Resgatar Saber IA (Posts)
        console.log("📚 Resgatando lista Saber IA (Posts)...");
        const posts = await oldClient.query("SELECT * FROM public.posts");
        console.log(`📊 Encontrados ${posts.rows.length} posts.`);

        for (const row of posts.rows) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            await newClient.query(
                `INSERT INTO public.posts (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
                values
            ).catch(err => console.log(`⚠️ Erro ao inserir post ${row.title}: ${err.message}`));
        }

        console.log("🎉 MUDANÇA CONCLUÍDA! Os teus usuários e o Saber IA já estão em casa.");

    } catch (err) {
        console.error("❌ Erro fatal na migração:", err.message);
        if (err.message.includes("password authentication failed")) {
            console.log("⚠️ A senha 'Britney123%' não funcionou no banco de dados. Amanda, se mudaste a password da base de dados, preciso que mas digas.");
        }
    } finally {
        await oldClient.end();
        await newClient.end();
    }
}

migrate();
