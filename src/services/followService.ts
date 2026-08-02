import { supabase } from '../lib/supabase';

export const followService = {
    async followUser(followerId: string, followedId: string) {
        if (!followerId || !followedId || followerId === followedId) {
            return { error: null };
        }

        // 1. Persistência Local Garantida
        try {
            const localFollows = JSON.parse(localStorage.getItem('mira_follows') || '[]');
            if (!localFollows.includes(followedId)) {
                localFollows.push(followedId);
                localStorage.setItem('mira_follows', JSON.stringify(localFollows));
            }
        } catch (e) {}

        // 2. Registos remotos resilientes (DB)
        try {
            await supabase.from('user_follows').insert([{ follower_id: followerId, following_id: followedId }]);
        } catch (e) {}

        try {
            await supabase.from('activity_logs').insert([{
                user_id: followerId,
                action: 'user_followed',
                metadata: { target_id: followedId }
            }]);
        } catch (e) {}

        // 3. 🏆 GAMIFICAÇÃO INTEGRAL: Atribuição imediata de Pontos e Selos
        try {
            const { gamificationService } = await import('./gamificationService');
            const newRep = await gamificationService.earnPoints(followerId, 5, 'Seguir Utilizador');
            if (newRep !== null) {
                await gamificationService.autoAwardBadges(followerId, newRep);
            } else {
                await gamificationService.autoAwardBadges(followerId, 15);
            }
        } catch (e) {
            console.error("MIRA: Error earning points on follow:", e);
        }
        
        return { error: null };
    },

    async unfollowUser(followerId: string, followedId: string) {
        try {
            const localFollows = JSON.parse(localStorage.getItem('mira_follows') || '[]');
            const updated = localFollows.filter((id: string) => id !== followedId);
            localStorage.setItem('mira_follows', JSON.stringify(updated));
        } catch (e) {}

        try {
            await supabase.from('user_follows').delete().eq('follower_id', followerId).eq('following_id', followedId);
        } catch (e) {}
        
        return { error: null };
    },

    async isFollowing(followerId: string, followedId: string) {
        if (!followerId || !followedId) return false;
        try {
            const localFollows = JSON.parse(localStorage.getItem('mira_follows') || '[]');
            if (localFollows.includes(followedId)) return true;
        } catch (e) {}

        try {
            const { data } = await supabase
                .from('user_follows')
                .select('*')
                .eq('follower_id', followerId)
                .eq('following_id', followedId)
                .maybeSingle();
            return !!data;
        } catch {
            return false;
        }
    },

    async getFollowerCount(userId: string) {
        try {
            const { count, error } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId);
            
            if (!error && count !== null) return count;
        } catch (e) {}

        try {
            const { data } = await supabase
                .from('profiles')
                .select('followers_count')
                .eq('id', userId)
                .maybeSingle();
            return (data as any)?.followers_count || 0;
        } catch {
            return 0;
        }
    },
    
    async getFollowingCount(userId: string) {
        try {
            const localFollows = JSON.parse(localStorage.getItem('mira_follows') || '[]');
            if (localFollows.length > 0) return localFollows.length;
        } catch (e) {}

        try {
            const { count, error } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId);

            if (!error && count !== null) return count;
        } catch (e) {}

        try {
            const { data } = await supabase
                .from('profiles')
                .select('following_count')
                .eq('id', userId)
                .maybeSingle();
            return (data as any)?.following_count || 0;
        } catch {
            return 0;
        }
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
