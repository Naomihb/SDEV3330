-- ============================================================
-- SprintSim Full Database Setup
-- Paste into Supabase SQL Editor and Run
-- Sign up at /login with naomihbeltrand@gmail.com FIRST
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','instructor')),
  created_at timestamptz default now()
);

create table if not exists public.courses (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  name text not null,
  semester text not null,
  instructor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.weeks (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_number int not null,
  topic text not null,
  description text,
  due_date date,
  is_active boolean default false,
  prior_topics text[] default '{}',
  created_at timestamptz default now(),
  unique(course_id, week_number)
);

create table if not exists public.enrollments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);

create table if not exists public.team_assignments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  project_name text not null,
  project_description text not null,
  team_config jsonb not null,
  created_at timestamptz default now(),
  unique(student_id, course_id)
);

create table if not exists public.sprint_tickets (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  sprint_number int not null default 1,
  ticket_id text not null,
  title text not null,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  assignee_name text,
  story_points int default 1,
  is_blocked boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.scenarios (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  week_id uuid not null references public.weeks(id) on delete cascade,
  content text not null,
  generated_at timestamptz default now(),
  unique(student_id, week_id)
);

create table if not exists public.submissions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  week_id uuid not null references public.weeks(id) on delete cascade,
  scenario_id uuid references public.scenarios(id),
  response_text text not null,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, week_id)
);

create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  instructor_id uuid not null references public.profiles(id),
  grade text not null check (grade in ('S','U','E','I')),
  feedback_text text,
  submitted_at timestamptz default now(),
  unique(submission_id)
);

-- RLS
alter table public.profiles         enable row level security;
alter table public.courses          enable row level security;
alter table public.weeks            enable row level security;
alter table public.enrollments      enable row level security;
alter table public.team_assignments enable row level security;
alter table public.sprint_tickets   enable row level security;
alter table public.scenarios        enable row level security;
alter table public.submissions      enable row level security;
alter table public.feedback         enable row level security;

-- Policies
drop policy if exists "own profile select"          on public.profiles;
drop policy if exists "own profile update"          on public.profiles;
drop policy if exists "instructor see all profiles" on public.profiles;
create policy "own profile select"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update"   on public.profiles for update using (auth.uid() = id);
create policy "instructor see all profiles" on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "courses public select"    on public.courses;
drop policy if exists "instructor manage courses" on public.courses;
create policy "courses public select" on public.courses for select using (true);
create policy "instructor manage courses" on public.courses for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "weeks public select"    on public.weeks;
drop policy if exists "instructor manage weeks" on public.weeks;
create policy "weeks public select" on public.weeks for select using (true);
create policy "instructor manage weeks" on public.weeks for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "own enrollment"               on public.enrollments;
drop policy if exists "instructor see enrollments"   on public.enrollments;
create policy "own enrollment" on public.enrollments for select using (auth.uid() = student_id);
create policy "instructor see enrollments" on public.enrollments for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "own team"             on public.team_assignments;
drop policy if exists "instructor see teams" on public.team_assignments;
create policy "own team" on public.team_assignments for select using (auth.uid() = student_id);
create policy "instructor see teams" on public.team_assignments for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "manage own tickets"    on public.sprint_tickets;
drop policy if exists "instructor see tickets" on public.sprint_tickets;
create policy "manage own tickets" on public.sprint_tickets for all using (auth.uid() = student_id);
create policy "instructor see tickets" on public.sprint_tickets for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "own scenarios"           on public.scenarios;
drop policy if exists "instructor see scenarios" on public.scenarios;
create policy "own scenarios" on public.scenarios for select using (auth.uid() = student_id);
create policy "instructor see scenarios" on public.scenarios for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "manage own submissions"    on public.submissions;
drop policy if exists "instructor see submissions" on public.submissions;
create policy "manage own submissions" on public.submissions for all using (auth.uid() = student_id);
create policy "instructor see submissions" on public.submissions for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

drop policy if exists "instructor manage feedback"        on public.feedback;
drop policy if exists "student see own feedback"          on public.feedback;
create policy "instructor manage feedback" on public.feedback for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
create policy "student see own feedback" on public.feedback for select
  using (exists (select 1 from public.submissions s where s.id = submission_id and s.student_id = auth.uid()));

-- Auto-create profile trigger
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

-- Promote instructor + create course + seed weeks
do $seed$
declare
  v_instructor_id uuid;
  v_course_id uuid;
begin
  select id into v_instructor_id from auth.users where email = 'naomihbeltrand@gmail.com';
  if v_instructor_id is null then
    raise exception 'Sign up at /login first, then re-run this script.';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (v_instructor_id, 'naomihbeltrand@gmail.com', 'Naomi', 'instructor')
  on conflict (id) do update set role = 'instructor';

  insert into public.courses (id, code, name, semester, instructor_id)
  values (uuid_generate_v4(), 'CS 3330', 'Software Development Processes and Methodologies', 'Fall 2026', v_instructor_id)
  returning id into v_course_id;

  insert into public.weeks (course_id, week_number, topic, description, due_date, is_active, prior_topics) values
  (v_course_id,1,'Course Introduction & Team Setup','Meet your fictional team. No submission this week.','2026-08-26',false,'{}'),
  (v_course_id,2,'SDLC Fundamentals','Identify which SDLC phase your project is entering.','2026-09-02',false,ARRAY['Course Introduction & Team Setup']),
  (v_course_id,3,'SDLC Models: Comparison & Use Cases','Your team debates which SDLC model fits. How do you facilitate?','2026-09-09',false,ARRAY['Course Introduction & Team Setup','SDLC Fundamentals']),
  (v_course_id,4,'Agile Methodology Deep Dive','Draft your team working agreement. One teammate wants to skip ceremonies.','2026-09-16',false,ARRAY['SDLC Fundamentals','SDLC Models: Comparison & Use Cases']),
  (v_course_id,5,'Scrum Framework','Run sprint planning. Handle your first conflict around story point estimates.','2026-09-23',true,ARRAY['SDLC Models: Comparison & Use Cases','Agile Methodology Deep Dive']),
  (v_course_id,6,'XP, Lean & Kanban','A stakeholder asks you to switch from Scrum to Kanban mid-sprint.','2026-09-30',false,ARRAY['Agile Methodology Deep Dive','Scrum Framework']),
  (v_course_id,7,'Requirements Engineering','Elicit requirements from a vague stakeholder.','2026-10-07',false,ARRAY['Scrum Framework','XP, Lean & Kanban']),
  (v_course_id,8,'Midterm Review & Requirements Workshop','Requirements gaps found two days before sprint review.','2026-10-14',false,ARRAY['XP, Lean & Kanban','Requirements Engineering']),
  (v_course_id,9,'Software Design Principles','Apply SOLID principles. One developer refuses to refactor.','2026-10-21',false,ARRAY['Requirements Engineering','Midterm Review & Requirements Workshop']),
  (v_course_id,10,'Architectural Styles & Design Patterns','Choose an architectural pattern. A senior dev disagrees.','2026-10-28',false,ARRAY['Midterm Review & Requirements Workshop','Software Design Principles']),
  (v_course_id,11,'Code Reviews & Industry Tools','Facilitate a code review. Handle feedback taken personally.','2026-11-04',false,ARRAY['Software Design Principles','Architectural Styles & Design Patterns']),
  (v_course_id,12,'Configuration & Dependency Management','A vulnerability surfaces before release. How do you manage it?','2026-11-11',false,ARRAY['Architectural Styles & Design Patterns','Code Reviews & Industry Tools']),
  (v_course_id,13,'CI/CD & DevOps Integration','Your team resists automation and wants to deploy manually.','2026-11-18',false,ARRAY['Code Reviews & Industry Tools','Configuration & Dependency Management']),
  (v_course_id,14,'Semester Project — Final Sprint','No simulation this week. Focus on your semester project.','2026-12-02',false,'{}'),
  (v_course_id,15,'Final Presentations & Course Wrap-Up','Present your semester project during finals week.','2026-12-09',false,'{}');

  raise notice 'Done! Course ID: %', v_course_id;
end $seed$;
