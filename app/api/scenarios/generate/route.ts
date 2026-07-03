import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateScenario } from '@/lib/ai/generateScenario'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weekId } = await req.json()
    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 })

    // Return existing scenario if already generated
    const { data: existing } = await supabase
      .from('scenarios')
      .select('*')
      .eq('student_id', user.id)
      .eq('week_id', weekId)
      .single()

    if (existing) return NextResponse.json(existing)

    // Fetch week + team
    const [{ data: week }, { data: team }] = await Promise.all([
      supabase.from('weeks').select('*').eq('id', weekId).single(),
      supabase.from('team_assignments').select('*').eq('student_id', user.id).single(),
    ])

    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })
    if (!team) return NextResponse.json({ error: 'No team assigned' }, { status: 404 })

    const content = await generateScenario({
      week,
      team: team.team_config,
      projectName: team.project_name,
      projectDescription: team.project_description,
    })

    const { data: scenario, error } = await supabase
      .from('scenarios')
      .insert({ student_id: user.id, week_id: weekId, content })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(scenario)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
