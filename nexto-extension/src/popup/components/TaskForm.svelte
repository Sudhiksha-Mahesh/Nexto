<script lang="ts">
  import type { Task } from '../../types/task';
  import { fromDatetimeLocalValue } from '../../lib/datetimeLocal';
  import { taskStore } from '../../store/tasks';

  type TimeUnit = 'min' | 'hr';

  let title = '';
  let timeAmount = 25;
  let timeUnit: TimeUnit = 'min';
  let priority: Task['priority'] = 'medium';
  let energy: Task['energy'] = 'medium';
  let tagsRaw = '';
  /** `datetime-local` string; empty = no deadline */
  let deadlineLocal = '';

  $: trimmedTitle = title.trim();
  $: rawAmount = typeof timeAmount === 'string' ? parseFloat(timeAmount) : Number(timeAmount);
  $: estimatedMinutes =
    timeUnit === 'hr'
      ? Math.round(rawAmount * 60)
      : Math.round(rawAmount);
  $: valid =
    trimmedTitle.length > 0 &&
    Number.isFinite(rawAmount) &&
    rawAmount > 0 &&
    Number.isFinite(estimatedMinutes) &&
    estimatedMinutes >= 1;

  function parseTags(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: Event): void {
    e.preventDefault();
    if (!valid) return;

    const deadline = fromDatetimeLocalValue(deadlineLocal);

    taskStore.addTask({
      title: trimmedTitle,
      priority,
      energy,
      estimated_time: estimatedMinutes,
      tags: parseTags(tagsRaw),
      ...(deadline != null ? { deadline } : {}),
    });

    title = '';
    timeAmount = 25;
    timeUnit = 'min';
    priority = 'medium';
    energy = 'medium';
    tagsRaw = '';
    deadlineLocal = '';
  }
</script>

<form
  class="rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900"
  on:submit={handleSubmit}
>
  <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">New task</h2>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Title</span>
    <input
      class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none ring-slate-400 focus:ring-1 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-500"
      type="text"
      placeholder="What needs doing?"
      bind:value={title}
      maxlength="200"
    />
  </label>

  <div class="mb-2 grid grid-cols-[minmax(0,1fr)_5.25rem_minmax(0,1fr)] gap-2">
    <label class="block min-w-0">
      <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Estimate</span>
      <input
        class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
        type="number"
        min={timeUnit === 'hr' ? 0.25 : 1}
        step={timeUnit === 'hr' ? 0.25 : 1}
        bind:value={timeAmount}
      />
    </label>
    <label class="block w-[5.25rem] shrink-0 justify-self-stretch">
      <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Unit</span>
      <select
        class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
        bind:value={timeUnit}
      >
        <option value="min">Mins</option>
        <option value="hr">Hrs</option>
      </select>
    </label>
    <label class="block min-w-0">
      <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Priority</span>
      <select
        class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
        bind:value={priority}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </label>
  </div>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Deadline (optional)</span>
    <input
      class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
      type="datetime-local"
      bind:value={deadlineLocal}
    />
  </label>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Energy</span>
    <select
      class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
      bind:value={energy}
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </label>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Tags</span>
    <input
      class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
      type="text"
      placeholder="comma, separated"
      bind:value={tagsRaw}
    />
  </label>

  <button
    class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
    type="submit"
    disabled={!valid}
  >
    Add Task
  </button>
</form>
