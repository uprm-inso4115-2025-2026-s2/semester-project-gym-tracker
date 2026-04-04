-- Allow authenticated users to insert new exercises.
-- Previously only SELECT was permitted, which silently blocked adding custom exercises.
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'exercises' and policyname = 'Authenticated users can insert exercises') then
    create policy "Authenticated users can insert exercises"
      on public.exercises for insert
      to authenticated with check (true);
  end if;
end $$;
