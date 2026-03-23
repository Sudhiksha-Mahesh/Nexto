import { writable } from 'svelte/store';
import { getSupabase, isSupabaseConfigured } from './supabase';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type AuthState =
  | { status: 'disabled' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; user: AuthUser };

export const authState = writable<AuthState>({ status: 'disabled' });

let initialized = false;

function setFromSessionUser(user: { id: string; email?: string | null } | null): void {
  if (!isSupabaseConfigured()) {
    authState.set({ status: 'disabled' });
    return;
  }
  if (!user) {
    authState.set({ status: 'signed_out' });
    return;
  }
  authState.set({
    status: 'signed_in',
    user: { id: user.id, email: user.email ?? null },
  });
}

export async function initAuth(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!isSupabaseConfigured()) {
    authState.set({ status: 'disabled' });
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    authState.set({ status: 'disabled' });
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  setFromSessionUser(session?.user ?? null);

  supabase.auth.onAuthStateChange((_evt, sessionNext) => {
    setFromSessionUser(sessionNext?.user ?? null);
  });
}

export async function getCurrentSupabaseUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function signInWithEmail(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signUpWithEmail(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase is not configured.' };
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOutAuth(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
