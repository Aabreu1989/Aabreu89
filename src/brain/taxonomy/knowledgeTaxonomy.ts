/**
 * 👑 MIRA SOVEREIGN TAXONOMY (Source of Truth)
 * ------------------------------------------------------------
 * This file defines the 7-node knowledge taxonomy for the RAG engine.
 * STRICTLY ALIGNED WITH SQL ENUM: knowledge_category (V68.1)
 * ------------------------------------------------------------
 */

export const SABER_IA_TAXONOMY = [
    { 
        key: 'diretrizes_ceo', 
        label: '👑 Diretrizes CEO', 
        description: 'Ordens diretas e visão estratégica da Amanda Abreu.',
        weight: 100000 
    },
    { 
        key: 'vistos_aima', 
        label: '🛂 Vistos AIMA & Legislação', 
        description: 'Dados oficiais sobre regularização e leis migratórias.',
        weight: 50000 
    },
    { 
        key: 'saude_sns', 
        label: '🏥 Saúde SNS', 
        description: 'Informação oficial do Serviço Nacional de Saúde.',
        weight: 5000 
    },
    { 
        key: 'trabalho_seg_social', 
        label: '💼 Trabalho & Seg. Social', 
        description: 'Direitos laborais e proteção social (Segurança Social).',
        weight: 5000 
    },
    { 
        key: 'habitacao_nif', 
        label: '🏠 Habitação & NIF', 
        description: 'Arrendamento, compra de casa e obrigações fiscais.',
        weight: 5000 
    },
    { 
        key: 'hacks_da_tribo', 
        label: '🔥 Hacks da Tribo', 
        description: 'Dicas táticas e experiências validadas pela elite da tribo.',
        weight: 15000 
    },
    { 
        key: 'acolhimento_e_apoio', 
        label: '🤝 Apoio Social & Especialistas', 
        description: 'Assistência humanitária e pareceres técnicos de especialistas.',
        weight: 5000 
    }
];

export type SaberIACategory = typeof SABER_IA_TAXONOMY[number];

/**
 * Helper to get label by technical key
 */
export const getTaxonomyLabel = (key: string): string => {
    return SABER_IA_TAXONOMY.find(cat => cat.key === key)?.label || key;
};
