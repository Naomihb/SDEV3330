'use client'

import { useState } from 'react'

type StudentRow = {
  studentId: string; fullName: string; email: string; projectName: string;
  teamConfig: Array<{ avatarInitials: string; avatarBg: string; avatarText: string; moodTendency: string }>
  submission: { id: string; responseText: string; submittedAt: string } | null
  scenario: { content: string } | null
  feedback: { grade: string; feedback_text: string } | null
  status: string
}

type Week = { id: string; week_number: number; topic: string; due_date: string | null; is_active: boolean }

const GRADE_OPTIONS = [
  { value: 'strong',        label: 'Strong',        style: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' },
  { value: 'satisfactory',  label: 'Satisfactory',  style: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' },
  { value: 'needs_revision',label: 'Needs revision', style: 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100' },
]

const STATUS_BORDER: Record<string, string> = {
  submitted: 'border-l-4 border-l-green-400',
  not_started: 'border-l-4 border-l-red-400',
}

export default function InstructorDashboardClient({ activeWeek, weeks, studentRows }: {
  activeWeek: Week; weeks: Week[]; studentRows: StudentRow[]
}) {
  const [filter, setFilter] = useState<'all' | 'submitted' | 'not_started'>('all')
  const [selected, setSelected] = useState<StudentRow | null>(null)
  const [grade, setGrade] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedFor, setSavedFor] = useState<string | null>(null)

  const filtered = filter === 'all' ? studentRows : studentRows.filter(s => s.status === filter)
  const submitted = studentRows.filter(s => s.status === 'submitted').length
  const notStarted = studentRows.filter(s => s.status === 'not_started').length

  function selectStudent(row: StudentRow) {
    setSelected(row)
    setGrade(row.feedback?.grade ?? '')
    setFeedbackText(row.feedback?.feedback_text ?? '')
  }

  async function saveFeedback() {
    if (!selected?.submission || !grade) return
    setSaving(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: selected.submission.id, grade, feedbackText }),
      })
      if (res.ok) setSavedFor(selected.studentId)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Week {activeWeek.week_number} — {activeWeek.topic}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Enrolled', value: studentRows.length, color: 'text-gray-900' },
          { label: 'Submitted', value: submitted, color: 'text-green-600' },
          { label: 'Not started', value: notStarted, color: 'text-red-500' },
          { label: 'Reviewed', value: studentRows.filter(s => s.feedback).length, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Student list */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Week {activeWeek.week_number} submissions</span>
            <div className="flex gap-1 ml-auto">
              {(['all', 'submitted', 'not_started'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`text-xs rounded-full px-3 py-1 border transition-colors ${filter === f ? 'bg-violet-50 text-violet-700 border-violet-200' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {f === 'all' ? 'All' : f === 'submitted' ? 'Submitted' : 'Not started'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filtered.map(row => (
              <button
                key={row.studentId}
                onClick={() => selectStudent(row)}
                className={`text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors ${STATUS_BORDER[row.status] ?? ''} ${selected?.studentId === row.studentId ? 'ring-2 ring-violet-400 ring-offset-1' : ''}`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{row.fullName}</p>
                <p className="text-xs text-gray-400 truncate mb-2">{row.projectName}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {row.teamConfig.slice(0, 4).map((m, i) => (
                      <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${m.avatarBg} ${m.avatarText}`}>
                        {m.avatarInitials}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${row.status === 'submitted' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className={`text-xs ${row.status === 'submitted' ? 'text-green-600' : 'text-red-500'}`}>
                      {row.status === 'submitted' ? 'Submitted' : 'Not started'}
                    </span>
                    {row.feedback && <span className="text-xs text-violet-500 ml-1">✓ Reviewed</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Review panel */}
        <div className="w-80 shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-5">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-64 text-sm text-gray-400 text-center">
              <span className="text-2xl mb-2">☞</span>
              Select a student to review
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="font-semibold text-gray-900">{selected.fullName}</p>
                <p className="text-xs text-gray-400">{selected.projectName} · Week {activeWeek.week_number}</p>
              </div>

              {/* Team traits */}
              <div className="space-y-1.5 mb-4">
                {selected.teamConfig.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0 ${m.avatarBg} ${m.avatarText}`}>
                      {m.avatarInitials}
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.moodTendency === 'positive' ? 'bg-green-400' : m.moodTendency === 'negative' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>

              <hr className="border-gray-200 mb-4" />

              {selected.scenario && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Scenario</p>
                  <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-200 rounded-lg p-2.5">{selected.scenario.content}</p>
                </div>
              )}

              {selected.submission ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Student response</p>
                    <div className="text-sm text-gray-800 leading-relaxed bg-white border border-indigo-100 rounded-lg p-3 max-h-36 overflow-y-auto">
                      {selected.submission.responseText}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Grade</p>
                    <div className="flex gap-1.5">
                      {GRADE_OPTIONS.map(g => (
                        <button
                          key={g.value}
                          onClick={() => setGrade(g.value)}
                          className={`flex-1 text-xs border rounded-lg py-1.5 font-medium transition-colors ${grade === g.value ? g.style : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Feedback</p>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      rows={3}
                      placeholder={`Leave feedback for ${selected.fullName.split(' ')[0]}…`}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-white"
                    />
                  </div>

                  <button
                    onClick={saveFeedback}
                    disabled={saving || !grade}
                    className="w-full bg-violet-600 text-white text-sm rounded-lg py-2 hover:bg-violet-700 disabled:opacity-40 transition-colors"
                  >
                    {saving ? 'Saving…' : savedFor === selected.studentId ? '✓ Saved' : 'Send feedback'}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center py-8 text-sm text-gray-400 text-center">
                  <span className="text-xl mb-2">⏳</span>
                  No response submitted yet
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
