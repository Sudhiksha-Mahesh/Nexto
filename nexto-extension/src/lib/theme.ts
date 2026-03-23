import { get, writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'nexto_theme';

function applyDom(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

/** Persisted UI theme (popup + options if wired). */
export const theme = writable<ThemeMode>('light');

export async function initTheme(): Promise<void> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const raw = data[STORAGE_KEY];
  const mode: ThemeMode = raw === 'dark' ? 'dark' : 'light';
  theme.set(mode);
  applyDom(mode);
}

export async function setTheme(mode: ThemeMode): Promise<void> {
  theme.set(mode);
  applyDom(mode);
  await chrome.storage.local.set({ [STORAGE_KEY]: mode });
}

export async function toggleTheme(): Promise<void> {
  const next: ThemeMode = get(theme) === 'light' ? 'dark' : 'light';
  await setTheme(next);
}
