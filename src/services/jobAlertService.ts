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
   * Get all active alerts from Supabase (with localStorage fallback)
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
   * Save a new job alert directly to Supabase
   */
  async saveAlert(
    alertData: { workTopic: string; location: string; keywords?: string; frequency?: 'instant' | 'daily' | 'weekly' },
    userId?: string
  ): Promise<JobAlert> {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
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

    // Save locally
    const existing = this.getAlerts();
    const updated = [newAlert, ...existing];
    localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

    // Save directly to Supabase if logged in
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
   * Toggle alert active status in Supabase
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
   * Delete an alert from Supabase
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
   * Client-side check fallback (Supabase Trigger handles atomic matching automatically)
   */
  async checkAlertsAndNotify(jobs: JobPost[], userId?: string): Promise<number> {
    // Database trigger process_job_alerts_on_new_job handles atomic matching without duplicates
    return 0;
  }
};
