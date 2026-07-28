-- ⚖️ MIRA V2026: PROTOCOLO LEGAL-ELITE (FULL PACKAGE)
-- 1. INFRAESTRUTURA (DDL)
-- 2. DADOS DOS ESPECIALISTAS (DML)

-- ==========================================
-- 1. INFRAESTRUTURA
-- ==========================================

-- Adicionar coluna metadata
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='knowledge_base' AND column_name='metadata') THEN
        ALTER TABLE public.knowledge_base ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Upgrade para Busca Global V3 (Threshold 0.22 + Metadados)
CREATE OR REPLACE FUNCTION match_knowledge_global_v3 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.22,
  match_count int DEFAULT 10
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb.id, kb.category, kb.topic, kb.content, kb.url, kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > match_threshold
  union all
  select
    p.id, p.category, p.title as topic, p.content, null as url,
    '{"expert_name": "Comunidade MIRA", "source_prestige": "community"}'::jsonb as metadata,
    1 - (p.embedding <=> query_embedding) as similarity
  from posts p
  where 1 - (p.embedding <=> query_embedding) > match_threshold
  union all
  select
    c.id, c.category, c.title as topic, c.description as content, COALESCE(c.link, c.image_url) as url,
    '{"expert_name": "Academia MIRA", "source_prestige": "high"}'::jsonb as metadata,
    1 - (c.embedding <=> query_embedding) as similarity
  from courses c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
  union all
  select
    s.id, 'Diretriz' as category, s.topic, s.content, s.url,
    '{"expert_name": "CEO Amanda Abreu", "source_prestige": "maximum"}'::jsonb as metadata,
    1 - (s.embedding <=> query_embedding) as similarity
  from saber_ia s
  where 1 - (s.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- ==========================================
-- 2. DADOS DOS ESPECIALISTAS (SEED)
-- ==========================================

INSERT INTO public.knowledge_base (topic, content, category, url, metadata)
VALUES 
(
    'Reagrupamento Familiar - Limites e Condições',
    'O advogado André Lima afirma: "A lei não obriga ninguém a manter indefinidamente um vínculo jurídico que já não existe na vida real". Se o vínculo que deu origem ao reagrupamento (ex: relação com enteado) deixar de existir, o título de residência pode ser cancelada. Cada caso deve ser analisado individualmente com base em factos reais.',
    'Doutrina Jurídica',
    'https://dnbrasil.dn.pt/pergunte-ao-advogado/pergunte-ao-advogado-quais-so-os-limites-do-reagrupamento-familiar',
    '{"expert_name": "André Lima", "source_prestige": "high"}'
),
(
    'Pendências na AIMA - Estrutura de Missão',
    'Dra. Ana Rita Gil analisa que a estrutura de missão criada em Junho de 2024 resolveu 97% das pendências herdadas (750 mil atendimentos, 300 mil títulos). Foi uma operação sem precedentes envolvendo parcerias com autarquias e ordens profissionais, colmatando políticas irresponsáveis do passado.',
    'Legislação & AIMA',
    'https://www.dn.pt/opiniao-dn/opiniao/misso-impossvel-a-resoluo-de-pendncias-na-aima',
    '{"expert_name": "Ana Rita Gil", "source_prestige": "high"}'
),
(
    'Integração e Migração Laboral Segura',
    'Vasco Malta (IOM) destaca o projeto MOVER para migração laboral segura e valorização do trabalho em Portugal. Reforça que os Centros CLAIM são vitais na linha da frente para integração territorial e resposta estrutural às necessidades do mercado de trabalho com proteção de direitos.',
    'Integração',
    'https://portugal.iom.int/pt-pt/news',
    '{"expert_name": "Vasco Malta", "source_prestige": "high"}'
),
(
    'Perfil dos Imigrantes em 2024 (RMA)',
    'Segundo o Relatório de Migrações e Asilo (RMA) 2023/2024, Portugal registou o 8º ano consecutivo de crescimento da população estrangeira. Houve um aumento de 35.3% nos pedidos de proteção internacional. Portugal concedeu 54.342 proteções temporárias, maioritariamente a cidadãos ucranianos.',
    'Estatística & Perfil',
    'https://aima.gov.pt/pt/a-aima/relatorios-de-migracoes-e-asilo',
    '{"expert_name": "Catarina Reis de Oliveira", "source_prestige": "high"}'
),
(
    'Crítica à Nova Política de Imigração',
    'Priscila Ferreira critica o descompasso entre processos "resolvidos" e títulos efetivamente concedidos (apenas 311 mil em 763 mil). Alerta para o declínio devográfico e critica a gestão ideológica do sistema, pedindo liderança que encare as necessidades estruturais do país.',
    'Crítica & Doutrina',
    'https://dnbrasil.dn.pt/opini%C3%A3o-dn-brasil/opinio-h-algo-de-positivo-na-nova-poltica-de-imigrao-fica-a-pergunta-no-ar',
    '{"expert_name": "Priscila S. Nazareth Ferreira", "source_prestige": "high"}'
);
