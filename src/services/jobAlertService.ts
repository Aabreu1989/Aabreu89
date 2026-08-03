import { supabase } from '../lib/supabase';
import { JobPost } from '../types';

export interface JobAlert {
  id: string;
  user_id?: string;
  workTopic: string;
  location: string;
  keywords?: string;
  isActive: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  createdAt: string;
  lastNotifiedAt?: string;
}

const LOCAL_KEY = 'mira_job_alerts_v1';

export const jobAlertService = {
  /**
   * Get all active alerts for current session / user
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
   * Save a new job alert
   */
  async saveAlert(
    alertData: { workTopic: string; location: string; keywords?: string; frequency?: 'instant' | 'daily' | 'weekly' },
    userId?: string
  ): Promise<JobAlert> {
    const newAlert: JobAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      workTopic: alertData.workTopic || 'Todos',
      location: alertData.location || 'Todos os Distritos',
      keywords: alertData.keywords?.trim() || '',
      isActive: true,
      frequency: alertData.frequency || 'instant',
      createdAt: new Date().toISOString()
    };

    // 1. Save locally
    const existing = this.getAlerts();
    const updated = [newAlert, ...existing];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    // 2. Sync to Supabase if logged in
    if (userId) {
      try {
        await supabase.from('user_job_alerts').upsert({
          id: newAlert.id,
          user_id: userId,
          work_topic: newAlert.workTopic,
          location: newAlert.location,
          keywords: newAlert.keywords,
          is_active: newAlert.isActive,
          frequency: newAlert.frequency,
          created_at: newAlert.createdAt
        });
      } catch (e) {
        console.warn('MIRA JobAlert: Supabase sync warning:', e);
      }
    }

    return newAlert;
  },

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId: string, isActive: boolean, userId?: string): Promise<void> {
    const list = this.getAlerts();
    const updated = list.map(a => a.id === alertId ? { ...a, isActive } : a);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    if (userId) {
      try {
        await supabase.from('user_job_alerts').update({ is_active: isActive }).eq('id', alertId);
      } catch (e) {}
    }
  },

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string, userId?: string): Promise<void> {
    const list = this.getAlerts();
    const updated = list.filter(a => a.id !== alertId);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    if (userId) {
      try {
        await supabase.from('user_job_alerts').delete().eq('id', alertId);
      } catch (e) {}
    }
  },

  /**
   * Core Engine: Check active alerts against recent jobs and generate notifications
   */
  async checkAlertsAndNotify(jobs: JobPost[], userId?: string): Promise<number> {
    const alerts = this.getAlerts(userId).filter(a => a.isActive);
    if (alerts.length === 0 || !jobs || jobs.length === 0) return 0;

    const now = Date.now();
    let notificationCount = 0;
    const NOTIFY_COOL_DOWN_MS = 12 * 60 * 60 * 1000; // 12 hours cooldown per alert

    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    for (const alert of alerts) {
      // Check cooldown
      const lastNotified = alert.lastNotifiedAt ? new Date(alert.lastNotifiedAt).getTime() : 0;
      if (now - lastNotified < NOTIFY_COOL_DOWN_MS) continue;

      // Filter jobs matching alert criteria
      const topicNorm = normalize(alert.workTopic);
      const locNorm = normalize(alert.location);
      const kwNorm = alert.keywords ? normalize(alert.keywords) : '';

      const matchingJobs = jobs.filter(job => {
        const jTopic = normalize(job.workTopic || '');
        const jLoc = normalize(job.location || '');
        const jTitle = normalize(job.title || '');

        const matchesTopic = topicNorm === 'todos' || jTopic.includes(topicNorm) || topicNorm.includes(jTopic);
        const matchesLoc = locNorm === 'todos os distritos' || locNorm === 'todos' || jLoc.includes(locNorm);
        const matchesKw = !kwNorm || jTitle.includes(kwNorm) || jTopic.includes(kwNorm);

        return matchesTopic && matchesLoc && matchesKw;
      });

      if (matchingJobs.length > 0) {
        const topJob = matchingJobs[0];
        const count = matchingJobs.length;
        const alertTitle = `🔔 ${count} ${count === 1 ? 'Nova Vaga' : 'Novas Vagas'} Encontradas!`;
        const alertMsg = count === 1
          ? `Vaga de "${topJob.title}" em ${topJob.location} corresponde ao seu alerta.`
          : `Foram encontradas ${count} vagas recentes na área "${alert.workTopic}" (${alert.location}).`;

        // Update alert lastNotifiedAt
        alert.lastNotifiedAt = new Date().toISOString();
        const allAlerts = this.getAlerts();
        const updatedAlerts = allAlerts.map(a => a.id === alert.id ? alert : a);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedAlerts));

        // Trigger in-app notification if userId exists or toast
        if (userId) {
          try {
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'jobs',
              title: alertTitle,
              message: alertMsg,
              is_read: false,
              created_at: new Date().toISOString()
            });
          } catch (e) {}
        }

        notificationCount++;
      }
    }

    return notificationCount;
  }
};
