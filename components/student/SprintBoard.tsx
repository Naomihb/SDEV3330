'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TeamMember } from '@/lib/types'
import {
  sprintForWeek, sprintWeekRange, ticketTargetsForWeek, ticketUpdatesToApply,
  type SimTicket, type TicketTarget,
} from '@/lib/sim/teamSim'

type Ticket = SimTicket & { story_points: number }

export default function SprintBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [sprintNumber, setSprintNumber] = useState(1)
  const [weekNumber, setWeekNumber] = useState(2)

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
      setWeekNumber(week)
      setSprintNumber(sprint)

      const [ticketsRes, teamRes] = await Promise.all([
        supabase.from('sprint_tickets').select('*')
          .eq('student_id', user.id).eq('sprint_number', sprint).order('ticket_id'),
        supabase.from('team_assignments').select('team_config').eq('student_id', user.id).single(),
      ])
      let rows = (ticketsRes.data ?? []) as Ticket[]
      const team = ((teamRes.data as { team_config: TeamMember[] } | null)?.team_config ?? [])

      // Weekly simulation: teammates advance their tickets; blocked items surface.
      // Idempotent and monotonic — never reverts the student's own moves.
      if (rows.length > 0 && team.length > 0) {
        const targets = ticketTargetsForWeek(rows, team, week, user.id)
        const updates = ticketUpdatesToApply(rows, targets)
        for (const u of updates) {
          const { id, ...fields } = u
          await supabase.from('sprint_tickets').update(fields).eq('id', id)
        }
        const targetById = new Map<string, TicketTarget>(targets.map(t => [t.id, t]))
        rows = rows.map(t => {
          const u = updates.find(x => x.id === t.id)
          return u ? { ...t, status: u.status ?? t.status, is_blocked: u.is_blocked ?? t.is_blocked } : t
        })
        const cm: Record<string, string> = {}
        for (const t of rows) {
          const target = targetById.get(t.id)
          if (t.is_blocked && target?.comment) cm[t.id] = target.comment
        }
        setComments(cm)
      }

      setTickets(rows)
      setLoading(false)
    }
    load()
  }, [])

  async function move(id: string, status: string) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, is_blocked: status === 'done' ? false : t.is_blocked } : t))
    const fields: { status: string; is_blocked?: boolean } = { status }
    if (status === 'done') fields.is_blocked = false
    await createClient().from('sprint_tickets').update(fields).eq('id', id)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const [wStart, wEnd] = sprintWeekRange(sprintNumber)

  if (tickets.length === 0) return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Sprint {sprintNumber} board</h1>
      <p className="text-xs text-gray-400 mb-4">Weeks {wStart}–{wEnd} · currently week {weekNumber}</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
        No tickets in Sprint {sprintNumber} yet. Visit the <a href="/student/backlog" className="underline font-medium">backlog</a> and
        pull items into this sprint — that&apos;s your job as Scrum Master.
      </div>
    </div>
  )

  const cols: { key: 'todo' | 'in_progress' | 'done'; label: string }[] = [
    { key: 'todo', label: 'To do' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'done', label: 'Done' },
  ]
  const blockedCount = tickets.filter(t => t.is_blocked && t.status !== 'done').length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sprint {sprintNumber} board</h1>
          <p className="text-xs text-gray-400 mt-0.5">Weeks {wStart}–{wEnd} · currently week {weekNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {blockedCount > 0 && (
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded px-2 py-0.5">
              {blockedCount} blocked — needs your attention
            </span>
          )}
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">{tickets.filter(t => t.status === 'done').length}/{tickets.length} done</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {cols.map(col => (
          <div key={col.key} className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{col.label}</p>
            <div className="space-y-2">
              {tickets.filter(t => t.status === col.key).map(t => (
                <div key={t.id} className={`bg-white rounded-lg border p-3 text-sm shadow-sm ${t.is_blocked && t.status !== 'done' ? 'border-red-200' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-indigo-500 font-mono mb-0.5">{t.ticket_id}</p>
                      <p className="text-gray-800 text-sm leading-snug">{t.title}</p>
                    </div>
                    {t.is_blocked && t.status !== 'done' && (
                      <span className="shrink-0 text-xs bg-red-50 text-red-500 border border-red-200 rounded px-1.5 py-0.5">Blocked</span>
                    )}
                  </div>
                  {t.is_blocked && t.status !== 'done' && comments[t.id] && (
                    <p className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-2.5 py-2 italic leading-relaxed">
                      &ldquo;{comments[t.id]}&rdquo; — {t.assignee_name.split(' ')[0]}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs text-gray-400">{t.assignee_name.split(' ')[0]} · {t.story_points}pt</span>
                    <select value={t.status} onChange={e => move(t.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white">
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
