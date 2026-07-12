import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as { role: string } | null)?.role !== 'instructor')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { submissionId, grade, feedbackText } = await req.json()
    if (!submissionId || !grade || !feedbackText)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const validGrades = ['S', 'U', 'E', 'I']
    if (!validGrades.includes(grade))
      return NextResponse.json({ error: 'Invalid grade. Must be S, U, E, or I' }, { status: 400 })

    const { data, error } = await service
      .from('submissions')
      .update({ grade, feedback_text: feedbackText, reviewed_at: new Date().toISOString() })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
