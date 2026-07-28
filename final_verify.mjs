import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
    console.log("🔍 [MIRA VERIFY] Iniciando verificação final com Service Role...");

    try {
        // 1. Verificar Usuários (Profiles)
        console.log("\n👥 Verificando Profiles (full_name)...");
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, username, email')
            .limit(5);
        
        if (userError) throw userError;
        console.log(`✅ Amostra de usuários:`);
        users.forEach(u => console.log(` - ID: ${u.id}, FullName: ${u.full_name}, User: ${u.username}`));

        // 2. Verificar Saber IA (ai_knowledge)
        console.log("\n🧠 Verificando ai_knowledge...");
        const { data: knowledge, error: kError } = await supabase
            .from('ai_knowledge')
            .select('id, topic, category')
            .limit(5);
        
        if (kError) throw kError;
        console.log(`✅ Amostra de conhecimento:`);
        knowledge.forEach(k => console.log(` - Topic: ${k.topic}, Cat: ${k.category}`));

    } catch (e) {
        console.error("🚨 [MIRA VERIFY ERROR]:", e);
    }
}

verify();
