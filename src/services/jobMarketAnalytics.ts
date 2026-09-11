import { SupabaseClient } from '@supabase/supabase-js';
import { WORK_TOPICS } from '../types';
import { normalizeWorkTopic, getWorkTopicKey } from '../utils/categoryUtils';

export interface SectorIntelligence {
  id: string;
  name: string;
  topicKey: string;
  activeJobsCount: number;
  salaryDeclaredJobsCount: number;
  averageSalaryEur: number | null;
  minSalaryEur: number | null;
  maxSalaryEur: number | null;
  marketSharePct: number;
  visualProportionPct: number;
  demandLevel: 'very_high' | 'high' | 'medium' | 'moderate';
}

export interface MarketIntelligence {
  generatedAt: string;
  activeJobsCount: number;
  salary: {
    rawRecordsCount: number;
    declaredJobsCount: number; // parseableSalaryRecordsCount
    unparseableRecordsCount: number;
    averageEur: number | null;
    minEur: number | null;
    maxEur: number | null;
  };
  weeklyGrowth: {
    currentPeriodJobs: number;
    previousPeriodJobs: number;
    growthPct: number;
  };
  sectors: SectorIntelligence[];
  userInterest?: UserJobInterestAnalytics;
}

export interface ParsedSalary {
  min: number;
  max: number;
  midpoint: number;
}

/**
 * Parser canónico de salário conforme especificação U-JOBS-MARKET-01:
 * - B4: Exige evidência explícita de EUR (€, eur, euro, euros) e rejeita moedas estrangeiras ($, gbp, brl, etc.)
 * - B3: Determina periodicidade exclusivamente por evidência textual explícita (sem heurística de tamanho)
 * - Sanidade: Valores mensais normalizados entre 400 € e 25.000 €
 */
export function parseSalaryRange(salaryStr: string | null | undefined): ParsedSalary | null {
  if (!salaryStr || typeof salaryStr !== 'string') return null;

  const raw = salaryStr.trim();
  if (!raw) return null;

  // B4: Rejeitar se contiver moeda estrangeira
  if (/(\$|usd|gbp|£|brl|r\$)/i.test(raw)) {
    return null;
  }

  // B4: Exigir evidência explícita de EUR (€, eur, euro, euros)
  if (!/(€|eur|euro|euros)/i.test(raw)) {
    return null;
  }

  // Extrair números (remover pontos separadores de milhar seguidos de 3 dígitos)
  const cleanStr = raw.replace(/\.(\d{3})/g, '$1');
  const matches = [...cleanStr.matchAll(/(\d+(?:,\d+)?)/g)];
  if (!matches || matches.length === 0) return null;

  const nums = matches
    .map(m => parseFloat(m[1].replace(',', '.')))
    .filter(n => !isNaN(n) && n > 0);

  if (nums.length === 0) return null;

  let min = nums[0];
  let max = nums.length > 1 ? nums[1] : nums[0];
  if (min > max) [min, max] = [max, min];

  // B3: Periodicidade estritamente por evidência textual explícita
  const isAnnual = /(ano|year|anual|annual|ao ano|p\/\s*ano|\/\s*ano|\/\s*year)/i.test(raw);
  const isHourly = /(hora|hour|à hora|a hora|p\/\s*hora|\/\s*h\b|\/\s*hora)/i.test(raw);

  if (isAnnual) {
    min = Math.round(min / 12);
    max = Math.round(max / 12);
  } else if (isHourly) {
    min = Math.round(min * 160);
    max = Math.round(max * 160);
  }
  // Se for mensal explícito ou sem evidência textual de periodicidade, mantém o valor nominal

  // Validação de sanidade mensal em Portugal: 400€ a 25.000€
  if (min < 400 || min > 25000) return null;
  if (max < 400 || max > 25000) max = min;
  if (min > max) [min, max] = [max, min];

  const midpoint = Math.round((min + max) / 2);
  return { min, max, midpoint };
}

/**
 * Carrega a inteligência de mercado completa a partir do Supabase real com:
 * - Janela canónica de 90 dias para vagas ativas (is_active = true AND created_at >= ninetyDaysAgo)
 * - B1: Crescimento semanal medindo criação real (sem is_active) com janelas disjuntas (< T7)
 * - B2: Cobertura exaustiva paginada sem truncamento silencioso + reconciliação obrigatória
 * - B5: Desempate determinístico nos setores (activeJobsCount DESC, name ASC)
 * - Invariantes de runtime rígidas
 */
export async function fetchMarketIntelligence(supabase: SupabaseClient): Promise<MarketIntelligence> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const t0 = now.toISOString();
  const t7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const t14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Total de vagas ativas
  const { count: activeJobsCount, error: errActive } = await supabase
    .from('job_posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('created_at', ninetyDaysAgo);

  if (errActive) throw new Error(`Falha ao obter total de vagas ativas: ${errActive.message}`);
  const totalActive = activeJobsCount ?? 0;

  // 2. Crescimento semanal (B1: criação real, sem is_active, limites disjuntos)
  const [currWeekRes, prevWeekRes] = await Promise.all([
    supabase
      .from('job_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', t7)
      .lte('created_at', t0),
    supabase
      .from('job_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', t14)
      .lt('created_at', t7)
  ]);

  if (currWeekRes.error) throw new Error(`Falha ao obter novas vagas do período atual: ${currWeekRes.error.message}`);
  if (prevWeekRes.error) throw new Error(`Falha ao obter novas vagas do período anterior: ${prevWeekRes.error.message}`);

  const currentPeriodJobs = currWeekRes.count ?? 0;
  const previousPeriodJobs = prevWeekRes.count ?? 0;
  const growthPct = previousPeriodJobs > 0
    ? Math.round(((currentPeriodJobs - previousPeriodJobs) / previousPeriodJobs) * 100)
    : 0;

  // 3. Obtenção exaustiva de todas as vagas com salário
  const { count: totalSalaryRows, error: errSalCount } = await supabase
    .from('job_posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('created_at', ninetyDaysAgo)
    .not('salary_range', 'is', null)
    .neq('salary_range', '');

  if (errSalCount) throw new Error(`Falha ao contar vagas com salário: ${errSalCount.message}`);
  const rawSalaryRecordsCount = totalSalaryRows ?? 0;

  const pageSize = 1000;
  const pageCount = Math.ceil(rawSalaryRecordsCount / pageSize);
  const chunkPromises: Promise<any>[] = [];

  for (let p = 0; p < pageCount; p++) {
    chunkPromises.push(
      Promise.resolve(
        supabase
          .from('job_posts')
          .select('title, salary_range, work_topic')
          .eq('is_active', true)
          .gte('created_at', ninetyDaysAgo)
          .not('salary_range', 'is', null)
          .neq('salary_range', '')
          .range(p * pageSize, (p + 1) * pageSize - 1)
      )
    );
  }

  const chunkResults = await Promise.all(chunkPromises);
  for (const chunk of chunkResults) {
    if (chunk.error) throw new Error(`Falha ao paginar registos salariais: ${chunk.error.message}`);
  }

  const salaryRecords = chunkResults.flatMap(r => r.data || []);

  // Invariante de runtime 1: registosObtidos === rawRecordsCount
  if (salaryRecords.length !== rawSalaryRecordsCount) {
    throw new Error(
      `Erro de integridade no runtime: esperados ${rawSalaryRecordsCount} registos de salário, mas obtidos ${salaryRecords.length}.`
    );
  }

  // 4. Parser e cálculo de salários com separação B2 (parseable vs unparseable)
  let salarySum = 0;
  let declaredJobsCount = 0;
  let unparseableRecordsCount = 0;
  let minEur = Infinity;
  let maxEur = -Infinity;

  const topicSalaryMap: Record<string, { count: number; sum: number; min: number; max: number }> = {};

  for (const record of salaryRecords) {
    const parsed = parseSalaryRange(record.salary_range);
    if (parsed) {
      declaredJobsCount++;
      salarySum += parsed.midpoint;
      minEur = Math.min(minEur, parsed.min);
      maxEur = Math.max(maxEur, parsed.max);

      const topic = normalizeWorkTopic(record.work_topic, record.title);
      if (!topicSalaryMap[topic]) {
        topicSalaryMap[topic] = { count: 0, sum: 0, min: Infinity, max: -Infinity };
      }
      topicSalaryMap[topic].count++;
      topicSalaryMap[topic].sum += parsed.midpoint;
      topicSalaryMap[topic].min = Math.min(topicSalaryMap[topic].min, parsed.min);
      topicSalaryMap[topic].max = Math.max(topicSalaryMap[topic].max, parsed.max);
    } else {
      unparseableRecordsCount++;
    }
  }

  // Invariante de runtime 2: rawRecordsCount === declaredJobsCount + unparseableRecordsCount
  if (rawSalaryRecordsCount !== declaredJobsCount + unparseableRecordsCount) {
    throw new Error(
      `Erro de integridade no runtime: rawSalaryRecordsCount (${rawSalaryRecordsCount}) !== declaredJobsCount (${declaredJobsCount}) + unparseableRecordsCount (${unparseableRecordsCount}).`
    );
  }

  const averageEur = declaredJobsCount > 0 ? Math.round(salarySum / declaredJobsCount) : null;

  // 5. Total de vagas ativas por setor (WORK_TOPICS)
  const sectorCountPromises = WORK_TOPICS.map(async (topic) => {
    const { count, error } = await supabase
      .from('job_posts')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('created_at', ninetyDaysAgo)
      .eq('work_topic', topic);

    if (error) throw new Error(`Falha ao obter contagem do setor ${topic}: ${error.message}`);
    return { topic, count: count ?? 0 };
  });

  const sectorCounts = await Promise.all(sectorCountPromises);
  const maxSectorActiveJobs = Math.max(...sectorCounts.map(s => s.count), 1);

  // B5: Desempate determinístico imutável: activeJobsCount DESC, topic ASC
  const sortedSectors = [...sectorCounts].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.topic.localeCompare(b.topic);
  });

  const totalSectors = sortedSectors.length;

  const sectors: SectorIntelligence[] = sortedSectors.map((sec, index) => {
    const sData = topicSalaryMap[sec.topic];
    const sActive = sec.count;
    const sDeclared = sData ? sData.count : 0;
    const sAvg = sDeclared > 0 ? Math.round(sData.sum / sDeclared) : null;
    const sMin = sDeclared > 0 ? sData.min : null;
    const sMax = sDeclared > 0 ? sData.max : null;

    const marketSharePct = totalActive > 0
      ? Number(((sActive / totalActive) * 100).toFixed(1))
      : 0;

    const visualProportionPct = Math.min(
      100,
      Math.max(8, Math.round((sActive / maxSectorActiveJobs) * 100))
    );

    // Percentil de procura determinístico
    const rankPct = index / (totalSectors || 1);
    let demandLevel: 'very_high' | 'high' | 'medium' | 'moderate' = 'moderate';
    if (rankPct < 0.25) demandLevel = 'very_high';
    else if (rankPct < 0.50) demandLevel = 'high';
    else if (rankPct < 0.75) demandLevel = 'medium';

    return {
      id: sec.topic.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: sec.topic,
      topicKey: getWorkTopicKey(sec.topic),
      activeJobsCount: sActive,
      salaryDeclaredJobsCount: sDeclared,
      averageSalaryEur: sAvg,
      minSalaryEur: sMin,
      maxSalaryEur: sMax,
      marketSharePct,
      visualProportionPct,
      demandLevel
    };
  });

  // 6. Inteligência de procura real dos utilizadores (telemetria de cliques em activity_logs)
  const userInterest = await fetchUserJobInterestAnalytics(supabase, 90);

  return {
    generatedAt: now.toISOString(),
    activeJobsCount: totalActive,
    salary: {
      rawRecordsCount: rawSalaryRecordsCount,
      declaredJobsCount,
      unparseableRecordsCount,
      averageEur,
      minEur: minEur === Infinity ? null : minEur,
      maxEur: maxEur === -Infinity ? null : maxEur
    },
    weeklyGrowth: {
      currentPeriodJobs,
      previousPeriodJobs,
      growthPct
    },
    sectors,
    userInterest
  };
}

export interface UserJobInterestCategory {
  rank: number;
  category: string;
  topicKey: string;
  uniqueUsers: number;
  anonymousClicks: number;
  totalClicks: number;
  uniqueJobsViewed: number;
  sharePct: number;
}

export interface UserJobInterestAnalytics {
  periodDays: number;
  startDate: string;
  endDate: string;
  totalUniqueUsers: number;
  totalAnonymousClicks: number;
  totalClicks: number;
  totalUniqueJobs: number;
  categories: UserJobInterestCategory[];
}

/**
 * Agregação canónica da procura dos utilizadores a partir de public.activity_logs (action = 'job_click')
 * - Diferencia estritamente utilizadores autenticados de cliques anónimos
 * - Correlaciona o job_id com public.job_posts.work_topic para obter a categoria canónica
 * - Ordenação: uniqueUsers DESC -> totalClicks DESC -> uniqueJobsViewed DESC
 * - Regra T7: categorias sem cliques não são apresentadas como tendo procura
 */
export async function fetchUserJobInterestAnalytics(
  supabase: SupabaseClient,
  periodDays: number = 90
): Promise<UserJobInterestAnalytics> {
  const now = new Date();
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const endDate = now.toISOString();

  try {
    const { data: clickLogs, error: logError } = await supabase
      .from('activity_logs')
      .select('id, user_id, metadata, created_at')
      .eq('action', 'job_click')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (logError || !clickLogs || clickLogs.length === 0) {
      return {
        periodDays,
        startDate,
        endDate,
        totalUniqueUsers: 0,
        totalAnonymousClicks: 0,
        totalClicks: 0,
        totalUniqueJobs: 0,
        categories: []
      };
    }

    // 1. Extrair job IDs distintos para correlação canónica com job_posts
    const distinctJobIds = Array.from(
      new Set(clickLogs.map(c => c.metadata?.id || c.metadata?.job_id).filter(Boolean))
    );

    const jobPostTopicMap = new Map<string, string>();
    if (distinctJobIds.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < distinctJobIds.length; i += chunkSize) {
        const chunk = distinctJobIds.slice(i, i + chunkSize);
        const { data: posts } = await supabase
          .from('job_posts')
          .select('id, work_topic')
          .in('id', chunk);

        if (posts) {
          for (const p of posts) {
            if (p.work_topic) {
              jobPostTopicMap.set(p.id, p.work_topic);
            }
          }
        }
      }
    }

    // 2. Agregação canónica por categoria
    interface CatAgg {
      category: string;
      users: Set<string>;
      jobs: Set<string>;
      anonymousClicks: number;
      totalClicks: number;
    }

    const catMap = new Map<string, CatAgg>();
    const globalUsers = new Set<string>();
    const globalJobs = new Set<string>();
    let totalAnonymousClicks = 0;

    for (const c of clickLogs) {
      const jId = c.metadata?.id || c.metadata?.job_id;
      // Regra Canónica: prioridade absoluta para work_topic real armazenado em job_posts
      const category = (jId && jobPostTopicMap.get(jId)) || c.metadata?.workTopic || c.metadata?.category || 'Outros';

      if (!catMap.has(category)) {
        catMap.set(category, {
          category,
          users: new Set<string>(),
          jobs: new Set<string>(),
          anonymousClicks: 0,
          totalClicks: 0
        });
      }

      const agg = catMap.get(category)!;
      agg.totalClicks++;

      if (c.user_id) {
        agg.users.add(c.user_id);
        globalUsers.add(c.user_id);
      } else {
        agg.anonymousClicks++;
        totalAnonymousClicks++;
      }

      if (jId) {
        agg.jobs.add(jId);
        globalJobs.add(jId);
      }
    }

    const totalUniqueUsers = globalUsers.size;
    const totalClicks = clickLogs.length;

    // 3. Ordenação canónica: Unique Users DESC -> Total Clicks DESC -> Unique Jobs DESC
    const sortedCats = Array.from(catMap.values()).sort((a, b) => {
      if (b.users.size !== a.users.size) return b.users.size - a.users.size;
      if (b.totalClicks !== a.totalClicks) return b.totalClicks - a.totalClicks;
      if (b.jobs.size !== a.jobs.size) return b.jobs.size - a.jobs.size;
      return a.category.localeCompare(b.category);
    });

    // 4. Mapeamento dos itens de categoria com Rank determinístico
    const categories: UserJobInterestCategory[] = sortedCats.map((item, index) => {
      const uCount = item.users.size;
      // Se houver utilizadores autenticados, % de utilizadores interessados = (uCount / totalUniqueUsers) * 100
      // Se não houver utilizadores autenticados (ex: histórico anónimo), % de share dos cliques
      const sharePct = totalUniqueUsers > 0
        ? Number(((uCount / totalUniqueUsers) * 100).toFixed(1))
        : (totalClicks > 0 ? Number(((item.totalClicks / totalClicks) * 100).toFixed(1)) : 0);

      return {
        rank: index + 1,
        category: item.category,
        topicKey: getWorkTopicKey(item.category),
        uniqueUsers: uCount,
        anonymousClicks: item.anonymousClicks,
        totalClicks: item.totalClicks,
        uniqueJobsViewed: item.jobs.size,
        sharePct
      };
    });

    return {
      periodDays,
      startDate,
      endDate,
      totalUniqueUsers,
      totalAnonymousClicks,
      totalClicks,
      totalUniqueJobs: globalJobs.size,
      categories
    };
  } catch (err) {
    console.warn('MIRA: Falha ao carregar telemetria de interesse dos utilizadores:', err);
    return {
      periodDays,
      startDate,
      endDate,
      totalUniqueUsers: 0,
      totalAnonymousClicks: 0,
      totalClicks: 0,
      totalUniqueJobs: 0,
      categories: []
    };
  }
}

