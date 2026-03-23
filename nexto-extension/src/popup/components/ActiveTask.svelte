<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { taskStore } from '../../store/tasks';

  type TimeUnit = 'min' | 'hr';

  let now = Date.now();
  let interval: ReturnType<typeof setInterval>;

  let editingRemaining = false;
  let editAmount = 0;
  let editUnit: TimeUnit = 'min';

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
  $: isPaused = active != null && active.status === 'doing' && started == null;
  $: isRunning = active != null && active.status === 'doing' && started != null;
  $: elapsedMs = started != null ? now - started : 0;
  $: elapsedMinLive = Math.floor(elapsedMs / 60000);
  $: remainingLive =
    active != null && isRunning ? Math.max(0, active.estimated_time - elapsedMinLive) : active?.estimated_time ?? 0;

  function openEditRemaining(): void {
    const mins = isPaused ? active!.estimated_time : remainingLive;
    editingRemaining = true;
    editAmount = mins;
    editUnit = 'min';
  }

  function cancelEdit(): void {
    editingRemaining = false;
  }

  $: rawEdit = typeof editAmount === 'string' ? parseFloat(editAmount) : Number(editAmount);
  $: editComputedMinutes =
    editUnit === 'hr' ? Math.round(rawEdit * 60) : Math.round(rawEdit);
  $: editMinutesValid =
    Number.isFinite(rawEdit) &&
    rawEdit >= 0 &&
    Number.isFinite(editComputedMinutes) &&
    editComputedMinutes >= 0;

  function saveRemaining(): void {
    if (!editMinutesValid) return;
    taskStore.setActiveRemainingMinutes(editComputedMinutes);
    editingRemaining = false;
  }

  function formatElapsed(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }
</script>

{#if active && active.status === 'doing'}
  <section
    class="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/90 p-3 shadow-card dark:border-indigo-800 dark:bg-indigo-950/50"
  >
    <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
      Currently Working On
    </p>
    <p class="mb-2 text-sm font-semibold text-indigo-950 dark:text-indigo-50">{active.title}</p>

    {#if editingRemaining}
      <div class="mb-3 rounded-md border border-indigo-200 bg-white/90 p-2 dark:border-indigo-700 dark:bg-indigo-950/60">
        <p class="mb-2 text-[10px] font-medium text-indigo-800 dark:text-indigo-200">Update time left</p>
        <div class="mb-2 grid grid-cols-[minmax(0,1fr)_4.5rem] gap-2">
          <input
            class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            type="number"
            min="0"
            step={editUnit === 'hr' ? 0.25 : 1}
            bind:value={editAmount}
          />
          <select
            class="w-full rounded-md border border-slate-200 bg-white px-1 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            bind:value={editUnit}
          >
            <option value="min">Mins</option>
            <option value="hr">Hrs</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            class="rounded-md bg-indigo-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-800 disabled:opacity-40 dark:bg-indigo-600 dark:hover:bg-indigo-500"
            disabled={!editMinutesValid}
            on:click={saveRemaining}
          >
            Save
          </button>
          <button
            type="button"
            class="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            on:click={cancelEdit}
          >
            Cancel
          </button>
        </div>
      </div>
    {:else if isRunning}
      <p class="mb-1 font-mono text-lg tabular-nums text-indigo-900 dark:text-indigo-200">
        {formatElapsed(elapsedMs)}
      </p>
      <p class="mb-3 text-xs text-indigo-800 dark:text-indigo-300">
        ~{remainingLive} min left of {active.estimated_time} min for this session
      </p>
    {:else if isPaused}
      <p class="mb-1 text-sm font-medium text-indigo-900 dark:text-indigo-100">Paused</p>
      <p class="mb-3 text-xs text-indigo-800 dark:text-indigo-300">
        ~{active.estimated_time} min left (saved to task)
      </p>
    {/if}

    <div class="flex flex-col gap-1.5">
      {#if isRunning}
        <button
          class="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 shadow-sm hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/40"
          type="button"
          on:click={() => taskStore.pauseTask()}
        >
          Pause
        </button>
      {:else if isPaused}
        <button
          class="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-900 shadow-sm hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
          type="button"
          on:click={() => taskStore.startTask(active.id)}
        >
          Resume
        </button>
      {/if}

      {#if !editingRemaining && (isRunning || isPaused)}
        <button
          class="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-900 shadow-sm hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
          type="button"
          on:click={openEditRemaining}
        >
          Edit time left
        </button>
      {/if}

      <button
        class="w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-900 shadow-sm hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
        type="button"
        on:click={() => taskStore.stopTask()}
      >
        Stop task
      </button>
    </div>
  </section>
{/if}
