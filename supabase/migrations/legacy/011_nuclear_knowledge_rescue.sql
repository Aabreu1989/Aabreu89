-- ============================================================
-- 🦾 MIRA V2026: PILLAR 011 - NUCLEAR KNOWLEDGE RESCUE
-- Unified RAG Sync | CEO Alignment | Nobel 768-D
-- ============================================================

-- 1. INFRAESTRUTURA DE VETORES (768-D)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. UNIFICAÇÃO DA BASE DE CONHECIMENTO (Idempotente)
-- Garantindo que a estrutura do Resgate Nuclear seja respeitada
DO $$ 
BEGIN 
    -- Se a tabela não existe, criar conforme o Resgate
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='knowledge_base') THEN
        CREATE TABLE public.knowledge_base (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category TEXT NOT NULL,
            topic TEXT NOT NULL,
            content TEXT NOT NULL,
            url TEXT,
            metadata JSONB DEFAULT '{}'::jsonb,
            embedding vector(768),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Se existe, ajustar restrições para conformidade total
        ALTER TABLE public.knowledge_base ALTER COLUMN category SET NOT NULL;
        ALTER TABLE public.knowledge_base ALTER COLUMN topic SET NOT NULL;
        ALTER TABLE public.knowledge_base ALTER COLUMN content SET NOT NULL;
        
        -- Verificar Motor Nobel 768-D
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_base' AND column_name='embedding') THEN
            ALTER TABLE public.knowledge_base ADD COLUMN embedding vector(768);
        END IF;
    END IF;
END $$;

-- 3. PERMISSÕES DE SOBERANIA (Public Read)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar colisões no Sync
DROP POLICY IF EXISTS "Public Read Access" ON public.knowledge_base;
DROP POLICY IF EXISTS "Public KB viewable by everyone" ON public.knowledge_base;

-- Nova política unificada
CREATE POLICY "Public Read Access" ON public.knowledge_base FOR SELECT USING (true);

-- 4. ÍNDICE HNSW PARA BUSCA SEMÂNTICA (Ouro)
CREATE INDEX IF NOT EXISTS idx_kb_semantic_sovereign ON public.knowledge_base USING hnsw (embedding vector_cosine_ops);

-- 5. NOTIFICAR SUCESSO DO RESGATE
DO $$ BEGIN RAISE NOTICE 'MIRA: Resgate Nuclear Concluído. Pasta de Ouro Sincronizada! 🛡️'; END $$;
