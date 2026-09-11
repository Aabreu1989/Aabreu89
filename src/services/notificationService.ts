import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  user_id?: string;
  clientId?: string;
  logical_key: string;
  type: 'aima' | 'community' | 'jobs' | 'docs' | 'social' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

const LOCAL_NOTIFS_KEY = 'mira_local_notifications_v1';
const DISMISSED_NOTIFS_KEY = 'mira_dismissed_notifications_v1';
const NOTIFICATION_BUS_CHANNEL = 'mira_notifications_bus_v1';
export const NOTIFICATION_EVENT = 'mira_notification_updated';

export type NotificationBusMessage =
  | { type: 'DISMISSED'; userId?: string; logical_keys: string[]; ids: string[] }
  | { type: 'CLEARED_ALL'; userId?: string; timestamp: number }
  | { type: 'MARKED_READ'; userId?: string; ids: string[] }
  | { type: 'MARKED_ALL_READ'; userId?: string; timestamp: number };

// Barramento nativo de sincronização cross-tab com isolamento de contexto
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(NOTIFICATION_BUS_CHANNEL);
  } catch (e) {
    console.warn('MIRA notificationService: BroadcastChannel not supported in environment', e);
  }
}

function emitNotificationChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
  }
}

/**
 * Resolve a identidade semântica estável (logical_key) de uma notificação.
 * REQUISITO 1: Não inventa identidade semântica se job_id não for identificável,
 * caindo estritamente em remote:<physical_id> ou local:<physical_id>.
 */
export function resolveLogicalKey(notif: {
  id?: string;
  type?: string;
  link?: string;
  metadata?: Record<string, any>;
}): string {
  // 1. Chave lógica canónica explícita nos metadados
  if (notif.metadata?.logical_key) {
    return String(notif.metadata.logical_key);
  }

  // 2. Campanhas globais e de sistema com slug estável
  if (notif.id === 'mira-feedback-suggestion' || notif.link?.includes('mira.app@hotmail.com')) {
    return 'campaign:mira-feedback-suggestion';
  }

  // 3. Vagas de emprego (Jobs): extração estrita de job_id
  if (notif.type === 'jobs' || notif.link?.includes('/jobs')) {
    if (notif.metadata?.job_id) {
      return `job:${String(notif.metadata.job_id)}`;
    }
    const matchJobId = notif.link?.match(/[?&]jobId=([^&]+)/);
    if (matchJobId && matchJobId[1]) {
      return `job:${decodeURIComponent(matchJobId[1])}`;
    }
    const matchDigest = notif.link?.match(/[?&]digest=([^&]+)/);
    const matchAlertId = notif.link?.match(/[?&]alertId=([^&]+)/);
    if (matchDigest && matchAlertId && matchDigest[1] && matchAlertId[1]) {
      return `job-digest:${decodeURIComponent(matchAlertId[1])}:${decodeURIComponent(matchDigest[1])}`;
    }
    // REQUISITO 1: Se não tem job_id identificável, cai em remote:<id>
    if (notif.id && !notif.id.startsWith('notif-')) {
      return `remote:${notif.id}`;
    }
  }

  // 4. Conquistas sociais e selos de gamificação
  if (notif.type === 'social' && notif.metadata?.badge_id) {
    return `badge:${String(notif.metadata.badge_id)}`;
  }

  // 5. Comunidade / Menções
  if (notif.type === 'community' && notif.metadata?.target_id) {
    return `community:${notif.metadata.target_type || 'post'}:${String(notif.metadata.target_id)}`;
  }

  // 6. Fallback canónico padrão: identidade física da linha
  if (notif.id) {
    return notif.id.startsWith('notif-') ? `local:${notif.id}` : `remote:${notif.id}`;
  }

  return `local:${Date.now()}`;
}

export const notificationService = {
  /**
   * Obtém o conjunto de chaves e IDs descartados (Tombstones)
   */
  getDismissedKeys(): Set<string> {
    try {
      const raw = localStorage.getItem(DISMISSED_NOTIFS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  },

  /**
   * Grava chaves no registro permanente de Tombstones (Local)
   */
  addTombstones(logicalKeys: string[], physicalIds: string[] = []) {
    try {
      const current = this.getDismissedKeys();
      logicalKeys.filter(Boolean).forEach(k => current.add(k));
      physicalIds.filter(Boolean).forEach(id => current.add(id));
      localStorage.setItem(DISMISSED_NOTIFS_KEY, JSON.stringify(Array.from(current)));
    } catch (e) {
      console.warn('MIRA notificationService: addTombstones error', e);
    }
  },

  /**
   * Verifica se uma notificação foi descartada pelo utilizador
   */
  isDismissed(notif: { id?: string; logical_key?: string; link?: string; metadata?: Record<string, any> }): boolean {
    const dismissed = this.getDismissedKeys();
    if (notif.id && dismissed.has(notif.id)) return true;
    if (notif.logical_key && dismissed.has(notif.logical_key)) return true;
    const resolved = resolveLogicalKey(notif);
    return dismissed.has(resolved);
  },

  /**
   * Transmite evento de sincronização cross-tab via BroadcastChannel (com fallback storage)
   * REQUISITO 3: Escopo estrito de userId/sessão para evitar limpezas indevidas em outras contas.
   */
  broadcastBusEvent(message: NotificationBusMessage) {
    try {
      if (broadcastChannel) {
        broadcastChannel.postMessage(message);
      }
    } catch (e) {
      console.warn('MIRA notificationService: broadcast error', e);
    }
  },

  /**
   * Sincroniza chaves de campanhas descartadas com a tabela de perfis (Persistência Cross-Device)
   */
  async syncDismissedKeysToProfile(userId: string, keys: string[]) {
    if (!userId || keys.length === 0) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      const existing = (profile?.preferences?.dismissed_notifications as string[]) || [];
      const merged = Array.from(new Set([...existing, ...keys]));

      await supabase
        .from('profiles')
        .update({
          preferences: {
            ...(profile?.preferences || {}),
            dismissed_notifications: merged
          }
        })
        .eq('id', userId);
    } catch (e) {
      console.warn('MIRA notificationService: syncDismissedKeysToProfile warning', e);
    }
  },

  /**
   * Carrega descartes do perfil do utilizador para o Tombstone local ao iniciar sessão
   */
  async loadDismissedKeysFromProfile(userId: string) {
    if (!userId) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      const remoteDismissed = profile?.preferences?.dismissed_notifications;
      if (Array.isArray(remoteDismissed) && remoteDismissed.length > 0) {
        this.addTombstones(remoteDismissed);
      }
    } catch (e) {
      console.warn('MIRA notificationService: loadDismissedKeysFromProfile warning', e);
    }
  },

  /**
   * Obtém notificações locais puras, filtradas estritamente contra o Tombstone.
   * Elimina completamente a injeção cega / destrutiva.
   */
  getLocalNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
      const list: any[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];

      return list
        .map(n => ({
          ...n,
          logical_key: n.logical_key || resolveLogicalKey(n)
        }))
        .filter(n => !this.isDismissed(n));
    } catch {
      return [];
    }
  },

  /**
   * Salva a lista de notificações locais (filtrando tombstones antes de persistir)
   */
  saveLocalNotifications(list: AppNotification[]) {
    try {
      const sanitized = list
        .map(n => ({
          ...n,
          logical_key: n.logical_key || resolveLogicalKey(n)
        }))
        .filter(n => !this.isDismissed(n))
        .slice(0, 100);

      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(sanitized));
      emitNotificationChange();
    } catch (e) {
      console.warn('MIRA notificationService: local save error', e);
    }
  },

  /**
   * Busca notificações não lidas
   */
  async fetchUnread(userId?: string): Promise<AppNotification[]> {
    const all = await this.fetchAll(userId);
    return all.filter(n => !n.is_read);
  },

  /**
   * Busca todas as notificações (Supabase + Local) com reconciliação canónica e Tombstone
   */
  async fetchAll(userId?: string): Promise<AppNotification[]> {
    // 1. Sincronizar tombstones remotos se autenticado
    if (userId) {
      await this.loadDismissedKeysFromProfile(userId);
    }

    const localNotifs = this.getLocalNotifications();

    if (!userId) {
      // Visitante: ordenação da projeção local
      return localNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // 2. Autenticado: buscar no Supabase
    let remoteNotifs: AppNotification[] = [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        remoteNotifs = data.map(n => {
          const lKey = n.metadata?.logical_key || resolveLogicalKey({
            id: n.id,
            type: n.type,
            link: n.link,
            metadata: n.metadata
          });
          return {
            id: n.id,
            user_id: n.user_id,
            logical_key: lKey,
            type: (n.type as any) || 'system',
            title: n.title,
            message: n.message,
            is_read: !!n.is_read,
            link: n.link,
            metadata: n.metadata,
            created_at: n.created_at
          };
        });
      }
    } catch (e) {
      console.warn('MIRA notificationService: Remote fetch warning, fallback to local', e);
    }

    // 3. Filtrar itens remotos contra Tombstone (impede que leitura remota atrase ressurreição)
    const validRemote = remoteNotifs.filter(n => !this.isDismissed(n));

    // 4. Mesclar e deduplicar por logical_key e physical_id
    const seenLogicalKeys = new Set<string>();
    const seenPhysicalIds = new Set<string>();
    const unified: AppNotification[] = [];

    // Prioridade para as notificações remotas oficiais do Supabase
    for (const notif of validRemote) {
      seenLogicalKeys.add(notif.logical_key);
      seenPhysicalIds.add(notif.id);
      unified.push(notif);
    }

    // Adicionar notificações locais que ainda não existam no Supabase
    for (const notif of localNotifs) {
      const isDuplicate = seenLogicalKeys.has(notif.logical_key) || seenPhysicalIds.has(notif.id);
      if (!isDuplicate) {
        seenLogicalKeys.add(notif.logical_key);
        seenPhysicalIds.add(notif.id);
        unified.push(notif);
      }
    }

    const sorted = unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 5. Atualizar projeção local higienizada
    if (validRemote.length > 0 || localNotifs.length > 0) {
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(sorted.slice(0, 100)));
    }

    return sorted;
  },

  /**
   * Marca uma notificação individual como lida
   */
  async markAsRead(notificationId: string, userId?: string) {
    const localList = this.getLocalNotifications();
    let localChanged = false;
    let targetLogicalKey = '';

    const updatedLocal = localList.map(n => {
      if (n.id === notificationId || n.logical_key === notificationId) {
        localChanged = true;
        targetLogicalKey = n.logical_key;
        return { ...n, is_read: true };
      }
      return n;
    });

    if (localChanged) {
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updatedLocal));
    }

    // Transmitir para abas concorrentes
    this.broadcastBusEvent({
      type: 'MARKED_READ',
      userId,
      ids: [notificationId, targetLogicalKey].filter(Boolean)
    });

    // Se for UUID e utilizador logado, atualizar no Supabase
    if (userId && !notificationId.startsWith('notif-') && !notificationId.startsWith('campaign:')) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn('MIRA notificationService: markAsRead remote warning', e);
      }
    }

    emitNotificationChange();
  },

  /**
   * Marca todas as notificações do utilizador como lidas
   */
  async markAllAsRead(userId?: string) {
    const localList = this.getLocalNotifications();
    const updatedLocal = localList.map(n => ({ ...n, is_read: true }));
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(updatedLocal));

    this.broadcastBusEvent({
      type: 'MARKED_ALL_READ',
      userId,
      timestamp: Date.now()
    });

    if (userId) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);
      } catch (e) {
        console.warn('MIRA notificationService: markAllAsRead remote warning', e);
      }
    }

    emitNotificationChange();
  },

  /**
   * Apaga uma notificação individual com resolução canónica e Tombstone
   * REQUISITO 2: Protege contra falha remota mantendo o tombstone ativo.
   */
  async deleteNotification(targetId: string, userId?: string) {
    const localList = this.getLocalNotifications();
    const target = localList.find(n => n.id === targetId || n.logical_key === targetId);

    const logicalKey = target ? target.logical_key : resolveLogicalKey({ id: targetId });
    const physicalId = target ? target.id : targetId;

    // 1. Gravar Tombstone imediatamente (otimista)
    this.addTombstones([logicalKey], [physicalId]);

    // 2. Limpar da projeção local
    const filtered = localList.filter(n => n.id !== physicalId && n.logical_key !== logicalKey);
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(filtered));

    // 3. Notificar abas concorrentes via BroadcastChannel (com escopo de userId)
    this.broadcastBusEvent({
      type: 'DISMISSED',
      userId,
      logical_keys: [logicalKey],
      ids: [physicalId]
    });

    // 4. Executar e aguardar exclusão no Supabase (se autenticado)
    if (userId) {
      if (physicalId && !physicalId.startsWith('notif-') && !physicalId.startsWith('campaign:')) {
        try {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', physicalId)
            .eq('user_id', userId);

          if (error) {
            // REQUISITO 2: Tombstone permanece ativo mesmo em falha remota
            console.warn('MIRA notificationService: deleteNotification remote warning (tombstone preserved):', error.message || error);
          }
        } catch (e) {
          console.warn('MIRA notificationService: deleteNotification network exception (tombstone preserved):', e);
        }
      }

      // Sincronizar logical key com perfil para persistência cross-device
      await this.syncDismissedKeysToProfile(userId, [logicalKey]);
    }

    // 5. Emitir evento local após término do ciclo
    emitNotificationChange();
  },

  /**
   * Apaga todas as notificações permanentemente
   * REQUISITO 2: Protege contra falha remota mantendo o tombstone ativo.
   * REQUISITO 3: Escopo de userId no evento cross-tab.
   */
  async deleteAll(userId?: string) {
    const current = this.getLocalNotifications();
    const logicalKeys = current.map(n => n.logical_key);
    const physicalIds = current.map(n => n.id);

    // 1. Gravar Tombstones de todas as notificações atuais imediatamente
    this.addTombstones(logicalKeys, physicalIds);

    // 2. Limpar projeção local
    localStorage.setItem(LOCAL_NOTIFS_KEY, '[]');

    // 3. Notificar abas concorrentes com escopo de sessão
    this.broadcastBusEvent({
      type: 'CLEARED_ALL',
      userId,
      timestamp: Date.now()
    });

    // 4. Executar e aguardar exclusão remota no Supabase
    if (userId) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId);

        if (error) {
          // REQUISITO 2: Tombstone permanece ativo mesmo com falha remota
          console.warn('MIRA notificationService: deleteAll remote warning (tombstone preserved):', error.message || error);
        }
      } catch (e) {
        console.warn('MIRA notificationService: deleteAll network exception (tombstone preserved):', e);
      }

      // Sincronizar chaves com o perfil para persistência cross-device
      await this.syncDismissedKeysToProfile(userId, logicalKeys);
    }

    // 5. Disparar evento local APENAS após a resolução remota completa
    emitNotificationChange();
  },

  /**
   * Subscrição Realtime no Supabase para utilizadores autenticados com filtro Tombstone
   */
  subscribeToNotifications(
    userId: string,
    onNew: (notif: AppNotification) => void
  ) {
    if (!userId) return null;

    const channel = supabase
      .channel(`notifications_live:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            const raw = payload.new as any;
            const lKey = raw.metadata?.logical_key || resolveLogicalKey({
              id: raw.id,
              type: raw.type,
              link: raw.link,
              metadata: raw.metadata
            });

            // 🛡️ FILTRO TOMBSTONE ANTES DE QUALQUER REAÇÃO
            if (this.isDismissed({ id: raw.id, logical_key: lKey })) {
              return;
            }

            const normalized: AppNotification = {
              id: raw.id,
              user_id: raw.user_id,
              logical_key: lKey,
              type: (raw.type as any) || 'system',
              title: raw.title,
              message: raw.message,
              is_read: !!raw.is_read,
              link: raw.link,
              metadata: raw.metadata,
              created_at: raw.created_at
            };

            onNew(normalized);
            emitNotificationChange();
          }
        }
      )
      .subscribe();

    return channel;
  }
};
