import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateScenario } from '@/lib/ai/generateScenario'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weekId } = await req.json()
    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 })

    const service = createServiceClient()

    // Use user's client for reads (weeks are public, scenarios + teams use RLS)
    const { data: existing } = await supabase
      .from('scenarios')
      .select('*')
      .eq('student_id', user.id)
      .eq('week_id', weekId)
      .single()
    if (existing) return NextResponse.json(existing)

    const [{ data: week, error: weekErr }, { data: team }] = await Promise.all([
      supabase.from('weeks').select('*').eq('id', weekId).single(),
      supabase.from('team_assignments').select('*').eq('student_id', user.id).single(),
    ])

    if (!week) return NextResponse.json({ error: weekErr?.message ?? 'Week not found' }, { status: 404 })
    if (!team) return NextResponse.json({ error: 'No team assigned — visit /join/cs3330-f26 to enroll first' }, { status: 404 })

    const content = await generateScenario({
      week,
      team: team.team_config,
      projectName: team.project_name,
      projectDescription: team.project_description,
    })

    const { data: scenario, error } = await service
      .from('scenarios')
      .upsert({ student_id: user.id, week_id: weekId, content }, { onConflict: 'student_id,week_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: