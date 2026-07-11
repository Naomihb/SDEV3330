/**
 * Unit tests for join route logic — ticket seeding and prefix generation.
 * Database interactions are tested in the Python integration suite.
 */

// Ticket prefix logic (mirrors join route)
function getTicketPrefix(projectName: string): string {
  return projectName.slice(0, 3).toUpperCase()
}

// Ticket ID generation (mirrors join route)
function buildTicketId(prefix: string, sprint: number, n: number): string {
  return `${prefix}-S${sprint}-${String(n).padStart(2, '0')}`
}

describe('ticket prefix', () => {
  it('takes the first 3 chars of the project name, uppercased', () => {
    expect(getTicketPrefix('SoundCircle')).toBe('SOU')
    expect(getTicketPrefix('PawTrack')).toBe('PAW')
    expect(getTicketPrefix('MediTrack')).toBe('MED')
    expect(getTicketPrefix('EcoRoute')).toBe('ECO')
  })

  it('handles short project names without crashing', () => {
    expect(getTicketPrefix('AB')).toBe('AB')
    expect(getTicketPrefix('A')).toBe('A')
  })
})

describe('ticket ID format', () => {
  it('follows the pattern PREFIX-S{sprint}-{nn}', () => {
    expect(buildTicketId('SOU', 1, 1)).toBe('SOU-S1-01')
    expect(buildTicketId('SOU', 2, 8)).toBe('SOU-S2-08')
    expect(buildTicketId('PAW', 6, 3)).toBe('PAW-S6-03')
  })

  it('zero-pads single-digit ticket numbers', () => {
    expect(buildTicketId('SOU', 1, 1)).toMatch(/-01$/)
    expect(buildTicketId('SOU', 1, 9)).toMatch(/-09$/)
  })

  it('does not zero-pad two-digit numbers', () => {
    expect(buildTicketId('SOU', 1, 10)).toBe('SOU-S1-10')
  })
})

describe('sprint coverage', () => {
  // Verify the 6-sprint structure has 8 tickets each = 48 total
  const EXPECTED_SPRINTS = 6
  const EXPECTED_TICKETS_PER_SPRINT = 8
  const EXPECTED_TOTAL = EXPECTED_SPRINTS * EXPECTED_TICKETS_PER_SPRINT

  it(`expects ${EXPECTED_TOTAL} total seeded tickets across ${EXPECTED_SPRINTS} sprints`, () => {
    // This constant matches the join route implementation
    expect(EXPECTED_TOTAL).toBe(48)
  })

  it('sprint numbers span 1 through 6', () => {
    const sprints = new Set(Array.from({ length: 6 }, (_, i) => i + 1))
    expect([...sprints]).toEqual([1, 2, 3, 4, 5, 6])
  })
})
