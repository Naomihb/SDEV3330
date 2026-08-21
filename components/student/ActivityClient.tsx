'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ScenarioRow = { id: string; content: string }
type SubRow = { response_text: string }

export default function ActivityClient({ week }: { week: any }) {
  const [scenario, setScenario] = useState<string | null>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user || !session) { setError('Not logged in'); setLoading(false); return }

      // Always check for existing scenario and submission in parallel
      const [existingScenario, existingSub] = await Promise.all([
        supabase.from('scenarios').select('*').eq('student_id', user.id).eq('week_id', week.id).single()
          .then(r => r.data as ScenarioRow | null),
        supabase.from('submissions').select('*').eq('student_id', user.id).eq('week_id', week.id).single()
          .then(r => r.data as SubRow | null),
      ])

      if (existingSub) { setSubmission(existingSub); setResponse(existingSub.response_text) }

      if (existingScenario) {
        setScenario(existingScenario.content)
        setLoading(false)
        return
      }

      // Generate new scenario
      setGenerating(true)
      try {
        const res = await fetch('/api/scenarios/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ weekId: week.id }),
        })
        const data = await res.json()
        if (!res.ok) setError(data.error?.includes('apiKey') || data.error?.includes('authToken') ? 'Scenario generation is not configured yet — ask your instructor.' : (data.error ?? `Error ${res.status}`))
        else setScenario(data.content)
      } catch (e) {
        setError('Failed to generate scenario. Check your API key.')
      }
      setGenerating(false)
      setLoading(false)
    }
    load()
  }, [week.id])

  async function handleSubmit() {
    setSubmitting(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const scenarioRow = (await supabase
      .from('scenarios').select('id').eq('week_id', week.id).single()
    ).data as { id: string } | null

    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ weekId: week.id, scenarioId: scenarioRow?.id, responseText: response }),
    })
    const data = await res.json()
    setSubmission(data)
    setSubmitting(false)
  }

  if (loading || generating) return (
    <div className="flex items-center gap-3 py-12">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">{generating ? 'Generating your scenario…' : 'Loading…'}</p>
    </div>
  )

  if (error && !submission) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">{error}</div>
  )

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">This week&apos;s scenario</h2>
          <span className="text-xs text-indigo-500 bg-indigo-50 rounded px-2 py-0.5">AI-generated for your team</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{scenario}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Your response</h2>
        <p className="text-xs text-gray-400 mb-3">Write as the Scrum Master. Explain your reasoning.</p>
        {submission ? (
          <div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap mb-3">{response}</div>
            <p className="text-sm text-green-600">✓ Submitted · awaiting instructor review</p>
          </div>
        ) : (
          <>
            <textarea value={response} onChange={e => setResponse(e.target.value)} rows={7}
              placeholder="As Scrum Master, I would…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder-gray-300" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-400">{response.length} chars</span>
              <button onClick={handleSubmit} disabled={submitting || response.trim().length < 50}
                className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-4 py-1.5 rounded-lg transition-colors">
                {submitting ? 'Submitting…' : 'Submit response'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
