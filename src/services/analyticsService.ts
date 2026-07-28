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

  async track(action: AppActivityLog['action'], userId: string, category?: string, metadata?: any) {
    // 🕵️ MIRA SECURITY & TELEMETRY: Strictly exclude Admins and Antigravity agents from access tracking
    if (typeof window !== 'undefined') {
      const ua = (navigator.userAgent || '').toLowerCase();
      const isAntigravityAgent = ua.includes('antigravity') || 
                                 ua.includes('headless') || 
                                 (window as any).__ANTIGRAVITY__ === true ||
                                 localStorage.getItem('mira_dev_mode') === 'true';

      const lowerUserId = (userId || '').toLowerCase();
      const isDevOrAdminUserId = lowerUserId.includes('admin') || lowerUserId.includes('dev') || lowerUserId.includes('antigravity');

      let isAdminUser = false;
      const currentUserStr = localStorage.getItem('mira_user');
      if (currentUserStr) {
        try {
          const currentUser = JSON.parse(currentUserStr);
          const emailLower = (currentUser.email || '').toLowerCase();
          const roleLower = (currentUser.role || '').toLowerCase();
          isAdminUser = roleLower === 'admin' || 
                       emailLower === 'amandasabreu89@gmail.com' ||
                       emailLower.includes('admin') ||
                       emailLower.includes('dev') ||
                       emailLower.includes('test');
        } catch (err) {}
      }

      if (isAntigravityAgent || isDevOrAdminUserId || isAdminUser) {
        console.debug('[MIRA Analytics] Excluded tracking for Admin/Antigravity:', action, userId);
        return;
      }
    }

    const log: AppActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      category,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.logs.push(log);

    // Log in development console
    console.debug('[MIRA Analytics]', log);

    // ⚡ Real-Time Access Telemetry Counter
    if (typeof window !== 'undefined' && (action === 'app_access' || action === 'app_launch' || action === 'view_changed')) {
      try {
        const currentCount = parseInt(localStorage.getItem('mira_realtime_accesses_count') || '0', 10);
        const newCount = currentCount + 1;
        localStorage.setItem('mira_realtime_accesses_count', newCount.toString());
        window.dispatchEvent(new CustomEvent('mira-access-recorded', { detail: { count: newCount } }));
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
