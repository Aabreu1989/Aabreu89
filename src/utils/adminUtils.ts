import { User } from '../types';

export const ADMIN_EMAILS = [
    'amandasabreu89@gmail.com',
    'mira.app@hotmail.com',
    'amandajhonnes@yahoo.com.br',
    'amandasabreu@gmail.com',
    'no-reply@miraimigrante.pt',
    'atendimentomira@gmail.com',
    'suportemira@gmail.com',
    'mira.atendimento@gmail.com'
];

export function isUserAdmin(user: { email?: string | null; role?: string; user_metadata?: any } | User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'admin' || (user as any).user_metadata?.role === 'admin') return true;
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) return true;
    return false;
}
