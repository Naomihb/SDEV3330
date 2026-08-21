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
      // Sprint 3 — Estimation & Requirements (weeks 6-7)
      { sprint: 3, title: 'Run planning poker for top 10 backlog items',       assignee: a, points: 2, status: 'todo' },
      { sprint: 3, title: 'Calculate team velocity from sprint 1 and 2',      assignee: b, points: 1, status: 'todo' },
      { sprint: 3, title: 'Conduct stakeholder interviews for requirements',   assignee: c, points: 3, status: 'todo' },
      { sprint: 3, title: 'Write functional requirements specification',       assignee: d, points: 3, status: 'todo' },
      { sprint: 3, title: 'Write non-functional requirements',                 assignee: a, points: 2, status: 'todo' },
      { sprint: 3, title: 'Create acceptance criteria for top 5 stories',     assignee: b, points: 2, status: 'todo' },
      { sprint: 3, title: 'Build burndown chart for current sprint',          assignee: c, points: 1, status: 'todo' },
      { sprint: 3, title: 'Re-estimate backlog based on new requirements',    assignee: d, points: 2, status: 'todo' },
      // Sprint 4 — Requirements Workshop & Git (weeks 8-9)
      { sprint: 4, title: 'Facilitate requirements review workshop',           assignee: a, points: 3, status: 'todo' },
      { sprint: 4, title: 'Create use case diagrams for core flows',          assignee: b, points: 2, status: 'todo' },
      { sprint: 4, title: 'Set up Git branching strategy (GitFlow)',          assignee: c, points: 2, status: 'todo' },
      { sprint: 4, title: 'Configure CI pipeline for automated builds',       assignee: d, points: 3, status: 'todo' },
      { sprint: 4, title: 'Resolve merge conflicts in feature branches',      assignee: a, points: 1, status: 'todo' },
      { sprint: 4, title: 'Tag release v0.1.0 with changelog',               assignee: b, points: 1, status: 'todo' },
      { sprint: 4, title: 'Document dependency management approach',          assignee: c, points: 1, status: 'todo' },
      { sprint: 4, title: 'Traceability matrix: requirements to tickets',     assignee: d, points: 2, status: 'todo' },
      // Sprint 5 — Software Design (weeks 10-11)
      { sprint: 5, title: 'Apply SOLID principles to core module design',     assignee: a, points: 3, status: 'todo' },
      { sprint: 5, title: 'Identify and refactor code smells in codebase',    assignee: b, points: 2, status: 'todo' },
      { sprint: 5, title: 'Choose and document architectural style',          assignee: c, points: 3, status: 'todo' },
      { sprint: 5, title: 'Apply a GoF pattern to a core component',         assignee: d, points: 2, status: 'todo' },
      { sprint: 5, title: 'Create component/module diagram',                  assignee: a, points: 2, status: 'todo' },
      { sprint: 5, title: 'Peer design review with written feedback',         assignee: b, points: 1, status: 'todo' },
      { sprint: 5, title: 'Document trade-offs for architecture decision',    assignee: c, points: 1, status: 'todo' },
      { sprint: 5, title: 'Refactor one class to meet SRP',                  assignee: d, points: 1, status: 'todo' },
      // Sprint 6 — Code Reviews & XP/Lean/Kanban (weeks 12-13)
      { sprint: 6, title: 'Run formal code review on pull request',           assignee: a, points: 2, status: 'todo' },
      { sprint: 6, title: 'Set up linting and static analysis in CI',        assignee: b, points: 2, status: 'todo' },
      { sprint: 6, title: 'Implement one XP practice (TDD or pair prog)',     assignee: c, points: 3, status: 'todo' },
      { sprint: 6, title: 'Create Kanban board with WIP limits',             assignee: d, points: 1, status: 'todo' },
      { sprint: 6, title: 'Identify waste in current process (Lean)',        assignee: a, points: 1, status: 'todo' },
      { sprint: 6, title: 'Write post-mortem: what did our process do well?',assignee: b, points: 2, status: 'todo' },
      { sprint: 6, title: 'Final demo preparation and slide deck',           assignee: c, points: 2, status: 'todo' },
      { sprint: 6, title: 'Team retrospective: lessons learned',             assignee: d, points: 1, status: 'todo' },
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
