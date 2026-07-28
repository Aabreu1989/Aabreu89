import { supabase } from '../lib/supabase';

export const submitReportRest = async (type: string, content: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('reports')
        .insert([{
            reporter_id: userId,
            post_id: type.startsWith('p-') ? type : null, // Sniper: Heurística para IDs legados
            reason: content,
            status: 'pending'
        }]);

    if (error) {
        console.error('submitReportRest error:', error);
        throw new Error(`Falha ao submeter form: ${error.message}`);
    }

    return true;
};

export const submitSuggestion = async (data: { subject: string, content: string, email?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const isSaberAI = data.subject === 'Saber AI' || data.subject.includes('IA');
    const finalSubject = isSaberAI ? `[SABER IA] ${data.subject}` : data.subject;
    
    // MIRA V2026.GOLD: SECURE TRANSACTIONAL SUGGESTION LOGIC (V11600 SLD)
    try {
        console.log(`[MIRA] Gravando sugestão em 'app_suggestions'...`);
        const { error } = await supabase
            .from('app_suggestions')
            .insert([{
                user_id: userId || null,
                subject: finalSubject,
                content: data.content,
                email: data.email || session?.user?.email || 'Anónimo',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error("❌ [MIRA] Falha grave no sistema de sugestões:", error.message);
            throw new Error(`Falha ao gravar sugestão: ${error.message}`);
        }

        console.log("✅ [MIRA] Sugestão gravada com sucesso.");
        
        // 🛡️ [MIRA V2026.GOLD] NOTIFICAÇÃO ADMIN (Amanda)
        const { data: adminProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', 'amandasabreu89@gmail.com')
            .single();

        if (adminProfile) {
            await supabase.from('notifications').insert([{
                user_id: adminProfile.id,
                type: 'social',
                title: '💡 Nova Sugestão MIRA',
                message: `[${finalSubject}] ${data.content.substring(0, 50)}...`,
                is_read: false,
                created_at: new Date().toISOString()
            }]);
        }

        return true;
    } catch (e: any) {
        console.error("🚨 [MIRA] Erro fatal no serviço de sugestões:", e);
        throw e;
    }
};
