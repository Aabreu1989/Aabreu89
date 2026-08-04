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

export function isUserAdmin(user: User | null | undefined): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim())) return true;
    return false;
}
