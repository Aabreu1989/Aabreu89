import { supabase } from '../lib/supabase';
import { safeStorage } from '../utils/persistence';

export const followService = {
    getLocalKey(followerId: string) {
        return `mira_follows_${followerId}`;
    },

    async followUser(followerId: string, followedId: string) {
        if (!followerId || !followedId || followerId === followedId) {
            return { error: null };
        }

        try {
            const key = this.getLocalKey(followerId);
            const localFollows = JSON.parse(safeStorage.getItem(key) || '[]');
            if (!localFollows.includes(followedId)) {
                localFollows.push(followedId);
                safeStorage.setItem(key, JSON.stringify(localFollows));
            }
        } catch (e) {
            console.warn("MIRA [followService] Local follow cache error:", e);
        }

        try {
            let sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            let token = sessionRes.data.session?.access_token || '';
            if (!token) {
                const refreshRes = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
                token = refreshRes.data.session?.access_token || '';
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/api/community', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'follow',
                    reqUserId: followerId,
                    targetUserId: followedId
                })
            });
        } catch (e) {
            console.error("MIRA: Error calling follow API:", e);
        }

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
        if (!followerId || !followedId) return { error: null };

        try {
            const key = this.getLocalKey(followerId);
            const localFollows = JSON.parse(safeStorage.getItem(key) || '[]');
            const updated = localFollows.filter((id: string) => id !== followedId);
            safeStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.warn("MIRA [followService] Local unfollow cache error:", e);
        }

        try {
            let sessionRes = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            let token = sessionRes.data.session?.access_token || '';
            if (!token) {
                const refreshRes = await supabase.auth.refreshSession().catch(() => ({ data: { session: null } }));
                token = refreshRes.data.session?.access_token || '';
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/api/community', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'unfollow',
                    reqUserId: followerId,
                    targetUserId: followedId
                })
            });
        } catch (e) {
            console.error("MIRA: Error calling unfollow API:", e);
        }
        
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

