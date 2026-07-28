-- ============================================================
-- 🦾 MIRA V2026: PILLAR 012 - IMPERIAL CONTENT INJECTION
-- Newsroom Table | Automatic RAG Integration | Golden Rules
-- ============================================================

-- 1. INFRAESTRUTURA DE ARTIGOS (NEWSROOM)
CREATE TABLE IF NOT EXISTS public.newsroom_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Guia',
    embedding vector(768), -- Motor Nobel 768-D
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INJEÇÃO DAS 4 REGRAS DE OURO NA KNOWLEDGE_BASE (SABER IA)
-- MIRA V2026: Sincronização com o DNA da CEO
INSERT INTO public.knowledge_base (category, topic, content, metadata)
VALUES 
('Soberania', 'Pasta de Ouro', 'O sucesso do imigrante começa na organização. Digitaliza tudo, guarda os originais em micas. A MIRA não salva apenas dados, salva o teu futuro.', '{"expert": "CEO Amanda Abreu", "priority": 1, "source": "Imperial Injection"}'),
('Soberania', 'A Língua é a Chave', 'Não fiques na bolha. Aprende Português no módulo Academy. Quem fala a língua ganha o dobro e é respeitado o triplo.', '{"expert": "CEO Amanda Abreu", "priority": 1, "source": "Imperial Injection"}'),
('Soberania', 'Zero Atalhos', 'Quem tenta comprar o caminho (venda de agendamentos) acaba deportado. Usa apenas os canais oficiais.', '{"expert": "CEO Amanda Abreu", "priority": 1, "source": "Imperial Injection"}'),
('Soberania', 'A Tribo MIRA', 'A solidão mata. Na comunidade, onde um cai, dez levantam. Participa e ganha reputação.', '{"expert": "CEO Amanda Abreu", "priority": 1, "source": "Imperial Injection"}')
ON CONFLICT (topic) DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata;

-- 3. INJEÇÃO DO MANUAL SIMPLIFICADO
INSERT INTO public.newsroom_articles (title, slug, content, category)
VALUES (
    'Manual Simplificado do WebApp MIRA',
    'manual-simplificado-mira',
    'Bem-vindo ao teu novo império de integração. O MIRA foi desenhado para que nunca te sintas perdido em Portugal. Aqui está como cada braço do sistema trabalha para ti: 1. MIRA Chat: O teu cérebro de apoio. 2. Comunidade: A tua tribo. 3. Vagas: O teu futuro profissional. 4. Academy: O teu crescimento (Cursos IEFP). 5. Documentos: A tua organização. 6. Serviços: O teu suporte físico.',
    'Newsroom Imperial'
) ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content, category = 'Newsroom Imperial';

-- 4. UNIFICAÇÃO DE CATEGORIAS (FUSION)
UPDATE public.newsroom_articles SET category = 'Newsroom Imperial' WHERE category IN ('Guia Oficial', 'Newsroom', 'Guia Imperial');

-- 5. PERMISSÕES E SEGURANÇA
ALTER TABLE public.newsroom_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Newsroom" ON public.newsroom_articles;
CREATE POLICY "Public Read Newsroom" ON public.newsroom_articles FOR SELECT USING (true);

-- 5. UPGRADE DO MOTOR RAG (match_knowledge_global_v4)
-- O MIRA agora pesquisa no Conhecimento e na Newsroom simultaneamente
CREATE OR REPLACE FUNCTION public.match_knowledge_global_v4(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  topic text,
  content text,
  category text,
  similarity float,
  source_table text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 
      kb.id, 
      kb.topic, 
      kb.content, 
      kb.category, 
      1 - (kb.embedding <=> query_embedding) AS similarity,
      'knowledge_base' as source_table
    FROM public.knowledge_base kb
    WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
    
    UNION ALL
    
    SELECT 
      nr.id, 
      nr.title as topic, 
      nr.content, 
      nr.category, 
      1 - (nr.embedding <=> query_embedding) AS similarity,
      'newsroom_articles' as source_table
    FROM public.newsroom_articles nr
    WHERE 1 - (nr.embedding <=> query_embedding) > match_threshold
  )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE public.newsroom_articles IS 'MIRA V2026: Centro de Conhecimento e Newsroom da CEO.';
