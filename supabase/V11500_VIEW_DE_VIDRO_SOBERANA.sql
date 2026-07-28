-- 💎 MIRA V2026.GOLD: VIEW DE VIDRO SOBERANA
-- Bypass total de RLS para transparência administrativa nuclear

DROP VIEW IF EXISTS admin_glass_view_reports;

CREATE VIEW admin_glass_view_reports AS
SELECT 
    cr.id,
    cr.created_at,
    cr.target_type,
    cr.target_id,
    cr.reason,
    cr.status,
    p_offender.name as offender_name,
    p_offender.email as offender_email,
    p_offender.avatar_url as offender_avatar,
    CASE 
        WHEN cr.target_type = 'POST' THEN (SELECT content FROM posts WHERE id = cr.target_id)
        WHEN cr.target_type = 'COMMENT' THEN (SELECT content FROM comments WHERE id = cr.target_id)
        ELSE 'Conteúdo não localizado ou removido'
    END as reported_content_text
FROM community_reports cr
LEFT JOIN profiles p_offender ON cr.offender_id = p_offender.id
ORDER BY cr.created_at DESC;

-- 👑 RPC SOBERANA: GET REPORTS (Bypass RLS)
CREATE OR REPLACE FUNCTION get_community_reports_json_sovereign()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial: corre como owner
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(r))
        FROM admin_glass_view_reports r
    );
END;
$$;

-- 🛡️ ATUALIZAÇÃO DE STATS
CREATE OR REPLACE FUNCTION get_admin_counts_sovereign()
RETURNS TABLE (
    courses JSONB,
    services JSONB,
    users INT,
    jobs JSONB,
    reports INT,
    suggestions INT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY SELECT 
        jsonb_build_object('db', (SELECT count(*) FROM courses), 'prot', 20),
        jsonb_build_object('db', (SELECT count(*) FROM map_alerts), 'prot', 50),
        (SELECT count(*) FROM profiles)::INT,
        jsonb_build_object('db', (SELECT count(*) FROM job_posts), 'prot', 10),
        (SELECT count(*) FROM community_reports)::INT,
        (SELECT count(*) FROM admin_suggestions_view)::INT;
END;
$$;

-- ✅ Auditoria de especialistas na View de Vidro
CREATE OR REPLACE FUNCTION get_experts_json_sovereign()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(row_to_json(p))
        FROM (
            SELECT id, name, email, avatar_url, role, points, is_verified, reputation
            FROM profiles
            WHERE role = 'expert' OR role = 'admin'
            ORDER BY points DESC
        ) p
    );
END;
$$;
