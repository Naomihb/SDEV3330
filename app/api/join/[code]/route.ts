import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateTeamAssignment } from '@/utils/teamAssignment'

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Course lookup uses user's token (courses are public)
    const { data: course } = await supabase
      .from('courses').select('id, name').eq('join_code', params.code).single()
    if (!course) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

    const service = createServiceClient()

    // Check already enrolled
    const { data: existing } = await service
      .from('enrollments').select('id').eq('student_id', user.id).eq('course_id', course.id).single()
    if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })

    // Enroll
    const { error: enrollErr } = await service.from('enrollments').insert({ student_id: user.id, course_id: course.id })
    if (enrollErr) return NextResponse.json({ error: `Enrollment failed: ${enrollErr.message}` }, { status: 500 })

    // Generate team assignment
    const { project, team } = generateTeamAssignment(user.id)

    const { error: teamErr } = await service.from('team_assignments').insert({
      student_id: user.id,
      course_id: course.id,
      project_name: project.name,
      project_description: project.description,
      team_config: team,
    })
    if (teamErr) return NextResponse.json({ error: `Team assignment failed: ${teamErr.message}` }, { status: 500 })

    // Seed 48 sprint tickets (6 sprints x 8 tickets)
    const prefix = project.name.slice(0, 3).toUpperCase()
    const [a, b, c, d] = team.map(m => m.firstName)

    const tickets = [
      // Sprint 1 — SDLC Foundations (weeks 2-3)
      { sprint: 1, title: 'Set up project repository and README',              assignee: a, points: 1, status: 'done' },
      { sprint: 1, title: 'Define SDLC phases for the project',                assignee: b, points: 2, status: 'done' },
      { sprint: 1, title: 'Write initial requirements document',               assignee: c, points: 3, status: 'in_progress' },
      { sprint: 1, title: 'Create project board and assign roles',             assignee: d, points: 1, status: 'todo' },
      { sprint: 1, title: 'Identify project risks and mitigation strategies',  assignee: b, points: 2, status: 'todo' },
      { sprint: 1, title: 'Draft project timeline and milestones',             assignee: a, points: 3, status: 'todo' },
      { sprint: 1, title: 'Sprint 1 retrospective and process review',         assignee: d, points: 1, status: 'todo' },
      { sprint: 1, title: 'Document team working agreement',                   assignee: c, points: 1, status: 'todo' },
      // Sprint 2 — Agile & Scrum (weeks 4-5)
      { sprint: 2, title: 'Create product backlog with user stories',          assignee: a, points: 3, status: 'todo' },
      { sprint: 2, title: 'Run first sprint planning session',                 assignee: b, points: 2, status: 'todo' },
      { sprint: 2, title: 'Set up Daily Scrum cadence',                        assignee: c, points: 1, status: 'todo' },
      { sprint: 2, title: 'Define Definition of Done for the team',            assignee: d, points: 1, status: 'todo' },
      { sprint: 2, title: 'Write sprint goal and success criteria',            assignee: a, points: 2, status: 'todo' },
      { sprint: 2, title: 'Conduct sprint review with stakeholder demo',       assignee: b, points: 2, status: 'todo' },
      { sprint: 2, title: 'Run sprint retrospective and identify improvements',assignee: c, points: 1, status: 'todo' },
      { sprint: 2, title: 'Update product backlog after sprint review',        assignee: d, points: 1, status: 'todo' },
      // Sprint 3 — XP, Lean & Kanban + Requirements (weeks 6-7)
      { sprint: 3, title: 'Trial pair programming on one feature',              assignee: a, points: 2, status: 'todo' },
      { sprint: 3, title: 'Add WIP limits to the team board (Kanban)',          assignee: b, points: 1, status: 'todo' },
      { sprint: 3, title: 'Identify process waste and propose one cut (Lean)',  assignee: c, points: 2, status: 'todo' },
      { sprint: 3, title: 'Conduct stakeholder interviews for requirements',    assignee: d, points: 3, status: 'todo' },
      { sprint: 3, title: 'Write functional requirements specification',        assignee: a, points: 3, status: 'todo' },
      { sprint: 3, title: 'Write non-functional requirements',                  assignee: b, points: 2, status: 'todo' },
      { sprint: 3, title: 'Create acceptance criteria for top 5 stories',       assignee: c, points: 2, status: 'todo' },
      { sprint: 3, title: 'Re-estimate backlog based on new requirements',      assignee: d, points: 2, status: 'todo' },
      // Sprint 4 — Requirements Workshop + Software Design (weeks 8-9)
      { sprint: 4, title: 'Facilitate requirements review workshop',            assignee: a, points: 3, status: 'todo' },
      { sprint: 4, title: 'Create use case diagrams for core flows',            assignee: b, points: 2, status: 'todo' },
      { sprint: 4, title: 'Traceability matrix: requirements to tickets',       assignee: c, points: 2, status: 'todo' },
      { sprint: 4, title: 'Apply SOLID principles to core module design',       assignee: d, points: 3, status: 'todo' },
      { sprint: 4, title: 'Identify and refactor code smells in codebase',      assignee: a, points: 2, status: 'todo' },
      { sprint: 4, title: 'Refactor one class to meet SRP',                     assignee: b, points: 1, status: 'todo' },
      { sprint: 4, title: 'Peer design review with written feedback',           assignee: c, points: 1, status: 'todo' },
      { sprint: 4, title: 'Document design decisions and rationale',            assignee: d, points: 1, status: 'todo' },
      // Sprint 5 — Architecture + Code Reviews (weeks 10-11)
      { sprint: 5, title: 'Choose and document architectural style',            assignee: a, points: 3, status: 'todo' },
      { sprint: 5, title: 'Apply a GoF pattern to a core component',            assignee: b, points: 2, status: 'todo' },
      { sprint: 5, title: 'Create component/module diagram',                    assignee: c, points: 2, status: 'todo' },
      { sprint: 5, title: 'Document trade-offs for architecture decision',      assignee: d, points: 1, status: 'todo' },
      { sprint: 5, title: 'Run formal code review on a pull request',           assignee: a, points: 2, status: 'todo' },
      { sprint: 5, title: 'Set up linting and static analysis',                 assignee: b, points: 2, status: 'todo' },
      { sprint: 5, title: 'Write team code review checklist',                   assignee: c, points: 1, status: 'todo' },
      { sprint: 5, title: 'Address review findings on core module',             assignee: d, points: 2, status: 'todo' },
      // Sprint 6 — Config/Dependency Management + CI/CD (weeks 12-13)
      { sprint: 6, title: 'Set up Git branching strategy (GitFlow)',            assignee: a, points: 2, status: 'todo' },
      { sprint: 6, title: 'Resolve merge conflicts in feature branches',        assignee: b, points: 1, status: 'todo' },
      { sprint: 6, title: 'Audit dependencies and patch vulnerabilities',       assignee: c, points: 2, status: 'todo' },
      { sprint: 6, title: 'Tag release v1.0.0 with changelog',                  assignee: d, points: 1, status: 'todo' },
      { sprint: 6, title: 'Configure CI pipeline for automated builds',         assignee: a, points: 3, status: 'todo' },
      { sprint: 6, title: 'Add automated test gate to the pipeline',            assignee: b, points: 2, status: 'todo' },
      { sprint: 6, title: 'Design deployment strategy (delivery vs deploy)',    assignee: c, points: 2, status: 'todo' },
      { sprint: 6, title: 'Final demo preparation and slide deck',              assignee: d, points: 2, status: 'todo' },
    ]

    const ticketRows = tickets.map((t, i) => ({
      student_id: user.id,
      course_id: course.id,
      ticket_id: `${prefix}-S${t.sprint}-${String((i % 8) + 1).padStart(2, '0')}`,
      sprint_number: t.sprint,
      title: t.title,
      assignee_name: t.assignee,
      story_points: t.points,
      status: t.status,
    }))

    const { error: ticketErr } = await service.from('sprint_tickets').insert(ticketRows)
    if (ticketErr) return NextResponse.json({ error: `Ticket seeding failed: ${ticketErr.message}` }, { status: 500 })

    return NextResponse.json({ project: project.name, team })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
