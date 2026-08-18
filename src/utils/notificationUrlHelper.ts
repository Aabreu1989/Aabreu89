import { AppNotification } from '../services/notificationService';
import { PROTECTED_JOBS } from './massiveJobsDatabase';

/**
 * Resolves the external vacancy URL from a notification with 100% fallback reliability
 */
export function resolveNotificationJobUrl(n: AppNotification | null | undefined): string | null {
  if (!n) return null;

  // 1. Direct metadata sourceUrl
  if (n.metadata?.sourceUrl && typeof n.metadata.sourceUrl === 'string') {
    const raw = n.metadata.sourceUrl.trim();
    if (raw.length > 3 && raw !== '#' && raw !== 'null' && raw !== 'undefined') {
      return (!raw.startsWith('http') && !raw.startsWith('mailto:')) ? `https://${raw}` : raw;
    }
  }

  // 2. Direct http link
  if (n.link && typeof n.link === 'string' && n.link.startsWith('http')) {
    return n.link.trim();
  }

  // 3. Extract jobId from metadata or link (/jobs?jobId=XYZ)
  let jobId = n.metadata?.jobId;
  if (!jobId && n.link && n.link.includes('jobId=')) {
    try {
      const parts = n.link.split('jobId=');
      if (parts[1]) {
        jobId = decodeURIComponent(parts[1].split('&')[0]);
      }
    } catch {
      // ignore
    }
  }

  if (jobId) {
    const found = PROTECTED_JOBS.find(j => j.id === jobId);
    if (found && found.source_url && found.source_url.length > 3 && found.source_url !== '#') {
      const raw = found.source_url.trim();
      return (!raw.startsWith('http') && !raw.startsWith('mailto:')) ? `https://${raw}` : raw;
    }
  }

  // 4. Fallback search by title in massive database
  if (n.type === 'jobs' && n.title) {
    const cleanTitle = n.title
      .replace(/^💼\s*/i, '')
      .replace(/^Nova Vaga Compatível:\s*/i, '')
      .replace(/^Nova Vaga:\s*/i, '')
      .trim()
      .toLowerCase();

    if (cleanTitle.length >= 3) {
      const found = PROTECTED_JOBS.find(j => 
        j.title && (j.title.toLowerCase().includes(cleanTitle) || cleanTitle.includes(j.title.toLowerCase()))
      );
      if (found && found.source_url && found.source_url.length > 3 && found.source_url !== '#') {
        const raw = found.source_url.trim();
        return (!raw.startsWith('http') && !raw.startsWith('mailto:')) ? `https://${raw}` : raw;
      }
    }
  }

  return null;
}
