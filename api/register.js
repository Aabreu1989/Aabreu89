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

    // 2. Generate Secure Confirmation Link via Admin API or Client Auth API
    const redirectUrl = req.headers.origin || process.env.VITE_FRONTEND_URL || 'https://miraimigrante.pt';
    console.log(`📡 [MIRA REG] Gerando link seguro de ativação para: ${cleanEmail}`);
    
    let confirmLink = null;
    let userId = null;

    try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: cleanEmail,
            password: password,
            data: { 
                name: name || cleanEmail.split('@')[0], 
                language: language || 'PT',
                role: 'member'
            },
            options: { redirectTo: `${redirectUrl}/auth/callback` }
        });

        if (linkData?.properties?.action_link) {
            confirmLink = linkData.properties.action_link;
            userId = linkData.user.id;
            console.log(`✅ [MIRA REG] Link seguro gerado via Admin API para utilizador: ${userId}`);
        } else {
            throw linkError || new Error('Admin link generation unavailable');
        }
    } catch (linkErr) {
        console.warn("⚠️ [MIRA REG] Admin API indisponível/restringida, utilizando Client Auth SignUp para ativação segura:", linkErr.message);
        
        const { data: clientData, error: clientErr } = await supabaseAdmin.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
                data: {
                    name: name || cleanEmail.split('@')[0],
                    language: language || 'PT',
                    role: 'member'
                },
                emailRedirectTo: `${redirectUrl}/auth/callback`
            }
        });

        if (clientData?.user) {
            userId = clientData.user.id;
            confirmLink = `${redirectUrl}/auth/callback`;
            console.log(`✅ [MIRA REG] Registo criado via Client Auth: ${userId}`);
        } else if (clientErr) {
            // Se o Supabase deu rate limit no SMTP padrão dele, ignoramos porque o Resend vai enviar o e-mail!
            if (clientErr.message?.includes('rate limit') || clientErr.message?.includes('quota')) {
                console.log(`⚠️ [MIRA REG] Supabase SMTP Rate Limit detetado. Delegando envio exclusivamente ao Resend API...`);
                confirmLink = `${redirectUrl}/auth/callback`;
            } else {
                console.error("❌ [MIRA REG] Erro ao criar registo de confirmação:", clientErr.message);
                throw new Error(clientErr.message || 'Não foi possível enviar o e-mail de confirmação.');
            }
        }
    }

    // 3. Create initial Profile record in public.profiles
    try {
        const profileData = {
            id: userId,
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: 'member',
            trust_level: 'Observador',
            is_verified: false,
            updated_at: new Date().toISOString()
        };
        await supabaseAdmin.from('profiles').upsert([profileData]);
    } catch (profileErr) {
        console.warn("⚠️ [MIRA REG] Aviso ao registar perfil inicial:", profileErr.message);
    }

    // 4. Dispatch Secure Confirmation Email strictly via Resend
    console.log(`📡 [MIRA RESEND] Enviando e-mail de ativação via Resend para: ${cleanEmail}`);
    const brandName = 'MIRA Imigrante';
    const lang = ['PT', 'EN', 'ES', 'FR'].includes(language) ? language : 'PT';

    const subjects = {
        PT: `MIRA Imigrante - Confirmação de Registo`,
        EN: `MIRA Imigrante - Registration Confirmation`,
        ES: `MIRA Imigrante - Confirmación de Registro`,
        FR: `MIRA Imigrante - Confirmation d'inscription`
    };

    const greetings = {
        PT: `Olá ${name || 'amigo'}! Bem-vindo ao MIRA Imigrante.`,
        EN: `Hello ${name || 'there'}! Welcome to MIRA Imigrante.`,
        ES: `¡Hola ${name || ''}! Bienvenido a MIRA Imigrante.`,
        FR: `Bonjour ${name || ''} ! Bienvenue sur MIRA Imigrante.`
    };

    const messages = {
        PT: 'Para concluir o seu registo com total segurança e ativar a sua conta, por favor clique no botão abaixo para confirmar o seu e-mail.',
        EN: 'To complete your registration securely and activate your account, please click the button below to confirm your email.',
        ES: 'Para completar su registro con total seguridad y activar su cuenta, por favor haga clic en el botón de abajo para confirmar su correo.',
        FR: 'Pour finaliser votre inscription en toute sécurité et activer votre compte, veuillez cliquer sur le bouton ci-dessous pour confirmer votre e-mail.'
    };

    const btnTexts = {
        PT: 'Confirmar E-mail',
        EN: 'Confirm Email',
        ES: 'Confirmar Correo',
        FR: 'Confirmer l\'e-mail'
    };

    // Official Verified Domain Sender (Resend Verified: miraimigrante.pt)
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@miraimigrante.pt';

    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
            from: `MIRA Imigrante <${senderEmail}>`,
            to: cleanEmail,
            reply_to: 'mira.app@hotmail.com',
            subject: subjects[lang],
            text: `${greetings[lang]}\n\n${messages[lang]}\n\nLink de confirmação seguro: ${confirmLink}\n\nMIRA Imigrante - Integração • Apoio • Soberania`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 35px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; color: #0F172A; text-align: center;">
                    <div style="margin-bottom: 25px;">
                        <h1 style="color: #FF8C00; font-size: 28px; font-weight: 900; margin: 0; text-transform: uppercase; tracking: -0.02em;">${brandName}</h1>
                        <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 6px;">Integração • Apoio • Soberania</p>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 30px; border-radius: 20px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #0F172A; font-size: 18px; font-weight: 800; margin-top: 0; margin-bottom: 14px;">${greetings[lang]}</h2>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                            ${messages[lang]}
                        </p>
                        <a href="${confirmLink}" style="display: inline-block; background-color: #FF8C00; color: #ffffff !important; padding: 16px 36px; text-decoration: none; border-radius: 100px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; shadow: 0 4px 12px rgba(255,140,0,0.3);">${btnTexts[lang]}</a>
                    </div>
                    
                    <p style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                        Se não solicitou este registo, pode ignorar esta mensagem com segurança.<br>
                        © 2026 ${brandName}. Todos os direitos reservados.
                    </p>
                </div>
            `
        })
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
        console.error("❌ [MIRA RESEND] Erro ao enviar e-mail via Resend:", resendResult);
        if (resendResult?.message?.includes('testing emails')) {
            throw new Error(`Resend em modo de teste: Para enviar e-mails de confirmação a utilizadores externos (${cleanEmail}), é necessário verificar o domínio em resend.com/domains.`);
        }
        throw new Error(`Erro no envio de e-mail (Resend): ${resendResult?.message || 'Falha no serviço de e-mail'}`);
    }

    console.log(`✅ [MIRA REG] E-mail de confirmação com link enviado com sucesso via Resend para: ${cleanEmail}`);
    return res.status(200).json({ 
        success: true, 
        isConfirmed: false,
        message: language === 'PT' ? 'Foi enviado um e-mail de confirmação com o link seguro. Por favor, aceda à sua caixa de entrada para ativar a conta.' : 'A confirmation email with the secure link has been sent. Please check your inbox to activate your account.' 
    });

  } catch (error) {
    console.error('❌ [MIRA REG] Falha de Segurança:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
