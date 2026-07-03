import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InstructorDashboardClient from '@/components/instructor/InstructorDashboardClient'

export default async function InstructorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get active week
  const { data: activeWeek } = await supabase
    .from('weeks')
    .select('*')
    .eq('is_active', true)
    .single()

  // Get all weeks for selector
  const { data: weeks } = await supabase
    .from('weeks')
    .select('id, week_number, topic, due_date, is_active')
    .order('week_number')

  if (!activeWeek) {
    return (
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">No active week set. Go to Manage weeks to activate one.</p>
        </div>
      </div>
    )
  }

  // Get all enrolled students with their submissions + feedback for active week
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      student_id,
      profiles!enrollments_student_id_fkey(id, full_name, email),
      team_assignments!inner(project_name, team_config)
    `)

  const studentIds = enrollments?.map(e => e.student_id) ?? []

  const [{ data: submissions }, { data: scenarios }] = await Promise.all([
    supabase
      .from('submissions')
      .select('*, feedback(*)')
      .eq('week_id', activeWeek.id)
      .in('student_id', studentIds),
    supabase
      .from('scenarios')
      .select('*')
      .eq('week_id', activeWeek.id)
      .in('student_id', studentIds),
  ])

  // Build student rows
  const studentRows = (enrollments ?? []).map(e => {
    const profile = e.profiles as { id: string; full_name: string; email: string } | null
    const team = e.team_assignments as unknown as { project_name: string; team_config: unknown[] }[] | null
    const teamData = Array.isArray(team) ? team[0] : team
    const sub = submissions?.find(s => s.student_id === e.student_id)
    const scenario = scenarios?.find(s => s.student_id === e.student_id)
    const feedback = (sub?.feedback as Array<{ grade: string; feedback_text: string }>)?.[0]

    return {
      studentId: e.student_id,
      fullName: profile?.full_name ?? 'Unknown',
      email: profile?.email ?? '',
      projectName: teamData?.project_name ?? 'No project',
      teamConfig: (teamData?.team_config ?? []) as Array<{ avatarInitials: string; avatarBg: string; avatarText: string; moodTendency: string }>,
      submission: sub ? { id: sub.id, responseText: sub.response_text, submittedAt: sub.submitted_at } : null,
      scenario: scenario ? { content: scenario.content } : null,
      feedback: feedback ?? null,
      status: sub ? 'submitted' : 'not_started',
    }
  })

  return (
    <InstructorDashboardClient
      activeWeek={activeWeek}
      weeks={weeks ?? []}
      studentRows={studentRows}
    />
  )
}
