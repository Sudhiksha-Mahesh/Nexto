/**
 * Persists Supabase Auth session in chrome.storage.local (extension contexts have no localStorage).
 */
export const chromeAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const row = await chrome.storage.local.get(key);
    const v = row[key];
    return typeof v === 'string' ? v : v != null ? String(v) : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key: string): Promise<void> => {
    await chrome.storage.local.remove(key);
  },
};
