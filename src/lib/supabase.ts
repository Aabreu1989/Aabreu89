/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/['"]/g, '');
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/['"]/g, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 MIRA CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing!');
} else {
  const projectId = supabaseUrl.split('.')[0].split('//')[1];
  console.log(`📡 MIRA CONNECTED: ${projectId}`);
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'implicit',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mira-token-v4',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
});
