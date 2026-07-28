import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const useNotifications = (userId?: string) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            setNotifications(data.map(n => ({
                id: n.id,
                user_id: n.user_id,
                type: n.type as any,
                title: n.title,
                message: n.message,
                created_at: n.created_at,
                is_read: n.is_read,
                link: n.link
            })));
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const clearAll = async () => {
        if (!userId) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;
            setNotifications([]);
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Realtime subscription
        if (!userId) return;
        const channel = supabase
            .channel(`notifications:${userId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${userId}` 
            }, (payload) => {
                const newNotif = payload.new as any;
                setNotifications(prev => [{
                    id: newNotif.id,
                    user_id: newNotif.user_id,
                    type: newNotif.type as any,
                    title: newNotif.title,
                    message: newNotif.message,
                    created_at: newNotif.created_at,
                    is_read: newNotif.is_read,
                    link: newNotif.link
                }, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return { notifications, unreadCount, loading, markAsRead, clearAll, refresh: fetchNotifications };
};
