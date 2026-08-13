
import { createClient } from '@supabase/supabase-js';
import { isRateLimited, getClientIp } from '../lib/rate-limiter.js';

export default async function handler(req, res) {
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

  const { email, language } = req.body;
  const cleanEmail = email?.toLowerCase().trim();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email é obrigatório.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  try {
    const origin = req.headers.origin || 'https://www.miraimigrante.pt';
    let recoveryLink = `${origin.endsWith('/') ? origin : origin + '/'}/?type=recovery`;

    if (supabaseUrl && supabaseServiceRole) {
      try {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
          auth: { autoRefreshToken: false, persistSession: false }
        });

        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: { redirectTo: recoveryLink }
        });

        if (linkData?.properties?.action_link) {
          recoveryLink = linkData.properties.action_link;
        }
      } catch (genErr) {
        console.warn("MIRA Recovery Warning (generateLink fallback):", genErr);
      }
    }

    // 2. Send via Resend (Sovereignty Protocol)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
        const brandName = 'MIRA Imigrante';

        const subjects = {
            PT: `Recuperar Acesso - ${brandName}`,
            EN: `Recover Access - ${brandName}`,
            ES: `Recuperar Acceso - ${brandName}`,
            FR: `Récupérer l'Accès - ${brandName}`
        };

        const titles = {
            PT: 'Recuperação de Acesso',
            EN: 'Access Recovery',
            ES: 'Recuperación de Acceso',
            FR: 'Récupération d\'Accès'
        };

        const messages = {
            PT: 'Recebemos um pedido para redefinir a tua palavra-passe. Se não foste tu, podes ignorar este e-mail com segurança.',
            EN: 'We received a request to reset your password. If it wasn\'t you, you can safely ignore this email.',
            ES: 'Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo con seguridad.',
            FR: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Si ce n\'était pas vous, vous pouvez ignorer cet e-mail en toute sécurité.'
        };

        const btnTexts = {
            PT: 'Definir Nova Senha',
            EN: 'Set New Password',
            ES: 'Establecer Nueva Contraseña',
            FR: 'Définir un Nouveau Mot de Passe'
        };

        const lang = ['PT', 'EN', 'ES', 'FR'].includes(language) ? language : 'PT';
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'MIRA Imigrante <no-reply@miraimigrante.pt>',
                reply_to: 'mira.app@hotmail.com', 
                to: cleanEmail,
                subject: subjects[lang],
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; border-radius: 24px; border: 1px solid #f1f5f9; text-align: center; color: #0F172A;">
                        <div style="margin-bottom: 30px;">
                            <h1 style="color: #FF8C00; font-size: 28px; font-weight: 800; margin: 0; text-transform: uppercase;">MIRA IMIGRANTE</h1>
                            <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 5px;">Integração • Apoio • Soberania</p>
                        </div>
                        
                        <div style="background-color: #f8fafc; padding: 30px; border-radius: 20px; margin-bottom: 30px;">
                            <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin-top: 0;">${titles[lang]}</h2>
                            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                                ${messages[lang]}
                            </p>
                            <a href="${recoveryLink}" style="display: inline-block; background-color: #FF8C00; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 100px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">${btnTexts[lang]}</a>
                        </div>
                        
                        <p style="color: #64748b; font-size: 13px;">
                            ${lang === 'PT' ? 'Link expira em 24 horas.' : 'Link expires in 24 hours.'}
                        </p>
                        
                        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #94a3b8; font-weight: 500;">
                            © 2026 MIRA Imigrante.
                        </p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const resendErr = await response.json();
            throw new Error(`Resend API: ${resendErr.message || 'Unknown error'}`);
        }
    } else {
        throw new Error('Resend API key missing or link generation failed.');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Email de recuperação enviado via Soberania Resend.' 
    });

  } catch (error) {
    console.error('MIRA Recovery Critical Error:', error);
    return res.status(500).json({ error: 'Erro ao enviar e-mail de recuperação via Resend.', details: error.message });
  }
}
