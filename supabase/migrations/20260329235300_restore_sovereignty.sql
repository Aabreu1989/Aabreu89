-- 💎 MIRA V2026.GOLD: RESTAURAÇÃO DE SOBERANIA (REPAIR V60.5) 💎
-- ------------------------------------------------------------
-- FUNÇÃO: Correção de Negligência Sintática e Estrutural
-- ALVO: Tabela public.profiles, saber_ia, posts, knowledge_base
-- STATUS: CRÍTICO EXTREMO (100K AMANDA ABREU)
-- ------------------------------------------------------------

-- [1] RESTAURE SOBERANIA (COLUNA PROFprofiles)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sovereignty_score INT DEFAULT 0;

-- [2] ATRIBUIÇÃO DE AUTORIDADE MÁXIMA
UPDATE public.profiles SET sovereignty_score = 100000 WHERE email = 'amandasabreu89@gmail.com';

-- [3] RESTAURE INTELIGÊNCIA VETORIAL (EMBEDDINGS)
-- Nota: Requer extensão 'vector' ativa
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.saber_ia ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- [4] RESTAURE CACHE DE TRADUÇÃO
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS translations jsonb DEFAULT '{}';

-- [5] VERIFICAÇÃO FINAL
SELECT '✅ SOBERANIA COMPLETADA COM SUCESSO' as status;
