import { User } from '../types';

export const ADMIN_EMAIL = 'amandasabreu89@gmail.com';

export function isUserAdmin(user: { email?: string | null; role?: string; user_metadata?: any } | User | null | undefined): boolean {
    if (!user || !user.email) return false;
    return user.email.toLowerCase().trim() === ADMIN_EMAIL;
}
