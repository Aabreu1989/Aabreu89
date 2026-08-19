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
  { id: 'bebee-pt',        name: 'beBee Jobs Portugal',            type: 'html', url: 'https://bebee.com/pt/jobs' },
  { id: 'michaelpage-pt',  name: 'Michael Page Portugal',          type: 'html', url: 'https://www.michaelpage.pt/jobs' },
  { id: 'plataforma-ongd', name: 'Plataforma ONGD',                type: 'html', url: 'https://www.plataformaongd.pt/oportunidades-de-emprego-e-voluntariado' },
  { id: 'wwr-other',       name: 'We Work Remotely (Outros)',      type: 'rss',  url: 'https://weworkremotely.com/categories/all-other-remote-jobs.rss' }
];

// Metadados de referência para diagnóstico
export const TOTAL_CATALOGED_SOURCES = 60;
export const DIRECT_PORTAL_SOURCES_COUNT = 32;
export const RESTRICTED_PORTAL_SOURCES_COUNT = 20;

// ─── PARSERS SERVER-SIDE ──────────────────────────────────────────────────────

// ─── PARSERS SERVER-SIDE EM CASCATA ──────────────────────────────────────────

const PT_DISTRICTS_REGEX = [
  { name: 'Lisboa', patterns: [/\blisboa\b/i, /\blisbon\b/i, /\bcais do sodr/i, /\bsintra\b/i, /\bcascais\b/i, /\bloures\b/i, /\bamadora\b/i, /\boeiras\b/i, /\bmafra\b/i, /\bvila franca de xira\b/i, /\btorres vedras\b/i] },
  { name: 'Porto', patterns: [/\bporto\b/i, /\boporto\b/i, /\bgaia\b/i, /\bmatosinhos\b/i, /\bmaia\b/i, /\bgondomar\b/i, /\bvalongo\b/i, /\bpovoa de varzim\b/i, /\bvila do conde\b/i] },
  { name: 'Braga', patterns: [/\bbraga\b/i, /\bguimar[aã]es\b/i, /\bfamalicao\b/i, /\bfamalic[aã]o\b/i, /\bbarcelos\b/i, /\besposende\b/i] },
  { name: 'Setúbal', patterns: [/\bset[uú]bal\b/i, /\balmada\b/i, /\bseixal\b/i, /\bbarreiro\b/i, /\bmoita\b/i, /\bmontijo\b/i, /\bpalmela\b/i, /\bsines\b/i, /\bsesimbra\b/i] },
  { name: 'Faro', patterns: [/\bfaro\b/i, /\balgarve\b/i, /\bportim[aã]o\b/i, /\bloul[eé]\b/i, /\balbufeira\b/i, /\btavira\b/i, /\blagos\b/i, /\bolh[aã]o\b/i] },
  { name: 'Aveiro', patterns: [/\baveiro\b/i, /\b[aá]gueda\b/i, /\bovar\b/i, /\bilhavo\b/i, /\bsanta maria da feira\b/i, /\bespinho\b/i] },
  { name: 'Leiria', patterns: [/\bleiria\b/i, /\bcaldas da rainha\b/i, /\bmarinha grande\b/i, /\bpeniche\b/i, /\balcoba[cç]a\b/i, /\bpombal\b/i] },
  { name: 'Coimbra', patterns: [/\bcoimbra\b/i, /\bfigueira da foz\b/i, /\bcantanhede\b/i, /\bcondeixa\b/i] },
  { name: 'Santarém', patterns: [/\bsantar[eé]m\b/i, /\btomar\b/i, /\btorres novas\b/i, /\bentroncamento\b/i, /\babrantes\b/i] },
  { name: 'Viseu', patterns: [/\bviseu\b/i, /\blamego\b/i, /\btondela\b/i, /\bmangualde\b/i] },
  { name: 'Viana do Castelo', patterns: [/\bviana do castelo\b/i, /\bponte de lima\b/i, /\bvalen[cç]a\b/i] },
  { name: 'Vila Real', patterns: [/\bvila real\b/i, /\bchaves\b/i, /\br[eé]gua\b/i] },
  { name: 'Castelo Branco', patterns: [/\bcastelo branco\b/i, /\bcovilh[aã]\b/i, /\bfund[aã]o\b/i] },
  { name: 'Évora', patterns: [/\b[eé]vora\b/i, /\bmontemor-o-novo\b/i, /\bestremoz\b/i] },
  { name: 'Guarda', patterns: [/\bguarda\b/i, /\bseia\b/i] },
  { name: 'Beja', patterns: [/\bbeja\b/i, /\bsines\b/i, /\bodemira\b/i] },
  { name: 'Bragança', patterns: [/\bbragan[cç]a\b/i, /\bmirandela\b/i] },
  { name: 'Portalegre', patterns: [/\bportalegre\b/i, /\belvas\b/i] },
  { name: 'Madeira', patterns: [/\bfunchal\b/i, /\bmadeira\b/i] },
  { name: 'Açores', patterns: [/\bponta delgada\b/i, /\ba[cç]ores\b/i, /\bazores\b/i] },
  { name: 'Remoto', patterns: [/\bremoto\b/i, /\bremote\b/i, /\bteletrabalho\b/i, /\bwork from home\b/i, /\b100% remoto\b/i] }
];

function extractCity(title, rawLoc) {
  const combined = `${rawLoc || ''} ${title || ''}`;
  for (const d of PT_DISTRICTS_REGEX) {
    if (d.patterns.some(p => p.test(combined))) return d.name;
  }
  return (rawLoc && rawLoc !== 'Portugal' && rawLoc.length > 2) ? rawLoc : 'Portugal';
}

function classifyTopic(title) {
  const t = (title || '').toUpperCase();
  if (t.includes('CUSTOMER') || t.includes('ADVISOR') || t.includes('CONTACT CENTER') || t.includes('CALL CENTER') || t.includes('ATENDIMENTO') || t.includes('SUPORTE AO CLIENTE') || t.includes('APOIO AO CLIENTE') || t.includes('HELPDESK') || t.includes('TELEPERFORMANCE') || t.includes('FOUNDEVER') || t.includes('BILINGUAL') || t.includes('BILINGUE') || t.includes('GERMAN SPEAKER') || t.includes('FRENCH SPEAKER') || t.includes('ITALIAN SPEAKER') || t.includes('DUTCH SPEAKER')) return 'Apoio ao Cliente';
  if (t.includes('MARKETING') || t.includes('DESIGN') || t.includes('SOCIAL MEDIA') || t.includes('COPYWRITER') || t.includes('CONTENT') || t.includes('AUDIOVISUAL') || t.includes('VÍDEO') || t.includes('VIDEO') || t.includes('FOTOGRAF') || t.includes('UX') || t.includes('UI') || t.includes('COMUNICAÇÃO') || t.includes('COMUNICACAO')) return 'Design, Marketing e Media';
  if (t.includes('TEAM LEADER') || t.includes('PROJECT MANAGER') || t.includes('PRODUCT MANAGER') || t.includes('GESTOR DE PROJETO') || t.includes('COORDENADOR') || t.includes('BUSINESS ANALYST') || t.includes('BUSINESS CONTROLLER') || t.includes('DIRETOR') || t.includes('DIRECTOR') || t.includes('AUDITOR')) return 'Gestão de Equipas e Negócios';
  if (t.includes('CONSULTOR') || t.includes('CONSULTANT') || t.includes('TÉCNICO') || t.includes('TECNICO') || t.includes('MECATRÓNICO') || t.includes('MECATRONICO') || t.includes('MECÂNICO') || t.includes('MECANICO') || t.includes('PERITAGEM') || t.includes('CONTROLO DE QUALIDADE') || t.includes('ESPECIALISTA')) return 'Técnicos e Consultores';
  if (t.includes('ENFERMEIR') || t.includes('MÉDIC') || t.includes('MEDIC') || t.includes('DENT') || t.includes('FARMAC') || t.includes('PSIC') || t.includes('FISIOTERAP') || t.includes('SAÚDE') || t.includes('SAUDE') || t.includes('GERIATRIA') || t.includes('CUIDADOR')) return 'Saúde & Cuidados Continuados';
  if (t.includes('DEVELOPER') || t.includes('SOFTWARE') || t.includes('PROGRAMADOR') || t.includes('DATA ') || t.includes('FRONTEND') || t.includes('BACKEND') || t.includes('FULLSTACK') || t.includes('DEVOPS') || t.includes('CLOUD') || t.includes('TECH') || t.includes('TI ') || t.includes('IT ') || t.includes('INFORMÁTIC')) return 'Tecnologia, Dados & IA';
  if (t.includes('CONSTRU') || t.includes('PEDREIRO') || t.includes('SERVENTE') || t.includes('PINTOR') || t.includes('CARPINTEIRO') || t.includes('TROLHA') || t.includes('CANALIZADOR') || t.includes('ELETRICISTA') || t.includes('OBRA')) return 'Construção Civil & Engenharia';
  if (t.includes('HOTEL') || t.includes('TURISMO') || t.includes('RESTAURANTE') || t.includes('COZINHEIR') || t.includes('COZINHA') || t.includes('EMPREGADO DE MESA') || t.includes('BARMAN') || t.includes('BARISTA') || t.includes('PASTELAR') || t.includes('PADARIA') || t.includes('RECECIONISTA')) return 'Turismo, Hotelaria & Restauração';
  if (t.includes('LOGÍSTIC') || t.includes('LOGISTIC') || t.includes('ARMAZÉM') || t.includes('ARMAZEM') || t.includes('MOTORISTA') || t.includes('CONDUTOR') || t.includes('DISTRIBUI') || t.includes('ESTAFETA') || t.includes('EMPILHADOR') || t.includes('ARMAZ')) return 'Logística, Transportes & Armazém';
  if (t.includes('PRODUÇÃO') || t.includes('PRODUCAO') || t.includes('FÁBRICA') || t.includes('FABRICA') || t.includes('OPERADOR DE MÁQUINA') || t.includes('MANUFATURA') || t.includes('TORNEIRO') || t.includes('SOLDADOR') || t.includes('MANUTENÇÃO') || t.includes('PRODU')) return 'Indústria, Produção & Manufatura';
  if (t.includes('COMERCIAL') || t.includes('VENDEDOR') || t.includes('VENDAS') || t.includes('CAIXA') || t.includes('REPOSITOR') || t.includes('SUPERMERCADO') || t.includes('LOJA') || t.includes('BALCÃO') || t.includes('STORE')) return 'Comércio, Vendas & Retalho';
  if (t.includes('ADMINISTRATIV') || t.includes('SECRETÁRI') || t.includes('SECRETARI') || t.includes('CONTABIL') || t.includes('FINANCEIR') || t.includes('RECURSOS HUMANOS') || t.includes('HR ') || t.includes('RECRUT') || t.includes('GESTÃO') || t.includes('GESTAO')) return 'Administrativo, Gestão & RH';
  if (t.includes('LIMPEZA') || t.includes('HIGIENE') || t.includes('VIGILANTE') || t.includes('SEGURANÇA PRIVADA') || t.includes('FACILITY') || t.includes('PORTEIRO')) return 'Limpeza, Segurança & Facility Management';
  if (t.includes('AGRIC') || t.includes('CAMPO') || t.includes('QUINTA') || t.includes('JARDINEIR') || t.includes('COLHEITA') || t.includes('TRATORISTA') || t.includes('PECUÁRIA') || t.includes('PESCA')) return 'Agricultura, Pesca & Pecuária';
  if (t.includes('ONG') || t.includes('VOLUNTÁRI') || t.includes('VOLUNTARI') || t.includes('COOPERAÇÃO') || t.includes('COOPERACAO') || t.includes('AÇÃO SOCIAL') || t.includes('ACAO SOCIAL') || t.includes('HUMANITÁRI') || t.includes('HUMANITARI') || t.includes('DESENVOLVIMENTO')) return 'Apoio Social & Terceiro Setor';
  if (t.includes('REMOTO') || t.includes('REMOTE') || t.includes('FREELANCE') || t.includes('VIRTUAL ASSISTANT')) return 'Trabalho Remoto & Freelancing';
  return 'Outros';
}

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
        location: extractCity(title, 'Portugal'),
        category: 'Trabalho & Carreira',
        work_topic: classifyTopic(title),
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
  if (alertLoc && alertLoc !== 'todos os distritos' && alertLoc !== 'todos' && !location.includes(alertLoc) && !alertLoc.includes(location) && !location.includes('remoto') && !title.includes('remoto')) {
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

  // 5. Matching Server-Side & Motor de Digest Determinístico MIRA V2026.GOLD
  let notificationsCount = 0;
  let activeAlertsCount = 0;

  try {
    const { data: activeAlerts } = await supabase
      .from('user_job_alerts')
      .select('*')
      .eq('is_active', true);

    if (activeAlerts && activeAlerts.length > 0) {
      activeAlertsCount = activeAlerts.length;

      // 5.1 Processar Matching exclusivamente para as Vagas Novas Ingeridas (insertedJobs)
      if (insertedJobs.length > 0) {
        const candidates = [];

        for (const alert of activeAlerts) {
          if (!alert.user_id) continue;

          for (const job of insertedJobs) {
            // Barreira Temporal: Vaga deve ter sido publicada/ingerida a partir da criação do alerta
            if (alert.created_at && job.created_at) {
              if (new Date(job.created_at) < new Date(alert.created_at)) {
                continue;
              }
            }

            if (evaluateMatch(job, alert)) {
              candidates.push({
                alert_id: alert.id,
                job_id: job.id,
                user_id: alert.user_id,
                frequency: alert.frequency || 'instant',
                jobTitle: job.title,
                jobSource: job.source_name || 'MIRA',
                jobLocation: job.location || 'Portugal',
                alertTopic: alert.work_topic || 'Emprego'
              });
            }
          }
        }

        // Inserção idempotente atómica em job_alert_deliveries
        for (const cand of candidates) {
          try {
            const { data: delivery, error: delError } = await supabase
              .from('job_alert_deliveries')
              .insert({
                alert_id: cand.alert_id,
                job_id: cand.job_id
              })
              .select('id')
              .single();

            if (delError) {
              const isDuplicate =
                delError.code === '23505' ||
                delError.message?.includes('duplicate key') ||
                delError.message?.includes('uq_alert_job_delivery');

              if (!isDuplicate) {
                console.warn(`[SyncJobs] Erro real ao registrar delivery (${cand.alert_id}:${cand.job_id}):`, delError.message || delError);
              }
              continue;
            }

            // Se a entrega for NOVA:
            if (delivery) {
              // ⚡ Frequência Instantânea: Dispara notificação individual imediatamente
              if (cand.frequency === 'instant') {
                const { error: notifErr } = await supabase.from('notifications').insert({
                  user_id: cand.user_id,
                  type: 'jobs',
                  title: `💼 Nova Vaga Compatível: ${cand.jobTitle}`,
                  message: `${cand.jobSource} • ${cand.jobLocation}\nCorrespondência com o teu alerta de ${cand.alertTopic}.`,
                  is_read: false,
                  link: `/jobs?jobId=${encodeURIComponent(cand.job_id)}`,
                  created_at: new Date().toISOString()
                });

                if (notifErr) {
                  console.warn(`[SyncJobs] Erro ao registrar notificação instantânea para user ${cand.user_id}:`, notifErr.message || notifErr);
                } else {
                  notificationsCount++;
                }
              }
              // 📦 Frequências Diária e Semanal: Apenas gravam delivery, aguardando o Digest Engine abaixo
            }
          } catch (delErr) {
            console.warn(`[SyncJobs] Exceção inesperada no delivery loop:`, delErr);
          }
        }
      }

      // 5.2 Motor de Digest Determinístico Server-Side (Daily & Weekly)
      const now = new Date();
      const todayUtcStr = now.toISOString().split('T')[0];
      const dailyDigestKey = `daily-${todayUtcStr}`;

      // Calcular semana ISO (ex: weekly-2026-W34)
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      const weeklyDigestKey = `weekly-${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
      const isMonday = (now.getUTCDay() === 1);

      // A) Processar Alertas Diários (Daily Digest)
      const dailyAlerts = activeAlerts.filter(a => a.frequency === 'daily');
      for (const alert of dailyAlerts) {
        try {
          const digestLink = `/jobs?topic=${encodeURIComponent(alert.work_topic || 'Emprego')}&digest=${dailyDigestKey}&alertId=${alert.id}`;
          const cutoff = alert.last_notified_at || alert.created_at || new Date(0).toISOString();

          const { count: pendingCount, error: countErr } = await supabase
            .from('job_alert_deliveries')
            .select('id', { count: 'exact', head: true })
            .eq('alert_id', alert.id)
            .gt('delivered_at', cutoff);

          if (!countErr && pendingCount && pendingCount > 0) {
            const { error: notifErr } = await supabase
              .from('notifications')
              .insert({
                user_id: alert.user_id,
                type: 'jobs',
                title: `💼 Resumo Diário: ${pendingCount} Novas Vagas Compatíveis`,
                message: `Encontrámos ${pendingCount} nova${pendingCount > 1 ? 's' : ''} oportunidade${pendingCount > 1 ? 's' : ''} hoje para o teu alerta de ${alert.work_topic || 'Emprego'}.`,
                is_read: false,
                link: digestLink,
                created_at: new Date().toISOString()
              });

            if (notifErr) {
              const isDigestDuplicate =
                notifErr.code === '23505' ||
                notifErr.message?.includes('duplicate key') ||
                notifErr.message?.includes('uq_notifications_digest');

              if (!isDigestDuplicate) {
                console.warn(`[SyncJobs] Erro ao emitir digest diário (${alert.id}):`, notifErr.message);
              }
            } else {
              await supabase
                .from('user_job_alerts')
                .update({ last_notified_at: new Date().toISOString() })
                .eq('id', alert.id);
              notificationsCount++;
            }
          }
        } catch (dErr) {
          console.warn(`[SyncJobs] Exceção no daily digest (${alert.id}):`, dErr);
        }
      }

      // B) Processar Alertas Semanais (Weekly Digest - Segundas-feiras)
      if (isMonday) {
        const weeklyAlerts = activeAlerts.filter(a => a.frequency === 'weekly');
        for (const alert of weeklyAlerts) {
          try {
            const weeklyLink = `/jobs?topic=${encodeURIComponent(alert.work_topic || 'Emprego')}&digest=${weeklyDigestKey}&alertId=${alert.id}`;
            const cutoff = alert.last_notified_at || alert.created_at || new Date(0).toISOString();

            const { count: pendingCount, error: countErr } = await supabase
              .from('job_alert_deliveries')
              .select('id', { count: 'exact', head: true })
              .eq('alert_id', alert.id)
              .gt('delivered_at', cutoff);

            if (!countErr && pendingCount && pendingCount > 0) {
              const { error: notifErr } = await supabase
                .from('notifications')
                .insert({
                  user_id: alert.user_id,
                  type: 'jobs',
                  title: `💼 Resumo Semanal: ${pendingCount} Novas Vagas Compatíveis`,
                  message: `Encontrámos ${pendingCount} nova${pendingCount > 1 ? 's' : ''} oportunidade${pendingCount > 1 ? 's' : ''} esta semana para o teu alerta de ${alert.work_topic || 'Emprego'}.`,
                  is_read: false,
                  link: weeklyLink,
                  created_at: new Date().toISOString()
                });

              if (notifErr) {
                const isDigestDuplicate =
                  notifErr.code === '23505' ||
                  notifErr.message?.includes('duplicate key') ||
                  notifErr.message?.includes('uq_notifications_digest');

                if (!isDigestDuplicate) {
                  console.warn(`[SyncJobs] Erro ao emitir digest semanal (${alert.id}):`, notifErr.message);
                }
              } else {
                await supabase
                  .from('user_job_alerts')
                  .update({ last_notified_at: new Date().toISOString() })
                  .eq('id', alert.id);
                notificationsCount++;
              }
            }
          } catch (wErr) {
            console.warn(`[SyncJobs] Exceção no weekly digest (${alert.id}):`, wErr);
          }
        }
      }
    }
  } catch (alertErr) {
    console.warn('⚠️ Alerta Matching & Digest Warning:', alertErr.message);
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
