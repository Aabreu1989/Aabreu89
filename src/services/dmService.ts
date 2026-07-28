import { supabase } from '../lib/supabase';

export const dmService = {
    async getConversations(userId: string) {
        // Fetch conversations where user is a participant
        const { data, error } = await supabase
            .from('conversation_participants')
            .select(`
                conversation_id,
                conversations (
                    id,
                    last_message_at,
                    created_at
                )
            `)
            .eq('user_id', userId);

        if (error) return { data: [], error };

        // For each conversation, fetch the OTHER participant
        const conversations = await Promise.all(data.map(async (row) => {
            const { data: participants } = await supabase
                .from('conversation_participants')
                .select('user_id, profiles(*)')
                .eq('conversation_id', row.conversation_id)
                .neq('user_id', userId)
                .single();

            return {
                ...row.conversations,
                otherParticipant: participants?.profiles
            };
        }));

        return { data: (conversations as any[]).sort((a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()), error: null };
    },

    async getMessages(conversationId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
        
        return { data: data || [], error };
    },

    async sendMessage(conversationId: string, senderId: string, content: string) {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                conversation_id: conversationId,
                sender_id: senderId,
                content
            }])
            .select()
            .single();

        if (!error) {
            // Update last_message_at in conversation
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);
        }

        return { data, error };
    },

    async startConversation(myId: string, otherId: string) {
        // 1. Check if conversation already exists between these two
        const { data: existing } = await supabase
            .rpc('get_conversation_between_users', { user1: myId, user2: otherId });

        if (existing && existing.length > 0) {
            return { conversationId: existing[0].id, error: null };
        }

        // 2. Create new conversation
        const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert([{}])
            .select()
            .single();

        if (convError) return { conversationId: null, error: convError };

        // 3. Add participants
        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert([
                { conversation_id: newConv.id, user_id: myId },
                { conversation_id: newConv.id, user_id: otherId }
            ]);

        return { conversationId: newConv.id, error: partError };
    }
};
