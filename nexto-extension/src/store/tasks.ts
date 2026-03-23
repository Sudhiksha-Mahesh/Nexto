import { writable } from 'svelte/store';
import type { NewTaskInput, Task } from '../types/task';
import { loadTaskState, saveTaskState, type LocalTaskBundle } from '../lib/storage';
import { isSupabaseConfigured } from '../lib/supabase';
import { schedulePushToSupabase, syncFromSupabase } from '../lib/remoteSync';
import { syncStatus } from '../lib/syncStatus';

function randomId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): number {
  return Date.now();
}

export type TaskStoreState = {
  tasks: Task[];
  activeTaskId: string | null;
};

const initialState: TaskStoreState = {
  tasks: [],
  activeTaskId: null,
};

function toBundle(state: TaskStoreState, stateUpdatedAt: number): LocalTaskBundle {
  return {
    tasks: state.tasks,
    activeTaskId: state.activeTaskId,
    stateUpdatedAt,
  };
}

function persist(state: TaskStoreState): void {
  const bundle = toBundle(state, now());
  void saveTaskState(bundle);
  schedulePushToSupabase(bundle);
}

function createTasksStore() {
  const { subscribe, set, update } = writable<TaskStoreState>(initialState);

  return {
    subscribe,
    async hydrate(): Promise<void> {
      const local = await loadTaskState();
      set({ tasks: local.tasks, activeTaskId: local.activeTaskId });

      if (!isSupabaseConfigured()) {
        syncStatus.set({ state: 'local' });
        return;
      }

      try {
        const merged = await syncFromSupabase(local);
        set({ tasks: merged.tasks, activeTaskId: merged.activeTaskId });
        await saveTaskState(merged);
      } catch (e) {
        console.warn('[Nexto] hydrate remote sync', e);
        syncStatus.set({
          state: 'error',
          message: e instanceof Error ? e.message : 'Sync failed',
        });
      }
    },

    addTask(input: NewTaskInput): void {
      const title = input.title.trim();
      if (!title || input.estimated_time <= 0) return;

      const ts = now();
      const task: Task = {
        id: randomId(),
        title,
        priority: input.priority,
        energy: input.energy,
        estimated_time: input.estimated_time,
        tags: input.tags,
        status: 'todo',
        created_at: ts,
        updated_at: ts,
        ...(input.deadline != null ? { deadline: input.deadline } : {}),
      };

      update((s) => {
        const next: TaskStoreState = {
          ...s,
          tasks: [...s.tasks, task],
        };
        persist(next);
        return next;
      });
    },

    deleteTask(id: string): void {
      update((s) => {
        let activeTaskId = s.activeTaskId;
        if (activeTaskId === id) activeTaskId = null;
        const next: TaskStoreState = {
          activeTaskId,
          tasks: s.tasks.filter((t) => t.id !== id),
        };
        persist(next);
        return next;
      });
    },

    startTask(id: string): void {
      update((s) => {
        const target = s.tasks.find((t) => t.id === id);
        if (!target || target.status === 'done') return s;

        const t0 = now();
        const tasks = s.tasks.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: 'doing' as const,
              started_at: t0,
              updated_at: t0,
            };
          }
          if (s.activeTaskId && t.id === s.activeTaskId && t.id !== id) {
            return {
              ...t,
              status: 'todo' as const,
              started_at: undefined,
              updated_at: t0,
            };
          }
          return t;
        });

        const next: TaskStoreState = { tasks, activeTaskId: id };
        persist(next);
        return next;
      });
    },

    /**
     * Pause the active timer: subtracts elapsed time from `estimated_time`, clears `started_at`.
     * Task stays `doing` and active — resumed via `startTask` (same id).
     */
    pauseTask(): void {
      update((s) => {
        if (!s.activeTaskId) return s;
        const id = s.activeTaskId;
        const t0 = now();
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t;
          if (t.status !== 'doing' || t.started_at == null) return t;
          const elapsedMs = t0 - t.started_at;
          const elapsedMin = Math.floor(elapsedMs / 60000);
          const remaining = Math.max(0, t.estimated_time - elapsedMin);
          return {
            ...t,
            estimated_time: remaining,
            started_at: undefined,
            updated_at: t0,
          };
        });
        const next: TaskStoreState = { tasks, activeTaskId: id };
        persist(next);
        return next;
      });
    },

    /** Set remaining minutes for the active `doing` task (e.g. while paused or to correct the budget). */
    setActiveRemainingMinutes(minutes: number): void {
      const m = Math.round(Number(minutes));
      if (!Number.isFinite(m) || m < 0) return;
      update((s) => {
        if (!s.activeTaskId) return s;
        const id = s.activeTaskId;
        const t0 = now();
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t;
          if (t.status !== 'doing') return t;
          return { ...t, estimated_time: m, updated_at: t0 };
        });
        const next: TaskStoreState = { ...s, tasks };
        persist(next);
        return next;
      });
    },

    stopTask(): void {
      update((s) => {
        if (!s.activeTaskId) return s;
        const id = s.activeTaskId;
        const t0 = now();
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status: 'todo' as const,
            started_at: undefined,
            updated_at: t0,
          };
        });
        const next: TaskStoreState = { tasks, activeTaskId: null };
        persist(next);
        return next;
      });
    },

    completeTask(id: string): void {
      update((s) => {
        const t0 = now();
        let activeTaskId = s.activeTaskId;
        if (activeTaskId === id) activeTaskId = null;

        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status: 'done' as const,
            completed_at: t0,
            started_at: undefined,
            updated_at: t0,
          };
        });

        const next: TaskStoreState = { tasks, activeTaskId };
        persist(next);
        return next;
      });
    },
  };
}

/** Holds `{ tasks, activeTaskId }` — use `$taskStore` in components. */
export const taskStore = createTasksStore();
