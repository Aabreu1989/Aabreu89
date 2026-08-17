import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  user_id?: string;
  clientId?: string;
  type: 'aima' | 'community' | 'jobs' | 'docs' | 'social' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  metadata?: any;
  created_at: string;
}

const LOCAL_NOTIFS_KEY = 'mira_local_notifications_v1';
export const NOTIFICATION_EVENT = 'mira_notification_updated';

function emitNotificationChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
  }
}

export const notificationService = {
  /**
   * Obtém notificações armazenadas localmente no navegador (Guest)
   */
  getLocalNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Salva a lista de notificações locais e notifica a interface
   */
  saveLocalNotifications(list: AppNotification[]) {
    try {
      localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list.slice(0, 100)));
      emitNotificationChange();
    } catch (e) {
      console.warn('MIRA notificationService: local save error', e);
    }
  },

  /**
   * Busca notificações não lidas (Supabase + Local)
   */
  async fetchUnread(userId?: string): Promise<AppNotification[]> {
    const all = await this.fetchAll(userId);
    return all.filter(n => !n.is_read);
  },

  /**
   * Busca todas as notificações (Lidas + Não Lidas) unificando Supabase e LocalStorage
   */
  async fetchAll(userId?: string): Promise<AppNotification[]> {
    const localNotifs = this.getLocalNotifications();

    if (!userId) {
      // Guest: estritamente da fila local
      return localNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Autenticado: buscar no Supabase
    let remoteNotifs: AppNotification[] = [];
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);

      if (!error && data) {
        remoteNotifs = data.map(n => ({
          id: n.id,
          user_id: n.user_id,
          type: (n.type as any) || 'system',
          title: n.title,
          message: n.message,
          is_read: !!n.is_read,
          link: n.link,
          metadata: n.metadata,
          created_at: n.created_at
        }));
      }
    } catch (e) {
      console.warn('MIRA notificationService: Remote fetch warning, fallback to local', e);
    }

    // Mesclar e deduplicar notificações por id ou link único
    const seenIds = new Set<string>();
    const seenLinks = new Set<string>();
    const unified: AppNotification[] = [];

    // Prioridade para as notificações remotas oficiais do Supabase
    for (const notif of remoteNotifs) {
      seenIds.add(notif.id);
      if (notif.link) seenLinks.add(notif.link);
      unified.push(notif);
    }

    // Adicionar notificações locais que ainda não existam no Supabase
    for (const notif of localNotifs) {
      const isDuplicate = seenIds.has(notif.id) || (notif.link && seenLinks.has(notif.link));
      if (!isDuplicate) {
        seenIds.add(notif.id);
        if (notif.link) seenLinks.add(notif.link);
        unified.push(notif);
      }
    }

    return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Marca uma notificação individual como lida
   */
  async markAsRead(notificationId: string, userId?: string) {
    // 1. Atualizar localmente
    const localList = this.getLocalNotifications();
    let localChanged = false;
    const updatedLocal = localList.map(n => {
      if (n.id === notificationId) {
        localChanged = true;
        return { ...n, is_read: true };
      }
      return n;
    });

    if (localChanged) {
      this.saveLocalNotifications(updatedLocal);
    }

    // 2. Se for UUID e usuário logado, atualizar no Supabase
    if (userId && !notificationId.startsWith('notif-')) {
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
   * Marca todas as notificações do usuário como lidas
   */
  async markAllAsRead(userId?: string) {
    // 1. Atualizar todas localmente
    const localList = this.getLocalNotifications();
    const updatedLocal = localList.map(n => ({ ...n, is_read: true }));
    this.saveLocalNotifications(updatedLocal);

    // 2. Se autenticado, atualizar no Supabase
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
   * Apaga uma notificação individual
   */
  async deleteNotification(notificationId: string, userId?: string) {
    // 1. Limpar local
    const localList = this.getLocalNotifications();
    const filtered = localList.filter(n => n.id !== notificationId);
    this.saveLocalNotifications(filtered);

    // 2. Se autenticado, apagar do Supabase
    if (userId && !notificationId.startsWith('notif-')) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn('MIRA notificationService: deleteNotification remote warning', e);
      }
    }
    emitNotificationChange();
  },

  /**
   * Apaga todas as notificações
   */
  async deleteAll(userId?: string) {
    // 1. Limpar local
    localStorage.removeItem(LOCAL_NOTIFS_KEY);
    emitNotificationChange();

    // 2. Se autenticado, apagar do Supabase
    if (userId) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId);
      } catch (e) {
        console.warn('MIRA notificationService: deleteAll remote warning', e);
      }
    }
  },

  /**
   * Subscrição Realtime no Supabase para usuários autenticados
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
            onNew(payload.new as AppNotification);
            emitNotificationChange();
          }
        }
      )
      .subscribe();

    return channel;
  }
};
