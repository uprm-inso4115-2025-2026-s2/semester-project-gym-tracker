create table public.goals_feedback (                                          
    id uuid primary key default gen_random_uuid(),                              
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null,                                                         
    title text not null,                                                        
    description text,
    target_value smallint not null,                                             
    recorded_value smallint not null,
    status text not null,
    period_date date not null,                                                  
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()                               
  );              
                                                                                
  alter table public.goals_feedback enable row level security;

  create policy "Enable users to view their own data only"
    on public.goals_feedback
    for select                                                                  
    to authenticated
    using (auth.uid() = user_id);      
-- Migration file was manually done since supabase tables were directly created in the database,
-- this is to ensure that the schema is properly tracked and can be recreated if needed.