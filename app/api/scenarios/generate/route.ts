import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateScenario } from '@/lib/ai/generateScenario'

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
    const { data: existing } = await supabase
      .from('scenarios')
      .select('*')
      .eq('student_id', user.id)
      .eq('week_id', weekId)
      .maybeSingle()

    if (existing) return NextResponse.json({ content: existing.content })

    // Load week and team assignment using user's token
    const { data: week } = await supabase.from('weeks').select('*').eq('id', weekId).single()
    if (!week) return NextResponse.json({ error: 'Week not found — visit /join/cs3330-f26 to enroll first' }, { status: 404 })

    const { data: teamAssignment } = await supabase
      .from('team_assignments')
      .select('project_name, project_description, team_config')
      .eq('student_id', user.id)
      .single()

    if (!teamAssignment) return NextResponse.json({ error: 'No team assignment found — visit /join/cs3330-f26 to enroll first' }, { status: 404 })

    const content = await generateScenario({
      week,
      team: teamAssignment.team_config,
      projectName: teamAssignment.project_name,
      projectDescription: teamAssignment.project_description,
    })

    // Upsert to handle race conditions on concurrent requests
    const service = createServiceClient()
    const { data: scenario, error } = await service
      .from('scenarios')
      .upsert(
        { student_id: user.id, week_id: weekId, content },
        { onConflict: 'student_id,week_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ content: scenario.content })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
