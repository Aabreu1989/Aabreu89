import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, AppNotification, NOTIFICATION_EVENT, NotificationBusMessage } from '../services/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';

const NOTIFICATION_BUS_CHANNEL = 'mira_notifications_bus_v1';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => notificationService.getLocalNotifications());
  const [unreadCount, setUnreadCount] = useState(() => notificationService.getLocalNotifications().filter(n => !n.is_read).length);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const busRef = useRef<BroadcastChannel | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const all = await notificationService.fetchAll(userId);
      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
    } catch {
      // Falha graciosa mantendo a lista atual
    }
  }, [userId]);

  // Carga inicial e recarga em mudança de utilizador
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 📡 Barramento de Sincronização Cross-Tab (BroadcastChannel)
  // B2 + Requisito 3: Reconciliação direta em memória SEM disparar fetchAll() assíncrono prematuro
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    try {
      const bus = new BroadcastChannel(NOTIFICATION_BUS_CHANNEL);
      busRef.current = bus;

      bus.onmessage = (e: MessageEvent<NotificationBusMessage>) => {
        const msg = e.data;
        if (!msg) return;

        // REQUISITO 3: Escopo de utilizador/sessão estrito
        // Se a mensagem especificar userId e for diferente da aba atual, ignora
        if (msg.userId && userId && msg.userId !== userId) {
          return;
        }

        switch (msg.type) {
          case 'DISMISSED': {
            setNotifications(prev => {
              const updated = prev.filter(n => 
                !msg.ids.includes(n.id) && !msg.logical_keys.includes(n.logical_key)
              );
              setUnreadCount(updated.filter(n => !n.is_read).length);
              return updated;
            });
            break;
          }
          case 'CLEARED_ALL': {
            setNotifications([]);
            setUnreadCount(0);
            break;
          }
          case 'MARKED_READ': {
            setNotifications(prev => {
              const updated = prev.map(n => 
                msg.ids.includes(n.id) || msg.ids.includes(n.logical_key)
                  ? { ...n, is_read: true }
                  : n
              );
              setUnreadCount(updated.filter(n => !n.is_read).length);
              return updated;
            });
            break;
          }
          case 'MARKED_ALL_READ': {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            break;
          }
        }
      };

      return () => {
        bus.close();
        busRef.current = null;
      };
    } catch (e) {
      console.warn('MIRA useNotifications: BroadcastChannel initialization warning', e);
    }
  }, [userId]);

  // Escuta de eventos locais (fallback para mesma aba)
  useEffect(() => {
    const handleLocalChange = () => {
      const current = notificationService.getLocalNotifications();
      setNotifications(current);
      setUnreadCount(current.filter(n => !n.is_read).length);
    };

    window.addEventListener(NOTIFICATION_EVENT, handleLocalChange);
    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleLocalChange);
    };
  }, []);

  // Subscrição Realtime no Supabase para utilizador autenticado
  useEffect(() => {
    if (!userId) return;

    channelRef.current = notificationService.subscribeToNotifications(userId, (newNotif) => {
      // Bloquear se já estiver no tombstone
      if (notificationService.isDismissed(newNotif)) {
        return;
      }

      setNotifications(prev => {
        const exists = prev.some(n => 
          n.id === newNotif.id || 
          (n.logical_key && n.logical_key === newNotif.logical_key)
        );
        if (exists) return prev;
        return [newNotif, ...prev];
      });

      setUnreadCount(prev => prev + 1);

      // Web Push / Notificação Nativa se autorizado
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(newNotif.title || 'MIRA', {
            body: newNotif.message,
            icon: '/logo-mira.png'
          });
        } catch (_) {}
      }
    });

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await notificationService.markAllAsRead(userId);
    } catch (error) {
      console.error('MIRA: Error marking all notifications as read:', error);
    }
  }, [userId]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await notificationService.deleteAll(userId);
    } catch (error) {
      console.error('MIRA: Error in clearAll notifications:', error);
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id || n.logical_key === id ? { ...n, is_read: true } : n);
      setUnreadCount(updated.filter(n => !n.is_read).length);
      return updated;
    });
    try {
      await notificationService.markAsRead(id, userId);
    } catch (error) {
      console.error(`MIRA: Error marking notification ${id} as read:`, error);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id && n.logical_key !== id);
      setUnreadCount(updated.filter(n => !n.is_read).length);
      return updated;
    });
    try {
      await notificationService.deleteNotification(id, userId);
    } catch (error) {
      console.error(`MIRA: Error deleting notification ${id}:`, error);
    }
  }, [userId]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    notifications,
    unreadCount,
    isOpen,
    toggleOpen,
    markAllAsRead,
    clearAll,
    markAsRead,
    deleteNotification,
    reload: loadNotifications,
  };
}
