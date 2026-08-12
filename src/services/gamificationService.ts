
import { supabase } from '../lib/supabase';
import { analytics } from './analyticsService';
import { syncService } from './syncService';

export const DEFAULT_GAMIFICATION_RULES: Record<string, number> = {
    publish_post: 10,
    add_comment: 5,
    like_given: 1,
    like_received: 2,
    vote_true: 3,
    vote_fake: 3,
    follow_user: 2,
    report_content: 1,
    curate_guide: 15
};

export const gamificationService = {
    /**
     * Obtém os pontos de uma regra central do Supabase (com fallback seguro).
     */
    async getRulePoints(actionKey: string): Promise<number> {
        try {
            const { data } = await supabase
                .from('gamification_rules')
                .select('points')
                .eq('action_key', actionKey)
                .maybeSingle();

            if (data && typeof data.points === 'number') {
                return data.points;
            }
        } catch (e) {
            // Silencioso em caso de tabela ainda não existente
        }
        return DEFAULT_GAMIFICATION_RULES[actionKey] || 5;
    },

    /**
     * Adiciona pontos de reputação ao utilizador de forma persistente.
     */
    async earnPoints(userId: string, amount: number, reason: string): Promise<number | null> {
        if (!userId || amount <= 0) return null;

        try {
            // 1. Tentar atualizar via RPC para garantir atomicidade
            const { data, error } = await supabase.rpc('increment_reputation', {
                target_user_id: userId,
                amount: amount
            });

            // 2. Registrar no Log Soberano (Audit Trail)
            await supabase.from('reputation_logs').insert([{ 
                user_id: userId, 
                amount: amount, 
                reason: reason 
            }]);

            if (error) {
                console.warn('MIRA: Erro RPC ao ganhar pontos, tentando update direto:', error);
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('reputation')
                    .eq('id', userId)
                    .single();
                
                const newRep = (profile?.reputation || 0) + amount;
                
                await supabase
                    .from('profiles')
                    .update({ reputation: newRep })
                    .eq('id', userId);
                
                return newRep;
            }

            analytics.track('points_earned', userId, reason, { amount });
            return data;
        } catch (err) {
            console.error('MIRA Gamification Error:', err);
            return null;
        }
    },

    async checkBadges(userId: string): Promise<any[]> {
        if (!userId) return [];
        
        try {
            // 1. Obter medalhas da tabela atómica 'user_badges' com timestamp
            const { data: badgesData, error } = await supabase
                .from('user_badges')
                .select('badge_id, awarded_at')
                .eq('user_id', userId);
            
            if (error) throw error;

            return badgesData?.map(b => ({
                badge_id: b.badge_id,
                awarded_at: b.awarded_at
            })) || [];
        } catch (err) {
            console.error('MIRA: Error checking badges:', err);
            return [];
        }
    },

    /**
     * SOBERANIA V500: Busca a lista mestra de medalhas do disco.
     */
    async fetchAllBadges(): Promise<any[]> {
        // Garantir que as medalhas padrão estão no banco de dados
        await this.bootstrapBadges();

        try {
            const { data, error } = await supabase
                .from('badges')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (error) throw error;

            const badgeMetadata: Record<string, any> = {
                pioneiro:          { icon: 'Star',          icon_emoji: '⭐', category: 'social', rarity_level: 3 },
                verificado:        { icon: 'CheckCircle2',  icon_emoji: '✅', category: 'trust',  rarity_level: 4 },
                sentinela:         { icon: 'ShieldAlert',   icon_emoji: '🛡️', category: 'trust',  rarity_level: 2 },
                mestre_docs:       { icon: 'Bookmark',      icon_emoji: '📚', category: 'help',   rarity_level: 2 },
                curador:           { icon: 'Check',         icon_emoji: '🔍', category: 'trust',  rarity_level: 1 },
                exemplar:          { icon: 'Award',         icon_emoji: '💎', category: 'social', rarity_level: 2 },
                especialista_leis: { icon: 'Book',          icon_emoji: '📖', category: 'help',   rarity_level: 3 },
                mentor_emprego:    { icon: 'Flame',         icon_emoji: '🔥', category: 'help',   rarity_level: 3 },
                coracao:           { icon: 'Heart',         icon_emoji: '❤️', category: 'social', rarity_level: 1 },
            };

            return (data || []).map(b => {
                const meta = badgeMetadata[b.id] || {};
                return {
                    ...b,
                    icon: b.icon || meta.icon || 'Award',
                    icon_emoji: b.icon_emoji || meta.icon_emoji,
                    category: b.category || meta.category || 'social',
                    rarity_level: b.rarity_level || meta.rarity_level || 1
                };
            });
        } catch (err) {
            console.error('MIRA: Error fetching all badges:', err);
            return [];
        }
    },

    /**
     * 🛡️ MIRA BADGES BOOTSTRAP: Garante que todos os selos padrão existem no banco de dados.
     */
    async bootstrapBadges(): Promise<void> {
        const defaultBadges = [
            { id: 'coracao', name: 'Coração da Tribo', description: 'Reputação de nível bronze na ajuda comunitária (10+ pts)', icon_emoji: '❤️', category: 'social', rarity_level: 1 },
            { id: 'curador', name: 'Curador de Conteúdo', description: 'Validou ou sugeriu guias oficiais (50+ pts)', icon_emoji: '🔍', category: 'trust', rarity_level: 1 },
            { id: 'mestre_docs', name: 'Mestre dos Documentos', description: 'Preencheu minutas e formulários úteis (80+ pts)', icon_emoji: '📚', category: 'help', rarity_level: 2 },
            { id: 'exemplar', name: 'Cidadão Exemplar', description: 'Membro com alta reputação de integridade (100+ pts)', icon_emoji: '💎', category: 'social', rarity_level: 2 },
            { id: 'mentor_emprego', name: 'Mentor de Emprego', description: 'Apoiou cidadãos na inserção laboral (120+ pts)', icon_emoji: '🔥', category: 'help', rarity_level: 3 },
            { id: 'sentinela', name: 'Sentinela MIRA', description: 'Ajudou a manter a plataforma livre de spam (150+ pts)', icon_emoji: '🛡️', category: 'trust', rarity_level: 2 },
            { id: 'especialista_leis', name: 'Especialista em Leis', description: 'Prestou esclarecimentos sobre a lei portuguesa (200+ pts)', icon_emoji: '📖', category: 'help', rarity_level: 3 },
            { id: 'pioneiro', name: 'Membro Pioneiro', description: 'Pertence à primeira geração de utilizadores', icon_emoji: '⭐', category: 'social', rarity_level: 3 },
            { id: 'verificado', name: 'Cidadão Verificado', description: 'Conta validada com estatuto de confiança', icon_emoji: '✅', category: 'trust', rarity_level: 4 }
        ];

        for (const badge of defaultBadges) {
            try {
                const { data: existing } = await supabase
                    .from('badges')
                    .select('id')
                    .eq('id', badge.id)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from('badges').insert([badge]);
                }
            } catch (e) {
                console.warn('MIRA Badge Bootstrap warning:', e);
            }
        }
    },

    /**
     * 🛡️ MIRA RETROACTIVE AWARD: Varre todos os utilizadores e atribui selos com base na reputação atual enviando notificações individuais.
     */
    async retroactivelyAwardBadges(): Promise<number> {
        let totalAwarded = 0;
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('id, reputation, is_verified, role');
            
            if (error) throw error;
            if (!profiles) return 0;

            for (const profile of profiles) {
                const rep = profile.reputation || 0;
                const isVerified = profile.is_verified || profile.role === 'admin';
                const newlyAwarded = await this.autoAwardBadges(profile.id, rep, isVerified);
                totalAwarded += newlyAwarded.length;
            }
        } catch (e) {
            console.error('MIRA: retroactivelyAwardBadges error:', e);
        }
        return totalAwarded;
    },

    /**
     * 🛡️ MIRA AUTO-AWARD: Atribui medalhas baseadas em marcos de reputação e envia uma notificação para CADA badge conquistado.
     */
    async autoAwardBadges(userId: string, reputation: number, isVerifiedParam?: boolean): Promise<string[]> {
        if (!userId) return [];
        
        const newBadges: string[] = [];
        
        const milestones = [
            { id: 'pioneiro', threshold: 0, name: 'Membro Pioneiro', icon_emoji: '⭐', always: true },
            { id: 'coracao', threshold: 10, name: 'Coração da Tribo', icon_emoji: '❤️' },
            { id: 'curador', threshold: 50, name: 'Curador de Conteúdo', icon_emoji: '🔍' },
            { id: 'mestre_docs', threshold: 80, name: 'Mestre dos Documentos', icon_emoji: '📚' },
            { id: 'exemplar', threshold: 100, name: 'Cidadão Exemplar', icon_emoji: '💎' },
            { id: 'mentor_emprego', threshold: 120, name: 'Mentor de Emprego', icon_emoji: '🔥' },
            { id: 'sentinela', threshold: 150, name: 'Sentinela MIRA', icon_emoji: '🛡️' },
            { id: 'especialista_leis', threshold: 200, name: 'Especialista em Leis', icon_emoji: '📖' },
            { id: 'verificado', threshold: 0, name: 'Cidadão Verificado', icon_emoji: '✅', requireVerified: true }
        ];

        for (const milestone of milestones) {
            let isEligible = false;
            if (milestone.always) {
                isEligible = true;
            } else if (milestone.requireVerified) {
                isEligible = !!isVerifiedParam;
            } else if (reputation >= milestone.threshold) {
                isEligible = true;
            }

            if (!isEligible) continue;

            try {
                // 1. Inserir na tabela user_badges se ainda não existir
                const { data: existing } = await supabase
                    .from('user_badges')
                    .select('badge_id')
                    .eq('user_id', userId)
                    .eq('badge_id', milestone.id)
                    .maybeSingle();

                if (!existing) {
                    await supabase
                        .from('user_badges')
                        .insert([{ user_id: userId, badge_id: milestone.id }]);
                    newBadges.push(milestone.id);
                    analytics.track('badge_awarded', userId, 'system', { badge_id: milestone.id });
                }

                // 2. Verificar se notificação individual para este selo já foi enviada ao utilizador
                const { data: existingNotifs } = await supabase
                    .from('notifications')
                    .select('id, title, message')
                    .eq('user_id', userId);

                const hasNotif = (existingNotifs || []).some(n => 
                    (n.title && n.title.includes(milestone.name)) || 
                    (n.message && n.message.includes(milestone.name)) ||
                    (n.title && n.title.includes(milestone.icon_emoji))
                );

                if (!hasNotif) {
                    await supabase.from('notifications').insert([{
                        user_id: userId,
                        type: 'social',
                        title: `Selo Conquistado! ${milestone.icon_emoji}`,
                        message: `Parabéns! Conquistaste o selo "${milestone.name}".`,
                        is_read: false,
                        link: '/profile',
                        created_at: new Date().toISOString()
                    }]);
                }
            } catch (e) {
                console.error(`MIRA: Error awarding badge ${milestone.id}:`, e);
            }
        }

        return newBadges;
    }
};
