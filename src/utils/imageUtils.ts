// Coleção oficial de backgrounds de alta resolução para a Comunidade MIRA
export const COMMUNITY_FALLBACK_BACKGROUNDS = [
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
    "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80",
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80",
    "https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80",
    "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80",
    "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80",
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
];

/**
 * Helper to get image URL from Supabase Storage, local paths, or fallback safely.
 */
export const getImageUrl = (pathOrUrl?: string | null, width = 800): string => {
    if (!pathOrUrl || typeof pathOrUrl !== 'string' || pathOrUrl.trim() === '') return '';
    
    const trimmed = pathOrUrl.trim();

    // Handle local absolute/relative assets (e.g., '/mira-icon.png')
    if (trimmed.startsWith('/')) {
        return trimmed;
    }

    // Handle full URLs (external sources like Unsplash)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        if (trimmed.includes('unsplash.com')) {
            const separator = trimmed.includes('?') ? '&' : '?';
            if (!trimmed.includes('fm=')) {
                return `${trimmed}${separator}fm=webp&q=80&w=${width}&fit=crop`;
            }
        }
        return trimmed;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
        return `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=${width}&q=80&fm=webp`;
    }

    // Format for Supabase Storage
    return `${supabaseUrl}/storage/v1/object/public/${trimmed}`;
};

/**
 * 🛡️ Helper soberano para background de posts: NUNCA retorna string vazia.
 * Se o post não tiver imagem anexada, retorna um background determinístico baseado no ID/seed.
 */
export const getPostBackgroundImage = (pathOrUrl?: string | null, seed?: string, width = 800): string => {
    const resolved = getImageUrl(pathOrUrl, width);
    if (resolved && resolved !== '') return resolved;

    // Fallback determinístico baseado no seed (ex: post.id)
    if (seed && typeof seed === 'string') {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % COMMUNITY_FALLBACK_BACKGROUNDS.length;
        return COMMUNITY_FALLBACK_BACKGROUNDS[index];
    }

    return COMMUNITY_FALLBACK_BACKGROUNDS[0];
};
