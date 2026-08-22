import { User } from '../types';

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'amandasabreu89@gmail.com').toLowerCase().trim();

export const ADMIN_EMAILS = [
    'amandasabreu89@gmail.com',
    'amandajhonnes@yahoo.com.br',
    'mira.app@hotmail.com'
];

export const ADMIN_USER_IDS = [
    '00000000-0000-0000-0000-000000000001',
    '775fb10a-78cd-4753-938d-dea75fddd77a',
    'bc16353e-67ae-4ff5-a6aa-bc4d8f62af08',
    'dea69de1-0ed4-44dc-9699-0544e6f39ed8',
    '99b0f5c9-dc81-453b-a60d-e63b6c591ee3',
    '8efd79c9-b4f1-4ae2-adbd-3c192b309642',
    '0d648290-0cda-4684-a32e-7f8de68e87af',
    '70b7679d-b809-48df-b7c7-bf0906e4caf5'
];

export function isUserAdmin(user: { id?: string; email?: string | null; role?: string; user_metadata?: any } | User | null | undefined): boolean {
    if (!user) return false;
    if (user.id && ADMIN_USER_IDS.includes(user.id)) return true;
    if (user.role === 'admin' || user.role === 'ceo') return true;
    if (!user.email) return false;
    const em = user.email.toLowerCase().trim();
    return em === ADMIN_EMAIL || ADMIN_EMAILS.includes(em);
}

export function isInternalOrAdmin(userOrIdOrEmail: any): boolean {
    if (!userOrIdOrEmail) return false;
    if (typeof userOrIdOrEmail === 'string') {
        const val = userOrIdOrEmail.toLowerCase().trim();
        if (ADMIN_USER_IDS.includes(val)) return true;
        if (ADMIN_EMAILS.includes(val)) return true;
        if (/admin|test|teste|dev|example\.com|miratest/i.test(val)) return true;
        return false;
    }
    return isUserAdmin(userOrIdOrEmail);
}

