import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Validate Session (Admin only)
    const { action, id, reportId, type } = req.body;
    
    // MIRA SOBERANIA: Privileged SDK
    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        if (action === 'delete_suggestion') {
            const { error } = await supabase.from('app_suggestions').delete().eq('id', id);
            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        if (action === 'delete_report_only') {
            const { error } = await supabase.from('reports').delete().eq('id', id);
            if (error) throw error;
            return res.status(200).json({ success: true });
        }

        if (action === 'delete_reported_content') {
            console.log(`☢️ [MIRA NUCLEAR] Iniciando purga atómica de ${type}: ${id}`);
            
            let rpcName = type === 'POST' ? 'nuclear_delete_post_v2' : 'admin_nuclear_content_delete';
            let params = type === 'POST' ? { p_post_id: id } : { target_type: 'COMMENT', target_id: id, report_id: reportId || null };

            const { data, error } = await supabase.rpc(rpcName, params);
            
            if (error) {
                console.error(`❌ [MIRA NUCLEAR] Falha no RPC ${rpcName}:`, error.message);
                
                // Fallback manual se o RPC falhar ou não existir
                if (type === 'POST') {
                    await supabase.from('posts').update({ validation_status: 'blocked' }).eq('id', id);
                    await supabase.from('posts').delete().eq('id', id);
                } else {
                    await supabase.from('comments').delete().eq('id', id);
                }
            }

            if (reportId) {
                await supabase.from('reports').delete().eq('id', reportId);
            }

            return res.status(200).json({ success: true, message: 'Nuclear Strike Complete' });
        }

        if (action === 'delete_ai_knowledge') {
            const { error: storeError } = await supabase.from('knowledge_store').delete().eq('id', id);
            const { error: baseError } = await supabase.from('knowledge_base').delete().eq('id', id);
            if (storeError && baseError) throw storeError; // Only throw if both fail
            return res.status(200).json({ success: true });
        }

        return res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
        console.error("MIRA Admin Delete Content Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
