<script lang="ts">
  import type { Task } from '../../types/task';
  import { taskStore } from '../../store/tasks';
  import { levelBadgeClass, levelLabel } from '../../lib/levelStyles';

  export let task: Task;

  $: isActive = $taskStore.activeTaskId === task.id;
  $: deadlineMs = task.deadline;
  $: overdue =
    deadlineMs != null && deadlineMs < Date.now() && task.status !== 'done';

  function formatDeadline(ms: number): string {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
</script>

<article
  class="rounded-lg border border-slate-200 bg-white p-3 shadow-card {isActive
    ? 'ring-1 ring-slate-400'
    : ''}"
>
  <div class="mb-2 flex items-start justify-between gap-2">
    <h3 class="text-sm font-semibold leading-snug text-slate-900">{task.title}</h3>
    {#if isActive}
      <span class="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white">
        Active
      </span>
    {/if}
  </div>

  <div class="mb-2 space-y-0.5 text-xs">
    <p class="text-slate-500">{task.estimated_time} min estimated</p>
    {#if deadlineMs != null}
      <p class={overdue ? 'font-medium text-red-700' : 'text-slate-600'}>
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
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{tag}</span>
      {/each}
    </div>
  {/if}

  <div class="flex flex-wrap gap-1.5">
    <button
      class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40"
      type="button"
      disabled={isActive}
      on:click={() => taskStore.startTask(task.id)}
    >
      Start
    </button>
    <button
      class="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
      type="button"
      on:click={() => taskStore.completeTask(task.id)}
    >
      Complete
    </button>
    <button
      class="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
      type="button"
      on:click={() => taskStore.deleteTask(task.id)}
    >
      Delete
    </button>
  </div>
</article>
