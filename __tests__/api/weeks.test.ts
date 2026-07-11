/**
 * Unit tests for the weeks API route logic.
 * We test the pure logic (SUBMISSION_WEEKS set, sprint derivation)
 * without hitting the database.
 */

// The SUBMISSION_WEEKS set used by the API and sprint board
const SUBMISSION_WEEKS = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])

// Sprint number derivation used by SprintBoard and student dashboard
function sprintFromWeek(weekNumber: number): number {
  return Math.max(1, Math.min(6, Math.ceil((weekNumber - 1) / 2)))
}

describe('SUBMISSION_WEEKS', () => {
  it('includes weeks 2 through 13', () => {
    for (let w = 2; w <= 13; w++) {
      expect(SUBMISSION_WEEKS.has(w)).toBe(true)
    }
  })

  it('excludes week 1 (intro, no submission)', () => {
    expect(SUBMISSION_WEEKS.has(1)).toBe(false)
  })

  it('excludes weeks 14 and 15 (finals, no submission)', () => {
    expect(SUBMISSION_WEEKS.has(14)).toBe(false)
    expect(SUBMISSION_WEEKS.has(15)).toBe(false)
  })

  it('contains exactly 12 weeks', () => {
    expect(SUBMISSION_WEEKS.size).toBe(12)
  })
})

describe('sprint number derivation', () => {
  it('weeks 2–3 map to sprint 1', () => {
    expect(sprintFromWeek(2)).toBe(1)
    expect(sprintFromWeek(3)).toBe(1)
  })

  it('weeks 4–5 map to sprint 2', () => {
    expect(sprintFromWeek(4)).toBe(2)
    expect(sprintFromWeek(5)).toBe(2)
  })

  it('weeks 6–7 map to sprint 3', () => {
    expect(sprintFromWeek(6)).toBe(3)
    expect(sprintFromWeek(7)).toBe(3)
  })

  it('weeks 8–9 map to sprint 4', () => {
    expect(sprintFromWeek(8)).toBe(4)
    expect(sprintFromWeek(9)).toBe(4)
  })

  it('weeks 10–11 map to sprint 5', () => {
    expect(sprintFromWeek(10)).toBe(5)
    expect(sprintFromWeek(11)).toBe(5)
  })

  it('weeks 12–13 map to sprint 6', () => {
    expect(sprintFromWeek(12)).toBe(6)
    expect(sprintFromWeek(13)).toBe(6)
  })

  it('clamps below minimum to sprint 1', () => {
    expect(sprintFromWeek(1)).toBe(1)
  })

  it('clamps above maximum to sprint 6', () => {
    expect(sprintFromWeek(14)).toBe(6)
    expect(sprintFromWeek(15)).toBe(6)
  })

  it('produces exactly 6 unique sprint numbers across weeks 2–13', () => {
    const sprints = new Set(
      Array.from({ length: 12 }, (_, i) => sprintFromWeek(i + 2))
    )
    expect(sprints.size).toBe(6)
  })
})
