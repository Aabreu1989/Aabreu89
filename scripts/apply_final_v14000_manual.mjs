/**
 * 👑 MIRA V2026.GOLD: FINAL PRODUCTION STABILIZATION (V14000)
 * AUTHOR: Antigravity (Advanced Agentic Assistant)
 * 
 * DESCRIPTION:
 * This script prepares the SQL migration for final platform stability.
 * Since the execute_sql RPC may be missing in some environments, 
 * copy the SQL below and run it in the Supabase Dashboard SQL Editor.
 */

const SQL_MIGRATION = `
-- 🛡️ MIRA V2026.GOLD: FINAL PRODUCTION STABILIZATION
BEGIN;

-- [1] REPARAR FEED SOBERANO (Interações Persistentes)
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v10000(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID, author_id UUID, title TEXT, content TEXT, category TEXT,
    is_verified BOOLEAN, validation_status TEXT, created_at TIMESTAMPTZ,
    likes_count INT, useful_count INT, fake_count INT, reports_count INT,
    nobel_score INT, translations JSONB, author_data JSONB, comments_data JSONB,
    post_votes JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH current_votes AS (
        SELECT v.post_id,
               COUNT(*) FILTER (WHERE v.vote_type = 'like')::INT as l,
               COUNT(*) FILTER (WHERE v.vote_type = 'useful')::INT as u,
               COUNT(*) FILTER (WHERE v.vote_type = 'fake')::INT as f,
               jsonb_agg(jsonb_build_object('user_id', v.user_id, 'vote_type', v.vote_type)) as all_votes
        FROM public.post_votes v GROUP BY v.post_id
    ),
    current_reports AS (
        SELECT r.post_id, COUNT(*)::INT as rep_count FROM public.reports r GROUP BY r.post_id
    )
    SELECT 
        p.id, p.author_id, p.title, p.content, p.category,
        p.is_verified, p.validation_status, p.created_at,
        COALESCE(cv.l, 0), COALESCE(cv.u, 0), COALESCE(cv.f, 0), COALESCE(cr.rep_count, 0),
        COALESCE(ns.calculated_nobel_score, 0)::INT, p.translations,
        jsonb_build_object(
            'name', COALESCE(prof.username, SPLIT_PART(prof.email, '@', 1), 'Membro'),
            'avatar_url', COALESCE(prof.avatar_url, ''),
            'level', COALESCE(prof.level, 1),
            'is_verified', COALESCE(prof.is_verified, false),
            'followers_count', COALESCE(prof.followers_count, 0),
            'following_count', COALESCE(prof.following_count, 0)
        ),
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', c.id, 'content', c.content, 'author_name', COALESCE(cp.username, 'Membro'),
                'author_avatar', COALESCE(cp.avatar_url, ''),
                'author_id', c.author_id,
                'created_at', c.created_at, 'likes', c.likes
            )) FROM public.comments c LEFT JOIN public.profiles cp ON c.author_id = cp.id WHERE c.post_id = p.id
        ), '[]'::jsonb),
        COALESCE(cv.all_votes, '[]'::jsonb)
    FROM public.posts p
    LEFT JOIN public.profiles prof ON p.author_id = prof.id
    LEFT JOIN current_votes cv ON cv.post_id = p.id
    LEFT JOIN current_reports cr ON cr.post_id = p.id
    LEFT JOIN public.community_top_stories_nobel ns ON p.id = ns.id
    WHERE p.validation_status IS DISTINCT FROM 'blocked'
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- [2] MOTOR DE BUSCA SOBERANO (RE-CALIBRADO COM VAGAS)
CREATE OR REPLACE FUNCTION public.match_knowledge_sovereign_v2026 (
  query_embedding vector(768) DEFAULT NULL,
  match_threshold float DEFAULT 0.18, 
  match_count int DEFAULT 8,
  query_text text DEFAULT ''
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float
) language plpgsql STABLE as $$
begin
  IF query_embedding IS NOT NULL THEN
    return query select 
      res.id, res.topic, res.content, res.category, res.similarity,
      (res.similarity * res.prestige) as weighted_score
    from (
      select s.id, s.topic, s.content, s.category::text, (1 - (s.embedding <=> query_embedding)) as similarity, 
      (CASE WHEN s.category = 'diretrizes_ceo' THEN 1.6 ELSE 1.2 END) as prestige 
      from public.saber_ia s where s.embedding is not null
      union all
      select p.id, p.title as topic, p.content, p.category::text, (1 - (p.embedding <=> query_embedding)) as similarity, 1.4 as prestige 
      from public.posts p where p.embedding is not null
      union all
      select j.id, j.title as topic, (COALESCE(j.location, 'Portugal') || ' | ' || COALESCE(j.source_name, 'MIRA')) as content, 'trabalho_seg_social'::text as category, (1 - (j.embedding <=> query_embedding)) as similarity, 1.1 as prestige 
      from public.job_posts j where j.embedding is not null
    ) as res 
    where res.similarity >= match_threshold 
    order by weighted_score desc limit match_count;
  ELSE
    return query select 
      s.id, s.topic, s.content, s.category::text, 1.0 as similarity, 1.0 as weighted_score 
    from public.saber_ia s
    where (query_text = '' OR unaccent(s.content) ILIKE unaccent('%' || query_text || '%'))
    order by (case when s.category = 'diretrizes_ceo' then 100000 else 1000 end) desc limit match_count;
  END IF;
end; $$;

-- [3] VIEWS DE MODERAÇÃO ADMINISTRATIVA
DROP VIEW IF EXISTS public.admin_reports_view CASCADE;
CREATE OR REPLACE VIEW public.admin_reports_view AS
SELECT 
    r.*, 
    p_off.name as offender_name, 
    p_off.avatar_url as offender_avatar,
    p_rep.name as reporter_name,
    COALESCE(post.content, comm.content, r.reported_content_text) as reported_content_text_full
FROM public.reports r
LEFT JOIN public.profiles p_off ON r.offender_id = p_off.id
LEFT JOIN public.profiles p_rep ON r.reporter_id = p_rep.id
LEFT JOIN public.posts post ON r.post_id = post.id::text
LEFT JOIN public.comments comm ON r.comment_id = comm.id::text;

GRANT SELECT ON public.admin_reports_view TO authenticated, service_role;

COMMIT;
`;

console.log("--- COPY SQL START ---");
console.log(SQL_MIGRATION);
console.log("--- COPY SQL END ---");
