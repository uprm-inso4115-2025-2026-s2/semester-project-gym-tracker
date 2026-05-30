-- RLS policies for all app tables.
-- Idempotent: each policy is only created if it doesn't already exist.

alter table public.workout_sessions enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.goals_feedback enable row level security;

-- workout_sessions
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workout_sessions' and policyname = 'Users can select own workout_sessions') then
    create policy "Users can select own workout_sessions"
      on public.workout_sessions for select
      to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workout_sessions' and policyname = 'Users can insert own workout_sessions') then
    create policy "Users can insert own workout_sessions"
      on public.workout_sessions for insert
      to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workout_sessions' and policyname = 'Users can update own workout_sessions') then
    create policy "Users can update own workout_sessions"
      on public.workout_sessions for update
      to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workout_sessions' and policyname = 'Users can delete own workout_sessions') then
    create policy "Users can delete own workout_sessions"
      on public.workout_sessions for delete
      to authenticated using (auth.uid() = user_id);
  end if;
end $$;

-- exercises (read-only for all authenticated users)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'exercises' and policyname = 'Exercises are readable by all authenticated users') then
    create policy "Exercises are readable by all authenticated users"
      on public.exercises for select
      to authenticated using (true);
  end if;
end $$;

-- workout_exercises (scoped through workout_sessions ownership)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workout_exercises' and policyname = 'Users can select own workout_exercises') then
    create policy "Users can select own workout_exercises"
      on public.workout_exercises for select
      to authenticated using (
        exists (
          select 1 from public.workout_sessions
          where public.workout_sessions.workout_id = workout_exercises.workout_id
          and public.workout_sessions.user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'workout_exercises' and policyname = 'Users can insert own workout_exercises') then
    create policy "Users can insert own workout_exercises"
      on public.workout_exercises for insert
      to authenticated with check (
        exists (
          select 1 from public.workout_sessions
          where public.workout_sessions.workout_id = workout_exercises.workout_id
          and public.workout_sessions.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- goals_feedback
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'goals_feedback' and policyname = 'Enable users to view their own data only') then
    create policy "Enable users to view their own data only"
      on public.goals_feedback for select
      to authenticated using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'goals_feedback' and policyname = 'Users can insert own goals_feedback') then
    create policy "Users can insert own goals_feedback"
      on public.goals_feedback for insert
      to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

-- Storage: avatars bucket
-- Run these separately if storage.objects policies are not yet set.
-- (Cannot be wrapped in do $$ blocks due to storage schema restrictions.)
--
-- create policy "Users can upload own avatar"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- create policy "Users can update own avatar"
--   on storage.objects for update to authenticated
--   using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
--
-- create policy "Avatars are publicly readable"
--   on storage.objects for select to public
--   using (bucket_id = 'avatars');
