import { writable } from 'svelte/store';
import type { NewTaskInput, Task } from '../types/task';
import { loadTaskState, saveTaskState } from '../lib/storage';

function randomId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export type TaskStoreState = {
  tasks: Task[];
  activeTaskId: string | null;
};

const initialState: TaskStoreState = {
  tasks: [],
  activeTaskId: null,
};

function persist(state: TaskStoreState): void {
  void saveTaskState(state.tasks, state.activeTaskId);
}

function createTasksStore() {
  const { subscribe, set, update } = writable<TaskStoreState>(initialState);

  return {
    subscribe,
    async hydrate(): Promise<void> {
      const loaded = await loadTaskState();
      set({ tasks: loaded.tasks, activeTaskId: loaded.activeTaskId });
    },

    addTask(input: NewTaskInput): void {
      const title = input.title.trim();
      if (!title || input.estimated_time <= 0) return;

      const task: Task = {
        id: randomId(),
        title,
        priority: input.priority,
        energy: input.energy,
        estimated_time: input.estimated_time,
        tags: input.tags,
        status: 'todo',
        created_at: Date.now(),
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

        const now = Date.now();
        const tasks = s.tasks.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: 'doing' as const,
              started_at: now,
            };
          }
          if (s.activeTaskId && t.id === s.activeTaskId && t.id !== id) {
            return {
              ...t,
              status: 'todo' as const,
              started_at: undefined,
            };
          }
          return t;
        });

        const next: TaskStoreState = { tasks, activeTaskId: id };
        persist(next);
        return next;
      });
    },

    stopTask(): void {
      update((s) => {
        if (!s.activeTaskId) return s;
        const id = s.activeTaskId;
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status: 'todo' as const,
            started_at: undefined,
          };
        });
        const next: TaskStoreState = { tasks, activeTaskId: null };
        persist(next);
        return next;
      });
    },

    completeTask(id: string): void {
      update((s) => {
        const now = Date.now();
        let activeTaskId = s.activeTaskId;
        if (activeTaskId === id) activeTaskId = null;

        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status: 'done' as const,
            completed_at: now,
            started_at: undefined,
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
