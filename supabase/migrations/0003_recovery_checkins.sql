-- Recovery Check-In table — mirrors database/migrations/004_recovery_checkins.ts.
-- PREPARED BUT UNWIRED: the app runs on Zustand + AsyncStorage today (see
-- stores/recoveryStore.ts). Run this migration when the local-first backend
-- is reconnected.

create table if not exists public.recovery_checkins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  date           date not null,
  status         text not null,               -- success | urge | relapse
  relapse_count  integer not null default 0,
  urge_level     integer,                      -- 1..5
  trigger        text,
  created_at     timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.recovery_checkins enable row level security;

drop policy if exists "own_rows" on public.recovery_checkins;
create policy "own_rows" on public.recovery_checkins
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
