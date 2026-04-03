-- NOTE: Tables were created manually in Supabase dashboard before CLI was set up.
-- This file reflects the actual schema in production (marked as applied).
-- Column names differ from an earlier draft: workout_sessions PK is workout_id (not id),
-- workout_exercises PK is record_id (not id).

-- workout_sessions
create table if not exists public.workout_sessions (
  workout_id       uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  workout_type     text not null,
  duration_minutes integer,
  calories_burned  integer,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

-- exercises (lookup table)
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  muscle_group text,
  created_at   timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "Exercises are readable by all authenticated users"
  on public.exercises for select
  to authenticated using (true);

-- workout_exercises (join table)
create table if not exists public.workout_exercises (
  record_id   uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references public.workout_sessions(workout_id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sets        integer,
  reps        integer,
  weight      numeric(6,2),
  created_at  timestamptz not null default now()
);

alter table public.workout_exercises enable row level security;

-- goals_feedback
create table if not exists public.goals_feedback (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null,
  title          text not null,
  description    text,
  target_value   smallint not null,
  recorded_value smallint not null,
  status         text not null,
  period_date    date not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.goals_feedback enable row level security;
