import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Promote the signed-in user to instructor when they present the secret
// instructor code (INSTRUCTOR_JOIN_CODE env var). No SQL required.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const expected = process.env.INSTRUCTOR_JOIN_CODE
    if (!expected) {
      return NextResponse.json({ error: 'Instructor claim is not configured (INSTRUCTOR_JOIN_CODE not set).' }, { status: 500 })
    }

    const { code } = await req.json()
    if (!code || code !== expected) {
      return NextResponse.json({ error: 'Invalid instructor code' }, { status: 403 })
    }

    const service = createServiceClient()
    const { error } = await service
      .from('profiles')
      .upsert(
        { id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Instructor', role: 'instructor' },
        { onConflict: 'id' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
  }
}
