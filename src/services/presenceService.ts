import { supabase } from '../lib/supabase';

export const presenceService = {
    async updateStatus(userId: string, status: 'online' | 'offline') {
        // 🛡️ MIRA: Use RPC para atualização segura de presença para evitar erros 400
        const { error } = await supabase.rpc('safe_update_presence', { 
            p_user_id: userId,
            p_status: status
        });
        
        if (error) {
            // Fallback silencioso se o RPC falhar, para não travar o console do usuário
            console.warn("⚠️ [MIRA PRESENCE] DB Presence Sync skipped (Schema Protection)");
        }
        return { error };
    },

    trackPresence(userId: string, onUpdate: (presences: any) => void) {
        const channel = supabase.channel('online-users');

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                onUpdate(newState);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userId,
                        online_at: new Date().toISOString(),
                    });
                    // Also update DB status
                    await this.updateStatus(userId, 'online');
                }
            });

        return channel;
    }
};
