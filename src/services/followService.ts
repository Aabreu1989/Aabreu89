import { supabase } from '../lib/supabase';

export const followService = {
    async followUser(followerId: string, followedId: string) {
        // MIRA V2026.GOLD: 🛡️ Sincronização com follows (Tabela oficial unificada)
        const { error: followError } = await supabase
            .from('follows')
            .insert([{ follower_id: followerId, following_id: followedId }]);
        
        if (followError) return { error: followError };

        // [MIRA V2026.GOLD] GAMIFICAÇÃO V2000: Registro de Interação
        await supabase.from('activity_logs').insert([{
            user_id: followerId,
            action: 'user_followed',
            metadata: { target_id: followedId }
        }]);

        // Award points and check milestones
        try {
            const { gamificationService } = await import('./gamificationService');
            const newRep = await gamificationService.earnPoints(followerId, 5, 'Seguir Utilizador');
            if (newRep !== null) {
                await gamificationService.autoAwardBadges(followerId, newRep);
            }
        } catch (e) {
            console.error("MIRA: Error earning points on follow:", e);
        }
        
        return { error: null };
    },

    async unfollowUser(followerId: string, followedId: string) {
        const { error: unfollowError } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followedId);
        
        if (unfollowError) return { error: unfollowError };
        
        return { error: null };
    },

    async isFollowing(followerId: string, followedId: string) {
        if (!followerId || !followedId) return false;
        const { data, error } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', followerId)
            .eq('following_id', followedId)
            .maybeSingle();
        
        if (error) return false;
        return !!data;
    },

    async getFollowerCount(userId: string) {
        // MIRA SOBERANIA: Contagem real na tabela de relações para evitar erros de cache/triggers
        const { count, error } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);
        
        if (error) {
            console.warn("MIRA: Erro ao contar seguidores, recorrendo ao perfil:", error);
            const { data } = await supabase
                .from('profiles')
                .select('followers_count')
                .eq('id', userId)
                .single();
            return (data as any)?.followers_count || 0;
        }
        return count || 0;
    },
    
    async getFollowingCount(userId: string) {
        // MIRA SOBERANIA: Contagem real na tabela de relações
        const { count, error } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        if (error) {
            console.warn("MIRA: Erro ao contar seguidos, recorrendo ao perfil:", error);
            const { data } = await supabase
                .from('profiles')
                .select('following_count')
                .eq('id', userId)
                .single();
            return (data as any)?.following_count || 0;
        }
        return count || 0;
    },

    async getFollowersProfiles(userId: string) {
        const { data, error } = await supabase
            .from('follows')
            .select('follower_id, profiles!follows_follower_id_fkey(*)')
            .eq('following_id', userId);
        
        if (error) return { data: [], error };
        return { data: (data as any[]).map(d => d.profiles), error: null };
    },

    async getFollowingProfiles(userId: string) {
        const { data, error } = await supabase
            .from('follows')
            .select('following_id, profiles!follows_following_id_fkey(*)')
            .eq('follower_id', userId);

        if (error) return { data: [], error };
        return { data: (data as any[]).map(d => d.profiles), error: null };
    },

    async toggleFollow(followerId: string, followedId: string) {
        const isFollowing = await this.isFollowing(followerId, followedId);
        if (isFollowing) {
            return await this.unfollowUser(followerId, followedId);
        } else {
            return await this.followUser(followerId, followedId);
        }
    }
};
