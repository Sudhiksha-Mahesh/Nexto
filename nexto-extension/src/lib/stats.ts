import type { Task } from '../types/task';

export type LevelCounts = Record<'low' | 'medium' | 'high', number>;

export type TaskStats = {
  total: number;
  open: number;
  doing: number;
  done: number;
  doneLast7Days: number;
  doneLast30Days: number;
  overdueOpen: number;
  estimatedMinutesOpen: number;
  estimatedMinutesDone: number;
  openByPriority: LevelCounts;
  openByEnergy: LevelCounts;
  doneByPriority: LevelCounts;
  avgCompletionMs: number | null;
  topTags: { tag: string; count: number }[];
};

const DAY = 24 * 60 * 60 * 1000;

function emptyLevels(): LevelCounts {
  return { low: 0, medium: 0, high: 0 };
}

function inc(level: 'low' | 'medium' | 'high', map: LevelCounts): void {
  map[level] += 1;
}

/** Aggregate stats from all stored tasks (including completed — kept for history). */
export function buildTaskStats(tasks: Task[]): TaskStats {
  const now = Date.now();
  const t7 = now - 7 * DAY;
  const t30 = now - 30 * DAY;

  let open = 0;
  let doing = 0;
  let done = 0;
  let doneLast7Days = 0;
  let doneLast30Days = 0;
  let overdueOpen = 0;
  let estimatedMinutesOpen = 0;
  let estimatedMinutesDone = 0;
  const openByPriority = emptyLevels();
  const openByEnergy = emptyLevels();
  const doneByPriority = emptyLevels();
  const tagCounts = new Map<string, number>();
  const completionDurations: number[] = [];

  for (const t of tasks) {
    if (t.status === 'todo') {
      open += 1;
      inc(t.priority, openByPriority);
      inc(t.energy, openByEnergy);
      estimatedMinutesOpen += t.estimated_time;
      if (t.deadline != null && t.deadline < now) overdueOpen += 1;
    } else if (t.status === 'doing') {
      doing += 1;
      inc(t.priority, openByPriority);
      inc(t.energy, openByEnergy);
      estimatedMinutesOpen += t.estimated_time;
      if (t.deadline != null && t.deadline < now) overdueOpen += 1;
    } else {
      done += 1;
      inc(t.priority, doneByPriority);
      estimatedMinutesDone += t.estimated_time;
      const c = t.completed_at;
      if (c != null) {
        if (c >= t7) doneLast7Days += 1;
        if (c >= t30) doneLast30Days += 1;
        completionDurations.push(c - t.created_at);
      }
    }

    for (const tag of t.tags) {
      const k = tag.toLowerCase();
      tagCounts.set(k, (tagCounts.get(k) ?? 0) + 1);
    }
  }

  const avgCompletionMs =
    completionDurations.length > 0
      ? completionDurations.reduce((a, b) => a + b, 0) / completionDurations.length
      : null;

  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    total: tasks.length,
    open,
    doing,
    done,
    doneLast7Days,
    doneLast30Days,
    overdueOpen,
    estimatedMinutesOpen,
    estimatedMinutesDone,
    openByPriority,
    openByEnergy,
    doneByPriority,
    avgCompletionMs,
    topTags,
  };
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const sec = Math.round(ms / 1000);
  if (sec < 120) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 120) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
