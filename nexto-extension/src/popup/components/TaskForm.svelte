<script lang="ts">
  import type { Task } from '../../types/task';
  import { fromDatetimeLocalValue } from '../../lib/datetimeLocal';
  import { taskStore } from '../../store/tasks';

  let title = '';
  let estimated_time = 25;
  let priority: Task['priority'] = 'medium';
  let energy: Task['energy'] = 'medium';
  let tagsRaw = '';
  /** `datetime-local` string; empty = no deadline */
  let deadlineLocal = '';

  $: trimmedTitle = title.trim();
  $: valid =
    trimmedTitle.length > 0 &&
    Number.isFinite(estimated_time) &&
    estimated_time > 0;

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
      estimated_time,
      tags: parseTags(tagsRaw),
      ...(deadline != null ? { deadline } : {}),
    });

    title = '';
    estimated_time = 25;
    priority = 'medium';
    energy = 'medium';
    tagsRaw = '';
    deadlineLocal = '';
  }
</script>

<form
  class="rounded-lg border border-slate-200 bg-white p-3 shadow-card"
  on:submit={handleSubmit}
>
  <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">New task</h2>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600">Title</span>
    <input
      class="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none ring-slate-400 focus:ring-1"
      type="text"
      placeholder="What needs doing?"
      bind:value={title}
      maxlength="200"
    />
  </label>

  <div class="mb-2 grid grid-cols-2 gap-2">
    <label class="block">
      <span class="mb-0.5 block text-xs text-slate-600">Est. (min)</span>
      <input
        class="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-slate-400"
        type="number"
        min="1"
        step="1"
        bind:value={estimated_time}
      />
    </label>
    <label class="block">
      <span class="mb-0.5 block text-xs text-slate-600">Priority</span>
      <select
        class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-slate-400"
        bind:value={priority}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
    </label>
  </div>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600">Deadline (optional)</span>
    <input
      class="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-slate-400"
      type="datetime-local"
      bind:value={deadlineLocal}
    />
  </label>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600">Energy</span>
    <select
      class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-slate-400"
      bind:value={energy}
    >
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
  </label>

  <label class="mb-2 block">
    <span class="mb-0.5 block text-xs text-slate-600">Tags</span>
    <input
      class="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-slate-400"
      type="text"
      placeholder="comma, separated"
      bind:value={tagsRaw}
    />
  </label>

  <button
    class="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
    type="submit"
    disabled={!valid}
  >
    Add Task
  </button>
</form>
