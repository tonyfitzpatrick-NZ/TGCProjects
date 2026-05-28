-- ============================================================
-- PROJECT PORTAL — SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  company text,
  role text not null default 'consultant', -- 'admin' | 'project_lead' | 'consultant'
  avatar_initials text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read all profiles" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'consultant');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- PROJECTS
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  code text not null,
  name text not null,
  description text,
  stage text not null default 'Concept',
  progress integer default 0 check (progress >= 0 and progress <= 100),
  address text,
  client_name text,
  onedrive_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.projects enable row level security;

-- PROJECT MEMBERS (controls who sees which projects)
create table public.project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'consultant', -- 'lead' | 'consultant'
  deadline date,
  consultant_type text, -- e.g. 'Structural Engineer', 'Fire Designer'
  deadline_status text default 'ok', -- 'ok' | 'soon' | 'overdue'
  created_at timestamptz default now(),
  unique(project_id, user_id)
);
alter table public.project_members enable row level security;

-- RLS: users see projects they are members of; admins see all
create policy "Members can view their projects" on public.projects for select
  using (
    auth.uid() in (select user_id from public.project_members where project_id = id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins can insert projects" on public.projects for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins and leads can update projects" on public.projects for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or auth.uid() in (select user_id from public.project_members where project_id = id and role = 'lead')
  );

create policy "Members can view project members" on public.project_members for select
  using (
    auth.uid() in (select user_id from public.project_members pm2 where pm2.project_id = project_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Admins and leads can manage members" on public.project_members for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or auth.uid() in (select user_id from public.project_members where project_id = project_id and role = 'lead')
  );
create policy "Admins and leads can update members" on public.project_members for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or auth.uid() in (select user_id from public.project_members where project_id = project_id and role = 'lead')
  );
create policy "Admins and leads can delete members" on public.project_members for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or auth.uid() in (select user_id from public.project_members where project_id = project_id and role = 'lead')
  );

-- FILES
create table public.project_files (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  file_type text, -- 'pdf' | 'dwg' | 'ifc' | 'xlsx' | 'link' etc
  category text default 'General', -- 'Project Brief' | 'Drawings' | 'Consultant Docs' | 'General'
  storage_path text, -- Supabase storage path (for uploads)
  onedrive_url text,  -- OneDrive direct link
  file_size bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.project_files enable row level security;
create policy "Project members can view files" on public.project_files for select
  using (
    auth.uid() in (select user_id from public.project_members where project_id = project_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Project members can insert files" on public.project_files for insert
  with check (
    auth.uid() in (select user_id from public.project_members where project_id = project_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Uploaders and admins can delete files" on public.project_files for delete
  using (uploaded_by = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- MESSAGES
create table public.project_messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz default now()
);
alter table public.project_messages enable row level security;
create policy "Project members can view messages" on public.project_messages for select
  using (
    auth.uid() in (select user_id from public.project_members where project_id = project_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Project members can send messages" on public.project_messages for insert
  with check (
    auth.uid() in (select user_id from public.project_members where project_id = project_id)
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- STORAGE BUCKET for uploaded files
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false);
create policy "Project members can upload" on storage.objects for insert
  with check (bucket_id = 'project-files' and auth.role() = 'authenticated');
create policy "Project members can download" on storage.objects for select
  using (bucket_id = 'project-files' and auth.role() = 'authenticated');
create policy "Uploaders can delete" on storage.objects for delete
  using (bucket_id = 'project-files' and auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for messages
alter publication supabase_realtime add table public.project_messages;
alter publication supabase_realtime add table public.project_files;
