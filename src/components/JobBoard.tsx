
import React, { useState, useEffect } from 'react';
import { JobPost, WORK_TOPICS, CATEGORIES, ViewType } from '../types';
import { Search, Briefcase, ExternalLink, MapPin, Building2, ChevronDown, Filter, X, SlidersHorizontal, Map as MapIcon, Globe, FileText, RefreshCcw, AlertCircle, Sparkles, ChevronRight, ChevronLeft, Bell, TrendingUp, Activity } from 'lucide-react';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { t } from '../utils/translations';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeCategory, normalizeWorkTopic, getWorkTopicKey } from '../utils/categoryUtils';
import JobItem from './JobItem';
import { JobAlertModal } from './JobAlertModal';
import { jobAlertService } from '../services/jobAlertService';
import { isPortugalOrRemoteJob } from '../utils/jobLocationHelper';
import { fetchMarketIntelligence, MarketIntelligence, SectorIntelligence } from '../services/jobMarketAnalytics';

export function decodeJobText(str: string | undefined | null): string {
  if (!str) return '';
  let s = str;
  // Entidades numéricas
  s = s.replace(/&#(\d+);/g, (m, dec) => {
    try { return String.fromCodePoint(parseInt(dec, 10)); } catch { return m; }
  });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)); } catch { return m; }
  });
  // Entidades nomeadas
  const htmlNamed: Record<string, string> = {
    '&amp;': '&', '&apos;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
    '&ccedil;': 'ç', '&Ccedil;': 'Ç', '&atilde;': 'ã', '&Atilde;': 'Ã',
    '&otilde;': 'õ', '&Otilde;': 'Õ', '&aacute;': 'á', '&Aacute;': 'Á',
    '&eacute;': 'é', '&Eacute;': 'É', '&iacute;': 'í', '&Iacute;': 'Í',
    '&oacute;': 'ó', '&Oacute;': 'Ó', '&uacute;': 'ú', '&Uacute;': 'Ú',
    '&acirc;': 'â', '&Acirc;': 'Â', '&ecirc;': 'ê', '&Ecirc;': 'Ê',
    '&ocirc;': 'ô', '&Ocirc;': 'Ô'
  };
  for (const [k, v] of Object.entries(htmlNamed)) {
    s = s.replaceAll(k, v);
  }
  // Mojibake
  const mojibake: Record<string, string> = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã€': 'À', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã„': 'Ä',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã‰': 'É', 'Ãˆ': 'È', 'ÃŠ': 'Ê', 'Ã‹': 'Ë',
    'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
    'ÃŒ': 'Ì', 'ÃŽ': 'Î',
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ã“': 'Ó', 'Ã’': 'Ò', 'Ã”': 'Ô', 'Ã•': 'Õ', 'Ã–': 'Ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ãš': 'Ú', 'Ã™': 'Ù', 'Ã›': 'Û', 'Ãœ': 'Ü',
    'Ã§': 'ç', 'Ã‡': 'Ç', 'Ã±': 'ñ', 'Ã‘': 'Ñ',
    'â‚¬': '€', 'â€“': '–', 'â€”': '—',
    'â€˜': "'", 'â€™': "'", 'â€œ': '"', 'â€ ': '"',
    'â€¢': '•', 'â€¦': '…',
    'Âº': 'º', 'Âª': 'ª', 'Â°': '°', 'Â«': '«', 'Â»': '»',
    'Â©': '©', 'Â®': '®', 'Â§': '§'
  };
  for (const [k, v] of Object.entries(mojibake)) {
    s = s.replaceAll(k, v);
  }

  // Limpeza de qualquer caractere de substituição isolado
  s = s.replace(/\ufffd+/g, '');

  return s.replace(/\s+/g, ' ').trim();
}

function isSpamOrBlog(title: string, url: string): boolean {
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
    'salario-enfermeiro', 'salario-auxiliar', 'google_vignette',
    'modelo-carta', 'carta-despedimento', 'carta-cobranca', 'carta-motivacao', 'carta-apresentacao',
    'como-recusar', 'como-mudar', 'como-escrever', 'rescisao-periodo', 'periodo-experimental',
    'subsidio-desemprego', 'feriados-2026', 'feriados-2025', 'codigo-trabalho', 'direitos-dos',
    'dicas-para-entrevista', 'dicas-entrevista', 'modelo-curriculo', 'como-elaborar', 'perguntas-entrevista',
    'erros-curriculo', 'guia-de-emprego',
    'minuta-carta', 'carta-de-demissao', 'direitos-e-acrescimos'
  ];
  if (blogKeywords.some(kw => lowerUrl.includes(kw) || lowerTitle.includes(kw))) {
    return true;
  }

  // Path-specific blog keywords (safe from matching common job titles/locations)
  const blogUrlPatterns = [
    '/salarios-', '/carta-de-', '/dicas-', '/guia-de-', '/guia-para-', 
    '/guia-completo-', '/guia-pratico-', '/modelo-', '/rescisao-', 
    '/direitos-', '/feriados-', '/subsidio-', '/periodo-experimental',
    '/o-que-e', '/o-que-faz', '/quanto-ganha', '/artigo/', '/blog/', 
    '/categoria/', '/opiniao/', '/minuta-', '/curriculo/'
  ];
  if (blogUrlPatterns.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }

  // Title-specific blog indicators (common article structures)
  const blogTitlePatterns = [
    /^como /i, /^o que /i, /^quanto ganha/i, /^guia (de|para|completo|pr\u00e1tico) /i, /^dicas /i,
    /sal\u00e1rio m\u00e9dio/i, /tabela salarial/i, /modelo de carta/i, /minuta de/i,
    /direito a/i, /direitos do/i, /c\u00f3digo do trabalho/i, /per\u00edodo experimental/i,
    /rescis\u00e3o de contrato/i, /subs\u00eddio de desemprego/i, /carta de despedimento/i
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


interface JobBoardProps {
  language: string;
  isAdmin?: boolean;
  user?: any;
  onViewChange?: (view: ViewType, params?: any) => void;
  initialTab?: string;
  initialQuickFilter?: string;
  onEarnPoints?: (amount: number, reason: string, actionKey?: string, entityId?: string) => void;
}

const TOPIC_DETAILS: Record<string, { emoji: string; color: string; bg: string; text: string; ring: string }> = {
  "Tecnologia, Dados & IA": { emoji: "💻", color: "#3b82f6", bg: "bg-blue-50/80 hover:bg-blue-100/90", text: "text-blue-600 border-blue-200", ring: "focus:ring-blue-500/20" },
  "Saúde & Cuidados Continuados": { emoji: "🩺", color: "#10b981", bg: "bg-emerald-50/80 hover:bg-emerald-100/90", text: "text-emerald-600 border-emerald-200", ring: "focus:ring-emerald-500/20" },
  "Construção Civil & Engenharia": { emoji: "🏗️", color: "#d97706", bg: "bg-amber-50/80 hover:bg-amber-100/90", text: "text-amber-700 border-amber-200", ring: "focus:ring-amber-500/20" },
  "Turismo, Hotelaria & Restauração": { emoji: "🍽️", color: "#ea580c", bg: "bg-orange-50/80 hover:bg-orange-100/90", text: "text-orange-600 border-orange-200", ring: "focus:ring-orange-500/20" },
  "Indústria, Produção & Manufatura": { emoji: "🏭", color: "#8b5cf6", bg: "bg-violet-50/80 hover:bg-violet-100/90", text: "text-violet-600 border-violet-200", ring: "focus:ring-violet-500/20" },
  "Logística, Transportes & Armazém": { emoji: "📦", color: "#4f46e5", bg: "bg-indigo-50/80 hover:bg-indigo-100/90", text: "text-indigo-600 border-indigo-200", ring: "focus:ring-indigo-500/20" },
  "Comércio, Vendas & Retalho": { emoji: "🛍️", color: "#db2777", bg: "bg-pink-50/80 hover:bg-pink-100/90", text: "text-pink-600 border-pink-200", ring: "focus:ring-pink-500/20" },
  "Administrativo, Gestão & RH": { emoji: "📂", color: "#475569", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-600 border-slate-200", ring: "focus:ring-slate-500/20" },
  "Apoio ao Cliente": { emoji: "🎧", color: "#0284c7", bg: "bg-sky-50/80 hover:bg-sky-100/90", text: "text-sky-600 border-sky-200", ring: "focus:ring-sky-500/20" },
  "Técnicos e Consultores": { emoji: "🔧", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-700 border-slate-200", ring: "focus:ring-slate-500/20" },
  "Design, Marketing e Media": { emoji: "🎨", color: "#e11d48", bg: "bg-rose-50/80 hover:bg-rose-100/90", text: "text-rose-600 border-rose-200", ring: "focus:ring-rose-500/20" },
  "Gestão de Equipas e Negócios": { emoji: "📊", color: "#7c3aed", bg: "bg-purple-50/80 hover:bg-purple-100/90", text: "text-purple-600 border-purple-200", ring: "focus:ring-purple-500/20" },
  "Limpeza, Segurança & Facility Management": { emoji: "🧹", color: "#52525b", bg: "bg-zinc-50/80 hover:bg-zinc-100/90", text: "text-zinc-600 border-zinc-200", ring: "focus:ring-zinc-500/20" },
  "Agricultura, Pesca & Pecuária": { emoji: "🚜", color: "#16a34a", bg: "bg-green-50/80 hover:bg-green-100/90", text: "text-green-600 border-green-200", ring: "focus:ring-green-500/20" },
  "Apoio Social & Terceiro Setor": { emoji: "🤝", color: "#0891b2", bg: "bg-cyan-50/80 hover:bg-cyan-100/90", text: "text-cyan-600 border-cyan-200", ring: "focus:ring-cyan-500/20" },
  "Energia & Sustentabilidade": { emoji: "⚡", color: "#ca8a04", bg: "bg-yellow-50/80 hover:bg-yellow-100/90", text: "text-yellow-700 border-yellow-200", ring: "focus:ring-yellow-500/20" },
  "Educação, Ensino & Formação": { emoji: "📚", color: "#0284c7", bg: "bg-sky-50/80 hover:bg-sky-100/90", text: "text-sky-600 border-sky-200", ring: "focus:ring-sky-500/20" },
  "Automóvel, Mecânica & Reparação": { emoji: "🔧", color: "#4b5563", bg: "bg-gray-50/80 hover:bg-gray-100/90", text: "text-gray-600 border-gray-200", ring: "focus:ring-gray-500/20" },
  "Trabalho Remoto & Freelancing": { emoji: "🏡", color: "#0d9488", bg: "bg-teal-50/80 hover:bg-teal-100/90", text: "text-teal-600 border-teal-200", ring: "focus:ring-teal-500/20" },
  "Trabalho & Carreira": { emoji: "💼", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-600 border-slate-200", ring: "focus:ring-slate-500/20" },
  "Outros": { emoji: "💼", color: "#64748b", bg: "bg-slate-50/80 hover:bg-slate-100/90", text: "text-slate-600 border-slate-200", ring: "focus:ring-slate-500/20" }
};

const LOCATIONS = (lang: string) => [
  t('jobs_all_districts', lang), "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];

// 📍 Melhores cidades e polos regionais por setor (Recuperação canónica de insights do MIRA)
const SECTOR_TOP_CITIES: Record<string, { pt: string; en: string; es: string; fr: string }> = {
  "Tecnologia, Dados & IA": {
    pt: "Lisboa, Porto, Braga, Coimbra e Remoto",
    en: "Lisbon, Porto, Braga, Coimbra, and Remote",
    es: "Lisboa, Oporto, Braga, Coímbra y Remoto",
    fr: "Lisbonne, Porto, Braga, Coimbra et Télétravail"
  },
  "Saúde & Cuidados Continuados": {
    pt: "Lisboa, Porto, Coimbra (polos hospitalares) e Faro",
    en: "Lisbon, Porto, Coimbra (hospital hubs), and Faro",
    es: "Lisboa, Oporto, Coímbra (polos hospitalarios) y Faro",
    fr: "Lisbonne, Porto, Coimbra (pôles hospitaliers) et Faro"
  },
  "Construção Civil & Engenharia": {
    pt: "Lisboa, Porto, Braga e Setúbal",
    en: "Lisbon, Porto, Braga, and Setúbal",
    es: "Lisboa, Oporto, Braga y Setúbal",
    fr: "Lisbonne, Porto, Braga et Setúbal"
  },
  "Turismo, Hotelaria & Restauração": {
    pt: "Algarve (Faro, Albufeira), Lisboa, Porto e Funchal (Madeira)",
    en: "Algarve (Faro, Albufeira), Lisbon, Porto, and Funchal (Madeira)",
    es: "Algarve (Faro, Albufeira), Lisboa, Oporto y Funchal (Madeira)",
    fr: "Algarve (Faro, Albufeira), Lisbonne, Porto et Funchal (Madère)"
  },
  "Indústria, Produção & Manufatura": {
    pt: "Aveiro, Braga, Leiria, Setúbal e Porto",
    en: "Aveiro, Braga, Leiria, Setúbal, and Porto",
    es: "Aveiro, Braga, Leiria, Setúbal y Oporto",
    fr: "Aveiro, Braga, Leiria, Setúbal et Porto"
  },
  "Logística, Transportes & Armazém": {
    pt: "Lisboa (Azambuja, Loures), Setúbal, Porto e Santarém",
    en: "Lisbon (Azambuja, Loures), Setúbal, Porto, and Santarém",
    es: "Lisboa (Azambuja, Loures), Setúbal, Oporto y Santarém",
    fr: "Lisbonne (Azambuja, Loures), Setúbal, Porto et Santarém"
  },
  "Comércio, Vendas & Retalho": {
    pt: "Lisboa, Porto, Braga, Coimbra e Setúbal",
    en: "Lisbon, Porto, Braga, Coimbra, and Setúbal",
    es: "Lisboa, Oporto, Braga, Coímbra y Setúbal",
    fr: "Lisbonne, Porto, Braga, Coimbra et Setúbal"
  },
  "Administrativo, Gestão & RH": {
    pt: "Lisboa, Porto, Oeiras, Braga e Coimbra",
    en: "Lisbon, Porto, Oeiras, Braga, and Coimbra",
    es: "Lisboa, Oporto, Oeiras, Braga y Coímbra",
    fr: "Lisbonne, Porto, Oeiras, Braga et Coimbra"
  },
  "Apoio ao Cliente": {
    pt: "Lisboa, Porto, Braga e regimes Remoto/Híbrido",
    en: "Lisbon, Porto, Braga, and Remote/Hybrid",
    es: "Lisboa, Oporto, Braga y Remoto/Híbrido",
    fr: "Lisbonne, Porto, Braga et Télétravail/Hybride"
  },
  "Técnicos e Consultores": {
    pt: "Lisboa, Porto, Aveiro, Coimbra e Braga",
    en: "Lisbon, Porto, Aveiro, Coimbra, and Braga",
    es: "Lisboa, Oporto, Aveiro, Coímbra y Braga",
    fr: "Lisbonne, Porto, Aveiro, Coimbra et Braga"
  },
  "Design, Marketing e Media": {
    pt: "Lisboa, Porto, Braga e Remoto",
    en: "Lisbon, Porto, Braga, and Remote",
    es: "Lisboa, Oporto, Braga y Remoto",
    fr: "Lisbonne, Porto, Braga et Télétravail"
  },
  "Gestão de Equipas e Negócios": {
    pt: "Lisboa, Porto, Oeiras, Cascais e Braga",
    en: "Lisbon, Porto, Oeiras, Cascais, and Braga",
    es: "Lisboa, Oporto, Oeiras, Cascais y Braga",
    fr: "Lisbonne, Porto, Oeiras, Cascais et Braga"
  },
  "Limpeza, Segurança & Facility Management": {
    pt: "Lisboa, Porto, Faro (Algarve), Setúbal e Braga",
    en: "Lisbon, Porto, Faro (Algarve), Setúbal, and Braga",
    es: "Lisboa, Oporto, Faro (Algarve), Setúbal y Braga",
    fr: "Lisbonne, Porto, Faro (Algarve), Setúbal et Braga"
  },
  "Agricultura, Pesca & Pecuária": {
    pt: "Beja, Évora (Alentejo), Santarém (Ribatejo) e Faro",
    en: "Beja, Évora (Alentejo), Santarém (Ribatejo), and Faro",
    es: "Beja, Évora (Alentejo), Santarém (Ribatejo) y Faro",
    fr: "Beja, Évora (Alentejo), Santarém (Ribatejo) et Faro"
  },
  "Apoio Social & Terceiro Setor": {
    pt: "Lisboa, Porto, Coimbra, Braga e Setúbal",
    en: "Lisbon, Porto, Coimbra, Braga, and Setúbal",
    es: "Lisboa, Oporto, Coímbra, Braga y Setúbal",
    fr: "Lisbonne, Porto, Coimbra, Braga et Setúbal"
  },
  "Energia & Sustentabilidade": {
    pt: "Sines, Évora, Coimbra, Castelo Branco e Lisboa",
    en: "Sines, Évora, Coimbra, Castelo Branco, and Lisbon",
    es: "Sines, Évora, Coímbra, Castelo Branco y Lisboa",
    fr: "Sines, Évora, Coimbra, Castelo Branco et Lisbonne"
  },
  "Educação, Ensino & Formação": {
    pt: "Lisboa, Porto, Coimbra, Braga e Évora",
    en: "Lisbon, Porto, Coimbra, Braga, and Évora",
    es: "Lisboa, Oporto, Coímbra, Braga y Évora",
    fr: "Lisbonne, Porto, Coimbra, Braga et Évora"
  },
  "Automóvel, Mecânica & Reparação": {
    pt: "Setúbal (Palmela), Porto, Leiria, Aveiro e Lisboa",
    en: "Setúbal (Palmela), Porto, Leiria, Aveiro, and Lisbon",
    es: "Setúbal (Palmela), Oporto, Leiria, Aveiro y Lisboa",
    fr: "Setúbal (Palmela), Porto, Leiria, Aveiro et Lisbonne"
  },
  "Trabalho Remoto & Freelancing": {
    pt: "Todo o País (Polos Nómadas: Madeira, Lisboa, Porto, Algarve)",
    en: "Nationwide (Nomad Hubs: Madeira, Lisbon, Porto, Algarve)",
    es: "Todo el País (Polos Nómadas: Madeira, Lisboa, Oporto, Algarve)",
    fr: "Tout le Pays (Pôles Nomades : Madère, Lisbonne, Porto, Algarve)"
  },
  "Outros": {
    pt: "Lisboa, Porto, Braga, Setúbal e Faro",
    en: "Lisbon, Porto, Braga, Setúbal, and Faro",
    es: "Lisboa, Oporto, Braga, Setúbal y Faro",
    fr: "Lisbonne, Porto, Braga, Setúbal et Faro"
  }
};

function getSectorTopCities(topicName: string, language: string): string {
  const lang = (language || 'pt').toLowerCase();
  const entry = SECTOR_TOP_CITIES[topicName] || SECTOR_TOP_CITIES['Outros'];
  if (lang === 'en') return entry.en;
  if (lang === 'es') return entry.es;
  if (lang === 'fr') return entry.fr;
  return entry.pt;
}

// 🌐 Nomes oficiais dos 18 setores localizados nas 4 línguas oficiais do MIRA
const SECTOR_NAMES: Record<string, { pt: string; en: string; es: string; fr: string }> = {
  "Tecnologia, Dados & IA": {
    pt: "Tecnologia, Dados & IA",
    en: "Technology, Data & AI",
    es: "Tecnología, Datos e IA",
    fr: "Technologie, Données & IA"
  },
  "Saúde & Cuidados Continuados": {
    pt: "Saúde & Cuidados Continuados",
    en: "Healthcare & Caregiving",
    es: "Salud y Cuidados Continuados",
    fr: "Santé & Soins Continus"
  },
  "Construção Civil & Engenharia": {
    pt: "Construção Civil & Engenharia",
    en: "Civil Construction & Engineering",
    es: "Construcción Civil e Ingeniería",
    fr: "BTP & Ingénierie"
  },
  "Turismo, Hotelaria & Restauração": {
    pt: "Turismo, Hotelaria & Restauração",
    en: "Tourism, Hospitality & Catering",
    es: "Turismo, Hostelería y Restauración",
    fr: "Tourisme, Hôtellerie & Restauration"
  },
  "Indústria, Produção & Manufatura": {
    pt: "Indústria, Produção & Manufatura",
    en: "Industry, Production & Manufacturing",
    es: "Industria, Producción y Fabricación",
    fr: "Industrie, Production & Fabrication"
  },
  "Logística, Transportes & Armazém": {
    pt: "Logística, Transportes & Armazém",
    en: "Logistics, Transport & Warehousing",
    es: "Logística, Transporte y Almacén",
    fr: "Logistique, Transport & Entreposage"
  },
  "Comércio, Vendas & Retalho": {
    pt: "Comércio, Vendas & Retalho",
    en: "Commerce, Sales & Retail",
    es: "Comercio, Ventas y Retail",
    fr: "Commerce, Vente & Distribution"
  },
  "Administrativo, Gestão & RH": {
    pt: "Administrativo, Gestão & RH",
    en: "Administration, Management & HR",
    es: "Administración, Gestión y RRHH",
    fr: "Administration, Gestion & RH"
  },
  "Apoio ao Cliente": {
    pt: "Apoio ao Cliente",
    en: "Customer Support & Call Center",
    es: "Atención al Cliente",
    fr: "Service Client & Support"
  },
  "Técnicos e Consultores": {
    pt: "Técnicos e Consultores",
    en: "Technicians & Consultants",
    es: "Técnicos y Consultores",
    fr: "Techniciens et Consultants"
  },
  "Design, Marketing e Media": {
    pt: "Design, Marketing e Media",
    en: "Design, Marketing & Media",
    es: "Diseño, Marketing y Medios",
    fr: "Design, Marketing & Médias"
  },
  "Gestão de Equipas e Negócios": {
    pt: "Gestão de Equipas e Negócios",
    en: "Team Management & Business",
    es: "Gestión de Equipos y Negocios",
    fr: "Management d'Équipes & Affaires"
  },
  "Limpeza, Segurança & Facility Management": {
    pt: "Limpeza, Segurança & Facility Management",
    en: "Cleaning, Security & Facilities",
    es: "Limpieza, Seguridad y Servicios",
    fr: "Nettoyage, Sécurité & Services"
  },
  "Agricultura, Pesca & Pecuária": {
    pt: "Agricultura, Pesca & Pecuária",
    en: "Agriculture, Fishing & Livestock",
    es: "Agricultura, Pesca y Ganadería",
    fr: "Agriculture, Pêche & Élevage"
  },
  "Apoio Social & Terceiro Setor": {
    pt: "Apoio Social & Terceiro Setor",
    en: "Social Support & Third Sector",
    es: "Apoyo Social y Tercer Sector",
    fr: "Action Sociale & Troisième Secteur"
  },
  "Energia & Sustentabilidade": {
    pt: "Energia & Sustentabilidade",
    en: "Energy & Sustainability",
    es: "Energía y Sostenibilidad",
    fr: "Énergie & Développement Durable"
  },
  "Educação, Ensino & Formação": {
    pt: "Educação, Ensino & Formação",
    en: "Education, Teaching & Training",
    es: "Educación, Enseñanza y Formación",
    fr: "Éducation, Enseignement & Formation"
  },
  "Automóvel, Mecânica & Reparação": {
    pt: "Automóvel, Mecânica & Reparação",
    en: "Automotive, Mechanics & Repair",
    es: "Automóvil, Mecánica y Reparación",
    fr: "Automobile, Mécanique & Réparation"
  },
  "Trabalho Remoto & Freelancing": {
    pt: "Trabalho Remoto & Freelancing",
    en: "Remote Work & Freelancing",
    es: "Trabajo Remoto y Freelance",
    fr: "Télétravail & Freelance"
  },
  "Outros": {
    pt: "Outros Setores",
    en: "Other Sectors",
    es: "Otros Sectores",
    fr: "Autres Secteurs"
  }
};

function getSectorDisplayName(topicName: string, language: string): string {
  const lang = (language || 'pt').toLowerCase();
  const entry = SECTOR_NAMES[topicName] || SECTOR_NAMES['Outros'];
  if (!entry) return topicName;
  if (lang === 'en') return entry.en;
  if (lang === 'es') return entry.es;
  if (lang === 'fr') return entry.fr;
  return entry.pt;
}



const MAX_JOB_AGE_DAYS = 90;

function isWithin90Days(dateStr?: string): boolean {
  if (!dateStr) return true;
  try {
    const postDate = new Date(dateStr);
    if (isNaN(postDate.getTime())) return true;
    const diffDays = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_JOB_AGE_DAYS;
  } catch (e) {
    return true;
  }
}

export const JobBoard: React.FC<JobBoardProps> = ({ language, isAdmin, user, onViewChange, initialTab, initialQuickFilter, onEarnPoints }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'trends'>(initialTab === 'trends' ? 'trends' : 'jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(t('jobs_all_districts', language));
  const [selectedWorkTopic, setSelectedWorkTopic] = useState('Todos');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>(initialQuickFilter || null);

  // Debounce search query to prevent rapid re-fetching and race conditions
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset to first page when search or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCity, selectedWorkTopic, selectedQuickFilter]);

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [totalPlatformJobs, setTotalPlatformJobs] = useState<number | null>(null);
  const [filteredTotalCount, setFilteredTotalCount] = useState<number | null>(null);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(() => jobAlertService.getAlerts(user?.id).filter(a => a.isActive).length);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📊 SOBERANIA MIRA: Inteligência de mercado 100% real calculada a partir do Supabase
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  const loadMarketData = React.useCallback(async () => {
    setMarketLoading(true);
    setMarketError(null);
    try {
      const data = await fetchMarketIntelligence(supabase);
      setMarketData(data);
      setTotalPlatformJobs(data.activeJobsCount);
      const counts: Record<string, number> = {};
      for (const sec of data.sectors) {
        counts[sec.name] = sec.activeJobsCount;
      }
      setTopicCounts(counts);
    } catch (err: any) {
      console.error('MIRA: Erro ao carregar inteligência de mercado:', err);
      setMarketError(err?.message || 'Falha ao carregar dados de mercado');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);
  
  const JOBS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const jobListTopRef = React.useRef<HTMLDivElement>(null);

  const refreshAlertsCount = React.useCallback(async () => {
    const alerts = await jobAlertService.getAlertsAsync(user?.id);
    setActiveAlertsCount(alerts.filter(a => a.isActive).length);
  }, [user?.id]);

  React.useEffect(() => {
    refreshAlertsCount();
    if (!user?.id) return;
    const channel = jobAlertService.subscribeToJobAlerts(user.id, () => {
      refreshAlertsCount();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id, refreshAlertsCount]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCity !== t('jobs_all_districts', language) ||
    selectedWorkTopic !== 'Todos' ||
    selectedQuickFilter
  );

  const fetchJobs = async (forceRefresh: boolean = false) => {
    setError(null);
    setLoading(true);

    try {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

      // Contagem real das vagas ativas da plataforma
      const { count: totalCount } = await supabase
        .from('job_posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('created_at', ninetyDaysAgo);

      if (totalCount !== null && totalCount !== undefined) {
        setTotalPlatformJobs(totalCount);
      }

      let query = supabase
        .from('job_posts')
        .select('id, title, location, source_name, source_url, created_at, category, work_topic', { count: 'exact' })
        .eq('is_active', true);

      if (selectedCity && selectedCity !== t('jobs_all_districts', language)) {
        if (selectedCity.toLowerCase() === 'remoto') {
          query = query.or('location.ilike.%remoto%,title.ilike.%remoto%,location.ilike.%remote%,title.ilike.%remote%');
        } else {
          query = query.ilike('location', `%${selectedCity}%`);
        }
      }

      if (selectedWorkTopic && selectedWorkTopic !== 'Todos') {
        query = query.eq('work_topic', selectedWorkTopic);
      }

      if (debouncedSearchQuery.trim()) {
        const q = debouncedSearchQuery.trim();
        const tokens = q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'no', 'na', 'por', 'a', 'o', 'as', 'os']);
        const significant = tokens.filter(w => !stopWords.has(w));

        if (significant.length > 1) {
          // Multi-word search (e.g. "empregado de mesa", "auxiliar de cozinha"): chain significant tokens
          for (const token of significant) {
            query = query.ilike('title', `%${token}%`);
          }
        } else if (significant.length === 1) {
          const single = significant[0];
          // Common cross-language job synonyms
          if (['garçom', 'garcom', 'garçon', 'camarero', 'camarera', 'waiter', 'waitress', 'serveur', 'serveuse'].includes(single)) {
            query = query.or('title.ilike.%mesa%,title.ilike.%bar%,title.ilike.%restaurante%,title.ilike.%garçom%,title.ilike.%garcom%,title.ilike.%camarer%');
          } else if (['faxina', 'diarista', 'limpeza', 'cleaner', 'limpieza', 'ménage'].includes(single)) {
            query = query.or('title.ilike.%limpeza%,title.ilike.%limp%,title.ilike.%clean%,title.ilike.%serviços gerais%');
          } else if (['motorista', 'estafeta', 'driver', 'chofer', 'conductor', 'chauffeur'].includes(single)) {
            query = query.or('title.ilike.%motorista%,title.ilike.%estafeta%,title.ilike.%distribuição%,title.ilike.%transport%,title.ilike.%driver%');
          } else {
            query = query.or(`title.ilike.%${single}%,location.ilike.%${single}%`);
          }
        } else {
          query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%`);
        }
      }

      // Regra Inviolável MIRA: Máximo de 90 dias de antiguidade para qualquer vaga ativa
      query = query.gte('created_at', ninetyDaysAgo);

      if (selectedQuickFilter === 'english') {
        query = query.or('title.ilike.%english%,title.ilike.%inglês%,title.ilike.%ingles%,title.ilike.%speaker%,title.ilike.%bilingual%,title.ilike.%bilingue%,title.ilike.%international%,title.ilike.%internacional%,title.ilike.%developer%,title.ilike.%engineer%,title.ilike.%consultant%');
      } else if (selectedQuickFilter === 'visa') {
        query = query.or('title.ilike.%visto%,title.ilike.%visa%,title.ilike.%relocation%,title.ilike.%repatriamento%,title.ilike.%sponsorship%,title.ilike.%patroc%,title.ilike.%tech visa%,title.ilike.%contrato sem termo%,title.ilike.%contrato de trabalho%');
      } else if (selectedQuickFilter === 'remote') {
        query = query.or('location.ilike.%remoto%,title.ilike.%remoto%,location.ilike.%remote%,title.ilike.%remote%,title.ilike.%teletrabalho%,location.ilike.%teletrabalho%,work_topic.ilike.%remoto%,location.ilike.%híbrido%,location.ilike.%hybrid%');
      } else if (selectedQuickFilter === 'entry') {
        query = query.or('title.ilike.%junior%,title.ilike.%júnior%,title.ilike.%estágio%,title.ilike.%estagio%,title.ilike.%trainee%,title.ilike.%entry%,title.ilike.%inicial%,title.ilike.%aprendiz%,title.ilike.%estagiário%,title.ilike.%estagiaria%,title.ilike.%sem experiência%,title.ilike.%assistente%,title.ilike.%ajudante%,title.ilike.%operador%,title.ilike.%auxiliar%');
      } else if (selectedQuickFilter === 'pcd') {
        query = query.or('title.ilike.%pcd%,title.ilike.%inclusiv%,title.ilike.%inclusão%,title.ilike.%inclusion%,title.ilike.%defici%,title.ilike.%igualdade%,title.ilike.%diversidade%,title.ilike.%acessib%,title.ilike.%(m/f/d)%,title.ilike.%(m/f/x)%,title.ilike.%cota%,title.ilike.%adaptad%');
      } else if (selectedQuickFilter === 'via_verde') {
        query = query.or('title.ilike.%tech visa%,title.ilike.%via verde%,title.ilike.%urgente%,title.ilike.%urgência%,title.ilike.%imediato%,title.ilike.%imediata%,title.ilike.%admissão imediata%,title.ilike.%entrada imediata%,title.ilike.%sponsorship%');
      }

      const from = (currentPage - 1) * JOBS_PER_PAGE;
      const to = from + JOBS_PER_PAGE - 1;

      const { data, count, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      setFilteredTotalCount(count !== null ? count : 0);

      const formatted: JobPost[] = (data || [])
        .map(dbJob => {
          const rawTime = (dbJob as any).created_at || (dbJob as any).posted_at;
          const postDate = rawTime ? new Date(rawTime) : now;
          const diffHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          let displayDate = 'Hoje';
          if (diffHours < 12) displayDate = 'Hoje (Recente)';
          else if (diffHours < 24) displayDate = 'Hoje';
          else if (diffDays === 1) displayDate = 'Ontem';
          else if (diffDays <= 30) displayDate = `Há ${diffDays} dias`;
          else displayDate = postDate.toLocaleDateString('pt-PT');

          return {
            id: dbJob.id,
            title: decodeJobText(dbJob.title) || t('jobs_no_title', language),
            location: decodeJobText(dbJob.location) || 'Portugal',
            sourceName: dbJob.source_name || 'MIRA',
            sourceUrl: dbJob.source_url,
            datePosted: displayDate,
            posted_at: rawTime || now.toISOString(),
            tags: Array.isArray((dbJob as any).tags) ? (dbJob as any).tags : (dbJob.title && dbJob.title.toLowerCase().includes('remoto') ? ['Remote'] : []),
            category: normalizeCategory(dbJob.category || 'Trabalho & Carreira'),
            workTopic: normalizeWorkTopic((dbJob as any).work_topic, dbJob.title)
          };
        })
        .filter(job => isPortugalOrRemoteJob(job.title, job.location));

      setJobs(formatted);
    } catch (err: any) {
      console.error('MIRA JobBoard error:', err);
      setError(err?.message || 'Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [debouncedSearchQuery, selectedCity, selectedWorkTopic, selectedQuickFilter, currentPage]);

  const totalEffectiveCount = filteredTotalCount !== null ? filteredTotalCount : (totalPlatformJobs || 0);
  const totalPages = Math.max(1, Math.ceil(totalEffectiveCount / JOBS_PER_PAGE));
  const paginatedJobs = jobs;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (jobListTopRef.current) {
      jobListTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity(t('jobs_all_districts', language));
    setSelectedWorkTopic('Todos');
    setSelectedQuickFilter(null);
    setCurrentPage(1);
  };

  const scrollerTopics = React.useMemo(() => {
    const seen = new Set();
    return WORK_TOPICS.filter(topic => {
      const key = getWorkTopicKey(topic);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 text-slate-900 font-sans">
      {/* Header Sticky Section - SLIM & RESPONSIVE */}
      <div className="bg-white/95 backdrop-blur-xl px-4 sm:px-6 pt-4 pb-3 space-y-3 z-30 border-b border-slate-200/80 sticky top-0 shadow-sm">
        <div className="flex items-center justify-between gap-2.5">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h2 className="text-base xs:text-lg sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 leading-tight break-words">
              {t('jobs_title', language)}
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-mira-orange animate-pulse shadow-[0_0_10px_#FF8C00] shrink-0" />
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">{t('jobs_subtitle', language)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-2 sm:p-3 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl sm:rounded-2xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border border-red-100 shrink-0"
              >
                <X size={15} /> <span className="hidden sm:inline">{t('jobs_reset_filters_btn', language)}</span>
              </button>
            )}
            <button
              onClick={() => fetchJobs(true)}
              disabled={loading}
              title={
                language === 'EN' ? 'Refresh Job Offers in Real-Time' :
                language === 'ES' ? 'Actualizar Ofertas de Empleo en Tiempo Real' :
                language === 'FR' ? 'Actualiser les Offres d\'Emploi en Temps Réel' :
                'Atualizar Vagas em Tempo Real'
              }
              className="p-2 sm:p-3 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl sm:rounded-2xl transition-all border border-slate-200 shrink-0"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tab Switcher - NO TOPO COM DESIGN E RESPONSIVIDADE ORIGINAL */}
        <div className="flex bg-slate-100/90 p-1 rounded-2xl w-full border border-slate-200/80 shadow-inner relative overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 cursor-pointer ${
              activeTab === 'jobs' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase size={14} className={activeTab === 'jobs' ? 'animate-mira-blink-modern' : ''} />
            {t('nav_vagas', language)}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 relative z-10 cursor-pointer ${
              activeTab === 'trends' ? 'bg-[#0A0A0A] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} className={activeTab === 'trends' ? 'animate-mira-blink-modern' : ''} />
            {t('jobs_insight_title', language)}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-6 flex-1">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:brightness-110 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 border border-emerald-400/40 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            <Bell size={18} className="animate-bounce text-white shrink-0 drop-shadow" />
            <span className="drop-shadow-sm font-black text-white">
              {language === 'EN' ? 'Create Job Alert' :
               language === 'ES' ? 'Crear Alerta de Empleo' :
               language === 'FR' ? 'Créer une Alerte d\'Emploi' :
               'Criar Alerta de Vagas'}
            </span>
            {activeAlertsCount > 0 && (
              <span className="bg-white text-emerald-600 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-white/40 shadow-sm ml-1">
                {activeAlertsCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => {
              analytics.track('europass_click', 'u1');
              window.open('https://europa.eu/europass/eportfolio/screen/cv-editor/legacy-cv-editor?lang=pt', '_blank');
            }}
            className="w-full bg-[#003399] text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl hover:bg-[#001F3F] transition-all active:scale-95"
          >
            <FileText size={18} /> {t('jobs_create_cv', language)}
          </button>
        </div>

        {activeTab === 'jobs' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 📊 SOBERANIA MIRA: Metrics Dashboard (Market & Platform Analytics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-2 sm:p-2.5 rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-inner">
              {/* Card 1: Vagas Ativas */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                    <Briefcase size={20} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {language === 'EN' ? 'ACTIVE VACANCIES' :
                       language === 'ES' ? 'VACANTES ACTIVAS' :
                       language === 'FR' ? 'OFFRES ACTIVES' :
                       'VAGAS ATIVAS'}
                    </span>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                      {language === 'EN' ? 'Verified active job vacancies available today' :
                       language === 'ES' ? 'Vacantes activas verificadas disponibles hoy' :
                       language === 'FR' ? 'Offres actives vérifiées disponibles aujourd\'hui' :
                       'Vagas ativas verificadas disponíveis hoje'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {marketData ? (
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {marketData.activeJobsCount.toLocaleString('pt-PT')}
                    </span>
                  ) : totalPlatformJobs !== null ? (
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {totalPlatformJobs.toLocaleString('pt-PT')}
                    </span>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-300 tracking-tight animate-pulse">
                      ••••
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2: Salário Médio Real */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp size={20} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      {language === 'EN' ? 'REAL AVERAGE SALARY' :
                       language === 'ES' ? 'SALARIO MEDIO REAL' :
                       language === 'FR' ? 'SALAIRE MOYEN RÉEL' :
                       'SALÁRIO MÉDIO REAL'}
                    </span>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
                      {marketData?.salary?.declaredJobsCount ? (
                        language === 'EN' ? `Based on ${marketData.salary.declaredJobsCount.toLocaleString('en-US')} verified salary offers` :
                        language === 'ES' ? `Basado en ${marketData.salary.declaredJobsCount.toLocaleString('es-ES')} ofertas verificadas` :
                        language === 'FR' ? `Basé sur ${marketData.salary.declaredJobsCount.toLocaleString('fr-FR')} offres vérifiées` :
                        `Apurado de ${marketData.salary.declaredJobsCount.toLocaleString('pt-PT')} vagas com remuneração em EUR`
                      ) : (
                        language === 'EN' ? 'Computed from active verified offers' :
                        language === 'ES' ? 'Calculado a partir de ofertas verificadas' :
                        language === 'FR' ? 'Calculé à partir des offres vérifiées' :
                        'Calculado a partir das vagas com salário declarado'
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {marketData?.salary?.averageEur !== null && marketData?.salary?.averageEur !== undefined ? (
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {marketData.salary.averageEur.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}€
                    </span>
                  ) : marketLoading ? (
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-300 tracking-tight animate-pulse">
                      ••••
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase text-amber-600">
                      {language === 'EN' ? 'Unavailable' :
                       language === 'ES' ? 'No disponible' :
                       language === 'FR' ? 'Indisponible' :
                       'Indisponível'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Search Bar - TOUCH ISOLATED & INTUITIVE */}
            <div className="relative z-10 block w-full touch-manipulation">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                  <Search className="text-slate-400 group-focus-within:text-mira-orange transition-colors duration-300" size={20} />
                </div>
                <input
                  type="text"
                  placeholder={t('jobs_search_placeholder', language)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-12 py-3.5 sm:py-4 bg-white border border-slate-200 hover:border-slate-300 rounded-[1.5rem] text-sm font-bold text-slate-800 focus:bg-white focus:border-mira-orange focus:ring-4 focus:ring-mira-orange/10 outline-none transition-all shadow-sm placeholder-slate-400 touch-manipulation select-text cursor-text relative z-10"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    aria-label="Limpar pesquisa"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors z-20 p-2 touch-manipulation cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filters for Foreigners & Expats - 6 Quick Filter Pills in Single Unified Group */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5 w-full relative z-0">
              {[
                { id: 'english', label: t('jobs_quick_english', language), color: 'border-blue-200 text-blue-600 bg-blue-50/70 hover:bg-blue-100' },
                { id: 'visa', label: t('jobs_quick_visa', language), color: 'border-amber-200 text-amber-700 bg-amber-50/70 hover:bg-amber-100' },
                { id: 'remote', label: t('jobs_quick_remote', language), color: 'border-teal-200 text-teal-600 bg-teal-50/70 hover:bg-teal-100' },
                { id: 'entry', label: t('jobs_quick_entry', language), color: 'border-purple-200 text-purple-600 bg-purple-50/70 hover:bg-purple-100' },
                { id: 'pcd', label: t('jobs_quick_pcd', language) || '♿ Vagas PCD', color: 'border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100' },
                { id: 'via_verde', label: t('jobs_quick_via_verde', language) || '🚦 Via Verde', color: 'border-emerald-200 text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100' },
              ].map(pill => {
                const isActive = selectedQuickFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSelectedQuickFilter(isActive ? null : pill.id)}
                    className={`w-full py-3 px-2 sm:px-3 border rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 text-center flex items-center justify-center gap-1.5 active:scale-95 shadow-sm touch-manipulation cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/20 ring-2 ring-slate-900/30'
                        : pill.color
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Expat Job Seeker Visa & Relocation Guide - Direct Navigation to Legalization Module */}
            <div className="bg-white border border-slate-200/80 rounded-[2rem] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t('jobs_insight_title', language)}
                    </h4>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-snug truncate">
                      {t('jobs_visa_guide_title', language)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-normal">
                      {t('jobs_visa_guide_sub', language)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onViewChange) {
                      onViewChange(ViewType.DOCUMENTS, { tab: 'regularize' });
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0 text-center flex items-center justify-center gap-2 shadow-sm shadow-slate-900/10 cursor-pointer touch-manipulation"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  {t('jobs_visa_guide_btn_read', language)}
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* PCD & Inclusive Employment Rights Banner (Visible when PCD quick filter is active) */}
            {selectedQuickFilter === 'pcd' && (
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-[2rem] p-5 shadow-sm space-y-2 animate-in slide-in-from-top-2 duration-300">
                <h4 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 font-mono">
                  ♿ {language === 'EN' ? 'Disability & Inclusive Employment Rights (Portugal)' :
                      language === 'ES' ? 'Derechos y Empleo Inclusivo PCD (Portugal)' :
                      language === 'FR' ? 'Droits et Emploi Inclusif Handicap (Portugal)' :
                      'Direitos & Apoio ao Emprego Inclusivo PCD (Portugal)'}
                </h4>
                <p className="text-[11px] text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                  {language === 'EN'
                    ? '• Employment Quotas (Law 4/2019): Companies with 75+ workers must reserve 1% to 2% of jobs for people with disability (degree ≥ 60%).\n• Multipurpose Medical Certificate (AMIM): Official proof of disability issued by Health Centers/ULS Medical Boards.\n• IEFP Support: Professional rehabilitation, workplace adaptation subsidies, and assistive technology.\n• Social Security (PSI): Social Benefit for Inclusion available for individuals with verified disability.'
                    : language === 'ES'
                    ? '• Cuotas de Empleo (Ley 4/2019): Empresas de más de 75 empleados deben reservar del 1% al 2% de puestos para personas con discapacidad (grado ≥ 60%).\n• Certificado Médico Multiusos (AMIM): Acreditación oficial emitida por Juntas Médicas de Centros de Salud.\n• Apoyos del IEFP: Adaptación del puesto de trabajo y subsidios de rehabilitación profesional.\n• Seguridad Social (PSI): Prestación Social para la Inclusión para situaciones de vulnerabilidad.'
                    : language === 'FR'
                    ? '• Quotas d\'emploi (Loi 4/2019) : Les entreprises de plus de 75 salariés doivent réserver 1% à 2% des postes aux personnes handicapées (≥ 60%).\n• Certificat Médical Multiusage (AMIM) : Délivré par les commissions médicales des centres de santé.\n• Aides de l\'IEFP : Adaptation du poste de travail et réhabilitation professionnelle.\n• Sécurité Sociale (PSI) : Prestation Sociale pour l\'Inclusion pour les personnes en situation de vulnérabilité.'
                    : '• Quotas Legais (Lei n.º 4/2019): Empresas com 75+ trabalhadores devem admitir 1% a 2% de trabalhadores com deficiência (grau ≥ 60%).\n• Atestado Médico de Incapacidade Multiuso (AMIM): Documento oficial emitido pelas Juntas Médicas dos Centros de Saúde/ULS.\n• Apoios do IEFP: Financiamento de adaptação do posto de trabalho, teletrabalho e bolsas de reabilitação profissional.\n• Segurança Social (PSI): Prestação Social para a Inclusão para apoio financeiro a cidadãos com incapacidade.'}
                </p>
              </div>
            )}

            {/* Advanced Filters Grid ( responsive 2-column grid with Area and Location dropdowns ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
              {/* Category Select */}
              <div className="relative space-y-2 group cursor-pointer">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5">
                  <Briefcase size={12} className="text-sky-500" /> {t('jobs_filter_area', language)}
                </label>
                <div className="relative">
                  <select
                    value={selectedWorkTopic}
                    onChange={(e) => setSelectedWorkTopic(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-sky-500/20 border border-transparent focus:border-sky-500/30 text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="Todos">🌐 {t('jobs_all_areas', language)} ({totalPlatformJobs !== null ? totalPlatformJobs.toLocaleString('pt-PT') : '••••'})</option>
                    {scrollerTopics.map(topic => {
                      const details = TOPIC_DETAILS[topic] || TOPIC_DETAILS["Outros"];
                      const count = topicCounts[topic];
                      return (
                        <option key={topic} value={topic}>
                          {details?.emoji || "💼"} {t(getWorkTopicKey(topic), language)} ({typeof count === 'number' ? count.toLocaleString('pt-PT') : '•'})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-sky-500 transition-colors" size={14} />
                </div>
              </div>

              {/* Location Select */}
              <div className="relative space-y-2 group cursor-pointer">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1.5"><MapPin size={12} className="text-mira-orange" /> {t('jobs_label_loc', language)}</label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange/20 border border-transparent focus:border-mira-orange/30 text-slate-700 transition-all cursor-pointer"
                  >
                    {LOCATIONS(language).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-mira-orange transition-colors" size={14} />
                </div>
              </div>
            </div>

        {/* Results Area */}
        {loading && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
              <Briefcase size={40} />
            </div>
            <div className="space-y-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{t('jobs_loading', language)}</p>
              <p className="text-xs font-bold text-slate-400">{t('jobs_loading_desc', language)}</p>
            </div>
          </div>
        ) : error && jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="p-4 bg-red-50 text-red-500 rounded-3xl"><AlertCircle size={32} /></div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{error}</p>
            <button onClick={() => fetchJobs(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">{t('jobs_btn_try_again', language)}</button>
          </div>
        ) : paginatedJobs.length > 0 ? (
          <div className="space-y-5">
            <div ref={jobListTopRef} className="scroll-mt-6" />

            {/* 📊 Responsive Results Counter Bar with Exact Real Counts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 border border-slate-200/70 px-4 sm:px-5 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-slate-700">
                  {language === 'EN'
                    ? `Showing ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} of ${totalEffectiveCount.toLocaleString()} jobs`
                    : language === 'ES'
                    ? `Mostrando ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} de ${totalEffectiveCount.toLocaleString()} ofertas`
                    : language === 'FR'
                    ? `Affichage de ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} sur ${totalEffectiveCount.toLocaleString()} offres`
                    : `A mostrar ${(currentPage - 1) * JOBS_PER_PAGE + 1}–${Math.min(currentPage * JOBS_PER_PAGE, totalEffectiveCount)} de ${totalEffectiveCount.toLocaleString('pt-PT')} vagas`}
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest self-end sm:self-auto">
                {language === 'EN' ? `Page ${currentPage} of ${totalPages}` : language === 'ES' ? `Pág. ${currentPage} de ${totalPages}` : language === 'FR' ? `Page ${currentPage} sur ${totalPages}` : `Página ${currentPage} de ${totalPages}`}
              </span>
            </div>

            {/* 📋 Paginated Jobs Grid */}
            <div className="grid grid-cols-1 gap-5">
              {paginatedJobs.map(job => (
                <JobItem key={job.id} job={job} language={language} onEarnPoints={onEarnPoints} />
              ))}
            </div>

            {/* 📱 Mobile & Desktop Sovereign Responsive Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-slate-100">
                {/* Mobile Quick Page Selector */}
                <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs font-bold text-slate-500">
                  <span>
                    {language === 'EN' ? 'Jump to page:' : language === 'ES' ? 'Ir a la página:' : language === 'FR' ? 'Aller à la page :' : 'Ir para página:'}
                  </span>
                  <select
                    value={currentPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    aria-label="Selecionar página"
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-mira-orange/30 cursor-pointer"
                  >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <option key={p} value={p}>
                        {p} / {totalPages}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    aria-label="Página anterior"
                    className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 touch-manipulation"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">{language === 'EN' ? 'Prev' : language === 'ES' ? 'Ant.' : language === 'FR' ? 'Préc.' : 'Anterior'}</span>
                  </button>

                  {/* Numeric buttons on desktop/tablet */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="w-7 sm:w-8 text-center text-slate-400 font-black text-xs">
                            …
                          </span>
                        );
                      }
                      const isActive = p === currentPage;
                      return (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => handlePageChange(Number(p))}
                          className={`h-9 min-w-[34px] sm:min-w-[38px] px-2 rounded-xl text-xs font-black transition-all active:scale-95 touch-manipulation ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    aria-label="Página seguinte"
                    className="flex items-center gap-1 px-3.5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 touch-manipulation"
                  >
                    <span className="hidden sm:inline">{language === 'EN' ? 'Next' : language === 'ES' ? 'Sig.' : language === 'FR' ? 'Suiv.' : 'Seguinte'}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-100 rounded-[3rem] flex items-center justify-center text-slate-200 border border-slate-100">
              <Search size={48} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('jobs_empty_title', language)}</p>
              <p className="text-sm font-medium text-slate-500 px-10 leading-relaxed">{t('jobs_empty_desc', language)}</p>
            </div>
            <button
              onClick={() => { setSelectedCity('Todos'); setSelectedWorkTopic('Todos'); setSearchQuery(''); }}
              className="px-8 py-3 bg-white text-slate-400 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              {t('jobs_reset_filters_btn', language)}
            </button>
          </div>
        )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 3 Summary Cards */}
            {marketData ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Card A: Salário Médio Geral */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <TrendingUp size={12} className="text-emerald-500" />
                    {language === 'EN' ? 'REAL AVERAGE SALARY' :
                     language === 'ES' ? 'SALARIO MEDIO REAL' :
                     language === 'FR' ? 'SALAIRE MOYEN RÉEL' :
                     'SALÁRIO MÉDIO REAL'}
                  </span>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {marketData.salary.averageEur ? `${marketData.salary.averageEur.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}€` : (
                        language === 'EN' ? 'Unavailable' :
                        language === 'ES' ? 'No disponible' :
                        language === 'FR' ? 'Indisponible' :
                        'Indisponível'
                      )}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {marketData.salary.minEur && marketData.salary.maxEur
                        ? (language === 'EN'
                            ? `Range: ${marketData.salary.minEur.toLocaleString('en-US')}€ – ${marketData.salary.maxEur.toLocaleString('en-US')}€ (${marketData.salary.declaredJobsCount.toLocaleString('en-US')} offers)`
                            : language === 'ES'
                            ? `Rango: ${marketData.salary.minEur.toLocaleString('es-ES')}€ – ${marketData.salary.maxEur.toLocaleString('es-ES')}€ (${marketData.salary.declaredJobsCount.toLocaleString('es-ES')} ofertas)`
                            : language === 'FR'
                            ? `Fourchette : ${marketData.salary.minEur.toLocaleString('fr-FR')}€ – ${marketData.salary.maxEur.toLocaleString('fr-FR')}€ (${marketData.salary.declaredJobsCount.toLocaleString('fr-FR')} offres)`
                            : `Faixa: ${marketData.salary.minEur.toLocaleString('pt-PT')}€ – ${marketData.salary.maxEur.toLocaleString('pt-PT')}€ (${marketData.salary.declaredJobsCount.toLocaleString('pt-PT')} ofertas)`)
                        : (language === 'EN'
                            ? `Base: ${marketData.salary.declaredJobsCount.toLocaleString('en-US')} offers analyzed`
                            : language === 'ES'
                            ? `Base: ${marketData.salary.declaredJobsCount.toLocaleString('es-ES')} ofertas analizadas`
                            : language === 'FR'
                            ? `Base : ${marketData.salary.declaredJobsCount.toLocaleString('fr-FR')} offres analysées`
                            : `Base: ${marketData.salary.declaredJobsCount.toLocaleString('pt-PT')} ofertas analisadas`)}
                    </p>
                  </div>
                </div>

                {/* Card B: Ofertas Ativas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Briefcase size={12} className="text-sky-500" />
                    {language === 'EN' ? 'ACTIVE VACANCIES' :
                     language === 'ES' ? 'VACANTES ACTIVAS' :
                     language === 'FR' ? 'OFFRES ACTIVES' :
                     'VAGAS ATIVAS'}
                  </span>
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {marketData.activeJobsCount.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'EN' ? 'Total verified jobs today' :
                       language === 'ES' ? 'Vacantes activas hoy en la plataforma' :
                       language === 'FR' ? 'Offres actives aujourd\'hui sur la plateforme' :
                       'Vagas ativas hoje na plataforma'}
                    </p>
                  </div>
                </div>

                {/* Card C: Crescimento Semanal */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Activity size={12} className="text-amber-500" />
                    {language === 'EN' ? 'WEEKLY GROWTH' :
                     language === 'ES' ? 'CRECIMIENTO SEMANAL' :
                     language === 'FR' ? 'CROISSANCE HEBDOMADAIRE' :
                     'CRESCIMENTO SEMANAL'}
                  </span>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-lg sm:text-xl font-black font-mono">
                      <TrendingUp size={16} className="text-emerald-500" />
                      {marketData.weeklyGrowth.growthPct >= 0 ? `+${marketData.weeklyGrowth.growthPct}%` : `${marketData.weeklyGrowth.growthPct}%`}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'EN'
                        ? `${marketData.weeklyGrowth.currentPeriodJobs.toLocaleString('en-US')} new offers in 7 days`
                        : language === 'ES'
                        ? `${marketData.weeklyGrowth.currentPeriodJobs.toLocaleString('es-ES')} nuevas vacantes en 7 días`
                        : language === 'FR'
                        ? `${marketData.weeklyGrowth.currentPeriodJobs.toLocaleString('fr-FR')} nouvelles offres en 7 jours`
                        : `${marketData.weeklyGrowth.currentPeriodJobs.toLocaleString('pt-PT')} novas vagas em 7 dias`}
                    </p>
                  </div>
                </div>
              </div>
            ) : marketLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-28 animate-pulse flex flex-col justify-between">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-8 w-32 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-red-100 text-center space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-red-500">
                  {marketError || (
                    language === 'EN' ? 'Market data unavailable' :
                    language === 'ES' ? 'Datos de mercado no disponibles' :
                    language === 'FR' ? 'Données de marché indisponibles' :
                    'Dados de mercado indisponíveis'
                  )}
                </p>
                <button
                  onClick={loadMarketData}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 cursor-pointer active:scale-95"
                >
                  {language === 'EN' ? 'Try Again' :
                   language === 'ES' ? 'Reintentar' :
                   language === 'FR' ? 'Réessayer' :
                   'Tentar Novamente'}
                </button>
              </div>
            )}

            {/* Sector Intelligence List */}
            {marketData && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800">
                    {language === 'EN' ? 'MARKET INTELLIGENCE BY SECTOR' :
                     language === 'ES' ? 'INTELIGENCIA DE MERCADO POR SECTOR' :
                     language === 'FR' ? 'INTELLIGENCE DU MARCHÉ PAR SECTEUR' :
                     'INTELIGÊNCIA DE MERCADO POR SETOR'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {language === 'EN' ? 'Salary metrics and job volumes computed dynamically from active offers in Portugal' :
                     language === 'ES' ? 'Métricas salariales y volumen de vacantes calculados dinámicamente de las ofertas en Portugal' :
                     language === 'FR' ? 'Métriques salariales et volume d\'emplois calculés dynamiquement à partir des offres actives au Portugal' :
                     'Métricas salariais e volume de vagas calculados dinamicamente a partir das ofertas ativas em Portugal'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {marketData.sectors.map(sector => {
                    const details = TOPIC_DETAILS[sector.name] || TOPIC_DETAILS['Outros'];
                    const isVeryHigh = sector.demandLevel === 'very_high';
                    const isHigh = sector.demandLevel === 'high';
                    const isMed = sector.demandLevel === 'medium';
                    const demandStyle = isVeryHigh
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                      : isHigh
                      ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                      : isMed
                      ? 'bg-sky-50 text-sky-700 border-sky-200/80'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80';

                    const demandText = isVeryHigh
                      ? t('jobs_demand_vhigh', language)
                      : isHigh
                      ? t('jobs_demand_high', language)
                      : isMed
                      ? t('jobs_demand_med', language)
                      : (language === 'EN' ? 'MODERATE DEMAND' :
                         language === 'ES' ? 'DEMANDA MODERADA' :
                         language === 'FR' ? 'DEMANDE MODÉRÉE' :
                         'PROCURA MODERADA');

                    return (
                      <div
                        key={sector.id}
                        className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:shadow-md transition-all relative overflow-hidden"
                      >
                        {/* Left strip */}
                        <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full" style={{ backgroundColor: details.color }} />

                        {/* Left Details */}
                        <div className="flex items-start gap-4 min-w-0 flex-1 pl-2">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${details.bg} border border-slate-200/50 shadow-sm`}>
                            {details.emoji}
                          </div>
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                                {getSectorDisplayName(sector.name, language)}
                              </h4>
                              <span className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${demandStyle}`}>
                                {demandText}
                              </span>
                            </div>

                            {/* 📍 Melhores Cidades / Polos de Contratação */}
                            <div className="flex items-start sm:items-center gap-1.5 text-xs text-slate-600">
                              <MapPin size={13} className="text-mira-orange shrink-0 mt-0.5 sm:mt-0" />
                              <div className="text-xs text-slate-600 font-medium leading-tight">
                                <span className="font-bold text-slate-700 mr-1">
                                  {language === 'EN' ? 'Best cities:' :
                                   language === 'ES' ? 'Mejores ciudades:' :
                                   language === 'FR' ? 'Meilleures villes :' :
                                   'Melhores cidades:'}
                                </span>
                                <span className="text-slate-600 font-semibold">
                                  {getSectorTopCities(sector.name, language)}
                                </span>
                              </div>
                            </div>

                            {/* Faixa salarial real apurada */}
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                              {sector.salaryDeclaredJobsCount > 0 ? (
                                <>
                                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                    {language === 'EN' ? 'Salary Range:' : language === 'ES' ? 'Rango Salarial:' : language === 'FR' ? 'Fourchette :' : 'Faixa salarial:'}
                                  </span>{' '}
                                  <strong className="text-slate-800">
                                    {sector.minSalaryEur.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}€ – {sector.maxSalaryEur.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}€
                                  </strong> • <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                    {language === 'FR' ? 'Base :' : 'Base:'}
                                  </span> {sector.salaryDeclaredJobsCount.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}{' '}
                                  {sector.salaryDeclaredJobsCount === 1
                                    ? (language === 'EN' ? 'offer analyzed' : language === 'ES' ? 'oferta analizada' : language === 'FR' ? 'offre analysée' : 'vaga analisada')
                                    : (language === 'EN' ? 'offers analyzed' : language === 'ES' ? 'ofertas analizadas' : language === 'FR' ? 'offres analysées' : 'vagas analisadas')}
                                </>
                              ) : (
                                <span className="text-slate-400 italic">
                                  {language === 'EN' ? 'Salary under consultation / No declared EUR data' :
                                   language === 'ES' ? 'Bajo consulta / Sin datos declarados en EUR' :
                                   language === 'FR' ? 'Sur demande / Sans données déclarées en EUR' :
                                   'Sob consulta / Sem dados declarados em EUR'}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Right Stats */}
                        <div className="flex items-center justify-between md:justify-end gap-x-8 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          {/* Salary Box */}
                          <div className="flex flex-col min-w-[110px]">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              {t('jobs_avg_salary', language)}
                            </span>
                            <span className="text-sm sm:text-base font-black font-mono text-slate-900">
                              {sector.averageSalaryEur ? `${sector.averageSalaryEur.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}€` : (
                                language === 'EN' ? 'Under consultation' :
                                language === 'ES' ? 'Bajo consulta' :
                                language === 'FR' ? 'Sur demande' :
                                'Sob consulta'
                              )}
                            </span>
                            {/* Visual Proportion Bar (Relative to leader) */}
                            <div className="w-28 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${sector.visualProportionPct}%`,
                                  backgroundColor: details.color
                                }}
                              />
                            </div>
                          </div>

                          {/* Volume Box */}
                          <div className="flex flex-col text-right min-w-[110px]">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              {language === 'EN' ? 'ACTIVE VACANCIES' :
                               language === 'ES' ? 'VACANTES ACTIVAS' :
                               language === 'FR' ? 'OFFRES ACTIVES' :
                               'VAGAS ATIVAS'}
                            </span>
                            <span className="text-sm sm:text-base font-black font-mono text-slate-900">
                              {sector.activeJobsCount.toLocaleString(language === 'EN' ? 'en-US' : 'pt-PT')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 mt-1">
                              {sector.marketSharePct}% {
                                language === 'EN' ? 'of market' :
                                language === 'ES' ? 'del mercado' :
                                language === 'FR' ? 'du marché' :
                                'do mercado'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <JobAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        language={language}
        user={user}
        onAlertsChanged={refreshAlertsCount}
      />
    </div>
  );
};
