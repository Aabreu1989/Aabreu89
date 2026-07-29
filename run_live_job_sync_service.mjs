import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://ychwhxkxsxmuvabxlyjn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAzNzc5OCwiZXhwIjoyMDcyNjEzNzk4fQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
    if (!res.ok) return [];

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
    return items;
  } catch (err) {
    return [];
  }
}

async function runServiceSync() {
  console.log('🚀 MIRA Service Role Job Sync Initiated...');

  const { data: existing } = await supabase
    .from('job_posts')
    .select('source_url')
    .limit(5000);

  const existingUrls = new Set((existing || []).map(j => j.source_url?.toLowerCase()));
  console.log(`📦 ${existingUrls.size} vagas já na BD.`);

  const results = await Promise.all(RSS_SOURCES.map(fetchRSS));
  const fetchedJobs = results.flat();
  console.log(`📡 Total de ${fetchedJobs.length} vagas recolhidas.`);

  const freshJobs = fetchedJobs.filter(j => !existingUrls.has(j.source_url?.toLowerCase()));
  console.log(`✨ ${freshJobs.length} NOVAS vagas inéditas encontradas HOJE (${new Date().toLocaleDateString('pt-PT')})!`);

  let inserted = 0;
  if (freshJobs.length > 0) {
    const BATCH = 50;
    for (let i = 0; i < freshJobs.length; i += BATCH) {
      const batch = freshJobs.slice(i, i + BATCH);
      const { data, error } = await supabase.from('job_posts').insert(batch).select('id');
      if (!error && data) {
        inserted += data.length;
      } else if (error) {
        console.error(`❌ Batch error: ${error.message}`);
      }
    }
  }

  const { count: total } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });
  console.log(`🎉 Sync Concluído com Sucesso — Inseridas hoje: ${inserted}, Total de Vagas na BD: ${total}`);
}

runServiceSync();
