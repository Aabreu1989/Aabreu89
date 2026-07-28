import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'ID do utilizador em falta.' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRole) {
    return res.status(500).json({ error: 'Configuração do servidor em falta (Service Role).' });
  }

  // Verify the caller is a logged-in admin via their JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }

  const callerToken = authHeader.replace('Bearer ', '');
  const supabaseAnon = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

  try {
    // 1. Verify Caller
    const { data: { user: callerUser }, error: callerError } = await supabaseAnon.auth.getUser(callerToken);
    if (callerError || !callerUser) throw new Error('Falha na autenticação do Admin.');

    // 2. Admin or Self Check (GDPR Compliance)
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role, email').eq('id', callerUser.id).single();
    const isAdmin = callerProfile?.role === 'admin' || callerProfile?.email === 'amandasabreu89@gmail.com';
    const isSelfDelete = callerUser.id === userId;
    
    if (!isAdmin && !isSelfDelete) {
        return res.status(403).json({ error: 'Acesso negado: Requer privilégios de Administrador ou ser o próprio titular da conta.' });
    }

    console.log(`📡 [MIRA NUCLEAR] Operação solicitada por ${callerUser.email} (Admin: ${isAdmin}) sobre o utilizador ${userId}...`);

    // 3. Purge Related Data (Ensuring absolute data privacy/RGPD)
    const sweep = [
        supabaseAdmin.from('gamification_history').delete().eq('user_id', userId),
        supabaseAdmin.from('post_votes').delete().eq('user_id', userId),
        supabaseAdmin.from('comments').delete().eq('author_id', userId),
        supabaseAdmin.from('posts').delete().eq('author_id', userId),
        supabaseAdmin.from('community_reports').delete().or(`reported_by.eq.${userId},target_id.eq.${userId}`),
        supabaseAdmin.from('reports').delete().eq('user_id', userId),
        supabaseAdmin.from('notifications').delete().eq('user_id', userId),
        supabaseAdmin.from('saved_posts').delete().eq('user_id', userId),
        supabaseAdmin.from('profile_badges').delete().eq('user_id', userId),
        supabaseAdmin.from('community_stats').delete().eq('user_id', userId),
        supabaseAdmin.from('profiles').delete().eq('id', userId)
    ];
    await Promise.allSettled(sweep);

    // 4. NUCLEAR: Delete from Auth (This is what REALLY deletes the user)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError && authError.message !== 'User not found') throw authError;

    console.log(`✅ [MIRA NUCLEAR] Utilizador ${userId} purgado com sucesso.`);
    return res.status(200).json({ success: true, message: 'Utilizador eliminado com sucesso.' });

  } catch (err) {
    console.error('❌ [MIRA NUCLEAR] Erro fatal:', err);
    return res.status(500).json({ error: err.message });
  }
}
