import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const query = `
-- 👑 MIRA V2026.GOLD: FINAL PRODUCTION STABILIZATION (V14000)
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

-- [2] INFRAESTRUTURA DE VAGAS (RAG)
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS embedding vector(768);

-- [3] MOTOR DE BUSCA SOBERANO (RE-CALIBRADO COM VAGAS)
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
      -- P1: Saber IA (Soberania Amanda)
      select s.id, s.topic, s.content, s.category::text, (1 - (s.embedding <=> query_embedding)) as similarity, 
      (CASE WHEN s.category = 'diretrizes_ceo' THEN 1.6 ELSE 1.2 END) as prestige 
      from public.saber_ia s where s.embedding is not null
      
      union all
      
      -- P2: Posts da Tribo (Hacks)
      select p.id, p.title as topic, p.content, p.category::text, (1 - (p.embedding <=> query_embedding)) as similarity, 1.4 as prestige 
      from public.posts p where p.embedding is not null
      
      union all
      
      -- P3: Vagas Estratégicas (NOVO)
      -- Usamos o ID original preservado (mapeado para UUID se necessário)
      select md5(j.id)::uuid as id, j.title as topic, (COALESCE(j.location, 'Portugal') || ' | ' || COALESCE(j.source_name, 'MIRA')) as content, 'trabalho_seg_social'::text as category, (1 - (j.embedding <=> query_embedding)) as similarity, 1.1 as prestige 
      from public.job_posts j where j.embedding is not null
    ) as res 
    where res.similarity >= match_threshold 
    order by weighted_score desc limit match_count;
  ELSE
    -- Fallback textual
    return query select 
      s.id, s.topic, s.content, s.category::text, 1.0 as similarity, 1.0 as weighted_score 
    from public.saber_ia s
    where (query_text = '' OR unaccent(s.content) ILIKE unaccent('%' || query_text || '%'))
    order by (case when s.category = 'diretrizes_ceo' then 100000 else 1000 end) desc limit match_count;
  END IF;
end; $$;

-- [4] GARANTIR SOBERANIA 100K 
UPDATE public.profiles SET sovereignty_score = 100000, role = 'admin' WHERE email = 'amandasabreu89@gmail.com';

COMMIT;
`;

async function apply() {
    console.log("🚀 MIRA Soberana: Aplicando Estabilização Final V14000...");
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
        console.error("❌ ERRO AO APLICAR MIGRAÇÃO:", error.message);
        // If execute_sql RPC doesn't exist, we might need a different approach
        if (error.message.includes('execute_sql')) {
            console.log("ℹ️ RPC execute_sql not found. This requires manual execution or a custom Edge Function.");
        }
    } else {
        console.log("✅ PRODUÇÃO ESTABILIZADA: V14000 aplicada com sucesso.");
    }
}

apply();
