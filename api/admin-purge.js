import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS - restricto ao domínio oficial
  const allowedOrigins = ['https://miraimigrante.pt', 'https://www.miraimigrante.pt'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ─── BLOCO DE AUTENTICAÇÃO OBRIGATÓRIO ───────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[MIRA PURGE] ❌ Tentativa de acesso sem token de autenticação.');
    return res.status(401).json({ error: 'Não autorizado: token em falta.' });
  }

  const callerToken = authHeader.replace('Bearer ', '').trim();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRole || !supabaseAnonKey) {
    console.error('[MIRA PURGE] ❌ Variáveis de ambiente em falta.');
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  // Cliente anónimo para verificar o JWT do caller
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Cliente admin com service role (apenas usado APÓS verificação)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // 1. Verificar se o token é válido
  const { data: { user: callerUser }, error: authError } = await supabaseAnon.auth.getUser(callerToken);
  if (authError || !callerUser) {
    console.warn(`[MIRA PURGE] ❌ Token inválido ou expirado: ${authError?.message}`);
    return res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }

  // 2. Verificar se o caller é administrador
  const ADMIN_EMAILS = [
    'amandasabreu89@gmail.com',
    'amandasabreu@gmail.com',
    'atendimentomira@gmail.com',
  ];
  const isAdminByEmail = ADMIN_EMAILS.includes(callerUser.email?.toLowerCase());

  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', callerUser.id)
    .maybeSingle();

  const isAdmin = isAdminByEmail || callerProfile?.role === 'admin';

  if (!isAdmin) {
    console.warn(`[MIRA PURGE] 🛑 Acesso negado para: ${callerUser.email} (role: ${callerProfile?.role})`);
    return res.status(403).json({ error: 'Proibido: requer privilégios de administrador.' });
  }
  // ─────────────────────────────────────────────────────────────────────────

  console.log(`[MIRA PURGE] ✅ Admin autorizado: ${callerUser.email}. Iniciando purga...`);

  const { id, topic, content } = req.body;

  const results = [];

  try {
    // 1. Delete by ID (UUID validated in SQL)
    if (id) {
      results.push(await supabaseAdmin.from('saber_ia').delete().eq('id', id));
      results.push(await supabaseAdmin.from('knowledge_base').delete().eq('id', id));
      results.push(await supabaseAdmin.from('newsroom_articles').delete().eq('id', id));
    }

    // 2. Delete by Content (Anti-Ghosting)
    if (topic && content) {
      results.push(await supabaseAdmin.from('saber_ia').delete().eq('topic', topic).eq('content', content));
      results.push(await supabaseAdmin.from('knowledge_base').delete().eq('topic', topic).eq('content', content));
    } else if (topic) {
      results.push(await supabaseAdmin.from('saber_ia').delete().eq('topic', topic));
      results.push(await supabaseAdmin.from('knowledge_base').delete().eq('topic', topic));
    }

    console.log(`[MIRA PURGE] ✅ Limpeza concluída por ${callerUser.email} para "${topic || id}"`);
    return res.status(200).json({ success: true, results });
  } catch (err) {
    console.error(`[MIRA PURGE] ❌ Erro fatal:`, err);
    return res.status(500).json({ error: err.message });
  }
}
