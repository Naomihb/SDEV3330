import { resolveCurrentWeek, resolveSubmissionWeek, SUBMISSION_WEEKS, type WeekRow } from '@/lib/weeks'
import { burndownForWeek, type SimTicket } from '@/lib/sim/teamSim'

function makeWeeks(): WeekRow[] {
  // Mirrors the Fall 2026 schedule
  const dues = ['2026-08-26','2026-09-02','2026-09-09','2026-09-16','2026-09-23','2026-09-30',
                '2026-10-07','2026-10-14','2026-10-21','2026-10-28','2026-11-04','2026-11-11',
                '2026-11-18','2026-12-02','2026-12-09']
  return dues.map((due, i) => ({
    id: `w${i + 1}`, week_number: i + 1, topic: `Topic ${i + 1}`,
    description: null, due_date: due, is_active: false,
  }))
}

describe('resolveCurrentWeek (date-based)', () => {
  const weeks = makeWeeks()

  it('picks week 1 before classes start', () => {
    expect(resolveCurrentWeek(weeks, new Date('2026-08-22T12:00:00Z'))!.week_number).toBe(1)
  })

  it('picks week 2 during its window', () => {
    expect(resolveCurrentWeek(weeks, new Date('2026-08-28T12:00:00Z'))!.week_number).toBe(2)
    expect(resolveCurrentWeek(weeks, new Date('2026-09-02T12:00:00Z'))!.week_number).toBe(2)
  })

  it('advances to week 3 the day after week 2 is due', () => {
    expect(resolveCurrentWeek(weeks, new Date('2026-09-03T12:00:00Z'))!.week_number).toBe(3)
  })

  it('flips at midnight US Central, not midnight UTC', () => {
    // Wed Sep 2, 10:00pm Central (03:00 UTC Thu) — still week 2
    expect(resolveCurrentWeek(weeks, new Date('2026-09-03T03:00:00Z'))!.week_number).toBe(2)
    // Wed Sep 2, 11:59pm Central (04:59 UTC Thu) — still week 2
    expect(resolveCurrentWeek(weeks, new Date('2026-09-03T04:59:00Z'))!.week_number).toBe(2)
    // Thu Sep 3, 12:00am Central (05:00 UTC, CDT) — week 3 begins
    expect(resolveCurrentWeek(weeks, new Date('2026-09-03T05:00:00Z'))!.week_number).toBe(3)
  })

  it('covers a maternity leave window without any manual toggles', () => {
    // Weeks 2-7: Aug 27 through Oct 7
    const checks: [string, number][] = [
      ['2026-08-30', 2], ['2026-09-05', 3], ['2026-09-12', 4],
      ['2026-09-20', 5], ['2026-09-28', 6], ['2026-10-05', 7],
    ]
    for (const [date, expected] of checks) {
      expect(resolveCurrentWeek(weeks, new Date(`${date}T12:00:00Z`))!.week_number).toBe(expected)
    }
  })

  it('stays on the final week after the semester ends', () => {
    expect(resolveCurrentWeek(weeks, new Date('2026-12-20T12:00:00Z'))!.week_number).toBe(15)
  })

  it('manual activation overrides the date', () => {
    const overridden = weeks.map(w => w.week_number === 5 ? { ...w, is_active: true } : w)
    expect(resolveCurrentWeek(overridden, new Date('2026-08-28T12:00:00Z'))!.week_number).toBe(5)
  })

  it('highest manually active week wins when several are toggled', () => {
    const overridden = weeks.map(w => [3, 6].includes(w.week_number) ? { ...w, is_active: true } : w)
    expect(resolveCurrentWeek(overridden, new Date('2026-08-28T12:00:00Z'))!.week_number).toBe(6)
  })

  it('returns null with no weeks', () => {
    expect(resolveCurrentWeek([], new Date())).toBeNull()
  })
})

describe('resolveSubmissionWeek', () => {
  const weeks = makeWeeks()

  it('returns null during orientation week', () => {
    expect(resolveSubmissionWeek(weeks, new Date('2026-08-24T12:00:00Z'))).toBeNull()
  })

  it('returns the week during submission weeks', () => {
    const w = resolveSubmissionWeek(weeks, new Date('2026-09-20T12:00:00Z'))
    expect(w).not.toBeNull()
    expect(SUBMISSION_WEEKS.has(w!.week_number)).toBe(true)
  })

  it('returns null during finals', () => {
    expect(resolveSubmissionWeek(weeks, new Date('2026-12-08T12:00:00Z'))).toBeNull()
  })
})

describe('burndownForWeek', () => {
  const tickets: (SimTicket & { story_points: number })[] = Array.from({ length: 8 }, (_, i) => ({
    id: `t${i}`, ticket_id: `T-${i}`, title: `T${i}`,
    status: i < 3 ? 'done' : 'todo', assignee_name: 'X', is_blocked: false, story_points: 2,
  }))

  it('computes totals and remaining from real tickets', () => {
    const bd = burndownForWeek(tickets, 4)
    expect(bd.totalPoints).toBe(16)
    expect(bd.remainingPoints).toBe(10)
    expect(bd.sprint).toBe(2)
    expect(bd.weekInSprint).toBe(1)
  })

  it('ideal is half at end of week 1, zero at end of week 2', () => {
    expect(burndownForWeek(tickets, 4).idealRemaining).toBe(8)
    expect(burndownForWeek(tickets, 5).idealRemaining).toBe(0)
  })

  it('handles an empty board without dividing by zero', () => {
    const bd = burndownForWeek([], 4)
    expect(bd.totalPoints).toBe(0)
    expect(bd.remainingPoints).toBe(0)
  })
})
