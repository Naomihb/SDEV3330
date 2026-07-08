-- ============================================================
-- SprintSim — Full Database Setup
-- Paste this entire file into Supabase → SQL Editor → Run
--
-- BEFORE YOU RUN: Sign up at your app's /login page first
-- so your instructor account exists in auth.users.
-- Then set your email on line 12 below.
-- ============================================================

DO $$
DECLARE
  instructor_email text := 'naomihbeltrand@gmail.com';  -- ← your email
  course_id uuid;
  instructor_id uuid;
BEGIN

-- ─── 1. EXTENSIONS ───────────────────────────────────────────
  create extension if not exists "uuid-ossp";

-- ─── 2. TABLES ───────────────────────────────────────────────

  create table if not exists public.profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    email       text not null,
    full_name   text not null default '',
    role        text not null default 'student' check (role in ('student', 'instructor')),
    created_at  timestamptz default now()
  );

  create table if not exists public.courses (
    id            uuid primary key default uuid_generate_v4(),
    code          text not null,
    name          text not null,
    semester      text not null,
    instructor_id uuid references public.profiles(id) on delete set null,
    created_at    timestamptz default now()
  );

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

  create table if not exists public.enrollments (
    id          uuid primary key default uuid_generate_v4(),
    student_id  uuid not null references public.profiles(id) on delete cascade,
    course_id   uuid not null references public.courses(id) on delete cascade,
    enrolled_at timestamptz default now(),
    unique(student_id, course_id)
  );

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

  create table if not exists public.scenarios (
    id           uuid primary key default uuid_generate_v4(),
    student_id   uuid not null references public.profiles(id) on delete cascade,
    week_id      uuid not null references public.weeks(id) on delete cascade,
    content      text not null,
    generated_at timestamptz default now(),
    unique(student_id, week_id)
  );

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

  create table if not exists public.feedback (
    id             uuid primary key default uuid_generate_v4(),
    submission_id  uuid not null references public.submissions(id) on delete cascade,
    instructor_id  uuid not null references public.profiles(id),
    grade          text not null check (grade in ('S','U','E','I')),
    feedback_text  text,
    submitted_at   timestamptz default now(),
    unique(submission_id)
  );

-- ─── 3. ROW LEVEL SECURITY ───────────────────────────────────

  alter table public.profiles       enable row level security;
  alter table public.courses        enable row level security;
  alter table public.weeks          enable row level security;
  alter table public.enrollments    enable row level security;
  alter table public.team_assignments enable row level security;
  alter table public.sprint_tickets enable row level security;
  alter table public.scenarios      enable row level security;
  alter table public.submissions    enable row level security;
  alter table public.feedback       enable row level security;

  -- profiles
  drop policy if exists "Users can view own profile"        on public.profiles;
  drop policy if exists "Users can update own profile"      on public.profiles;
  drop policy if exists "Instructors can view all profiles" on public.profiles;
  drop policy if exists "Service role bypasses RLS"         on public.profiles;

  create policy "Users can view own profile"
    on public.profiles for select using (auth.uid() = id);
  create policy "Users can update own profile"
    on public.profiles for update using (auth.uid() = id);
  create policy "Instructors can view all profiles"
    on public.profiles for select
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- courses
  drop policy if exists "Anyone can view courses" on public.courses;
  create policy "Anyone can view courses"
    on public.courses for select using (true);

  -- weeks
  drop policy if exists "Anyone can view weeks" on public.weeks;
  create policy "Anyone can view weeks"
    on public.weeks for select using (true);
  drop policy if exists "Instructors can manage weeks" on public.weeks;
  create policy "Instructors can manage weeks"
    on public.weeks for all
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- enrollments
  drop policy if exists "Students can view own enrollment"       on public.enrollments;
  drop policy if exists "Instructors can view all enrollments"   on public.enrollments;
  create policy "Students can view own enrollment"
    on public.enrollments for select using (auth.uid() = student_id);
  create policy "Instructors can view all enrollments"
    on public.enrollments for select
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- team_assignments
  drop policy if exists "Students can view own team"       on public.team_assignments;
  drop policy if exists "Instructors can view all teams"   on public.team_assignments;
  create policy "Students can view own team"
    on public.team_assignments for select using (auth.uid() = student_id);
  create policy "Instructors can view all teams"
    on public.team_assignments for select
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- sprint_tickets
  drop policy if exists "Students can manage own tickets"   on public.sprint_tickets;
  drop policy if exists "Instructors can view all tickets"  on public.sprint_tickets;
  create policy "Students can manage own tickets"
    on public.sprint_tickets for all using (auth.uid() = student_id);
  create policy "Instructors can view all tickets"
    on public.sprint_tickets for select
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- scenarios
  drop policy if exists "Students can view own scenarios"     on public.scenarios;
  drop policy if exists "Instructors can view all scenarios"  on public.scenarios;
  create policy "Students can view own scenarios"
    on public.scenarios for select using (auth.uid() = student_id);
  create policy "Instructors can view all scenarios"
    on public.scenarios for select
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- submissions
  drop policy if exists "Students can manage own submissions"   on public.submissions;
  drop policy if exists "Instructors can view all submissions"  on public.submissions;
  create policy "Students can manage own submissions"
    on public.submissions for all using (auth.uid() = student_id);
  create policy "Instructors can view all submissions"
    on public.submissions for select
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));

  -- feedback
  drop policy if exists "Instructors can manage feedback"              on public.feedback;
  drop policy if exists "Students can view feedback on own submissions" on public.feedback;
  create policy "Instructors can manage feedback"
    on public.feedback for all
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'instructor'));
  create policy "Students can view feedback on own submissions"
    on public.feedback for select
    using (exists (select 1 from public.submissions s where s.id = submission_id and s.student_id = auth.uid()));

-- ─── 4. PROFILE TRIGGER ──────────────────────────────────────
-- Auto-creates a profile row when a user signs up

  create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
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

-- ─── 5. PROMOTE INSTRUCTOR ───────────────────────────────────

  select id into instructor_id from auth.users where email = instructor_email;

  if instructor_id is null then
    raise exception
      'No user found with email %. Sign up at /login first, then re-run this script.', instructor_email;
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (instructor_id, instructor_email,
          split_part(instructor_email, '@', 1), 'instructor')
  on conflict (id) do update set role = 'instructor';

-- ─── 6. CREATE COURSE ────────────────────────────────────────

  insert into public.courses (id, code, name, semester, instructor_id)
  values (uuid_generate_v4(), 'CS 3330',
          'Software Development Processes and Methodologies',
          'Fall 2026', instructor_id)
  returning id into course_id;

-- ─── 7. SEED WEEKS ───────────────────────────────────────────

  insert into public.weeks (course_id, week_number, topic, description, due_date, is_active, prior_topics) values

  (course_id, 1, 'Course Introduction & Team Setup',
   'Meet your fictional team and project. Explore your teammates'' personalities and set up your sprint board. No submission this week.',
   '2026-08-26', false, '{}'),

  (course_id, 2, 'SDLC Fundamentals',
   'Identify which SDLC phase your project is entering and justify your choice to a skeptical stakeholder.',
   '2026-09-02', false,
   ARRAY['Course Introduction & Team Setup']),

  (course_id, 3, 'SDLC Models: Comparison & Use Cases',
   'Your team debates which SDLC model fits your project. How do you facilitate the decision?',
   '2026-09-09', false,
   ARRAY['Course Introduction & Team Setup','SDLC Fundamentals']),

  (course_id, 4, 'Agile Methodology Deep Dive',
   'Draft your team''s working agreement. One teammate already wants to skip the ceremonies.',
   '2026-09-16', false,
   ARRAY['SDLC Fundamentals','SDLC Models: Comparison & Use Cases']),

  (course_id, 5, 'Scrum Framework',
   'Run sprint planning. Handle your first team conflict around story point estimates.',
   '2026-09-23', true,
   ARRAY['SDLC Models: Comparison & Use Cases','Agile Methodology Deep Dive']),

  (course_id, 6, 'XP, Lean & Kanban',
   'A stakeholder asks you to switch from Scrum to Kanban mid-sprint. How do you respond?',
   '2026-09-30', false,
   ARRAY['Agile Methodology Deep Dive','Scrum Framework']),

  (course_id, 7, 'Requirements Engineering',
   'Elicit requirements from a vague, hard-to-reach stakeholder. Write user stories your team can act on.',
   '2026-10-07', false,
   ARRAY['Scrum Framework','XP, Lean & Kanban']),

  (course_id, 8, 'Midterm Review & Requirements Workshop',
   'Your requirements doc has gaps the team just discovered two days before sprint review. How do you recover?',
   '2026-10-14', false,
   ARRAY['XP, Lean & Kanban','Requirements Engineering']),

  (course_id, 9, 'Software Design Principles',
   'Apply SOLID principles to a design decision your team is debating. One developer refuses to refactor.',
   '2026-10-21', false,
   ARRAY['Requirements Engineering','Midterm Review & Requirements Workshop']),

  (course_id, 10, 'Architectural Styles & Design Patterns',
   'Choose and justify an architectural pattern for your project. A senior dev disagrees with your call.',
   '2026-10-28', false,
   ARRAY['Midterm Review & Requirements Workshop','Software Design Principles']),

  (course_id, 11, 'Code Reviews & Industry Tools',
   'Facilitate a code review session. Handle a team member who takes feedback personally.',
   '2026-11-04', false,
   ARRAY['Software Design Principles','Architectural Styles & Design Patterns']),

  (course_id, 12, 'Configuration & Dependency Management',
   'A critical dependency vulnerability surfaces the day before a release. How do you manage it?',
   '2026-11-11', false,
   ARRAY['Architectural Styles & Design Patterns','Code Reviews & Industry Tools']),

  (course_id, 13, 'CI/CD & DevOps Integration',
   'Design a CI/CD pipeline for your project. Your team resists automation and wants to keep deploying manually.',
   '2026-11-18', false,
   ARRAY['Code Reviews & Industry Tools','Configuration & Dependency Management']),

  (course_id, 14, 'Semester Project — Final Sprint',
   'No simulation this week. Focus entirely on your semester project.',
   '2026-12-02', false, '{}'),

  (course_id, 15, 'Final Presentations & Course Wrap-Up',
   'Present your semester project during finals week.',
   '2026-12-09', false, '{}');

  raise notice 'Setup complete. Course ID: %', course_id;
  raise notice 'Instructor promoted: %', instructor_email;
  raise notice 'Weeks seeded: 15';

END $$;
