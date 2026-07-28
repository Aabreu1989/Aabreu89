
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { password } = req.body;
    const authHeader = req.headers.authorization;

    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Palavra-passe inválida (mín. 6 caracteres)' });
    }

    if (!authHeader) {
        return res.status(401).json({ error: 'Sessão não encontrada' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Erro de configuração no servidor' });
    }

    // 1. Initialize Supabase with Service Role for Admin Privileges
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        // 2. Extract JWT from header to identify the user securely
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            console.error("MIRA Update PW: Could not identify user via token:", userError);
            return res.status(401).json({ error: 'Sessão inválida ou expirada' });
        }

        console.log(`MIRA Update PW: Updating password for ${user.email} (${user.id})`);

        // 3. Update the password using Admin API (More robust than client-side update)
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: password }
        );

        if (updateError) {
            console.error("MIRA Update PW: Admin update failed:", updateError);
            throw updateError;
        }

        // 4. Return success
        return res.status(200).json({ success: true, message: 'Palavra-passe atualizada com sucesso' });

    } catch (error) {
        console.error('MIRA Update PW Secret Error:', error);
        return res.status(500).json({ 
            error: 'Erro ao atualizar a palavra-passe. Contacte o suporte.',
            details: error.message 
        });
    }
}
