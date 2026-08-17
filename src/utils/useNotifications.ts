import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, AppNotification, NOTIFICATION_EVENT } from '../services/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const all = await notificationService.fetchAll(userId);
      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
    } catch {
      // Falha graciosa mantendo a lista atual
    }
  }, [userId]);

  // Carga inicial
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Escuta de eventos locais (sincronização instantânea na mesma aba e entre abas)
  useEffect(() => {
    const handleLocalChange = () => {
      loadNotifications();
    };

    window.addEventListener(NOTIFICATION_EVENT, handleLocalChange);
    window.addEventListener('storage', handleLocalChange);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    };
  }, [loadNotifications]);

  // Subscrição Realtime no Supabase para utilizador autenticado
  useEffect(() => {
    if (!userId) return;

    channelRef.current = notificationService.subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => {
        const exists = prev.some(n => n.id === newNotif.id);
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await notificationService.markAsRead(id, userId);
    } catch (error) {
      console.error(`MIRA: Error marking notification ${id} as read:`, error);
    }
  }, [userId]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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

