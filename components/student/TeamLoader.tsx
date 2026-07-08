'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ROLE_LABELS: Record<string, string> = {
  senior_dev: 'Senior developer', junior_dev: 'Junior developer',
  designer: 'Designer', qa_lead: 'QA lead', mid_dev: 'Mid-level developer',
}

export default function TeamLoader() {
  const [team, setTeam] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('team_assignments').select('*').eq('student_id', user.id).single()
      setTeam(data)
    }
    load()
  }, [])

  if (!team) return <div className="flex items-center justify-center h-64"><div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>

  const members = team.team_config ?? []
  const avatarBg = ['bg-green-100','bg-orange-100','bg-violet-100','bg-blue-100']
  const avatarText = ['text-green-800','text-orange-800','text-violet-800','text-blue-800']

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">My team</h1>
        <p className="text-sm text-gray-500 mt-0.5">{team.project_name} — {team.project_description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {members.map((m: any, i: number) => (
          <div key={m.name} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${avatarBg[i]} ${avatarText[i]}`}>
                {m.avatarInitials}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-sm text-gray-500">{ROLE_LABELS[m.role] ?? m.role}</p>
              </div>
              <div className={`ml-auto w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                m.moodTendency==='positive'?'bg-green-400':m.moodTendency==='negative'?'bg-red-400':'bg-amber-400'
              }`} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Seniority</span><span className="text-gray-700 capitalize">{m.seniority}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Personality</span><span className="text-gray-700 text-right max-w-[160px]">{m.personalityLabel}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Mood</span>
                <span className={`capitalize ${m.moodTendency==='positive'?'text-green-600':m.moodTendency==='negative'?'text-red-600':'text-amber-600'}`}>
                  {m.moodTendency==='positive'?'On track':m.moodTendency==='negative'?'Needs attention':'Cautious'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
