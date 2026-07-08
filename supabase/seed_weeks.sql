-- Seed the 16 weeks for CS 3330 Fall 2026 — Collin College
-- Replace COURSE_UUID with your actual course id after running schema.sql
--
-- Key dates from official academic calendar:
--   Aug 24        Fall classes begin
--   Sep 7         Labor Day holiday (all campuses closed)
--   Sep 8         16-week census date
--   Oct 30        Last day to withdraw
--   Nov 25–29     Thanksgiving holiday (all campuses closed)
--   Dec 7–13      Final exam week
--   Dec 11        Commencement
--
-- Structure:
--   Weeks  1–13   SprintSim simulation (scenario + graded submission each week)
--   Week  14      Project sprint — no scenario, no submission
--   Week  15      Final presentations (finals week, Dec 7–13)

insert into public.weeks (course_id, week_number, topic, description, due_date, is_active) values

  -- ── SprintSim weeks ────────────────────────────────────────────────────────

  -- Week 1 is orientation only — no scenario, no submission due.
  ('COURSE_UUID', 1,  'Course Introduction & Team Setup',
   'Meet your fictional team and project. Explore your teammates'' personalities and set up your sprint board. No submission this week.',
   '2026-08-26', false),

  ('COURSE_UUID', 2,  'SDLC Fundamentals',
   'Identify which SDLC phase your project is entering and justify your choice to a skeptical stakeholder.',
   '2026-09-02', false),

  -- Note: Labor Day Sep 7 (Mon) — campus closed, but Wednesday class meets Sep 9 as normal.
  ('COURSE_UUID', 3,  'SDLC Models: Comparison & Use Cases',
   'Your team debates which SDLC model fits your project. How do you facilitate the decision?',
   '2026-09-09', false),

  ('COURSE_UUID', 4,  'Agile Methodology Deep Dive',
   'Draft your team''s working agreement. One teammate already wants to skip the ceremonies.',
   '2026-09-16', false),

  ('COURSE_UUID', 5,  'Scrum Framework',
   'Run sprint planning. Handle your first team conflict around story point estimates.',
   '2026-09-23', true),

  ('COURSE_UUID', 6,  'XP, Lean & Kanban',
   'A stakeholder asks you to switch from Scrum to Kanban mid-sprint. How do you respond?',
   '2026-09-30', false),

  ('COURSE_UUID', 7,  'Requirements Engineering',
   'Elicit requirements from a vague, hard-to-reach stakeholder. Write user stories your team can act on.',
   '2026-10-07', false),

  ('COURSE_UUID', 8,  'Midterm Review & Requirements Workshop',
   'Your requirements doc has gaps the team just discovered two days before sprint review. How do you recover?',
   '2026-10-14', false),

  ('COURSE_UUID', 9,  'Software Design Principles',
   'Apply SOLID principles to a design decision your team is debating. One developer refuses to refactor.',
   '2026-10-21', false),

  -- Note: Last day to withdraw is Oct 30 (Fri).
  ('COURSE_UUID', 10, 'Architectural Styles & Design Patterns',
   'Choose and justify an architectural pattern for your project. A senior dev disagrees with your call.',
   '2026-10-28', false),

  ('COURSE_UUID', 11, 'Code Reviews & Industry Tools',
   'Facilitate a code review session. Handle a team member who takes feedback personally.',
   '2026-11-04', false),

  ('COURSE_UUID', 12, 'Configuration & Dependency Management',
   'A critical dependency vulnerability surfaces the day before a release. How do you manage it?',
   '2026-11-11', false),

  ('COURSE_UUID', 13, 'CI/CD & DevOps Integration',
   'Design a CI/CD pipeline for your project. Your team resists automation and wants to keep deploying manually.',
   '2026-11-18', false),

  -- ── Thanksgiving: Nov 25–29 (all campuses closed) ─────────────────────────

  ('COURSE_UUID', 14, 'Semester Project — Final Sprint',
   'No simulation this week. Focus entirely on your semester project. Triage what ships and what gets cut.',
   '2026-12-02', false),

  ('COURSE_UUID', 15, 'Final Presentations & Course Wrap-Up',
   'Present your semester project during finals week. Reflect on what you''d do differently as a Scrum Master.',
   '2026-12-09', false);
