import { User } from '../types';

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'amandasabreu89@gmail.com').toLowerCase().trim();

export function isUserAdmin(user: { email?: string | null; role?: string; user_metadata?: any } | User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'ceo') return true;
    if (!user.email) return false;
    return user.email.toLowerCase().trim() === ADMIN_EMAIL;
}
