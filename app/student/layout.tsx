import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar from '@/components/student/StudentSidebar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'student') redirect('/instructor/dashboard')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('course_id, courses(id, code, name, semester)')
    .eq('student_id', user.id)
    .single()

  const { data: teamAssignment } = await supabase
    .from('team_assignments')
    .select('project_name, project_description, team_config')
    .eq('student_id', user.id)
    .single()

  const { data: activeWeek } = await supabase
    .from('weeks')
    .select('*')
    .eq('is_active', true)
    .single()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">SprintSim</span>
          <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">
            {(enrollment?.courses as { code?: string })?.code ?? 'CS 3330'} · {(enrollment?.courses as { semester?: string })?.semester ?? 'Spring 2026'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeWeek && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              Week {activeWeek.week_number} · {activeWeek.topic}
            </span>
          )}
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-medium">
            {profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <StudentSidebar projectName={teamAssignment?.project_name ?? null} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
