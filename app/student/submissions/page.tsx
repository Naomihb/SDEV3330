'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const GRADE_STYLES: Record<string, string> = {
  E: 'bg-green-50 text-green-700 border-green-200',
  S: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  U: 'bg-red-50 text-red-700 border-red-200',
  I: 'bg-amber-50 text-amber-700 border-amber-200',
}
const GRADE_LABELS: Record<string, string> = { E: 'Excellent', S: 'Satisfactory', U: 'Unsatisfactory', I: 'Incomplete' }

export default function SubmissionsPage() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('submissions')
        .select('*, weeks(week_number, topic), scenarios(content), feedback(*)')
        .eq('student_id', user.id)
        .order('submitted_at', { ascending: false })
      setSubs(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">My submissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subs.length} submitted this semester</p>
      </div>
      {subs.length === 0 && <p className="text-sm text-gray-400">No submissions yet. Complete this week&apos;s activity to get started.</p>}
      <div className="space-y-4">
        {subs.map(sub => {
          const fb = sub.feedback?.[0]
          return (
            <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-400">Week {sub.weeks?.week_number}</span>
                  <h2 className="text-sm font-semibold text-gray-900">{sub.weeks?.topic}</h2>
                </div>
                {fb && <span className={`text-xs border rounded-full px-2.5 py-0.5 ${GRADE_STYLES[fb.grade]}`}>{GRADE_LABELS[fb.grade]}</span>}
              </div>
              {sub.scenarios?.content && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
                  <span className="font-medium text-gray-600">Scenario: </span>{sub.scenarios.content}
                </div>
              )}
              <p className="text-sm text-gray-700 leading-relaxed">{sub.response_text}</p>
              {fb && (
                <div className={`mt-3 p-3 border rounded-lg text-sm ${GRADE_STYLES[fb.grade]}`}>
                  <span className="font-medium text-xs uppercase tracking-wide opacity-70">Instructor feedback</span>
                  <p className="mt-1">{fb.feedback_text}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
