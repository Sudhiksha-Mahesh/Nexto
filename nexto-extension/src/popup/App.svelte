<script lang="ts">
  import { onMount } from 'svelte';
  import { isSupabaseConfigured } from '../lib/supabase';
  import { syncStatus } from '../lib/syncStatus';
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
  <header class="mb-3 border-b border-slate-200 pb-3">
    <h1 class="text-lg font-semibold tracking-tight text-slate-900">Nexto</h1>
    <p class="text-xs text-slate-500">Order, without effort.</p>
  </header>

  <div
    class="mb-3 flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5"
    role="tablist"
    aria-label="Main sections"
  >
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'tasks'}
      class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition {activeTab === 'tasks'
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-600 hover:text-slate-900'}"
      on:click={() => (activeTab = 'tasks')}
    >
      Tasks
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === 'insights'}
      class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition {activeTab === 'insights'
        ? 'bg-white text-slate-900 shadow-sm'
        : 'text-slate-600 hover:text-slate-900'}"
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

  <footer class="mt-3 border-t border-slate-100 pt-2 text-[10px] leading-relaxed text-slate-500">
    {#if $syncStatus.state === 'local'}
      Stored in Chrome only. Add <code class="rounded bg-slate-100 px-0.5">VITE_SUPABASE_*</code> to
      <code class="rounded bg-slate-100 px-0.5">.env</code> and rebuild for cloud backup.
    {:else if $syncStatus.state === 'syncing'}
      Syncing with Supabase…
    {:else if $syncStatus.state === 'synced'}
      Saved locally and in Supabase (<span class="font-medium">nexto_tasks</span>,
      <span class="font-medium">nexto_state</span>).
    {:else}
      <span class="text-red-700">Cloud sync: {$syncStatus.message}</span>
    {/if}
  </footer>
</div>
