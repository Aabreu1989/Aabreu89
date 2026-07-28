import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function purge() {
    console.log("🔥 [PURGE] Iniciando limpeza de dados de teste e auditoria...");

    // 1. Delete TEST posts
    const { data: posts, error: postErr } = await supabase
        .from('posts')
        .delete()
        .or('title.ilike.%TESTE%,content.ilike.%TESTE%,title.ilike.%Audit%,content.ilike.%Audit%,title.ilike.%sincronizacao%,content.ilike.%sincronizacao%');
    
    if (postErr) console.error("❌ Erro ao apagar posts:", postErr);
    else console.log("✅ Posts de teste eliminados.");

    // 2. Delete TEST knowledge base entries
    const { data: kb, error: kbErr } = await supabase
        .from('knowledge_base')
        .delete()
        .or('content.ilike.%TESTE%,content.ilike.%Audit%');

    if (kbErr) console.error("❌ Erro ao apagar KB:", kbErr);
    else console.log("✅ Entradas de KB de teste eliminadas.");

    // 3. Delete TEST reports
    const { data: reports, error: reportErr } = await supabase
        .from('community_reports')
        .delete()
        .or('reason.ilike.%TESTE%,reason.ilike.%Audit%,reason.ilike.%sincronizacao%');
    
    if (reportErr) console.error("❌ Erro ao apagar denúncias de teste:", reportErr);
    else console.log("✅ Denúncias de teste eliminadas.");

    console.log("🏁 Limpeza concluída.");
}

purge();
