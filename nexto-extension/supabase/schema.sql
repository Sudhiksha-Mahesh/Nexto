-- Nexto tables + RLS. Apply via:
--   npm run db:apply   (needs DATABASE_URL in .env), or
--   Supabase Dashboard → SQL Editor → paste & run.
--
-- Auth → Providers → Anonymous sign-ins must be enabled for the extension.

create table if not exists public.nexto_tasks (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  title text not null,
  priority text not null check (priority in ('low', 'medium', 'high')),
  energy text not null check (energy in ('low', 'medium', 'high')),
  estimated_time integer not null,
  tags jsonb not null default '[]'::jsonb,
  status text not null check (status in ('todo', 'doing', 'done')),
  created_at bigint not null,
  deadline bigint,
  started_at bigint,
  completed_at bigint,
  updated_at bigint not null,
  primary key (user_id, id)
);

create table if not exists public.nexto_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_task_id text,
  updated_at bigint not null
);

alter table public.nexto_tasks enable row level security;
alter table public.nexto_state enable row level security;

drop policy if exists "nexto_tasks_own" on public.nexto_tasks;
create policy "nexto_tasks_own"
  on public.nexto_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "nexto_state_own" on public.nexto_state;
create policy "nexto_state_own"
  on public.nexto_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
