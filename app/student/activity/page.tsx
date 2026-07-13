import { createServiceClient } from '@/lib/supabase/server'
import ActivityClient from '@/components/student/ActivityClient'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const supabase = createServiceClient()
  const { data: activeWeeks } = await supabase
    .from('weeks').select('*').eq('is_active', true).order('week_number', { ascending: false })

  const SUBMISSION_WEEKS_SET = new Set([2,3,4,5,6,7,8,9,10,11,12,13])
  const week = activeWeeks?.find(w => SUBMISSION_WEEKS_SET.has(w.week_number)) ?? activeWeeks?.[0] ?? null

  if (!week) return (
    <div className="max-w-3xl">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-700">
        No active week set — ask your instructor to activate a week.
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl">
      <div className="inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-4">
        Week {week.week_number} · due {week.due_date}
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">{week.topic}</h1>
      <ActivityClient week={week} />
    </div>
  )
}
