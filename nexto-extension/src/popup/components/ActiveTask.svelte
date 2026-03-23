<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { taskStore } from '../../store/tasks';

  let now = Date.now();
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    interval = setInterval(() => {
      now = Date.now();
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });

  $: active = $taskStore.tasks.find((t) => t.id === $taskStore.activeTaskId);
  $: started = active?.started_at;
  $: elapsedMs = started != null ? now - started : 0;

  function formatElapsed(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }
</script>

{#if active && started != null}
  <section
    class="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/90 p-3 shadow-card dark:border-indigo-800 dark:bg-indigo-950/50"
  >
    <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
      Currently Working On
    </p>
    <p class="mb-2 text-sm font-semibold text-indigo-950 dark:text-indigo-50">{active.title}</p>
    <p class="mb-3 font-mono text-lg tabular-nums text-indigo-900 dark:text-indigo-200">
      {formatElapsed(elapsedMs)}
    </p>
    <button
      class="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-900 shadow-sm hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
      type="button"
      on:click={() => taskStore.stopTask()}
    >
      Stop Task
    </button>
  </section>
{/if}
