'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ticket = { id: string; ticket_id: string; title: string; status: string; assignee_name: string; story_points: number; is_blocked: boolean }

export default function SprintBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [sprintNumber, setSprintNumber] = useState(1)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Derive current sprint from highest active week (weeks 2–13, 2 weeks per sprint)
      const { data: activeWeeks } = await supabase
        .from('weeks').select('week_number').eq('is_active', true).order('week_number', { ascending: false })
      const highestActive = activeWeeks?.[0]?.week_number ?? 2
      const sprint = Math.max(1, Math.min(6, Math.ceil((highestActive - 1) / 2)))
      setSprintNumber(sprint)

      const { data } = await supabase
        .from('sprint_tickets').select('*')
        .eq('student_id', user.id).eq('sprint_number', sprint).order('ticket_id')
      setTickets(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function move(id: string, status: string) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await createClient().from('sprint_tickets').update({ status }).eq('id', id)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>

  const cols: { key: 'todo' | 'in_progress' | 'done'; label: string }[] = [
    { key: 'todo', label: 'To do' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Sprint {sprintNumber}</p>
    <div className="grid grid-cols-3 gap-4">
      {cols.map(col => {
        const colTickets = tickets.filter(t => t.status === col.key)
        const others = cols.filter(c => c.key !== col.key)
        return (
          <div key={col.key}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{colTickets.length}</span>
            </div>
            <div className="space-y-2">
              {colTickets.map(ticket => (
                <div key={ticket.id} className={`bg-white rounded-lg border p-3 ${ticket.is_blocked ? 'border-amber-300' : 'border-gray-200'}`}>
                  <p className="text-xs text-gray-400 mb-1">{ticket.ticket_id}</p>
                  <p className="text-sm text-gray-900 mb-2 leading-snug">{ticket.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{ticket.assignee_name?.split(' ')[0]}{ticket.is_blocked && <span className="text-amber-600 ml-1">blocked</span>}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{ticket.story_points}pt</span>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {others.map(o => (
                      <button key={o.key} onClick={() => move(ticket.id, o.key)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5">
                        → {o.label}
                      </button>
                    ))}
                  </div>
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
)}
    </div>
    </div>
  )
}
