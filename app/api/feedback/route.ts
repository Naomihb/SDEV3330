import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'instructor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { submissionId, grade, feedbackText } = await req.json()
    if (!submissionId || !grade) return NextResponse.json({ error: 'submissionId and grade required' }, { status: 400 })

    // Upsert feedback — one per submission
    const { data, error } = await supabase
      .from('feedback')
      .upsert(
        { submission_id: submissionId, instructor_id: user.id, grade, feedback_text: feedbackText ?? null, submitted_at: new Date().toISOString() },
        { onConflict: 'submission_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
