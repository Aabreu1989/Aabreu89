const { createClient } = require('@supabase/supabase-js');

// 👑 CONFIGURAÇÃO SOBERANA DE RESGATE
const LEGACY_URL = "https://ychwhxkxsxmuvabxlyjn.supabase.co";
const LEGACY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAzNzc5OCwiZXhwIjoyMDg3NjEzNzk4fQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";
const NEW_URL = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";

const oldSupa = createClient(LEGACY_URL, LEGACY_KEY);
const newSupa = createClient(NEW_URL, NEW_KEY);

async function rescueUsers() {
    console.log("🚀 [MIRA SOBERANA] Iniciando extração massiva de 2000+ utilizadores...");
    
    // 1. Ler da tabela auth.users (agora temos a Service Role!)
    // Nota: No Supabase, auth.users não é acessível via client comum mesmo com service role às vezes, 
    // mas a tabela public.profiles deve mostrar TUDO agora.
    const { data: allProfiles, error: fetchError } = await oldSupa.from('profiles').select('*');
    
    if (fetchError) {
        console.error("❌ Erro ao ler perfis antigos:", fetchError.message);
        return;
    }

    console.log(`💎 Encontrados ${allProfiles.length} perfis reais no Bastião Antigo.`);
    console.log("🚛 Iniciando migração nuclear...");
    
    let count = 0;
    for (const p of allProfiles) {
        const userData = {
            id: p.id,
            full_name: p.full_name || p.name || 'Membro Imperial',
            email: p.email,
            username: p.username,
            avatar_url: p.avatar_url,
            role: p.role || 'member',
            reputation: p.reputation || 0,
            points: p.points || 0,
            account_status: p.account_status || 'active',
            created_at: p.created_at
        };

        const { error: upsertError } = await newSupa.from('profiles').upsert(userData, { onConflict: 'id' });
        
        if (upsertError) {
            if (upsertError.message.includes('profiles_email_key')) {
                const { id, ...updateData } = userData;
                await newSupa.from('profiles').update(updateData).eq('email', p.email);
            } else {
                console.error(`⚠️ Falha no utilizador ${p.email}:`, upsertError.message);
            }
        } else {
            count++;
        }
    }

    // 2. Atualizar Estatísticas do Admin Hub
    console.log("📊 Atualizando métricas do Admin Hub...");
    const { count: totalUsers } = await newSupa.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalJobs } = await newSupa.from('job_posts').select('*', { count: 'exact', head: true });
    
    await newSupa.from('admin_dashboard_stats').upsert({
        id: 1,
        total_users: totalUsers,
        total_jobs: totalJobs,
        updated_at: new Date()
    });

    console.log(`✨ MISSÃO CUMPRIDA, AMANDA! ${count} utilizadores restaurados.`);
    console.log(`🏆 Total no Admin Hub: ${totalUsers} Utilizadores | ${totalJobs} Vagas.`);
}

rescueUsers();
