const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function backfillProfiles() {
    console.log('🚀 [MIRA REPAIR] Iniciando Resgate de Usuários Sequestrados...');
    
    // 1. Get all Auth Users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('❌ Erro no Auth:', authError.message);
        return;
    }
    
    console.log(`📊 Total no Auth: ${users.length} usuários.`);
    
    // 2. Get all Profile IDs
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id');
    if (pError) {
        console.error('❌ Erro no Profiles:', pError.message);
        return;
    }
    
    const existingIds = new Set(profiles.map(p => p.id));
    const missingUsers = users.filter(u => !existingIds.has(u.id));
    
    console.log(`⚠️ Detectados ${missingUsers.length} usuários sem perfil (invisíveis na Versão Online).`);
    
    if (missingUsers.length === 0) {
        console.log('✅ Tudo sincronizado! Nenhum usuário invisível encontrado.');
        return;
    }
    
    // 3. Insert missing profiles using Specialist role (Official MIRA default)
    let successCount = 0;
    for (const u of missingUsers) {
        // Manual logic for username and metadata since we are in JS
        const meta = u.user_metadata || {};
        const baseName = (meta.username || u.email?.split('@')[0] || 'membro');
        const safeUsername = (baseName + '_' + u.id.substring(0, 4)).toLowerCase();

        const { error } = await supabase.from('profiles').insert({
            id: u.id,
            email: u.email,
            username: safeUsername.toLowerCase(),
            full_name: meta.full_name || 'Novo Membro MIRA',
            reputation: 15, // Bonus de boas vindas manual
            trust_level: 'Novato',
            role: 'specialist',
            is_verified: false,
            created_at: u.created_at,
            updated_at: u.created_at,
            badges: ['pioneiro'],
            points: 1000,
            account_status: 'active',
            email_confirmed: u.email_confirmed_at ? true : false
        });
        
        if (error) {
            console.error(`❌ Falha para ${u.email}:`, error.message);
        } else {
            console.log(`✅ Resgatado: ${u.email} -> @${safeUsername}`);
            successCount++;
        }
    }
    
    console.log(`\n🎉 RESGATE CONCLUÍDO: ${successCount} novos usuários agora estão visíveis Online!`);
}

backfillProfiles();
