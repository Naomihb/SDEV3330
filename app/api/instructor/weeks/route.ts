import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function getInstructor(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = createClient(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role: string } | null)?.role !== 'instructor') return null
  const service = createServiceClient()
  return { user, service, supabase }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getInstructor(req)
    if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await ctx.service
      .from('weeks')
      .select('*, submissions(id)')
      .order('week_number')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const SUBMISSION_WEEKS = new Set([2,3,4,5,6,7,8,9,10,11,12,13])
    const weeks = (data ?? []).map((w: Record<string, unknown>) => ({
      ...w,
      has_submission: SUBMISSION_WEEKS.has(w.week_number as number),
    }))

    return NextResponse.json(weeks)
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

    // Verify week exists
    const { data: week } = await ctx.service.from('weeks').select('id').eq('id', weekId).single()
    if (!week) return NextResponse.json({ error: 'Week not found' }, { status: 404 })

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
