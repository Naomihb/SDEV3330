'use client'
import { useState } from 'react'

type TeamMember = { avatarInitials: string; avatarBg: string; avatarText: string; moodTendency: string }
type Student = {
  studentId: string; fullName: string; projectName: string; status: string
  teamConfig: TeamMember[]
  scenario: string
  submission: { id: string; responseText: string; submittedAt: string } | null
  feedback: { grade: string; feedback_text: string } | null
}

const GRADE_OPTIONS = [
  { value:'strong',         label:'Strong',         active:'bg-green-50 text-green-700 border-green-300' },
  { value:'satisfactory',   label:'Satisfactory',   active:'bg-amber-50 text-amber-700 border-amber-300' },
  { value:'needs_revision', label:'Needs revision', active:'bg-red-50 text-red-700 border-red-300' },
]
const GRADE_BADGE: Record<string,string> = {
  strong: 'bg-green-50 text-green-700 border-green-200',
  satisfactory: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_revision: 'bg-red-50 text-red-700 border-red-200',
}
const GRADE_LABEL: Record<string,string> = { strong:'Strong', satisfactory:'Satisfactory', needs_revision:'Needs revision' }

export default function DemoInstructorClient({ students }: { students: Student[] }) {
  const [filter, setFilter] = useState<'all'|'submitted'|'not_started'>('all')
  const [selected, setSelected] = useState<Student | null>(null)
  const [grades, setGrades] = useState<Record<string,string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string,string>>({})
  const [saved, setSaved] = useState<Record<string,boolean>>({})

  const filtered = filter === 'all' ? students : students.filter(s => s.status === filter)
  const submitted = students.filter(s => s.status === 'submitted').length
  const notStarted = students.filter(s => s.status === 'not_started').length
  const reviewed = students.filter(s => s.feedback).length

  function selectStudent(s: Student) {
    setSelected(s)
    if (!grades[s.studentId]) setGrades(g => ({ ...g, [s.studentId]: s.feedback?.grade ?? '' }))
    if (!feedbacks[s.studentId]) setFeedbacks(f => ({ ...f, [s.studentId]: s.feedback?.feedback_text ?? '' }))
  }

  function saveFeedback() {
    if (!selected) return
    setSaved(s => ({ ...s, [selected.studentId]: true }))
  }

  const grade = selected ? (grades[selected.studentId] ?? '') : ''
  const feedbackText = selected ? (feedbacks[selected.studentId] ?? '') : ''

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="max-w-6xl">
        <div className="mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Week 5 — Scrum Framework</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label:'Enrolled',    val: students.length, color:'text-gray-900' },
            { label:'Submitted',   val: submitted,       color:'text-green-600' },
            { label:'Not started', val: notStarted,      color:'text-red-500' },
            { label:'Reviewed',    val: reviewed,        color:'text-violet-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-semibold ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Student grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Week 5 submissions</span>
              <div className="flex gap-1 ml-auto">
                {(['all','submitted','not_started'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`text-xs rounded-full px-3 py-1 border transition-colors ${filter===f?'bg-violet-50 text-violet-700 border-violet-200':'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {f==='all'?'All':f==='submitted'?'Submitted':'Not started'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(row => (
                <button key={row.studentId} onClick={() => selectStudent(row)}
                  className={`text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all
                    ${row.status==='submitted'?'border-l-4 border-l-green-400':'border-l-4 border-l-red-400'}
                    ${selected?.studentId===row.studentId?'ring-2 ring-violet-400 ring-offset-1':''}`}>
                  <p className="text-sm font-medium text-gray-900 truncate">{row.fullName}</p>
                  <p className="text-xs text-gray-400 truncate mb-2">{row.projectName}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {row.teamConfig.map((m,i) => (
                        <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${m.avatarBg} ${m.avatarText}`}>{m.avatarInitials}</div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${row.status==='submitted'?'bg-green-400':'bg-red-400'}`} />
                      <span className={`text-xs ${row.status==='submitted'?'text-green-600':'text-red-500'}`}>
                        {row.status==='submitted'?'Submitted':'Not started'}
                      </span>
                      {(row.feedback || saved[row.studentId]) && <span className="text-xs text-violet-500 ml-1">✓ Reviewed</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Review panel */}
          <div className="w-80 shrink-0 bg-gray-50 border border-gray-200 rounded-xl p-5">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 text-sm text-gray-400 text-center gap-2">
                <span className="text-2xl">☞</span>
                Select a student to review
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <p className="font-semibold text-gray-900">{selected.fullName}</p>
                  <p className="text-xs text-gray-400">{selected.projectName} · Week 5</p>
                </div>
                <div className="flex gap-1 mb-4">
                  {selected.teamConfig.map((m,i) => (
                    <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium ${m.avatarBg} ${m.avatarText}`}>{m.avatarInitials}</div>
                  ))}
                </div>
                <hr className="border-gray-200 mb-4" />
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Scenario</p>
                  <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-200 rounded-lg p-2.5">{selected.scenario}</p>
                </div>
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
                          <button key={g.value}
                            onClick={() => setGrades(prev => ({ ...prev, [selected.studentId]: g.value }))}
                            className={`flex-1 text-xs border rounded-lg py-1.5 font-medium transition-colors
                              ${grade===g.value ? g.active : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Feedback</p>
                      <textarea rows={3} value={feedbackText}
                        onChange={e => setFeedbacks(prev => ({ ...prev, [selected.studentId]: e.target.value }))}
                        placeholder={`Leave feedback for ${selected.fullName.split(' ')[0]}…`}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-white" />
                    </div>
                    <button onClick={saveFeedback} disabled={!grade}
                      className="w-full bg-violet-600 text-white text-sm rounded-lg py-2 hover:bg-violet-700 disabled:opacity-40 transition-colors">
                      {saved[selected.studentId] ? '✓ Saved' : 'Send feedback'}
                    </button>
                    {saved[selected.studentId] && grade && (
                      <div className={`mt-3 text-xs border rounded-lg px-3 py-2 ${GRADE_BADGE[grade]}`}>
                        Marked as: {GRADE_LABEL[grade]}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-8 text-sm text-gray-400 text-center gap-2">
                    <span className="text-xl">⏳</span>
                    No response submitted yet
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
