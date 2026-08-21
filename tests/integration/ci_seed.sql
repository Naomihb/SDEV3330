-- CI seed: run after creating the instructor auth user (instructor-ci@test.example).
-- Promotes instructor, creates course with join_code, seeds 15 weeks, activates week 5.
DO $$
DECLARE
  uid uuid;
  cid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'instructor-ci@test.example';
  IF uid IS NULL THEN RAISE EXCEPTION 'CI instructor user not found — create via admin API first'; END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (uid, 'instructor-ci@test.example', 'CI Instructor', 'instructor')
  ON CONFLICT (id) DO UPDATE SET role = 'instructor';

  SELECT id INTO cid FROM public.courses WHERE join_code = 'cs3330-f26';
  IF cid IS NULL THEN
    INSERT INTO public.courses (code, name, semester, instructor_id, join_code)
    VALUES ('CS 3330', 'Software Development Processes', 'Fall 2026', uid, 'cs3330-f26')
    RETURNING id INTO cid;

    INSERT INTO public.weeks (course_id, week_number, topic, description, due_date, is_active) VALUES
    (cid,1,'Course Introduction & Team Setup','Intro','2026-08-26',false),
    (cid,2,'SDLC Fundamentals','SDLC phases','2026-09-02',false),
    (cid,3,'SDLC Models: Comparison & Use Cases','Models','2026-09-09',false),
    (cid,4,'Agile Methodology Deep Dive','Agile','2026-09-16',false),
    (cid,5,'Scrum Framework','Scrum','2026-09-23',true),
    (cid,6,'XP, Lean & Kanban','XP','2026-09-30',false),
    (cid,7,'Requirements Engineering','Reqs','2026-10-07',false),
    (cid,8,'Midterm Review & Requirements Workshop','Workshop','2026-10-14',false),
    (cid,9,'Software Design Principles','SOLID','2026-10-21',false),
    (cid,10,'Architectural Styles & Design Patterns','Arch','2026-10-28',false),
    (cid,11,'Code Reviews & Industry Tools','Reviews','2026-11-04',false),
    (cid,12,'Configuration & Dependency Management','Config','2026-11-11',false),
    (cid,13,'CI/CD & DevOps Integration','CI/CD','2026-11-18',false),
    (cid,14,'Semester Project — Final Sprint','Project','2026-12-02',false),
    (cid,15,'Final Presentations & Course Wrap-Up','Finals','2026-12-09',false);
  END IF;
END $$;
