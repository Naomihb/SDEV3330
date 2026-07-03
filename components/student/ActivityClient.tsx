'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  week: { id: string; week_number: number; topic: string; description: string | null; due_date: string | null }
  scenarioContent: string | null
  scenarioId: string | null
  submission: { id: string; response_text: string; feedback?: { grade: string; feedback_text: string }[] } | null
  teamConfig: Array<{ name: string; avatarInitials: string; avatarBg: string; avatarText: string; personalityLabel: string; moodTendency: string }>
  projectName: string
}

export default function ActivityClient({ userId, week, scenarioContent, scenarioId, submission, teamConfig, projectName }: Props) {
  const [scenario, setScenario] = useState(scenarioContent)
  const [currentScenarioId, setCurrentScenarioId] = useState(scenarioId)
  const [response, setResponse] = useState(submission?.response_text ?? '')
  const [saved, setSaved] = useState(!!submission)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function generateScenario() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId: week.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate scenario')
      setScenario(data.content)
      setCurrentScenarioId(data.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  async function saveResponse() {
    if (!response.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId: week.id, scenarioId: currentScenarioId, responseText: response }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const feedback = submission?.feedback?.[0]

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">
          Week {week.week_number} · {week.due_date ? `due ${week.due_date}` : 'in progress'}
        </span>
        <h1 className="text-xl font-semibold text-gray-900">{week.topic}</h1>
        <p className="text-sm text-gray-500 mt-1">{week.description}</p>
      </div>

      {/* Team at a glance */}
      <div className="flex gap-2 mb-5">
        {teamConfig.map(m => (
          <div key={m.name} title={`${m.name} — ${m.personalityLabel}`} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium ${m.avatarBg} ${m.avatarText}`}>
              {m.avatarInitials}
            </div>
            <span className="text-gray-600">{m.name.split(' ')[0]}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${m.moodTendency === 'positive' ? 'bg-green-400' : m.moodTendency === 'negative' ? 'bg-red-400' : 'bg-amber-400'}`} />
          </div>
        ))}
      </div>

      {/* Scenario */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">This week&apos;s scenario</h2>
          {!scenario && !generating && (
            <span className="text-xs text-indigo-500 bg-indigo-50 rounded px-2 py-0.5">Generated just for your team</span>
          )}
        </div>

        {scenario ? (
          <p className="text-sm text-gray-700 leading-relaxed">{scenario}</p>
        ) : generating ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <span className="animate-spin">⟳</span> Generating your scenario…
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">Your personalized scenario for Week {week.week_number} is ready to generate.</p>
            <button
              onClick={generateScenario}
              className="bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
            >
              Generate my scenario
            </button>
          </div>
        )}
      </div>

      {/* Response area */}
      {scenario && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Your response</h2>
          <p className="text-xs text-gray-400 mb-3">Write your response as the Scrum Master of {projectName}. Explain your reasoning.</p>

          {feedback ? (
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{response}</div>
              <div className={`border rounded-lg p-4 ${feedback.grade === 'strong' ? 'bg-green-50 border-green-200' : feedback.grade === 'satisfactory' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${feedback.grade === 'strong' ? 'bg-green-100 text-green-700' : feedback.grade === 'satisfactory' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                    {feedback.grade === 'strong' ? 'Strong' : feedback.grade === 'satisfactory' ? 'Satisfactory' : 'Needs revision'}
                  </span>
                  <span className="text-xs text-gray-400">Instructor feedback</span>
                </div>
                {feedback.feedback_text && <p className="text-sm text-gray-700 mt-1">{feedback.feedback_text}</p>}
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={response}
                onChange={e => { setResponse(e.target.value); setSaved(false) }}
                rows={6}
                placeholder="As Scrum Master, I would…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder-gray-300"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">{response.length} characters</span>
                <div className="flex items-center gap-3">
                  {saved && <span className="text-xs text-green-600">✓ Submitted</span>}
                  {error && <span className="text-xs text-red-600">{error}</span>}
                  <button
                    onClick={saveResponse}
                    disabled={saving || !response.trim()}
                    className="bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    {saving ? 'Submitting…' : saved ? 'Resubmit' : 'Submit response'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
