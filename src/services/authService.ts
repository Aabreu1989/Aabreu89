import { supabase } from '../lib/supabase';
import { User } from '../types';
import { t } from '../utils/translations';

/**
 * 👑 MIRA AUTH SERVICE V2026.SUPREME (DIAMOND MASTER)
 * PROTOCOLO: RESEND API + SUPABASE AUTH + PROFILE SYNC
 */
export const authService = {
    async fetchProfileWithRetry(userId: string, email: string, name?: string, retries = 3, delay = 500): Promise<any> {
        const ceoEmails = ['mira.app@hotmail.com', 'amandajhonnes@yahoo.com.br', 'amandasabreu89@gmail.com'];
        const isCEO = ceoEmails.includes(email?.toLowerCase());

        for (let i = 0; i < retries; i++) {
            try {
                // 1. Try by ID
                let { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                // 2. Fallback to Email search if not matched by ID
                if (!data && email) {
                    const { data: emailData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('email', email.toLowerCase())
                        .maybeSingle();

                    if (emailData) {
                        data = emailData;
                        // Sincronizar ID novo com a conta
                        await supabase.from('profiles').update({ id: userId }).eq('email', email.toLowerCase());
                    }
                }

                if (data) {
                    // Garantia Mestre CEO Amanda Abreu
                    if (isCEO) {
                        data.role = 'admin';
                        data.reputation = Math.max(data.reputation || 0, 10458);
                        data.trust_level = 'Elite';
                        data.points = Math.max(data.points || 0, 1000000);
                    }
                    return data;
                }

                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                } 
            } catch (e) {
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

            // 🛡️ NORE: Busca atómica de medalhas na tabela central
            const { data: badgesData } = await supabase
                .from('user_badges')
                .select('badge_id, awarded_at')
                .eq('user_id', userId);

            const user = this.mapProfileToUser(profile, null);
            if (badgesData && badgesData.length > 0) {
                user.badges = badgesData.map(b => ({
                    badge_id: b.badge_id,
                    awarded_at: b.awarded_at
                }));
            } else {
                user.badges = [
                    { badge_id: 'pioneer', awarded_at: new Date().toISOString() },
                    { badge_id: 'verified', awarded_at: new Date().toISOString() },
                    { badge_id: 'expert', awarded_at: new Date().toISOString() },
                    { badge_id: 'curador', awarded_at: new Date().toISOString() },
                    { badge_id: 'especialista_leis', awarded_at: new Date().toISOString() },
                    { badge_id: 'mestre_docs', awarded_at: new Date().toISOString() }
                ];
            }
            
            return user;
        } catch (e) {
            console.error("Error fetching full profile:", e);
            return null;
        }
    },

    mapProfileToUser(profile: any, sessionUser: any): User {
        const savedAvatar = typeof localStorage !== 'undefined' && profile.id ? localStorage.getItem(`mira_avatar_${profile.id}`) : null;
        return {
            id: profile.id,
            email: sessionUser?.email || profile.email || '',
            name: profile.name || sessionUser?.user_metadata?.name || 'Usuário Novo',
            avatar: profile.avatar_url || profile.avatar || savedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}`,
            bio: profile.bio || '',
            nationality: profile.nationality || 'Não especificada',
            ageRange: profile.age_range || profile.ageRange || '',
            location: profile.location || '',
            mainChallenge: profile.main_challenge || profile.mainChallenge || '',
            reputation: profile.reputation || 0,
            trustLevel: (profile.trust_level || profile.trustLevel || 'Observador') as any,
            isVerified: profile.is_verified || profile.isVerified || false,
            role: (profile.role || 'member') as 'admin' | 'member' | 'mentor',
            isMuted: profile.is_muted || profile.isMuted || false,
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
            email_confirmed_at: sessionUser?.email_confirmed_at || null
        };
    },

    async createFallbackProfile(userId: string, email: string, name?: string): Promise<any> {
        try {
            const { data: adminEntry } = await supabase
                .from('admin_users')
                .select('email')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            const CEO_EMAILS = ['mira.app@hotmail.com', 'amandajhonnes@yahoo.com.br', 'amandasabreu89@gmail.com'];
            const isAdmin = !!adminEntry || CEO_EMAILS.includes(email.toLowerCase().trim());
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
                name: name || 'Usuário',
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
     * 🛡️ SOVEREIGN REGISTRATION (RESEND API GATEWAY)
     */
    async signUp(email: string, password: string, name: string = '', language: string = 'PT') {
        try {
            console.log("📡 [MIRA] Tentando Registo Soberano via API Gateway...");
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password, name, language })
            });
            
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                return { 
                    success: true, 
                    message: data.message || t('auth_signup_success', language),
                    isConfirmed: false // Resend will handle the confirmation link
                };
            }
            
            console.warn("⚠️ [MIRA] API de Registo falhou, tentando Fallback Nativo:", data.error);
        } catch (err: any) {
            console.warn("⚠️ [MIRA] API Gateway indisponível, tentando Fallback Nativo...");
        }

        // 🛡️ FALLBACK: Registo direto via Supabase Auth
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { name, language, role: 'member' },
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            });

            if (error) throw error;
            return { 
                success: true, 
                message: t('auth_confirm_email', language),
                isConfirmed: false 
            };
        } catch (err: any) {
            console.error("🚨 [MIRA] Falha Crítica no Registo:", err.message);
            throw err;
        }
    },

    async deleteAccount(): Promise<boolean> {
        try {
            console.log("🧬 [MIRA] Iniciando auto-exclusão RGPD...");
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sessão expirada.");

            // 🛡️ PROTOCOLO SOBERANO: Purgação via NODE API (RGPD Master)
            try {
                const { data, error } = await supabase.functions.invoke('mira-admin', {
                    body: { 
                        action: 'delete', 
                        userId: session.user.id 
                    }
                });

                if (error) {
                    throw new Error(error.message || "Edge Function negou a purgação.");
                }
                console.log("✅ [MIRA] Auto-exclusão sincronizada com o Auth.");
            } catch (apiErr: any) {
                console.warn("MIRA: Edge Function Deletion failed, using RPC Fallback.", apiErr);
                // Fallback attempt via RPC if API fails (though API is preferred for Auth sync)
                await supabase.rpc('admin_delete_full_user_v2026', { target_uid: session.user.id });
            }

            // 3. Encerrar Sessão e Limpar Cache
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
            localStorage.clear();
            return true;
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
