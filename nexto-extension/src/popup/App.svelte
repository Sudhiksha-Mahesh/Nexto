<script lang="ts">
  import { onMount } from 'svelte';
  import { isSupabaseConfigured } from '../lib/supabase';
  import { syncStatus } from '../lib/syncStatus';
  import { taskStore } from '../store/tasks';
  import TaskForm from './components/TaskForm.svelte';
  import TaskList from './components/TaskList.svelte';
  import ActiveTask from './components/ActiveTask.svelte';

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

  <TaskForm />

  <TaskList />

  <ActiveTask />

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
