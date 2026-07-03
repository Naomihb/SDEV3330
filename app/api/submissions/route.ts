import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { weekId, scenarioId, responseText } = await req.json()
    if (!weekId || !responseText?.trim()) {
      return NextResponse.json({ error: 'weekId and responseText required' }, { status: 400 })
    }

    // Upsert — allow resubmission
    const { data, error } = await supabase
      .from('submissions')
      .upsert(
        { student_id: user.id, week_id: weekId, scenario_id: scenarioId ?? null, response_text: responseText, updated_at: new Date().toISOString() },
        { onConflict: 'student_id,week_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
