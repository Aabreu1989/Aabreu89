import { supabase } from '../lib/supabase';

export const followService = {
    getLocalKey(followerId: string) {
        return `mira_follows_${followerId}`;
    },

    async followUser(followerId: string, followedId: string) {
        if (!followerId || !followedId || followerId === followedId) {
            return { error: null };
        }

        // 1. Persistência Local Garantida e Escopada por Utilizador
        try {
            const key = this.getLocalKey(followerId);
            const localFollows = JSON.parse(localStorage.getItem(key) || '[]');
            if (!localFollows.includes(followedId)) {
                localFollows.push(followedId);
                localStorage.setItem(key, JSON.stringify(localFollows));
            }
        } catch (e) {}

        // 2. Registos remotos na tabela user_follows
        try {
            await supabase.from('user_follows').upsert([{ follower_id: followerId, following_id: followedId }], { onConflict: 'follower_id,following_id' });
        } catch (e) {
            try {
                await supabase.from('user_follows').insert([{ follower_id: followerId, following_id: followedId }]);
            } catch (err) {}
        }

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
        if (!followerId || !followedId) return { error: null };

        try {
            const key = this.getLocalKey(followerId);
            const localFollows = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = localFollows.filter((id: string) => id !== followedId);
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}

        try {
            await supabase.from('user_follows').delete().eq('follower_id', followerId).eq('following_id', followedId);
        } catch (e) {}
        
        return { error: null };
    },

    async isFollowing(followerId: string, followedId: string): Promise<boolean> {
        if (!followerId || !followedId) return false;
        try {
            const key = this.getLocalKey(followerId);
            const localFollows = JSON.parse(localStorage.getItem(key) || '[]');
            if (localFollows.includes(followedId)) return true;
        } catch (e) {}

        try {
            const { data } = await supabase
                .from('user_follows')
                .select('id')
                .eq('follower_id', followerId)
                .eq('following_id', followedId)
                .maybeSingle();
            if (data) {
                // Update local cache if missing
                try {
                    const key = this.getLocalKey(followerId);
                    const localFollows = JSON.parse(localStorage.getItem(key) || '[]');
                    if (!localFollows.includes(followedId)) {
                        localFollows.push(followedId);
                        localStorage.setItem(key, JSON.stringify(localFollows));
                    }
                } catch (e) {}
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    async getFollowingSet(followerId: string): Promise<Set<string>> {
        const set = new Set<string>();
        if (!followerId) return set;

        try {
            const key = this.getLocalKey(followerId);
            const localFollows = JSON.parse(localStorage.getItem(key) || '[]');
            localFollows.forEach((id: string) => set.add(id));
        } catch (e) {}

        try {
            const { data } = await supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', followerId);
            if (data) {
                data.forEach(d => set.add(d.following_id));
            }
        } catch (e) {}

        return set;
    },

    async getFollowerCount(userId: string): Promise<number> {
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
    
    async getFollowingCount(userId: string): Promise<number> {
        try {
            const set = await this.getFollowingSet(userId);
            if (set.size > 0) return set.size;
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
            .from('user_follows')
            .select('follower_id, profiles!user_follows_follower_id_fkey(*)')
            .eq('following_id', userId);
        
        if (error || !data) return { data: [], error };
        return { data: (data as any[]).map(d => d.profiles).filter(Boolean), error: null };
    },

    async getFollowingProfiles(userId: string) {
        const { data, error } = await supabase
            .from('user_follows')
            .select('following_id, profiles!user_follows_following_id_fkey(*)')
            .eq('follower_id', userId);

        if (error || !data) return { data: [], error };
        return { data: (data as any[]).map(d => d.profiles).filter(Boolean), error: null };
    },

    async toggleFollow(followerId: string, followedId: string, forceState?: boolean) {
        const shouldFollow = forceState !== undefined ? forceState : !(await this.isFollowing(followerId, followedId));
        if (!shouldFollow) {
            return await this.unfollowUser(followerId, followedId);
        } else {
            return await this.followUser(followerId, followedId);
        }
    }
};

