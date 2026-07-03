'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ticket = {
  id: string; ticket_id: string; title: string;
  status: 'todo' | 'in_progress' | 'done'; assignee_name: string | null;
  story_points: number; is_blocked: boolean
}
type Member = { name: string; avatarInitials: string; avatarBg: string; avatarText: string }

const COLS: { key: Ticket['status']; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
]

export default function SprintBoard({ tickets: initialTickets, userId, teamConfig }: {
  tickets: Ticket[]; userId: string; teamConfig: Member[]
}) {
  const [tickets, setTickets] = useState(initialTickets)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  async function moveTicket(id: string, newStatus: Ticket['status']) {
    setUpdating(id)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    await supabase.from('sprint_tickets').update({ status: newStatus }).eq('id', id)
    setUpdating(null)
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {COLS.map(col => {
        const colTickets = tickets.filter(t => t.status === col.key)
        return (
          <div key={col.key}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{col.label}</span>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{colTickets.length}</span>
            </div>
            <div className="space-y-2">
              {colTickets.map(ticket => {
                const assignee = teamConfig.find(m => m.name === ticket.assignee_name)
                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-lg border p-3 ${ticket.is_blocked ? 'border-amber-300' : 'border-gray-200'} ${updating === ticket.id ? 'opacity-50' : ''}`}
                  >
                    <p className="text-xs text-gray-400 mb-1">{ticket.ticket_id}</p>
                    <p className="text-sm text-gray-900 mb-2 leading-snug">{ticket.title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {assignee && (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${assignee.avatarBg} ${assignee.avatarText}`}>
                            {assignee.avatarInitials}
                          </div>
                        )}
                        <span className="text-xs text-gray-400">{ticket.assignee_name?.split(' ')[0]}</span>
                        {ticket.is_blocked && <span className="text-xs text-amber-600">blocked</span>}
                      </div>
                      <span className="text-xs text-gray-300">{ticket.story_points}pt</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {COLS.filter(c => c.key !== col.key).map(target => (
                        <button
                          key={target.key}
                          onClick={() => moveTicket(ticket.id, target.key)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                        >
                          → {target.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {colTickets.length === 0 && (
                <div className="border-2 border-dashed border-gray-100 rounded-lg p-4 text-center text-xs text-gray-300">
                  Empty
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
