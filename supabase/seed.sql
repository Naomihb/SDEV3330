-- ── Seed: instructor account + course + weeks ─────────────────────────────────
-- Run this after schema migration.
-- Replace the email below with your own before running.

-- 1. Create the course (run AFTER you've signed up and have your user ID)
-- Get your user ID from: select id from auth.users where email = 'your@email.com';
-- Then uncomment and run:

-- INSERT INTO public.courses (id, code, name, semester, instructor_id)
-- VALUES (
--   gen_random_uuid(),
--   'CS 3330',
--   'Software Development Processes and Methodologies',
--   'Fall 2026',
--   'YOUR_INSTRUCTOR_USER_ID'   -- paste from auth.users query above
-- );

-- 2. Promote yourself to instructor
-- UPDATE public.profiles SET role = 'instructor' WHERE email = 'your@email.com';

-- 3. Seed weeks (replace COURSE_UUID with the id from step 1)
-- Copy the contents of seed_weeks.sql here after replacing COURSE_UUID.
