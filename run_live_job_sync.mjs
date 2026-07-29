import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const urlMatch = envText.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

const url = urlMatch[1].trim().replace(/['"]/g, '');
const key = keyMatch[1].trim().replace(/['"]/g, '');
const supabase = createClient(url, key);

const RSS_SOURCES = [
  { name: 'Net-Empregos', url: 'https://www.net-empregos.com/rss.asp' },
  { name: 'Emprego Estágios', url: 'https://www.empregoestagios.com/feed/' }
];

async function fetchRSS(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MIRA-Sync/2026' }
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`⚠️ HTTP ${res.status} for ${source.name}`);
      return [];
    }

    const xml = await res.text();
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = (block.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
                     block.match(/<title[^>]*>(.*?)<\/title>/i) || [])[1];
      const link = (block.match(/<link>(.*?)<\/link>/i) ||
                    block.match(/<guid[^>]*>(.*?)<\/guid>/i) || [])[1];

      if (title && link && link.startsWith('http')) {
        items.push({
          title: title.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
          source_url: link.trim(),
          source_name: source.name,
          location: 'Portugal',
          category: 'Trabalho & Carreira',
          work_topic: 'Outros',
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    }
    console.log(`✅ ${source.name}: ${items.length} vagas extraídas`);
    return items;
  } catch (err) {
    console.warn(`⚠️ Error fetching ${source.name}:`, err.message);
    return [];
  }
}

async function runLiveSync() {
  console.log('🚀 MIRA Live Job Sync Initiated...');
  const startTime = Date.now();

  const { data: existing } = await supabase
    .from('job_posts')
    .select('source_url')
    .limit(5000);

  const existingUrls = new Set((existing || []).map(j => j.source_url?.toLowerCase()));
  console.log(`📦 ${existingUrls.size} vagas existentes em base de dados.`);

  const results = await Promise.all(RSS_SOURCES.map(fetchRSS));
  const fetchedJobs = results.flat();
  console.log(`📡 Total de ${fetchedJobs.length} vagas recolhidas dos feeds RSS.`);

  const freshJobs = fetchedJobs.filter(j => !existingUrls.has(j.source_url?.toLowerCase()));
  console.log(`✨ ${freshJobs.length} NOVAS vagas inéditas encontradas HOJE!`);

  let inserted = 0;
  if (freshJobs.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < freshJobs.length; i += BATCH) {
      const batch = freshJobs.slice(i, i + BATCH);
      const { error } = await supabase.from('job_posts').insert(batch);
      if (!error) {
        inserted += batch.length;
      } else {
        console.error(`❌ Batch error: ${error.message}`);
      }
    }
  }

  const { count: total } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });
  console.log(`🎉 Sync Concluído em ${((Date.now() - startTime)/1000).toFixed(1)}s — Inseridas com sucesso HOJE: ${inserted}, Total na BD: ${total}`);
}

runLiveSync();
