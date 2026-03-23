<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Task } from '../../types/task';
  import { taskStore } from '../../store/tasks';
  import { levelBadgeClass, levelLabel } from '../../lib/levelStyles';

  export let task: Task;

  let now = Date.now();
  let tick: ReturnType<typeof setInterval> | undefined;

  $: isActive = $taskStore.activeTaskId === task.id;
  $: isRunning = isActive && task.status === 'doing' && task.started_at != null;
  $: isPaused = isActive && task.status === 'doing' && task.started_at == null;
  $: deadlineMs = task.deadline;
  $: overdue =
    deadlineMs != null && deadlineMs < Date.now() && task.status !== 'done';

  function formatDeadline(ms: number): string {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  $: sessionMinLeft =
    isRunning && task.started_at != null
      ? Math.max(0, task.estimated_time - Math.floor((now - task.started_at) / 60000))
      : null;

  $: {
    if (typeof tick !== 'undefined') {
      clearInterval(tick);
      tick = undefined;
    }
    if (isRunning) {
      tick = setInterval(() => {
        now = Date.now();
      }, 1000);
    }
  }

  onDestroy(() => {
    if (typeof tick !== 'undefined') clearInterval(tick);
  });
</script>

<article
  class="rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900 {isActive
    ? 'ring-1 ring-slate-400 dark:ring-slate-500'
    : ''}"
>
  <div class="mb-2 flex items-start justify-between gap-2">
    <h3 class="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">{task.title}</h3>
    {#if isPaused}
      <span
        class="shrink-0 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white dark:bg-amber-500 dark:text-amber-950"
      >
        Paused
      </span>
    {:else if isActive}
      <span
        class="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white dark:bg-slate-100 dark:text-slate-900"
      >
        Active
      </span>
    {/if}
  </div>

  <div class="mb-2 space-y-0.5 text-xs">
    <p class="text-slate-500 dark:text-slate-400">
      {#if isPaused}
        ~{task.estimated_time} min left · paused
      {:else if sessionMinLeft != null}
        ~{sessionMinLeft} min left · {task.estimated_time} min this session
      {:else}
        {task.estimated_time} min estimated
      {/if}
    </p>
    {#if deadlineMs != null}
      <p class={overdue ? 'font-medium text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}>
        Due {formatDeadline(deadlineMs)}{#if overdue}<span class="ml-1 font-semibold">(overdue)</span>{/if}
      </p>
    {/if}
  </div>

  <div class="mb-2 flex flex-wrap gap-1.5">
    <span class={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${levelBadgeClass(task.priority)}`}>
      P · {levelLabel(task.priority)}
    </span>
    <span class={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${levelBadgeClass(task.energy)}`}>
      E · {levelLabel(task.energy)}
    </span>
  </div>

  {#if task.tags.length > 0}
    <div class="mb-3 flex flex-wrap gap-1">
      {#each task.tags as tag (tag)}
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>
      {/each}
    </div>
  {/if}

  <div class="flex flex-wrap gap-1.5">
    <button
      class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
      type="button"
      disabled={isActive && !isPaused}
      on:click={() => taskStore.startTask(task.id)}
    >
      {isPaused ? 'Resume' : 'Start'}
    </button>
    <button
      class="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
      type="button"
      on:click={() => taskStore.completeTask(task.id)}
    >
      Complete
    </button>
    <button
      class="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/30"
      type="button"
      on:click={() => taskStore.deleteTask(task.id)}
    >
      Delete
    </button>
  </div>
</article>
