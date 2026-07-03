import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: team },
    { data: activeWeek },
    { data: tickets },
    { data: submissions },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('team_assignments').select('*').eq('student_id', user.id).single(),
    supabase.from('weeks').select('*').eq('is_active', true).single(),
    supabase.from('sprint_tickets').select('*').eq('student_id', user.id).order('ticket_id'),
    supabase.from('submissions').select('id, week_id').eq('student_id', user.id),
  ])

  const teamMembers = (team?.team_config ?? []) as Array<{
    name: string; avatarInitials: string; avatarBg: string; avatarText: string;
    role: string; personalityLabel: string; moodTendency: string;
  }>

  const todoCount = tickets?.filter(t => t.status === 'todo').length ?? 0
  const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length ?? 0
  const doneCount = tickets?.filter(t => t.status === 'done').length ?? 0
  const totalPoints = tickets?.reduce((s, t) => s + (t.story_points ?? 0), 0) ?? 0
  const donePoints = tickets?.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 0), 0) ?? 0
  const blockedMember = teamMembers.find(m => m.moodTendency === 'negative')

  const moodLabel = blockedMember ? `Cautious — ${blockedMember.name.split(' ')[0]} needs attention` : 'On track'

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {team?.project_name ?? 'Your project'} · Sprint 1
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Sprint velocity', value: totalPoints, sub: 'points planned' },
          { label: 'Open tickets', value: todoCount + inProgressCount, sub: `${doneCount} done` },
          { label: 'Team mood', value: blockedMember ? 'Cautious' : 'On track', sub: moodLabel, small: true },
          { label: 'Submissions', value: `${submissions?.length ?? 0}/${activeWeek?.week_number ?? 1}`, sub: 'weeks submitted' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`font-semibold text-gray-900 ${card.small ? 'text-base' : 'text-2xl'}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Active week card */}
        {activeWeek ? (
          <div className="bg-white border border-indigo-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">
                  Week {activeWeek.week_number} · due {activeWeek.due_date}
                </span>
                <h2 className="text-base font-semibold text-gray-900">{activeWeek.topic}</h2>
                <p className="text-sm text-gray-500 mt-1">{activeWeek.description}</p>
              </div>
            </div>
            <Link
              href="/student/activity"
              className="inline-block mt-2 bg-indigo-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-indigo-700 transition-colors"
            >
              Go to this week →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-center text-sm text-gray-400">
            No active week set by instructor
          </div>
        )}

        {/* Team card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">My team</h2>
          <div className="space-y-3">
            {teamMembers.map(member => (
              <div key={member.name} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${member.avatarBg} ${member.avatarText}`}>
                  {member.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">{member.personalityLabel}</p>
                </div>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  member.moodTendency === 'positive' ? 'bg-green-400' :
                  member.moodTendency === 'negative' ? 'bg-red-400' : 'bg-amber-400'
                }`} />
              </div>
            ))}
          </div>
          <Link href="/student/team" className="block mt-4 text-xs text-indigo-600 hover:underline">
            View full team profiles →
          </Link>
        </div>
      </div>

      {/* Sprint progress */}
      {tickets && tickets.length > 0 && (
        <div className="mt-5 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Sprint board snapshot</h2>
            <Link href="/student/sprint-board" className="text-xs text-indigo-600 hover:underline">
              View full board →
            </Link>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full mb-3">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all"
              style={{ width: totalPoints > 0 ? `${Math.round((donePoints / totalPoints) * 100)}%` : '0%' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['To do', todoCount, 'text-gray-500'], ['In progress', inProgressCount, 'text-amber-600'], ['Done', doneCount, 'text-green-600']].map(([label, count, color]) => (
              <div key={label as string}>
                <p className={`text-lg font-semibold ${color}`}>{count}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
