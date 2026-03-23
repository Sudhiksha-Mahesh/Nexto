<script lang="ts">
  import type { Task } from '../../types/task';
  import { rankTasksForSlot, type UserEnergy } from '../../lib/suggestTasks';
  import { taskStore } from '../../store/tasks';
  import { levelBadgeClass, levelLabel } from '../../lib/levelStyles';

  let availableMinutes = 30;
  let userEnergy: UserEnergy = 'medium';

  $: ranked = rankTasksForSlot($taskStore.tasks, {
    availableMinutes,
    userEnergy,
    nowMs: Date.now(),
    activeTaskId: $taskStore.activeTaskId,
  });

  $: top = ranked[0];
  $: rest = ranked.slice(1, 6);

  function formatDeadline(ms: number): string {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  function deadlineLine(task: Task): string | null {
    if (task.deadline == null) return null;
    const overdue = task.deadline < Date.now();
    return overdue ? `Overdue · was ${formatDeadline(task.deadline)}` : `Due ${formatDeadline(task.deadline)}`;
  }
</script>

<div class="space-y-3">
  <p class="text-xs text-slate-500 dark:text-slate-400">
    Enter how much time you have and your energy. We only suggest tasks that fit in that window and don’t need more
    energy than you selected, then rank by deadline and priority.
  </p>

  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
    <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your slot</h2>
    <div class="grid grid-cols-2 gap-2">
      <label class="block">
        <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Available time (min)</span>
        <input
          class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
          type="number"
          min="1"
          step="1"
          bind:value={availableMinutes}
        />
      </label>
      <label class="block">
        <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Your energy</span>
        <select
          class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
          bind:value={userEnergy}
        >
          <option value="low">Low — light tasks only</option>
          <option value="medium">Medium</option>
          <option value="high">High — any task</option>
        </select>
      </label>
    </div>
  </section>

  {#if !Number.isFinite(availableMinutes) || availableMinutes < 1}
    <p class="rounded-lg border border-dashed border-amber-200 bg-amber-50/80 px-3 py-3 text-center text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      Set available time to at least 1 minute.
    </p>
  {:else if ranked.length === 0}
    <p class="rounded-lg border border-dashed border-slate-200 bg-white/80 px-3 py-4 text-center text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
      No open tasks fit <span class="font-medium text-slate-800 dark:text-slate-200">{availableMinutes} min</span> with
      <span class="font-medium text-slate-800 dark:text-slate-200">{levelLabel(userEnergy)}</span> energy. Try more time,
      higher energy, or shorter estimates on your tasks.
    </p>
  {:else}
    <section class="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 shadow-card dark:border-emerald-800 dark:bg-emerald-950/35">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        Suggested now
      </p>
      {#if top}
        <h3 class="mb-1 text-sm font-semibold text-emerald-950 dark:text-emerald-50">{top.task.title}</h3>
        <div class="mb-2 flex flex-wrap gap-1.5 text-[10px]">
          <span class={`inline-flex rounded-full px-2 py-0.5 font-medium ${levelBadgeClass(top.task.priority)}`}>
            P · {levelLabel(top.task.priority)}
          </span>
          <span class={`inline-flex rounded-full px-2 py-0.5 font-medium ${levelBadgeClass(top.task.energy)}`}>
            E · {levelLabel(top.task.energy)}
          </span>
          <span class="inline-flex rounded-full border border-emerald-300 bg-white/80 px-2 py-0.5 font-medium text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100">
            ~{top.task.estimated_time} min
          </span>
        </div>
        {#if deadlineLine(top.task)}
          <p class="mb-2 text-xs text-emerald-900 dark:text-emerald-200">{deadlineLine(top.task)}</p>
        {/if}
        <p class="mb-3 text-[10px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
          {top.reasons.slice(0, 4).join(' · ')}
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="rounded-md border border-emerald-600 bg-emerald-700 px-2 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-800 disabled:opacity-40 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            disabled={$taskStore.activeTaskId === top.task.id}
            on:click={() => taskStore.startTask(top.task.id)}
          >
            Start
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            on:click={() => taskStore.completeTask(top.task.id)}
          >
            Complete
          </button>
        </div>
      {/if}
    </section>

    {#if rest.length > 0}
      <section>
        <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Also fits this slot
        </h2>
        <ul class="flex flex-col gap-2">
          {#each rest as { task, reasons } (task.id)}
            <li
              class="rounded-lg border border-slate-200 bg-white p-2.5 shadow-card dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="mb-1 flex items-start justify-between gap-2">
                <span class="text-xs font-medium text-slate-900 dark:text-slate-50">{task.title}</span>
                <span class="shrink-0 text-[10px] tabular-nums text-slate-500 dark:text-slate-400">{task.estimated_time}m</span>
              </div>
              <p class="mb-2 text-[10px] text-slate-500 dark:text-slate-400">{reasons.slice(0, 2).join(' · ')}</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={$taskStore.activeTaskId === task.id}
                  on:click={() => taskStore.startTask(task.id)}
                >
                  Start
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>
