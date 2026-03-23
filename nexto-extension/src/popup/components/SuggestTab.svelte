<script lang="ts">
  import type { Task } from '../../types/task';
  import { partitionTasksForSuggest, type UserEnergy } from '../../lib/suggestTasks';
  import { taskStore } from '../../store/tasks';
  import { levelBadgeClass, levelLabel } from '../../lib/levelStyles';

  type TimeUnit = 'min' | 'hr';

  let timeAmount = 30;
  let timeUnit: TimeUnit = 'min';
  let userEnergy: UserEnergy = 'medium';

  /** Parsed amount for math (handles empty / invalid input). */
  $: rawAmount = typeof timeAmount === 'string' ? parseFloat(timeAmount) : Number(timeAmount);

  $: availableMinutes =
    timeUnit === 'hr'
      ? Math.max(1, Math.round(rawAmount * 60))
      : Math.max(1, Math.round(rawAmount));

  $: suggestPartition = partitionTasksForSuggest($taskStore.tasks, {
    availableMinutes,
    userEnergy,
    nowMs: Date.now(),
    activeTaskId: $taskStore.activeTaskId,
  });
  $: fits = suggestPartition.fits;
  $: larger = suggestPartition.larger;

  $: top = fits[0];
  $: restFits = fits.slice(1);

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

  /** Human-readable window for empty-state copy. */
  $: slotDescription =
    timeUnit === 'hr'
      ? `${rawAmount} hr (${availableMinutes} min)`
      : `${availableMinutes} min`;

  $: timeValid = Number.isFinite(rawAmount) && rawAmount > 0;
  $: hasAny = fits.length > 0 || larger.length > 0;
</script>

<div class="space-y-3">
  <p class="text-xs text-slate-500 dark:text-slate-400">
    Tasks that fit <span class="font-medium text-slate-700 dark:text-slate-300">within your time</span> are listed first.
    <span class="font-medium text-slate-700 dark:text-slate-300">Larger tasks</span> appear after — use them to plan splits
    or longer focus blocks.
  </p>

  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
    <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Your slot</h2>
    <div class="mb-2 grid grid-cols-[1fr_auto] gap-2">
      <label class="block min-w-0">
        <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Available time</span>
        <input
          class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
          type="number"
          min={timeUnit === 'hr' ? 0.25 : 1}
          step={timeUnit === 'hr' ? 0.25 : 1}
          bind:value={timeAmount}
        />
      </label>
      <label class="block w-[5.25rem] shrink-0">
        <span class="mb-0.5 block text-xs text-slate-600 dark:text-slate-400">Unit</span>
        <select
          class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-500"
          bind:value={timeUnit}
        >
          <option value="min">Mins</option>
          <option value="hr">Hrs</option>
        </select>
      </label>
    </div>
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
  </section>

  {#if !timeValid}
    <p class="rounded-lg border border-dashed border-amber-200 bg-amber-50/80 px-3 py-3 text-center text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      Enter a positive amount of time.
    </p>
  {:else if !hasAny}
    <p class="rounded-lg border border-dashed border-slate-200 bg-white/80 px-3 py-4 text-center text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
      No open tasks match <span class="font-medium text-slate-800 dark:text-slate-200">{levelLabel(userEnergy)}</span> energy
      for <span class="font-medium text-slate-800 dark:text-slate-200">{slotDescription}</span>. Try more time, higher energy,
      or adjust task estimates.
    </p>
  {:else}
    {#if fits.length === 0}
      <p class="rounded-lg border border-dashed border-sky-200 bg-sky-50/80 px-3 py-3 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
        Nothing finishes in one <span class="font-medium">{slotDescription}</span> block — see larger tasks below to plan a
        split or use “Edit time left” on the task after you start.
      </p>
    {:else}
      <section class="rounded-lg border border-emerald-200 bg-emerald-50/90 p-3 shadow-card dark:border-emerald-800 dark:bg-emerald-950/35">
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
          Within your time ({fits.length})
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
            Top pick · {top.reasons.slice(0, 4).join(' · ')}
          </p>
          <div class="mb-3 flex flex-wrap gap-1.5">
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

        {#if restFits.length > 0}
          <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-800/90 dark:text-emerald-300/90">
            All tasks that fit ({restFits.length} more)
          </p>
          <ul class="max-h-44 space-y-2 overflow-y-auto pr-0.5" aria-label="Other tasks that fit your time">
            {#each restFits as { task, reasons } (task.id)}
              <li
                class="rounded-lg border border-emerald-200/80 bg-white/90 p-2 dark:border-emerald-800/60 dark:bg-emerald-950/30"
              >
                <div class="mb-1 flex items-start justify-between gap-2">
                  <span class="text-xs font-medium text-emerald-950 dark:text-emerald-50">{task.title}</span>
                  <span class="shrink-0 text-[10px] tabular-nums text-emerald-800 dark:text-emerald-300">{task.estimated_time}m</span>
                </div>
                <p class="mb-2 text-[10px] text-emerald-900/85 dark:text-emerald-200/90">{reasons.slice(0, 3).join(' · ')}</p>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    class="rounded-md border border-emerald-600/50 bg-emerald-700/90 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-800 disabled:opacity-40 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    disabled={$taskStore.activeTaskId === task.id}
                    on:click={() => taskStore.startTask(task.id)}
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    class="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                    on:click={() => taskStore.completeTask(task.id)}
                  >
                    Complete
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}

    {#if larger.length > 0}
      <section class="rounded-lg border border-amber-200 bg-amber-50/80 p-3 shadow-card dark:border-amber-800 dark:bg-amber-950/25">
        <h2 class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
          Larger than your slot ({larger.length})
        </h2>
        <p class="mb-3 text-[10px] leading-relaxed text-amber-950/90 dark:text-amber-100/90">
          These need more than <span class="font-medium">{slotDescription}</span> in one go. Start one and use pause / edit
          remaining time, or split the work across several sessions.
        </p>
        <ul class="max-h-52 space-y-2 overflow-y-auto pr-0.5" aria-label="Tasks larger than your available time">
          {#each larger as { task, reasons } (task.id)}
            <li
              class="rounded-lg border border-amber-200/90 bg-white/95 p-2.5 dark:border-amber-800/70 dark:bg-amber-950/40"
            >
              <div class="mb-1 flex items-start justify-between gap-2">
                <span class="text-xs font-medium text-amber-950 dark:text-amber-50">{task.title}</span>
                <span class="shrink-0 text-[10px] font-medium tabular-nums text-amber-900 dark:text-amber-200"
                  >{task.estimated_time}m</span
                >
              </div>
              <p class="mb-2 text-[10px] text-amber-900/90 dark:text-amber-200/95">{reasons.slice(0, 4).join(' · ')}</p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  class="rounded-md border border-amber-700 bg-amber-800 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-900 disabled:opacity-40 dark:border-amber-600 dark:bg-amber-700 dark:hover:bg-amber-600"
                  disabled={$taskStore.activeTaskId === task.id}
                  on:click={() => taskStore.startTask(task.id)}
                >
                  Start
                </button>
                <button
                  type="button"
                  class="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                  on:click={() => taskStore.completeTask(task.id)}
                >
                  Complete
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>
