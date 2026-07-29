/**
 * MIRA — Vercel Cron Job: Sincronização Diária de Vagas (V2026.GOLD)
 * ─────────────────────────────────────────────────────
 * Executado automaticamente pela Vercel todos os dias às 03:00 UTC.
 * Pode também ser chamado manualmente pelo admin com o CRON_SECRET correcto.
 *
 * Plataforma: Vercel Cron Jobs
 * Docs: https://vercel.com/docs/cron-jobs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const CRON_SECRET = process.env.CRON_SECRET;

// ─── RSS FEED SOURCES ────────────────────────────────────────────────────────
const RSS_SOURCES = [
  { name: 'Net-Empregos',       url: 'https://www.net-empregos.com/rss.asp' },
  { name: 'Emprego Estágios',   url: 'https://www.empregoestagios.com/feed/' },
  { name: 'Express Emprego',    url: 'https://expressoemprego.pt/rss' }
];

// ─── RSS PARSER ───────────────────────────────────────────────────────────────
async function fetchRSS(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MIRA-JobSync/2026' }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const xml = await res.text();
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = (block.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                     block.match(/<title[^>]*>(.*?)<\/title>/i) || [])[1];
      const link  = (block.match(/<link>(.*?)<\/link>/i) ||
                    block.match(/<guid[^>]*>(.*?)<\/guid>/i) || [])[1];
      const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/i) || [])[1];

      if (title && link && link.startsWith('http')) {
        const cleanTitle = title.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        items.push({
          title: cleanTitle,
          source_url: link.trim(),
          source_name: source.name,
          location: 'Portugal',
          category: 'Trabalho & Carreira',
          work_topic: 'Outros',
          is_active: true,
          created_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
      }
    }
    return items;
  } catch (err) {
    console.warn(`⚠️ ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const hasSecret = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

  // Se não for Vercel Cron nem tiver Secret admin, aceita se for em ambiente Vercel
  if (!isVercelCron && !hasSecret && process.env.NODE_ENV === 'production' && req.method !== 'GET') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const startTime = Date.now();

  console.log('🔄 MIRA Sync de Vagas iniciado —', new Date().toISOString());

  // 1. Buscar URLs já existentes nos últimos 30 dias para evitar duplicados
  const { data: existing } = await supabase
    .from('job_posts')
    .select('source_url')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const existingUrls = new Set((existing || []).map(j => j.source_url?.toLowerCase()));
  console.log(`📦 ${existingUrls.size} URLs já existentes.`);

  // 2. Recolher vagas dos feeds RSS
  const allResults = await Promise.all(RSS_SOURCES.map(fetchRSS));
  const allJobs = allResults.flat();
  console.log(`📡 ${allJobs.length} vagas recolhidas dos feeds.`);

  // 3. Filtrar duplicados
  const newJobs = allJobs.filter(j => !existingUrls.has(j.source_url?.toLowerCase()));
  console.log(`✨ ${newJobs.length} novas vagas para inserir.`);

  // 4. Inserir em batches de 50 usando o service_role key
  let inserted = 0;
  const BATCH = 50;
  for (let i = 0; i < newJobs.length; i += BATCH) {
    const batch = newJobs.slice(i, i + BATCH);
    const { data, error } = await supabase.from('job_posts').insert(batch).select('id');
    if (!error && data) {
      inserted += data.length;
    } else if (error) {
      console.error(`❌ Batch error: ${error.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const { count: total } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });

  console.log(`✅ Sync concluído em ${elapsed}s — Inseridas: ${inserted}, Total na BD: ${total}`);

  return res.status(200).json({
    status: 'ok',
    inserted,
    total,
    elapsed: `${elapsed}s`,
    timestamp: new Date().toISOString(),
  });
}
