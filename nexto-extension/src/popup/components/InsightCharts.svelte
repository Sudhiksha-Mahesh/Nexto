<script lang="ts">
  import type { TaskStats } from '../../lib/stats';

  export let stats: TaskStats;

  const colors = ['#94a3b8', '#fbbf24', '#f87171'] as const;

  /** Donut slice paths (outer/inner radius in viewBox units). */
  function donutSlices(
    values: [number, number, number],
    cx: number,
    cy: number,
    rOut: number,
    rIn: number,
  ): { d: string; fill: string }[] {
    const sum = values[0] + values[1] + values[2];
    if (sum <= 0) return [];
    let angle = -90;
    const out: { d: string; fill: string }[] = [];
    for (let i = 0; i < 3; i++) {
      const v = values[i];
      if (v <= 0) continue;
      const sweep = (v / sum) * 360;
      // A 360deg arc has identical start/end points and can render as invisible.
      if (sweep >= 359.999) {
        out.push({ d: donutRing(cx, cy, rOut, rIn), fill: colors[i] });
        break;
      }
      const a0 = angle;
      const a1 = angle + sweep;
      out.push({ d: donutArc(cx, cy, rOut, rIn, a0, a1), fill: colors[i] });
      angle = a1;
    }
    return out;
  }

  function donutRing(cx: number, cy: number, rOut: number, rIn: number): string {
    const xoR = cx + rOut;
    const xoL = cx - rOut;
    const xiR = cx + rIn;
    const xiL = cx - rIn;
    return `M ${xoR} ${cy} A ${rOut} ${rOut} 0 1 1 ${xoL} ${cy} A ${rOut} ${rOut} 0 1 1 ${xoR} ${cy} L ${xiR} ${cy} A ${rIn} ${rIn} 0 1 0 ${xiL} ${cy} A ${rIn} ${rIn} 0 1 0 ${xiR} ${cy} Z`;
  }

  function donutArc(
    cx: number,
    cy: number,
    rOut: number,
    rIn: number,
    a0: number,
    a1: number,
  ): string {
    const t0 = (a0 * Math.PI) / 180;
    const t1 = (a1 * Math.PI) / 180;
    const x0o = cx + rOut * Math.cos(t0);
    const y0o = cy + rOut * Math.sin(t0);
    const x1o = cx + rOut * Math.cos(t1);
    const y1o = cy + rOut * Math.sin(t1);
    const x1i = cx + rIn * Math.cos(t1);
    const y1i = cy + rIn * Math.sin(t1);
    const x0i = cx + rIn * Math.cos(t0);
    const y0i = cy + rIn * Math.sin(t0);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0o} ${y0o} A ${rOut} ${rOut} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${rIn} ${rIn} 0 ${large} 0 ${x0i} ${y0i} Z`;
  }

  $: openTotal = stats.open + stats.doing;

  $: priSlices =
    openTotal > 0
      ? donutSlices(
          [
            stats.openByPriority.low,
            stats.openByPriority.medium,
            stats.openByPriority.high,
          ],
          50,
          50,
          40,
          24,
        )
      : [];

  $: enSlices =
    openTotal > 0
      ? donutSlices(
          [stats.openByEnergy.low, stats.openByEnergy.medium, stats.openByEnergy.high],
          50,
          50,
          40,
          24,
        )
      : [];

  $: doneSlices =
    stats.done > 0
      ? donutSlices(
          [
            stats.doneByPriority.low,
            stats.doneByPriority.medium,
            stats.doneByPriority.high,
          ],
          50,
          50,
          40,
          24,
        )
      : [];

  $: dailyMax = Math.max(1, ...stats.dailyCompletions.map((d) => d.count));

  $: top5 = stats.topTags.slice(0, 5);
  $: tagMax = top5.length > 0 ? Math.max(1, ...top5.map((t) => t.count)) : 1;
</script>

{#if stats.total > 0}
  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-card dark:border-slate-700 dark:bg-slate-900">
    <h2 class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Charts</h2>

    {#if openTotal > 0}
      <div class="mb-3 grid grid-cols-2 gap-3">
        <div>
          <p class="mb-1 text-center text-[10px] font-medium text-slate-600 dark:text-slate-400">Open · priority</p>
          <svg viewBox="0 0 100 100" class="mx-auto h-28 w-28" aria-hidden="true">
            {#each priSlices as s (s.d)}
              <path
                d={s.d}
                fill={s.fill}
                class="stroke-white dark:stroke-slate-900"
                stroke-width="0.5"
              />
            {/each}
          </svg>
          <div class="mt-1 flex justify-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
            <span>L {stats.openByPriority.low}</span>
            <span>M {stats.openByPriority.medium}</span>
            <span>H {stats.openByPriority.high}</span>
          </div>
        </div>
        <div>
          <p class="mb-1 text-center text-[10px] font-medium text-slate-600 dark:text-slate-400">Open · energy</p>
          <svg viewBox="0 0 100 100" class="mx-auto h-28 w-28" aria-hidden="true">
            {#each enSlices as s (s.d)}
              <path
                d={s.d}
                fill={s.fill}
                class="stroke-white dark:stroke-slate-900"
                stroke-width="0.5"
              />
            {/each}
          </svg>
          <div class="mt-1 flex justify-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
            <span>L {stats.openByEnergy.low}</span>
            <span>M {stats.openByEnergy.medium}</span>
            <span>H {stats.openByEnergy.high}</span>
          </div>
        </div>
      </div>
    {/if}

    <div class="mb-3">
      <p class="mb-1 text-[10px] font-medium text-slate-600 dark:text-slate-400">Completions per day (14 d)</p>
      <div class="flex h-24 items-end gap-px border-b border-slate-200 pb-0.5 dark:border-slate-600">
        {#each stats.dailyCompletions as d (d.date)}
          <div class="group flex min-w-0 flex-1 flex-col items-center justify-end" title="{d.date}: {d.count}">
            <span
              class="w-full max-w-[14px] rounded-t bg-slate-600 transition group-hover:bg-slate-800 dark:bg-slate-500 dark:group-hover:bg-slate-400"
              style="height: {(d.count / dailyMax) * 100}%; min-height: {d.count > 0 ? '4px' : '0'}"
            ></span>
          </div>
        {/each}
      </div>
      <div class="mt-0.5 flex justify-between text-[7px] text-slate-400 dark:text-slate-500">
        <span>{stats.dailyCompletions[0]?.label ?? ''}</span>
        <span>{stats.dailyCompletions[stats.dailyCompletions.length - 1]?.label ?? ''}</span>
      </div>
    </div>

    {#if stats.done > 0}
      <div class="mb-3">
        <p class="mb-1 text-center text-[10px] font-medium text-slate-600 dark:text-slate-400">Done · priority</p>
        <div class="flex justify-center">
          <svg viewBox="0 0 100 100" class="h-28 w-28" aria-hidden="true">
            {#each doneSlices as s (s.d)}
              <path
                d={s.d}
                fill={s.fill}
                class="stroke-white dark:stroke-slate-900"
                stroke-width="0.5"
              />
            {/each}
          </svg>
        </div>
        <div class="flex justify-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
          <span>L {stats.doneByPriority.low}</span>
          <span>M {stats.doneByPriority.medium}</span>
          <span>H {stats.doneByPriority.high}</span>
        </div>
      </div>
    {/if}

    {#if top5.length > 0}
      <div>
        <p class="mb-2 text-[10px] font-medium text-slate-600 dark:text-slate-400">Top tags</p>
        <div class="space-y-1.5">
          {#each top5 as t (t.tag)}
            <div class="flex items-center gap-2 text-[10px]">
              <span class="w-20 shrink-0 truncate text-slate-700 dark:text-slate-300" title={t.tag}>{t.tag}</span>
              <div class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full rounded-full bg-sky-600 dark:bg-sky-500"
                  style="width: {(t.count / tagMax) * 100}%"
                ></div>
              </div>
              <span class="w-4 shrink-0 text-right tabular-nums text-slate-500 dark:text-slate-400">{t.count}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </section>
{/if}
