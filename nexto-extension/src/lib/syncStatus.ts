import { writable } from 'svelte/store';

export type SyncStatus =
  | { state: 'local' }
  | { state: 'syncing' }
  | { state: 'synced'; at: number }
  | { state: 'error'; message: string };

export const syncStatus = writable<SyncStatus>({ state: 'local' });
