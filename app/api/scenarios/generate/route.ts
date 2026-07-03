import { NextResponse } from 'next/server'

// DEMO STUB — restore real implementation from SETUP.md when Supabase + Anthropic are connected.
export async function POST() {
  return NextResponse.json(
    { error: 'Database not configured. Use /demo routes for preview.' },
    { status: 503 }
  )
}
