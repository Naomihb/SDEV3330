'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ticket = {
  id: string
  ticket_id: string
  title: string
  status: string
  assignee_name: string
  story_points: number
  is_blocked: boolean
}

export default function SprintBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [sprintNumber, setSprintNumber] = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const activeWeeks = (await supabase
        .from('weeks').select('week_number').eq('is_active', true).order('week_number', { ascending: false })
      ).data as { week_number: number }[] | null
      const highestActive = activeWeeks?.[0]?.week_number ?? 2
      const sprint = Math.max(1, Math.min(6, Math.ceil((highestActive - 1) / 2)))
      setSprintNumber(sprint)

      const data = (await supabase
        .from('sprint_tickets').select('*')
        .eq('student_id', user.id).eq('sprint_number', sprint).order('ticket_id')
      ).data as Ticket[] | null
      setTickets(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function move(id: string, status: string) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await createClient().from('sprint_tickets').update({ status }).eq('id', id)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cols: { key: 'todo' | 'in_progress' | 'done'; label: string }[] = [
    { key: 'todo', label: 'To do' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Sprint {sprintNumber} board</h1>
        <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">{tickets.filter(t => t.status === 'done').length}/{tickets.length} done</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {cols.map(col => (
          <div key={col.key} className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{col.label}</p>
            <div className="space-y-2">
              {tickets.filter(t => t.status === col.key).map(t => (
                <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-3 text-sm shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-indigo-500 font-mono mb-0.5">{t.ticket_id}</p>
                      <p className="text-gray-800 text-sm leading-snug">{t.title}</p>
                    </div>
                    {t.is_blocked && (
                      <span className="shrink-0 text-xs bg-red-50 text-red-500 border border-red-200 rounded px-1.5 py-0.5">Blocked</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs text-gray-400">{t.assignee_name} · {t.story_points}pt</span>
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
