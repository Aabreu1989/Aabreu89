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

// Module-level singleton: ensures only ONE client instance exists.
// This prevents NavigatorLock timeout errors when Vite HMR reloads modules 
// and multiple instances compete for the same 'mira-token-v4' lock.
let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mira-token-v4',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Bypass Navigator Locks entirely to prevent "lock acquire timeout" errors
        // from multiple tabs or HMR-triggered client re-creations.
        lock: ((_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn()) as Parameters<typeof createClient>[2]['auth']['lock'] & {}
      }
    });
  }
  return _client;
}

export const supabase = getSupabaseClient();
