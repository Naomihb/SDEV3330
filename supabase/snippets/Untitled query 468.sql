DO $$
DECLARE
  uid uuid;
  cid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'naomihbeltrand@gmail.com';
  RAISE NOTICE 'User ID: %', uid;

  IF uid IS NULL THEN
    RAISE EXCEPTION 'User not found — sign up first';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (uid, 'naomihbeltrand@gmail.com', 'Naomi', 'instructor')
  ON CONFLICT (id) DO UPDATE SET role = 'instructor';

  INSERT INTO public.courses (code, name, semester, instructor_id)
  VALUES ('CS 3330', 'Software Development Processes', 'Fall 2026', uid)
  RETURNING id INTO cid;

  RAISE NOTICE 'Course ID: %', cid;

  INSERT INTO public.weeks (course_id, week_number, topic, description, due_date, is_active, prior_topics) VALUES
  (cid,1,'Course Introduction & Team Setup','Meet your team. No submission this week.','2026-08-26',false,'{}'),
  (cid,2,'SDLC Fundamentals','Identify which SDLC phase your project is entering.','2026-09-02',false,ARRAY['Course Introduction & Team Setup']),
  (cid,3,'SDLC Models: Comparison & Use Cases','Your team debates which SDLC model fits.','2026-09-09',false,ARRAY['Course Introduction & Team Setup','SDLC Fundamentals']),
  (cid,4,'Agile Methodology Deep Dive','Draft your team working agreement.','2026-09-16',false,ARRAY['SDLC Fundamentals','SDLC Models: Comparison & Use Cases']),
  (cid,5,'Scrum Framework','Run sprint planning. Handle your first conflict around story points.','2026-09-23',true,ARRAY['SDLC Models: Comparison & Use Cases','Agile Methodology Deep Dive']),
  (cid,6,'XP, Lean & Kanban','A stakeholder asks you to switch from Scrum to Kanban mid-sprint.','2026-09-30',false,ARRAY['Agile Methodology Deep Dive','Scrum Framework']),
  (cid,7,'Requirements Engineering','Elicit requirements from a vague stakeholder.','2026-10-07',false,ARRAY['Scrum Framework','XP, Lean & Kanban']),
  (cid,8,'Midterm Review & Requirements Workshop','Requirements gaps found two days before sprint review.','2026-10-14',false,ARRAY['XP, Lean & Kanban','Requirements Engineering']),
  (cid,9,'Software Design Principles','Apply SOLID principles to a design decision.','2026-10-21',false,ARRAY['Requirements Engineering','Midterm Review & Requirements Workshop']),
  (cid,10,'Architectural Styles & Design Patterns','Choose and justify an architectural pattern.','2026-10-28',false,ARRAY['Midterm Review & Requirements Workshop','Software Design Principles']),
  (cid,11,'Code Reviews & Industry Tools','Facilitate a code review session.','2026-11-04',false,ARRAY['Software Design Principles','Architectural Styles & Design Patterns']),
  (cid,12,'Configuration & Dependency Management','A critical dependency vulnerability surfaces before a release.','2026-11-11',false,ARRAY['Architectural Styles & Design Patterns','Code Reviews & Industry Tools']),
  (cid,13,'CI/CD & DevOps Integration','Design a CI/CD pipeline. Team resists automation.','2026-11-18',false,ARRAY['Code Reviews & Industry Tools','Configuration & Dependency Management']),
  (cid,14,'Semester Project — Final Sprint','No simulation this week.','2026-12-02',false,'{}'),
  (cid,15,'Final Presentations & Course Wrap-Up','Present your semester project.','2026-12-09',false,'{}');

  RAISE NOTICE 'Done! Weeks seeded.';
END $$;