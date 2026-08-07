import { AppActivityLog } from '../types';
import { supabase } from '../lib/supabase';

class AnalyticsService {
  private logs: AppActivityLog[] = [];

  constructor() {
    this.loadLogs();
  }

  async loadLogs() {
    try {
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      if (data) {
        this.logs = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          action: d.action,
          category: d.category,
          timestamp: d.created_at,
          metadata: d.metadata
        }));
      }
    } catch (e) {
      console.error('Error loading analytics logs', e);
    }
  }

  logActivity(action: any, metadata?: any) {
    this.track(action as any, 'guest', undefined, metadata);
  }

  async track(action: AppActivityLog['action'], userId: string, category?: string, metadata?: any) {
    const log: AppActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userId || 'guest',
      action,
      category,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.logs.push(log);

    // Log in development console
    console.debug('[MIRA Analytics]', log);

    // ⚡ Real-Time Access & Telemetry Counters for Admin Hub Live Updates
    if (typeof window !== 'undefined') {
      try {
        if (action === 'app_access' || action === 'app_launch' || action === 'view_changed') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_accesses_count') || '0', 10);
          const newCount = currentCount + 1;
          localStorage.setItem('mira_realtime_accesses_count', newCount.toString());
          window.dispatchEvent(new CustomEvent('mira-access-recorded', { detail: { count: newCount } }));
        } else if (action === 'ai_query') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_ai_queries_count') || '0', 10);
          const newCount = currentCount + 1;
          localStorage.setItem('mira_realtime_ai_queries_count', newCount.toString());
        } else if (action === 'use_simulator' || (action as string) === 'simulation_run') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_simulations_count') || '0', 10);
          const newCount = currentCount + 1;
          localStorage.setItem('mira_realtime_simulations_count', newCount.toString());
          if (metadata?.simulatorId || metadata?.name) {
            const key = `mira_sim_count_${metadata.simulatorId || metadata.name}`;
            const itemVal = parseInt(localStorage.getItem(key) || '0', 10);
            localStorage.setItem(key, (itemVal + 1).toString());
          }
        } else if (action === 'generate_document' || (action as string) === 'download_document' || (action as string) === 'doc_generated') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_documents_count') || '0', 10);
          const newCount = currentCount + 1;
          localStorage.setItem('mira_realtime_documents_count', newCount.toString());
          if (metadata?.templateId || metadata?.title || metadata?.name) {
            const key = `mira_doc_count_${metadata.templateId || metadata.title || metadata.name}`;
            const itemVal = parseInt(localStorage.getItem(key) || '0', 10);
            localStorage.setItem(key, (itemVal + 1).toString());
          }
        } else if (action === 'post_created' || (action as string) === 'create_post') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_posts_count') || '0', 10);
          localStorage.setItem('mira_realtime_posts_count', (currentCount + 1).toString());
        } else if (action === 'comment_created' || (action as string) === 'add_comment') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_comments_count') || '0', 10);
          localStorage.setItem('mira_realtime_comments_count', (currentCount + 1).toString());
        } else if (action === 'like_post' || (action as string) === 'post_liked') {
          const currentCount = parseInt(localStorage.getItem('mira_realtime_likes_count') || '0', 10);
          localStorage.setItem('mira_realtime_likes_count', (currentCount + 1).toString());
        }

        window.dispatchEvent(new CustomEvent('mira-telemetry-update', { detail: { action } }));
      } catch (e) {}
    }

    // Send to Supabase async without blocking the UI
    const isValidUuid = typeof userId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    const dbPayload: any = {
      action: action,
      metadata: { ...(metadata || {}), category: category || null, guest_id: !isValidUuid ? userId : undefined }
    };
    if (isValidUuid) {
      dbPayload.user_id = userId;
    }

    supabase.from('activity_logs').insert([dbPayload]).then(({ error }) => {
      if (error) {
          console.warn('[MIRA Telemetry] Local Sync Pending:', error.message);
      }
    });
  }

  getLocalAccessCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
      return parseInt(localStorage.getItem('mira_realtime_accesses_count') || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  getLogs() {
    return [...this.logs];
  }

  getLogsByTimeRange(range: string) {
    const now = new Date();
    const filterDate = new Date();

    if (range === 'day' || range === '24h') filterDate.setHours(now.getHours() - 24);
    else if (range === 'week' || range === '7d') filterDate.setDate(now.getDate() - 7);
    else if (range === 'month' || range === '30d') filterDate.setMonth(now.getMonth() - 1);
    else if (range === 'year') filterDate.setFullYear(now.getFullYear() - 1);

    return this.logs.filter(log => new Date(log.timestamp) >= filterDate);
  }
}

export const analytics = new AnalyticsService();
export const analyticsService = analytics;
