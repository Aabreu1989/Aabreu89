-- ============================================================
-- 🧩 MIRA V2026: PILLAR 002 - VECTOR ENGINE
-- Semantic Search infrastructure and HNSW Indices
-- ============================================================

-- 1. Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding columns (Idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='embedding') THEN
        ALTER TABLE public.posts ADD COLUMN embedding vector(768);
    END IF;
END $$;

-- 3. HNSW PERFORMANCE INDEXES (768-D text-embedding-004)
-- Optimized for Cosine Similarity
CREATE INDEX IF NOT EXISTS idx_posts_semantic ON public.posts USING hnsw (embedding vector_cosine_ops);

-- Note: Indexes for saber_ia and courses will be created in their respective pillar files 
-- to ensure the tables exist before indexing.
