import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ychwhxkxsxmuvabxlyjn.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function liberateSpecialists() {
    console.log('🚀 [MIRA SOBERANIA] Libertando Especialistas Sequestrados (Fix Role Specialist)...');
    
    try {
        // 1. Fetch all profiles
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,username,role`, {
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        });

        if (!response.ok) throw new Error(await response.text());
        const profiles = await response.json();
        console.log(`📊 Analisando ${profiles.length} perfis...`);

        for (const p of profiles) {
            let shouldPromote = false;
            const email = (p.email || '').toLowerCase();
            const username = (p.username || '').toLowerCase();

            // Lógica do Pente Fino V311 (SQL MASTER)
            if (
                email.includes('adv') || 
                email.includes('specialist') || 
                email.includes('legal') || 
                email.includes('jurid') ||
                email.includes('law') ||
                username.includes('dr') ||
                username.includes('adv') ||
                p.role === 'expert' // Fix: converter experts anteriores para specialist
            ) {
                if (email !== 'amandasabreu89@gmail.com') { // Respeitar a CEO
                    shouldPromote = true;
                }
            }

            if (shouldPromote) {
                process.stdout.write(`⚖️ Libertando Especialista: ${p.email || p.username}... `);
                
                const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${p.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        role: 'specialist',
                        points: 1500, // Bonus de resgate
                        is_verified: true,
                        trust_level: 'Elite Jurídica'
                    })
                });

                if (updateRes.ok) {
                    console.log('✅ LIBERTADO');
                } else {
                    console.log(`❌ FALHOU: ${await updateRes.text()}`);
                }
            }
        }

        // 2. Fix Followers Sync (Fix 42703) manually via node aggregation
        console.log('🔄 Sincronizando Seguidores (followed_id Fix)...');
        const followersRes = await fetch(`${SUPABASE_URL}/rest/v1/community_followers?select=followed_id,follower_id`, {
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
            }
        });
        const followers = await followersRes.json();
        
        const followerCounts = {};
        const followingCounts = {};

        followers.forEach(f => {
            followerCounts[f.followed_id] = (followerCounts[f.followed_id] || 0) + 1;
            followingCounts[f.follower_id] = (followingCounts[f.follower_id] || 0) + 1;
        });

        for (const p of profiles) {
            const fCount = followerCounts[p.id] || 0;
            const fgCount = followingCounts[p.id] || 0;

            await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${p.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    followers_count: fCount,
                    following_count: fgCount
                })
            });
        }
        console.log('✅ Sincronização concluída.');

    } catch (e) {
        console.error(`🚨 ERRO CRÍTICO: ${e.message}`);
    }
}

liberateSpecialists();
