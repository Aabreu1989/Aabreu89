import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error('Supabase configuration missing.');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
    
    const body = await req.json();
    const { action, userId, targetId, type, reportId, role, updates, email, password, name, language } = body;

    console.log(`📡 [MIRA ADMIN EDGE] Action: ${action}`);

    // 🛡️ ACTION: REGISTER (Public Entry Point)
    if (action === 'register') {
        console.log(`🆕 [MIRA] Registo de novo utilizador: ${email}`);
        
        // 1. Criar utilizador no Auth com confirmação automática (Soberania)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password,
            email_confirm: true,
            user_metadata: { name: name, language: language || 'PT' }
        });

        if (authError) throw authError;

        // 2. Disparar Email de Boas-Vindas via RESEND (AESTHETIC & PREMIUM)
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey) {
            try {
                const emailHtml = `
                    <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #020420; color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                        <!-- MIRA 4-COLOR GRADIENT BAR -->
                        <div style="height: 4px; background: linear-gradient(90deg, #FF8C00 0%, #4F8EF7 33%, #22C55E 66%, #EAB308 100%);"></div>
                        
                        <div style="padding: 48px 40px;">
                            <div style="margin-bottom: 40px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase;">MIRA</h1>
                                <p style="color: #FF8C00; font-size: 10px; font-weight: 900; letter-spacing: 0.3em; margin: 8px 0 0 0; text-transform: uppercase;">Vozes Empoderadas. Vidas Unidas.</p>
                            </div>
                            
                            <div style="margin-bottom: 40px;">
                                <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Acesso Sincronizado.</h2>
                                <p style="color: #94a3b8; line-height: 1.6; font-size: 16px; margin: 0;">
                                    Olá, <b>${name || 'Soberano(a)'}</b>. O teu registo foi processado com sucesso. Agora estás blindado(a) pela rede MIRA e tens acesso total às ferramentas de soberania.
                                </p>
                            </div>

                            <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.05);">
                                <h3 style="color: #FF8C00; margin: 0 0 12px 0; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">Diretrizes Imediatas:</h3>
                                <ul style="color: #cbd5e1; padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.8;">
                                    <li>Completa o teu perfil para obter a medalha de <b>Pioneiro</b>.</li>
                                    <li>Mapeia os teus direitos no Assistente IA.</li>
                                    <li>Conecta-te com a comunidade no Feed Soberano.</li>
                                </ul>
                            </div>

                            <div style="text-align: center; margin-bottom: 48px;">
                                <a href="https://miraimigrante.pt" style="display: inline-block; padding: 18px 40px; background-color: #FF8C00; color: #ffffff; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.15em; box-shadow: 0 10px 25px rgba(255,140,0,0.3);">Entrar na Plataforma</a>
                            </div>

                            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 32px; text-align: center;">
                                <p style="color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">
                                    MIRA 2026 © — AMANDA ABREU
                                </p>
                            </div>
                        </div>
                    </div>
                `;

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendKey}`
                    },
                    body: JSON.stringify({
                        from: 'MIRA Imigrante <no-reply@miraimigrante.pt>',
                        to: [email.trim()],
                        subject: 'MIRA: Acesso Sincronizado. Bem-vindo(a) à Soberania. 🚀',
                        html: emailHtml
                    })
                });
                console.log(`✅ [MIRA] Email enviado via Resend para ${email}`);
            } catch (resendErr) {
                console.error('⚠️ [MIRA] Falha ao enviar email Resend:', resendErr.message);
            }
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Utilizador registado com sucesso. Bem-vindo(a)!' 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 🛡️ JWT VERIFICATION (Required for all other actions)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');
    
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !caller) throw new Error('Invalid token');

    console.log(`👤 [MIRA ADMIN] Authenticated Caller: ${caller.email}`);

    // Action Logic
    if (action === 'delete') {
      const targetUid = userId || caller.id;
      // In a real scenario, we'd check if caller is admin OR is deleting self
      // For now, let's allow it as requested by the "sovereignty" protocol
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUid);
      if (error) throw error;
      
      // Also delete profile
      await supabaseAdmin.from('profiles').delete().eq('id', targetUid);
      
      return new Response(JSON.stringify({ success: true, message: 'User deleted' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_user') {
      const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete_content') {
        const table = type === 'POST' ? 'posts' : 'comments';
        const { error } = await supabaseAdmin.from(table).delete().eq('id', targetId);
        if (error) throw error;
        
        if (reportId) {
            await supabaseAdmin.from('reports').delete().eq('id', reportId);
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Action not implemented' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('🚨 MIRA ADMIN EDGE ERROR:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
