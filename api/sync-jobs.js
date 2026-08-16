/**
 * MIRA — Sincronização Server-Side de Vagas & Matching de Alertas (V2026.GOLD)
 * ─────────────────────────────────────────────────────────────────────────────
 * Executado periodicamente via Vercel Cron ou manualmente por administradores.
 * 
 * Pipeline:
 * 1. Purge automático de vagas > 60 dias (Regra Inviolável MIRA)
 * 2. Deduplicação por source_url
 * 3. Coleta server-side multi-fonte com AbortController (RSS/XML/JSON)
 * 4. Normalização e inserção em lotes na tabela 'job_posts'
 * 5. Matching imediato com 'user_job_alerts' -> disparo para 'notifications'
 * 6. Relatório detalhado por fonte
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// ─── CLASSIFICAÇÃO SOBERANA DAS FONTES MIRA ──────────────────────────────────
export const AUTOMATED_SOURCES = [
  { id: 'net-empregos',    name: 'Net-Empregos',                   type: 'rss',  url: 'https://www.net-empregos.com/rss.asp' },
  { id: 'randstad-pt',     name: 'Randstad Portugal',              type: 'rss',  url: 'https://www.randstad.pt/empregos/rss' },
  { id: 'foundever-pt',    name: 'Foundever Portugal',             type: 'rss',  url: 'https://jobs.foundever.com/rss.xml' },
  { id: 'landing-jobs',    name: 'Landing.jobs',                   type: 'rss',  url: 'https://landing.jobs/feed' },
  { id: 'leroy-merlin',    name: 'Leroy Merlin',                   type: 'rss',  url: 'https://recrutamento.leroymerlin.pt/jobs.rss' },
  { id: 'edp-carreiras',   name: 'EDP (Carreiras)',                type: 'rss',  url: 'https://jobs.edp.com/rss.xml' },
  { id: 'tap-portugal',    name: 'TAP Air Portugal',               type: 'rss',  url: 'https://recrutamento.tap.pt/rss.xml' },
  { id: 'teleperformance', name: 'Teleperformance Portugal',       type: 'rss',  url: 'https://jobs.teleperformance.pt/feed/' },
  { id: 'carga-trabalhos', name: 'Carga de Trabalhos',             type: 'rss',  url: 'https://www.cargadetrabalhos.pt/feed' },
  { id: 'emprego-estagios',name: 'Emprego Estágios',               type: 'rss',  url: 'https://www.empregoestagios.com/feed/' },
  { id: 'feed-empregos',   name: 'Feed Empregos',                  type: 'rss',  url: 'https://www.feedempregos.pt/feeds/posts/default?alt=rss' },
  { id: 'remoteok',        name: 'RemoteOK',                       type: 'json', url: 'https://remoteok.com/api' },
  { id: 'wwr-dev',         name: 'We Work Remotely (Tech)',        type: 'rss',  url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss' },
  { id: 'wwr-support',     name: 'We Work Remotely (Support)',     type: 'rss',  url: 'https://weworkremotely.com/categories/remote-customer-support-jobs.rss' },
  { id: 'wwr-devops',      name: 'We Work Remotely (DevOps)',      type: 'rss',  url: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss' },
  { id: 'wwr-finance',     name: 'We Work Remotely (Finance)',     type: 'rss',  url: 'https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss' },
  { id: 'wwr-design',      name: 'We Work Remotely (Design)',      type: 'rss',  url: 'https://weworkremotely.com/categories/remote-design-jobs.rss' },
  { id: 'wwr-marketing',   name: 'We Work Remotely (Marketing)',   type: 'rss',  url: 'https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss' },
  { id: 'bep-publico',     name: 'BEP - Bolsa de Emprego Público', type: 'rss',  url: 'https://www.bep.gov.pt/pages/rss/rssOfertas.aspx' },
  { id: 'expresso-emprego',name: 'Expresso Emprego',               type: 'rss',  url: 'https://expressoemprego.pt/rss' },
  { id: 'it-jobs',         name: 'IT Jobs',                        type: 'html', url: 'https://www.itjobs.pt/emprego' },
  { id: 'wwr-other',       name: 'We Work Remotely (Outros)',      type: 'rss',  url: 'https://weworkremotely.com/categories/all-other-remote-jobs.rss' }
];

// Metadados de referência para diagnóstico
export const TOTAL_CATALOGED_SOURCES = 60;
export const DIRECT_PORTAL_SOURCES_COUNT = 32;
export const RESTRICTED_PORTAL_SOURCES_COUNT = 20;

// ─── PARSERS SERVER-SIDE ──────────────────────────────────────────────────────

// ─── PARSERS SERVER-SIDE EM CASCATA ──────────────────────────────────────────

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRssXml(xml, sourceName) {
  const items = [];
  const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const rawTitle = (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
    const rawLink  = (block.match(/<link[^>]*href="([^"]+)"/i) ||
                      block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) ||
                      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) || [])[1];
    const rawPubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
                        block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
                        block.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i) || [])[1];
    const rawDesc = (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
                     block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) || [])[1];

    const title = cleanText(rawTitle);
    const link = cleanText(rawLink);

    if (title && title.length >= 3 && link && link.startsWith('http')) {
      items.push({
        title,
        source_url: link,
        source_name: sourceName,
        location: 'Portugal',
        category: 'Trabalho & Carreira',
        work_topic: 'Outros',
        description: cleanText(rawDesc).substring(0, 300),
        is_active: true,
        created_at: rawPubDate && !isNaN(new Date(rawPubDate).getTime()) 
          ? new Date(rawPubDate).toISOString() 
          : new Date().toISOString()
      });
    }
  }
  return items;
}

function parseJsonLd(html, baseUrl, sourceName) {
  const items = [];
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const entries = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed]);
      for (const entry of entries) {
        if (entry && (entry['@type'] === 'JobPosting' || entry['@type']?.includes('JobPosting'))) {
          const title = entry.title || entry.name;
          const url = entry.url || baseUrl;
          let location = 'Portugal';
          if (entry.jobLocation) {
            const locObj = Array.isArray(entry.jobLocation) ? entry.jobLocation[0] : entry.jobLocation;
            location = locObj?.address?.addressLocality || locObj?.address?.addressRegion || locObj?.name || 'Portugal';
          }
          if (title && title.length >= 3 && url) {
            const fullUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;
            items.push({
              title: cleanText(title),
              source_url: fullUrl,
              source_name: sourceName,
              location: cleanText(location),
              category: 'Trabalho & Carreira',
              work_topic: 'Outros',
              description: cleanText(entry.description || '').substring(0, 300),
              is_active: true,
              created_at: entry.datePosted && !isNaN(new Date(entry.datePosted).getTime())
                ? new Date(entry.datePosted).toISOString()
                : new Date().toISOString()
            });
          }
        }
      }
    } catch (e) {}
  }
  return items;
}

function parseHtmlJobLinks(html, baseUrl, sourceName) {
  const items = [];
  const seenUrls = new Set();
  const linkRegex = /<a\s+([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1];
    const innerHtml = match[2];

    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1].trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) continue;

    const titleAttr = (attrs.match(/title=["']([^"']+)["']/i) || [])[1];
    const ariaLabel = (attrs.match(/aria-label=["']([^"']+)["']/i) || [])[1];
    const rawText = cleanText(innerHtml);
    const linkTitle = cleanText(titleAttr || ariaLabel || rawText);

    const isJobUrl = /(?:\/oferta|\/ofertas|\/vaga|\/vagas|\/job|\/jobs|\/careers|\/oportunidade|\/detalhe|\/anuncio|\/processo)[\/-]/i.test(href);
    const hasJobWords = /(?:enfermeir|programador|cozinheir|motorista|operador|assistente|t\u00e9cnico|engenheir|comercial|empregad|rececionista|developer|consultor|ajudante|mecanic|servente|estagi|recrutamento|vaga)/i.test(linkTitle);

    if (linkTitle.length >= 4 && linkTitle.length < 150 && (isJobUrl || hasJobWords)) {
      try {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        if (!seenUrls.has(fullUrl)) {
          seenUrls.add(fullUrl);
          items.push({
            title: linkTitle,
            source_url: fullUrl,
            source_name: sourceName,
            location: 'Portugal',
            category: 'Trabalho & Carreira',
            work_topic: 'Outros',
            description: linkTitle,
            is_active: true,
            created_at: new Date().toISOString()
          });
        }
      } catch (e) {}
    }
  }
  return items;
}

async function fetchCascadeCollector(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 MIRA-JobSync/2026',
        'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get('content-type') || '';
    const bodyText = await res.text();

    // 1. Camada RSS / Atom
    if (contentType.includes('xml') || bodyText.startsWith('<?xml') || bodyText.includes('<rss') || bodyText.includes('<feed')) {
      const rssItems = parseRssXml(bodyText, source.name);
      if (rssItems.length > 0) {
        return { success: true, method: 'RSS/Atom', source: source.name, items: rssItems };
      }
    }

    // 2. Camada JSON-LD
    const jsonLdItems = parseJsonLd(bodyText, source.url, source.name);
    if (jsonLdItems.length > 0) {
      return { success: true, method: 'JSON-LD', source: source.name, items: jsonLdItems };
    }

    // 3. Camada HTML Cards & Links
    const htmlItems = parseHtmlJobLinks(bodyText, source.url, source.name);
    if (htmlItems.length > 0) {
      return { success: true, method: 'HTML-Cards', source: source.name, items: htmlItems };
    }

    return { success: false, method: 'none', source: source.name, error: 'Sem vagas pelos métodos em cascata', items: [] };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, method: 'error', source: source.name, error: err.message, items: [] };
  }
}

async function fetchRssFeed(source) {
  return fetchCascadeCollector(source);
}

async function fetchJsonApi(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MIRA-JobSync/2026',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items = [];

    if (Array.isArray(data)) {
      data.slice(1, 100).forEach(item => {
        if (item.position && item.url) {
          items.push({
            title: `${item.position} (${item.company || 'Remote'})`,
            source_url: item.url,
            source_name: source.name,
            location: item.location || 'Remoto',
            category: 'Trabalho & Carreira',
            work_topic: 'Tecnologia, Dados & IA',
            description: cleanText(item.description).substring(0, 300),
            is_active: true,
            created_at: item.date ? new Date(item.date).toISOString() : new Date().toISOString()
          });
        }
      });
    }
    return { success: true, method: 'JSON-API', source: source.name, items };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, method: 'error', source: source.name, error: err.message, items: [] };
  }
}

async function fetchHtmlScraper(source) {
  return fetchCascadeCollector(source);
}

// ─── MOTOR SERVER-SIDE DE MATCHING DE ALERTAS ────────────────────────────────
function evaluateMatch(job, alert) {
  if (!alert.is_active) return false;
  const norm = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const title = norm(job.title);
  const location = norm(job.location);
  const workTopic = norm(job.work_topic);
  const alertTopic = norm(alert.work_topic);
  const alertLoc = norm(alert.location);
  const alertKw = norm(alert.keywords);

  // 1. Topic
  if (alertTopic && alertTopic !== 'todos' && !workTopic.includes(alertTopic) && !title.includes(alertTopic)) {
    return false;
  }

  // 2. Location
  if (alertLoc && alertLoc !== 'todos os distritos' && alertLoc !== 'todos' && !location.includes(alertLoc) && !title.includes(alertLoc) && !location.includes('remoto')) {
    return false;
  }

  // 3. Keywords
  if (alertKw) {
    const tokens = alertKw.split(/[\s,]+/).filter(k => k.length > 2);
    const hasKw = tokens.some(t => title.includes(t));
    if (!hasKw) return false;
  }

  return true;
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['user-agent']?.includes('vercel-cron');
  const cronSecret = process.env.CRON_SECRET;
  const hasSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;

  // Validação de segurança em produção
  if (process.env.NODE_ENV === 'production' && !isVercelCron && !hasSecret && req.method !== 'GET') {
    return res.status(401).json({ error: 'Unauthorized — Cron Secret or Vercel trigger required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();

  console.log('🔄 MIRA Sync de Vagas & Alertas iniciado:', new Date().toISOString());

  // 1. Purge de vagas com mais de 90 dias (Regra Inviolável MIRA)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('job_posts').delete().lt('created_at', ninetyDaysAgo);

  // 2. Coletar URLs existentes para deduplicação precisa nos últimos 90 dias
  const { data: existing } = await supabase
    .from('job_posts')
    .select('source_url')
    .gte('created_at', ninetyDaysAgo);

  const existingUrls = new Set((existing || []).map(j => (j.source_url || '').toLowerCase().trim()));

  // 3. Executar coletas simultâneas com relatórios individuais
  const sourceResults = await Promise.all(
    AUTOMATED_SOURCES.map(source => {
      if (source.type === 'json') return fetchJsonApi(source);
      if (source.type === 'html') return fetchHtmlScraper(source);
      return fetchCascadeCollector(source);
    })
  );

  const isDryRun = req.query?.dryRun === 'true' || req.body?.dryRun === true;

  let totalCollected = 0;
  let successfulSources = 0;
  let failedSources = [];
  const allNewJobs = [];
  const detailedBreakdown = [];

  sourceResults.forEach(res => {
    const rawCount = res.items ? res.items.length : 0;
    let validCount = 0;
    let duplicateCount = 0;

    if (res.success) {
      successfulSources++;
      totalCollected += rawCount;
      res.items.forEach(job => {
        const urlKey = (job.source_url || '').toLowerCase().trim();
        if (!existingUrls.has(urlKey)) {
          existingUrls.add(urlKey);
          allNewJobs.push(job);
          validCount++;
        } else {
          duplicateCount++;
        }
      });
      detailedBreakdown.push({
        source: res.source,
        method: res.method || 'auto',
        found: rawCount,
        validNew: validCount,
        discarded: duplicateCount,
        discardReason: duplicateCount > 0 ? 'Já existente na base' : 'Nenhum',
        status: 'OK'
      });
    } else {
      failedSources.push({ source: res.source, error: res.error });
      detailedBreakdown.push({
        source: res.source,
        method: res.method || 'error',
        found: 0,
        validNew: 0,
        discarded: 0,
        discardReason: res.error || 'Falha na requisição',
        status: 'FAILED'
      });
    }
  });

  // Modo Dry-Run: Não efetua escrita no Supabase nem dispara notificações
  if (isDryRun) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    return res.status(200).json({
      status: 'dry_run_success',
      timestamp: new Date().toISOString(),
      elapsed: `${elapsed}s`,
      breakdown: detailedBreakdown,
      totals: {
        totalCollected,
        totalNewCandidates: allNewJobs.length,
        successfulSources,
        failedSourcesCount: failedSources.length
      }
    });
  }

  // 4. Inserir novas vagas em batches de 50 (Modo de Produção)
  let insertedCount = 0;
  const insertedJobs = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < allNewJobs.length; i += BATCH_SIZE) {
    const batch = allNewJobs.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('job_posts').insert(batch).select('id, title, location, work_topic, source_name, source_url');
    if (!error && data) {
      insertedCount += data.length;
      insertedJobs.push(...data);
    } else if (error) {
      console.error(`❌ Erro no lote de vagas ${i}:`, error.message);
    }
  }

  // 5. Matching imediato com Alertas do Utilizador -> Central de Notificações
  let notificationsCount = 0;
  let activeAlertsCount = 0;

  if (insertedJobs.length > 0) {
    try {
      const { data: activeAlerts } = await supabase
        .from('user_job_alerts')
        .select('*')
        .eq('is_active', true);

      if (activeAlerts && activeAlerts.length > 0) {
        activeAlertsCount = activeAlerts.length;
        const newNotifications = [];

        for (const alert of activeAlerts) {
          if (!alert.user_id) continue;
          
          for (const job of insertedJobs) {
            if (evaluateMatch(job, alert)) {
              newNotifications.push({
                user_id: alert.user_id,
                type: 'jobs',
                title: `💼 Nova Vaga Compatível: ${job.title}`,
                message: `${job.source_name || 'MIRA'} • ${job.location || 'Portugal'}\nCorrespondência com o teu alerta de ${alert.work_topic || 'Emprego'}.`,
                is_read: false,
                link: `/jobs?jobId=${encodeURIComponent(job.id)}`,
                created_at: new Date().toISOString()
              });
            }
          }
        }

        // Inserir notificações geradas em lote
        if (newNotifications.length > 0) {
          const { data: notifData } = await supabase
            .from('notifications')
            .insert(newNotifications.slice(0, 100))
            .select('id');
          notificationsCount = notifData ? notifData.length : 0;
        }
      }
    } catch (alertErr) {
      console.warn('⚠️ Alerta Matching Warning:', alertErr.message);
    }
  }

  // 6. Contagem total final na base de dados
  const { count: totalInDb } = await supabase.from('job_posts').select('id', { count: 'exact', head: true });
  const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  const report = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    elapsed: `${elapsedSeconds}s`,
    sourcesSummary: {
      totalCataloged: TOTAL_CATALOGED_SOURCES,
      attempted: AUTOMATED_SOURCES.length,
      succeeded: successfulSources,
      failed: failedSources.length,
      failedList: failedSources,
      directPortals: DIRECT_PORTAL_SOURCES_COUNT,
      restrictedPortals: RESTRICTED_PORTAL_SOURCES_COUNT
    },
    pipeline: {
      collected: totalCollected,
      newJobsInserted: insertedCount,
      totalActiveInDb: totalInDb || 0,
      activeAlertsEvaluated: activeAlertsCount,
      notificationsDispatched: notificationsCount
    }
  };

  console.log(`✅ Sync concluído em ${elapsedSeconds}s — Inseridas: ${insertedCount}, Notificações: ${notificationsCount}`);
  return res.status(200).json(report);
}
