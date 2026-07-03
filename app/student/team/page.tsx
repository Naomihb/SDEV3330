import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ROLE_LABELS: Record<string, string> = {
  senior_dev: 'Senior developer',
  mid_dev: 'Mid-level developer',
  junior_dev: 'Junior developer',
  designer: 'Designer',
  qa_lead: 'QA lead',
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team } = await supabase
    .from('team_assignments')
    .select('*')
    .eq('student_id', user.id)
    .single()

  if (!team) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Team not assigned yet. Contact your instructor.
      </div>
    )
  }

  const members = team.team_config as Array<{
    name: string; firstName: string; lastName: string; role: string;
    seniority: string; personality: string; personalityLabel: string;
    moodTendency: string; avatarInitials: string; avatarBg: string; avatarText: string;
  }>

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">My team</h1>
        <p className="text-sm text-gray-500 mt-0.5">{team.project_name} — {team.project_description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {members.map(m => (
          <div key={m.name} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${m.avatarBg} ${m.avatarText}`}>
                {m.avatarInitials}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-sm text-gray-500">{ROLE_LABELS[m.role] ?? m.role}</p>
              </div>
              <div className={`ml-auto w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                m.moodTendency === 'positive' ? 'bg-green-400' :
                m.moodTendency === 'negative' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Seniority</span>
                <span className="text-gray-700 capitalize">{m.seniority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Personality</span>
                <span className="text-gray-700 text-right max-w-[160px]">{m.personalityLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current mood</span>
                <span className={`capitalize ${m.moodTendency === 'positive' ? 'text-green-600' : m.moodTendency === 'negative' ? 'text-red-600' : 'text-amber-600'}`}>
                  {m.moodTendency === 'positive' ? 'On track' : m.moodTendency === 'negative' ? 'Needs attention' : 'Cautious'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
        <strong>Tip:</strong> Your team&apos;s traits are fixed for the semester — learn how each person works and factor that into your decisions each week.
      </div>
    </div>
  )
}
