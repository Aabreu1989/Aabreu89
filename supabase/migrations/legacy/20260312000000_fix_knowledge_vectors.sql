-- PROTOCOLO DE REPARAÇÃO DE CÉREBRO V26.0 (ASILO & VETORES)
-- Executar este script no SQL Editor do Supabase se o Chat MIRA estiver "mudo" ou errando sobre Asilo.

-- 1. Ativar pgvector
create extension if not exists vector;

-- 2. Garantir que a tabela knowledge_base tem a coluna de embedding
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='knowledge_base' and column_name='embedding') then
        alter table public.knowledge_base add column embedding vector(768);
    end if;
end $$;

-- 3. Criar a função RPC de busca vetorial se não existir
create or replace function match_knowledge (
  query_embedding vector(768),
  match_count int DEFAULT 10
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    knowledge_base.id,
    knowledge_base.category,
    knowledge_base.topic,
    knowledge_base.content,
    knowledge_base.url,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > 0.3 -- Threshold mínimo de segurança
  order by similarity desc
  limit match_count;
end;
$$;

-- 4. Criar índice ivfflat para performance (opcional, recomendado para > 1000 rows)
-- CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. RPC para Admin deletar tudo da AIMA (Botão Wipe)
create or replace function wipe_aima_knowledge()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.knowledge_base where category = 'AIMA';
end;
$$;

COMMENT ON FUNCTION match_knowledge IS 'Busca semântica no cérebro do MIRA para respostas precisas.';
