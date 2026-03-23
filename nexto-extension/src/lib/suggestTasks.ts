import type { Task } from '../types/task';

export type UserEnergy = Task['energy'];

const ENERGY_RANK: Record<UserEnergy, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const PRIORITY_RANK: Record<Task['priority'], number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export type SuggestInputs = {
  /** Minutes you have right now */
  availableMinutes: number;
  /** Energy you feel you have (tasks requiring more are excluded) */
  userEnergy: UserEnergy;
  /** Current time for deadline math */
  nowMs: number;
  /** Prefer the task already in progress when it still fits */
  activeTaskId: string | null;
};

export type RankedTask = {
  task: Task;
  score: number;
  /** Why it ranked (for UI hints) */
  reasons: string[];
};

/** Task is doable if its required energy does not exceed what the user has. */
export function energyFeasible(userEnergy: UserEnergy, taskEnergy: UserEnergy): boolean {
  return ENERGY_RANK[taskEnergy] <= ENERGY_RANK[userEnergy];
}

function deadlineUrgency(task: Task, nowMs: number): { points: number; label?: string } {
  const d = task.deadline;
  if (d == null) return { points: 0 };

  if (d < nowMs) {
    return { points: 4000, label: 'Overdue' };
  }

  const hours = (d - nowMs) / (60 * 60 * 1000);
  if (hours <= 24) {
    return { points: 1500 + Math.max(0, 500 - hours * 20), label: 'Due within 24h' };
  }
  if (hours <= 72) {
    return { points: 800 + Math.max(0, 200 - hours * 5), label: 'Due soon' };
  }
  if (hours <= 168) {
    return { points: 200 + Math.max(0, 100 - hours), label: 'Due this week' };
  }

  return { points: 50, label: 'Has deadline' };
}

function priorityPoints(p: Task['priority']): number {
  return PRIORITY_RANK[p] * 120;
}

/**
 * Open tasks that fit in `availableMinutes` and match energy, sorted by score (highest first).
 */
export function rankTasksForSlot(tasks: Task[], input: SuggestInputs): RankedTask[] {
  const { availableMinutes, userEnergy, nowMs, activeTaskId } = input;

  if (!Number.isFinite(availableMinutes) || availableMinutes <= 0) {
    return [];
  }

  const open = tasks.filter((t) => t.status !== 'done');
  const out: RankedTask[] = [];

  for (const task of open) {
    if (task.estimated_time > availableMinutes) continue;
    if (!energyFeasible(userEnergy, task.energy)) continue;

    const reasons: string[] = [];
    let score = priorityPoints(task.priority);
    reasons.push(`Priority · ${task.priority}`);

    const { points: du, label: duLabel } = deadlineUrgency(task, nowMs);
    if (du > 0) {
      score += du;
      if (duLabel) reasons.push(duLabel);
    }

    if (task.id === activeTaskId && task.status === 'doing') {
      score += 350;
      reasons.push('In progress');
    }

    // Slight preference for using the window well (optional tie-breaker feel)
    const utilization = task.estimated_time / availableMinutes;
    score += Math.round(utilization * 40);
    if (utilization >= 0.7) reasons.push('Fits your time well');

    out.push({ task, score, reasons });
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ad = a.task.deadline;
    const bd = b.task.deadline;
    if (ad != null && bd != null && ad !== bd) return ad - bd;
    if (ad != null && bd == null) return -1;
    if (ad == null && bd != null) return 1;
    return PRIORITY_RANK[b.task.priority] - PRIORITY_RANK[a.task.priority];
  });

  return out;
}
