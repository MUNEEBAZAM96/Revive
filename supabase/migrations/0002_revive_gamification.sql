-- Revive 2.0 gamification schema — mirrors database/migrations/003_revive_gamification.ts.
-- PREPARED BUT UNWIRED: the app runs on Zustand + AsyncStorage today (see
-- stores/growthStore.ts). Run this migration when the local-first backend is
-- reconnected; RLS follows the same "own_rows" pattern as 0001_init.sql.

create table if not exists public.growth (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  revive_score             integer not null default 0,
  lifetime_score           integer not null default 0,
  diamonds                 integer not null default 0,
  level                    integer not null default 1,
  level_title              text not null default 'beginning',
  tree_stage               text not null default 'stage_1_seed',
  current_streak           integer not null default 0,
  longest_streak           integer not null default 0,
  last_active_date         date,
  lifetime_games_completed integer not null default 0,
  checkins_count           integer not null default 0,
  community_interactions_count integer not null default 0,
  equipped_garden_theme    text not null default 'garden_default',
  equipped_profile_frame   text not null default 'frame_none',
  equipped_app_theme       text not null default 'theme_default',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.games (
  id                     text primary key,
  title                  text not null,
  category               text not null,
  base_reward            integer not null,
  base_duration_minutes  integer not null
);

create table if not exists public.game_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  game_type     text not null,
  difficulty    text not null,
  score         integer not null,
  reward        integer not null,
  duration_sec  integer not null,
  completed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.daily_missions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  date          date not null,
  mission_id    text not null,
  completed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, date, mission_id)
);

create table if not exists public.achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  achievement_id  text not null,
  unlocked_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create table if not exists public.calendar (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  date                date not null,
  games_completed     integer not null default 0,
  missions_completed  integer not null default 0,
  checked_in          boolean not null default false,
  breathing_done      boolean not null default false,
  day_status          text not null default 'growth',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.journey (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  event_type   text not null,
  label        text not null,
  metadata     jsonb default '{}'::jsonb,
  event_date   date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at triggers (reuses set_updated_at from 0001_init.sql) -------------
do $$
declare t text;
begin
  foreach t in array array[
    'growth','game_history','daily_missions','achievements','calendar','journey'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Row Level Security ----------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'growth','game_history','daily_missions','achievements','calendar','journey'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own_rows" on public.%I', t);
    execute format(
      'create policy "own_rows" on public.%I
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)',
      t);
  end loop;
end $$;

-- `games` is shared reference data — publicly readable, not user-owned.
alter table public.games enable row level security;
drop policy if exists "public_read" on public.games;
create policy "public_read" on public.games for select using (true);
