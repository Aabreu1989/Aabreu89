import { AppNotification } from '../services/notificationService';
import { supabase } from '../lib/supabase';

function normalizeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length <= 3 || trimmed === '#' || trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }
  return (!trimmed.startsWith('http') && !trimmed.startsWith('mailto:')) ? `https://${trimmed}` : trimmed;
}

export function extractNotificationJobId(n: AppNotification | null | undefined): string | null {
  if (!n) return null;
  if (n.metadata?.jobId) return String(n.metadata.jobId);
  if (n.link && n.link.includes('jobId=')) {
    try {
      const parts = n.link.split('jobId=');
      if (parts[1]) {
        return decodeURIComponent(parts[1].split('&')[0]);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Fast O(1) synchronous resolver — safe to call during render without pulling
 * the 7MB massiveJobsDatabase into the main bundle.
 */
export function resolveNotificationJobUrl(n: AppNotification | null | undefined): string | null {
  if (!n) return null;

  // 1. Direct metadata sourceUrl
  const metaUrl = normalizeExternalUrl(n.metadata?.sourceUrl);
  if (metaUrl) return metaUrl;

  // 2. Direct http link
  if (n.link && typeof n.link === 'string' && n.link.startsWith('http')) {
    return n.link.trim();
  }

  return null;
}

/**
 * On-click async fallback: queries live Supabase job_posts by jobId (0 KB bundle overhead).
 */
export async function resolveNotificationJobUrlAsync(n: AppNotification | null | undefined): Promise<string | null> {
  const direct = resolveNotificationJobUrl(n);
  if (direct) return direct;

  const jobId = extractNotificationJobId(n);
  if (jobId) {
    try {
      const { data } = await supabase
        .from('job_posts')
        .select('source_url')
        .eq('id', jobId)
        .maybeSingle();
      const dbUrl = normalizeExternalUrl(data?.source_url);
      if (dbUrl) return dbUrl;
    } catch {
      // ignore
    }
  }

  return null;
}
