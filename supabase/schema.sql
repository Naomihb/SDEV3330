-- SprintSim Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        text not null check (role in ('student', 'instructor')),
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Instructors can view all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

-- ─── COURSES ─────────────────────────────────────────────────────────────────
create table public.courses (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null,           -- e.g. "CS 3330"
  name            text not null,           -- e.g. "Software Dev Processes"
  semester        text not null,           -- e.g. "Spring 2026"
  instructor_id   uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now()
);

alter table public.courses enable row level security;

create policy "Anyone enrolled can view course"
  on public.courses for select using (true);

-- ─── WEEKS ───────────────────────────────────────────────────────────────────
create table public.weeks (
  id           uuid primary key default uuid_generate_v4(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  week_number  int not null,
  topic        text not null,
  description  text,
  due_date     date,
  is_active    boolean default false,
  created_at   timestamptz default now(),
  unique(course_id, week_number)
);

alter table public.weeks enable row level security;

create policy "Anyone can view weeks"
  on public.weeks for select using (true);

-- ─── ENROLLMENTS ─────────────────────────────────────────────────────────────
create table public.enrollments (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "Students can view own enrollment"
  on public.enrollments for select using (auth.uid() = student_id);

create policy "Instructors can view all enrollments"
  on public.enrollments for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

-- ─── TEAM ASSIGNMENTS ────────────────────────────────────────────────────────
-- Stores each student's randomized team + project for a course
create table public.team_assignments (
  id                  uuid primary key default uuid_generate_v4(),
  student_id          uuid not null references public.profiles(id) on delete cascade,
  course_id           uuid not null references public.courses(id) on delete cascade,
  project_name        text not null,
  project_description text not null,
  -- JSON array of 4 team members with randomized traits
  -- [{ name, nickname, role, seniority, personality, mood_tendency, avatar_initials, color }]
  team_config         jsonb not null,
  created_at          timestamptz default now(),
  unique(student_id, course_id)
);

alter table public.team_assignments enable row level security;

create policy "Students can view own team"
  on public.team_assignments for select using (auth.uid() = student_id);

create policy "Instructors can view all teams"
  on public.team_assignments for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

-- ─── SPRINT TICKETS ──────────────────────────────────────────────────────────
create table public.sprint_tickets (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  sprint_number int not null default 1,
  ticket_id     text not null,             -- e.g. "PAW-04"
  title         text not null,
  status        text not null default 'todo' check (status in ('todo','in_progress','done')),
  assignee_name text,
  story_points  int default 1,
  is_blocked    boolean default false,
  created_at    timestamptz default now()
);

alter table public.sprint_tickets enable row level security;

create policy "Students can manage own tickets"
  on public.sprint_tickets for all using (auth.uid() = student_id);

create policy "Instructors can view all tickets"
  on public.sprint_tickets for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

-- ─── SCENARIOS ───────────────────────────────────────────────────────────────
-- AI-generated weekly scenario, unique per student per week
create table public.scenarios (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references public.profiles(id) on delete cascade,
  week_id      uuid not null references public.weeks(id) on delete cascade,
  content      text not null,
  generated_at timestamptz default now(),
  unique(student_id, week_id)
);

alter table public.scenarios enable row level security;

create policy "Students can view own scenarios"
  on public.scenarios for select using (auth.uid() = student_id);

create policy "Instructors can view all scenarios"
  on public.scenarios for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

-- ─── SUBMISSIONS ─────────────────────────────────────────────────────────────
create table public.submissions (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  week_id       uuid not null references public.weeks(id) on delete cascade,
  scenario_id   uuid references public.scenarios(id),
  response_text text not null,
  submitted_at  timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(student_id, week_id)
);

alter table public.submissions enable row level security;

create policy "Students can manage own submissions"
  on public.submissions for all using (auth.uid() = student_id);

create policy "Instructors can view all submissions"
  on public.submissions for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

-- ─── FEEDBACK ────────────────────────────────────────────────────────────────
create table public.feedback (
  id             uuid primary key default uuid_generate_v4(),
  submission_id  uuid not null references public.submissions(id) on delete cascade,
  instructor_id  uuid not null references public.profiles(id),
  grade          text not null check (grade in ('S','U','E','I')),
  feedback_text  text,
  submitted_at   timestamptz default now()
);

alter table public.feedback enable row level security;

create policy "Instructors can manage feedback"
  on public.feedback for all
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'instructor'
  ));

create policy "Students can view feedback on own submissions"
  on public.feedback for select
  using (exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.student_id = auth.uid()
  ));

-- ─── SEED: CS 3330 COURSE + WEEKS ────────────────────────────────────────────
-- Run after creating your instructor account; replace INSTRUCTOR_UUID
-- insert into public.courses (id, code, name, semester, instructor_id)
-- values ('00000000-0000-0000-0000-000000000001', 'CS 3330',
--         'Software Development Processes and Methodologies', 'Spring 2026',
--         'INSTRUCTOR_UUID');

-- Weeks seeded separately — see supabase/seed_weeks.sql
