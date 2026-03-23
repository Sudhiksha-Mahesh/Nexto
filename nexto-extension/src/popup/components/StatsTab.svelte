<script lang="ts">
  import { buildTaskStats, formatDurationMs } from '../../lib/stats';
  import { taskStore } from '../../store/tasks';

  $: stats = buildTaskStats($taskStore.tasks);

  function barPct(n: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((n / total) * 100);
  }

  $: openTotal = stats.open + stats.doing;
</script>

<div class="space-y-3">
  <p class="text-xs text-slate-500">
    Based on everything stored on this device (including completed tasks). Use this to tune estimates,
    priority, and energy over time.
  </p>

  {#if stats.total === 0}
    <p class="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
      No data yet. Complete a few tasks on the Tasks tab to see trends here.
    </p>
  {:else}
    <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
      <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Volume</h2>
      <dl class="grid grid-cols-2 gap-2 text-xs">
        <div class="rounded-md bg-slate-50 px-2 py-1.5">
          <dt class="text-slate-500">Open</dt>
          <dd class="text-lg font-semibold tabular-nums text-slate-900">{openTotal}</dd>
        </div>
        <div class="rounded-md bg-slate-50 px-2 py-1.5">
          <dt class="text-slate-500">Done (all time)</dt>
          <dd class="text-lg font-semibold tabular-nums text-slate-900">{stats.done}</dd>
        </div>
        <div class="rounded-md bg-emerald-50/80 px-2 py-1.5">
          <dt class="text-emerald-800">Done (7 days)</dt>
          <dd class="text-lg font-semibold tabular-nums text-emerald-950">{stats.doneLast7Days}</dd>
        </div>
        <div class="rounded-md bg-emerald-50/80 px-2 py-1.5">
          <dt class="text-emerald-800">Done (30 days)</dt>
          <dd class="text-lg font-semibold tabular-nums text-emerald-950">{stats.doneLast30Days}</dd>
        </div>
      </dl>
      {#if stats.overdueOpen > 0}
        <p class="mt-2 text-[11px] font-medium text-amber-800">
          {stats.overdueOpen} open task{stats.overdueOpen === 1 ? '' : 's'} past deadline — consider shorter estimates or higher priority.
        </p>
      {/if}
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
      <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Estimates</h2>
      <dl class="space-y-1 text-xs text-slate-700">
        <div class="flex justify-between gap-2">
          <dt>Open queue (est.)</dt>
          <dd class="font-medium tabular-nums text-slate-900">{stats.estimatedMinutesOpen} min</dd>
        </div>
        <div class="flex justify-between gap-2">
          <dt>Completed work (est. sum)</dt>
          <dd class="font-medium tabular-nums text-slate-900">{stats.estimatedMinutesDone} min</dd>
        </div>
        <div class="flex justify-between gap-2 border-t border-slate-100 pt-1">
          <dt>Avg. time to complete</dt>
          <dd class="font-medium tabular-nums text-slate-900">
            {stats.avgCompletionMs != null ? formatDurationMs(stats.avgCompletionMs) : '—'}
          </dd>
        </div>
      </dl>
      <p class="mt-2 text-[10px] text-slate-500">
        “Time to complete” is from <span class="font-medium">created → completed</span> for finished tasks.
      </p>
    </section>

    <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
      <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Open queue mix</h2>
      {#if openTotal === 0}
        <p class="text-xs text-slate-500">Nothing in todo/doing.</p>
      {:else}
        <div class="mb-2">
          <p class="mb-1 text-[10px] font-medium text-slate-600">Priority</p>
          <div class="flex h-2 overflow-hidden rounded-full bg-slate-100">
            <span
              class="bg-slate-400"
              style={`width: ${barPct(stats.openByPriority.low, openTotal)}%`}
              title="Low"
            />
            <span
              class="bg-amber-400"
              style={`width: ${barPct(stats.openByPriority.medium, openTotal)}%`}
              title="Medium"
            />
            <span
              class="bg-red-400"
              style={`width: ${barPct(stats.openByPriority.high, openTotal)}%`}
              title="High"
            />
          </div>
          <div class="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>L {stats.openByPriority.low}</span>
            <span>M {stats.openByPriority.medium}</span>
            <span>H {stats.openByPriority.high}</span>
          </div>
        </div>
        <div>
          <p class="mb-1 text-[10px] font-medium text-slate-600">Energy</p>
          <div class="flex h-2 overflow-hidden rounded-full bg-slate-100">
            <span
              class="bg-slate-400"
              style={`width: ${barPct(stats.openByEnergy.low, openTotal)}%`}
            />
            <span
              class="bg-amber-400"
              style={`width: ${barPct(stats.openByEnergy.medium, openTotal)}%`}
            />
            <span
              class="bg-red-400"
              style={`width: ${barPct(stats.openByEnergy.high, openTotal)}%`}
            />
          </div>
          <div class="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>L {stats.openByEnergy.low}</span>
            <span>M {stats.openByEnergy.medium}</span>
            <span>H {stats.openByEnergy.high}</span>
          </div>
        </div>
      {/if}
    </section>

    {#if stats.done > 0}
      <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
        <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Completed — priority mix
        </h2>
        <div class="flex h-2 overflow-hidden rounded-full bg-slate-100">
          <span class="bg-slate-400" style={`width: ${barPct(stats.doneByPriority.low, stats.done)}%`} />
          <span class="bg-amber-400" style={`width: ${barPct(stats.doneByPriority.medium, stats.done)}%`} />
          <span class="bg-red-400" style={`width: ${barPct(stats.doneByPriority.high, stats.done)}%`} />
        </div>
        <div class="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>L {stats.doneByPriority.low}</span>
          <span>M {stats.doneByPriority.medium}</span>
          <span>H {stats.doneByPriority.high}</span>
        </div>
      </section>
    {/if}

    {#if stats.topTags.length > 0}
      <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card">
        <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Top tags</h2>
        <ul class="flex flex-wrap gap-1.5">
          {#each stats.topTags as { tag, count } (tag)}
            <li
              class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
            >
              {tag}
              <span class="tabular-nums text-slate-500">×{count}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>
