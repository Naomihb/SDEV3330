import { createServiceClient } from '@/lib/supabase/server'
import ActivityClient from '@/components/student/ActivityClient'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const supabase = createServiceClient()
  const { data: activeWeeks } = await supabase.from('weeks').select('*').eq('is_active', true).order('week_number', { ascending: false })
  // Show the highest active submission week (2–13); fall back to highest active week of any kind
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
      <ActivityClient week={week} />
    </div>
  )
}
line-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-2">
          Week {week.week_number} · due {week.due_date}
        </span>
        <h1 className="text-xl font-semibold text-gray-900">{week.topic}</h1>
        <p className="text-sm text-gray-500 mt-1">{week.description}</p>
      </div>
      {SUBMISSION_WEEKS_SET.has(week.week_number) ? (
        <ActivityClient week={week} />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-1">No submission this week</p>
          <p className="text-sm text-gray-400">{week.description}</p>
        </div>
      )}
    </div>
  )
}
