import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from '../lib/rate-limiter.js';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('📡 [MIRA REG] Iniciando registro para:', req.body.email);
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate Limiting
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
      return res.status(429).json({ error: 'Demasiadas tentativas. Aguarde 1 minuto.' });
  }

  const { email, password, name, language } = req.body;
  const cleanEmail = email?.toLowerCase().trim();

  if (!cleanEmail || !password) {
    return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceRole || !resendKey) {
    console.error("❌ [MIRA REG] Erro de Ambiente: URL/Key/Resend em falta.");
    return res.status(500).json({ error: 'Erro de configuração do servidor.' });
  }

  // Admin client for user creation and link generation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    console.log(`📡 [MIRA REG] Iniciando registo forçado para: ${cleanEmail}`);

    // 🛡️ [V2026.SUPREMO] BLACKLIST CHECK (Handled gracefully if table is missing)
    try {
        const { data: isBanned } = await supabaseAdmin
            .from('denied_emails')
            .select('email')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (isBanned) {
            console.warn(`🛑 [MIRA REG] Tentativa de registo bloqueada (Blacklist): ${cleanEmail}`);
            return res.status(403).json({ 
                error: language === 'PT' ? 'Este e-mail foi permanentemente restringido.' : 'This email has been permanently restricted.' 
            });
        }
    } catch (dbErr) {
        console.warn(`🛡️ [MIRA REG] Skipping blacklist check: ${dbErr.message}`);
    }

    // 1. Check if user already exists
    let targetUser = null;
    try {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;
        targetUser = users?.find(u => u.email?.toLowerCase() === cleanEmail);
    } catch (authErr) {
        console.error("❌ [MIRA REG] Supabase Admin error:", authErr.message);
        throw authErr;
    }

    if (targetUser) {
        // [SOVEREIGN FIX] Se o utilizador existe mas NÃO tem perfil e não confirmou o e-mail, purgamos para re-registo
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', targetUser.id).maybeSingle();
        
        if (!profile && !targetUser.email_confirmed_at) {
            console.log(`📡 [MIRA REG] Zombie detectado (${cleanEmail}). Executando purga para permitir re-registo...`);
            await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
            targetUser = null; // Fará com que o código abaixo crie um novo user
        } else if (targetUser.email_confirmed_at) {
            return res.status(400).json({ error: language === 'PT' ? 'Este e-mail já está ativo. Por favor, faça login.' : 'This email is already active. Please login.' });
        } else {
            // Existe, mas está por confirmar e não é zombie (por precaução)
            console.log(`📡 [MIRA REG] Utilizador existente não confirmado: ${cleanEmail}. Purgando para reenviar link limpo...`);
            await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
            targetUser = null;
        }
    }

    // 2. Generate Activation Link AND Create User in one step
    const redirectUrl = req.headers.origin || process.env.VITE_FRONTEND_URL || 'https://miraimigrante.pt';
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: cleanEmail,
        password: password,
        data: { 
            name: name || 'Imigrante', 
            language: language || 'PT',
            role: 'member'
        },
        options: { redirectTo: `${redirectUrl}/auth/callback` }
    });

    if (linkError || !linkData?.properties?.action_link) {
        throw new Error(`Erro ao gerar link: ${linkError?.message || 'Link vazio'}`);
    }

    const confirmLink = linkData.properties.action_link;
    console.log(`📡 [MIRA REG] Novo utilizador criado via Link Generator: ${linkData.user.id}`);

    // 3. Dispatch Email via Resend
    console.log(`📡 [MIRA RESEND] Despachando e-mail para: ${cleanEmail} (${language})`);
    const brandColor = '#FF8C00';
    const brandName = 'MIRA Imigrante';

    const subjects = {
        PT: `MIRA Imigrante - Confirmação de Registo`,
        EN: `MIRA Imigrante - Registration Confirmation`,
        ES: `MIRA Imigrante - Confirmación de Registro`,
        FR: `MIRA Imigrante - Confirmation d'inscription`
    };

    const greetings = {
        PT: 'Bem-vindo ao MIRA Imigrante!',
        EN: 'Welcome to MIRA Imigrante!',
        ES: '¡Bienvenido a MIRA Imigrante!',
        FR: 'Bienvenue sur MIRA Imigrante !'
    };

    const messages = {
        PT: 'Para concluir o seu registo e ativar a conta, por favor clique no botão abaixo para confirmar o seu e-mail.',
        EN: 'To complete your registration and activate your account, please click the button below to confirm your email.',
        ES: 'Para concluir su registro y activar su cuenta, por favor haga clic en el botón de abajo para confirmar su correo.',
        FR: 'Pour finaliser votre inscription et activer votre compte, veuillez cliquer sur le bouton ci-dessous pour confirmer votre e-mail.'
    };

    const btnTexts = {
        PT: 'Confirmar E-mail',
        EN: 'Confirm Email',
        ES: 'Confirmar Correo',
        FR: 'Confirmer l\'e-mail'
    };

    const lang = ['PT', 'EN', 'ES', 'FR'].includes(language) ? language : 'PT';

    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
            from: 'MIRA Imigrante <no-reply@miraimigrante.pt>', 
            to: cleanEmail,
            subject: subjects[lang],
            text: `${greetings[lang]}\n\n${messages[lang]}\n\nLink de confirmação: ${confirmLink}\n\nMIRA Imigrante - Integração • Apoio • Soberania`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; text-align: center; color: #0F172A;">
                    <div style="margin-bottom: 30px;">
                        <h1 style="color: #FF8C00; font-size: 28px; font-weight: 800; margin: 0; text-transform: uppercase;">${brandName}</h1>
                        <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Integração • Apoio • Soberania</p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 30px; border-radius: 20px; margin-bottom: 30px; border: 1px solid #f1f5f9;">
                        <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">${greetings[lang]}</h2>
                        <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                            ${messages[lang]}
                        </p>
                        <a href="${confirmLink}" style="display: inline-block; background-color: #FF8C00; color: #ffffff !important; padding: 18px 40px; text-decoration: none; border-radius: 100px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">${btnTexts[lang]}</a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;">
                    
                    <p style="font-size: 12px; color: #94a3b8; font-weight: 500;">
                        © 2026 ${brandName}. Todos os direitos reservados.
                    </p>
                </div>
            `
        })
    });


    if (!resendResponse.ok) {
        const errData = await resendResponse.json();
        throw new Error(`Resend API Error: ${JSON.stringify(errData)}`);
    }

    console.log(`✅ [MIRA] E-mail enviado com sucesso para ${cleanEmail}`);
    return res.status(200).json({ success: true, message: 'Confirme o seu e-mail.' });

  } catch (error) {
    console.error('❌ [MIRA REG] Falha Crítica:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
