'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StudentDashboard() {
  const [data, setData] = useState<{team: any, tickets: any[], week: any, submissionCount: number} | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: team }, { data: tickets }, { data: activeWeek }, { data: subs }] = await Promise.all([
        supabase.from('team_assignments').select('*').eq('student_id', user.id).single(),
        supabase.from('sprint_tickets').select('*').eq('student_id', user.id).eq('sprint_number', 1),
        supabase.from('weeks').select('*').eq('is_active', true).single(),
        supabase.from('submissions').select('id').eq('student_id', user.id),
      ])
      setData({ team, tickets: tickets ?? [], week: activeWeek, submissionCount: subs?.length ?? 0 })
    }
    load()
  }, [])

  if (!data) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>

  const { team, tickets, week, submissionCount } = data
  const done = tickets.filter(t => t.status === 'done').length
  const total = tickets.length

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">{team?.project_name ?? 'Loading…'}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Sprint progress</p>
          <p className="text-2xl font-semibold text-gray-900">{done}/{total}</p>
          <p className="text-xs text-gray-400 mt-0.5">tickets done</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Submissions</p>
          <p className="text-2xl font-semibold text-gray-900">{submissionCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">this semester</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Active week</p>
          <p className="text-base font-semibold text-gray-900">{week?.topic ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Week {week?.week_number}</p>
        </div>
      </div>
      {week && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5">
          <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">
            Week {week.week_number} · due {week.due_date}
          </span>
          <h2 className="text-base font-semibold text-gray-900">{week.topic}</h2>
          <p className="text-sm text-gray-500 mt-1">{week.description}</p>
          <Link href="/student/activity" className="inline-block mt-3 bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
            Go to this week →
          </Link>
        </div>
      )}
    </div>
  )
}
