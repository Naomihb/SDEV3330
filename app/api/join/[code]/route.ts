import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateTeamAssignment } from '@/utils/teamAssignment'

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Look up course using user's token (courses are public)
    const { data: course, error: courseErr } = await supabase
      .from('courses')
      .select('id, name')
      .eq('join_code', params.code)
      .single()

    if (!course) return NextResponse.json({ error: courseErr?.message ?? 'Invalid join code' }, { status: 404 })

    const service = createServiceClient()

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

    // Seed sprint tickets across all 6 sprints (weeks 2–13, 2 weeks per sprint)
    const prefix = project.name.slice(0, 3).toUpperCase()
    const [a, b, c, d] = team.map(m => m.name)
    const sprintTickets: { sprint: number; title: string; assignee: string; points: number; blocked?: boolean; status: 'todo' | 'in_progress' | 'done' }[] = [
      // Sprint 1 — SDLC Fundamentals (weeks 2–3)
      { sprint: 1, title: 'Set up project repository and branching strategy', assignee: a, points: 2, status: 'done' },
      { sprint: 1, title: 'Define SDLC model for the project',                assignee: b, points: 3, status: 'done' },
      { sprint: 1, title: 'Write initial product requirements document',       assignee: a, points: 3, status: 'in_progress' },
      { sprint: 1, title: 'Set up development environment for all team members', assignee: c, points: 1, status: 'in_progress' },
      { sprint: 1, title: 'Create project board and assign roles',            assignee: d, points: 1, status: 'todo' },
      { sprint: 1, title: 'Identify project risks and mitigation strategies', assignee: b, points: 2, status: 'todo' },
      { sprint: 1, title: 'Draft project timeline and milestones',            assignee: a, points: 3, status: 'todo' },
      { sprint: 1, title: 'Sprint 1 retrospective and process review',        assignee: d, points: 1, status: 'todo' },
      // Sprint 2 — Agile & Scrum (weeks 4–5)
 