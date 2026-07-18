-- Выполнить в Supabase Dashboard → SQL Editor → New query

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id text not null,
  checklist_done jsonb not null default '{}'::jsonb,
  ordering_best_score real,
  last_practiced_at bigint,
  updated_at timestamptz not null default now(),
  primary key (user_id, station_id)
);

alter table public.progress enable row level security;

-- Пользователь видит и меняет только свои строки
create policy "select own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.progress for update
  using (auth.uid() = user_id);
