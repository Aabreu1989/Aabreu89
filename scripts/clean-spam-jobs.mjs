import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pnlzyshozpqlzuyjesdq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isSpamOrBlog(title = '', url = '') {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  // 1. Casino / Betting / SEO Spam (Aggressive)
  const spamKeywords = [
    'stakes-vip', 'referral-rewards', 'referral-reward', 'casino', 'kaasino', 'gambling',
    'betting', 'free-spins', 'jackpot', 'slots', 'vavada', 'lebull', 'gobet', 'bukmacher',
    'supabet', 'bonus-code', 'promo-code', 'bonus now', 'sofort banking', 'referral program',
    'bonus de boas-vindas', 'spin-win', 'playio', 'amunra', 'play-for-real', 'zeta-online-casino',
    'maximum-casino', 'moicasino', 'spinsy-casino', 'alf-casino', 'zet-casino', 'bet-it-all', 'bizzo-casino'
  ];
  if (spamKeywords.some(kw => lowerUrl.includes(kw) || lowerTitle.includes(kw))) {
    return true;
  }

  // 2. Blog Posts / Advice Articles / Non-job guides
  const blogKeywords = [
    'salario-enfermeiro', 'salario-auxiliar', 'qualidade-vida', 'google_vignette',
    'modelo-carta', 'carta-despedimento', 'carta-cobranca', 'carta-motivacao', 'carta-apresentacao',
    'como-recusar', 'como-mudar', 'como-fazer', 'como-escrever', 'rescisao-periodo', 'periodo-experimental',
    'viver-na-holanda', 'viver-na-suica', 'viver-no-', 'trabalhar-na-holanda', 'trabalhar-na-suica',
    'subsidio-desemprego', 'feriados-2026', 'feriados-2025', 'codigo-trabalho', 'direitos-dos',
    'dicas-para-entrevista', 'dicas-entrevista', 'modelo-curriculo', 'como-elaborar', 'perguntas-entrevista',
    'erros-curriculo', 'guia-de-emprego', 'viver-na-', 'viver-no-', 'trabalhar-na-', 'trabalhar-no-',
    'minuta-carta', 'carta-de-demissao', 'trabalhar-ao-domingo', 'direitos-e-acrescimos'
  ];
  if (blogKeywords.some(kw => lowerUrl.includes(kw) || lowerTitle.includes(kw))) {
    return true;
  }

  // Path-specific blog keywords (safe from matching common job titles/locations)
  const blogUrlPatterns = [
    '/como-', '/salario-', '/salarios-', '/carta-de-', '/dicas-', '/guia-de-', '/guia-para-', 
    '/guia-completo-', '/guia-pratico-', '/modelo-', '/viver-', '/trabalhar-', '/rescisao-', 
    '/direitos-', '/feriados-', '/subsidio-', '/periodo-experimental', '/contrato-trabalho', 
    '/profissao-', '/o-que-e', '/o-que-faz', '/quanto-ganha', '/artigo/', '/blog/', 
    '/categoria/', '/opiniao/', '/minuta-', '/curriculo/'
  ];
  if (blogUrlPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }

  // Title-specific blog indicators (common article structures)
  const blogTitlePatterns = [
    /^como /i, /^o que /i, /^quanto ganha/i, /^guia (de|para|completo|prático) /i, /^dicas /i,
    /salário médio/i, /tabela salarial/i, /modelo de carta/i, /minuta de/i,
    /direito a/i, /direitos do/i, /código do trabalho/i, /período experimental/i,
    /rescisão de contrato/i, /subsídio de desemprego/i, /carta de despedimento/i
  ];
  if (blogTitlePatterns.some(regex => regex.test(lowerTitle))) {
    return true;
  }

  // Greek / Cyrillic character spam detection
  const greekCyrillicPattern = /[\u0370-\u03ff\u1f00-\u1fff\u0400-\u04ff]/;
  if (greekCyrillicPattern.test(lowerTitle)) {
    return true;
  }

  return false;
}

async function run() {
  console.log('Fetching all jobs from public.job_posts in Supabase...');
  
  let from = 0;
  let to = 999;
  let hasMore = true;
  const spamIds = [];
  const spamDetails = [];

  while (hasMore) {
    console.log(`Querying range ${from} to ${to}...`);
    const { data, error } = await supabase
      .from('job_posts')
      .select('id, title, source_url')
      .range(from, to);

    if (error) {
      console.error('❌ Error fetching jobs:', error.message);
      break;
    }

    if (data && data.length > 0) {
      for (const job of data) {
        if (isSpamOrBlog(job.title, job.source_url)) {
          spamIds.push(job.id);
          spamDetails.push({ id: job.id, title: job.title, url: job.source_url });
        }
      }
      from += 1000;
      to += 1000;
      if (data.length < 1000) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${spamIds.length} spam/blog jobs in database.`);

  if (spamIds.length > 0) {
    console.log('Purging spam and blog posts from Supabase...');
    // Delete in batches of 100
    const BATCH = 100;
    let deletedCount = 0;
    for (let i = 0; i < spamIds.length; i += BATCH) {
      const batchIds = spamIds.slice(i, i + BATCH);
      const { error } = await supabase
        .from('job_posts')
        .delete()
        .in('id', batchIds);

      if (error) {
        console.error(`❌ Error deleting batch ${i}-${i + BATCH}:`, error.message);
      } else {
        deletedCount += batchIds.length;
        console.log(`  Purged ${deletedCount}/${spamIds.length} items...`);
      }
    }
    console.log(`✅ Purged ${deletedCount} spam/blog entries from public.job_posts successfully.`);
    
    // Print first 20 deleted items as examples
    console.log('Sample of deleted items:');
    spamDetails.slice(0, 20).forEach(item => {
      console.log(`  - [${item.id}] ${item.title} (${item.url})`);
    });
  } else {
    console.log('✅ No spam or blog posts found in the database!');
  }
}

run().catch(console.error);
