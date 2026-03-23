import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { chromeAuthStorage } from './chromeAuthStorage';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

function looksConfigured(u: string, k: string): boolean {
  if (!u || !k) return false;
  if (u.includes('placeholder') || k.includes('placeholder')) return false;
  return u.startsWith('http');
}

export const isSupabaseConfigured = (): boolean => looksConfigured(url, anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: chromeAuthStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
