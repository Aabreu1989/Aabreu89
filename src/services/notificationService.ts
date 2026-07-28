import { supabase } from '../lib/supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'aima' | 'community' | 'jobs' | 'docs' | 'social';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  metadata?: any;
  created_at: string;
}

export const notificationService = {
  /**
   * Fetch unread notifications for a user
   */
  async fetchUnread(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('MIRA: Could not fetch notifications (table may not exist yet)', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Fetch all notifications for a user (read + unread)
   */
  async fetchAll(userId: string): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('MIRA: Could not fetch notifications', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) console.warn('Mark read error:', error.message);
  },

  /**
   * Mark ALL notifications for a user as read
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) console.warn('Mark all read error:', error.message);
  },

  /**
   * Apagar todas as notificações (Delete All)
   */
  async deleteAll(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (error) {
      console.warn('Delete all notifications error:', error.message);
      throw error;
    }
  },

  /**
   * Subscribe to real-time notifications for a user.
   * Returns the channel — the caller must call channel.unsubscribe() on cleanup.
   */
  subscribeToNotifications(
    userId: string,
    onNew: (notif: AppNotification) => void
  ) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNew(payload.new as AppNotification);
        }
      )
      .subscribe();

    return channel;
  },
};
