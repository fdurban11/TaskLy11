-- ============================================================
-- TaskLy - Run this SQL in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/lwewxnlsakgbtjhajbnf/sql/new
-- ============================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'Pending',
  priority text not null default 'Medium',
  assigned_date timestamptz,
  due_date timestamptz,
  due_time text,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.tasks enable row level security;

-- Policy: users can only see and manage their own tasks
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tasks'
    and policyname = 'Users can manage their own tasks'
  ) then
    execute $policy$
      create policy "Users can manage their own tasks"
        on public.tasks
        for all
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id)
    $policy$;
  end if;
end;
$$;
