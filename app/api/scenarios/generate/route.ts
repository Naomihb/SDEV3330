import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateScenario } from '@/lib/ai/generateScenario'
import type { Week, TeamMember } from '@/lib/types'

type TeamAssignmentRow = { project_name: string; project_description: string; team_config: TeamMember[] }
type ScenarioRow = { content: string }

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weekId } = await req.json()
    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 })

    // Check for existing scenario (idempotent)
    const existing = (await supabase
      .from('scenarios')
      .select('content')
      .eq('student_id', user.id)
      .eq('week_id', weekId)
      .maybeSingle()
    ).data as ScenarioRow | null

    if (existing) return NextResponse.json({ content: existing.content })

    // Load week and team assignment using user's token
    const week = (await supabase.from('weeks').select('*').eq('id', weekId).single()).data as Week | null
    if (!week) return NextResponse.json({ error: 'Week not found — visit /join/cs3330-f26 to enroll first' }, { status: 404 })

    const teamAssignment = (await supabase
      .from('team_assignments')
      .select('project_name, project_description, team_config')
      .eq('student_id', user.id)
      .single()
    ).data as TeamAssignmentRow | null

    if (!teamAssignment) return NextResponse.json({ error: 'No team assignment found — visit /join/cs3330-f26 to enroll first' }, { status: 404 })

    const content = await generateScenario({
      week,
      team: teamAssignment.team_config,
      projectName: teamAssignment.project_name,
      projectDescription: teamAssignment.project_description,
    })

    // Upsert to handle race conditions on concurrent requests
    const service = createServiceClient()
    const { data: scenarioRaw, error } = await service
      .from('scenarios')
      .upsert(
        { student_id: user.id, week_id: weekId, content },
        { onConflict: 'student_id,week_id' }
      )
      .select('content')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const scenario = scenarioRaw as ScenarioRow | null
    return NextResponse.json({ content: scenario?.content ?? content })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
