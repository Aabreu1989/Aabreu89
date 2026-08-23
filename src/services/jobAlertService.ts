import { supabase } from '../lib/supabase';
import { JobPost } from '../types';

export type JobAlertStatus = 'configured' | 'generated' | 'delivered' | 'read';

export interface JobAlert {
  id: string;
  user_id?: string;
  clientId?: string;
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

export interface LocalNotification {
  id: string;
  user_id?: string;
  clientId?: string;
  type: 'jobs' | 'aima' | 'community' | 'docs' | 'social' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
  metadata?: any;
}

const CLIENT_ID_KEY = 'mira_client_id_v1';
const LOCAL_ALERTS_KEY = 'mira_job_alerts_v1';
const LOCAL_NOTIFS_KEY = 'mira_local_notifications_v1';
const DELIVERED_MATCHES_KEY = 'mira_delivered_matches_v2';

export const jobAlertService = {
  /**
   * 🆔 Obtém ou gera o ID estável do cliente local (Guest)
   */
  getClientId(): string {
    try {
      let clientId = localStorage.getItem(CLIENT_ID_KEY);
      if (!clientId || clientId.length < 10) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          clientId = crypto.randomUUID();
        } else {
          clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        }
        localStorage.setItem(CLIENT_ID_KEY, clientId);
      }
      return clientId;
    } catch {
      return 'anonymous-client';
    }
  },

  /**
   * Busca alertas ativos no Supabase (se autenticado) ou no localStorage (se guest)
   */
  async getAlertsAsync(userId?: string): Promise<JobAlert[]> {
    const localAlerts = this.getAlerts(userId);

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('user_job_alerts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const remoteAlerts: JobAlert[] = data.map(item => ({
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

          // Se o Supabase retornou registros válidos, consolida com eventuais locais
          const seenIds = new Set(remoteAlerts.map(r => r.id));
          const unsyncedLocal = localAlerts.filter(l => l.id.startsWith('alert-') && !seenIds.has(l.id));
          const consolidated = [...remoteAlerts, ...unsyncedLocal];
          
          localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(consolidated));
          return consolidated;
        }
      } catch (e) {
        console.warn('MIRA JobAlert: Supabase fetch warning, using local cache', e);
      }
    }
    return localAlerts;
  },

  /**
   * Leitura síncrona do cache local de alertas
   */
  getAlerts(userId?: string): JobAlert[] {
    try {
      const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
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
   * Grava um novo alerta de vagas (local para guest, Supabase para autenticado)
   */
  async saveAlert(
    alertData: { workTopic: string; location: string; keywords?: string; frequency?: 'instant' | 'daily' | 'weekly' },
    userId?: string
  ): Promise<JobAlert> {
    const clientId = this.getClientId();
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    const normalize = (s?: string) => (s || '').trim().toLowerCase();
    const existing = this.getAlerts();

    // 🔒 Deduplicação Semântica: Identificar se já existe alerta equivalente
    const targetTopic = alertData.workTopic || 'Todos';
    const targetLoc = alertData.location || 'Todos os Distritos';
    const targetKeywords = alertData.keywords?.trim() || '';

    const duplicateIndex = existing.findIndex(a =>
      (userId ? a.user_id === userId : a.clientId === clientId) &&
      normalize(a.workTopic) === normalize(targetTopic) &&
      normalize(a.location) === normalize(targetLoc) &&
      normalize(a.keywords) === normalize(targetKeywords)
    );

    if (duplicateIndex !== -1) {
      // Alerta equivalente já existe: atualizar frequência e reativar sem duplicar
      const existingAlert = existing[duplicateIndex];
      existingAlert.frequency = alertData.frequency || existingAlert.frequency || 'instant';
      existingAlert.isActive = true;
      existing[duplicateIndex] = existingAlert;
      localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(existing));

      if (userId && !existingAlert.id.startsWith('alert-')) {
        try {
          await supabase
            .from('user_job_alerts')
            .update({
              frequency: existingAlert.frequency,
              is_active: true
            })
            .eq('id', existingAlert.id)
            .eq('user_id', userId);
        } catch (e) {
          console.warn('MIRA JobAlert: Supabase deduplication update warning:', e);
        }
      }

      return existingAlert;
    }

    const newAlert: JobAlert = {
      id: alertId,
      user_id: userId,
      clientId: clientId,
      workTopic: targetTopic,
      location: targetLoc,
      keywords: targetKeywords,
      isActive: true,
      frequency: alertData.frequency || 'instant',
      createdAt: new Date().toISOString()
    };

    // Salvar localmente primeiro (resiliência imediata)
    const updated = [newAlert, ...existing];
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(updated));

    // Se autenticado, persistir no Supabase
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
            created_at: newAlert.createdAt,
            last_notified_at: newAlert.createdAt
          })
          .select()
          .single();

        if (!error && data) {
          newAlert.id = data.id;
          // Atualizar o ID persistido no cache local
          const refreshed = [newAlert, ...existing];
          localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(refreshed));
        }
      } catch (e) {
        console.warn('MIRA JobAlert: Supabase insert warning:', e);
      }
    }

    return newAlert;
  },

  /**
   * Atualiza os dados de um alerta existente no Supabase & cache local
   */
  async updateAlert(
    alertId: string,
    alertData: { workTopic: string; location: string; keywords?: string; frequency?: 'instant' | 'daily' | 'weekly' },
    userId?: string
  ): Promise<void> {
    const list = this.getAlerts();
    const updated = list.map(a => a.id === alertId ? {
      ...a,
      workTopic: alertData.workTopic || a.workTopic,
      location: alertData.location || a.location,
      keywords: alertData.keywords?.trim() ?? a.keywords,
      frequency: alertData.frequency || a.frequency
    } : a);
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(updated));

    if (userId && !alertId.startsWith('alert-')) {
      try {
        await supabase
          .from('user_job_alerts')
          .update({
            work_topic: alertData.workTopic,
            location: alertData.location,
            keywords: alertData.keywords?.trim() || '',
            frequency: alertData.frequency || 'instant'
          })
          .eq('id', alertId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn('MIRA JobAlert: Update alert warning:', e);
      }
    }
  },

  /**
   * Alterna status ativo/pausado do alerta
   */
  async toggleAlert(alertId: string, isActive: boolean, userId?: string): Promise<void> {
    const list = this.getAlerts();
    const updated = list.map(a => a.id === alertId ? { ...a, isActive } : a);
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(updated));

    if (userId && !alertId.startsWith('alert-')) {
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
   * Elimina um alerta configurado
   */
  async deleteAlert(alertId: string, userId?: string): Promise<void> {
    const list = this.getAlerts();
    const updated = list.filter(a => a.id !== alertId);
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(updated));

    if (userId && !alertId.startsWith('alert-')) {
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
   * 🔄 Migração Guest ➔ Login: Promove alertas locais para o Supabase com o user_id oficial
   */
  async migrateGuestAlerts(userId: string): Promise<{ migratedCount: number }> {
    if (!userId) return { migratedCount: 0 };
    
    try {
      const localList = this.getAlerts();
      const guestAlerts = localList.filter(a => !a.user_id || a.user_id.startsWith('guest-'));
      if (guestAlerts.length === 0) return { migratedCount: 0 };

      const recordsToInsert = guestAlerts.map(a => ({
        user_id: userId,
        work_topic: a.workTopic,
        location: a.location,
        keywords: a.keywords || '',
        is_active: a.isActive,
        frequency: a.frequency || 'instant',
        created_at: a.createdAt || new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('user_job_alerts')
        .insert(recordsToInsert)
        .select();

      if (!error && data) {
        // Migração bem-sucedida: atualizar lista local com os novos IDs do banco
        const authenticatedAlerts: JobAlert[] = data.map(item => ({
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

        const remaining = localList.filter(a => a.user_id && a.user_id === userId);
        const consolidated = [...authenticatedAlerts, ...remaining];
        localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(consolidated));

        return { migratedCount: data.length };
      }
    } catch (e) {
      console.warn('MIRA JobAlert: Migration warning (local alerts preserved):', e);
    }
    return { migratedCount: 0 };
  },

  /**
   * 🧠 MATCHING ENGINE (Job × User Preference)
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
   * Deduplicação: Mapa de Chaves Entregues (alert_id + job_id)
   */
  getDeliveredMap(): Record<string, number> {
    try {
      const raw = localStorage.getItem(DELIVERED_MATCHES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  recordDeliveredKey(dedupKey: string) {
    try {
      const map = this.getDeliveredMap();
      map[dedupKey] = Date.now();
      localStorage.setItem(DELIVERED_MATCHES_KEY, JSON.stringify(map));
    } catch (e) {}
  },

  /**
   * Fila de Notificações Locais (Guest)
   */
  getLocalNotifications(): LocalNotification[] {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalNotification(notif: LocalNotification) {
    try {
      const list = this.getLocalNotifications();
      const updated = [notif, ...list].slice(0, 100);
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updated));
    } catch (e) {}
  },

  /**
   * ⚡ MOTOR DE MATCHING INTEGRAL (Zero slice, 4.368 vagas avaliadas)
   * Protegido por idempotência persistente no banco (job_alert_deliveries) e no cliente.
   */
  async processJobMatching(jobs: JobPost[], userId?: string): Promise<number> {
    if (!jobs || jobs.length === 0) return 0;
    
    // Obter alertas ativos
    const alerts = await this.getAlertsAsync(userId);
    const activeAlerts = alerts.filter(a => a.isActive);
    if (activeAlerts.length === 0) return 0;

    const clientId = this.getClientId();
    const deliveredMap = this.getDeliveredMap();
    let newMatchesCount = 0;

    // 🔒 Idempotência Persistente: Carregar histórico de entregas do Supabase (para utilizadores autenticados)
    const remoteDeliveredSet = new Set<string>();
    if (userId) {
      const dbAlertIds = activeAlerts
        .map(a => a.id)
        .filter(id => id && !id.startsWith('alert-'));

      if (dbAlertIds.length > 0) {
        try {
          const { data: dbDeliveries } = await supabase
            .from('job_alert_deliveries')
            .select('alert_id, job_id')
            .in('alert_id', dbAlertIds);

          if (dbDeliveries && Array.isArray(dbDeliveries)) {
            dbDeliveries.forEach(d => {
              const k = `${d.alert_id}:${d.job_id}`;
              remoteDeliveredSet.add(k);
              deliveredMap[k] = Date.now();
            });
            // Sincronizar cache local com entregas do banco
            localStorage.setItem(DELIVERED_MATCHES_KEY, JSON.stringify(deliveredMap));
          }
        } catch (e) {
          console.warn('MIRA JobAlert: error checking remote job_alert_deliveries:', e);
        }
      }
    }

    // Scan de 100% do universo de vagas elegíveis (ZERO slice)
    for (const alert of activeAlerts) {
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const dedupKey = `${alert.id}:${job.id}`;

        // 1. Idempotência O(1) Local e Remota
        if (remoteDeliveredSet.has(dedupKey) || deliveredMap[dedupKey]) continue;

        // 2. Avaliação de compatibilidade
        const { isMatch, score, reason } = this.evaluateJobMatch(job, alert);
        if (isMatch) {
          const notifTitle = `💼 Nova Vaga Compatível: ${job.title}`;
          const notifMsg = `${job.sourceName} • ${job.location}\nMotivo: ${reason}`;
          const notifLink = `/jobs?jobId=${encodeURIComponent(job.id)}`;
          const notifMetadata = {
            jobId: job.id,
            sourceUrl: job.sourceUrl || (job as any).source_url || '',
            sourceName: job.sourceName || (job as any).source_name || 'MIRA',
            location: job.location || 'Portugal',
            workTopic: job.workTopic || (job as any).work_topic || 'Emprego'
          };

          if (userId && !alert.id.startsWith('alert-')) {
            // Utilizador Autenticado: Inserção Atómica Idempotente em job_alert_deliveries
            try {
              const { data: delivery, error: delErr } = await supabase
                .from('job_alert_deliveries')
                .insert({
                  alert_id: alert.id,
                  job_id: job.id
                })
                .select('id')
                .single();

              if (delErr) {
                const isDuplicate =
                  delErr.code === '23505' ||
                  delErr.message?.includes('duplicate key') ||
                  delErr.message?.includes('uq_alert_job_delivery');

                if (isDuplicate) {
                  // Conflito legítimo: já entregue anteriormente por outro processo/scan
                  remoteDeliveredSet.add(dedupKey);
                  this.recordDeliveredKey(dedupKey);
                } else {
                  // Falha real (Rede / RLS / 500): NÃO marcar como entregue para permitir retry futuro
                  console.warn(`MIRA JobAlert: Falha real ao registrar delivery para ${dedupKey}:`, delErr.message || delErr);
                }
                continue;
              }

              // Entrega registada no banco com sucesso -> criar notificação
              remoteDeliveredSet.add(dedupKey);
              this.recordDeliveredKey(dedupKey);

              const { error: nErr } = await supabase.from('notifications').insert({
                user_id: userId,
                type: 'jobs',
                title: notifTitle,
                message: notifMsg,
                is_read: false,
                link: notifLink,
                created_at: new Date().toISOString()
              });

              if (nErr) {
                console.warn('MIRA JobAlert: Supabase notification insert error:', nErr);
              } else {
                newMatchesCount++;
              }
            } catch (e) {
              console.warn('MIRA JobAlert: Supabase notification insert error:', e);
            }
          } else {
            // Guest: Persistir na Fila Local com idempotência local
            deliveredMap[dedupKey] = Date.now();
            this.recordDeliveredKey(dedupKey);
            newMatchesCount++;

            const localNotif: LocalNotification = {
              id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              clientId: clientId,
              type: 'jobs',
              title: notifTitle,
              message: notifMsg,
              is_read: false,
              link: notifLink,
              metadata: notifMetadata,
              created_at: new Date().toISOString()
            };
            this.saveLocalNotification(localNotif);
          }
        }
      }
    }

    return newMatchesCount;
  },

  /**
   * Subscrição Realtime para utilizadores autenticados
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
          this.getAlertsAsync(userId);
        }
      )
      .subscribe();

    return channel;
  }
};
