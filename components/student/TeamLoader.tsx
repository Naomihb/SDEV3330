'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TeamMember } from '@/lib/types'
import { weeklyTeamState, type MemberWeekState } from '@/lib/sim/teamSim'
import { resolveCurrentWeek, type WeekRow } from '@/lib/weeks'

const ROLE_LABELS: Record<string, string> = {
  senior_dev: 'Senior developer', junior_dev: 'Junior developer',
  designer: 'Designer', qa_lead: 'QA lead', mid_dev: 'Mid-level developer',
}

const MOOD_DOT: Record<string, string> = {
  positive: 'bg-green-400', cautious: 'bg-amber-400', negative: 'bg-red-400',
}
const MOOD_TEXT: Record<string, string> = {
  positive: 'text-green-600', cautious: 'text-amber-600', negative: 'text-red-600',
}
const MOOD_LABEL: Record<string, string> = {
  positive: 'On track', cautious: 'Cautious', negative: 'Needs attention',
}

export default function TeamLoader() {
  const [team, setTeam] = useState<any>(null)
  const [weekNumber, setWeekNumber] = useState<number>(2)
  const [states, setStates] = useState<MemberWeekState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [teamRes, weeksRes] = await Promise.all([
        supabase.from('team_assignments').select('*').eq('student_id', user.id).single(),
        supabase.from('weeks').select('*'),
      ])
      const assignment = teamRes.data as any
      const week = resolveCurrentWeek((weeksRes.data ?? []) as WeekRow[])?.week_number ?? 2
      setTeam(assignment)
      setWeekNumber(week)
      if (assignment?.team_config) {
        setStates(weeklyTeamState(assignment.team_config as TeamMember[], week, user.id))
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !team) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>

  const avatarBg = ['bg-green-100','bg-orange-100','bg-violet-100','bg-blue-100']
  const avatarText = ['text-green-800','text-orange-800','text-violet-800','text-blue-800']

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">My team</h1>
        <p className="text-sm text-gray-500 mt-0.5">{team.project_name} — {team.project_description}</p>
        <p className="text-xs text-gray-400 mt-1">Team status as of week {weekNumber} — moods change as the semester progresses</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {states.map((s, i) => (
          <div key={s.member.name} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarBg[i]} ${avatarText[i]}`}>
                {s.member.avatarInitials}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{s.member.firstName ?? s.member.name.split(' ')[0]}</p>
                <p className="text-sm text-gray-500">{ROLE_LABELS[s.member.role] ?? s.member.role}</p>
              </div>
              <div className={`ml-auto w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${MOOD_DOT[s.mood]}`} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Seniority</span><span className="text-gray-700 capitalize">{s.member.seniority}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Personality</span><span className="text-gray-700 text-right max-w-[160px]">{s.member.personalityLabel}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">This week</span>
                <span className={`${MOOD_TEXT[s.mood]}`}>{MOOD_LABEL[s.mood]}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 italic leading-relaxed">
              &ldquo;{s.statusLine}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
