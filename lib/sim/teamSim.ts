// Deterministic weekly team simulation — no AI calls, no stored state.
// Everything derives from (studentId, weekNumber, team_config, tickets), so
// re-running for the same week is idempotent. Ticket progression is monotonic:
// the sim only ever advances a ticket, never reverts a student's manual move.

import type { TeamMember, Personality } from '@/lib/types'

export type Mood = 'positive' | 'cautious' | 'negative'

export const STATUS_RANK: Record<string, number> = { todo: 0, in_progress: 1, done: 2 }

// Same seeded hash as utils/teamAssignment.ts for consistency
function seededRandom(seed: string, index: number): number {
  let h = (index + 1) * 0x9e3779b9
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9)
    h ^= h >>> 16
  }
  return (h >>> 0) / 0x100000000
}

// ── Scripted mood arcs ───────────────────────────────────────────────────────
// One entry per submission week (weeks 2–13 → indexes 0–11).
const MOOD_ARCS: Record<Personality, Mood[]> = {
  confident_opinionated: ['positive','positive','cautious','positive','positive','negative','positive','positive','cautious','positive','positive','positive'],
  enthusiastic_blocked:  ['positive','cautious','negative','cautious','positive','cautious','negative','cautious','positive','cautious','cautious','positive'],
  quiet_stressed:        ['cautious','cautious','negative','cautious','cautious','negative','negative','cautious','cautious','negative','cautious','cautious'],
  detail_obsessed:       ['positive','cautious','positive','positive','cautious','positive','cautious','positive','positive','cautious','positive','positive'],
  collaborative:         ['positive','positive','positive','cautious','positive','positive','positive','cautious','positive','positive','positive','positive'],
  overachiever:          ['positive','positive','positive','positive','negative','cautious','positive','positive','positive','negative','cautious','positive'],
  burned_out:            ['cautious','negative','negative','cautious','negative','negative','cautious','negative','negative','cautious','negative','negative'],
  skeptical:             ['negative','cautious','cautious','negative','cautious','positive','cautious','negative','cautious','cautious','positive','cautious'],
}

const STATUS_LINES: Record<Mood, string[]> = {
  positive: [
    'Making steady progress — no blockers on my side.',
    'Ahead of where I expected to be this week.',
    'Good momentum. Happy to help others if needed.',
    'On track. My tickets are moving.',
  ],
  cautious: [
    'Progressing, but slower than I hoped.',
    'Some uncertainty in my tickets — may need a second opinion.',
    'On track for now, but the next piece looks tricky.',
    'Managing, though the scope feels bigger than estimated.',
  ],
  negative: [
    'Struggling this week. Falling behind on my tickets.',
    'Frustrated — I keep hitting walls.',
    'Not in a good place with my current work.',
    'I need help. This is not going well.',
  ],
}

// First-person comments for blocked tickets, flavored by personality
const BLOCKED_COMMENTS: Record<Personality, string> = {
  confident_opinionated: "I'm blocked, and honestly I think the approach we agreed on is the problem. Can we revisit it?",
  enthusiastic_blocked:  "I was so close on this one, but I'm stuck waiting on something outside my control. What should I do in the meantime?",
  quiet_stressed:        "…I've been stuck on this for a while. I didn't want to bother anyone, but I can't move forward.",
  detail_obsessed:       "Blocked: the spec is ambiguous in two places and I won't guess. I need a decision before I continue.",
  collaborative:         "I'm blocked on this — can we pair on it? I think together we'd get through it quickly.",
  overachiever:          "This is blocked and it's killing my velocity. I've already tried three workarounds. I need a call made.",
  burned_out:            "I've been staring at this for two days. I need someone to take a look — or honestly, a break.",
  skeptical:             "Blocked. This is exactly the risk I flagged at planning. So — how do we want to handle it?",
}

// ── Public API ───────────────────────────────────────────────────────────────

export function sprintForWeek(weekNumber: number): number {
  return Math.max(1, Math.min(6, Math.ceil((weekNumber - 1) / 2)))
}

/** Weeks covered by a sprint: sprint 1 = weeks 2–3, sprint 2 = weeks 4–5, … */
export function sprintWeekRange(sprint: number): [number, number] {
  return [sprint * 2, sprint * 2 + 1]
}

export function memberMood(member: TeamMember, weekNumber: number): Mood {
  const arc = MOOD_ARCS[member.personality]
  if (!arc) return 'cautious'
  const phase = Math.max(0, Math.min(11, weekNumber - 2))
  return arc[phase]
}

export function memberStatusLine(member: TeamMember, weekNumber: number, studentId: string): string {
  const mood = memberMood(member, weekNumber)
  const lines = STATUS_LINES[mood]
  const pick = Math.floor(seededRandom(`${studentId}:${member.name}:${weekNumber}`, 3) * lines.length)
  return lines[pick]
}

export interface MemberWeekState {
  member: TeamMember
  mood: Mood
  statusLine: string
}

export function weeklyTeamState(team: TeamMember[], weekNumber: number, studentId: string): MemberWeekState[] {
  return team.map(member => ({
    member,
    mood: memberMood(member, weekNumber),
    statusLine: memberStatusLine(member, weekNumber, studentId),
  }))
}

export interface SimTicket {
  id: string
  ticket_id: string
  title: string
  status: string
  assignee_name: string
  is_blocked: boolean
}

export interface TicketTarget {
  id: string
  targetStatus: 'todo' | 'in_progress' | 'done'
  isBlocked: boolean
  comment: string | null
}

/**
 * Deterministic progression targets for the current week.
 * Week 1 of a sprint: ~25% done, ~35% more in progress.
 * Week 2 of a sprint: ~60% done, ~30% more in progress.
 * Monotonic: callers must only apply a target if it's AHEAD of the stored status.
 * Blocked: members whose mood is negative this week block their first not-done ticket.
 */
export function ticketTargetsForWeek(
  tickets: SimTicket[],
  team: TeamMember[],
  weekNumber: number,
  studentId: string
): TicketTarget[] {
  const sprint = sprintForWeek(weekNumber)
  const [sprintStart] = sprintWeekRange(sprint)
  const weekInSprint = weekNumber <= sprintStart ? 1 : 2

  // Deterministic shuffle, stable per (student, sprint)
  const shuffled = [...tickets].sort((a, b) => {
    const ra = seededRandom(`${studentId}:s${sprint}:${a.ticket_id}`, 7)
    const rb = seededRandom(`${studentId}:s${sprint}:${b.ticket_id}`, 7)
    return ra - rb
  })

  const n = shuffled.length
  const doneCount = Math.round(n * (weekInSprint === 1 ? 0.25 : 0.6))
  const inProgressCount = Math.round(n * (weekInSprint === 1 ? 0.35 : 0.3))

  const targets = new Map<string, TicketTarget>()
  shuffled.forEach((t, i) => {
    const targetStatus = i < doneCount ? 'done' : i < doneCount + inProgressCount ? 'in_progress' : 'todo'
    targets.set(t.id, { id: t.id, targetStatus, isBlocked: false, comment: null })
  })

  // Blocked tickets: negative-mood members block their first non-done ticket
  const negativeMembers = team.filter(m => memberMood(m, weekNumber) === 'negative')
  for (const member of negativeMembers) {
    const candidate = shuffled.find(t => {
      const target = targets.get(t.id)!
      const effectiveRank = Math.max(STATUS_RANK[t.status] ?? 0, STATUS_RANK[target.targetStatus])
      // Tickets may store first name or full name depending on seeding era
      const isTheirs = t.assignee_name === member.firstName || t.assignee_name === member.name
      return isTheirs && effectiveRank < 2
    })
    if (candidate) {
      const target = targets.get(candidate.id)!
      target.isBlocked = true
      target.comment = BLOCKED_COMMENTS[member.personality] ?? null
      // A blocked ticket can't be done; hold it at in_progress at most
      if (target.targetStatus === 'done') target.targetStatus = 'in_progress'
    }
  }

  return tickets.map(t => targets.get(t.id)!)
}

/** Changes the caller should persist: only advances, never reverts. */
export function ticketUpdatesToApply(
  tickets: SimTicket[],
  targets: TicketTarget[]
): { id: string; status?: string; is_blocked?: boolean }[] {
  const byId = new Map(targets.map(t => [t.id, t]))
  const updates: { id: string; status?: string; is_blocked?: boolean }[] = []
  for (const t of tickets) {
    const target = byId.get(t.id)
    if (!target) continue
    const update: { id: string; status?: string; is_blocked?: boolean } = { id: t.id }
    const currentRank = STATUS_RANK[t.status] ?? 0
    const targetRank = STATUS_RANK[target.targetStatus]
    if (targetRank > currentRank) update.status = target.targetStatus
    const blocked = target.isBlocked && (STATUS_RANK[update.status ?? t.status] ?? 0) < 2
    if (blocked !== t.is_blocked) update.is_blocked = blocked
    if (update.status !== undefined || update.is_blocked !== undefined) updates.push(update)
  }
  return updates
}

// ── Scripted board question ──────────────────────────────────────────────────
// Deterministic Scrum Master question computed from the student's real board.
// Rule cascade keyed to sprint phase and board health; numbers come from the
// actual tickets so the question always matches what the student sees.

export interface BoardQuestionInput {
  tickets: (SimTicket & { story_points?: number })[]
  weekNumber: number
}

export function boardQuestion({ tickets, weekNumber }: BoardQuestionInput): string | null {
  if (tickets.length === 0) return null

  const sprint = sprintForWeek(weekNumber)
  const [sprintStart] = sprintWeekRange(sprint)
  const weekInSprint = weekNumber <= sprintStart ? 1 : 2

  const total = tickets.length
  const done = tickets.filter(t => t.status === 'done').length
  const blocked = tickets.filter(t => t.is_blocked && t.status !== 'done').length
  const pointsTotal = tickets.reduce((s, t) => s + (t.story_points ?? 1), 0)
  const pointsDone = tickets.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points ?? 1), 0)
  const doneFrac = done / total

  if (weekInSprint === 2 && doneFrac < 0.5) {
    return `Sprint ${sprint} ends this week and the board shows ${done}/${total} tickets done (${pointsDone}/${pointsTotal} story points). As Scrum Master, do you descope, renegotiate the sprint goal, or push the team? Justify your call using velocity — and say what you'll tell the stakeholders.`
  }
  if (blocked >= 2) {
    return `There are ${blocked} blocked tickets on the Sprint ${sprint} board right now. Blockers are the Scrum Master's first responsibility: in what order do you attack them, and what exactly do you do to unblock each one?`
  }
  if (doneFrac >= 0.75) {
    return `The team is ahead: ${done}/${total} tickets done in Sprint ${sprint} with ${weekInSprint === 1 ? 'a full week' : 'days'} remaining. Do you pull an item in from the product backlog, or use the slack another way? What are the risks of each choice?`
  }
  if (weekInSprint === 1) {
    return `Sprint ${sprint} just started: ${done}/${total} tickets done, ${pointsTotal} story points committed. Which tickets should the team focus on first, and how will you know mid-sprint whether you're on track for the sprint goal?`
  }
  return `Sprint ${sprint} is at ${done}/${total} tickets (${pointsDone}/${pointsTotal} points) heading into its final week. What does the burndown tell you, and what one change would most improve the team's chances of finishing?`
}

// ── Burndown ─────────────────────────────────────────────────────────────────

export interface BurndownData {
  sprint: number
  weekInSprint: 1 | 2
  totalPoints: number
  remainingPoints: number
  /** Where a perfectly on-track team would be right now */
  idealRemaining: number
}

export function burndownForWeek(
  tickets: (SimTicket & { story_points?: number })[],
  weekNumber: number
): BurndownData {
  const sprint = sprintForWeek(weekNumber)
  const [sprintStart] = sprintWeekRange(sprint)
  const weekInSprint: 1 | 2 = weekNumber <= sprintStart ? 1 : 2
  const totalPoints = tickets.reduce((s, t) => s + (t.story_points ?? 1), 0)
  const remainingPoints = tickets
    .filter(t => t.status !== 'done')
    .reduce((s, t) => s + (t.story_points ?? 1), 0)
  const idealRemaining = Math.round(totalPoints * (weekInSprint === 1 ? 0.5 : 0))
  return { sprint, weekInSprint, totalPoints, remainingPoints, idealRemaining }
}
