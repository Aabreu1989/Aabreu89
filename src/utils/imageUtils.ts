
/**
 * Helper to get image URL from Supabase Storage or fallback to a safe URL.
 * Supports both path-only (e.g., 'avatars/user.png') and full URLs.
 */
export const getImageUrl = (pathOrUrl: string, width = 800) => {
    if (!pathOrUrl) return '';
    
    // Handle full URLs (external sources like Unsplash)
    if (pathOrUrl.startsWith('http')) {
        // Optimize Unsplash images for WebP and performance
        if (pathOrUrl.includes('unsplash.com')) {
            const separator = pathOrUrl.includes('?') ? '&' : '?';
            // Force WebP, specific width, and high compression (q=80)
            if (!pathOrUrl.includes('fm=')) {
                return `${pathOrUrl}${separator}fm=webp&q=80&w=${width}&fit=crop`;
            }
        }
        return pathOrUrl;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
        // Return a beautiful diverse community placeholder if Supabase is not configured
        return `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=${width}&q=80&fm=webp`;
    }

    // Format for Supabase Storage
    return `${supabaseUrl}/storage/v1/object/public/${pathOrUrl}`;
};
