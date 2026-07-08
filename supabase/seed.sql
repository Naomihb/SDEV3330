-- Seed file — runs automatically after `supabase db reset`
-- Sign up at localhost:3000/login with naomihbeltrand@gmail.com first

DO $$
DECLARE
  instructor_email text := 'naomihbeltrand@gmail.com';
  instructor_id    uuid;
  course_id        uuid;
BEGIN
  -- Look up instructor account
  select id into instructor_id from auth.users where email = instructor_email;

  if instructor_id is null then
    raise notice 'Instructor account not found — sign up at localhost:3000/login first, then run: npx supabase db seed';
    return;
  end if;

  -- Promote to instructor
  insert into public.profiles (id, email, full_name, role)
  values (instructor_id, instructor_email, split_part(instructor_email,'@',1), 'instructor')
  on conflict (id) do update set role = 'instructor';

  -- Create course
  insert into public.courses (id, code, name, semester, instructor_id)
  values (uuid_generate_v4(), 'CS 3330',
          'Software Development Processes and Methodologies', 'Fall 2026', instructor_id)
  returning id into course_id;

  -- Seed 15 weeks
  insert into public.weeks (course_id, week_number, topic, description, due_date, is_active, prior_topics) values
  (course_id,1,'Course Introduction & Team Setup','Meet your fictional team. No submission this week.','2026-08-26',false,'{}'),
  (course_id,2,'SDLC Fundamentals','Identify which SDLC phase your project is entering and justify your choice.','2026-09-02',false,ARRAY['Course Introduction & Team Setup']),
  (course_id,3,'SDLC Models: Comparison & Use Cases','Your team debates which SDLC model fits your project. How do you facilitate?','2026-09-09',false,ARRAY['Course Introduction & Team Setup','SDLC Fundamentals']),
  (course_id,4,'Agile Methodology Deep Dive','Draft your team working agreement. One teammate wants to skip the ceremonies.','2026-09-16',false,ARRAY['SDLC Fundamentals','SDLC Models: Comparison & Use Cases']),
  (course_id,5,'Scrum Framework','Run sprint planning. Handle your first conflict around story point estimates.','2026-09-23',true,ARRAY['SDLC Models: Comparison & Use Cases','Agile Methodology Deep Dive']),
  (course_id,6,'XP, Lean & Kanban','A stakeholder asks you to switch from Scrum to Kanban mid-sprint. How do you respond?','2026-09-30',false,ARRAY['Agile Methodology Deep Dive','Scrum Framework']),
  (course_id,7,'Requirements Engineering','Elicit requirements from a vague stakeholder. Write user stories your team can act on.','2026-10-07',false,ARRAY['Scrum Framework','XP, Lean & Kanban']),
  (course_id,8,'Midterm Review & Requirements Workshop','Requirements gaps found two days before sprint review. How do you recover?','2026-10-14',false,ARRAY['XP, Lean & Kanban','Requirements Engineering']),
  (course_id,9,'Software Design Principles','Apply SOLID principles to a design decision. One developer refuses to refactor.','2026-10-21',false,ARRAY['Requirements Engineering','Midterm Review & Requirements Workshop']),
  (course_id,10,'Architectural Styles & Design Patterns','Choose and justify an architectural pattern. A senior dev disagrees with your call.','2026-10-28',false,ARRAY['Midterm Review & Requirements Workshop','Software Design Principles']),
  (course_id,11,'Code Reviews & Industry Tools','Facilitate a code review. Handle a team member who takes feedback personally.','2026-11-04',false,ARRAY['Software Design Principles','Architectural Styles & Design Patterns']),
  (course_id,12,'Configuration & Dependency Management','A critical dependency vulnerability surfaces before a release. How do you manage it?','2026-11-11',false,ARRAY['Architectural Styles & Design Patterns','Code Reviews & Industry Tools']),
  (course_id,13,'CI/CD & DevOps Integration','Design a CI/CD pipeline. Your team resists automation and wants to deploy manually.','2026-11-18',false,ARRAY['Code Reviews & Industry Tools','Configuration & Dependency Management']),
  (course_id,14,'Semester Project — Final Sprint','No simulation this week. Focus on your semester project.','2026-12-02',false,'{}'),
  (course_id,15,'Final Presentations & Course Wrap-Up','Present your semester project. Reflect on what you would do differently.','2026-12-09',false,'{}');

  raise notice 'Seed complete! Course ID: %', course_id;
  raise notice 'Instructor: % promoted to instructor role', instructor_email;
END $$;
