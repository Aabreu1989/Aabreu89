import { supabase } from '../lib/supabase';
import { JobPost } from '../types';
import { notificationService } from './notificationService';

export interface JobAlert {
  id: string;
  user_id?: string;
  workTopic: string;
  location: string;
  keywords?: string;
  contractType?: string;
  salaryMin?: number;
  salaryMax?: number;
  isActive: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  createdAt: string;
  lastNotifiedAt?: string;
}

export interface JobAlertMatch {
  id: string;
  alert_id: string;
  user_id: string;
  job_id: string;
  match_score: number;
  match_reason: string;
  created_at: string;
  status: 'created' | 'delivered' | 'read';
  delivered_at?: string;
  read_at?: string;
}

const LOCAL_KEY = 'mira_job_alerts_v1';
const DELIVERED_KEYS_KEY = 'mira_delivered_job_alert_keys_v1';

export const jobAlertService = {
  /**
   * Get all active job alert preferences from Supabase with localStorage fallback
   */
  async getAlertsAsync(userId?: string): Promise<JobAlert[]> {
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_job_alerts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: JobAlert[] = data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            workTopic: item.work_topic || 'Todos',
            location: item.location || 'Todos os Distritos',
            keywords: item.keywords || '',
            isActive: item.is_active ?? true,
            frequency: item.frequency || 'instant',
            createdAt: item.created_at,
            lastNotifiedAt: item.last_notified_at
          }));
          localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (e) {
        console.warn('MIRA JobAlert: Supabase fetch error, fallback to local', e);
      }
    }
    return this.getAlerts(userId);
  },

  /**
   * Synchronous getAlerts (reads local cache)
   */
  getAlerts(userId?: string): JobAlert[] {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const list: JobAlert[] = raw ? JSON.parse(raw) : [];
      if (userId) {
        return list.filter(a => !a.user_id || a.user_id === userId);
      }
      return list;
    } catch {
      return [];
    }
  },

  /**
   * Save a new job alert preference directly to Supabase & local cache
   */
  async saveAlert(
    alertData: { workTopic: string; location: string; keywords?: string; frequency?: 'instant' | 'daily' | 'weekly' },
    userId?: string
  ): Promise<JobAlert> {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const newAlert: JobAlert = {
      id: alertId,
      user_id: userId,
      workTopic: alertData.workTopic || 'Todos',
      location: alertData.location || 'Todos os Distritos',
      keywords: alertData.keywords?.trim() || '',
      isActive: true,
      frequency: alertData.frequency || 'instant',
      createdAt: new Date().toISOString()
    };

    // Save locally first
    const existing = this.getAlerts();
    const updated = [newAlert, ...existing];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    // Save directly to Supabase if user is authenticated
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_job_alerts')
          .insert({
            user_id: userId,
            work_topic: newAlert.workTopic,
            location: newAlert.location,
            keywords: newAlert.keywords,
            is_active: newAlert.isActive,
            frequency: newAlert.frequency,
            created_at: newAlert.createdAt
          })
          .select()
          .single();

        if (!error && data) {
          newAlert.id = data.id;
        }
      } catch (e) {
        console.warn('MIRA JobAlert: Supabase insert warning:', e);
      }
    }

    return newAlert;
  },

  /**
   * Toggle alert active status in Supabase & local cache
   */
  async toggleAlert(alertId: string, isActive: boolean, userId?: string): Promise<void> {
    const list = this.getAlerts();
    const updated = list.map(a => a.id === alertId ? { ...a, isActive } : a);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    if (userId) {
      try {
        await supabase
          .from('user_job_alerts')
          .update({ is_active: isActive })
          .eq('id', alertId);
      } catch (e) {
        console.warn('MIRA JobAlert: Toggle status warning:', e);
      }
    }
  },

  /**
   * Delete an alert preference from Supabase & local cache
   */
  async deleteAlert(alertId: string, userId?: string): Promise<void> {
    const list = this.getAlerts();
    const updated = list.filter(a => a.id !== alertId);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    if (userId) {
      try {
        await supabase
          .from('user_job_alerts')
          .delete()
          .eq('id', alertId);
      } catch (e) {
        console.warn('MIRA JobAlert: Delete alert warning:', e);
      }
    }
  },

  /**
   * 🧠 MATCHING ENGINE (Job × User Preference)
   * Calculates compatibility score (0-100) and detailed match reason
   */
  evaluateJobMatch(job: JobPost, alert: JobAlert): { isMatch: boolean; score: number; reason: string } {
    if (!alert.isActive) return { isMatch: false, score: 0, reason: 'Alerta inativo' };

    let score = 0;
    const matchReasons: string[] = [];

    const norm = (str?: string) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const jobTitle = norm(job.title);
    const jobTopic = norm(job.workTopic);
    const jobLoc = norm(job.location);
    const alertTopic = norm(alert.workTopic);
    const alertLoc = norm(alert.location);
    const alertKw = norm(alert.keywords);

    // 1. Work Topic / Category Match (+40 pts)
    if (alert.workTopic === 'Todos' || alertTopic === 'todos') {
      score += 25;
      matchReasons.push('Área geral abrangida');
    } else if (jobTopic.includes(alertTopic) || alertTopic.includes(jobTopic)) {
      score += 40;
      matchReasons.push(`Correspondência de área: ${alert.workTopic}`);
    } else {
      // Category mismatch -> No match
      return { isMatch: false, score: 0, reason: 'Área incompatível' };
    }

    // 2. Location Match (+35 pts)
    if (alert.location === 'Todos os Distritos' || alertLoc === 'todos os distritos' || alertLoc === 'todos') {
      score += 25;
      matchReasons.push('Todas as localizações abrangidas');
    } else if (jobLoc.includes(alertLoc) || alertLoc.includes(jobLoc) || jobTitle.includes('remoto') || jobLoc.includes('remoto')) {
      score += 35;
      matchReasons.push(`Correspondência de distrito: ${alert.location}`);
    } else {
      // Location mismatch -> No match
      return { isMatch: false, score: 0, reason: 'Localização incompatível' };
    }

    // 3. Keywords Match (+25 pts)
    if (!alertKw) {
      score += 25;
    } else {
      const kwTokens = alertKw.split(/[\s,]+/).filter(k => k.length > 2);
      const kwMatches = kwTokens.filter(kw => jobTitle.includes(kw));
      if (kwMatches.length > 0) {
        score += 25;
        matchReasons.push(`Palavras-chave encontradas: ${kwMatches.join(', ')}`);
      } else {
        // Keyword required but not present
        return { isMatch: false, score: 0, reason: 'Palavra-chave não encontrada' };
      }
    }

    const finalScore = Math.min(100, Math.max(0, score));
    return {
      isMatch: finalScore >= 50,
      score: finalScore,
      reason: matchReasons.join(' • ')
    };
  },

  /**
   * Track delivered alert keys to prevent duplicate alert notifications
   */
  getDeliveredKeys(): Set<string> {
    try {
      const raw = localStorage.getItem(DELIVERED_KEYS_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  },

  recordDeliveredKey(key: string) {
    try {
      const keys = this.getDeliveredKeys();
      keys.add(key);
      localStorage.setItem(DELIVERED_KEYS_KEY, JSON.stringify(Array.from(keys).slice(-500)));
    } catch (e) {}
  },

  /**
   * ⚡ PIPELINE DE ATRIBUIÇÃO E PERSISTÊNCIA EM TEMPO REAL
   * Evaluates jobs against user alert preferences, creates persistent notifications, and triggers realtime delivery
   */
  async processJobMatching(jobs: JobPost[], userId?: string): Promise<number> {
    if (!jobs || jobs.length === 0) return 0;
    const alerts = await this.getAlertsAsync(userId);
    const activeAlerts = alerts.filter(a => a.isActive);
    if (activeAlerts.length === 0) return 0;

    let matchCount = 0;
    const deliveredKeys = this.getDeliveredKeys();

    for (const alert of activeAlerts) {
      const targetUserId = alert.user_id || userId;
      if (!targetUserId) continue;

      for (const job of jobs.slice(0, 100)) { // Check top 100 recent jobs
        const deliveryKey = `${targetUserId}:${job.id}:${alert.id}`;
        if (deliveredKeys.has(deliveryKey)) continue;

        const { isMatch, score, reason } = this.evaluateJobMatch(job, alert);
        if (isMatch) {
          this.recordDeliveredKey(deliveryKey);
          matchCount++;

          const notifTitle = `💼 Nova Vaga Compatível: ${job.title}`;
          const notifMsg = `${job.sourceName} • ${job.location}\nMotivo: ${reason}`;

          // Persist directly to Supabase Notifications table for real-time delivery
          try {
            await supabase.from('notifications').insert({
              user_id: targetUserId,
              type: 'jobs',
              title: notifTitle,
              message: notifMsg,
              is_read: false,
              link: `/jobs?jobId=${encodeURIComponent(job.id)}`,
              created_at: new Date().toISOString()
            });
          } catch (e) {
            console.warn('MIRA JobAlert: Notification creation warning:', e);
          }

          // Update last_notified_at for the alert
          if (alert.id && !alert.id.startsWith('alert-')) {
            try {
              await supabase
                .from('user_job_alerts')
                .update({ last_notified_at: new Date().toISOString() })
                .eq('id', alert.id);
            } catch (e) {}
          }
        }
      }
    }

    return matchCount;
  },

  /**
   * 📡 SUPABASE REALTIME SUBSCRIPTION FOR JOB ALERTS
   * Subscribes connected clients to live Postgres changes on job alerts and notifications
   */
  subscribeToJobAlerts(
    userId: string,
    onAlertReceived: (notification: any) => void
  ) {
    if (!userId) return null;

    const channel = supabase
      .channel(`job_alerts_live:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && payload.new.type === 'jobs') {
            onAlertReceived(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_job_alerts',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Re-fetch preferences when user changes them on another device
          this.getAlertsAsync(userId);
        }
      )
      .subscribe();

    return channel;
  }
};
