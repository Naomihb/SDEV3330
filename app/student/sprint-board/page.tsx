import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SprintBoard from '@/components/student/SprintBoard'

export default async function SprintBoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: tickets }, { data: team }] = await Promise.all([
    supabase.from('sprint_tickets').select('*').eq('student_id', user.id).order('ticket_id'),
    supabase.from('team_assignments').select('team_config, project_name').eq('student_id', user.id).single(),
  ])

  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Sprint board</h1>
        <p className="text-sm text-gray-500 mt-0.5">{team?.project_name} · Sprint 1</p>
      </div>
      <SprintBoard
        tickets={tickets ?? []}
        userId={user.id}
        teamConfig={(team?.team_config ?? []) as Array<{ name: string; avatarInitials: string; avatarBg: string; avatarText: string }> }
      />
    </div>
  )
}
