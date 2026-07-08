'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  id: string
  student_id: string
  week_id: string
  response_text: string
  created_at: string
  updated_at: string
  profiles: { full_name: string | null; email: string }
  weeks: { week_number: number; topic: string }
  feedback: { grade: string; feedback_text: string | null }[] | null
}

interface FeedbackForm { grade: string; feedback_text: string }

export default function InstructorDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Submission | null>(null)
  const [form, setForm] = useState<FeedbackForm>({ grade: 'S', feedback_text: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [filterWeek, setFilterWeek] = useState<number | 'all'>('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/instructor/submissions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  function selectSub(sub: Submission) {
    setSelected(sub)
    const fb = sub.feedback?.[0]
    setForm({ grade: fb?.grade ?? 'S', feedback_text: fb?.feedback_text ?? '' })
    setMsg('')
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ submissionId: selected.id, grade: form.grade, feedbackText: form.feedback_text }),
    })
    if (res.ok) {
      setMsg('Saved ✓')
      setSubmissions(prev => prev.map(s =>
        s.id === selected.id
          ? { ...s, feedback: [{ grade: form.grade, feedback_text: form.feedback_text }] }
          : s
      ))
      setSelected(prev => prev ? { ...prev, feedback: [{ grade: form.grade, feedback_text: form.feedback_text }] } : prev)
    } else {
      setMsg('Error saving')
    }
    setSaving(false)
  }

  const weeks = Array.from(new Set(submissions.map(s => s.weeks?.week_number))).sort((a, b) => a - b)
  const filtered = filterWeek === 'all' ? submissions : submissions.filter(s => s.weeks?.week_number === filterWeek)
  const graded = filtered.filter(s => s.feedback?.[0])
  const ungraded = filtered.filter(s => !s.feedback?.[0])

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex gap-5 h-[calc(100vh-7rem)]">
      {/* Left panel: submission list */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">Submissions</h1>
          <select value={filterWeek} onChange={e => setFilterWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-xs border border-gray-200 rounded px-2 py-1">
            <option value="all">All weeks</option>
            {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
          </select>
        </div>

        <div className="text-xs text-gray-500">
          {graded.length}/{filtered.length} graded
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 mt-4">No submissions yet.</p>
        )}

        <div className="overflow-y-auto flex-1 space-y-1 pr-1">
          {ungraded.length > 0 && (
            <>
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Needs grading</p>
              {ungraded.map(s => (
                <SubmissionRow key={s.id} sub={s} active={selected?.id === s.id} onClick={() => selectSub(s)} />
              ))}
            </>
          )}
          {graded.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 mt-3">Graded</p>
              {graded.map(s => (
                <SubmissionRow key={s.id} sub={s} active={selected?.id === s.id} onClick={() => selectSub(s)} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Right panel: review + grade */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Select a submission to review
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{selected.profiles?.full_name || selected.profiles?.email}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Week {selected.weeks?.week_number} · {selected.weeks?.topic}
                  </p>
                </div>
                {selected.feedback?.[0] && (
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5">
                    {selected.feedback[0].grade}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Submitted {new Date(selected.updated_at).toLocaleDateString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Student response</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {selected.response_text}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <p className="text-xs font-medium text-gray-500">Grade & feedback</p>
              <div className="flex gap-3 items-center">
                <label className="text-sm text-gray-700">Grade</label>
                <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className="border border-gray-200 rounded px-2 py-1.5 text-sm">
                  <option value="S">S — Satisfactory</option>
                  <option value="U">U — Unsatisfactory</option>
                  <option value="E">E — Excellent</option>
                  <option value="I">I — Incomplete</option>
                </select>
              </div>
              <textarea
                rows={4}
                placeholder="Optional feedback to student…"
                value={form.feedback_text}
                onChange={e => setForm(f => ({ ...f, feedback_text: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex items-center gap-3">
                <button onClick={save} disabled={saving}
                  className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save feedback'}
                </button>
                {msg && <span className={`text-xs ${msg.startsWith('Error') ? 'text-red-500' : 'text-emerald-600'}`}>{msg}</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SubmissionRow({ sub, active, onClick }: { sub: Submission; active: boolean; onClick: () => void }) {
  const hasGrade = !!sub.feedback?.[0]
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors ${
        active ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white hover:bg-gray-50'
      }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 truncate">
          {sub.profiles?.full_name || sub.profiles?.email}
        </span>
        {hasGrade && (
          <span className="text-xs font-bold text-emerald-600 ml-1">{sub.feedback![0].grade}</span>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-0.5">Week {sub.weeks?.week_number} · {sub.weeks?.topic}</p>
    </button>