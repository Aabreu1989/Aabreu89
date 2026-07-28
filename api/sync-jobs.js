/**
 * MIRA — Vercel Cron Job: Sincronização Diária de Vagas
 * ─────────────────────────────────────────────────────
 * Executado automaticamente pela Vercel todos os dias às 03:00 UTC.
 * Pode também ser chamado manualmente pelo admin com o CRON_SECRET correcto.
 *
 * Plataforma correcta: Vercel Cron Jobs (NÃO GitHub Actions)
 * Docs: https://vercel.com/docs/cron-jobs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// ─── RSS FEED SOURCES ────────────────────────────────────────────────────────
const RSS_SOURCES = [
  { name: 'Net-Empregos',       url: 'https://www.net-empregos.com/rss.asp' },
  { name: 'AlertaEmprego',      url: 'https://www.alertaemprego.pt/feed/rss/' },
  { name: 'ITJobs',             url: 'https://www.itjobs.pt/rss/vagas' },
  { name: 'Emprego SAPO',       url: 'https://emprego.sapo.pt/rss' },
  { name: 'Expresso Emprego',   url: 'https://expressoemprego.pt/rss' },
  { name: 'Bons Empregos',      url: 'https://www.bonsempregos.com/rss/vagas.xml' },
  { name: 'Landing.jobs',       url: 'https://landing.jobs/jobs/feed' },
  { name: 'BEP Gov',            url: 'https://www.bep.gov.pt/RSS/OfertasPRR.xml' },
  { name: 'Randstad',           url: 'https://www.randstad.pt/empregos/feed/' },
  { name: 'Adecco Portugal',    url: 'https://www.adecco.pt/candidatos/ofertas-de-emprego/feed/' },
  { name: 'Hays Portugal',      url: 'https://www.hays.pt/vagas-emprego/feed' },
  { name: 'Michael Page',       url: 'https://www.michaelpage.pt/rss-jobs.xml' },
  { name: 'TuriJobs',           url: 'https://www.turijobs.pt/rss/vagas-emprego' },
  { name: 'Jobatus',            url: 'https://www.jobatus.pt/rss/vagas' },
  { name: 'Eurofirms',          url: 'https://www.eurofirms.pt/feed/' },
  { name: 'Multipessoal',       url: 'https://multipessoal.pt/feed/' },
  { name: 'Emprego Estágios',   url: 'https://www.empregoestagios.com/feed/' },
];

// ─── RSS PARSER SIMPLES ───────────────────────────────────────────────────────
async function fetchRSS(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'MIRA-JobSync/2026 (+https://miraimigrante.pt)' }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title  = (block.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                      block.match(/<title[^>]*>(.*?)<\/title>/i) || [])[1];
      const link   = (block.match(/<link>(.*?)<\/link>/i) ||
                      block.match(/<guid[^>]*>(.*?)<\/guid>/i) || [])[1];
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/i) || [])[1];

      if (title && link && link.startsWith('http')) {
        items.push({
          title:      title.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
          source_url: link.trim(),
          source_name: source.name,
          location:   'Portugal',
          category:   'Trabalho & Carreira',
          date_posted: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          posted_at:   pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          created_at:  new Date().toISOString(),
        });
      }
    }
    return items;
  } catch (err) {
    console.warn(`⚠️  ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // ── Autenticação: só Vercel Cron ou admin com secret ──
  const authHeader = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const hasSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

  if (!isVercelCron && !hasSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const startTime = Date.now();

  console.log('🔄 MIRA Sync de Vagas iniciado —', new Date().toISOString());

  // 1. Buscar URLs já existentes para evitar duplicados
  const { data: existing } = await supabase
    .from('job_posts')
    .select('source_url')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const existingUrls = new Set((existing || []).map(j => j.source_url?.toLowerCase()));
  console.log(`📦 ${existingUrls.size} URLs já existentes nos últimos 30 dias.`);

  // 2. Recolher vagas de todos os RSS feeds em paralelo
  const allResults = await Promise.all(RSS_SOURCES.map(fetchRSS));
  const allJobs = allResults.flat();
  console.log(`📡 ${allJobs.length} vagas recolhidas de ${RSS_SOURCES.length} feeds RSS.`);

  // 3. Filtrar duplicados e vagas com mais de 30 dias
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newJobs = allJobs.filter(j => {
    if (existingUrls.has(j.source_url?.toLowerCase())) return false;
    const age = Date.now() - new Date(j.date_posted).getTime();
    return age <= thirtyDaysAgo + 1; // inclui vagas de hoje
  });
  console.log(`✨ ${newJobs.length} novas vagas para inserir.`);

  // 4. Inserir em batches de 50
  let inserted = 0;
  const BATCH = 50;
  for (let i = 0; i < newJobs.length; i += BATCH) {
    const batch = newJobs.slice(i, i + BATCH);
    const { error } = await supabase.from('job_posts').insert(batch);
    if (!error) inserted += batch.length;
    else console.error(`❌ Batch ${i}: ${error.message}`);
  }

  // 5. Limpar vagas com mais de 60 dias para manter a BD limpa
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deleted } = await supabase
    .from('job_posts')
    .delete({ count: 'exact' })
    .lt('created_at', sixtyDaysAgo);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const { count: total } = await supabase
    .from('job_posts')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Sync concluído em ${elapsed}s — Inseridas: ${inserted}, Removidas: ${deleted || 0}, Total: ${total}`);

  return res.status(200).json({
    status: 'ok',
    inserted,
    deleted: deleted || 0,
    total,
    elapsed: `${elapsed}s`,
    timestamp: new Date().toISOString(),
  });
}
