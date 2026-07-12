import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as { role: string } | null)?.role !== 'instructor')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const service = createServiceClient()

    const { data, error } = await service
      .from('submissions')
      .select(`
        id, student_id, week_id, response_text, created_at, updated_at,
        profiles!submissions_student_id_fkey ( full_name, email ),
        weeks ( week_number, topic ),
        feedback ( grade, feedback_text )
      `)
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server er