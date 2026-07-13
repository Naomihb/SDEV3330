'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Week {
  id: string
  week_number: number
  topic: string
  is_active: boolean
  due_date: string
  has_submission: boolean
}

export default function ManageWeeksPage() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/instructor/weeks', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setWeeks(await res.json())
      else setApiError(`Failed to load weeks (${res.status})`)
      setLoading(false)
    }
    load()
  }, [])

  async function setActive(weekId: string, active: boolean) {
    setActivating(weekId)
    setApiError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/instructor/weeks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ weekId, active }),
    })
    if (res.ok) {
      setWeeks(prev => prev.map(w => w.id === weekId ? { ...w, is_active: active } : w))
    } else {
      const body = await res.json().catch(() => ({}))
      setApiError(body.error ?? `Error ${res.status}`)
    }
    setActivating(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-semibold text-gray-900">Manage weeks</h1>
      <p className="text-sm text-gray-500">Activate a week to make its activity visible to students. Multiple weeks can be active simultaneously.</p>

      {apiError && (
        <p className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg">{apiError}</p>
      )}

      <div className="space-y-2">
        {weeks.map(week => (
          <div key={week.id}
            className={`bg-white rounded-xl border px-4 py-3 flex items-center justify-between ${
              week.is_active ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-200'
            }`}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  Week {week.week_number} — {week.topic}
                </span>
                {week.is_active && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-0.5">Active</span>
                )}
                {!week.has_submission && (
                  <span className="text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">No submission</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Due {week.due_date ? new Date(week.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
              </p>
            </div>
            <div className="flex gap-2">
              {week.is_active ? (
                <button onClick={() => setActive(week.id, false)} disabled={activating === week.id}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 disabled:opacity-40 transition-colors">
                  {activating === week.id ? '…' : 'Deactivate'}
                </button>
              ) : (
                <button onClick={() => setActive(week.id, true)} disabled={activating === week.id}
                  className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 disabled:opacity-40 transition-colors">
                  {activating === week.id ? '…' : 'Activate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
