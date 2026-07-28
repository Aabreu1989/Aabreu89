-- 🚀 MIRA PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_job_posts_created_at ON job_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_posts_location ON job_posts (location);
CREATE INDEX IF NOT EXISTS idx_job_posts_work_topic ON job_posts (work_topic);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_reports ON posts (reports) WHERE reports > 0;
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base (category);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles (reputation DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
ANALYZE job_posts;
ANALYZE posts;
ANALYZE profiles;
