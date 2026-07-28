import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, AppNotification } from '../services/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const all = await notificationService.fetchAll(userId);
      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
    } catch {
      // silently ignore if table doesn't exist yet
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    // 1. Pedir permissão para Notificações Web Push (Tela de Descanso/Mobile)
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    channelRef.current = notificationService.subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // 🚀 MIRA NATIVE PUSH: Disparar Notificação nativa local caso haja permissão
      if ('Notification' in window && Notification.permission === 'granted') {
          if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                  registration.showNotification(newNotif.title || 'MIRA', {
                      body: newNotif.message,
                      icon: '/logo-mira.png',
                      badge: '/logo-mira.png',
                      vibrate: [200, 100, 200],
                      tag: `mira-notif-${newNotif.id}`,
                      data: { url: newNotif.link || '/' }
                  } as any);
              }).catch(err => console.error("SW Native Notification Error:", err));
          } else {
              // Fallback para desktop browsers sem SW ativo
              new Notification(newNotif.title || 'MIRA', {
                  body: newNotif.message,
                  icon: '/logo-mira.png'
              });
          }
      }
    });

    // 2. Subscrever a novas vagas de emprego (job_posts) para disparar Push Notification local
    const jobChannel = supabase
      .channel('public:job_posts:push')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_posts' }, async (payload: any) => {
          const newJob = payload.new;
          if ('Notification' in window && Notification.permission === 'granted') {
              if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.ready.then((registration) => {
                      registration.showNotification('MIRA - Nova Vaga', {
                          body: `${newJob.title || 'Nova Oportunidade'} em ${newJob.location || 'Portugal'}`,
                          icon: '/logo-mira.png',
                          badge: '/logo-mira.png',
                          vibrate: [200, 100, 200, 100, 200],
                          tag: 'mira-new-job',
                          data: { url: '/?view=jobs' }
                      } as any);
                  }).catch(err => console.error("SW Notification Error:", err));
              } else {
                  // Fallback para browsers desktop sem service worker activo
                  new Notification('MIRA - Nova Vaga', {
                      body: `${newJob.title || 'Nova Oportunidade'} em ${newJob.location || 'Portugal'}`,
                      icon: '/logo-mira.png'
                  });
              }
          }
      })
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      supabase.removeChannel(jobChannel);
    };
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  const clearAll = useCallback(async () => {
    if (!userId) {
      console.warn('MIRA: No userId found for clearAll');
      return;
    }
    
    // OPTIMISTIC PURGE: Clear UI immediately
    setNotifications([]);
    setUnreadCount(0);
    
    try {
      await notificationService.deleteAll(userId);
    } catch (error) {
      console.error('MIRA: Critical failure in deleteAll:', error);
      // Even on failure, we keep the UI clear for this session
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  }, []);

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
    reload: loadNotifications,
  };
}
