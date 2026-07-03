import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ActivityClient from '@/components/student/ActivityClient'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: activeWeek }, { data: team }] = await Promise.all([
    supabase.from('weeks').select('*').eq('is_active', true).single(),
    supabase.from('team_assignments').select('*').eq('student_id', user.id).single(),
  ])

  if (!activeWeek) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        No active week yet — check back when your instructor opens the next module.
      </div>
    )
  }

  // Load or generate scenario
  let { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('student_id', user.id)
    .eq('week_id', activeWeek.id)
    .single()

  // If no scenario exists, generate one via API
  let scenarioContent = scenario?.content ?? null
  let scenarioId = scenario?.id ?? null

  const { data: submission } = await supabase
    .from('submissions')
    .select('*, feedback(*)')
    .eq('student_id', user.id)
    .eq('week_id', activeWeek.id)
    .single()

  const teamMembers = team?.team_config ?? []

  return (
    <ActivityClient
      userId={user.id}
      week={activeWeek}
      scenarioContent={scenarioContent}
      scenarioId={scenarioId}
      submission={submission}
      teamConfig={teamMembers}
      projectName={team?.project_name ?? 'your project'}
    />
  )
}
