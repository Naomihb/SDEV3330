'use client'

import { useState } from 'react'
import Link from 'next/link'
import DemoLearnTab from './DemoLearnTab'

type Member = { name: string; firstName: string; personalityLabel: string; moodTendency: string; avatarInitials: string; avatarBg: string; avatarText: string; role: string; seniority: string }
type Ticket = { id: string; ticket_id: string; title: string; status: 'todo'|'in_progress'|'done'; assignee_name: string|null; story_points: number; is_blocked: boolean }
type Week = { week_number: number; topic: string; description: string; due_date: string }
type PastSub = { id: string; week: { week_number: number; topic: string }; scenario: string; response: string; grade: string; feedback: string }

const ROLE_LABELS: Record<string, string> = {
  senior_dev: 'Senior developer', junior_dev: 'Junior developer',
  designer: 'Designer', qa_lead: 'QA lead', mid_dev: 'Mid-level developer',
}
const GRADE_STYLES: Record<string, string> = {
  strong: 'bg-green-50 text-green-700 border-green-200',
  satisfactory: 'bg-amber-50 text-amber-700 border-amber-200',
  needs_revision: 'bg-red-50 text-red-700 border-red-200',
}
const GRADE_LABELS: Record<string, string> = { strong: 'Strong', satisfactory: 'Satisfactory', needs_revision: 'Needs revision' }

const NAV = [
  { key: 'dashboard',   icon: '⊞', label: 'Dashboard'       },
  { key: 'activity',    icon: '✦', label: 'Weekly activity'  },
  { key: 'learn',       icon: '◎', label: 'Learn'            },
  { key: 'team',        icon: '⚇', label: 'My team'          },
  { key: 'board',       icon: '☰', label: 'Sprint board'     },
  { key: 'gantt',       icon: '▤', label: 'Gantt chart'      },
  { key: 'metrics',     icon: '◈', label: 'Sprint metrics'   },
  { key: 'submissions', icon: '⊡', label: 'Submissions'      },
]

// ── Gantt data ────────────────────────────────────────────────────────────────
const GANTT_ITEMS = [
  { label: 'Requirements & setup',  start: 1,  end: 3,  color: 'bg-blue-200',   textColor: 'text-blue-800',   type: 'phase' },
  { label: 'Agile / Scrum',         start: 4,  end: 6,  color: 'bg-indigo-200', textColor: 'text-indigo-800', type: 'phase' },
  { label: 'Sprint 1',              start: 4,  end: 7,  color: 'bg-indigo-400', textColor: 'text-white',      type: 'sprint' },
  { label: 'Requirements eng.',     start: 7,  end: 9,  color: 'bg-violet-200', textColor: 'text-violet-800', type: 'phase' },
  { label: 'Sprint 2',              start: 8,  end: 11, color: 'bg-violet-400', textColor: 'text-white',      type: 'sprint' },
  { label: 'Design & code review',  start: 9,  end: 12, color: 'bg-pink-200',   textColor: 'text-pink-800',   type: 'phase' },
  { label: 'Config / CI/CD',        start: 12, end: 14, color: 'bg-orange-200', textColor: 'text-orange-800', type: 'phase' },
  { label: 'Sprint 3',              start: 12, end: 15, color: 'bg-orange-400', textColor: 'text-white',      type: 'sprint' },
  { label: 'Capstone & demo',       start: 15, end: 16, color: 'bg-green-400',  textColor: 'text-white',      type: 'milestone' },
]

// ── Metrics data ──────────────────────────────────────────────────────────────
const VELOCITY = [
  { sprint: 'Sprint 1', planned: 13, completed: 5 },
  { sprint: 'Sprint 2', planned: 15, completed: 0 },
  { sprint: 'Sprint 3', planned: 12, completed: 0 },
]
const BURNDOWN = [
  { day: 'Day 1', ideal: 13, actual: 13 },
  { day: 'Day 2', ideal: 11.1, actual: 12 },
  { day: 'Day 3', ideal: 9.3, actual: 11 },
  { day: 'Day 4', ideal: 7.4, actual: 10 },
  { day: 'Day 5', ideal: 5.6, actual: 8 },
  { day: 'Day 6', ideal: 3.7, actual: 8 },
  { day: 'Day 7', ideal: 1.9, actual: null },
  { day: 'Day 8', ideal: 0, actual: null },
]

function VelocityChart() {
  const max = 18
  const W = 420, H = 160, pad = { t: 10, r: 16, b: 32, l: 36 }
  const bW = 36, gap = 12
  const groupW = bW * 2 + gap
  const totalW = W - pad.l - pad.r
  const groupSpacing = totalW / VELOCITY.length
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + pad.t + pad.b}`} className="overflow-visible">
      {[0,5,10,15,20].filter(v=>v<=max).map(v => {
        const y = pad.t + H - (v / max) * H
        return <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5"/>
          <text x={pad.l - 6} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{v}</text>
        </g>
      })}
      {VELOCITY.map((d, i) => {
        const cx = pad.l + i * groupSpacing + groupSpacing / 2
        const x1 = cx - bW - gap / 2
        const x2 = cx + gap / 2
        const h1 = (d.planned / max) * H
        const h2 = (d.completed / max) * H
        return <g key={d.sprint}>
          <rect x={x1} y={pad.t + H - h1} width={bW} height={h1} rx="3" fill="#a5b4fc"/>
          <rect x={x2} y={pad.t + H - h2} width={bW} height={h2 || 2} rx="3" fill="#4f46e5"/>
          <text x={cx} y={pad.t + H + 18} fontSize="10" fill="#6b7280" textAnchor="middle">{d.sprint}</text>
        </g>
      })}
      <g>
        <rect x={W - 130} y={pad.t} width="12" height="10" rx="2" fill="#a5b4fc"/>
        <text x={W - 114} y={pad.t + 9} fontSize="10" fill="#6b7280">Planned</text>
        <rect x={W - 60} y={pad.t} width="12" height="10" rx="2" fill="#4f46e5"/>
        <text x={W - 44} y={pad.t + 9} fontSize="10" fill="#6b7280">Done</text>
      </g>
    </svg>
  )
}

function BurndownChart() {
  const max = 14
  const W = 420, H = 160, pad = { t: 10, r: 16, b: 32, l: 36 }
  const pts = BURNDOWN
  const xStep = (W - pad.l - pad.r) / (pts.length - 1)
  const yFor = (v: number) => pad.t + H - (v / max) * H
  const xFor = (i: number) => pad.l + i * xStep

  const idealPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(p.ideal)}`).join(' ')
  const actualPts = pts.filter(p => p.actual !== null)
  const actualPath = actualPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(pts.indexOf(p))},${yFor(p.actual as number)}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + pad.t + pad.b}`} className="overflow-visible">
      {[0, 5, 10, 13].map(v => {
        const y = yFor(v)
        return <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="0.5"/>
          <text x={pad.l - 6} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{v}</text>
        </g>
      })}
      {pts.map((p, i) => (
        <text key={p.day} x={xFor(i)} y={pad.t + H + 18} fontSize="9" fill="#9ca3af" textAnchor="middle">{p.day.replace('Day ', 'D')}</text>
      ))}
      <path d={idealPath} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3" fill="none"/>
      <path d={actualPath} stroke="#4f46e5" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {actualPts.map(p => (
        <circle key={p.day} cx={xFor(pts.indexOf(p))} cy={yFor(p.actual as number)} r="3" fill="#4f46e5"/>
      ))}
      <g>
        <line x1={W-130} x2={W-118} y1={pad.t+5} y2={pad.t+5} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 3"/>
        <text x={W-114} y={pad.t+9} fontSize="10" fill="#6b7280">Ideal</text>
        <line x1={W-68} x2={W-56} y1={pad.t+5} y2={pad.t+5} stroke="#4f46e5" strokeWidth="2"/>
        <text x={W-52} y={pad.t+9} fontSize="10" fill="#6b7280">Actual</text>
      </g>
    </svg>
  )
}

export default function DemoStudentTabs({ team, tickets, week, scenario, pastSubmissions }: {
  team: Member[]; tickets: Ticket[]; week: Week; scenario: string; pastSubmissions: PastSub[]
}) {
  const [tab, setTab] = useState('dashboard')
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [boardTickets, setBoardTickets] = useState(tickets)

  const todo = boardTickets.filter(t => t.status === 'todo')
  const inProg = boardTickets.filter(t => t.status === 'in_progress')
  const done = boardTickets.filter(t => t.status === 'done')
  const totalPts = tickets.reduce((s, t) => s + t.story_points, 0)
  const donePts = boardTickets.filter(t => t.status === 'done').reduce((s, t) => s + t.story_points, 0)

  function moveTicket(id: string, newStatus: 'todo'|'in_progress'|'done') {
    setBoardTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }
  const memberForName = (name: string|null) => team.find(m => m.name === name)

  const TOTAL_WEEKS = 16
  const CURRENT_WEEK = week.week_number

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">SprintSim</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">CS 3330 · Spring 2026</span>
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">UI Preview</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            Week {week.week_number} · {week.topic}
          </span>
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-medium">JS</div>
          <Link href="/demo/instructor" className="text-xs text-violet-600 border border-violet-200 rounded-full px-3 py-1 hover:bg-violet-50 transition-colors">
            Switch to instructor →
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — fully wired to tab state */}
        <aside className="w-52 border-r border-gray-200 bg-white flex flex-col py-4 shrink-0">
          <nav className="flex-1 px-3 space-y-0.5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">Navigation</p>
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${
                  tab === item.key
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">My project</p>
            <p className="text-sm font-medium text-gray-800">PawTrack</p>
            <p className="text-xs text-gray-400">Pet health management</p>
            <div className="mt-2">
              <div className="text-xs text-gray-400 mb-1">Sprint 1 of 3</div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${Math.round((donePts / totalPts) * 100)}%` }} />
              </div>
              <div className="text-xs text-gray-300 mt-1">{donePts} of {totalPts} pts done</div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div className="max-w-4xl">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900">Welcome back, Jordan</h1>
                <p className="text-sm text-gray-400 mt-0.5">PawTrack · Sprint 1</p>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label:'Sprint velocity', val: String(totalPts), sub:'points planned' },
                  { label:'Open tickets',    val: String(todo.length + inProg.length), sub:`${done.length} done` },
                  { label:'Team mood',       val:'Cautious', sub:'Pippin needs attention', sm:true },
                  { label:'Submissions',     val:'2/5', sub:'weeks submitted' },
                ].map(c => (
                  <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                    <p className={`font-semibold text-gray-900 ${c.sm ? 'text-base' : 'text-2xl'}`}>{c.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{c.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-white border border-indigo-200 rounded-xl p-5">
                  <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">
                    Week {week.week_number} · due {week.due_date}
                  </span>
                  <h2 className="text-base font-semibold text-gray-900">{week.topic}</h2>
                  <p className="text-sm text-gray-500 mt-1">{week.description}</p>
                  <button onClick={() => setTab('activity')} className="inline-block mt-3 bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors">
                    Go to this week →
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">My team</h2>
                  <div className="space-y-3">
                    {team.map(m => (
                      <div key={m.name} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${m.avatarBg} ${m.avatarText}`}>{m.avatarInitials}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                          <p className="text-xs text-gray-400 truncate">{m.personalityLabel}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full shrink-0 ${m.moodTendency==='positive'?'bg-green-400':m.moodTendency==='negative'?'bg-red-400':'bg-amber-400'}`} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTab('team')} className="block mt-4 text-xs text-indigo-600 hover:underline">View full team profiles →</button>
                </div>
              </div>
              <div className="mt-5 bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">Sprint progress</h2>
                  <div className="flex gap-3">
                    <button onClick={() => setTab('board')} className="text-xs text-indigo-600 hover:underline">Sprint board →</button>
                    <button onClick={() => setTab('metrics')} className="text-xs text-indigo-600 hover:underline">View metrics →</button>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full mb-3">
                  <div className="h-2 bg-indigo-500 rounded-full" style={{ width: `${Math.round((donePts / totalPts) * 100)}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-lg font-semibold text-gray-500">{todo.length}</p><p className="text-xs text-gray-400">To do</p></div>
                  <div><p className="text-lg font-semibold text-amber-600">{inProg.length}</p><p className="text-xs text-gray-400">In progress</p></div>
                  <div><p className="text-lg font-semibold text-green-600">{done.length}</p><p className="text-xs text-gray-400">Done</p></div>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ── */}
          {tab === 'activity' && (
            <div className="max-w-3xl">
              <div className="mb-5">
                <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">Week {week.week_number} · due {week.due_date}</span>
                <h1 className="text-xl font-semibold text-gray-900">{week.topic}</h1>
                <p className="text-sm text-gray-500 mt-1">{week.description}</p>
              </div>
              <div className="flex gap-2 mb-5">
                {team.map(m => (
                  <div key={m.name} title={`${m.name} — ${m.personalityLabel}`} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium ${m.avatarBg} ${m.avatarText}`}>{m.avatarInitials}</div>
                    <span className="text-gray-600">{m.firstName}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${m.moodTendency==='positive'?'bg-green-400':m.moodTendency==='negative'?'bg-red-400':'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">This week&apos;s scenario</h2>
                  <span className="text-xs text-indigo-500 bg-indigo-50 rounded px-2 py-0.5">Generated for your team</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{scenario}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-1">Your response</h2>
                <p className="text-xs text-gray-400 mb-3">Write your response as the Scrum Master of PawTrack. Explain your reasoning.</p>
                {submitted ? (
                  <div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">{response}</div>
                    <div className="flex items-center gap-2 text-sm text-green-600"><span>✓</span> Submitted — awaiting instructor review</div>
                    <button onClick={() => setSubmitted(false)} className="mt-2 text-xs text-indigo-500 hover:underline">Edit response</button>
                  </div>
                ) : (
                  <>
                    <textarea value={response} onChange={e => setResponse(e.target.value)} rows={6}
                      placeholder="As Scrum Master, I would…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder-gray-300" />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-300">{response.length} chars</span>
                      <button onClick={() => response.trim() && setSubmitted(true)} disabled={!response.trim()}
                        className="bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                        Submit response
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TEAM ── */}
          {tab === 'team' && (
            <div className="max-w-3xl">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900">My team</h1>
                <p className="text-sm text-gray-500 mt-0.5">PawTrack — Pet health and vet appointment management app</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {team.map(m => (
                  <div key={m.name} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${m.avatarBg} ${m.avatarText}`}>{m.avatarInitials}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <p className="text-sm text-gray-500">{ROLE_LABELS[m.role]}</p>
                      </div>
                      <div className={`ml-auto w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${m.moodTendency==='positive'?'bg-green-400':m.moodTendency==='negative'?'bg-red-400':'bg-amber-400'}`} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Seniority</span><span className="text-gray-700 capitalize">{m.seniority}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Personality</span><span className="text-gray-700 text-right max-w-[160px]">{m.personalityLabel}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Current mood</span>
                        <span className={`capitalize ${m.moodTendency==='positive'?'text-green-600':m.moodTendency==='negative'?'text-red-600':'text-amber-600'}`}>
                          {m.moodTendency==='positive'?'On track':m.moodTendency==='negative'?'Needs attention':'Cautious'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
                <strong>Tip:</strong> Your team&apos;s traits are fixed for the semester — learn how each person works and factor that into your weekly decisions.
              </div>
            </div>
          )}

          {/* ── SPRINT BOARD ── */}
          {tab === 'board' && (
            <div className="max-w-5xl">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900">Sprint board</h1>
                <p className="text-sm text-gray-500 mt-0.5">PawTrack · Sprint 1 · {donePts}/{totalPts} points done</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(['todo','in_progress','done'] as const).map(status => {
                  const label = status==='todo'?'To do':status==='in_progress'?'In progress':'Done'
                  const col = boardTickets.filter(t => t.status === status)
                  const others = (['todo','in_progress','done'] as const).filter(s => s !== status)
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{col.length}</span>
                      </div>
                      <div className="space-y-2">
                        {col.map(ticket => {
                          const assignee = memberForName(ticket.assignee_name)
                          return (
                            <div key={ticket.id} className={`bg-white rounded-lg border p-3 ${ticket.is_blocked?'border-amber-300':'border-gray-200'}`}>
                              <p className="text-xs text-gray-400 mb-1">{ticket.ticket_id}</p>
                              <p className="text-sm text-gray-900 mb-2 leading-snug">{ticket.title}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {assignee && <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium ${assignee.avatarBg} ${assignee.avatarText}`}>{assignee.avatarInitials}</div>}
                                  <span className="text-xs text-gray-400">{ticket.assignee_name?.split(' ')[0]}</span>
                                  {ticket.is_blocked && <span className="text-xs text-amber-600 ml-1">blocked</span>}
                                </div>
                                <span className="text-xs text-gray-300">{ticket.story_points}pt</span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                {others.map(s => (
                                  <button key={s} onClick={() => moveTicket(ticket.id, s)} className="text-xs text-indigo-400 hover:text-indigo-600 hover:underline">
                                    → {s==='todo'?'To do':s==='in_progress'?'In progress':'Done'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {col.length === 0 && <div className="border-2 border-dashed border-gray-100 rounded-lg p-4 text-center text-xs text-gray-300">Empty</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── GANTT ── */}
          {tab === 'gantt' && (
            <div className="max-w-5xl">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900">Gantt chart</h1>
                <p className="text-sm text-gray-500 mt-0.5">PawTrack · 16-week semester plan</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
                {/* Week header */}
                <div className="flex mb-3" style={{ paddingLeft: '160px' }}>
                  {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => (
                    <div key={w} className={`flex-1 text-center text-xs font-medium min-w-[32px] pb-1 ${w === CURRENT_WEEK ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {w}
                      {w === CURRENT_WEEK && <div className="w-0.5 h-2 bg-indigo-400 mx-auto mt-0.5 rounded" />}
                    </div>
                  ))}
                </div>
                {/* Current week marker line */}
                <div className="relative">
                  <div
                    className="absolute top-0 bottom-0 w-px bg-indigo-300 z-10 pointer-events-none"
                    style={{ left: `calc(160px + ${((CURRENT_WEEK - 0.5) / TOTAL_WEEKS) * 100}%)` }}
                  />
                  {/* Rows */}
                  <div className="space-y-2">
                    {/* Phase label */}
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider py-1">Course phases</div>
                    {GANTT_ITEMS.filter(i => i.type === 'phase').map(item => (
                      <div key={item.label} className="flex items-center gap-2 h-8">
                        <div className="w-40 shrink-0 text-xs text-gray-600 text-right pr-3 truncate">{item.label}</div>
                        <div className="flex-1 relative h-6">
                          <div
                            className={`absolute h-full rounded-md flex items-center px-2 text-xs font-medium overflow-hidden ${item.color} ${item.textColor}`}
                            style={{
                              left: `${((item.start - 1) / TOTAL_WEEKS) * 100}%`,
                              width: `${((item.end - item.start + 1) / TOTAL_WEEKS) * 100}%`,
                            }}
                          >
                            <span className="truncate">{item.label}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider py-1 mt-2">Sprints & milestones</div>
                    {GANTT_ITEMS.filter(i => i.type === 'sprint' || i.type === 'milestone').map(item => (
                      <div key={item.label} className="flex items-center gap-2 h-8">
                        <div className="w-40 shrink-0 text-xs text-gray-600 text-right pr-3 truncate">{item.label}</div>
                        <div className="flex-1 relative h-6">
                          <div
                            className={`absolute h-full flex items-center px-2 text-xs font-medium overflow-hidden ${item.color} ${item.textColor} ${item.type === 'milestone' ? 'rounded-full' : 'rounded-md'}`}
                            style={{
                              left: `${((item.start - 1) / TOTAL_WEEKS) * 100}%`,
                              width: `${((item.end - item.start + 1) / TOTAL_WEEKS) * 100}%`,
                            }}
                          >
                            <span className="truncate">{item.label}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wider py-1 mt-2">My tickets</div>
                    {tickets.map((ticket, idx) => {
                      const sprintStart = 4
                      const ticketStart = sprintStart + Math.floor(idx / 3)
                      const ticketEnd = ticketStart + (ticket.story_points > 3 ? 2 : 1)
                      const assignee = memberForName(ticket.assignee_name)
                      const bgColor = ticket.status === 'done' ? 'bg-green-100' : ticket.status === 'in_progress' ? 'bg-indigo-100' : 'bg-gray-100'
                      const textColor = ticket.status === 'done' ? 'text-green-800' : ticket.status === 'in_progress' ? 'text-indigo-800' : 'text-gray-600'
                      return (
                        <div key={ticket.id} className="flex items-center gap-2 h-7">
                          <div className="w-40 shrink-0 flex items-center justify-end gap-1.5 pr-3">
                            {assignee && <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium ${assignee.avatarBg} ${assignee.avatarText}`}>{assignee.avatarInitials}</div>}
                            <span className="text-xs text-gray-500 truncate">{ticket.ticket_id}</span>
                          </div>
                          <div className="flex-1 relative h-5">
                            <div
                              className={`absolute h-full rounded flex items-center px-1.5 text-[10px] font-medium overflow-hidden ${bgColor} ${textColor}`}
                              style={{
                                left: `${((ticketStart - 1) / TOTAL_WEEKS) * 100}%`,
                                width: `${((ticketEnd - ticketStart + 1) / TOTAL_WEEKS) * 100}%`,
                              }}
                            >
                              <span className="truncate">{ticket.title}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-100 flex-wrap gap-y-2">
                  {[
                    { color:'bg-indigo-400',  label:'Sprint' },
                    { color:'bg-green-400',   label:'Milestone' },
                    { color:'bg-green-100',   label:'Done' },
                    { color:'bg-indigo-100',  label:'In progress' },
                    { color:'bg-gray-100',    label:'To do' },
                    { color:'bg-indigo-300',  label:'Current week', border:true },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className={`w-3 h-3 rounded ${l.color} ${l.border ? 'w-px h-4' : ''}`} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── METRICS ── */}
          {tab === 'metrics' && (
            <div className="max-w-4xl">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900">Sprint metrics</h1>
                <p className="text-sm text-gray-500 mt-0.5">PawTrack · Sprint 1 in progress</p>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label:'Planned velocity', val:'13 pts', sub:'this sprint' },
                  { label:'Completed',         val:`${donePts} pts`, sub:`${Math.round((donePts/totalPts)*100)}% done` },
                  { label:'Blocked tickets',   val:String(boardTickets.filter(t=>t.is_blocked).length), sub:'need attention' },
                  { label:'Team avg. pts/day', val:'1.6', sub:'of 8-day sprint' },
                ].map(c => (
                  <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                    <p className="text-xl font-semibold text-gray-900">{c.val}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">Velocity chart</h2>
                  <p className="text-xs text-gray-400 mb-4">Story points planned vs completed per sprint</p>
                  <VelocityChart />
                  <p className="text-xs text-gray-400 mt-3 text-center">Sprint 1 is in progress — Sprints 2 & 3 are planned</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-gray-900 mb-1">Burndown chart</h2>
                  <p className="text-xs text-gray-400 mb-4">Remaining story points — Sprint 1</p>
                  <BurndownChart />
                  <p className="text-xs text-gray-400 mt-3 text-center">Tracking above ideal line — Pippin&apos;s blocker is the main factor</p>
                </div>
              </div>

              <div className="mt-5 bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Per-member contribution</h2>
                <div className="space-y-3">
                  {team.map(m => {
                    const memberTickets = boardTickets.filter(t => t.assignee_name === m.name)
                    const memberDone = memberTickets.filter(t => t.status === 'done').reduce((s,t)=>s+t.story_points,0)
                    const memberTotal = memberTickets.reduce((s,t)=>s+t.story_points,0)
                    const pct = memberTotal > 0 ? Math.round((memberDone / memberTotal) * 100) : 0
                    return (
                      <div key={m.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${m.avatarBg} ${m.avatarText}`}>{m.avatarInitials}</div>
                            <span className="text-sm text-gray-700">{m.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{memberDone}/{memberTotal} pts · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-400' : pct > 0 ? 'bg-indigo-400' : 'bg-gray-200'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── LEARN ── */}
          {tab === 'learn' && <DemoLearnTab weekNumber={week.week_number} />}

          {/* ── SUBMISSIONS ── */}
          {tab === 'submissions' && (
            <div className="max-w-3xl">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900">My submissions</h1>
                <p className="text-sm text-gray-500 mt-0.5">{pastSubmissions.length} submitted this semester</p>
              </div>
              <div className="space-y-4">
                {pastSubmissions.map(sub => (
                  <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs text-gray-400">Week {sub.week.week_number}</span>
                        <h2 className="text-sm font-semibold text-gray-900">{sub.week.topic}</h2>
                      </div>
                      <span className={`text-xs border rounded-full px-2.5 py-0.5 ${GRADE_STYLES[sub.grade]}`}>{GRADE_LABELS[sub.grade]}</span>
                    </div>
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
                      <span className="font-medium text-gray-600">Scenario: </span>{sub.scenario}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{sub.response}</p>
                    <div className={`mt-3 p-3 border rounded-lg text-sm ${GRADE_STYLES[sub.grade]}`}>
                      <span className="font-medium text-xs uppercase tracking-wide opacity-70">Instructor feedback</span>
                      <p className="mt-1">{sub.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
