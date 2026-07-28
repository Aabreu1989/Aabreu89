-- ⚖️ MIRA V2026: PROTOCOLO LEGAL-ELITE V4 (PRESTIGE RANKING)
-- Melhora a precisão do RAG, priorizando o "Saber IA" e Fontes Oficiais.

CREATE OR REPLACE FUNCTION match_knowledge_global_v4 (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.20,
  match_count int DEFAULT 20
) returns table (
  id uuid,
  category text,
  topic text,
  content text,
  url text,
  metadata jsonb,
  similarity float,
  prestige_score float
)
language plpgsql
as $$
begin
  return query
  with combined_results as (
      -- Camada A: Base de Conhecimento (Administração)
      select
        kb.id, kb.category, kb.topic, kb.content, kb.url, 
        COALESCE(kb.metadata, '{}'::jsonb) as metadata,
        1 - (kb.embedding <=> query_embedding) as similarity,
        case 
           when kb.metadata->>'source_prestige' = 'high' then 0.05
           when kb.metadata->>'source_prestige' = 'maximum' then 0.08
           else 0.02 -- Base oficial tem bónus base
        end as prestige_bonus
      from knowledge_base kb
      where 1 - (kb.embedding <=> query_embedding) > match_threshold
      
      union all
      
      -- Camada B: Diretrizes CEO (Saber IA)
      select
        s.id, 'Diretriz' as category, s.topic, s.content, s.url,
        '{"expert_name": "CEO Amanda Abreu", "source_prestige": "maximum"}'::jsonb as metadata,
        1 - (s.embedding <=> query_embedding) as similarity,
        0.10 as prestige_bonus -- Diretrizes CEO têm o maior boost
      from saber_ia s
      where 1 - (s.embedding <=> query_embedding) > match_threshold

      union all
      
      -- Camada C: Cursos Academia
      select
        c.id, c.category, c.title as topic, c.description as content, COALESCE(c.link, c.image_url) as url,
        '{"expert_name": "Academia MIRA", "source_prestige": "high"}'::jsonb as metadata,
        1 - (c.embedding <=> query_embedding) as similarity,
        0.03 as prestige_bonus
      from courses c
      where 1 - (c.embedding <=> query_embedding) > match_threshold

      union all
      
      -- Camada D: Posts da Comunidade (Menor Prestígio)
      select
        p.id, p.category, p.title as topic, p.content, null as url,
        '{"expert_name": "Comunidade MIRA", "source_prestige": "community"}'::jsonb as metadata,
        1 - (p.embedding <=> query_embedding) as similarity,
        0.0 as prestige_bonus
      from posts p
      where 1 - (p.embedding <=> query_embedding) > (match_threshold + 0.05) -- Threshold maior para ruído da comunidade
  )
  select 
    cr.id, cr.category, cr.topic, cr.content, cr.url, cr.metadata, cr.similarity,
    (cr.similarity + cr.prestige_bonus) as prestige_score
  from combined_results cr
  order by (cr.similarity + cr.prestige_bonus) desc
  limit match_count;
end;
$$;
