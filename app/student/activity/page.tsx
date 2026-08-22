'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ActivityClient from '@/components/student/ActivityClient'
import { resolveCurrentWeek, SUBMISSION_WEEKS, type WeekRow } from '@/lib/weeks'

export default function ActivityPage() {
  const [week, setWeek] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('weeks').select('*')
      setWeek(resolveCurrentWeek((data ?? []) as WeekRow[]))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!week) return (
    <div className="max-w-3xl">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
        No course weeks found — ask your instructor.
      </div>
    </div>
  )

  if (!SUBMISSION_WEEKS.has(week.week_number)) return (
    <div className="max-w-3xl">
      <div className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-4">
        Week {week.week_number} · due {week.due_date}
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{week.topic}</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-600">
        {week.description ?? 'No submission activity this week.'} There is no graded submission for this week.
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-4">
        Week {week.week_number} · due {week.due_date}
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{week.topic}</h1>
      <ActivityClient week={week} />
    </div>
  )
}
