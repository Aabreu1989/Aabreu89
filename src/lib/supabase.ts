/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/['"]/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/['"]/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 MIRA FATAL: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes no ambiente de execução!');
} else {
  const projectId = supabaseUrl.split('.')[0]?.split('//')[1] || 'sovereign';
  console.log(`📡 MIRA CONNECTED: ${projectId}`);
}

export const getAuthRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://miraimigrante.pt';
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://missing-supabase-url.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
  {
  auth: {
    flowType: 'implicit',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mira-token-v4',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});
