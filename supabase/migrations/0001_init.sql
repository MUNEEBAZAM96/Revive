-- Revive — cloud schema mirroring the local SQLite database.
-- Every table is protected by Row Level Security so a user can only ever
-- read/write their own rows. Column names match SQLite exactly so the
-- SyncManager can move rows 1:1 (JSON columns are jsonb here).

create extension if not exists pgcrypto;

-- Auto-maintain updated_at on write (conflict resolution depends on it).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. profiles (id = auth user id) -------------------------------------------
create table if not exists public.profiles (
  id                       uuid primary key references auth.users (id) on delete cascade,
  supabase_id              uuid,
  display_name             text,
  age_range                text,
  primary_goal             text,
  goals                    jsonb default '[]'::jsonb,
  triggers                 jsonb default '[]'::jsonb,
  life_impacts             jsonb default '[]'::jsonb,
  support_preferences      jsonb default '[]'::jsonb,
  daily_commitment_minutes integer,
  recovery_start_date      date,
  longest_streak           integer not null default 0,
  current_stage            text,
  notification_enabled     boolean not null default true,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- 2. daily_checkins ----------------------------------------------------------
create table if not exists public.daily_checkins (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  date                date not null,
  mood                text,
  urge_level          integer,
  triggers            jsonb default '[]'::jsonb,
  reflection_note     text,
  completed_exercises jsonb default '[]'::jsonb,
  day_status          text not null default 'growth',
  weathered_storm     boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, date)
);

-- 3. journal_entries (sensitive; soft-deleted) -------------------------------
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text,
  content     text not null,
  emotion     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- 4. recovery_events ---------------------------------------------------------
create table if not exists public.recovery_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  event_type  text not null,
  metadata    jsonb default '{}'::jsonb,
  event_date  date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 5. user_triggers -----------------------------------------------------------
create table if not exists public.user_triggers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  trigger_type  text not null,
  frequency     integer not null default 0,
  last_occurred timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 6. coach_memory (summaries only) ------------------------------------------
create table if not exists public.coach_memory (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  summary            text not null,
  important_patterns jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- updated_at triggers --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','daily_checkins','journal_entries',
    'recovery_events','user_triggers','coach_memory'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Row Level Security: users can only access their own rows -------------------
do $$
declare t text;
declare owner_col text;
begin
  foreach t in array array[
    'profiles','daily_checkins','journal_entries',
    'recovery_events','user_triggers','coach_memory'
  ] loop
    -- profiles is keyed by id; every other table by user_id.
    owner_col := case when t = 'profiles' then 'id' else 'user_id' end;
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own_rows" on public.%I', t);
    execute format(
      'create policy "own_rows" on public.%I
         for all
         using (auth.uid() = %I)
         with check (auth.uid() = %I)',
      t, owner_col, owner_col);
  end loop;
end $$;
