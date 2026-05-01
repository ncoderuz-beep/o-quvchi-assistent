
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Attendance status enum
create type public.attendance_status as enum ('present','absent','late','excused');

-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table public.groups enable row level security;
create policy "own groups all" on public.groups for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- Students
create table public.students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);
alter table public.students enable row level security;
create policy "own students all" on public.students for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index on public.students(group_id);

-- Attendance
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default current_date,
  status public.attendance_status not null,
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
alter table public.attendance enable row level security;
create policy "own attendance all" on public.attendance for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index on public.attendance(student_id, date);

-- Score events (mukofot va jarimalar)
create table public.score_events (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.score_events enable row level security;
create policy "own score_events all" on public.score_events for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create index on public.score_events(student_id);
