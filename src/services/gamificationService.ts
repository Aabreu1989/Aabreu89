
import { supabase } from '../lib/supabase';
import { analytics } from './analyticsService';
import { syncService } from './syncService';
import { BadgeId, BadgeRegistryItem, UserBadgeConcession } from '../types';

/**
 * 🏆 MIRA V2026.GOLD — CATÁLOGO SOBERANO ÚNICO
 * Esta é a única fonte de verdade do catálogo oficial.
 * Nenhum componente, serviço ou query pode definir uma lista alternativa.
 * guia_local: incluído no catálogo, sem gatilho ativo até o módulo de mapa existir.
 */
export const CANONICAL_12 = [
    'pioneiro',
    'coracao',
    'curador',
    'mestre_docs',
    'exemplar',
    'mentor_emprego',
    'sentinela',
    'especialista_leis',
    'verificado',
    'voz_autoridade',
    'escudo_anti_burla',
    'guia_local',
] as const;

export type CanonicalBadgeId = typeof CANONICAL_12[number];

export const DEFAULT_GAMIFICATION_RULES: Record<string, number> = {
    publish_post: 10,
    add_comment: 5,
    like_given: 1,
    like_received: 2,
    vote_true: 3,
    vote_fake: 3,
    follow_user: 2,
    report_content: 1,
    curate_guide: 15,
    // 🚀 NOVAS REGRAS CANÓNICAS CROSS-MODULE (2026)
    simulator_completed: 10,
    job_viewed: 5,
    service_viewed: 10,
    chat_daily_query: 5
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
     * Autoridade soberana de validação, cálculo e idempotência reside no backend (/api/community).
     */
    async earnPoints(userId: string, actionKeyOrAmount: string | number, reason?: string, entityId?: string): Promise<number | null> {
        if (!userId) return null;

        const actionKey = typeof actionKeyOrAmount === 'string' ? actionKeyOrAmount : (reason || 'publish_post');
        const reasonText = reason || `Ação: ${actionKey}`;

        // 🛡️ TRAVA DE OTIMIZAÇÃO DE UX (Client Lock): Evita requests redundantes
        try {
            const lisbonDate = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Europe/Lisbon',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date());

            let clientLockKey = `mira_xp_${userId}_${actionKey}`;
            if (actionKey === 'chat_daily_query') {
                clientLockKey = `mira_xp_${userId}_chat_${lisbonDate}`;
            } else if (actionKey === 'simulator_completed') {
                clientLockKey = `mira_xp_${userId}_sim_${entityId || 'salary'}_${lisbonDate}`;
            } else if (entityId) {
                clientLockKey = `mira_xp_${userId}_${actionKey}_${entityId}`;
            }

            const lastAwarded = localStorage.getItem(clientLockKey) || sessionStorage.getItem(clientLockKey);
            if (lastAwarded) {
                // Já registrado localmente hoje/sessão
                return null;
            }
            localStorage.setItem(clientLockKey, new Date().toISOString());
        } catch (e) {}

        try {
            // Verificar token de sessão
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;

            if (!token) {
                console.warn('MIRA: Sessão não encontrada ao atribuir pontos.');
                return null;
            }

            // Invocar Gateway soberano de comunidade (/api/community)
            const response = await fetch('/api/community', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'earn_points',
                    actionKey: actionKey,
                    reason: reasonText,
                    entityId: entityId || null
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('🚨 [MIRA Gamification] Erro ao atribuir pontos no Gateway:', errData.error || response.statusText);
                return null;
            }

            const data = await response.json();
            if (data.success && typeof data.reputation === 'number') {
                if (data.pointsEarned > 0) {
                    analytics.track('points_earned', userId, reasonText, { pointsEarned: data.pointsEarned });
                }
                return data.reputation;
            }

            return null;
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
                coracao:           { icon: 'Heart',         icon_emoji: '❤️', category: 'social', rarity_level: 1 },
                curador:           { icon: 'Check',         icon_emoji: '🔍', category: 'trust',  rarity_level: 1 },
                mestre_docs:       { icon: 'Bookmark',      icon_emoji: '📚', category: 'help',   rarity_level: 2 },
                exemplar:          { icon: 'Award',         icon_emoji: '💎', category: 'social', rarity_level: 2 },
                mentor_emprego:    { icon: 'Flame',         icon_emoji: '🔥', category: 'help',   rarity_level: 3 },
                sentinela:         { icon: 'ShieldAlert',   icon_emoji: '🛡️', category: 'trust',  rarity_level: 2 },
                especialista_leis: { icon: 'Scale',         icon_emoji: '⚖️', category: 'help',   rarity_level: 3 },
                verificado:        { icon: 'CheckCircle2',  icon_emoji: '✅', category: 'trust',  rarity_level: 4 },
                voz_autoridade:    { icon: 'Zap',           icon_emoji: '🎙️', category: 'help',   rarity_level: 3 },
                escudo_anti_burla: { icon: 'ShieldCheck',   icon_emoji: '🔰', category: 'trust',  rarity_level: 4 },
                guia_local:        { icon: 'MapPin',        icon_emoji: '🗺️', category: 'social', rarity_level: 2 },
            };

            const canonicalSet = new Set<string>(CANONICAL_12);
            return (data || [])
                .filter(b => canonicalSet.has(b.id))
                .map(b => {
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
     * 🛡️ MIRA BADGES BOOTSTRAP V2026.GOLD: Garante que os 12 selos canónicos existem no banco de dados.
     */
    async bootstrapBadges(): Promise<void> {
        const defaultBadges = [
            { id: 'pioneiro',           name: 'Membro Pioneiro',       description: 'Pertence à primeira geração de utilizadores do MIRA',                            icon_emoji: '⭐', category: 'social', rarity_level: 3 },
            { id: 'coracao',            name: 'Coração da Tribo',      description: 'Reputação de ajuda comunitária generosa na tribo MIRA',                         icon_emoji: '❤️', category: 'social', rarity_level: 1 },
            { id: 'curador',            name: 'Curador de Conteúdo',   description: 'Publicou guias informativos de elevadíssima utilidade pública',                  icon_emoji: '🔍', category: 'trust',  rarity_level: 1 },
            { id: 'mestre_docs',        name: 'Mestre dos Documentos', description: 'Preencheu minutas e assistentes documentais com sucesso',                        icon_emoji: '📚', category: 'help',   rarity_level: 2 },
            { id: 'exemplar',           name: 'Cidadão Exemplar',      description: 'Membro altamente ativo nas avaliações de veracidade',                            icon_emoji: '💎', category: 'social', rarity_level: 2 },
            { id: 'mentor_emprego',     name: 'Mentor de Emprego',     description: 'Apoiou candidatos na integração no mercado de trabalho português',               icon_emoji: '🔥', category: 'help',   rarity_level: 3 },
            { id: 'sentinela',          name: 'Sentinela MIRA',        description: 'Atuação constante na manutenção da qualidade da comunidade',                     icon_emoji: '🛡️', category: 'trust',  rarity_level: 2 },
            { id: 'especialista_leis',  name: 'Especialista em Leis',  description: 'Esclareceu legislação de estrangeiros e direito português com rigor',            icon_emoji: '⚖️', category: 'help',   rarity_level: 3 },
            { id: 'verificado',         name: 'Cidadão Verificado',    description: 'Conta com identidade pessoalmente validada pela equipa MIRA',                   icon_emoji: '✅', category: 'trust',  rarity_level: 4 },
            { id: 'voz_autoridade',     name: 'Voz de Autoridade',     description: 'Alcançou 500+ pontos de reputação e autoridade na comunidade',                  icon_emoji: '🎙️', category: 'help',   rarity_level: 3 },
            { id: 'escudo_anti_burla',  name: 'Escudo Anti-Burla',     description: 'Denunciador verificado de esquemas e fraudes de agendamento AIMA',              icon_emoji: '🔰', category: 'trust',  rarity_level: 4 },
            { id: 'guia_local',         name: 'Guia Local',            description: 'Contribuiu com avaliações de serviços locais de apoio ao imigrante',            icon_emoji: '🗺️', category: 'social', rarity_level: 2 },
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
            { id: 'pioneiro',          threshold: 0,   name: 'Membro Pioneiro',      icon_emoji: '⭐', always: true },
            { id: 'coracao',           threshold: 10,  name: 'Coração da Tribo',     icon_emoji: '❤️' },
            { id: 'curador',           threshold: 50,  name: 'Curador de Conteúdo',  icon_emoji: '🔍' },
            { id: 'mestre_docs',       threshold: 80,  name: 'Mestre dos Documentos',icon_emoji: '📚' },
            { id: 'exemplar',          threshold: 100, name: 'Cidadão Exemplar',     icon_emoji: '💎' },
            { id: 'mentor_emprego',    threshold: 120, name: 'Mentor de Emprego',    icon_emoji: '🔥' },
            { id: 'sentinela',         threshold: 150, name: 'Sentinela MIRA',       icon_emoji: '🛡️' },
            { id: 'especialista_leis', threshold: 200, name: 'Especialista em Leis', icon_emoji: '⚖️' },
            { id: 'voz_autoridade',    threshold: 500, name: 'Voz de Autoridade',    icon_emoji: '🎙️' },
            { id: 'verificado',        threshold: 0,   name: 'Cidadão Verificado',   icon_emoji: '✅', requireVerified: true },
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
