import { supabase } from '../lib/supabase';
import { User } from '../types';
import { t } from '../utils/translations';
import { ADMIN_EMAIL } from '../utils/adminUtils';

/**
 * ­ƒææ MIRA AUTH SERVICE V2026.SUPREME (DIAMOND MASTER)
 * PROTOCOLO: RESEND API + SUPABASE AUTH + PROFILE SYNC
 */
export const authService = {
    async fetchProfileWithRetry(userId: string, email: string, name?: string, retries = 3, delay = 500): Promise<any> {
        const isCEO = (email || '').toLowerCase().trim() === ADMIN_EMAIL;

        for (let i = 0; i < retries; i++) {
            try {
                let { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (!data && email) {
                    const { data: emailData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('email', email.toLowerCase().trim())
                        .maybeSingle();

                    if (emailData) {
                        data = emailData;
                        try {
                            await supabase.from('profiles').update({ id: userId }).eq('email', email.toLowerCase().trim());
                        } catch (_) {}
                    }
                }

                if (data) {
                    if (isCEO) {
                        data.role = 'admin';
                        data.reputation = Math.max(data.reputation || 0, 10458);
                        data.trust_level = 'Elite';
                        data.is_verified = true;
                        data.points = Math.max(data.points || 0, 1000000);
                    }
                    return data;
                }

                if (isCEO) {
                    // For CEO email, immediately return full admin profile fallback without waiting for retries
                    return {
                        id: userId,
                        name: name || 'Amanda Abreu (Admin MIRA)',
                        email: email,
                        role: 'admin',
                        reputation: 10458,
                        trust_level: 'Elite',
                        is_verified: true,
                        updated_at: new Date().toISOString()
                    };
                }

                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                } 
            } catch (e) {
                if (isCEO) {
                    return {
                        id: userId,
                        name: name || 'Amanda Abreu (Admin MIRA)',
                        email: email,
                        role: 'admin',
                        reputation: 10458,
                        trust_level: 'Elite',
                        is_verified: true,
                        updated_at: new Date().toISOString()
                    };
                }
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                }
            }
        }
        return null;
    },

    async fetchFullProfile(userId: string): Promise<User | null> {
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profileError || !profile) return null;

            // 🛡️ SOBERANIA MIRA: Busca atómica de medalhas na tabela central
            let { data: badgesData } = await supabase
                .from('user_badges')
                .select('badge_id, awarded_at')
                .eq('user_id', userId);

            // Se o utilizador ainda não tiver medalhas registadas, executar onboarding de gamificação (persiste pioneiro no DB)
            if (!badgesData || badgesData.length === 0) {
                try {
                    const { gamificationService } = await import('./gamificationService');
                    await gamificationService.autoAwardBadges(userId, profile.reputation || 0, profile.is_verified || false);
                    const { data: freshBadges } = await supabase
                        .from('user_badges')
                        .select('badge_id, awarded_at')
                        .eq('user_id', userId);
                    if (freshBadges && freshBadges.length > 0) {
                        badgesData = freshBadges;
                    }
                } catch (e) {
                    console.warn('MIRA: Aviso ao inicializar medalhas no onboarding:', e);
                }
            }

            const user = this.mapProfileToUser(profile, null);
            user.badges = (badgesData || []).map(b => ({
                badge_id: b.badge_id,
                awarded_at: b.awarded_at
            }));
            
            return user;
        } catch (e) {
            console.error("Error fetching full profile:", e);
            return null;
        }
    },

    mapProfileToUser(profile: any, sessionUser: any): User {
        const userEmail = (sessionUser?.email || profile.email || '').toLowerCase().trim();
        const isCEO = userEmail === ADMIN_EMAIL;

        const savedAvatar = typeof localStorage !== 'undefined' && profile.id ? localStorage.getItem(`mira_avatar_${profile.id}`) : null;
        return {
            id: profile.id,
            email: sessionUser?.email || profile.email || '',
            name: profile.name || sessionUser?.user_metadata?.name || sessionUser?.user_metadata?.full_name || (isCEO ? 'Amanda Abreu (Admin MIRA)' : 'Usuário Novo'),
            avatar: profile.avatar_url || profile.avatar || savedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}`,
            bio: profile.bio || (isCEO ? 'Fundadora & Administradora MIRA Imigrante' : ''),
            nationality: profile.nationality || 'Não especificada',
            ageRange: profile.age_range || profile.ageRange || '',
            location: profile.location || '',
            mainChallenge: profile.main_challenge || profile.mainChallenge || '',
            reputation: isCEO ? Math.max(profile.reputation || 0, 10458) : (profile.reputation || 0),
            trustLevel: (isCEO ? 'Elite' : (profile.trust_level || profile.trustLevel || 'Observador')) as any,
            isVerified: isCEO ? true : (profile.is_verified || profile.isVerified || false),
            role: (isCEO ? 'admin' : (profile.role || 'member')) as 'admin' | 'member' | 'mentor',
            isMuted: false,
            followersCount: profile.followers_count || profile.followersCount || 0,
            followingCount: profile.following_count || profile.followingCount || 0,
            registrationDate: profile.created_at || profile.updated_at || profile.registrationDate || new Date().toISOString(),
            verifiedPostsCount: profile.verified_posts_count || profile.verifiedPostsCount || 0,
            totalLikesReceived: profile.total_likes_received || profile.totalLikesReceived || 0,
            reportsConfirmedCount: profile.reports_confirmed_count || 0,
            scamReportsConfirmed: profile.scam_reports_confirmed || 0,
            documentDownloads: profile.document_downloads || 0,
            completedCoursesCount: profile.completed_courses_count || 0,
            serviceReviewsCount: profile.service_reviews_count || 0,
            invitesConfirmedCount: profile.invites_confirmed_count || 0,
            saberIaHits: profile.saber_ia_hits || 0,
            lynxEyeCount: profile.lynx_eye_count || 0,
            communityValidationsCount: profile.community_validations_count || 0,
            likesGivenCount: profile.likes_given_count || 0,
            badges: Array.isArray(profile.badges) ? profile.badges : [],
            email_confirmed_at: sessionUser?.email_confirmed_at || new Date().toISOString()
        };
    },

    async createFallbackProfile(userId: string, email: string, name?: string): Promise<any> {
        try {
            const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL;
            const defaultName = name || (isAdmin ? 'Amanda Abreu (Admin MIRA)' : 'Usuário Comunidade');

            const profileInsert = {
                id: userId,
                name: defaultName,
                email: email,
                role: isAdmin ? 'admin' : 'member',
                reputation: isAdmin ? 10458 : 0,
                trust_level: isAdmin ? 'Elite' : 'Observador',
                is_verified: isAdmin ? true : false,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase.from('profiles').insert([profileInsert]).select().single();

            if (error) {
                console.warn("MIRA: Fallback profile creation collision handled.");
            }

            return data || profileInsert;
        } catch (e) {
            return {
                id: userId,
                name: name || 'Usu├írio',
                email: email,
                role: 'member',
                reputation: 0,
                trust_level: 'Observador',
                is_verified: false,
                updated_at: new Date().toISOString()
            };
        }
    },

    /**
     * ­ƒøí´©Å SOVEREIGN REGISTRATION (RESEND API GATEWAY)
     */
    async signUp(email: string, password: string, name: string = '', language: string = 'PT') {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password, name, language })
        });
        
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Falha no registo de conta.');
        }

        return { 
            success: true, 
            message: data.message || t('auth_signup_success', language),
            isConfirmed: false
        };
    },

    async deleteAccount(): Promise<boolean> {
        try {
            console.log("🧬 [MIRA] Iniciando auto-exclusão RGPD...");
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sessão expirada.");

            // 🛡️ PROTOCOLO SOBERANO: Purgação via Edge Function ou RPC Fallback
            let deleted = false;
            try {
                const { error } = await supabase.functions.invoke('mira-admin', {
                    body: { 
                        action: 'delete', 
                        userId: session.user.id 
                    }
                });

                if (error) {
                    throw new Error(error.message || "Edge Function negou a purgação.");
                }
                deleted = true;
                console.log("✅ [MIRA] Auto-exclusão sincronizada com o Auth.");
            } catch (apiErr: any) {
                console.warn("MIRA: Edge Function Deletion failed, using RPC Fallback.", apiErr);
                // Fallback attempt via RPC if API fails (though API is preferred for Auth sync)
                const { error: rpcErr } = await supabase.rpc('admin_delete_full_user_v2026', { target_uid: session.user.id });
                if (rpcErr) {
                    console.error("MIRA: RPC fallback deletion also failed:", rpcErr);
                    throw rpcErr;
                }
                deleted = true;
                console.log("✅ [MIRA] Auto-exclusão concluída via RPC.");
            }

            if (!deleted) {
                return false;
            }

            // 3. Encerrar Sessão e Limpar Cache apenas após exclusão confirmada
            await this.signOut();
            localStorage.clear();
            sessionStorage.clear();
            
            // Limpeza de Cookies
            document.cookie.split(";").forEach((c) => {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
            });

            return true;
        } catch (error) {
            console.error("Critical failure during account deletion:", error);
            return false;
        }
    },

    async signOut(): Promise<void> {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("MIRA: Error during sign out:", e);
        }
    }
};
