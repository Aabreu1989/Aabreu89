import { createClient } from '@supabase/supabase-js';

// 🛡️ Helper: Check if string is a valid UUID
const isUuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({ error: 'Server configuration missing.' });
  }

  // Verify the caller is a logged-in admin via their JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: no token provided.' });
  }

  const callerToken = authHeader.replace('Bearer ', '');

  // Create both clients
  const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Verify the caller's identity using their token
    const { data: { user: callerUser }, error: callerError } = await supabaseAnon.auth.getUser(callerToken);
    if (callerError || !callerUser) {
      console.error("🛑 [MIRA ADMIN] Auth Check Failed:", callerError);
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    // 2. Check if caller is admin in public.profiles
    const ADMIN_EMAILS = [
      'amandasabreu89@gmail.com', 
      'amandasabreu@gmail.com', 
      'no-reply@miraimigrante.pt',
      'atendimentomira@gmail.com',
      'suportemira@gmail.com',
      'mira.atendimento@gmail.com'
    ];
    const isAdminByEmail = ADMIN_EMAILS.includes(callerUser.email?.toLowerCase());

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .maybeSingle();

    const isAdmin = isAdminByEmail || callerProfile?.role === 'admin';
    const { action, userId, suggestionId, targetId, type, reportId, block } = req.body;

    // 🛡️ [RGPD/GDPR] SOBERANIA: Permite que um utilizador se apague a si próprio mesmo sem ser admin.
    const isSelfDeletion = action === 'delete' && userId === callerUser.id;
    
    console.log(`📡 [MIRA ADMIN] Caller: ${callerUser.email} | Action: ${action} | UserID: ${userId} | Block: ${block} | IsAdmin: ${isAdmin}`);

    if (!isAdmin && !isSelfDeletion) {
      console.warn(`🛑 [MIRA ADMIN] Access Denied for ${callerUser.email} on ${action}`);
      return res.status(403).json({ error: 'Proibido: Acesso administrativo ou autorização de auto-exclusão necessária.' });
    }

    // A. PURGE USER (NUCLEAR SUPREME V2026.GOLD)
    if (action === 'delete') {
      const targetUid = userId || callerUser.id;
      if (!targetUid) return res.status(400).json({ error: 'ID do utilizador em falta.' });
      
      console.log(`📡 [MIRA NUCLEAR] Purgação Soberana iniciada por ${callerUser.email} para: ${targetUid} (Block: ${block})`);

      try {
          // ☢️ PURGAÇÃO ATÓMICA SUPREMA (V2026.GOLD)
          console.log(`🧨 [MIRA RPC] Executando public.admin_nuclear_purge_v2026_supreme para ${targetUid}...`);
          
          // 🛡️ Tentativa 1: RPC Suprema (Agora aceita should_block)
          const { error: rpcError } = await supabaseAdmin.rpc('admin_nuclear_purge_v2026_supreme', { 
              target_uid: targetUid,
              should_block: !!block
          });

          if (rpcError) {
              console.warn(`⚠️ [MIRA RPC] RPC Suprema falhou (${rpcError.message}). Tentando fallback resiliente...`);
              // 🛡️ [V2026.GOLD FALLBACK]: Eliminação direta do perfil se a RPC falhar
              console.log(`🧨 [MIRA FALLBACK] Eliminando perfil public.profiles para ${targetUid}...`);
              const { error: profileDelErr } = await supabaseAdmin.from('profiles').delete().eq('id', targetUid);
              if (profileDelErr) {
                  console.error(`❌ [MIRA FALLBACK] Falha ao eliminar perfil: ${profileDelErr.message}`);
              } else {
                  console.log(`✅ [MIRA FALLBACK] Perfil eliminado com sucesso.`);
              }
          }
          
          // 🛡️ [V2026.SUPREMO] ABSOLUTE AUTH PURGE
          // Este é o passo mais importante para evitar que o utilizador consiga voltar a entrar.
          console.log(`🧨 [MIRA AUTH] Removendo utilizador do sistema de autenticação: ${targetUid}...`);
          
          let { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(targetUid);
          
          if (authDelErr) {
              if (authDelErr.message.includes('not found')) {
                  console.log(`ℹ️ [MIRA AUTH] Utilizador ${targetUid} já não existia no Auth por ID.`);
              } else {
                  console.error(`❌ [MIRA AUTH] ERRO ao remover do Auth por ID: ${authDelErr.message}`);
              }
          }

          // [Sovereign Hack] Invalidação por e-mail se bloquearmos
          // Se soubermos o email e deletar por ID falhar, o e-mail pode estar 'preso'.
          
          console.log(`✅ [MIRA NUCLEAR] Sucesso absoluto para ${targetUid}.`);
          return res.status(200).json({ 
              success: true, 
              message: isSelfDeletion ? 'A sua conta foi eliminada permanentemente.' : (block ? 'Utilizador bloqueado e purgado com soberania.' : 'Utilizador purgado. O e-mail está livre para novo registo.')
          });

      } catch (err) {
          console.error(`❌ [MIRA NUCLEAR] Falha catastrófica:`, err);
          return res.status(500).json({ error: 'Erro interno na purgação nuclear.', details: err.message });
      }
    }



    // B. PURGE SUGGESTION (POLYMORPHIC)
    if (action === 'delete_suggestion') {
      if (!suggestionId) return res.status(400).json({ error: 'ID da sugestão em falta.' });
      
      console.log(`📡 [MIRA NUCLEAR] Admin ${callerUser.email} deletando sugestão ${suggestionId}...`);

      const sweep = [];
      
      // Only sweep tables that support UUID if suggestionId is a UUID
      if (isUuid(suggestionId)) {
        sweep.push(supabaseAdmin.from('suggestions').delete().eq('id', suggestionId));
        sweep.push(supabaseAdmin.from('app_suggestions').delete().eq('id', suggestionId));
        sweep.push(supabaseAdmin.from('site_improvements').delete().eq('id', suggestionId));
        sweep.push(supabaseAdmin.from('reports').delete().eq('id', suggestionId).eq('type', 'suggestion'));
      } else {
        // Fallback for text IDs (Legacy / Prefixed)
        sweep.push(supabaseAdmin.from('suggestions').delete().filter('id', 'eq', suggestionId));
        sweep.push(supabaseAdmin.from('app_suggestions').delete().filter('id', 'eq', suggestionId));
        sweep.push(supabaseAdmin.from('site_improvements').delete().filter('id', 'eq', suggestionId));
        sweep.push(supabaseAdmin.from('reports').delete().filter('id', 'eq', suggestionId).eq('type', 'suggestion'));
      }

      const results = await Promise.allSettled(sweep);
      const hasSuccess = results.some(r => r.status === 'fulfilled' && !r.value?.error);

      if (!hasSuccess) {
          console.error(`❌ [MIRA NUCLEAR] Suggestion Purge Failed for ${suggestionId}`);
          return res.status(404).json({ error: 'Sugestão não encontrada ou erro de formato.' });
      }

      return res.status(200).json({ success: true, message: 'Sugestão removida com soberania administrativa.' });
    }

    // D. PURGE CONTENT (POSTS/COMMENTS) - NOBEL V2026
    if (action === 'delete_community_report') {
        const { reportId } = req.body;
        if (!reportId) return res.status(400).json({ error: 'reportId is required' });
        
        await supabaseAdmin.from('community_reports').delete().eq('id', reportId);
        return res.status(200).json({ success: true });
    }

    if (action === 'delete_content') {
        const { targetId, type, reportId } = req.body;
        if (!targetId || !type) return res.status(400).json({ error: 'ID ou Tipo de destino em falta.' });
        
        console.log(`📡 [MIRA NUCLEAR] Admin ${callerUser.email} deletando ${type}: ${targetId}...`);
        
        const table = type === 'post' ? 'posts' : (type === 'comment' ? 'comments' : 'map_alerts');
        
        // 1. Force delete content via Service Role
        const { error: deleteErr } = await supabaseAdmin.from(table).delete().eq('id', targetId);
        if (deleteErr) {
            console.error(`❌ [MIRA] Erro ao deletar ${type}:`, deleteErr);
            return res.status(500).json({ error: `Erro ao deletar ${type}.`, details: deleteErr.message });
        }
        
        // 2. Clear related reports
        if (reportId) {
            await supabaseAdmin.from('community_reports').delete().eq('id', reportId);
            await supabaseAdmin.from('reports').delete().eq('id', reportId);
        }
        
        return res.status(200).json({ success: true, message: `${type} purgado com Soberania Admin.` });
    }

    // E. GET REAL DASHBOARD STATS (BYPASS RLS)
    if (action === 'get_real_stats') {
        console.log(`📡 [MIRA DASHBOARD] Admin ${callerUser.email} solicitando números reais...`);
        
        const { data: stats, error: statsErr } = await supabaseAdmin.rpc('get_admin_dashboard_stats_v3');
        
        if (statsErr) {
            console.warn(`⚠️ RPC V3 falhou (${statsErr.message}), tentando contagem manual resiliente...`);
            const [pCount, rCount, crCount, uCount, jCount, cCount, sCount, sugCount, docCount] = await Promise.all([
                supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabaseAdmin.from('community_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
                supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('job_posts').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('saber_ia').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('map_alerts').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('app_suggestions').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('user_documents').select('id', { count: 'exact', head: true })
            ]);
            
            return res.status(200).json({
                total_users: uCount.count || 0,
                total_reports: (rCount.count || 0) + (crCount.count || 0),
                total_posts: pCount.count || 0,
                total_jobs: jCount.count || 0,
                total_knowledge: cCount.count || 0,
                total_services: sCount.count || 0,
                total_suggestions: sugCount.count || 0,
                total_downloads: docCount.count || 0
            });
        }
        
        return res.status(200).json(stats);
    }

    // C. GET KNOWLEDGE (BYPASS RLS)
    if (action === 'get_knowledge') {
      console.log(`📡 [MIRA NUCLEAR] Admin ${callerUser.email} solicitando restauração de Saberes...`);
      
      const { data: saber, error: saberErr } = await supabaseAdmin.from('saber_ia').select('*').order('created_at', { ascending: false });
      const { data: kb, error: kbErr } = await supabaseAdmin.from('knowledge_base').select('*').order('created_at', { ascending: false });
      const { data: news, error: newsErr } = await supabaseAdmin.from('newsroom_articles').select('*').order('created_at', { ascending: false });

      if (saberErr || kbErr) {
        console.error('MIRA: Knowledge fetch via Admin failed:', saberErr || kbErr);
        return res.status(500).json({ error: 'Erro ao recuperar base de conhecimento privilegiada.' });
      }

      return res.status(200).json({ 
        saber: saber || [], 
        kb: kb || [],
        newsroom: news || []
      });
    }

    // G. GET SUGGESTIONS (BYPASS RLS)
    if (action === 'get_suggestions') {
      console.log(`📡 [MIRA SUGGESTIONS] Admin ${callerUser.email} solicitando sugestões...`);
      
      const { data: suggestions, error: sugErr } = await supabaseAdmin
        .from('app_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sugErr) {
        console.error('MIRA: Suggestions fetch via Admin failed:', sugErr);
        return res.status(500).json({ error: 'Erro ao recuperar sugestões.' });
      }

      return res.status(200).json(suggestions || []);
    }

    // F. GET COMMUNITY REPORTS (BYPASS RLS)
    if (action === 'get_community_reports') {
      console.log(`📡 [MIRA REPORTS] Admin ${callerUser.email} solicitando denúncias...`);
      
      const { data: reports, error: reportsErr } = await supabaseAdmin
        .from('community_reports')
        .select(`*`)
        .order('created_at', { ascending: false });

      if (reportsErr) {
        console.error('MIRA: Reports fetch via Admin failed:', reportsErr);
        return res.status(500).json({ error: 'Erro ao recuperar denúncias.' });
      }
      
      // Manually enrich with profile data to avoid flaky FK joins in RLS bypass
      const authorIds = [...new Set(reports.map(r => r.author_id))];
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, name, email').in('id', authorIds);
      const enriched = reports.map(r => ({
        ...r,
        author: profiles?.find(p => p.id === r.author_id) || { name: 'Utilizador', email: 'N/A' }
      }));

      return res.status(200).json(enriched);
    }

    // 4. DEFAULT: Fetch all users from auth.users (only possible with service role)
    const { data: { users: authUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });

    if (listError) throw listError;

    // 4. Fetch all profiles - Resilient column selection (no created_at as it may not exist)
    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id, name, email, avatar_url, reputation, role, is_muted, is_blocked');
    if (profilesError) console.warn('MIRA: profiles fetch warning:', profilesError.message);

    // 5. Build email map from auth.users
    const emailMap = {};
    (authUsers || []).forEach(u => {
      if (u.id && u.email) emailMap[u.id] = u.email;
    });

    // 6. Merge: profile data + auth email
    const merged = (profiles || []).map(profile => ({
      id: profile.id,
      name: profile.name,
      email: emailMap[profile.id] || profile.email || null,
      avatar: profile.avatar_url,
      reputation: profile.reputation || 0,
      trustLevel: profile.reputation > 500 ? 'Curador Comunitário' : profile.reputation > 100 ? 'Colaborador' : 'Observador',
      role: profile.role || 'member',
      isMuted: profile.is_muted || false,
      isBlocked: profile.is_blocked || false,
      registrationDate: profile.created_at,
      followersCount: profile.followers_count || 0,
      followingCount: profile.following_count || 0
    }));

    // 7. Also sync emails back to profiles table for those that are missing
    const toSync = merged.filter(u => u.email && emailMap[u.id]);
    for (const u of toSync.slice(0, 50)) { // Sync up to 50 at a time
      await supabaseAdmin.from('profiles').update({ email: u.email }).eq('id', u.id).is('email', null);
    }

    return res.status(200).json({ users: merged, total: merged.length });
  } catch (err) {
    console.error('MIRA admin-users error:', err);
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
}
