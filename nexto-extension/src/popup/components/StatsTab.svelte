<script lang="ts">
  import { buildTaskStats, formatDurationMs } from '../../lib/stats';
  import { taskStore } from '../../store/tasks';
  import InsightCharts from './InsightCharts.svelte';

  $: stats = buildTaskStats($taskStore.tasks);
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
          <dd class="text-lg font-semibold tabular-nums text-slate-900">{stats.open + stats.doing}</dd>
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

    <InsightCharts {stats} />

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
  {/if}
</div>
