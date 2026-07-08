import { createServiceClient } from '@/lib/supabase/server'
import ActivityClient from '@/components/student/ActivityClient'

export default async function ActivityPage() {
  const supabase = createServiceClient()
  const { data: week } = await supabase.from('weeks').select('*').eq('is_active', true).single()
  if (!week) return <div className="text-sm text-gray-400 p-6">No active week set. Ask your instructor to activate a week.</div>
  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <span className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">
          Week {week.week_number} · due {week.due_date}
        </span>
        <h1 className="text-xl font-semibold text-gray-900">{week.topic}</h1>
        <p className="text-sm text-gray-500 mt-1">{week.description}</p>
      </div>
      <ActivityClient week={week} />
    </div>
  )
}
