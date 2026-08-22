-- Backfill sprints 2-6 (40 tickets) for students enrolled before the full
-- 6-sprint seeding existed. Idempotent: only touches students who have no
-- tickets beyond sprint 1. Assignees come from the student's own team_config.
DO $$
DECLARE
  ta RECORD;
  prefix text;
  a text; b text; c text; d text;
BEGIN
  FOR ta IN
    SELECT t.student_id, t.course_id, t.project_name, t.team_config
    FROM public.team_assignments t
    WHERE NOT EXISTS (
      SELECT 1 FROM public.sprint_tickets s
      WHERE s.student_id = t.student_id AND s.sprint_number > 1
    )
  LOOP
    prefix := upper(left(ta.project_name, 3));
    a := coalesce(ta.team_config->0->>'firstName', split_part(ta.team_config->0->>'name', ' ', 1));
    b := coalesce(ta.team_config->1->>'firstName', split_part(ta.team_config->1->>'name', ' ', 1));
    c := coalesce(ta.team_config->2->>'firstName', split_part(ta.team_config->2->>'name', ' ', 1));
    d := coalesce(ta.team_config->3->>'firstName', split_part(ta.team_config->3->>'name', ' ', 1));

    INSERT INTO public.sprint_tickets
      (student_id, course_id, sprint_number, ticket_id, title, status, assignee_name, story_points, is_blocked)
    SELECT ta.student_id, ta.course_id, v.sprint,
           prefix || '-S' || v.sprint || '-' || lpad(v.idx::text, 2, '0'),
           v.title, 'todo',
           CASE ((v.idx - 1) % 4) WHEN 0 THEN a WHEN 1 THEN b WHEN 2 THEN c ELSE d END,
           v.pts, false
    FROM (VALUES
      (2,1,'Create product backlog with user stories',3),
      (2,2,'Run first sprint planning session',2),
      (2,3,'Set up Daily Scrum cadence',1),
      (2,4,'Define Definition of Done for the team',1),
      (2,5,'Write sprint goal and success criteria',2),
      (2,6,'Conduct sprint review with stakeholder demo',2),
      (2,7,'Run sprint retrospective and identify improvements',1),
      (2,8,'Update product backlog after sprint review',1),
      (3,1,'Trial pair programming on one feature',2),
      (3,2,'Add WIP limits to the team board (Kanban)',1),
      (3,3,'Identify process waste and propose one cut (Lean)',2),
      (3,4,'Conduct stakeholder interviews for requirements',3),
      (3,5,'Write functional requirements specification',3),
      (3,6,'Write non-functional requirements',2),
      (3,7,'Create acceptance criteria for top 5 stories',2),
      (3,8,'Re-estimate backlog based on new requirements',2),
      (4,1,'Facilitate requirements review workshop',3),
      (4,2,'Create use case diagrams for core flows',2),
      (4,3,'Traceability matrix: requirements to tickets',2),
      (4,4,'Apply SOLID principles to core module design',3),
      (4,5,'Identify and refactor code smells in codebase',2),
      (4,6,'Refactor one class to meet SRP',1),
      (4,7,'Peer design review with written feedback',1),
      (4,8,'Document design decisions and rationale',1),
      (5,1,'Choose and document architectural style',3),
      (5,2,'Apply a GoF pattern to a core component',2),
      (5,3,'Create component/module diagram',2),
      (5,4,'Document trade-offs for architecture decision',1),
      (5,5,'Run formal code review on a pull request',2),
      (5,6,'Set up linting and static analysis',2),
      (5,7,'Write team code review checklist',1),
      (5,8,'Address review findings on core module',2),
      (6,1,'Set up Git branching strategy (GitFlow)',2),
      (6,2,'Resolve merge conflicts in feature branches',1),
      (6,3,'Audit dependencies and patch vulnerabilities',2),
      (6,4,'Tag release v1.0.0 with changelog',1),
      (6,5,'Configure CI pipeline for automated builds',3),
      (6,6,'Add automated test gate to the pipeline',2),
      (6,7,'Design deployment strategy (delivery vs deploy)',2),
      (6,8,'Final demo preparation and slide deck',2)
    ) AS v(sprint, idx, title, pts);

    RAISE NOTICE 'Backfilled 40 tickets for student %', ta.student_id;
  END LOOP;
END $$;
