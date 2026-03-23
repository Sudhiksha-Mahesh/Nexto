import type { Task } from '../types/task';

const TASKS_KEY = 'nexto_tasks';
const ACTIVE_TASK_ID_KEY = 'nexto_active_task_id';
const STATE_META_KEY = 'nexto_state_meta';

export type LocalTaskBundle = {
  tasks: Task[];
  activeTaskId: string | null;
  /** Bumped on user edits; used with server `nexto_state.updated_at` for merge */
  stateUpdatedAt: number;
};

function scopeSuffix(userId: string | null): string {
  if (!userId) return 'local';
  return `user_${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

function scopedKey(base: string, userId: string | null): string {
  return `${base}__${scopeSuffix(userId)}`;
}

type LegacyTask = {
  id: string;
  title: string;
  created_at: number;
  status: 'todo' | 'doing' | 'done';
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function migrateTask(raw: unknown): Task | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const title = raw.title;
  const created_at = raw.created_at;
  if (typeof id !== 'string' || typeof title !== 'string' || typeof created_at !== 'number') return null;

  const hasNewShape =
    typeof raw.priority === 'string' &&
    typeof raw.energy === 'string' &&
    typeof raw.estimated_time === 'number' &&
    Array.isArray(raw.tags);

  if (hasNewShape) {
    const status = raw.status;
    if (status !== 'todo' && status !== 'doing' && status !== 'done') return null;
    const updated_at =
      typeof raw.updated_at === 'number' && Number.isFinite(raw.updated_at)
        ? raw.updated_at
        : created_at;

    const task: Task = {
      id,
      title,
      priority: raw.priority as Task['priority'],
      energy: raw.energy as Task['energy'],
      estimated_time: raw.estimated_time as number,
      tags: (raw.tags as unknown[]).filter((t): t is string => typeof t === 'string'),
      status,
      created_at,
      updated_at,
      started_at: typeof raw.started_at === 'number' ? raw.started_at : undefined,
      completed_at: typeof raw.completed_at === 'number' ? raw.completed_at : undefined,
    };
    if (typeof raw.deadline === 'number' && Number.isFinite(raw.deadline)) {
      task.deadline = raw.deadline;
    }
    return task;
  }

  const legacy = raw as LegacyTask;
  const st = legacy.status;
  if (st !== 'todo' && st !== 'doing' && st !== 'done') return null;

  return {
    id: legacy.id,
    title: legacy.title,
    priority: 'medium',
    energy: 'medium',
    estimated_time: 15,
    tags: [],
    status: st,
    created_at: legacy.created_at,
    updated_at: legacy.created_at,
  };
}

export async function loadTaskState(userId: string | null = null): Promise<LocalTaskBundle> {
  const tasksKey = scopedKey(TASKS_KEY, userId);
  const activeKey = scopedKey(ACTIVE_TASK_ID_KEY, userId);
  const metaKey = scopedKey(STATE_META_KEY, userId);
  const data = await chrome.storage.local.get([
    tasksKey,
    activeKey,
    metaKey,
    // fallback for older unscoped local installs
    TASKS_KEY,
    ACTIVE_TASK_ID_KEY,
    STATE_META_KEY,
  ]);
  const rawTasks = data[tasksKey] ?? (userId == null ? data[TASKS_KEY] : undefined);
  const tasks = Array.isArray(rawTasks)
    ? (rawTasks.map(migrateTask).filter((t): t is Task => t !== null))
    : [];

  let activeTaskId: string | null = null;
  const rawActive = data[activeKey] ?? (userId == null ? data[ACTIVE_TASK_ID_KEY] : undefined);
  if (typeof rawActive === 'string' && rawActive.length > 0) {
    activeTaskId = rawActive;
  }

  const validIds = new Set(tasks.map((t) => t.id));
  if (activeTaskId && !validIds.has(activeTaskId)) {
    activeTaskId = null;
  }

  const metaRaw = data[metaKey] ?? (userId == null ? data[STATE_META_KEY] : undefined);
  let stateUpdatedAt = 0;
  if (isRecord(metaRaw) && typeof metaRaw.stateUpdatedAt === 'number') {
    stateUpdatedAt = metaRaw.stateUpdatedAt;
  }

  return { tasks, activeTaskId, stateUpdatedAt };
}

export async function saveTaskState(bundle: LocalTaskBundle, userId: string | null = null): Promise<void> {
  const tasksKey = scopedKey(TASKS_KEY, userId);
  const activeKey = scopedKey(ACTIVE_TASK_ID_KEY, userId);
  const metaKey = scopedKey(STATE_META_KEY, userId);
  await chrome.storage.local.set({
    [tasksKey]: bundle.tasks,
    [activeKey]: bundle.activeTaskId,
    [metaKey]: { stateUpdatedAt: bundle.stateUpdatedAt },
  });
}
