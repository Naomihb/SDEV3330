import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const GRADE_STYLES: Record<string, string> = {
  strong: 'bg-green-50 text-green-700 border-green-200',
  satisfactory: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_revision: 'bg-red-50 text-red-700 border-red-200',
}
const GRADE_LABELS: Record<string, string> = {
  strong: 'Strong', satisfactory: 'Satisfactory', needs_revision: 'Needs revision',
}

export default async function SubmissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, weeks(week_number, topic, due_date), scenarios(content), feedback(*)')
    .eq('student_id', user.id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">My submissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">{submissions?.length ?? 0} submitted this semester</p>
      </div>

      {!submissions?.length ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          No submissions yet — head to Weekly activity to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(sub => {
            const week = sub.weeks as { week_number: number; topic: string; due_date: string } | null
            const scenario = sub.scenarios as { content: string } | null
            const fb = (sub.feedback as Array<{ grade: string; feedback_text: string }>)?.[0]
            return (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400">Week {week?.week_number}</span>
                    <h2 className="text-sm font-semibold text-gray-900">{week?.topic}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(sub.submitted_at).toLocaleDateString()}</p>
                  </div>
                  {fb && (
                    <span className={`text-xs border rounded-full px-2.5 py-0.5 ${GRADE_STYLES[fb.grade] ?? ''}`}>
                      {GRADE_LABELS[fb.grade] ?? fb.grade}
                    </span>
                  )}
                </div>
                {scenario && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
                    <span className="font-medium text-gray-600">Scenario: </span>{scenario.content}
                  </div>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{sub.response_text}</p>
                {fb?.feedback_text && (
                  <div className={`mt-3 p-3 border rounded-lg text-sm ${GRADE_STYLES[fb.grade] ?? 'bg-gray-50 border-gray-200'}`}>
                    <span className="font-medium text-xs uppercase tracking-wide opacity-70">Instructor feedback</span>
                    <p className="mt-1">{fb.feedback_text}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
