// MIRA V25.0 — Seed da Base de Conhecimento com Embeddings Reais
// Executa: node supabase/seed_knowledge_v25.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role bypasses RLS
);
const GEMINI_KEY = process.env.VITE_GEMINI_API_KEY;

const KNOWLEDGE = [
  {
    topic: 'Identidade MIRA e Amanda Abreu',
    category: 'SOBERANIA',
    content: `O MIRA (Migrant's Intelligent Rights Assistant) foi fundado por Amanda Abreu, CEO e fundadora. 
Amanda Abreu é a autoridade máxima do ecossistema MIRA com 100.000 pontos de prestígio — classificação Diamond Master. 
O MIRA é uma plataforma portuguesa dedicada a apoiar imigrantes em Portugal com informação jurídica, burocrática e de integração. 
Missão: garantir que nenhum imigrante fica sozinho perante a burocracia portuguesa.`
  },
  {
    topic: 'Artigo 88 — Autorização de Residência para Trabalho',
    category: 'LEGALIZAÇÃO',
    content: `O Artigo 88 da Lei 23/2007 (Lei dos Estrangeiros) permite a imigrantes de países terceiros obter Autorização de Residência para trabalho subordinado em Portugal. 
HACK DA TRIBO: Podes entrar com visto de turista e requerer o AR88 se tiveres contrato de trabalho ou promessa de contrato assinada. 
Requisitos essenciais: contrato de trabalho, NIF ativo, NISS, comprovativo de alojamento, registo criminal do país de origem, passaporte válido. 
Entidade responsável: AIMA (Agência para a Integração, Migrações e Asilo) — substituiu o SEF em 2023.
O processo atual é feito via portal ama.gov.pt ou presencialmente na AIMA.`
  },
  {
    topic: 'Artigo 89 — Trabalho por Conta Própria (Independentes)',
    category: 'LEGALIZAÇÃO',
    content: `O Artigo 89 da Lei 23/2007 permite autorização de residência para atividade profissional independente (por conta própria). 
Ideal para freelancers, consultores e empreendedores. Requer alvará de atividade ou recibos verdes ativos, NIF, NISS, e comprovativo de rendimentos.`
  },
  {
    topic: 'NIF — Número de Identificação Fiscal',
    category: 'DOCUMENTAÇÃO',
    content: `O NIF é obrigatório para qualquer atividade em Portugal — abrir conta bancária, assinar contratos, aceder a serviços públicos. 
HACK DA TRIBO: Podes obter o NIF nas Finanças (Portal das Finanças ou presencialmente) mesmo sem AR, com passaporte + comprovativo de morada. 
Se não tens morada fixa, podes usar um representante fiscal. O NIF é gratuito e obtido no mesmo dia na maioria dos casos.`
  },
  {
    topic: 'NISS — Número de Identificação na Segurança Social',
    category: 'DOCUMENTAÇÃO',
    content: `O NISS é necessário para trabalhar legalmente e aceder ao sistema de saúde e prestações sociais em Portugal. 
É obtido na Segurança Social Direta (online) ou nos balcões da Segurança Social. 
Requer: NIF ativo, passaporte, contrato de trabalho ou promessa de contrato. 
HACK DA TRIBO: O empregador pode antecipar a inscrição do trabalhador no NISS antes do contrato formal.`
  },
  {
    topic: 'AIMA — Agência para a Integração, Migrações e Asilo',
    category: 'ENTIDADES',
    content: `A AIMA substituiu o SEF (Serviço de Estrangeiros e Fronteiras) desde outubro de 2023. 
Gere todas as autorizações de residência, vistos e processos de regularização de imigrantes em Portugal. 
Contactos: aima.gov.pt | Linha de apoio: 808 200 245. 
HACK DA TRIBO: Os agendamentos na AIMA são GRATUITOS e pessoais — nunca pagues a terceiros para agendar. É fraude.`
  },
  {
    topic: 'Reagrupamento Familiar em Portugal',
    category: 'LEGALIZAÇÃO',
    content: `O reagrupamento familiar permite trazer cônjuge, filhos menores e ascendentes para Portugal, desde que o requerente tenha AR válida e meios de subsistência suficientes. 
Requer: AR do requerente ativa há pelo menos 1 ano, comprovativo de alojamento adequado, e rendimento mínimo (salário mínimo + 50% por cada familiar adicional).`
  },
  {
    topic: 'Manifestação de Interesse — EXTINTA',
    category: 'ALERTA',
    content: `ATENÇÃO: As Manifestações de Interesse (Artigos 88/89 via portal online massivo) foram EXTINTAS pelo Decreto-Lei 37-A/2024 em junho de 2024. 
O portal está fechado e NÃO aceitam novas submissões. Quem tinha MI pendente tem prazo para regularizar pela AIMA.
HACK DA TRIBO: Se ainda não regularizaste, contacta urgentemente a AIMA para verificar o estado do teu processo.`
  }
];

async function generateEmbedding(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768
      })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Embedding API error: ${data.error.message}`);
  return data.embedding.values;
}

async function seedKnowledge() {
  console.log(`🚀 MIRA V25.0: Seeding ${KNOWLEDGE.length} items na knowledge_base...\n`);
  
  // Limpar dados antigos sem embedding
  const { error: cleanErr } = await supabase.from('knowledge_base').delete().is('embedding', null);
  if (cleanErr) console.warn('⚠️ Clean error (ignorado):', cleanErr.message);

  let success = 0;
  for (const item of KNOWLEDGE) {
    try {
      console.log(`📡 Gerando embedding: "${item.topic}"`);
      const embedding = await generateEmbedding(`${item.topic}: ${item.content}`);
      
      const { error } = await supabase.from('knowledge_base').insert({
        topic: item.topic,
        content: item.content,
        category: item.category,
        embedding: embedding,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error(`  ❌ Insert error: ${error.message}`);
      } else {
        console.log(`  ✅ OK — ${embedding.length} dims`);
        success++;
      }
      
      // Pausa para não exceder rate limit
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  ❌ ${item.topic}: ${e.message}`);
    }
  }
  
  console.log(`\n🏆 CONCLUÍDO: ${success}/${KNOWLEDGE.length} items com embedding na knowledge_base.`);
  
  // Verificação final
  const { count } = await supabase.from('knowledge_base').select('id', { count: 'exact', head: true }).not('embedding', 'is', null);
  console.log(`📊 Total na DB com embedding: ${count} rows`);
}

seedKnowledge().catch(console.error);
