-- Выполнить в Supabase Dashboard → SQL Editor → New query

-- ==================== progress ====================

create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  station_id text not null,
  checklist_done jsonb not null default '{}'::jsonb,
  ordering_best_score real,
  last_practiced_at bigint,
  updated_at timestamptz not null default now(),
  primary key (user_id, station_id)
);

create index if not exists progress_user_id_idx on public.progress (user_id);

alter table public.progress enable row level security;

drop policy if exists "select own progress" on public.progress;
drop policy if exists "insert own progress" on public.progress;
drop policy if exists "update own progress" on public.progress;
drop policy if exists "delete own progress" on public.progress;

create policy "select own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own progress"
  on public.progress for delete
  using (auth.uid() = user_id);

-- ==================== exam_attempts ====================

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  format integer not null check (format in (10, 20, 40)),
  total_items integer not null check (total_items > 0),
  answered_items integer not null check (answered_items >= 0),
  score_ratio real not null check (score_ratio >= 0 and score_ratio <= 1),
  completed boolean not null default false,
  started_at timestamptz not null,
  finished_at timestamptz not null default now()
);

create index if not exists exam_attempts_user_id_idx on public.exam_attempts (user_id);
create index if not exists exam_attempts_finished_at_idx on public.exam_attempts (finished_at desc);

alter table public.exam_attempts enable row level security;

drop policy if exists "select own attempts" on public.exam_attempts;
drop policy if exists "insert own attempts" on public.exam_attempts;
drop policy if exists "delete own attempts" on public.exam_attempts;

create policy "select own attempts"
  on public.exam_attempts for select
  using (auth.uid() = user_id);

create policy "insert own attempts"
  on public.exam_attempts for insert
  with check (auth.uid() = user_id);

-- попытки не редактируются задним числом — только insert/select/delete
create policy "delete own attempts"
  on public.exam_attempts for delete
  using (auth.uid() = user_id);

-- Важно: updated_at НЕ выставляется триггером на сервере намеренно —
-- клиент (src/lib/sync.ts) явно передаёт свою метку времени изменения
-- при upsert, и именно она используется для разрешения конфликтов
-- last-write-wins между устройствами. Серверный now() тут был бы
-- неверным (перезаписывал бы реальное время правки на время получения
-- запроса сервером, что ломает сравнение при офлайн-правках).

-- ==================== misc_state (streak, XP, мастерство блоков, рекорды времени) ====================
-- Один JSONB-блоб на пользователя вместо отдельных таблиц под каждый
-- вид локальных данных — эти данные не требуют реляционных запросов
-- (никогда не фильтруются на сервере), только "забрать всё"/"положить
-- всё", так что схема нарочно упрощена.

create table if not exists public.misc_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak jsonb not null default '{}'::jsonb,
  xp jsonb not null default '{}'::jsonb,
  mastery jsonb not null default '[]'::jsonb,
  best_times jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.misc_state enable row level security;

drop policy if exists "select own misc_state" on public.misc_state;
drop policy if exists "insert own misc_state" on public.misc_state;
drop policy if exists "update own misc_state" on public.misc_state;

create policy "select own misc_state"
  on public.misc_state for select
  using (auth.uid() = user_id);

create policy "insert own misc_state"
  on public.misc_state for insert
  with check (auth.uid() = user_id);

create policy "update own misc_state"
  on public.misc_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
