/**
 * Persists Supabase Auth session in chrome.storage.local (extension contexts have no localStorage).
 */
export const chromeAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const row = await chrome.storage.local.get(key);
    const v = row[key];
    // Supabase auth expects exact serialized JSON string payloads.
    // Coercing objects to "[object Object]" corrupts session parsing.
    return typeof v === 'string' ? v : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key: string): Promise<void> => {
    await chrome.storage.local.remove(key);
  },
};

/** Clears persisted Supabase auth keys if a previous value is corrupted. */
export async function clearSupabaseAuthStorage(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter(
    (k) => k.startsWith('sb-') && (k.includes('auth-token') || k.includes('refresh-token')),
  );
  if (keys.length > 0) {
    await chrome.storage.local.remove(keys);
  }
}
