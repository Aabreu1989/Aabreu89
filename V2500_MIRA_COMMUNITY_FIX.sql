-- 👑 MIRA V2500 - SOBERANIA COMUNITÁRIA IMACULADA 👑
-- O "CEMITÉRIO" FOI LIMPO. Execute isto no Supabase SQL Editor.

BEGIN;

-- 1. Eliminamos as versões obsoletas
DROP FUNCTION IF EXISTS public.get_sovereign_community_feed_v24(integer, integer);

-- 2. Recriamos a função limpa, sem invocar "r.metadata" na contagem de reports!
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v24(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    background_image TEXT, is_verified BOOLEAN, validation_status TEXT,
    urgency INT, created_at TIMESTAMPTZ, translations JSONB,
    likes INT, reports INT, nobel_score INT,
    author JSONB, comments JSONB, post_votes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.background_image, p.is_verified, p.validation_status,
        p.urgency, p.created_at, p.translations, p.likes,
        
        -- 🔥 FIX ABSOLUTO: Contagem simplificada de reports s/ r.metadata
        (SELECT COUNT(*)::INT FROM public.reports r WHERE r.post_id = p.id),
        
        p.nobel_score,
        
        -- Autor
        jsonb_build_object(
            'name', prof.name, 'avatar_url', prof.avatar_url,
            'bio', prof.bio, 'badges', prof.badges, 'is_verified', prof.is_verified,
            'followers_count', prof.followers_count, 'following_count', prof.following_count
        ) as author,
        
        -- Comentários
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'created_at', c.created_at,
                'author_id', c.author_id, 'likes', c.likes, 'parent_id', c.parent_id,
                'translations', c.translations,
                'author', jsonb_build_object('name', cauth.name, 'avatar_url', cauth.avatar_url, 'is_verified', cauth.is_verified)
            )) FROM public.comments c 
             JOIN public.profiles cauth ON c.author_id = cauth.id
             WHERE c.post_id = p.id), '[]'::jsonb
        ) as comments,
        
        -- Votos
        COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('user_id', v.user_id, 'vote_type', v.vote_type)) 
             FROM public.post_votes v WHERE v.post_id = p.id), '[]'::jsonb
        ) as post_votes
        
    FROM public.posts p
    JOIN public.profiles prof ON p.author_id = prof.id
    WHERE p.validation_status != 'blocked'
    ORDER BY p.is_verified DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar o cache REST
NOTIFY pgrst, 'reload schema';

COMMIT;
