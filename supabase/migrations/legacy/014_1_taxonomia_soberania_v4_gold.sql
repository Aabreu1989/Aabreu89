-- ============================================================
-- 🦾 MIRA V2026: PILLAR 014.1 - TAXONOMIA DE SOBERANIA (V4 GOLD)
-- CEO: Amanda Abreu | Motor Nobel 768-D
-- ============================================================

-- 1. BLINDAGEM DA TABELA SABER IA (As 8 Categorias Obrigatórias)
DO $$ 
BEGIN 
    -- Garante que a coluna category existe antes de aplicar a restrição
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saber_ia' AND column_name='category') THEN
        ALTER TABLE public.saber_ia ADD COLUMN category TEXT DEFAULT 'Diretriz CEO';
    END IF;

    -- Apagar e recriar a restrição para garantir conformidade total
    ALTER TABLE public.saber_ia DROP CONSTRAINT IF EXISTS saber_ia_category_check;
    ALTER TABLE public.saber_ia ADD CONSTRAINT saber_ia_category_check 
    CHECK (category IN (
        'AIMA Imigração', 
        'Diretriz CEO', 
        'Trabalho e Emprego', 
        'Saúde (SNS)', 
        'Direitos e Deveres', 
        'Segurança Social', 
        'Educação e Vistos', 
        'Habitação'
    ));
END $$;

-- 2. TRONO EDITORIAL: NEWSROOM IMPERIAL
CREATE TABLE IF NOT EXISTS public.newsroom_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Newsroom Imperial',
    author TEXT DEFAULT 'MIRA Editorial',
    metadata JSONB DEFAULT '{"prestige": "editorial", "type": "long_form"}'::jsonb,
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotente: adicionar colunas caso a tabela já exista
ALTER TABLE public.newsroom_articles ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'MIRA Editorial';
ALTER TABLE public.newsroom_articles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{"prestige": "editorial", "type": "long_form"}'::jsonb;
ALTER TABLE public.newsroom_articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS
ALTER TABLE public.newsroom_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Newsroom" ON public.newsroom_articles;
CREATE POLICY "Public Read Newsroom" ON public.newsroom_articles FOR SELECT USING (true);

-- 3. APAGAR ARTIGO OBSOLETO
DELETE FROM public.newsroom_articles 
WHERE title ILIKE '%POLISH FINAL%'
   OR title ILIKE '%TRANSIÇÃO CONCLUÍDA%'
   OR title ILIKE '%MIRA 2.0%';

-- 4. INJEÇÃO DO MANUAL SIMPLIFICADO (Conteúdo Rico para o Motor de Conhecimento)
INSERT INTO public.newsroom_articles (title, slug, content, category, author, metadata)
VALUES (
    'Manual Simplificado do WebApp MIRA',
    'manual-simplificado-mira',
    'O MIRA nasceu de uma convicção simples: nenhum imigrante deve navegar sozinho. Portugal é um país de oportunidades reais — mas só para quem sabe onde procurar, o que pedir e como se proteger. O MIRA existe para garantir que tens sempre essa informação na palma da mão, a qualquer hora, em qualquer lugar, na tua língua.

MIRA CHAT — O Teu Conselheiro Pessoal, Sempre Disponível

Imagina poder perguntar qualquer coisa sobre a tua vida em Portugal e receber uma resposta clara, honesta e fundamentada — sem precisar de marcar consulta com advogado, sem esperar semanas numa fila ou sem depender de grupos de WhatsApp cheios de rumores. O MIRA Chat torna isso possível. Podes perguntar como renovar a tua Autorização de Residência antes do prazo expirar, o que fazer se o teu empregador não está a pagar os teus descontos, como trazer a tua família para Portugal por reagrupamento familiar, quais são os teus direitos se fores despedido sem justa causa, como registar uma empresa sendo imigrante, como aceder ao Serviço Nacional de Saúde, como inscrever os teus filhos na escola e muito mais. O MIRA conhece as leis, os processos, os prazos e os detalhes que fazem a diferença. Responde em texto ou em voz, para quem prefere ouvir. E cita sempre as fontes para que possas confirmar tudo.

COMUNIDADE — A Força Está na União

Existe uma sabedoria que nenhum sistema consegue substituir: a experiência de quem já passou pelo mesmo que tu. Na Comunidade MIRA encontras pessoas de dezenas de países que estão a viver ou já viveram exactamente o que estás a atravessar agora. Partilha o que sabes, recebe o apoio de que precisas e cria laços que podem mudar a tua trajectória em Portugal. Os posts da Comunidade têm um sistema de verificação activo: quando muitos membros confirmam que uma informação é verdadeira, ela recebe um selo oficial. Informação falsa, golpes e desinformação são assinalados e eliminados rapidamente. Aqui, a tua voz tem peso. Quanto mais participas — respondendo perguntas, validando informações, ajudando outros membros — maior se torna a tua reputação dentro da plataforma e mais a tua experiência é reconhecida. A Comunidade MIRA não é uma rede social vulgar. É uma rede de sobrevivência e prosperidade colectiva.

VAGAS DE EMPREGO — O Caminho Para a Tua Estabilidade

Encontrar o primeiro emprego em Portugal pode ser um desafio. Encontrar um emprego justo, numa empresa séria, sem cair em esquemas ou em falsas promessas, pode ser ainda mais difícil. O módulo de Vagas do MIRA resolve isso. Reunimos oportunidades de trabalho de todo o país, organizadas de forma simples e filtráveis por área profissional, cidade e tipo de contrato. Cada vaga leva-te directamente ao empregador ou à plataforma oficial — sem intermediários que cobram comissões, sem taxas escondidas, sem armadilhas. São empregos reais, de empresas reais, publicados de forma transparente. Há vagas para todas as áreas: construção civil, restauração, hotelaria, cuidados de saúde, limpeza, logística, tecnologia, comércio e muito mais. O teu próximo emprego pode estar a um clique de distância.

ACADEMY — Investe em Ti e Ninguém Te Tira Isso

A língua é a chave. Quem fala português fluentemente ganha mais, é respeitado mais e tem mais oportunidades. Mas o investimento em conhecimento vai muito além da língua. O módulo Academy do MIRA reúne cursos e formações que te ajudam a crescer profissionalmente e a conhecer os teus direitos em Portugal. Encontrarás formações certificadas em diversas áreas, cursos de português para estrangeiros de todos os níveis, guias sobre leis laborais, direitos do consumidor, saúde e educação. Muitos dos cursos são completamente gratuitos e reconhecidos pelas entidades competentes. Aprender é o investimento com melhor retorno que existe. E no MIRA, esse investimento está ao alcance de todos.

DOCUMENTOS E REGULARIZAÇÃO — A Tua Organização É o Teu Poder

Perder um prazo de renovação de visto pode custar caro — multas, processos e até risco de deportação. Não ter os documentos certos numa consulta pode significar voltar no dia seguinte sem resolver nada. O módulo de Documentos do MIRA foi criado para que nunca mais sejas apanhado desprevenido. Aqui encontrarás guias completos, passo a passo, escritos em linguagem simples, sobre os processos mais importantes da tua vida documental em Portugal. Como tratar da Autorização de Residência e quando pedir a renovação. Como obter o NIF no dia em que chegares ao país. Como pedir o NISS para poder trabalhar legalmente. Como tratar do Cartão de Cidadão Europeu. Como fazer o reagrupamento familiar. Como solicitar o estatuto de residente de longa duração. Como iniciar o processo de naturalização e pedir a nacionalidade portuguesa. Cada guia inclui os documentos necessários, os serviços a contactar, os prazos a respeitar e os erros mais comuns a evitar. Descarrega os modelos directamente da plataforma e chega preparado a qualquer serviço público.

SERVIÇOS — Portugal ao Teu Alcance

Onde fica o centro de saúde mais próximo da tua casa? Existe alguma associação de apoio ao imigrante na tua cidade? Há algum banco que aceite abrir conta sem documentação completa? Qual o centro de emprego onde podes inscrever-te para receber apoio na procura de trabalho? O módulo de Serviços do MIRA responde a estas e a centenas de outras perguntas práticas. Um mapa interactivo mostra serviços úteis espalhados por todo o país — centros de saúde, hospitais, serviços de imigração, câmaras municipais, associações de apoio, centros de formação, escolas de línguas, bancos e muito mais. Podes filtrar por tipo de serviço, ver a morada exacta, o contacto, o horário de funcionamento e as avaliações deixadas por outros membros da comunidade. E podes deixar a tua própria avaliação para ajudar quem vier a seguir. Juntos, construímos o mapa mais completo de apoio ao imigrante em Portugal.

NOTIFICAÇÕES — Sê Sempre o Primeiro a Saber

O MIRA avisa-te quando alguém responde ao teu post, quando há uma vaga de emprego nova que corresponde ao teu perfil, quando a legislação de imigração é actualizada e quando a equipa tem informações importantes para ti. As notificações chegam em tempo real, são claras e objectivas. Não perdes nada do que importa.

PERFIL E CONQUISTAS — O Teu Percurso Reconhecido

No MIRA, cada passo que dás é reconhecido. Cada vez que ajudas um membro da comunidade, que validas uma informação útil, que denuncias conteúdo falso, que completas uma formação ou que utilizas os guias de documentação, estás a construir a tua reputação dentro da plataforma. Existem dez selos de conquista que podes alcançar ao longo do tempo. O Pioneiro reconhece quem está entre os primeiros membros da plataforma. O Verificado confirma que a tua identidade foi validada pela equipa MIRA. O Sentinela distingue quem protegeu a comunidade de informações falsas. O Mestre dos Documentos celebra quem domina a burocracia portuguesa. O Curador honra quem validou dezenas de informações úteis para outros membros. O Exemplar reconhece meses de participação impecável. A Voz de Autoridade distingue quem cria conteúdo de referência. O Guia Local celebra especialistas nos serviços de uma determinada cidade. O Coração da Comunidade honra os membros mais solidários e empáticos. O Escudo Anti-Burla distingue quem identificou e denunciou esquemas fraudulentos. Cada selo é um símbolo real de quem és dentro desta comunidade — e de quanto já contribuíste para torná-la mais forte.

O MIRA não é apenas uma aplicação. É uma declaração de que integrar-se em Portugal não tem de ser uma luta solitária. É uma plataforma construída com rigor, com empatia e com um propósito claro: dar a cada imigrante as ferramentas, o conhecimento e a comunidade de que precisa para prosperar. Bem-vindo. O teu lugar aqui já estava reservado.',
    'Newsroom Imperial',
    'CEO Amanda Abreu',
    '{"prestige": "editorial", "type": "manual", "priority": 1, "official": true}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    category = EXCLUDED.category,
    author = EXCLUDED.author,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();


-- 5. MOTOR RAG V4 GOLD (MULTI-FONTE PONDERADO)
DROP FUNCTION IF EXISTS public.match_knowledge_global_v4(vector, float, int);

CREATE OR REPLACE FUNCTION public.match_knowledge_global_v4 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.25, 
  match_count int DEFAULT 15
) returns table (
  id uuid, topic text, content text, category text, similarity float, weighted_score float, source_table text
) language plpgsql as $$
begin
  return query
  select results.id, results.topic, results.content, results.category, results.similarity, (results.similarity * results.prestige_multiplier) as weighted_score, results.source_table
  from (
    -- Camada Suprema: SABER IA (A VOZ DA AMANDA ABREU)
    select s.id, s.topic, s.content, s.category, 1 - (s.embedding <=> query_embedding) as similarity, 
    CASE 
        WHEN s.category = 'Diretriz CEO' THEN 1.5
        ELSE 1.3
    END as prestige_multiplier, 
    'saber_ia' as source_table from saber_ia s
    
    union all
    
    -- Camada Editorial: NEWSROOM IMPERIAL (Manuais e Guias) - 1.3x
    select nr.id, nr.title as topic, nr.content, nr.category, 1 - (nr.embedding <=> query_embedding) as similarity, 1.3 as prestige_multiplier, 'newsroom_articles' as source_table from newsroom_articles nr

    union all
    
    -- Camada Legal: KNOWLEDGE BASE (Leis Oficiais) - 1.2x
    select kb.id, kb.topic, kb.content, kb.category, 1 - (kb.embedding <=> query_embedding) as similarity, 1.2 as prestige_multiplier, 'knowledge_base' as source_table from knowledge_base kb 

    union all
    
    -- Camada Educativa: ACADEMY (Cursos IEFP) - 1.1x
    select c.id, c.title as topic, c.description as content, 'Academy' as category, 1 - (c.embedding <=> query_embedding) as similarity, 1.1 as prestige_multiplier, 'courses' as source_table from courses c
    where c.embedding is not null

    union all
    
    -- Camada Comunitária: POSTS VERIFICADOS - 1.0x
    select p.id, p.title as topic, p.content, 'Comunidade' as category, 1 - (p.embedding <=> query_embedding) as similarity, 1.0 as prestige_multiplier, 'posts' as source_table from posts p 
    where p.is_verified = true
  ) as results
  where results.similarity >= match_threshold
  order by weighted_score desc limit match_count;
end;
$$;

COMMENT ON FUNCTION public.match_knowledge_global_v4 IS 'MIRA V2026.GOLD: Motor 360 calibrado para a CEO Amanda Abreu.';
