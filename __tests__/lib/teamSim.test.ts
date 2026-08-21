import { generateTeamAssignment } from '@/utils/teamAssignment'
import {
  memberMood, memberStatusLine, weeklyTeamState,
  ticketTargetsForWeek, ticketUpdatesToApply,
  sprintForWeek, sprintWeekRange, STATUS_RANK, boardQuestion,
  type SimTicket,
} from '@/lib/sim/teamSim'

const STUDENT = 'student-uuid-1234'
const { team } = generateTeamAssignment(STUDENT)

function makeTickets(n: number, assignees: string[]): SimTicket[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `t-${i}`,
    ticket_id: `TST-${i}`,
    title: `Ticket ${i}`,
    status: 'todo',
    assignee_name: assignees[i % assignees.length],
    is_blocked: false,
  }))
}

describe('sprint mapping', () => {
  it('maps weeks to sprints in two-week pairs', () => {
    expect(sprintForWeek(2)).toBe(1)
    expect(sprintForWeek(3)).toBe(1)
    expect(sprintForWeek(4)).toBe(2)
    expect(sprintForWeek(5)).toBe(2)
    expect(sprintForWeek(12)).toBe(6)
    expect(sprintForWeek(13)).toBe(6)
  })

  it('sprint week ranges match sprintForWeek', () => {
    for (let s = 1; s <= 6; s++) {
      const [start, end] = sprintWeekRange(s)
      expect(sprintForWeek(start)).toBe(s)
      expect(sprintForWeek(end)).toBe(s)
    }
  })
})

describe('scripted moods', () => {
  it('is deterministic', () => {
    for (const m of team) {
      expect(memberMood(m, 5)).toBe(memberMood(m, 5))
    }
  })

  it('returns a valid mood for every member and week', () => {
    for (const m of team) {
      for (let w = 2; w <= 15; w++) {
        expect(['positive', 'cautious', 'negative']).toContain(memberMood(m, w))
      }
    }
  })

  it('moods change over the semester for at least one member', () => {
    const changes = team.some(m => {
      const moods = new Set<string>()
      for (let w = 2; w <= 13; w++) moods.add(memberMood(m, w))
      return moods.size > 1
    })
    expect(changes).toBe(true)
  })

  it('status lines are deterministic and non-empty', () => {
    for (const m of team) {
      const a = memberStatusLine(m, 4, STUDENT)
      const b = memberStatusLine(m, 4, STUDENT)
      expect(a).toBe(b)
      expect(a.length).toBeGreaterThan(10)
    }
  })

  it('weeklyTeamState covers the whole team', () => {
    const state = weeklyTeamState(team, 6, STUDENT)
    expect(state).toHaveLength(team.length)
    state.forEach(s => expect(s.statusLine).toBeTruthy())
  })
})

describe('ticket simulation', () => {
  const assignees = team.map(m => m.firstName)
  const tickets = makeTickets(8, assignees)

  it('is deterministic for the same inputs', () => {
    const a = ticketTargetsForWeek(tickets, team, 4, STUDENT)
    const b = ticketTargetsForWeek(tickets, team, 4, STUDENT)
    expect(a).toEqual(b)
  })

  it('returns a target for every ticket with a valid status', () => {
    const targets = ticketTargetsForWeek(tickets, team, 4, STUDENT)
    expect(targets).toHaveLength(tickets.length)
    targets.forEach(t => expect(['todo', 'in_progress', 'done']).toContain(t.targetStatus))
  })

  it('second week of a sprint is at least as far along as the first', () => {
    const w1 = ticketTargetsForWeek(tickets, team, 4, STUDENT)
    const w2 = ticketTargetsForWeek(tickets, team, 5, STUDENT)
    const doneCount = (ts: typeof w1) => ts.filter(t => t.targetStatus === 'done').length
    expect(doneCount(w2)).toBeGreaterThanOrEqual(doneCount(w1))
  })

  it('blocked tickets always carry a comment and are never done', () => {
    for (let w = 2; w <= 13; w++) {
      const targets = ticketTargetsForWeek(tickets, team, w, STUDENT)
      for (const t of targets.filter(x => x.isBlocked)) {
        expect(t.comment).toBeTruthy()
        expect(t.targetStatus).not.toBe('done')
      }
    }
  })

  it('updates only ever advance status (monotonic)', () => {
    const started = tickets.map((t, i) => ({
      ...t,
      status: i % 3 === 0 ? 'done' : i % 3 === 1 ? 'in_progress' : 'todo',
    }))
    const targets = ticketTargetsForWeek(started, team, 5, STUDENT)
    const updates = ticketUpdatesToApply(started, targets)
    for (const u of updates.filter(x => x.status !== undefined)) {
      const before = started.find(t => t.id === u.id)!
      expect(STATUS_RANK[u.status!]).toBeGreaterThan(STATUS_RANK[before.status])
    }
  })

  it('never marks a done ticket blocked', () => {
    const allDone = tickets.map(t => ({ ...t, status: 'done' }))
    const targets = ticketTargetsForWeek(allDone, team, 5, STUDENT)
    const updates = ticketUpdatesToApply(allDone, targets)
    for (const u of updates) expect(u.is_blocked).not.toBe(true)
  })

  it('is idempotent: applying updates then re-running produces no new updates', () => {
    const targets = ticketTargetsForWeek(tickets, team, 4, STUDENT)
    const updates = ticketUpdatesToApply(tickets, targets)
    const applied = tickets.map(t => {
      const u = updates.find(x => x.id === t.id)
      return u ? { ...t, status: u.status ?? t.status, is_blocked: u.is_blocked ?? t.is_blocked } : t
    })
    const second = ticketUpdatesToApply(applied, ticketTargetsForWeek(applied, team, 4, STUDENT))
    expect(second).toHaveLength(0)
  })
})

describe('board question', () => {
  const assignees = team.map(m => m.firstName)
  const base = makeTickets(8, assignees).map(t => ({ ...t, story_points: 2 }))

  it('returns null for an empty board', () => {
    expect(boardQuestion({ tickets: [], weekNumber: 4 })).toBeNull()
  })

  it('is deterministic', () => {
    expect(boardQuestion({ tickets: base, weekNumber: 4 }))
      .toBe(boardQuestion({ tickets: base, weekNumber: 4 }))
  })

  it('asks the behind-schedule question in a failing final week', () => {
    const behind = base.map(t => ({ ...t, status: 'todo' }))
    const q = boardQuestion({ tickets: behind, weekNumber: 5 })!
    expect(q).toMatch(/descope|renegotiate|push/)
    expect(q).toContain('0/8')
  })

  it('asks the blocker question when 2+ tickets are blocked', () => {
    const blocked = base.map((t, i) => ({ ...t, status: 'done', is_blocked: false }))
    blocked[0] = { ...blocked[0], status: 'in_progress', is_blocked: true }
    blocked[1] = { ...blocked[1], status: 'todo', is_blocked: true }
    const q = boardQuestion({ tickets: blocked, weekNumber: 4 })!
    expect(q).toMatch(/blocked/i)
    expect(q).toContain('2 blocked')
  })

  it('asks the backlog-pull question when the team is ahead', () => {
    const ahead = base.map((t, i) => ({ ...t, status: i < 7 ? 'done' : 'todo' }))
    const q = boardQuestion({ tickets: ahead, weekNumber: 4 })!
    expect(q).toMatch(/backlog/i)
  })

  it('reflects real ticket counts in the question text', () => {
    const mixed = base.map((t, i) => ({ ...t, status: i < 3 ? 'done' : 'todo' }))
    const q = boardQuestion({ tickets: mixed, weekNumber: 5 })!
    expect(q).toContain('3/8')
  })
})
