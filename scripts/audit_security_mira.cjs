const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSecurityLeaks() {
    console.log("🛡️ AUDITORIA DE SEGURANÇA (PROTOCOLO AMANDA) 🛡️");
    
    // 1. Verificar se Perfis estão vazando via ANON KEY
    const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (pError) {
        console.log("✅ PERFIS BLINDADOS: RLS está a bloquear acesso público.");
    } else if (profiles && profiles.length > 0) {
        console.log("🚨 VULNERABILIDADE DETECTADA: Perfis visíveis publicamente via ANON KEY!");
        console.log("Campo sensível (Email):", profiles[0].email ? "Exposto!" : "Oculto");
    } else {
        console.log("ℹ️ Nenhum dado de perfil retornado (pode estar vazio ou RLS ativo).");
    }

    // 2. Verificar se AI_KNOWLEDGE (Saber Imperial) está acessível
    const { data: knowledge, error: kError } = await supabase
        .from('ai_knowledge')
        .select('*')
        .limit(1);
    
    if (kError) {
        console.log("❌ ERRO: IA Knowledge bloqueada para o público (Deveria estar aberta!).");
    } else {
        console.log("✅ IA KNOWLEDGE ACESSÍVEL: Público pode ler o Saber Mestre.");
    }
}

checkSecurityLeaks();
