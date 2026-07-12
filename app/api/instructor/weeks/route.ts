import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function getInstructor(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const supabase = createClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // Use user's own client for role check (all authenticated users can read profiles)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'instructor') return null
  const service = createServiceClient()
  return { user, service }
}

// Weeks with a graded submission activity (weeks 2–13 per course schedule)
const SUBMISSION_WEEKS = new Set([2,3,4,5,6,7,8,9,10,11,12,13])

export async function GET(req: NextRequest) {
  try {
    const ctx = await getInstructor(req)
    if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await ctx.service
      .from('weeks')
      .select('id, week_number, topic, prior_topics, is_active, due_date')
      .order('week_number')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    type WeekRow = { week_number: number; [key: string]: unknown }
    const enriched = (data ?? [] as WeekRow[]).map((w: WeekRow) => ({ ...w, has_submission: SUBMISSION_WEEKS.has(w.week_number) }))
    return NextResponse.json(enriched)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getInstructor(req)
    if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { weekId, active } = await req.json()
    if (!weekId) return NextResponse.json({ error: 'weekId required' }, { status: 400 })

    const { data: targetWeek } = await ctx.service.from('weeks').select('course_id').eq('id', weekId).single()
    if (!targetWeek) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

    // Just toggle the target week — other weeks are unaffected
    const { error } = await ctx.service
      .from('weeks')
      .update({ is_active: active !== false })
      .eq('id', weekId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
