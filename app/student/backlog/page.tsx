'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sprintForWeek, sprintWeekRange, type SimTicket } from '@/lib/sim/teamSim'

type Ticket = SimTicket & { story_points: number; sprint_number: number }

export default function BacklogPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentSprint, setCurrentSprint] = useState(1)
  const [loading, setLoading] = useState(true)
  const [pulling, setPulling] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const activeWeeks = (await supabase
        .from('weeks').select('week_number').eq('is_active', true).order('week_number', { ascending: false })
      ).data as { week_number: number }[] | null
      const week = activeWeeks?.[0]?.week_number ?? 2
      const sprint = sprintForWeek(week)
      setCurrentSprint(sprint)

      const rows = (await supabase
        .from('sprint_tickets').select('*')
        .eq('student_id', user.id)
        .order('sprint_number').order('ticket_id')
      ).data as Ticket[] | null
      setTickets(rows ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function pullIntoSprint(ticket: Ticket) {
    setPulling(ticket.id)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase
      .from('sprint_tickets')
      .update({ sprint_number: currentSprint, status: 'todo' })
      .eq('id', ticket.id)
    if (error) {
      setMessage(`Could not pull ${ticket.ticket_id}: ${error.message}`)
    } else {
      setTickets(prev => prev.map(t =>
        t.id === ticket.id ? { ...t, sprint_number: currentSprint, status: 'todo' } : t
      ))
      setMessage(`${ticket.ticket_id} pulled into Sprint ${currentSprint} — it's now on your sprint board.`)
    }
    setPulling(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const current = tickets.filter(t => t.sprint_number === currentSprint)
  const backlogSprints = Array.from(
    new Set(tickets.filter(t => t.sprint_number > currentSprint).map(t => t.sprint_number))
  ).sort((a, b) => a - b)
  const currentPoints = current.reduce((s, t) => s + (t.story_points ?? 1), 0)

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Product backlog</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upcoming work in priority order. As Scrum Master you can pull an item into the current sprint —
          but every point you add is scope your team has to absorb.
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
        <span className="text-sm text-indigo-800 font-medium">
          Sprint {currentSprint} (current) — {current.length} tickets · {currentPoints} points committed
        </span>
        <span className="text-xs text-indigo-500">
          {current.filter(t => t.status === 'done').length}/{current.length} done
        </span>
      </div>

      {message && (
        <p className={`text-xs rounded-lg px-3 py-2 mb-4 ${message.startsWith('Could not') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </p>
      )}

      {backlogSprints.length === 0 && (
        <p className="text-sm text-gray-400">The backlog is empty — everything is in the current sprint or done.</p>
      )}

      <div className="space-y-6">
        {backlogSprints.map(sprint => {
          const items = tickets.filter(t => t.sprint_number === sprint)
          const [wStart, wEnd] = sprintWeekRange(sprint)
          return (
            <div key={sprint}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Sprint {sprint} · planned for weeks {wStart}–{wEnd}
              </p>
              <div className="space-y-2">
                {items.map(t => (
                  <div key={t.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-indigo-500 font-mono">{t.ticket_id}</p>
                      <p className="text-sm text-gray-800 truncate">{t.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.assignee_name.split(' ')[0]} · {t.story_points}pt</p>
                    </div>
                    <button
                      onClick={() => pullIntoSprint(t)}
                      disabled={pulling === t.id}
                      className="shrink-0 text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 rounded-lg px-3 py-1.5 transition-colors">
                      {pulling === t.id ? 'Pulling…' : `Pull into Sprint ${currentSprint}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
