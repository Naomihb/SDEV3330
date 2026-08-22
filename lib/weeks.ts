// Date-based week resolution — the site runs the whole semester unattended.
// A week is "current" when today falls in its window (up to and including its
// due date). Manually activated weeks (is_active) always win as an override,
// so the Manage Weeks toggles still work for testing or schedule changes.

export interface WeekRow {
  id: string
  week_number: number
  topic: string
  description: string | null
  due_date: string // ISO date
  is_active: boolean
}

export const SUBMISSION_WEEKS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])

// Calendar date in US Central time — weeks flip at midnight Central
// (11:59pm Wednesday CST/CDT ends the week), not midnight UTC.
function toISODate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

/**
 * Resolve the current week:
 * 1. If any weeks are manually active, the highest-numbered one wins.
 * 2. Otherwise, the first week whose due_date is today or later.
 * 3. After the last due date, the final week stays current.
 */
export function resolveCurrentWeek(weeks: WeekRow[], today: Date = new Date()): WeekRow | null {
  if (weeks.length === 0) return null
  const sorted = [...weeks].sort((a, b) => a.week_number - b.week_number)

  const manual = sorted.filter(w => w.is_active)
  if (manual.length > 0) return manual[manual.length - 1]

  const todayStr = toISODate(today)
  return sorted.find(w => w.due_date >= todayStr) ?? sorted[sorted.length - 1]
}

/** The current week if it takes submissions, else null (orientation, project, finals). */
export function resolveSubmissionWeek(weeks: WeekRow[], today: Date = new Date()): WeekRow | null {
  const current = resolveCurrentWeek(weeks, today)
  return current && SUBMISSION_WEEKS.has(current.week_number) ? current : null
}
