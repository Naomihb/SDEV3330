-- SprintSim full schema — runs via `supabase db reset`
create extension if not exists "uuid-ossp";

-- profiles (extends auth.users)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'student' check (role in ('student','instructor')),
  created_at timestamptz default now()
);

-- courses
create table if not exists public.courses (
  id            uuid primary key default uuid_generate_v4(),
  code          text not null,
  name          text not null,
  semester      text not null,
  instructor_id uuid references public.profiles(id) on delete set null,
  created_at    timestamptz default now()
);

-- weeks
create table if not exists public.weeks (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  week_number  int not null,
  topic        text not null,
  description  text,
  due_date     date,
  is_active    boolean default false,
  prior_topics text[] default '{}',
  created_at   timestamptz default now(),
  unique(course_id, week_number)
);

-- enrollments
create table if not exists public.enrollments (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);

-- team_assignments
create table if not exists public.team_assignments (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references public.profiles(id) on delete cascade,
  course_id           uuid not null references public.courses(id) on delete cascade,
  project_name        text not null,
  project_description text not null,
  team_config         jsonb not null,
  created_at          timestamptz default now(),
  unique(student_id, course_id)
);

-- sprint_tickets
create table if not exists public.sprint_tickets (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  sprint_number int not null default 1,
  ticket_id     text not null,
  title         text not null,
  status        text not null default 'todo' check (status in ('todo','in_progress','done')),
  assignee_name text,
  story_points  int default 1,
  is_blocked    boolean default false,
  created_at    timestamptz default now()
);

-- scenarios
create table if not exists public.scenarios (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  week_id      uuid not null references public.weeks(id) on delete cascade,
  content      text not null,
  generated_at timestamptz default now(),
  unique(student_id, week_id)
);

-- submissions
create table if not exists public.submissions (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  week_id       uuid not null references public.weeks(id) on delete cascade,
  scenario_id   uuid references public.scenarios(id),
  response_text text not null,
  submitted_at  timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(student_id, week_id)
);

-- feedback
create table if not exists public.feedback (
  id            uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id),
  grade         text not null check (grade in ('S','U','E','I')),
  feedback_text text,
  submitted_at  timestamptz default now(),
  unique(submission_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.courses          enable row level security;
alter table public.weeks            enable row level security;
alter table public.enrollments      enable row level security;
alter table public.team_assignments enable row level security;
alter table public.sprint_tickets   enable row level security;
alter table public.scenarios        enable row level security;
alter table public.submissions      enable row level security;
alter table public.feedback         enable row level security;

create policy "own profile select"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update"   on public.profiles for update using (auth.uid() = id);
create policy "instructor see all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

create policy "courses public select" on public.courses for select using (true);
create policy "instructor manage courses" on public.courses for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

create policy "weeks public select" on public.weeks for select using (true);
create policy "instructor manage weeks" on public.weeks for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

create policy "own enrollment"         on public.enrollments for select using (auth.uid() = student_id);
create policy "own team"               on public.team_assignments for select using (auth.uid() = student_id);
create policy "manage own tickets"     on public.sprint_tickets for all using (auth.uid() = student_id);
create policy "own scenarios"          on public.scenarios for select using (auth.uid() = student_id);
create policy "manage own submissions" on public.submissions for all using (auth.uid() = student_id);

create policy "instructor see enrollments"
  on public.enrollments for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "instructor see teams"
  on public.team_assignments for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "instructor see tickets"
  on public.sprint_tickets for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "instructor see scenarios"
  on public.scenarios for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "instructor see submissions"
  on public.submissions for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "instructor manage feedback"
  on public.feedback for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "student see own feedback"
  on public.feedback for select
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.student_id = auth.uid()));

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
