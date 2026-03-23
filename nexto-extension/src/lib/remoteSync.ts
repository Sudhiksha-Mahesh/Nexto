import type { Task } from '../types/task';
import type { LocalTaskBundle } from './storage';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { syncStatus } from './syncStatus';

function asInt(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

function rowToTask(row: Record<string, unknown>): Task | null {
  const id = typeof row.id === 'string' ? row.id : null;
  const title = typeof row.title === 'string' ? row.title : null;
  const priority = row.priority;
  const energy = row.energy;
  const status = row.status;
  if (!id || !title) return null;
  if (priority !== 'low' && priority !== 'medium' && priority !== 'high') return null;
  if (energy !== 'low' && energy !== 'medium' && energy !== 'high') return null;
  if (status !== 'todo' && status !== 'doing' && status !== 'done') return null;

  const est = asInt(row.estimated_time);
  const created_at = asInt(row.created_at);
  const updated_at = asInt(row.updated_at);
  if (est == null || created_at == null || updated_at == null) return null;

  const tags = Array.isArray(row.tags)
    ? row.tags.filter((t): t is string => typeof t === 'string')
    : [];

  const task: Task = {
    id,
    title,
    priority,
    energy,
    estimated_time: est,
    tags,
    status,
    created_at,
    updated_at,
  };
  const deadline = asInt(row.deadline);
  if (deadline != null) task.deadline = deadline;
  const started_at = asInt(row.started_at);
  if (started_at != null) task.started_at = started_at;
  const completed_at = asInt(row.completed_at);
  if (completed_at != null) task.completed_at = completed_at;
  return task;
}

export type EnsureUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Anonymous auth must be ON: Supabase Dashboard → Authentication → Providers → Anonymous.
 */
export async function ensureSupabaseUser(): Promise<EnsureUserResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: 'Supabase client not configured (check VITE_* in .env and rebuild).' };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.id) return { ok: true, userId: session.user.id };

  const signInAnon = supabase.auth.signInAnonymously?.bind(supabase.auth);
  if (typeof signInAnon !== 'function') {
    return {
      ok: false,
      error: 'This Supabase JS version has no signInAnonymously(). Run npm update @supabase/supabase-js.',
    };
  }

  const { data, error } = await signInAnon();
  if (error) {
    console.warn('[Nexto] Anonymous sign-in:', error.message, error);
    return {
      ok: false,
      error: `${error.message} — turn on Authentication → Providers → Anonymous in Supabase, then reload the extension.`,
    };
  }

  const userId = data.session?.user?.id ?? data.user?.id;
  if (!userId) {
    return { ok: false, error: 'Anonymous sign-in succeeded but returned no user id. Try reloading the popup.' };
  }

  return { ok: true, userId };
}

export function mergeBundles(local: LocalTaskBundle, remote: LocalTaskBundle): LocalTaskBundle {
  const map = new Map<string, Task>();

  for (const t of remote.tasks) {
    map.set(t.id, t);
  }
  for (const t of local.tasks) {
    const prev = map.get(t.id);
    if (!prev || t.updated_at > prev.updated_at) {
      map.set(t.id, t);
    }
  }

  const tasks = [...map.values()];
  const ids = new Set(tasks.map((t) => t.id));

  const useLocalActive =
    local.stateUpdatedAt >= remote.stateUpdatedAt ? local.activeTaskId : remote.activeTaskId;
  let activeTaskId = useLocalActive;
  if (activeTaskId && !ids.has(activeTaskId)) activeTaskId = null;

  return {
    tasks,
    activeTaskId,
    stateUpdatedAt: Math.max(local.stateUpdatedAt, remote.stateUpdatedAt),
  };
}

export async function pullRemoteBundle(userId: string): Promise<LocalTaskBundle | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const tasksRes = await supabase.from('nexto_tasks').select('*').eq('user_id', userId);

  if (tasksRes.error) {
    console.warn('[Nexto] pull tasks', tasksRes.error.message);
    return null;
  }

  const tasks: Task[] = [];
  for (const row of tasksRes.data ?? []) {
    const t = rowToTask(row as Record<string, unknown>);
    if (t) tasks.push(t);
  }

  const stateRes = await supabase.from('nexto_state').select('*').eq('user_id', userId).maybeSingle();

  if (stateRes.error && stateRes.error.code !== 'PGRST116') {
    console.warn('[Nexto] pull state', stateRes.error.message);
  }

  const stateRow = stateRes.data as Record<string, unknown> | null;

  const activeRaw = stateRow?.active_task_id;
  const activeTaskId =
    typeof activeRaw === 'string' && activeRaw.length > 0 ? activeRaw : null;
  const stateUp = asInt(stateRow?.updated_at);
  const stateUpdatedAt = stateUp ?? 0;

  return { tasks, activeTaskId, stateUpdatedAt };
}

export async function pushFullSnapshot(userId: string, bundle: LocalTaskBundle): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const localIds = new Set(bundle.tasks.map((t) => t.id));

  const { data: existingRows, error: listErr } = await supabase
    .from('nexto_tasks')
    .select('id')
    .eq('user_id', userId);

  if (listErr) {
    console.warn('[Nexto] list remote tasks', listErr.message);
    syncStatus.set({ state: 'error', message: listErr.message });
    return false;
  }

  const toDelete = (existingRows ?? [])
    .map((r) => r.id as string)
    .filter((id) => !localIds.has(id));

  if (toDelete.length > 0) {
    const { error: delErr } = await supabase
      .from('nexto_tasks')
      .delete()
      .eq('user_id', userId)
      .in('id', toDelete);
    if (delErr) {
      console.warn('[Nexto] delete stale tasks', delErr.message);
      syncStatus.set({ state: 'error', message: delErr.message });
      return false;
    }
  }

  const rows = bundle.tasks.map((t) => ({
    user_id: userId,
    id: t.id,
    title: t.title,
    priority: t.priority,
    energy: t.energy,
    estimated_time: t.estimated_time,
    tags: t.tags,
    status: t.status,
    created_at: t.created_at,
    deadline: t.deadline ?? null,
    started_at: t.started_at ?? null,
    completed_at: t.completed_at ?? null,
    updated_at: t.updated_at,
  }));

  if (rows.length > 0) {
    const { error: upErr } = await supabase.from('nexto_tasks').upsert(rows, {
      onConflict: 'user_id,id',
    });
    if (upErr) {
      console.warn('[Nexto] upsert tasks', upErr.message);
      syncStatus.set({ state: 'error', message: upErr.message });
      return false;
    }
  }

  const { error: stErr } = await supabase.from('nexto_state').upsert(
    {
      user_id: userId,
      active_task_id: bundle.activeTaskId,
      updated_at: bundle.stateUpdatedAt,
    },
    { onConflict: 'user_id' },
  );

  if (stErr) {
    console.warn('[Nexto] upsert state', stErr.message);
    syncStatus.set({ state: 'error', message: stErr.message });
    return false;
  }

  syncStatus.set({ state: 'synced', at: Date.now() });
  return true;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Push immediately (clears pending debounced push). */
export async function flushRemotePush(bundle: LocalTaskBundle): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  const auth = await ensureSupabaseUser();
  if (!auth.ok) {
    syncStatus.set({ state: 'error', message: auth.error });
    return false;
  }
  syncStatus.set({ state: 'syncing' });
  return pushFullSnapshot(auth.userId, bundle);
}

export function schedulePushToSupabase(bundle: LocalTaskBundle, delayMs = 600): void {
  if (!isSupabaseConfigured()) return;

  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void flushRemotePush(bundle);
  }, delayMs);
}

export async function syncFromSupabase(local: LocalTaskBundle): Promise<LocalTaskBundle> {
  if (!isSupabaseConfigured()) {
    syncStatus.set({ state: 'local' });
    return local;
  }

  syncStatus.set({ state: 'syncing' });
  const auth = await ensureSupabaseUser();
  if (!auth.ok) {
    syncStatus.set({ state: 'error', message: auth.error });
    return local;
  }

  const remote = await pullRemoteBundle(auth.userId);
  if (!remote) {
    syncStatus.set({ state: 'error', message: 'Could not load tasks from Supabase.' });
    return local;
  }

  const merged = mergeBundles(local, remote);
  await pushFullSnapshot(auth.userId, merged);
  return merged;
}
