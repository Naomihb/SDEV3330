import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateTeamAssignment } from '@/utils/teamAssignment'

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()

    // Look up course by join_code
    const { data: course } = await service
      .from('courses')
      .select('id, name')
      .eq('join_code', params.code)
      .single()

    if (!course) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

    // Check not already enrolled
    const { data: existing } = await service
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .single()

    if (existing) return NextResponse.json({ error: 'Already enrolled' }, { status: 409 })

    // Enroll
    await service.from('enrollments').insert({ student_id: user.id, course_id: course.id })

    // Generate team + project
    const { project, team } = generateTeamAssignment(user.id)
    await service.from('team_assignments').insert({
      student_id: user.id,
      course_id: course.id,
      project_name: project.name,
      project_description: project.description,
      team_config: team,
    })

    // Seed sprint tickets
    const prefix = project.name.slice(0, 3).toUpperCase()
    const tickets = [
      { title: 'Set up project repository and CI',     assignee: team[0].name, points: 2 },
      { title: 'Define initial user stories',           assignee: team[0].name, points: 3 },
      { title: 'Design wireframes for core screens',    assignee: team[2].name, points: 3 },
      { title: 'Set up development environment',        assignee: team[1].name, points: 1 },
      { title: 'Write unit tests for core module',      assignee: team[3].name, points: 2 },
      { title: 'Implement authentication flow',         assignee: team[1].name, points: 5, blocked: true },
      { title: 'Build main feature component',          assignee: team[0].name, points: 5 },
      { title: 'QA review of sprint 1 deliverables',   assignee: team[3].name, points: 2 },
    ]
    await service.from('sprint_tickets').insert(
      tickets.map((t, i) => ({
        student_id: user.id,
        course_id: course.id,
        sprint_number: 1,
        ticket_id: `${prefix}-0${i + 1}`,
        title: t.title,
        status: i < 2 ? 'done' : i < 4 ? 'in_progress' : 'todo',
        assignee_name: t.assignee,
        story_points: t.points,
        is_blocked: t.blocked ?? false,
      }))
    )

    return NextResponse.json({ success: true, project: project.name })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
