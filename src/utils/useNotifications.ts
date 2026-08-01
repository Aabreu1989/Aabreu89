import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, AppNotification } from '../services/notificationService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const INSTAGRAM_BROADCAST_NOTIF: AppNotification = {
  id: 'mira-notif-instagram-broadcast-v1',
  user_id: 'all',
  type: 'social',
  title: '📸 Siga o MIRA no Instagram!',
  message: 'Acompanhe novidades diárias, guias de imigração, dicas de emprego e atualizações da comunidade MIRA no nosso Instagram oficial @miraimigrante!',
  link: 'https://www.instagram.com/miraimigrante',
  is_read: false,
  created_at: new Date().toISOString()
};

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

    // Broadcast Notificação Global do Instagram para 100% dos Utilizadores
    const isDismissed = localStorage.getItem('mira_read_notif_instagram_broadcast_v1') === 'true';
    if (!isDismissed) {
      const hasInstagramNotif = all.some(n => n.id === INSTAGRAM_BROADCAST_NOTIF.id || (n.link && n.link.includes('instagram.com/miraimigrante')));
      if (!hasInstagramNotif) {
        all = [INSTAGRAM_BROADCAST_NOTIF, ...all];
      }
    }

    setNotifications(all);
    setUnreadCount(all.filter(n => !n.is_read).length);
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time subscription & Web Push
  useEffect(() => {
    // 1. Pedir permissão para Notificações Web Push (Tela de Descanso/Mobile)
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    // 2. Disparar Native Web Push para Notificação do Instagram se permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      const pushSent = sessionStorage.getItem('mira_instagram_push_sent');
      const isDismissed = localStorage.getItem('mira_read_notif_instagram_broadcast_v1') === 'true';
      if (!pushSent && !isDismissed) {
        sessionStorage.setItem('mira_instagram_push_sent', 'true');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('📸 Siga o MIRA no Instagram!', {
              body: 'Novidades diárias, guias de imigração e vagas em @miraimigrante',
              icon: '/logo-mira.png',
              badge: '/logo-mira.png',
              vibrate: [200, 100, 200],
              tag: 'mira-instagram-broadcast',
              data: { url: 'https://www.instagram.com/miraimigrante' }
            } as any);
          }).catch(err => console.error("SW Native Notification Error:", err));
        } else {
          new Notification('📸 Siga o MIRA no Instagram!', {
            body: 'Novidades diárias, guias de imigração e vagas em @miraimigrante',
            icon: '/logo-mira.png'
          });
        }
      }
    }

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
    localStorage.setItem('mira_read_notif_instagram_broadcast_v1', 'true');
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
    localStorage.setItem('mira_read_notif_instagram_broadcast_v1', 'true');
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
    if (id === INSTAGRAM_BROADCAST_NOTIF.id) {
      localStorage.setItem('mira_read_notif_instagram_broadcast_v1', 'true');
    } else {
      try {
        await notificationService.markAsRead(id);
      } catch (error) {
        console.error(`Error marking notification ${id} as read:`, error);
      }
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
