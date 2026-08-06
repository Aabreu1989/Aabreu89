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
    let all: AppNotification[] = [];
    if (userId) {
      try {
        all = await notificationService.fetchAll(userId);
      } catch {
        // silently ignore if table doesn't exist yet
      }
    }

    setNotifications(all);
    setUnreadCount(all.filter(n => !n.is_read).length);
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time subscription & Web Push for real user notifications
  useEffect(() => {
    if (!userId) return;

    channelRef.current = notificationService.subscribeToNotifications(userId, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

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
              new Notification(newNotif.title || 'MIRA', {
                  body: newNotif.message,
                  icon: '/logo-mira.png'
              });
          }
      }
    });

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
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    if (userId) {
      try {
        await notificationService.markAllAsRead(userId);
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  }, [userId]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    if (userId) {
      try {
        await notificationService.deleteAll(userId);
      } catch (error) {
        console.error('MIRA: Critical failure in deleteAll:', error);
      }
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
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
