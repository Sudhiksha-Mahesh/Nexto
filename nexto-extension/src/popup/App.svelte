<script lang="ts">
  import { onMount } from 'svelte';
  import { isSupabaseConfigured } from '../lib/supabase';
  import { syncStatus } from '../lib/syncStatus';
  import { theme, toggleTheme } from '../lib/theme';
  import { taskStore } from '../store/tasks';
  import TasksTab from './components/TasksTab.svelte';
  import StatsTab from './components/StatsTab.svelte';

  type TabId = 'tasks' | 'insights';

  let activeTab: TabId = 'tasks';

  onMount(() => {
    if (isSupabaseConfigured()) {
      syncStatus.set({ state: 'syncing' });
    }
    void taskStore.hydrate();
  });
</script>

<div class="w-full p-4">
  <header
    class="mb-3 flex items-start justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700"
  >
    <div class="min-w-0">
      <h1 class="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">Nexto</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400">Order, without effort.</p>
    </div>
    <button
      type="button"
      class="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={$theme === 'dark' ? 'Light mode' : 'Dark mode'}
      on:click={() => void toggleTheme()}
    >
      {#if $theme === 'dark'}
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      {:else}
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {/if}
    </button>
  </header>

  <div
    class="mb-3 flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 dark:border-slate-600 dark:bg-slate-900/80"
    role="tablist"
    aria-label="Main sections"
  >
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'tasks'}
      class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition {activeTab === 'tasks'
        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-50'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}"
      on:click={() => (activeTab = 'tasks')}
    >
      Tasks
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'insights'}
      class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition {activeTab === 'insights'
        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-50'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}"
      on:click={() => (activeTab = 'insights')}
    >
      Insights
    </button>
  </div>

  {#if activeTab === 'tasks'}
    <div role="tabpanel" aria-label="Tasks">
      <TasksTab />
    </div>
  {:else}
    <div role="tabpanel" aria-label="Insights">
      <StatsTab />
    </div>
  {/if}

  <footer
    class="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400"
  >
    {#if $syncStatus.state === 'local'}
      Stored in Chrome only. Add <code class="rounded bg-slate-100 px-0.5 dark:bg-slate-800">VITE_SUPABASE_*</code> to
      <code class="rounded bg-slate-100 px-0.5 dark:bg-slate-800">.env</code> and rebuild for cloud backup.
    {:else if $syncStatus.state === 'syncing'}
      Syncing with Supabase…
    {:else if $syncStatus.state === 'synced'}
      Saved locally and in Supabase (<span class="font-medium">nexto_tasks</span>,
      <span class="font-medium">nexto_state</span>).
    {:else}
      <span class="text-red-700 dark:text-red-400">Cloud sync: {$syncStatus.message}</span>
    {/if}
  </footer>
</div>
